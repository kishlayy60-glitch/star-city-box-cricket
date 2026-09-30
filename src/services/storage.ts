import { Player, Team, MatchFixture, AuctionState, BidRecord } from '../types/cricket';
import { INITIAL_PLAYERS, INITIAL_TEAMS, INITIAL_FIXTURES, INITIAL_AUCTION_STATE } from '../data/initialData';
import { soundService } from './audio';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';

const STORAGE_KEYS = {
  PLAYERS: 'STAR_CITY_PLAYERS_V3',
  TEAMS: 'STAR_CITY_TEAMS_V3',
  FIXTURES: 'STAR_CITY_FIXTURES_V3',
  AUCTION: 'STAR_CITY_AUCTION_V3',
  ADMIN_PASS: 'STAR_CITY_ADMIN_PASS_SECURE',
  ADMIN_LOCKOUT: 'STAR_CITY_ADMIN_LOCKOUT_SECURE',
};

// Firestore does not allow `undefined` field values. Clean helper strips undefined fields.
function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: any = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = cleanForFirestore(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => (typeof item === 'object' && item !== null ? cleanForFirestore(item) : item));
    } else {
      result[key] = value;
    }
  }
  return result;
}

type SyncEvent = 
  | { type: 'BID_PLACED'; bid: BidRecord; auctionState: AuctionState }
  | { type: 'PLAYER_SOLD'; playerId: string; teamId: string; amount: number; auctionState: AuctionState }
  | { type: 'PLAYER_UNSOLD'; playerId: string; auctionState: AuctionState }
  | { type: 'PLAYER_SELECTED'; playerId: string; auctionState: AuctionState }
  | { type: 'TIMER_UPDATE'; seconds: number; phase: AuctionState['auctionPhase'] }
  | { type: 'STATE_CHANGED' };

type SyncListener = (event: SyncEvent) => void;

