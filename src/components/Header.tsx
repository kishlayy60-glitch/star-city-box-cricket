import React from 'react';
import { Trophy, Gavel, Calendar, UserCheck, Shield, Sparkles, Radio } from 'lucide-react';
import { AuctionState } from '../types/cricket';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  auctionState: AuctionState;
  isAdminLoggedIn: boolean;
  onAdminClick: () => void;
  captainTeamName?: string | null;
  onCaptainLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  auctionState,
  isAdminLoggedIn,
  onAdminClick,
  captainTeamName,
  onCaptainLogout,
}) => {
  return (
    <header className="bg-slate-950 text-white border-b border-amber-500/30 sticky top-0 z-40 shadow-2xl backdrop-blur-md">
      {/* Top News & Ticker Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 font-bold px-4 py-1 text-xs sm:text-sm flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider animate-pulse">
            <Radio className="w-3 h-3" /> LIVE
          </span>
          <span className="truncate">
            🏆 STAR CITY BOX CRICKET LEAGUE 2026-27 • "Same Ground New Champions" • Registration Open!
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs">
          {auctionState.isActive && auctionState.currentLeadingTeamName ? (
            <span className="bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/40 hidden sm:inline-block">
              Top Bid: <span className="text-white font-extrabold">₹{auctionState.currentBid.toLocaleString()}</span> by {auctionState.currentLeadingTeamName}
            </span>
          ) : (
            <span className="hidden sm:inline-block text-slate-900 font-medium">
              Good Players Win Matches, Great Teams Win Leagues
            </span>
          )}

          {/* Secret / Unique Admin Link */}
          <button
            onClick={onAdminClick}
            className="flex items-center gap-1 text-[11px] font-semibold bg-slate-900 text-amber-400 hover:text-white hover:bg-slate-800 px-2 py-0.5 rounded border border-amber-500/40 transition-colors"
            title="Admin Login Portal (/star)"
          >
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>/star {isAdminLoggedIn ? 'Admin Panel' : 'Admin'}</span>
          </button>
        </div>
      </div>

      {/* Main Brand Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo and Tournament Title */}
        <div 
          onClick={() => setCurrentTab('register')}
          className="flex items-center gap-3.5 cursor-pointer group"
        >
          <div className="relative">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform border border-amber-300/40">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-slate-950" />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-red-600 text-[10px] text-white font-extrabold px-1.5 py-0.2 rounded-full border border-white">
              26-27
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-extrabold">
                Official Tournament Portal
              </span>
              <span className="bg-blue-600/30 text-blue-300 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/30">
                BOX CRICKET
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white font-['Outfit']">
              STAR CITY <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">BOX CRICKET LEAGUE</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Same Ground New Champions • Play • Bid • Build • Win
            </p>
          </div>
        </div>

        {/* Quick status badge & Captain indicator if logged in */}
        {captainTeamName && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-900/60 to-purple-900/60 border border-blue-400/40 px-3 py-1.5 rounded-xl">
            <Shield className="w-4 h-4 text-amber-400" />
            <div className="text-xs">
              <span className="text-slate-400 block text-[10px]">Captain Logged In:</span>
              <span className="font-bold text-white">{captainTeamName}</span>
            </div>
            <button
              onClick={onCaptainLogout}
              className="ml-2 text-[10px] text-red-400 hover:text-red-300 underline"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-900/90 border-t border-slate-800/80 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-1 sm:gap-2 py-2">
          <button
            onClick={() => setCurrentTab('register')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              currentTab === 'register'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Player Registration</span>
          </button>

          <button
            onClick={() => setCurrentTab('live-auction')}
            className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              currentTab === 'live-auction'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Gavel className="w-4 h-4 text-amber-400" />
            <span>Live Auction Arena</span>
            {auctionState.isActive && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute top-2 right-1.5" />
            )}
          </button>

          <button
            onClick={() => setCurrentTab('my-profile')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              currentTab === 'my-profile'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>My Profile & Bids</span>
          </button>

          <button
            onClick={() => setCurrentTab('schedule')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              currentTab === 'schedule'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Matches & Squads</span>
          </button>

          <button
            onClick={() => setCurrentTab('captain')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              currentTab === 'captain'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                : 'text-blue-300 hover:text-white hover:bg-slate-800 border border-blue-500/30'
            }`}
          >
            <Shield className="w-4 h-4 text-yellow-400" />
            <span>Captain Bidding</span>
          </button>

          {isAdminLoggedIn && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                currentTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-amber-400 hover:text-white hover:bg-slate-800 border border-amber-500/40'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
