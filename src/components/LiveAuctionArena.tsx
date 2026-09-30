import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, Gavel, Timer, Clock, ArrowUpRight, 
  Sparkles, History, UserCheck, Play, Award, Zap
} from 'lucide-react';
import { AuctionState, Player, Team } from '../types/cricket';
import { realtimeStorage } from '../services/storage';
import { soundService } from '../services/audio';

interface LiveAuctionArenaProps {
  auctionState: AuctionState;
  players: Player[];
  teams: Team[];
  loggedInCaptainTeamId?: string | null;
  onOpenCaptainLogin: () => void;
  onOpenAdmin: () => void;
}

export const LiveAuctionArena: React.FC<LiveAuctionArenaProps> = ({
  auctionState,
  players,
  teams,
  loggedInCaptainTeamId,
  onOpenCaptainLogin,
  onOpenAdmin,
}) => {
  const [selectedBidTeam, setSelectedBidTeam] = useState<string>(loggedInCaptainTeamId || teams[0]?.id || '');
  const [bidError, setBidError] = useState<string>('');
  const [isBidding, setIsBidding] = useState<boolean>(false);

  // Synchronize captain selection if logged in
  useEffect(() => {
    if (loggedInCaptainTeamId) {
      setSelectedBidTeam(loggedInCaptainTeamId);
    }
  }, [loggedInCaptainTeamId]);

  const currentPlayer = players.find((p) => p.id === auctionState.currentPlayerId);
  const currentTeam = teams.find((t) => t.id === auctionState.currentLeadingTeamId);
  const biddingTeam = teams.find((t) => t.id === selectedBidTeam);

  const handlePlaceBid = (increment: number) => {
    setBidError('');
    if (!auctionState.isActive || !auctionState.currentPlayerId) {
      setBidError('No player is currently on the auction stage.');
      return;
    }

    const teamToBid = loggedInCaptainTeamId ? loggedInCaptainTeamId : selectedBidTeam;
    if (!teamToBid) {
      setBidError('Please select a team to bid.');
      return;
    }

    const nextAmount = (auctionState.currentBid || 1000) + increment;

    try {
      setIsBidding(true);
      realtimeStorage.placeBid(teamToBid, nextAmount);
      soundService.playBidSound();
      setTimeout(() => setIsBidding(false), 300);
    } catch (err: unknown) {
      setIsBidding(false);
      if (err instanceof Error) {
        setBidError(err.message);
      }
    }
  };

  const getPhaseColor = () => {
    switch (auctionState.auctionPhase) {
      case 'GOING_ONCE': return 'bg-amber-500 text-slate-950 animate-pulse';
      case 'GOING_TWICE': return 'bg-orange-600 text-white animate-pulse';
      case 'SOLD': return 'bg-emerald-500 text-slate-950';
      case 'UNSOLD': return 'bg-rose-600 text-white';
      default: return 'bg-blue-600 text-white';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Top Banner Alert / Stage Status */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-amber-500/40 px-5 py-3 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 text-left">
          <div className="relative">
            <div className="w-3.5 h-3.5 bg-red-500 rounded-full animate-ping absolute" />
            <div className="w-3.5 h-3.5 bg-red-600 rounded-full" />
          </div>
          <div>
            <h2 className="text-white font-extrabold text-sm sm:text-base flex items-center gap-2">
              <Gavel className="w-4 h-4 text-amber-400" />
              LIVE AUCTION FLOOR • STAR CITY CRICKET LEAGUE 2026-27
            </h2>
            <p className="text-xs text-slate-400">
              Real-time bids sync automatically across all screens.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!loggedInCaptainTeamId ? (
            <button
              onClick={onOpenCaptainLogin}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              Team Captain Sign In to Bid
            </button>
          ) : (
            <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Captain Bidding Active: {teams.find(t => t.id === loggedInCaptainTeamId)?.name}
            </div>
          )}

          <button
            onClick={onOpenAdmin}
            className="bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold px-3 py-2 rounded-xl border border-amber-500/40 transition"
          >
            Admin Controller
          </button>
        </div>
      </div>

      {/* MAIN STAGE GRID */}
      {currentPlayer ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Current Player Spotlight Card (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border-2 border-amber-500/50 rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Top Stage Header */}
            <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-md uppercase">
                  LOT #{currentPlayer.id.split('-').pop()}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  ID: {currentPlayer.id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${getPhaseColor()}`}>
                  {auctionState.auctionPhase === 'BIDDING' ? 'BIDDING OPEN' : auctionState.auctionPhase}
                </span>
              </div>
            </div>

            {/* Player Details & Stage Presentation */}
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                
                {/* Player Photo with Glow */}
                <div className="relative shrink-0">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-4 border-amber-400 shadow-2xl bg-slate-950 relative">
                    <img
                      src={currentPlayer.photoUrl}
                      alt={currentPlayer.name}
                      className="w-full h-full object-cover"
                    />
                    {currentPlayer.stats.isStarPlayer && (
                      <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> STAR
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-center">
                    <span className="inline-block bg-slate-800 text-amber-300 font-mono font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-700">
                      Jersey: #{currentPlayer.tshirtNumber} • {currentPlayer.tshirtSize}
                    </span>
                  </div>
                </div>

                {/* Player Credentials */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {currentPlayer.role}
                    </span>
                    <span className="bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Verified Player
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
                    {currentPlayer.name}
                  </h3>

                  <p className="text-xs text-amber-300/90 font-bold uppercase tracking-wide">
                    T-Shirt Name: <span className="text-white">{currentPlayer.tshirtName}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-left">
                      <span className="text-slate-400 block text-[10px]">Batting Style</span>
                      <span className="text-white font-bold">{currentPlayer.batsmanStyle}</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-left">
                      <span className="text-slate-400 block text-[10px]">Bowling Style</span>
                      <span className="text-white font-bold">{currentPlayer.bowlingStyle}</span>
                    </div>
                  </div>

                  {/* Career Stats Grid */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 grid grid-cols-4 gap-2 text-center mt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Matches</span>
                      <span className="text-sm font-black text-white">{currentPlayer.stats.matches}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Runs</span>
                      <span className="text-sm font-black text-amber-400">{currentPlayer.stats.runs}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Wickets</span>
                      <span className="text-sm font-black text-emerald-400">{currentPlayer.stats.wickets}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Strike Rate</span>
                      <span className="text-sm font-black text-cyan-400">{currentPlayer.stats.strikeRate || '-'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Base Price Bar */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Opening Base Price:</span>
                <span className="font-extrabold text-amber-400 font-mono text-sm">
                  ₹{currentPlayer.basePrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Current Auction Result Banner if SOLD */}
            {auctionState.auctionPhase === 'SOLD' && (
              <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 p-4 text-center text-slate-950 font-black animate-pulse border-t-2 border-white">
                <div className="text-xl sm:text-2xl flex items-center justify-center gap-2">
                  <Award className="w-6 h-6" />
                  HAMMER DOWN! SOLD TO {auctionState.currentLeadingTeamName || 'STAR CITY'} FOR ₹{auctionState.currentBid.toLocaleString()}!
                </div>
              </div>
            )}

            {auctionState.auctionPhase === 'UNSOLD' && (
              <div className="bg-rose-900/90 border-t-2 border-rose-500 p-4 text-center text-white font-bold">
                <p className="text-lg">Hammer Down - Player Remains Unsold for this round.</p>
              </div>
            )}

          </div>

          {/* RIGHT: Live Bid Desk & Quick Bidding Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Real-time Bid Display Card */}
            <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Trophy className="w-40 h-40 text-amber-400" />
              </div>

              {/* Timer & Countdown */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-amber-400" />
                  <span className="text-xs uppercase font-extrabold text-slate-300">
                    Auction Clock
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-2xl font-mono font-black text-amber-400">
                    {auctionState.timerSeconds}s
                  </div>
                  <span className="text-xs text-slate-400">left</span>
                </div>
              </div>

              {/* Timer Progress Bar */}
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mt-3 border border-slate-800">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    auctionState.timerSeconds <= 5 ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-amber-400 to-yellow-500'
                  }`}
                  style={{ width: `${Math.min(100, (auctionState.timerSeconds / 30) * 100)}%` }}
                />
              </div>

              {/* Current High Bid Box */}
              <div className="mt-5 text-center bg-slate-950/90 rounded-2xl p-5 border border-amber-500/30">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">
                  CURRENT HIGHEST BID
                </span>
                <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 font-mono tracking-tight drop-shadow">
                  ₹{auctionState.currentBid.toLocaleString()}
                </div>

                {currentTeam ? (
                  <div className="mt-3 inline-flex items-center gap-2 bg-slate-900 border border-amber-400/40 px-3.5 py-1.5 rounded-xl shadow">
                    <span className="text-base">{currentTeam.logo}</span>
                    <span className="font-extrabold text-white text-sm">
                      {currentTeam.name}
                    </span>
                    <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                      Leading
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-500">
                    Waiting for opening paddle bid...
                  </div>
                )}
              </div>

              {/* Bidding Controls for Captains / Admins */}
              <div className="mt-5 space-y-3">
                
                {/* Team selector if not logged in as captain */}
                {!loggedInCaptainTeamId ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Choose Bidding Team (Simulator):
                    </label>
                    <select
                      value={selectedBidTeam}
                      onChange={(e) => setSelectedBidTeam(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.logo} {t.name} (Purse: ₹{t.remainingPurse.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Your Team: <strong className="text-white">{biddingTeam?.name}</strong></span>
                    <span className="text-emerald-400 font-bold font-mono">Purse: ₹{biddingTeam?.remainingPurse.toLocaleString()}</span>
                  </div>
                )}

                {bidError && (
                  <p className="text-xs text-rose-400 font-semibold bg-rose-950/60 p-2 rounded-lg border border-rose-500/40">
                    {bidError}
                  </p>
                )}

                {/* Quick Bid Increments */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[500, 1000, 2000, 5000].map((inc) => (
                    <button
                      key={inc}
                      onClick={() => handlePlaceBid(inc)}
                      disabled={isBidding || !auctionState.isActive || auctionState.auctionPhase === 'SOLD'}
                      className="bg-gradient-to-b from-slate-800 to-slate-950 hover:from-amber-600 hover:to-amber-700 text-white hover:text-slate-950 disabled:opacity-40 border border-slate-700 hover:border-amber-400 py-2.5 rounded-xl font-black text-xs font-mono transition shadow flex flex-col items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span className="text-[10px] text-amber-400 hover:text-slate-950 block">+ RAISE</span>
                      <span>+₹{inc.toLocaleString()}</span>
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-center text-slate-400">
                  Clicking any button raises the bid instantly across all connected screens.
                </div>
              </div>

            </div>

            {/* Live Bids Feed Stream */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Bidding Feed
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {auctionState.bidsLog?.length || 0} Bids Logged
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {auctionState.bidsLog && auctionState.bidsLog.length > 0 ? (
                  auctionState.bidsLog.map((b, i) => (
                    <div
                      key={b.id || i}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs ${
                        i === 0 
                          ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300 font-bold'
                          : 'bg-slate-950 text-slate-300 border border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold">
                          #{i + 1}
                        </span>
                        <span>{b.teamName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-white">
                          ₹{b.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {b.timestamp}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No bids recorded yet for this player.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* Empty Stage / Waiting for Admin */
        <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-3xl p-10 text-center text-white space-y-4">
          <Gavel className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
          <h3 className="text-2xl font-black font-['Outfit']">
            No Player Currently On Auction Stage
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            The auctioneer has not called a player to the podium yet. The admin can start the auction and select any verified player from the pool.
          </p>
          <button
            onClick={onOpenAdmin}
            className="bg-amber-400 hover:bg-yellow-400 text-slate-950 font-black px-6 py-3 rounded-xl text-sm transition shadow-lg cursor-pointer"
          >
            Open Admin Controller to Call Next Player
          </button>
        </div>
      )}

      {/* TEAM PURSE SUMMARY TICKER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm sm:text-base text-white">
              Teams Purse & Squad Dashboard
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Total Purse per team: ₹1,00,000
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {teams.map((t) => {
            const pct = Math.round((t.remainingPurse / t.totalPurse) * 100);
            return (
              <div 
                key={t.id} 
                className="bg-slate-950 p-4 rounded-2xl border-2 border-slate-800 hover:border-amber-400/60 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{t.logo}</span>
                    <span className="text-xs font-mono bg-slate-900 text-amber-400 font-bold px-2 py-0.5 rounded border border-slate-800">
                      {t.playersCount} Players
                    </span>
                  </div>
                  <h4 className="font-black text-sm text-white truncate" title={t.name}>
                    {t.name}
                  </h4>
                  
                  {/* Captain with Photo */}
                  <div className="mt-2 flex items-center gap-2.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                    <img
                      src={t.captainPhoto}
                      alt={t.captainName}
                      className="w-8 h-8 rounded-lg object-cover border border-amber-400 shrink-0"
                    />
                    <div className="truncate">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Captain</span>
                      <span className="text-xs font-bold text-slate-200 truncate block">{t.captainName}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Purse Left:</span>
                    <span className="font-mono font-black text-emerald-400">
                      ₹{t.remainingPurse.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