class RealtimeStorageService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SyncListener> = new Set();
  private isFirebaseConnected = false;
  private playersCache: Player[] = [];
  private teamsCache: Team[] = [];
  private fixturesCache: MatchFixture[] = [];
  private auctionStateCache: AuctionState = INITIAL_AUCTION_STATE;

  constructor() {
    // 1. Initial fallback load from local storage
    this.loadFromLocalStorage();

    // 2. Setup broadcast channel for cross-tab speed
    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('STAR_CITY_CRICKET_BC');
        this.channel.onmessage = (msg) => {
          this.notifyListeners(msg.data);
        };
      } catch {
        // BroadcastChannel unavailable
      }

      window.addEventListener('storage', (e) => {
        if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
          this.loadFromLocalStorage();
          this.notifyListeners({ type: 'STATE_CHANGED' });
        }
      });
    }

    // 3. Setup real-time cloud Firestore listeners
    this.initFirestoreSync();
  }

  private loadFromLocalStorage() {
    try {
      const p = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      this.playersCache = p ? JSON.parse(p) : INITIAL_PLAYERS;
    } catch {
      this.playersCache = INITIAL_PLAYERS;
    }

    try {
      const t = localStorage.getItem(STORAGE_KEYS.TEAMS);
      const parsed = t ? JSON.parse(t) : null;
      if (parsed && Array.isArray(parsed) && parsed.length === 4 && parsed[0]?.captainPhoto) {
        this.teamsCache = parsed;
      } else {
        this.teamsCache = INITIAL_TEAMS;
      }
    } catch {
      this.teamsCache = INITIAL_TEAMS;
    }

    try {
      const f = localStorage.getItem(STORAGE_KEYS.FIXTURES);
      this.fixturesCache = f ? JSON.parse(f) : INITIAL_FIXTURES;
    } catch {
      this.fixturesCache = INITIAL_FIXTURES;
    }

    try {
      const a = localStorage.getItem(STORAGE_KEYS.AUCTION);
      this.auctionStateCache = a ? JSON.parse(a) : INITIAL_AUCTION_STATE;
    } catch {
      this.auctionStateCache = INITIAL_AUCTION_STATE;
    }
  }

  private async initFirestoreSync() {
    if (typeof window === 'undefined') return;

    try {
      // 1. Listen to PLAYERS collection in Firestore
      onSnapshot(collection(db, 'players'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Player[] = [];
          snapshot.forEach((d) => list.push(d.data() as Player));
          this.playersCache = list;
          localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(list));
          this.notifyListeners({ type: 'STATE_CHANGED' });
        } else {
          // Seed Firestore with initial players
          this.seedInitialPlayers();
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'players');
      });

      // 2. Listen to TEAMS collection in Firestore
      onSnapshot(collection(db, 'teams'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Team[] = [];
          snapshot.forEach((d) => list.push(d.data() as Team));
          this.teamsCache = list;
          localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(list));
          this.notifyListeners({ type: 'STATE_CHANGED' });
        } else {
          // Seed Firestore with initial 4 teams
          this.seedInitialTeams();
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'teams');
      });

      // 3. Listen to FIXTURES collection in Firestore
      onSnapshot(collection(db, 'fixtures'), (snapshot) => {
        if (!snapshot.empty) {
          const list: MatchFixture[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as MatchFixture);
          });
          list.sort((a, b) => a.matchNumber - b.matchNumber);
          this.fixturesCache = list;
          localStorage.setItem(STORAGE_KEYS.FIXTURES, JSON.stringify(list));
          this.notifyListeners({ type: 'STATE_CHANGED' });
        } else {
          this.seedInitialFixtures();
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'fixtures');
      });

      // 4. Listen to AUCTION STATE doc in Firestore
      onSnapshot(doc(db, 'auction', 'state'), (snapshot) => {
        if (snapshot.exists()) {
          const cloudState = snapshot.data() as AuctionState;
          this.auctionStateCache = cloudState;
          localStorage.setItem(STORAGE_KEYS.AUCTION, JSON.stringify(cloudState));
          this.notifyListeners({ type: 'STATE_CHANGED' });
        } else {
          this.seedInitialAuction();
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'auction/state');
      });

      this.isFirebaseConnected = true;
    } catch (err) {
      console.warn('Firestore real-time sync setup warning:', err);
    }
  }

  private async seedInitialPlayers() {
    try {
      const batch = writeBatch(db);
      for (const p of INITIAL_PLAYERS) {
        batch.set(doc(db, 'players', p.id), cleanForFirestore(p));
      }
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'players');
    }
  }

  private async seedInitialTeams() {
    try {
      const batch = writeBatch(db);
      for (const t of INITIAL_TEAMS) {
        batch.set(doc(db, 'teams', t.id), cleanForFirestore(t));
      }
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'teams');
    }
  }

  private async seedInitialFixtures() {
    try {
      const batch = writeBatch(db);
      for (const f of INITIAL_FIXTURES) {
        batch.set(doc(db, 'fixtures', f.id), cleanForFirestore(f));
      }
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'fixtures');
    }
  }

  private async seedInitialAuction() {
    try {
      await setDoc(doc(db, 'auction', 'state'), cleanForFirestore(INITIAL_AUCTION_STATE));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'auction/state');
    }
  }

  subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: SyncEvent) {
    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error('Error in listener', err);
      }
    });
  }

  private broadcast(event: SyncEvent) {
    this.notifyListeners(event);
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch {
        // channel error
      }
    }
  }

  // PLAYERS
  getPlayers(): Player[] {
    return this.playersCache.length > 0 ? this.playersCache : INITIAL_PLAYERS;
  }

  async savePlayers(players: Player[]) {
    this.playersCache = players;
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    this.broadcast({ type: 'STATE_CHANGED' });

    try {
      // Sync batch to Firestore
      const batch = writeBatch(db);
      for (const p of players) {
        batch.set(doc(db, 'players', p.id), cleanForFirestore(p));
      }
      await batch.commit();
    } catch (e) {
      console.warn('Cloud sync error for players:', e);
    }
  }

  async addPlayer(player: Player) {
    const list = [player, ...this.getPlayers().filter((p) => p.id !== player.id)];
    this.playersCache = list;
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(list));
    this.broadcast({ type: 'STATE_CHANGED' });

    try {
      await setDoc(doc(db, 'players', player.id), cleanForFirestore(player));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `players/${player.id}`);
    }
  }

  async updatePlayer(updated: Player) {
    const list = this.getPlayers().map((p) => (p.id === updated.id ? updated : p));
    this.playersCache = list;
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(list));
    this.broadcast({ type: 'STATE_CHANGED' });

    try {
      await setDoc(doc(db, 'players', updated.id), cleanForFirestore(updated));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `players/${updated.id}`);
    }
  }

  // TEAMS
  getTeams(): Team[] {
    return this.teamsCache.length > 0 ? this.teamsCache : INITIAL_TEAMS;
  }

  async saveTeams(teams: Team[]) {
    this.teamsCache = teams;
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    this.broadcast({ type: 'STATE_CHANGED' });

    try {
      const batch = writeBatch(db);
      for (const t of teams) {
        batch.set(doc(db, 'teams', t.id), cleanForFirestore(t));
      }
      await batch.commit();
    } catch (e) {
      console.warn('Cloud sync error for teams:', e);
    }
  }

  async updateTeam(updated: Team) {
    const list = this.getTeams().map((t) => (t.id === updated.id ? updated : t));
    this.teamsCache = list;
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(list));
    this.broadcast({ type: 'STATE_CHANGED' });

    try {
      await setDoc(doc(db, 'teams', updated.id), cleanForFirestore(updated));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `teams/${updated.id}`);
    }
  }

  async addTeam(newTeam: Team) {
    const list = [...this.getTeams(), newTeam];
    this.teamsCache = list;
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(list));
    this.broadcast({ type: 'STATE_CHANGED' });

    try {
      await setDoc(doc(db, 'teams', newTeam.id), cleanForFirestore(newTeam));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `teams/${newTeam.id}`);
    }
  }

  async deleteTeam(teamId: string) {
    const list = this.getTeams().filter((t) => t.id !== teamId);
    this.teamsCache = list;
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(list));
    this.broadcast({ type: 'STATE_CHANGED' });

    try {
      await deleteDoc(doc(db, 'teams', teamId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `teams/${teamId}`);
    }
  }

  // FIXTURES
  getFixtures(): MatchFixture[] {
    return this.fixturesCache.length > 0 ? this.fixturesCache : INITIAL_FIXTURES;
  }

  async saveFixtures(fixtures: MatchFixture[]) {
    this.fixturesCache = fixtures;
    localStorage.setItem(STORAGE_KEYS.FIXTURES, JSON.stringify(fixtures));
    this.broadcast({ type: 'STATE_CHANGED' });

    try {
      const batch = writeBatch(db);
      for (const f of fixtures) {
        batch.set(doc(db, 'fixtures', f.id), cleanForFirestore(f));
      }
      await batch.commit();
    } catch (e) {
      console.warn('Cloud sync error for fixtures:', e);
    }
  }

  // AUCTION STATE
  getAuctionState(): AuctionState {
    return this.auctionStateCache || INITIAL_AUCTION_STATE;
  }

  async saveAuctionState(state: AuctionState) {
    this.auctionStateCache = state;
    localStorage.setItem(STORAGE_KEYS.AUCTION, JSON.stringify(state));

    try {
      await setDoc(doc(db, 'auction', 'state'), cleanForFirestore(state));
    } catch (e) {
      // Background sync
    }
  }

  // ACTION: Select player to go to live stage
  async selectPlayerForAuction(playerId: string) {
    const players = this.getPlayers();
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    // mark previous active player back if needed
    const updatedPlayers = players.map((p) => {
      if (p.id === playerId) {
        return { ...p, status: 'in_auction' as const };
      }
      if (p.status === 'in_auction') {
        return { ...p, status: 'verified' as const };
      }
      return p;
    });

    const newState: AuctionState = {
      isActive: true,
      isPaused: false,
      currentPlayerId: playerId,
      currentBid: player.basePrice || 1000,
      currentLeadingTeamId: null,
      currentLeadingTeamName: null,
      timerSeconds: 30,
      auctionPhase: 'BIDDING',
      bidsLog: [],
      lastUpdate: Date.now(),
    };

    this.playersCache = updatedPlayers;
    this.auctionStateCache = newState;
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(updatedPlayers));
    localStorage.setItem(STORAGE_KEYS.AUCTION, JSON.stringify(newState));

    this.broadcast({ type: 'PLAYER_SELECTED', playerId, auctionState: newState });
    soundService.playBidSound();

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'players', playerId), cleanForFirestore({ ...player, status: 'in_auction' }));
      batch.set(doc(db, 'auction', 'state'), cleanForFirestore(newState));
      await batch.commit();
    } catch (e) {
      console.warn('Error in selectPlayerForAuction Firestore sync:', e);
    }
  }

  // ACTION: Submit a live bid by team captain or admin
  async placeBid(teamId: string, amount: number): Promise<BidRecord> {
    const state = this.getAuctionState();
    if (!state.isActive || !state.currentPlayerId) {
      throw new Error('No active player on auction stage');
    }

    const teams = this.getTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    if (amount > team.remainingPurse) {
      throw new Error(`Insufficient purse balance. Available: ₹${team.remainingPurse.toLocaleString()}`);
    }

    if (amount <= state.currentBid && state.currentLeadingTeamId !== null) {
      throw new Error(`Bid must be higher than current bid of ₹${state.currentBid.toLocaleString()}`);
    }

    const newBid: BidRecord = {
      id: 'bid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      playerId: state.currentPlayerId,
      teamId: team.id,
      teamName: team.name,
      amount: amount,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    const updatedState: AuctionState = {
      ...state,
      currentBid: amount,
      currentLeadingTeamId: team.id,
      currentLeadingTeamName: team.name,
      timerSeconds: 20, // Reset timer on each valid bid
      auctionPhase: 'BIDDING',
      bidsLog: [newBid, ...state.bidsLog.slice(0, 19)],
      lastUpdate: Date.now(),
    };

    // Update in-memory
    this.auctionStateCache = updatedState;
    localStorage.setItem(STORAGE_KEYS.AUCTION, JSON.stringify(updatedState));

    // Also update player's bid history
    const currentPlayer = this.getPlayers().find((p) => p.id === state.currentPlayerId);
    let updatedPlayer: Player | null = null;
    if (currentPlayer) {
      updatedPlayer = {
        ...currentPlayer,
        bidHistory: [newBid, ...(currentPlayer.bidHistory || [])],
      };
      this.playersCache = this.getPlayers().map((p) => (p.id === updatedPlayer!.id ? updatedPlayer! : p));
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(this.playersCache));
    }

    soundService.playBidSound();
    this.broadcast({ type: 'BID_PLACED', bid: newBid, auctionState: updatedState });

    // Write to Firestore in background
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'bids', newBid.id), cleanForFirestore(newBid));
      batch.set(doc(db, 'auction', 'state'), cleanForFirestore(updatedState));
      if (updatedPlayer) {
        batch.set(doc(db, 'players', updatedPlayer.id), cleanForFirestore(updatedPlayer));
      }
      await batch.commit();
    } catch (e) {
      console.warn('Firestore placeBid error:', e);
    }

    return newBid;
  }

  // ACTION: Hammer SOLD
  async hammerSold(playerId: string, teamId: string, amount: number) {
    const players = this.getPlayers();
    const teams = this.getTeams();
    const player = players.find((p) => p.id === playerId);
    const team = teams.find((t) => t.id === teamId);

    if (!player || !team) {
      throw new Error('Player or Team not found');
    }

    // Update Player
    const updatedPlayer: Player = {
      ...player,
      status: 'sold',
      soldPrice: amount,
      soldToTeamId: team.id,
      soldToTeamName: team.name,
    };
    const updatedPlayers = players.map((p) => (p.id === playerId ? updatedPlayer : p));

    // Update Team Purse & Squad
    const currentPlayers = team.players || [];
    const updatedTeam: Team = {
      ...team,
      remainingPurse: Math.max(0, team.remainingPurse - amount),
      playersCount: currentPlayers.includes(playerId) ? team.playersCount : team.playersCount + 1,
      players: currentPlayers.includes(playerId) ? currentPlayers : [...currentPlayers, playerId],
    };
    const updatedTeams = teams.map((t) => (t.id === teamId ? updatedTeam : t));

    const state = this.getAuctionState();
    const updatedState: AuctionState = {
      ...state,
      auctionPhase: 'SOLD',
      isActive: false,
      timerSeconds: 0,
      lastUpdate: Date.now(),
    };

    // In-memory update
    this.playersCache = updatedPlayers;
    this.teamsCache = updatedTeams;
    this.auctionStateCache = updatedState;
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(updatedPlayers));
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updatedTeams));
    localStorage.setItem(STORAGE_KEYS.AUCTION, JSON.stringify(updatedState));

    soundService.playHammerSound();
    soundService.playSuccessSound();
    this.broadcast({ type: 'PLAYER_SOLD', playerId, teamId, amount, auctionState: updatedState });

    // Sync to Firestore
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'players', playerId), cleanForFirestore(updatedPlayer));
      batch.set(doc(db, 'teams', teamId), cleanForFirestore(updatedTeam));
      batch.set(doc(db, 'auction', 'state'), cleanForFirestore(updatedState));
      await batch.commit();
    } catch (e) {
      console.warn('Firestore hammerSold error:', e);
    }
  }

  // ACTION: Hammer UNSOLD
  async hammerUnsold(playerId: string) {
    const players = this.getPlayers();
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    const updatedPlayer: Player = {
      ...player,
      status: 'unsold',
      soldPrice: undefined,
      soldToTeamId: undefined,
      soldToTeamName: undefined,
    };
    const updatedPlayers = players.map((p) => (p.id === playerId ? updatedPlayer : p));

    const state = this.getAuctionState();
    const updatedState: AuctionState = {
      ...state,
      auctionPhase: 'UNSOLD',
      isActive: false,
      timerSeconds: 0,
      lastUpdate: Date.now(),
    };

    this.playersCache = updatedPlayers;
    this.auctionStateCache = updatedState;
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(updatedPlayers));
    localStorage.setItem(STORAGE_KEYS.AUCTION, JSON.stringify(updatedState));

    soundService.playHammerSound();
    this.broadcast({ type: 'PLAYER_UNSOLD', playerId, auctionState: updatedState });

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'players', playerId), cleanForFirestore(updatedPlayer));
      batch.set(doc(db, 'auction', 'state'), cleanForFirestore(updatedState));
      await batch.commit();
    } catch (e) {
      console.warn('Firestore hammerUnsold error:', e);
    }
  }

  // ACTION: Set Phase (GOING ONCE, GOING TWICE)
  async setAuctionPhase(phase: AuctionState['auctionPhase'], timer?: number) {
    const state = this.getAuctionState();
    const updated: AuctionState = {
      ...state,
      auctionPhase: phase,
      timerSeconds: timer !== undefined ? timer : state.timerSeconds,
      lastUpdate: Date.now(),
    };
    this.auctionStateCache = updated;
    localStorage.setItem(STORAGE_KEYS.AUCTION, JSON.stringify(updated));
    this.broadcast({ type: 'TIMER_UPDATE', seconds: updated.timerSeconds, phase: updated.auctionPhase });
    soundService.playTick();

    try {
      await setDoc(doc(db, 'auction', 'state'), cleanForFirestore(updated));
    } catch {
      // background sync
    }
  }

  // Reset to initial test dataset
  async resetAllData() {
    this.playersCache = INITIAL_PLAYERS;
    this.teamsCache = INITIAL_TEAMS;
    this.fixturesCache = INITIAL_FIXTURES;
    this.auctionStateCache = INITIAL_AUCTION_STATE;

    localStorage.removeItem(STORAGE_KEYS.PLAYERS);
    localStorage.removeItem(STORAGE_KEYS.TEAMS);
    localStorage.removeItem(STORAGE_KEYS.FIXTURES);
    localStorage.removeItem(STORAGE_KEYS.AUCTION);

    this.broadcast({ type: 'STATE_CHANGED' });

    try {
      await this.seedInitialPlayers();
      await this.seedInitialTeams();
      await this.seedInitialFixtures();
      await this.seedInitialAuction();
    } catch (e) {
      console.warn('Reset error in firestore:', e);
    }
  }

  // COMPLETE DATABASE EXPORT (JSON BACKUP)
  exportDatabase(): string {
    const backup = {
      version: '3.0',
      cloudDatabase: 'Firestore (empyrean-intelligence-pds98)',
      exportedAt: new Date().toISOString(),
      league: 'STAR CITY BOX CRICKET LEAGUE 2026-27',
      players: this.getPlayers(),
      teams: this.getTeams(),
      fixtures: this.getFixtures(),
      auctionState: this.getAuctionState(),
    };
    return JSON.stringify(backup, null, 2);
  }

  // COMPLETE DATABASE RESTORE (JSON IMPORT)
  async importDatabase(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.players) && Array.isArray(data.teams)) {
        await this.savePlayers(data.players);
        await this.saveTeams(data.teams);
        if (Array.isArray(data.fixtures)) await this.saveFixtures(data.fixtures);
        if (data.auctionState) await this.saveAuctionState(data.auctionState);
        this.broadcast({ type: 'STATE_CHANGED' });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ADMIN SECURITY & LOCKOUT
  getAdminPassword(): string {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PASS) || 'star@2026#admin';
  }

  setAdminPassword(newPassword: string) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASS, newPassword);
  }

  getLockoutStatus(): { isLocked: boolean; remainingSeconds: number; attempts: number } {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_LOCKOUT);
      if (!raw) return { isLocked: false, remainingSeconds: 0, attempts: 0 };
      const parsed = JSON.parse(raw);
      const now = Date.now();
      if (parsed.lockedUntil && parsed.lockedUntil > now) {
        return {
          isLocked: true,
          remainingSeconds: Math.ceil((parsed.lockedUntil - now) / 1000),
          attempts: parsed.attempts || 3,
        };
      }
      return { isLocked: false, remainingSeconds: 0, attempts: parsed.attempts || 0 };
    } catch {
      return { isLocked: false, remainingSeconds: 0, attempts: 0 };
    }
  }

  recordFailedAttempt(): { isLocked: boolean; remainingSeconds: number; attempts: number } {
    const status = this.getLockoutStatus();
    const newAttempts = status.attempts + 1;
    const now = Date.now();

    if (newAttempts >= 3) {
      // Lock for 10 minutes (600 seconds)
      const lockedUntil = now + 10 * 60 * 1000;
      localStorage.setItem(
        STORAGE_KEYS.ADMIN_LOCKOUT,
        JSON.stringify({ attempts: newAttempts, lockedUntil })
      );
      return { isLocked: true, remainingSeconds: 600, attempts: newAttempts };
    } else {
      localStorage.setItem(
        STORAGE_KEYS.ADMIN_LOCKOUT,
        JSON.stringify({ attempts: newAttempts, lockedUntil: 0 })
      );
      return { isLocked: false, remainingSeconds: 0, attempts: newAttempts };
    }
  }

  clearFailedAttempts() {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_LOCKOUT);
  }
}

export const realtimeStorage = new RealtimeStorageService();
