import React, { useState } from 'react';
import { 
  User, Phone, Calendar, Shirt, CheckCircle2, 
  Trophy, History, LogIn, LogOut, Download, Sparkles, MapPin, Clock, ArrowRight
} from 'lucide-react';
import { MatchFixture, Player, Team } from '../types/cricket';

interface PlayerProfileDashboardProps {
  players: Player[];
  teams: Team[];
  fixtures: MatchFixture[];
  initialMobile?: string;
  onGoToLiveAuction: () => void;
}

export const PlayerProfileDashboard: React.FC<PlayerProfileDashboardProps> = ({
  players,
  teams,
  fixtures,
  initialMobile = '',
  onGoToLiveAuction,
}) => {
  const [mobileQuery, setMobileQuery] = useState(initialMobile);
  const [loggedInPlayer, setLoggedInPlayer] = useState<Player | null>(() => {
    if (initialMobile) {
      return players.find((p) => p.mobile === initialMobile) || null;
    }
    // Default demo to player 1 so user can immediately view dashboard without typing!
    return players[0] || null;
  });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const clean = mobileQuery.trim();
    if (!clean) {
      setLoginError('Please enter your 10-digit registered mobile number or Player ID.');
      return;
    }

    const found = players.find(
      (p) => p.mobile.includes(clean) || p.id.toLowerCase() === clean.toLowerCase()
    );

    if (!found) {
      setLoginError('No player found with this mobile number or ID. Please check or register first.');
      return;
    }

    setLoggedInPlayer(found);
  };

  const handleLogout = () => {
    setLoggedInPlayer(null);
    setMobileQuery('');
  };

  // If player is sold, find their team & upcoming matches
  const playerTeam = loggedInPlayer?.soldToTeamId 
    ? teams.find((t) => t.id === loggedInPlayer.soldToTeamId)
    : null;

  const playerFixtures = playerTeam
    ? fixtures.filter((f) => f.team1Id === playerTeam.id || f.team2Id === playerTeam.id)
    : [];

  const teamSquad = playerTeam
    ? players.filter((p) => p.soldToTeamId === playerTeam.id)
    : [];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-8">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">
            Player Dashboard & Bid Tracker
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
            Star City Box Cricket Player Portal
          </h2>
          <p className="text-xs text-slate-400">
            Check your registration status, live bid history, and match schedule.
          </p>
        </div>

        {loggedInPlayer && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Logged in as</span>
              <span className="text-sm font-bold text-amber-400">{loggedInPlayer.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        )}
      </div>

      {/* LOGIN BOX IF NOT LOGGED IN */}
      {!loggedInPlayer ? (
        <div className="max-w-md mx-auto bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-400/20">
            <LogIn className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-center font-['Outfit']">
            Player Portal Login
          </h3>
          <p className="text-xs text-slate-400 text-center mt-1">
            Enter your 10-digit mobile number or Player ID (e.g. SCB-2026-001)
          </p>

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Mobile Number or Player ID
              </label>
              <input
                type="text"
                placeholder="e.g. 9876500001 or SCB-2026-001"
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-400 font-semibold">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black py-3 rounded-xl transition shadow-lg cursor-pointer text-sm"
            >
              Access My Profile & Bids
            </button>
          </form>

          {/* Quick Demo Selector */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block mb-2 font-semibold">
              Or quick select registered player demo:
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {players.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setLoggedInPlayer(p)}
                  className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-400 px-2.5 py-1 rounded-lg border border-slate-800 transition cursor-pointer"
                >
                  {p.name.split(' ')[0]} ({p.status})
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* LOGGED IN PLAYER DASHBOARD */
        <div className="space-y-8">
          
          {/* TOP CARD: PLAYER BADGE & STATUS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Player Digital ID Card (Poster Style) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl" />

              {/* ID Card Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-blue-500/30">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-black text-xs">STAR CITY</span>
                  <span className="text-xs text-slate-300 font-bold">• LEAGUE 2026-27</span>
                </div>
                <span className="font-mono text-xs font-black text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-400/30">
                  {loggedInPlayer.id}
                </span>
              </div>

              {/* Card Photo & Main Details */}
              <div className="mt-4 flex items-center gap-4">
                <div className="relative">
                  <img
                    src={loggedInPlayer.photoUrl}
                    alt={loggedInPlayer.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-amber-400 shadow-xl"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded shadow">
                    #{loggedInPlayer.tshirtNumber}
                  </div>
                </div>

                <div>
                  <span className="bg-blue-600/40 text-blue-300 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase border border-blue-500/40">
                    {loggedInPlayer.role}
                  </span>
                  <h3 className="text-xl font-black font-['Outfit'] mt-1 leading-tight">
                    {loggedInPlayer.name}
                  </h3>
                  <p className="text-xs text-amber-400 font-bold mt-0.5">
                    Jersey: {loggedInPlayer.tshirtName}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Size: <strong>{loggedInPlayer.tshirtSize}</strong> • Bats: <strong>{loggedInPlayer.batsmanStyle}</strong>
                  </p>
                </div>
              </div>

              {/* Verified Payment Seal */}
              <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Payment UTR</span>
                  <span className="text-emerald-400 font-mono font-bold">{loggedInPlayer.paymentUtr || 'VERIFIED'}</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Registration Fee</span>
                  <span className="text-white font-bold">₹500 (Paid & Confirmed)</span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-[11px] text-amber-300 font-medium italic">
                  👑 "Good Players Win Matches, Great Teams Win Leagues"
                </p>
              </div>
            </div>

            {/* Auction Status & Results */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Status Header Tile */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl text-white">
                <span className="text-xs uppercase font-extrabold text-slate-400">
                  Live Auction Status
                </span>

                {loggedInPlayer.status === 'sold' && (
                  <div className="mt-3 bg-gradient-to-r from-emerald-950 to-slate-900 border-2 border-emerald-500 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-emerald-400 font-black text-xs uppercase tracking-wider block">
                          CONGRATULATIONS! YOU ARE SOLD!
                        </span>
                        <h4 className="text-xl font-black text-white font-['Outfit']">
                          Bought by {loggedInPlayer.soldToTeamName}
                        </h4>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-emerald-500/30 flex items-center justify-between">
                      <span className="text-xs text-slate-300">Final Auction Hammer Price:</span>
                      <span className="text-2xl font-black text-amber-400 font-mono">
                        ₹{loggedInPlayer.soldPrice?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {loggedInPlayer.status === 'in_auction' && (
                  <div className="mt-3 bg-gradient-to-r from-amber-950 to-slate-900 border-2 border-amber-500 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                        <span className="text-amber-400 font-black text-sm uppercase">
                          YOUR CARD IS ON STAGE NOW!
                        </span>
                      </div>
                      <button
                        onClick={onGoToLiveAuction}
                        className="bg-amber-400 hover:bg-yellow-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        Watch Live Bids <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 mt-2">
                      Captains are currently placing bids for you. Check live screen!
                    </p>
                  </div>
                )}

                {loggedInPlayer.status === 'verified' && (
                  <div className="mt-3 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Ready in Auction Pool
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        Your registration & payment are approved. Your name will be called up by the auctioneer shortly.
                      </p>
                    </div>
                    <button
                      onClick={onGoToLiveAuction}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold px-3 py-2 rounded-xl transition shrink-0 cursor-pointer"
                    >
                      View Live Arena
                    </button>
                  </div>
                )}

                {loggedInPlayer.status === 'unsold' && (
                  <div className="mt-3 bg-rose-950/60 border border-rose-500/50 rounded-2xl p-4">
                    <span className="text-rose-400 font-bold text-xs">
                      Status: Unsold in First Round
                    </span>
                    <p className="text-xs text-slate-300 mt-1">
                      You are in the Accelerator round. Teams can draft you in the second round of bidding!
                    </p>
                  </div>
                )}

              </div>

              {/* Bids Logged for this Player */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-white">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                  <History className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Bids Placed For You ({loggedInPlayer.bidHistory?.length || 0})
                  </h4>
                </div>

                {loggedInPlayer.bidHistory && loggedInPlayer.bidHistory.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {loggedInPlayer.bidHistory.map((b, idx) => (
                      <div key={b.id || idx} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl text-xs border border-slate-800">
                        <span className="font-semibold text-white">{b.teamName}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">₹{b.amount.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-500">{b.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No bids recorded yet. Bids will appear here in real time when your lot is called!
                  </p>
                )}
              </div>

            </div>

          </div>

          {/* MATCH FIXTURES: "MATCH KAB HAI, KISKE SATH HAI" */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">
                  Match Kab Hai, Kiske Sath Hai?
                </span>
                <h3 className="text-xl font-black font-['Outfit']">
                  {playerTeam ? `${playerTeam.name} Matches Schedule` : 'Star City Box League Schedule'}
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Official Fixtures & Venues
              </span>
            </div>

            {/* If player is sold to a team, show their team's direct fixtures first! */}
            {playerTeam && playerFixtures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playerFixtures.map((f) => {
                  const opponentName = f.team1Id === playerTeam.id ? f.team2Name : f.team1Name;
                  return (
                    <div 
                      key={f.id} 
                      className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 hover:border-amber-400 transition"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-amber-400 font-bold">
                          Match #{f.matchNumber} • {f.stage}
                        </span>
                        <span className="text-emerald-400 font-semibold">{f.status}</span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <span className="font-extrabold text-sm text-white">{playerTeam.name}</span>
                        <span className="text-xs font-bold text-amber-400 px-2">VS</span>
                        <span className="font-extrabold text-sm text-slate-300">{opponentName}</span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-900 text-xs text-slate-400 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>Date: <strong className="text-white">{f.date}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Time: <strong className="text-white">{f.time}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span className="truncate">Venue: <strong className="text-white">{f.venue}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                {playerTeam ? 'No matches scheduled yet for your team.' : 'Once you are drafted by a team in the live auction, your personal match schedule and team squad will automatically be mapped here!'}
              </div>
            )}

            {/* Team Squad Members List */}
            {playerTeam && teamSquad.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-800">
                <h4 className="text-sm font-extrabold text-amber-400 mb-3 uppercase tracking-wide">
                  Your Squad Teammates ({playerTeam.name})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {teamSquad.map((tm) => (
                    <div key={tm.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5">
                      <img src={tm.photoUrl} alt={tm.name} className="w-9 h-9 rounded-lg object-cover border border-amber-400" />
                      <div className="truncate">
                        <span className="font-bold text-xs text-white block truncate">{tm.name}</span>
                        <span className="text-[10px] text-slate-400 block">{tm.role} • #{tm.tshirtNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
