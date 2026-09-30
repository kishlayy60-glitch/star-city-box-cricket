import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PlayerRegistrationForm } from './components/PlayerRegistrationForm';
import { LiveAuctionArena } from './components/LiveAuctionArena';
import { PlayerProfileDashboard } from './components/PlayerProfileDashboard';
import { TournamentSchedule } from './components/TournamentSchedule';
import { CaptainBiddingPortal } from './components/CaptainBiddingPortal';
import { AdminPortal } from './components/AdminPortal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { FinalReportModal } from './components/FinalReportModal';
import { realtimeStorage } from './services/storage';
import { AuctionState, MatchFixture, Player, Team } from './types/cricket';
import { soundService } from './services/audio';
import { Trophy, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('register');
  const [players, setPlayers] = useState<Player[]>(() => realtimeStorage.getPlayers());
  const [teams, setTeams] = useState<Team[]>(() => realtimeStorage.getTeams());
  const [fixtures, setFixtures] = useState<MatchFixture[]>(() => realtimeStorage.getFixtures());
  const [auctionState, setAuctionState] = useState<AuctionState>(() => realtimeStorage.getAuctionState());

  // Admin Auth
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Captain Auth
  const [loggedInCaptainTeamId, setLoggedInCaptainTeamId] = useState<string | null>(null);

  // Profile Tracker Target
  const [activeProfileMobile, setActiveProfileMobile] = useState<string>('');

  // Final Report
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Check URL path or hash for `/star` admin route as requested
  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.includes('/star') || hash.includes('star')) {
        if (!isAdminLoggedIn) {
          setIsAdminModalOpen(true);
        } else {
          setCurrentTab('admin');
        }
      }
    };

    checkPath();
    window.addEventListener('popstate', checkPath);
    return () => window.removeEventListener('popstate', checkPath);
  }, [isAdminLoggedIn]);

  // Subscribe to real-time storage & cross-tab events
  useEffect(() => {
    const unsubscribe = realtimeStorage.subscribe(() => {
      setPlayers([...realtimeStorage.getPlayers()]);
      setTeams([...realtimeStorage.getTeams()]);
      setFixtures([...realtimeStorage.getFixtures()]);
      setAuctionState({ ...realtimeStorage.getAuctionState() });
    });

    return () => unsubscribe();
  }, []);

  // Auction Timer Ticking Engine (Admin driven for multi-device sync)
  useEffect(() => {
    if (!auctionState.isActive || auctionState.auctionPhase === 'SOLD' || auctionState.auctionPhase === 'UNSOLD') {
      return;
    }

    // Only run the clock update interval if admin is active or local coordinator
    const interval = setInterval(() => {
      const current = realtimeStorage.getAuctionState();
      if (!current.isActive || current.timerSeconds <= 0) return;

      const newSeconds = current.timerSeconds - 1;
      let newPhase = current.auctionPhase;

      if (newSeconds <= 5 && newSeconds > 0) {
        soundService.playTick();
      }

      if (newSeconds === 15 && current.auctionPhase === 'BIDDING') {
        newPhase = 'GOING_ONCE';
      } else if (newSeconds === 7 && (current.auctionPhase === 'GOING_ONCE' || current.auctionPhase === 'BIDDING')) {
        newPhase = 'GOING_TWICE';
      }

      const updated = {
        ...current,
        timerSeconds: newSeconds,
        auctionPhase: newPhase,
      };

      if (isAdminLoggedIn) {
        realtimeStorage.saveAuctionState(updated);
      }
      setAuctionState(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, [isAdminLoggedIn, auctionState.isActive, auctionState.auctionPhase]);

  // Navigation handlers
  const handleAdminClick = () => {
    if (isAdminLoggedIn) {
      setCurrentTab('admin');
      window.history.pushState(null, '', '/star');
    } else {
      setIsAdminModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setCurrentTab('admin');
    window.history.pushState(null, '', '/star');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentTab('register');
    window.history.pushState(null, '', '/');
  };

  const handleGoToProfile = (mobile: string) => {
    setActiveProfileMobile(mobile);
    setCurrentTab('my-profile');
  };

  const captainTeam = teams.find((t) => t.id === loggedInCaptainTeamId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Outfit'] antialiased selection:bg-amber-400 selection:text-slate-950">
      
      {/* Main Global Header with /star unique route link */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'admin') {
            window.history.pushState(null, '', '/');
          } else {
            window.history.pushState(null, '', '/star');
          }
        }}
        auctionState={auctionState}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminClick={handleAdminClick}
        captainTeamName={captainTeam ? captainTeam.name : null}
        onCaptainLogout={() => setLoggedInCaptainTeamId(null)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentTab === 'register' && (
          <PlayerRegistrationForm
            onSuccess={() => {
              setPlayers(realtimeStorage.getPlayers());
            }}
            onViewProfile={handleGoToProfile}
          />
        )}

        {currentTab === 'live-auction' && (
          <LiveAuctionArena
            auctionState={auctionState}
            players={players}
            teams={teams}
            loggedInCaptainTeamId={loggedInCaptainTeamId}
            onOpenCaptainLogin={() => setCurrentTab('captain')}
            onOpenAdmin={handleAdminClick}
          />
        )}

        {currentTab === 'my-profile' && (
          <PlayerProfileDashboard
            players={players}
            teams={teams}
            fixtures={fixtures}
            initialMobile={activeProfileMobile}
            onGoToLiveAuction={() => setCurrentTab('live-auction')}
          />
        )}

        {currentTab === 'schedule' && (
          <TournamentSchedule
            fixtures={fixtures}
            teams={teams}
            players={players}
          />
        )}

        {currentTab === 'captain' && (
          <CaptainBiddingPortal
            teams={teams}
            players={players}
            auctionState={auctionState}
            loggedInTeamId={loggedInCaptainTeamId}
            onCaptainLogin={(teamId) => {
              setLoggedInCaptainTeamId(teamId);
            }}
            onCaptainLogout={() => setLoggedInCaptainTeamId(null)}
            onGoToLiveStage={() => setCurrentTab('live-auction')}
          />
        )}

        {currentTab === 'admin' && isAdminLoggedIn && (
          <AdminPortal
            players={players}
            teams={teams}
            fixtures={fixtures}
            auctionState={auctionState}
            onOpenReport={() => setIsReportOpen(true)}
            onLogoutAdmin={handleAdminLogout}
            onGoToLiveArena={() => setCurrentTab('live-auction')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              ★
            </div>
            <span className="font-bold text-slate-400">
              STAR CITY BOX CRICKET LEAGUE 2026-27 • "Same Ground New Champions"
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (confirm('Reset tournament data to defaults?')) {
                  realtimeStorage.resetAllData();
                  setPlayers(realtimeStorage.getPlayers());
                  setTeams(realtimeStorage.getTeams());
                  setFixtures(realtimeStorage.getFixtures());
                  setAuctionState(realtimeStorage.getAuctionState());
                }
              }}
              className="text-slate-500 hover:text-amber-400 flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3 h-3" /> Reset Demo Data
            </button>

            <button
              onClick={handleAdminClick}
              className="text-amber-500 hover:text-amber-400 font-semibold"
            >
              Admin Login (/star)
            </button>
          </div>
        </div>
      </footer>

      {/* Admin Login Dialog */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Final Report Modal */}
      <FinalReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        players={players}
        teams={teams}
        fixtures={fixtures}
      />

    </div>
  );
}
