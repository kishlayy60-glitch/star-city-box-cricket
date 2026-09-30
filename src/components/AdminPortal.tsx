import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Gavel, Trophy, Calendar, Users, Edit3, Trash2, 
  Plus, CheckCircle2, Sparkles, RefreshCw, 
  FileText, Play, AlertTriangle, ShieldCheck, ArrowRight, Shield, Download, Upload, Lock, ExternalLink, Globe, Award
} from 'lucide-react';
import { AuctionState, MatchFixture, Player, PlayerGrade, Team } from '../types/cricket';
import { realtimeStorage } from '../services/storage';
import { soundService } from '../services/audio';

interface AdminPortalProps {
  players: Player[];
  teams: Team[];
  fixtures: MatchFixture[];
  auctionState: AuctionState;
  onOpenReport: () => void;
  onLogoutAdmin: () => void;
  onGoToLiveArena: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  players,
  teams,
  fixtures,
  auctionState,
  onOpenReport,
  onLogoutAdmin,
  onGoToLiveArena,
}) => {
  const [adminTab, setAdminTab] = useState<'auction' | 'teams' | 'players' | 'matches' | 'security' | 'vercel'>('auction');

  // Editing Player Stats Modal State
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editRuns, setEditRuns] = useState<number>(0);
  const [editWickets, setEditWickets] = useState<number>(0);
  const [editMatches, setEditMatches] = useState<number>(0);
  const [editStrikeRate, setEditStrikeRate] = useState<number>(0);
  const [editRating, setEditRating] = useState<number>(4);
  const [editIsStar, setEditIsStar] = useState<boolean>(false);
  const [editGrade, setEditGrade] = useState<PlayerGrade>('A');
  const [gradeFilter, setGradeFilter] = useState<'ALL' | PlayerGrade>('ALL');

  // Editing Team Modal State
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamShortName, setTeamShortName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhoto, setCaptainPhoto] = useState('');
  const [captainMobile, setCaptainMobile] = useState('');
  const [captainPin, setCaptainPin] = useState('');
  const [totalPurse, setTotalPurse] = useState(100000);

  // New Match Fixture State
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [newTeam1, setNewTeam1] = useState(teams[0]?.id || '');
  const [newTeam2, setNewTeam2] = useState(teams[1]?.id || '');
  const [newDate, setNewDate] = useState('2026-10-09');
  const [newTime, setNewTime] = useState('07:00 PM');
  const [newVenue, setNewVenue] = useState('Star City Box Arena, Pitch 1');
  const [newStage, setNewStage] = useState<MatchFixture['stage']>('League Match');

  // Security Manager State
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');
  const [securityError, setSecurityError] = useState('');

  // Database Backup State
  const [dbMessage, setDbMessage] = useState('');
  const dbFileInputRef = useRef<HTMLInputElement>(null);
  const captainPhotoInputRef = useRef<HTMLInputElement>(null);

  // Sold Override Confirmation
  const [selectedSoldTeam, setSelectedSoldTeam] = useState<string>(auctionState.currentLeadingTeamId || teams[0]?.id || '');

  const currentPlayer = players.find((p) => p.id === auctionState.currentPlayerId);

  // ACTION: Bring player to stage
  const handleCallPlayer = (playerId: string) => {
    realtimeStorage.selectPlayerForAuction(playerId);
  };

  // ACTION: Auction Controls
  const handleSoldHammer = () => {
    if (!auctionState.currentPlayerId) return;
    const winningTeamId = auctionState.currentLeadingTeamId || selectedSoldTeam;
    const finalAmount = auctionState.currentBid;

    if (!winningTeamId) {
      alert('Please select or verify the winning team.');
      return;
    }

    realtimeStorage.hammerSold(auctionState.currentPlayerId, winningTeamId, finalAmount);
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 }
    });
  };

  const handleUnsoldHammer = () => {
    if (!auctionState.currentPlayerId) return;
    realtimeStorage.hammerUnsold(auctionState.currentPlayerId);
  };

  const handleSetPhase = (phase: AuctionState['auctionPhase'], timer: number) => {
    realtimeStorage.setAuctionPhase(phase, timer);
  };

  // ACTION: Direct Player Grade Update (Admin Only)
  const handleUpdatePlayerGrade = (playerId: string, newGrade: PlayerGrade) => {
    const player = players.find((p) => p.id === playerId);
    if (player) {
      const updated = { ...player, grade: newGrade };
      realtimeStorage.updatePlayer(updated);
      soundService.playSuccessSound();
    }
  };

  // ACTION: Save Player Performance Stats
  const handleOpenEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setEditMatches(player.stats.matches || 0);
    setEditRuns(player.stats.runs || 0);
    setEditWickets(player.stats.wickets || 0);
    setEditStrikeRate(player.stats.strikeRate || 0);
    setEditRating(player.stats.rating || 4);
    setEditIsStar(!!player.stats.isStarPlayer);
    setEditGrade(player.grade || 'A');
  };

  const handleSavePlayerStats = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;

    const updated: Player = {
      ...editingPlayer,
      grade: editGrade,
      stats: {
        matches: editMatches,
        runs: editRuns,
        wickets: editWickets,
        highestScore: Math.max(editingPlayer.stats.highestScore || 0, Math.round(editRuns / (editMatches || 1))),
        strikeRate: editStrikeRate,
        economy: editingPlayer.stats.economy || 7.0,
        rating: editRating,
        isStarPlayer: editIsStar,
      },
    };

    realtimeStorage.updatePlayer(updated);
    setEditingPlayer(null);
    soundService.playSuccessSound();
  };

  // ACTION: Team Editing
  const handleOpenEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamShortName(team.shortName);
    setTeamLogo(team.logo);
    setCaptainName(team.captainName);
    setCaptainPhoto(team.captainPhoto || '');
    setCaptainMobile(team.captainMobile);
    setCaptainPin(team.pin);
    setTotalPurse(team.totalPurse);
  };

  const handleCaptainPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCaptainPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    const spent = editingTeam.totalPurse - editingTeam.remainingPurse;
    const newRemaining = Math.max(0, totalPurse - spent);

    const updated: Team = {
      ...editingTeam,
      name: teamName.trim(),
      shortName: teamShortName.trim().toUpperCase(),
      logo: teamLogo.trim() || '🏏',
      captainName: captainName.trim(),
      captainPhoto: captainPhoto.trim() || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      captainMobile: captainMobile.trim(),
      pin: captainPin.trim() || '1234',
      totalPurse: totalPurse,
      remainingPurse: newRemaining,
    };

    realtimeStorage.updateTeam(updated);
    setEditingTeam(null);
    soundService.playSuccessSound();
  };

  // ACTION: Match Fixtures
  const handleAddFixture = (e: React.FormEvent) => {
    e.preventDefault();
    const t1 = teams.find((t) => t.id === newTeam1);
    const t2 = teams.find((t) => t.id === newTeam2);
    if (!t1 || !t2) return;

    const newFix: MatchFixture = {
      id: 'fix-' + Date.now(),
      matchNumber: fixtures.length + 1,
      team1Id: t1.id,
      team1Name: t1.name,
      team2Id: t2.id,
      team2Name: t2.name,
      date: newDate,
      time: newTime,
      venue: newVenue,
      stage: newStage,
      status: 'Upcoming',
    };

    realtimeStorage.saveFixtures([...fixtures, newFix]);
    setIsAddingMatch(false);
    soundService.playSuccessSound();
  };

  const handleUpdateFixture = (fixture: MatchFixture) => {
    const list = fixtures.map((f) => (f.id === fixture.id ? fixture : f));
    realtimeStorage.saveFixtures(list);
  };

  const handleDeleteFixture = (id: string) => {
    if (confirm('Delete this match fixture?')) {
      const list = fixtures.filter((f) => f.id !== id);
      realtimeStorage.saveFixtures(list);
    }
  };

  // ACTION: Admin Security Password Update
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecurityMessage('');

    if (newAdminPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters long.');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setSecurityError('Passwords do not match. Please re-enter.');
      return;
    }

    realtimeStorage.setAdminPassword(newAdminPassword.trim());
    soundService.playSuccessSound();
    setSecurityMessage('Admin Secret Password changed successfully! Keep this key safe.');
    setNewAdminPassword('');
    setConfirmAdminPassword('');
  };

  // ACTION: Database Export
  const handleExportDatabase = () => {
    const jsonStr = realtimeStorage.exportDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StarCity_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundService.playSuccessSound();
    setDbMessage('Database exported successfully as JSON file.');
  };

  // ACTION: Database Import
  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        const success = await realtimeStorage.importDatabase(content);
        if (success) {
          soundService.playSuccessSound();
          setDbMessage('Database restored successfully from file!');
        } else {
          setDbMessage('Error: Invalid database JSON file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6">
      
      {/* Top Admin Bar */}
      <div className="bg-slate-900 border-2 border-red-500/70 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Secure Admin Desk • URL: /star
            </span>
            <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Authenticated Committee Admin
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] mt-1">
            Star City League Control Center
          </h2>
          <p className="text-xs text-slate-400">
            Total 4 Teams • Live Auction Stage • Captain Photos • Match Scheduling • Vercel Deployment & Database Backup
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenReport}
            className="bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:from-amber-300 hover:to-yellow-300 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Final Report
          </button>
          <button
            onClick={onGoToLiveArena}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Play className="w-4 h-4" /> Live Auction Screen
          </button>
          <button
            onClick={onLogoutAdmin}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs transition border border-slate-700 cursor-pointer"
          >
            Logout Admin
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => setAdminTab('auction')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'auction'
              ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Gavel className="w-4 h-4" />
          <span>Live Auction & Hammer</span>
        </button>

        <button
          onClick={() => setAdminTab('teams')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'teams'
              ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>4 Teams & Captain Photos ({teams.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('players')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'players'
              ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Players & Stats ({players.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('matches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'matches'
              ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Match Schedule Manager ({fixtures.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'security'
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span>Security & Passcode</span>
        </button>

        <button
          onClick={() => setAdminTab('vercel')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer whitespace-nowrap ${
            adminTab === 'vercel'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-900 text-blue-300 hover:bg-slate-800 border border-blue-500/40'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Vercel Live & Database Backup</span>
        </button>
      </div>

      {/* TAB 1: AUCTION CONTROLLER */}
      {adminTab === 'auction' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-white space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gavel className="w-6 h-6 text-amber-400" />
                <h3 className="text-xl font-black font-['Outfit']">
                  Auctioneer Podium Desk
                </h3>
              </div>
              <span className="bg-slate-950 border border-amber-400 px-3 py-1 rounded-full text-xs font-mono font-bold text-amber-400">
                Phase: {auctionState.auctionPhase}
              </span>
            </div>

            {currentPlayer ? (
              <div className="space-y-6">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
                  <img
                    src={currentPlayer.photoUrl}
                    alt={currentPlayer.name}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-md shrink-0"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                      <span className="bg-blue-600/30 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        Lot #{currentPlayer.id} • {currentPlayer.role}
                      </span>
                      {/* Admin-only Grade badge */}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border flex items-center gap-1 ${
                        (currentPlayer.grade || 'A') === 'A' ? 'bg-amber-400 text-slate-950 border-amber-300' :
                        (currentPlayer.grade || 'A') === 'B' ? 'bg-blue-500 text-white border-blue-400' :
                        (currentPlayer.grade || 'A') === 'C' ? 'bg-emerald-500 text-white border-emerald-400' :
                        'bg-purple-500 text-white border-purple-400'
                      }`}>
                        <Award className="w-3 h-3" />
                        GRADE {currentPlayer.grade || 'A'}
                      </span>
                    </div>

                    <h4 className="text-2xl font-black text-white mt-1">
                      {currentPlayer.name}
                    </h4>
                    <p className="text-xs text-amber-300 font-semibold">
                      Jersey: {currentPlayer.tshirtName} #{currentPlayer.tshirtNumber} ({currentPlayer.tshirtSize})
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Batsman: {currentPlayer.batsmanStyle} • Bowler: {currentPlayer.bowlingStyle}
                    </p>

                    {/* Admin Grade Quick Switcher */}
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Assign Grade:</span>
                      {(['A', 'B', 'C', 'D'] as PlayerGrade[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleUpdatePlayerGrade(currentPlayer.id, g)}
                          className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                            (currentPlayer.grade || 'A') === g
                              ? 'bg-amber-400 text-slate-950 shadow scale-105'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                          }`}
                        >
                          Grade {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-center sm:text-right bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Top Bid</span>
                    <span className="text-3xl font-black text-amber-400 font-mono">
                      ₹{auctionState.currentBid.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-300 block mt-1 font-semibold">
                      by {auctionState.currentLeadingTeamName || 'Base Price'}
                    </span>
                  </div>
                </div>

                {/* Verbal Calls */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleSetPhase('GOING_ONCE', 15)}
                    className="bg-slate-950 hover:bg-amber-600 hover:text-slate-950 text-amber-300 font-black py-3 rounded-xl border border-amber-500/40 text-xs transition cursor-pointer"
                  >
                    Going Once... (15s)
                  </button>
                  <button
                    onClick={() => handleSetPhase('GOING_TWICE', 8)}
                    className="bg-slate-950 hover:bg-orange-600 hover:text-white text-orange-400 font-black py-3 rounded-xl border border-orange-500/40 text-xs transition cursor-pointer"
                  >
                    Going Twice... (8s)
                  </button>
                  <button
                    onClick={() => handleSetPhase('BIDDING', 30)}
                    className="bg-slate-950 hover:bg-blue-600 hover:text-white text-blue-400 font-black py-3 rounded-xl border border-blue-500/40 text-xs transition cursor-pointer"
                  >
                    Reset Timer (30s)
                  </button>
                  <button
                    onClick={() => realtimeStorage.placeBid(auctionState.currentLeadingTeamId || teams[0].id, auctionState.currentBid + 1000)}
                    className="bg-slate-950 hover:bg-slate-800 text-emerald-400 font-black py-3 rounded-xl border border-emerald-500/40 text-xs transition cursor-pointer"
                  >
                    Admin +₹1,000 Raise
                  </button>
                </div>

                {/* Hammer Bar */}
                <div className="bg-slate-950 p-5 rounded-2xl border-2 border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Confirm Winning Team for Hammer:
                      </label>
                      <select
                        value={auctionState.currentLeadingTeamId || selectedSoldTeam}
                        onChange={(e) => setSelectedSoldTeam(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white font-bold text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-amber-400 w-full"
                      >
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.logo} {t.name} (Purse: ₹{t.remainingPurse.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={handleUnsoldHammer}
                        className="flex-1 sm:flex-none bg-rose-900 hover:bg-rose-800 text-white font-black px-5 py-3 rounded-xl text-xs transition cursor-pointer"
                      >
                        Hammer: UNSOLD
                      </button>

                      <button
                        onClick={handleSoldHammer}
                        className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black px-8 py-3 rounded-xl text-sm transition shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer font-['Outfit']"
                      >
                        <Gavel className="w-4 h-4 text-slate-950" />
                        HAMMER DOWN: SOLD!
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-slate-950 rounded-2xl p-8 text-center text-slate-400">
                <Gavel className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">Stage is currently empty.</p>
                <p className="text-xs text-slate-500">
                  Select a player from the queue on the right to start bidding.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-black uppercase tracking-wider">
                Auction Player Queue
              </h4>
              <span className="bg-slate-950 text-amber-400 font-mono text-xs px-2 py-0.5 rounded border border-slate-800">
                {players.filter((p) => p.status !== 'sold').length} Waiting
              </span>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {players
                .filter((p) => p.status !== 'sold')
                .map((p) => (
                  <div
                    key={p.id}
                    className={`bg-slate-950 p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      p.id === auctionState.currentPlayerId
                        ? 'border-amber-400 shadow-md shadow-amber-400/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={p.photoUrl} alt={p.name} className="w-11 h-11 rounded-xl object-cover border border-amber-400" />
                      <div>
                        <span className="font-bold text-xs text-white block leading-tight">{p.name}</span>
                        <span className="text-[10px] text-slate-400 block">{p.role} • Base: ₹{p.basePrice}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCallPlayer(p.id)}
                      className={`text-xs font-black px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        p.id === auctionState.currentPlayerId
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {p.id === auctionState.currentPlayerId ? 'On Stage' : 'Call'}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 4 TEAMS & CAPTAIN PHOTOS */}
      {adminTab === 'teams' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs uppercase font-extrabold text-amber-400">
                  Total Exactly 4 Teams
                </span>
                <h3 className="text-2xl font-black font-['Outfit'] mt-1">
                  Franchise Teams & Captain Rosters
                </h3>
                <p className="text-xs text-slate-400">
                  View and update team names, captain names, captain photos, secret PINs, and remaining purse.
                </p>
              </div>

              <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                Official 4 Teams Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {teams.map((t) => {
                const teamPlayers = players.filter((p) => p.soldToTeamId === t.id);
                return (
                  <div
                    key={t.id}
                    className="bg-slate-950 border-2 border-slate-800 hover:border-amber-400/60 rounded-3xl p-5 shadow-2xl transition space-y-4"
                  >
                    {/* Team Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-amber-400/40 flex items-center justify-center text-2xl shadow">
                          {t.logo}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white font-['Outfit']">
                            {t.name} ({t.shortName})
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Team ID: {t.id}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenEditTeam(t)}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Team & Captain
                      </button>
                    </div>

                    {/* Captain Spotlight with Photo */}
                    <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
                      <div className="relative shrink-0">
                        <img
                          src={t.captainPhoto}
                          alt={t.captainName}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-black px-1 rounded shadow">
                          CAPTAIN
                        </div>
                      </div>

                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 block font-semibold">Team Captain</span>
                        <h5 className="text-base font-black text-white leading-tight">
                          {t.captainName}
                        </h5>
                        <p className="text-xs text-amber-300 font-mono mt-0.5">
                          Phone: {t.captainMobile}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-300 font-mono border border-slate-800">
                            Secret PIN: <strong>{t.pin}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financials & Squad count */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Remaining Purse</span>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          ₹{t.remainingPurse.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Spent Purse</span>
                        <span className="font-mono font-black text-amber-400 text-sm">
                          ₹{(t.totalPurse - t.remainingPurse).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Squad Count</span>
                        <span className="font-mono font-black text-white text-sm">
                          {teamPlayers.length} Players
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLAYERS & PERFORMANCE UPDATE */}
      {adminTab === 'players' && (() => {
        const gradeACount = players.filter(p => (p.grade || 'A') === 'A').length;
        const gradeBCount = players.filter(p => p.grade === 'B').length;
        const gradeCCount = players.filter(p => p.grade === 'C').length;
        const gradeDCount = players.filter(p => p.grade === 'D').length;
        const displayedPlayers = gradeFilter === 'ALL' 
          ? players 
          : players.filter(p => (p.grade || 'A') === gradeFilter);

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-black font-['Outfit'] flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  Player Directory & Admin Grade Control
                </h3>
                <p className="text-xs text-slate-400">
                  Assign grades (A, B, C, D) privately as admin, update runs, wickets, strike rate, or inspect payments.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Total Registered: {players.length} Players
              </span>
            </div>

            {/* Admin Grade Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
              <span className="text-xs text-amber-400 font-bold px-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Filter Grade:
              </span>
              <button
                type="button"
                onClick={() => setGradeFilter('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  gradeFilter === 'ALL'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All ({players.length})
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('A')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  gradeFilter === 'A'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'bg-slate-900 text-amber-400 hover:text-white border border-slate-800'
                }`}
              >
                Grade A ({gradeACount})
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('B')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  gradeFilter === 'B'
                    ? 'bg-blue-500 text-white shadow'
                    : 'bg-slate-900 text-blue-400 hover:text-white border border-slate-800'
                }`}
              >
                Grade B ({gradeBCount})
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('C')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  gradeFilter === 'C'
                    ? 'bg-emerald-500 text-white shadow'
                    : 'bg-slate-900 text-emerald-400 hover:text-white border border-slate-800'
                }`}
              >
                Grade C ({gradeCCount})
              </button>
              <button
                type="button"
                onClick={() => setGradeFilter('D')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  gradeFilter === 'D'
                    ? 'bg-purple-500 text-white shadow'
                    : 'bg-slate-900 text-purple-400 hover:text-white border border-slate-800'
                }`}
              >
                Grade D ({gradeDCount})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Player</th>
                    <th className="p-3">Admin Grade</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Jersey</th>
                    <th className="p-3">Status / Team</th>
                    <th className="p-3">Stats (M/R/W)</th>
                    <th className="p-3">Rating</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {displayedPlayers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-950/50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img src={p.photoUrl} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-amber-400" />
                          <div>
                            <span className="font-bold text-sm text-white block">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{p.id} • {p.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {(['A', 'B', 'C', 'D'] as PlayerGrade[]).map((g) => {
                            const isSelected = (p.grade || 'A') === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => handleUpdatePlayerGrade(p.id, g)}
                                title={`Assign Grade ${g} to ${p.name}`}
                                className={`w-6 h-6 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center justify-center ${
                                  isSelected
                                    ? g === 'A'
                                      ? 'bg-amber-400 text-slate-950 shadow ring-2 ring-amber-300'
                                      : g === 'B'
                                      ? 'bg-blue-500 text-white shadow ring-2 ring-blue-300'
                                      : g === 'C'
                                      ? 'bg-emerald-500 text-white shadow ring-2 ring-emerald-300'
                                      : 'bg-purple-500 text-white shadow ring-2 ring-purple-300'
                                    : 'bg-slate-950 text-slate-500 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                                }`}
                              >
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{p.mobile}</td>
                      <td className="p-3">
                        <span className="font-bold text-amber-400">{p.tshirtName}</span>
                        <span className="text-slate-400 block text-[10px]">#{p.tshirtNumber} ({p.tshirtSize})</span>
                      </td>
                      <td className="p-3">
                        {p.status === 'sold' ? (
                          <div>
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                              SOLD to {p.soldToTeamName}
                            </span>
                            <span className="block font-mono text-amber-400 font-bold mt-0.5">₹{p.soldPrice?.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'unsold' ? 'bg-rose-950 text-rose-300' : 'bg-blue-950 text-blue-300'
                          }`}>
                            {p.status}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        <span>M: {p.stats.matches} | R: {p.stats.runs} | W: {p.stats.wickets}</span>
                        <span className="block text-[10px] text-slate-400">SR: {p.stats.strikeRate || '-'}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center text-amber-400 text-xs">
                          {'★'.repeat(p.stats.rating || 4)}
                          {p.stats.isStarPlayer && (
                            <span className="ml-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1 rounded">STAR</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-emerald-400 font-semibold block flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Paid ₹250
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.paymentUtr}</span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenEditPlayer(p)}
                          className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit Stats
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB 4: MATCHES SCHEDULE */}
      {adminTab === 'matches' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-xl font-black font-['Outfit']">
                Match Fixtures & Schedule Manager
              </h3>
              <p className="text-xs text-slate-400">
                Schedule matches between the 4 teams, set timings, venues, and declare winners.
              </p>
            </div>
            <button
              onClick={() => setIsAddingMatch(true)}
              className="bg-amber-400 hover:bg-yellow-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Match Fixture
            </button>
          </div>

          {isAddingMatch && (
            <form onSubmit={handleAddFixture} className="bg-slate-950 p-5 rounded-2xl border-2 border-amber-400 space-y-4">
              <h4 className="text-sm font-black text-amber-400 uppercase tracking-wide">
                Schedule New Tournament Match
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Team 1</label>
                  <select
                    value={newTeam1}
                    onChange={(e) => setNewTeam1(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Team 2</label>
                  <select
                    value={newTeam2}
                    onChange={(e) => setNewTeam2(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Stage</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as MatchFixture['stage'])}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="League Match">League Match</option>
                    <option value="Semi Final">Semi Final / Qualifier</option>
                    <option value="Grand Finale">Grand Finale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Venue</label>
                  <input
                    type="text"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddingMatch(false)} className="bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-xs">
                  Cancel
                </button>
                <button type="submit" className="bg-emerald-500 text-slate-950 font-black px-5 py-2 rounded-xl text-xs">
                  Save Fixture
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {fixtures.map((f) => (
              <div key={f.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
                      Match #{f.matchNumber} • {f.stage}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{f.date} at {f.time}</span>
                  </div>
                  <h4 className="text-base font-black text-white">
                    {f.team1Name} <span className="text-amber-400 px-1">VS</span> {f.team2Name}
                  </h4>
                  <p className="text-[11px] text-slate-400">{f.venue}</p>
                  {f.result && (
                    <span className="text-xs text-emerald-400 font-bold block mt-1">Result: {f.result}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={f.status}
                    onChange={(e) => handleUpdateFixture({ ...f, status: e.target.value as MatchFixture['status'] })}
                    className="bg-slate-900 border border-slate-700 text-xs text-white font-bold px-3 py-1.5 rounded-xl"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Live">Live Now</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <button
                    onClick={() => {
                      const res = prompt('Enter Match Winner / Score Result:', f.result || '');
                      if (res !== null) {
                        handleUpdateFixture({ ...f, result: res, status: 'Completed' });
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer"
                  >
                    Declare Result
                  </button>
                  <button onClick={() => handleDeleteFixture(f.id)} className="text-slate-500 hover:text-red-400 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & PASSCODE */}
      {adminTab === 'security' && (
        <div className="bg-slate-900 border-2 border-red-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black font-['Outfit']">
                  Admin Passcode & Intrusion Protection
                </h3>
                <p className="text-xs text-slate-400">
                  Update your secret administrator passphrase so nobody else can access /star.
                </p>
              </div>
            </div>
            <span className="bg-emerald-950 border border-emerald-500 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
              Brute-Force Lockout Active
            </span>
          </div>

          <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                New Secret Passphrase
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Enter strong password (min 6 chars)"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Confirm New Secret Passphrase
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-400"
                />
              </div>
            </div>

            {securityError && (
              <p className="text-xs text-rose-400 font-semibold">{securityError}</p>
            )}

            {securityMessage && (
              <p className="text-xs text-emerald-400 font-semibold">{securityMessage}</p>
            )}

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Update Admin Passphrase
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
            <h4 className="font-bold text-amber-400 uppercase tracking-wide">
              Security Rules Enforced:
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>3-Attempt Lockout:</strong> If anyone enters the wrong password 3 times, login is locked for 10 minutes.</li>
              <li><strong>No Bypass:</strong> There are no test buttons or public bypass links on the login screen.</li>
              <li><strong>Master Recovery Passphrase:</strong> The default fallback passphrase is <code className="text-amber-400 bg-slate-950 px-1 rounded">star@2026#admin</code>.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 6: VERCEL DEPLOYMENT & DATABASE BACKUP */}
      {adminTab === 'vercel' && (
        <div className="bg-slate-900 border-2 border-blue-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black font-['Outfit']">
                  Vercel Live Deployment & Database Architecture
                </h3>
                <p className="text-xs text-slate-400">
                  Full step-by-step process to deploy this website live on Vercel and manage backups.
                </p>
              </div>
            </div>
            <span className="bg-blue-950 border border-blue-400 text-blue-300 text-xs font-bold px-3 py-1 rounded-full">
              Production Ready
            </span>
          </div>

          {/* Database Backup & Restore Console */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4" /> Tournament Database Export / Import (.json)
            </h4>
            <p className="text-xs text-slate-400">
              All 4 teams, registered players, verified payments with UTR, live bids, and match fixtures can be exported into a single file or restored anytime.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportDatabase}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-950" /> Download Complete Database Backup (.json)
              </button>

              <button
                onClick={() => dbFileInputRef.current?.click()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-amber-400" /> Restore Database (.json)
              </button>
              <input
                type="file"
                ref={dbFileInputRef}
                onChange={handleImportDatabase}
                accept=".json"
                className="hidden"
              />
            </div>

            {dbMessage && (
              <p className="text-xs text-emerald-400 font-semibold">{dbMessage}</p>
            )}
          </div>

          {/* Step-by-Step Vercel Deployment Instructions */}
          <div className="space-y-4 pt-2">
            <h4 className="text-base font-black text-white font-['Outfit'] uppercase tracking-wide flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-400" /> Vercel Live Deployment Guide (Step-by-Step):
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="bg-blue-600 text-white font-black px-2 py-0.5 rounded text-[10px]">
                  STEP 1: Push Code to GitHub
                </span>
                <p className="text-slate-300">
                  इस प्रोजेक्ट को अपने GitHub अकाउंट में एक नए रिपोजिटरी (e.g. <code>star-city-cricket-auction</code>) में पुश करें:
                </p>
                <pre className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-amber-300 overflow-x-auto">
git init{'\n'}git add .{'\n'}git commit -m "Star City Cricket Auction"{'\n'}git push -u origin main
                </pre>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="bg-blue-600 text-white font-black px-2 py-0.5 rounded text-[10px]">
                  STEP 2: Import into Vercel
                </span>
                <p className="text-slate-300">
                  <strong>vercel.com</strong> पर जाएं, अपने GitHub से लॉगिन करें और <strong>"Add New Project"</strong> पर क्लिक करके इस रिपोजिटरी को सेलेक्ट करें।
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-400">
                  <li>Framework Preset: <strong>Vite</strong></li>
                  <li>Build Command: <strong>npm run build</strong></li>
                  <li>Output Directory: <strong>dist</strong></li>
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="bg-blue-600 text-white font-black px-2 py-0.5 rounded text-[10px]">
                  STEP 3: 1-Click Deploy
                </span>
                <p className="text-slate-300">
                  <strong>"Deploy"</strong> बटन पर क्लिक करें। 30 सेकंड के अंदर आपकी वेबसाइट Vercel के लाइव URL (जैसे <code>star-city-auction.vercel.app</code>) पर लाइव हो जाएगी!
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="bg-blue-600 text-white font-black px-2 py-0.5 rounded text-[10px]">
                  STEP 4: Database Persistence
                </span>
                <p className="text-slate-300">
                  यह प्रोजेक्ट रियल-टाइम ब्रॉडकास्ट चैनल + लोकल स्टोरेज और JSON बैकअप पर चलता है। किसी भी समय आप "Download Database Backup" से पूरा डेटा डाउनलोड कर सकते हैं या किसी भी डिवाइस पर रिस्टोर कर सकते हैं।
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TEAM & CAPTAIN PHOTO */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-white space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-black text-lg font-['Outfit']">
                Edit Team: {editingTeam.name}
              </h3>
              <button onClick={() => setEditingTeam(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Team Name</label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Short Code</label>
                  <input
                    type="text"
                    required
                    value={teamShortName}
                    onChange={(e) => setTeamShortName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs uppercase"
                  />
                </div>
              </div>

              {/* Captain Name & Photo */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wide block">
                  Captain Details & Photo
                </span>

                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={captainPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
                      alt="Captain"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => captainPhotoInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Captain Photo
                    </button>
                    <input
                      type="file"
                      ref={captainPhotoInputRef}
                      onChange={handleCaptainPhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <p className="text-[10px] text-slate-500">
                      Or paste direct image URL below:
                    </p>
                  </div>
                </div>

                <div>
                  <input
                    type="url"
                    placeholder="Captain Photo URL (https://...)"
                    value={captainPhoto}
                    onChange={(e) => setCaptainPhoto(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Captain Name</label>
                    <input
                      type="text"
                      required
                      value={captainName}
                      onChange={(e) => setCaptainName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Captain Mobile</label>
                    <input
                      type="tel"
                      required
                      value={captainMobile}
                      onChange={(e) => setCaptainMobile(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Captain 4-Digit Login PIN</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={captainPin}
                      onChange={(e) => setCaptainPin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-amber-400 font-mono font-bold text-xs tracking-wider"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Total Purse (INR)</label>
                    <input
                      type="number"
                      required
                      value={totalPurse}
                      onChange={(e) => setTotalPurse(parseInt(e.target.value, 10) || 100000)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-yellow-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs"
                >
                  Save Team & Captain Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PLAYER PERFORMANCE STATS */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-black text-base font-['Outfit']">
                Update Performance Stats: {editingPlayer.name}
              </h3>
              <button onClick={() => setEditingPlayer(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSavePlayerStats} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Matches Played</label>
                  <input
                    type="number"
                    value={editMatches}
                    onChange={(e) => setEditMatches(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Total Runs</label>
                  <input
                    type="number"
                    value={editRuns}
                    onChange={(e) => setEditRuns(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Wickets Taken</label>
                  <input
                    type="number"
                    value={editWickets}
                    onChange={(e) => setEditWickets(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Batting Strike Rate</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editStrikeRate}
                    onChange={(e) => setEditStrikeRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Admin Only Grade Selection */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1 font-bold">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Player Category / Grade (Admin Only)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as PlayerGrade[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setEditGrade(g)}
                      className={`py-2 rounded-xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center ${
                        editGrade === g
                          ? g === 'A'
                            ? 'bg-amber-400 text-slate-950 font-black shadow ring-2 ring-amber-300'
                            : g === 'B'
                            ? 'bg-blue-500 text-white font-black shadow ring-2 ring-blue-300'
                            : g === 'C'
                            ? 'bg-emerald-500 text-white font-black shadow ring-2 ring-emerald-300'
                            : 'bg-purple-500 text-white font-black shadow ring-2 ring-purple-300'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span>Grade {g}</span>
                      <span className="text-[9px] font-normal opacity-80">
                        {g === 'A' ? 'Marquee' : g === 'B' ? 'Senior' : g === 'C' ? 'Regular' : 'Emerging'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Player Rating (1 - 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className={`text-xl ${star <= editRating ? 'text-amber-400' : 'text-slate-600'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={editIsStar}
                  onChange={(e) => setEditIsStar(e.target.checked)}
                  className="accent-amber-400 w-4 h-4"
                />
                <span className="text-xs text-white font-bold">Mark as League Star Icon Player</span>
              </label>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-yellow-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs"
                >
                  Save Stats
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
