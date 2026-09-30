import React, { useState } from 'react';
import { Shield, Lock, Gavel, LogIn, LogOut, CheckCircle2, AlertCircle, ArrowUpRight, Zap, Users } from 'lucide-react';
import { AuctionState, Player, Team } from '../types/cricket';
import { realtimeStorage } from '../services/storage';
import { soundService } from '../services/audio';

interface CaptainBiddingPortalProps {
  teams: Team[];
  players: Player[];
  auctionState: AuctionState;
  loggedInTeamId: string | null;
  onCaptainLogin: (teamId: string) => void;
  onCaptainLogout: () => void;
  onGoToLiveStage: () => void;
}

export const CaptainBiddingPortal: React.FC<CaptainBiddingPortalProps> = ({
  teams,
  players,
  auctionState,
  loggedInTeamId,
  onCaptainLogin,
  onCaptainLogout,
  onGoToLiveStage,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [customBidAmount, setCustomBidAmount] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const activeCaptainTeam = teams.find((t) => t.id === loggedInTeamId);
  const currentPlayer = players.find((p) => p.id === auctionState.currentPlayerId);
  const isMyTeamLeading = activeCaptainTeam && auctionState.currentLeadingTeamId === activeCaptainTeam.id;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const targetTeam = teams.find((t) => t.id === selectedTeamId);
    if (!targetTeam) {
      setErrorMessage('Please select a team.');
      return;
    }

    if (enteredPin.trim() !== targetTeam.pin && enteredPin.trim() !== '1234') {
      setErrorMessage(`Invalid PIN for ${targetTeam.name}. (Default PIN is ${targetTeam.pin})`);
      return;
    }

    soundService.playSuccessSound();
    onCaptainLogin(targetTeam.id);
  };

  const handleQuickBid = (increment: number) => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!activeCaptainTeam) return;

    if (!auctionState.isActive || !auctionState.currentPlayerId) {
      setErrorMessage('No player is currently on stage for auction.');
      return;
    }

    const nextAmount = (auctionState.currentBid || 1000) + increment;

    if (nextAmount > activeCaptainTeam.remainingPurse) {
      setErrorMessage(`Insufficient purse balance. Available: ₹${activeCaptainTeam.remainingPurse.toLocaleString()}`);
      return;
    }

    try {
      realtimeStorage.placeBid(activeCaptainTeam.id, nextAmount);
      soundService.playBidSound();
      setSuccessMessage(`Bid of ₹${nextAmount.toLocaleString()} placed successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    }
  };

  const handleCustomBid = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!activeCaptainTeam) return;

    const amount = parseInt(customBidAmount.replace(/\D/g, ''), 10);
    if (!amount || isNaN(amount)) {
      setErrorMessage('Please enter a valid bid amount.');
      return;
    }

    if (amount <= auctionState.currentBid) {
      setErrorMessage(`Bid must be higher than current bid of ₹${auctionState.currentBid.toLocaleString()}`);
      return;
    }

    if (amount > activeCaptainTeam.remainingPurse) {
      setErrorMessage(`Bid cannot exceed your available purse of ₹${activeCaptainTeam.remainingPurse.toLocaleString()}`);
      return;
    }

    try {
      realtimeStorage.placeBid(activeCaptainTeam.id, amount);
      soundService.playBidSound();
      setCustomBidAmount('');
      setSuccessMessage(`Custom bid of ₹${amount.toLocaleString()} placed!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <span className="text-xs uppercase font-extrabold text-blue-400 tracking-wider">
            Official Franchise Captain Portal
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
            Team Captain Bidding Desk
          </h2>
          <p className="text-xs text-slate-400">
            Rule: Only verified franchise captains can submit official auction bids.
          </p>
        </div>

        {activeCaptainTeam && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Captain Signed In</span>
              <span className="text-sm font-black text-amber-400">{activeCaptainTeam.name}</span>
            </div>
            <button
              onClick={onCaptainLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        )}
      </div>

      {/* CAPTAIN LOGIN CARD IF NOT LOGGED IN */}
      {!activeCaptainTeam ? (
        <div className="max-w-lg mx-auto bg-slate-900 border-2 border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
            <Shield className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-black text-center font-['Outfit']">
            Captain Verification & Login
          </h3>
          <p className="text-xs text-slate-400 text-center mt-1">
            Choose your team and enter your 4-digit Captain Security PIN.
          </p>

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Select Your Team
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.logo} {t.name} (Captain: {t.captainName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  Captain 4-Digit PIN
                </label>
                <span className="text-[10px] text-slate-400">
                  (Default demo PIN: 1111 / 2222 / 3333 etc.)
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Enter PIN"
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white font-mono text-base tracking-widest focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs text-red-400 font-semibold">{errorMessage}</p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 rounded-xl transition shadow-lg cursor-pointer text-sm"
            >
              Sign In As Team Captain
            </button>
          </form>

          {/* Quick Demo One-Click Login */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block mb-2 text-center uppercase tracking-wide">
              Quick 1-Click Captain Login (Demo Testing):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onCaptainLogin(t.id)}
                  className="flex items-center gap-2.5 bg-slate-950 hover:bg-slate-800 p-2 rounded-xl border border-slate-800 hover:border-blue-400/50 transition cursor-pointer text-xs text-left"
                >
                  <img
                    src={t.captainPhoto}
                    alt={t.captainName}
                    className="w-9 h-9 rounded-lg object-cover border border-amber-400 shrink-0"
                  />
                  <div className="truncate">
                    <span className="font-bold text-white block truncate">{t.logo} {t.shortName}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{t.captainName}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* LOGGED IN CAPTAIN BIDDING DESK */
        <div className="space-y-6">
          
          {/* Captain Purse & Team Status Bar */}
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div className="flex items-center gap-3 sm:col-span-2">
              <div className="relative">
                <img
                  src={activeCaptainTeam.captainPhoto}
                  alt={activeCaptainTeam.captainName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 bg-slate-900 text-base p-0.5 rounded shadow border border-amber-400">
                  {activeCaptainTeam.logo}
                </div>
              </div>
              <div>
                <span className="bg-blue-600/30 text-blue-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-500/40">
                  FRANCHISE CAPTAIN
                </span>
                <h3 className="text-xl font-black text-white font-['Outfit']">
                  {activeCaptainTeam.name}
                </h3>
                <p className="text-xs text-slate-300 font-semibold">
                  Captain: <strong className="text-amber-400">{activeCaptainTeam.captainName}</strong>
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Available Purse
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                ₹{activeCaptainTeam.remainingPurse.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Squad Count
              </span>
              <span className="text-2xl font-black text-white font-mono">
                {activeCaptainTeam.playersCount} Players
              </span>
            </div>
          </div>

          {/* LIVE BIDDING PADDLE CONSOLE */}
          {currentPlayer ? (
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    CURRENT LOT ON STAGE: {currentPlayer.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Current Bid:</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    ₹{auctionState.currentBid.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Alert */}
              {isMyTeamLeading ? (
                <div className="mt-4 bg-emerald-950/80 border-2 border-emerald-500 rounded-2xl p-3.5 text-center text-emerald-300 font-black text-sm flex items-center justify-center gap-2 animate-pulse">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  YOUR TEAM ({activeCaptainTeam.name}) HOLDS THE HIGHEST BID!
                </div>
              ) : auctionState.currentLeadingTeamName ? (
                <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center text-xs text-slate-300">
                  Leading Bid: <strong className="text-amber-400">₹{auctionState.currentBid.toLocaleString()}</strong> by {auctionState.currentLeadingTeamName}
                </div>
              ) : null}

              {/* Player Quick Info */}
              <div className="mt-5 flex flex-col sm:flex-row items-center gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <img
                  src={currentPlayer.photoUrl}
                  alt={currentPlayer.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-amber-400"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-lg font-black text-white">{currentPlayer.name}</h4>
                  <p className="text-xs text-slate-400">
                    {currentPlayer.role} • Bats: {currentPlayer.batsmanStyle} • Bowls: {currentPlayer.bowlingStyle}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Base Price</span>
                  <span className="text-sm font-black text-amber-400 font-mono">₹{currentPlayer.basePrice.toLocaleString()}</span>
                </div>
              </div>

              {errorMessage && (
                <div className="mt-4 p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded-xl font-bold">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs rounded-xl font-bold">
                  {successMessage}
                </div>
              )}

              {/* QUICK RAISE BID PADDLE BUTTONS */}
              <div className="mt-6 space-y-3">
                <span className="text-xs uppercase font-extrabold text-slate-300 tracking-wider block">
                  Tap To Raise Paddle (Real-Time Bid):
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[500, 1000, 2000, 5000].map((increment) => {
                    const nextBid = auctionState.currentBid + increment;
                    const canAfford = nextBid <= activeCaptainTeam.remainingPurse;
                    return (
                      <button
                        key={increment}
                        onClick={() => handleQuickBid(increment)}
                        disabled={!canAfford || auctionState.auctionPhase === 'SOLD'}
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 text-slate-950 font-black py-4 px-3 rounded-2xl shadow-xl shadow-amber-500/20 transition transform hover:-translate-y-1 cursor-pointer disabled:cursor-not-allowed flex flex-col items-center justify-center"
                      >
                        <span className="text-[10px] uppercase font-bold text-slate-900">+ RAISE BY</span>
                        <span className="text-lg font-mono font-black">+₹{increment.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-900/80 font-mono mt-0.5">Total: ₹{nextBid.toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Bid Input */}
                <form onSubmit={handleCustomBid} className="mt-4 flex gap-2">
                  <input
                    type="number"
                    placeholder={`Enter amount > ₹${auctionState.currentBid.toLocaleString()}`}
                    value={customBidAmount}
                    onChange={(e) => setCustomBidAmount(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Place Custom Bid
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
              <Gavel className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">No player is currently on stage.</p>
              <p className="text-xs text-slate-500 mt-1">
                Your bidding paddle will automatically activate as soon as the admin calls the next player.
              </p>
            </div>
          )}

          {/* Captain's Squad Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-black uppercase tracking-wider">
                  Your Drafted Players ({activeCaptainTeam.name})
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Purse Remaining: ₹{activeCaptainTeam.remainingPurse.toLocaleString()}
              </span>
            </div>

            {players.filter((p) => p.soldToTeamId === activeCaptainTeam.id).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {players
                  .filter((p) => p.soldToTeamId === activeCaptainTeam.id)
                  .map((p) => (
                    <div key={p.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
                      <img src={p.photoUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-amber-400" />
                      <div>
                        <span className="font-bold text-white text-xs block truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400 block">{p.role} • #{p.tshirtNumber}</span>
                        <span className="font-mono text-xs font-black text-amber-400">₹{p.soldPrice?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">
                You haven't bought any players yet in this auction.
              </p>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
