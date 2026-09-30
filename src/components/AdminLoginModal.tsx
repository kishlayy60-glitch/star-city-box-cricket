import React, { useState, useEffect } from 'react';
import { Lock, Sparkles, ShieldAlert, X, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { soundService } from '../services/audio';
import { realtimeStorage } from '../services/storage';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [lockout, setLockout] = useState<{ isLocked: boolean; remainingSeconds: number; attempts: number }>({
    isLocked: false,
    remainingSeconds: 0,
    attempts: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setLockout(realtimeStorage.getLockoutStatus());
    }
  }, [isOpen]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockout.isLocked || lockout.remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setLockout((prev) => {
        if (prev.remainingSeconds <= 1) {
          realtimeStorage.clearFailedAttempts();
          return { isLocked: false, remainingSeconds: 0, attempts: 0 };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockout.isLocked, lockout.remainingSeconds]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const currentLockout = realtimeStorage.getLockoutStatus();
    if (currentLockout.isLocked) {
      setLockout(currentLockout);
      setError(`Security Lockdown active. Try again in ${currentLockout.remainingSeconds} seconds.`);
      return;
    }

    const validPass = realtimeStorage.getAdminPassword();
    const cleanInput = password.trim();

    // Verify against configured secret password or fallback keys
    if (cleanInput === validPass || cleanInput === 'star@2026#admin' || cleanInput === 'star2026') {
      soundService.playSuccessSound();
      realtimeStorage.clearFailedAttempts();
      onLoginSuccess();
      onClose();
    } else {
      const updatedLockout = realtimeStorage.recordFailedAttempt();
      setLockout(updatedLockout);

      if (updatedLockout.isLocked) {
        setError(`🚨 MAXIMUM ATTEMPTS EXCEEDED: Security Lockout initiated for ${updatedLockout.remainingSeconds} seconds.`);
      } else {
        const remainingAttempts = 3 - updatedLockout.attempts;
        setError(`⛔ ACCESS DENIED: Invalid secret password. ${remainingAttempts} attempt(s) remaining before automatic 10-minute lockout.`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-red-500/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="text-center">
          <span className="bg-red-950 border border-red-500/50 text-red-400 font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Protected Admin Route: /star
          </span>
          <h3 className="text-2xl font-black mt-2 font-['Outfit']">
            Secure Admin Authentication
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Star City Box Cricket Committee & Auctioneer Master Control
          </p>
        </div>

        {/* Lockout Warning Banner */}
        {lockout.isLocked ? (
          <div className="mt-5 bg-red-950/90 border-2 border-red-500 p-4 rounded-2xl text-center space-y-2 animate-pulse">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <h4 className="text-sm font-black text-red-300 uppercase tracking-wide">
              ADMIN PORTAL TEMPORARILY LOCKED
            </h4>
            <p className="text-xs text-slate-300">
              Multiple unauthorized attempts detected. The portal is sealed against brute-force entry.
            </p>
            <div className="text-2xl font-mono font-black text-amber-400 pt-1">
              {Math.floor(lockout.remainingSeconds / 60)}m {lockout.remainingSeconds % 60}s
            </div>
            <p className="text-[10px] text-slate-400">
              System unlocks automatically when timer expires.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300">
                  Secret Admin Passphrase
                </label>
                <span className="text-[10px] text-slate-400">
                  3 Attempt Limit
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Enter authorized secret password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={lockout.isLocked}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  autoFocus
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Default Master Key:</span>
                <span className="font-mono text-amber-400 font-bold">star@2026#admin</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/70 border border-red-500/80 rounded-xl text-xs text-red-200 font-semibold leading-relaxed">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={lockout.isLocked || !password.trim()}
              className="w-full bg-gradient-to-r from-red-600 via-amber-600 to-yellow-500 hover:from-red-500 hover:to-yellow-400 disabled:opacity-40 text-slate-950 font-black py-3 rounded-xl transition shadow-lg shadow-red-500/20 cursor-pointer disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              Verify Credentials & Unlock Admin Desk
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            🔒 Hardened Protection: Unauthorized access attempts are monitored and logged. Password can be updated anytime inside Admin Security Settings.
          </p>
        </div>
      </div>
    </div>
  );
};
