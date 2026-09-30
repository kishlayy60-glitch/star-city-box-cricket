import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  User, Calendar, Phone, Shirt, Sparkles, Upload, 
  CheckCircle2, AlertCircle, Lock, ShieldCheck, ArrowRight, Eye
} from 'lucide-react';
import { BatsmanStyle, BowlingStyle, Player, PlayerRole, TShirtSize } from '../types/cricket';
import { realtimeStorage } from '../services/storage';
import { soundService } from '../services/audio';
import { UpiPaymentModal } from './UpiPaymentModal';

interface PlayerRegistrationFormProps {
  onSuccess: (newPlayer: Player) => void;
  onViewProfile: (mobile: string) => void;
}

export const PlayerRegistrationForm: React.FC<PlayerRegistrationFormProps> = ({
  onSuccess,
  onViewProfile,
}) => {
  // Form State
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [mobile, setMobile] = useState('');
  const [tshirtName, setTshirtName] = useState('');
  const [tshirtSize, setTshirtSize] = useState<TShirtSize>('L');
  const [tshirtNumber, setTshirtNumber] = useState('07');
  const [batsmanStyle, setBatsmanStyle] = useState<BatsmanStyle>('Right Hand');
  const [bowlingStyle, setBowlingStyle] = useState<BowlingStyle>('Right Arm Fast');
  const [role, setRole] = useState<PlayerRole>('All-Rounder');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Payment Gate State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [paymentUtr, setPaymentUtr] = useState('');
  const [registeredPlayer, setRegisteredPlayer] = useState<Player | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSuccess = (utr: string) => {
    setPaymentUtr(utr);
    setIsPaymentVerified(true);
    setIsPaymentModalOpen(false);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isPaymentVerified || !paymentUtr) {
      setErrorMessage('Without payment you cannot submit the form! Please pay ₹250 via UPI QR code first.');
      setIsPaymentModalOpen(true);
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter Player Full Name.');
      return;
    }
    if (!dob) {
      setErrorMessage('Please select Date of Birth.');
      return;
    }
    if (!mobile.trim() || mobile.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter valid 10-digit Mobile Number.');
      return;
    }
    if (!tshirtName.trim()) {
      setErrorMessage('Please enter Name to be printed on T-Shirt.');
      return;
    }

    const currentPlayers = realtimeStorage.getPlayers();
    const newId = `SCB-2026-${String(currentPlayers.length + 1).padStart(3, '0')}`;

    const newPlayer: Player = {
      id: newId,
      name: name.trim(),
      dob,
      mobile: mobile.trim(),
      tshirtName: tshirtName.trim().toUpperCase(),
      tshirtSize,
      tshirtNumber: tshirtNumber.trim() || '00',
      batsmanStyle,
      bowlingStyle,
      role,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      basePrice: role === 'All-Rounder' ? 2000 : 1500,
      status: 'verified', // Verified because UPI payment is done!
      paymentStatus: 'verified',
      paymentUtr,
      paymentDate: new Date().toISOString().split('T')[0],
      registrationDate: new Date().toISOString().split('T')[0],
      stats: {
        matches: 0,
        runs: 0,
        wickets: 0,
        highestScore: 0,
        strikeRate: 0,
        economy: 0,
        rating: 4,
        isStarPlayer: false,
      },
      bidHistory: [],
    };

    realtimeStorage.addPlayer(newPlayer);
    setRegisteredPlayer(newPlayer);
    soundService.playSuccessSound();

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });

    onSuccess(newPlayer);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
      {/* Success Modal / Banner if just registered */}
      {registeredPlayer && (
        <div className="mb-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 shadow-2xl text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-32 h-32 text-emerald-400" />
          </div>
          <div className="w-16 h-16 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/40">
            Registration Confirmed & Payment Verified
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2 font-['Outfit']">
            Welcome to Star City Box Cricket League, {registeredPlayer.name}!
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-xl mx-auto">
            Your player registration form and payment (UTR: <span className="font-mono text-emerald-400 font-bold">{registeredPlayer.paymentUtr}</span>) have been verified. You are now officially enrolled in the Player Auction Pool!
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-xl border border-emerald-500/30">
            <span className="text-xs text-slate-400">Official Player ID:</span>
            <span className="text-amber-400 font-mono font-black text-base">{registeredPlayer.id}</span>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onViewProfile(registeredPlayer.mobile)}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2 text-sm cursor-pointer"
            >
              <Eye className="w-4 h-4" /> View My Profile & Bid Status
            </button>
            <button
              onClick={() => setRegisteredPlayer(null)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
            >
              Register Another Player
            </button>
          </div>
        </div>
      )}

      {/* POSTER STYLE REGISTRATION CARD - Matched to Image 1 */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-400/80 bg-slate-950">
        
        {/* Poster Top Banner with Star City Branding & Batsman Graphic */}
        <div className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-6 sm:p-8 text-white border-b-4 border-yellow-400 overflow-hidden">
          {/* Background Stadium Glow Elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top League Headers */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left relative z-10">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-amber-400 font-black tracking-widest text-xs uppercase bg-black/40 px-3 py-1 rounded-full border border-amber-400/30">
                  STAR CITY
                </span>
                <span className="text-yellow-300 font-extrabold text-xs">★ ★ ★</span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black italic tracking-tight text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] font-['Outfit']">
                BOX CRICKET LEAGUE
              </h1>
              <div className="inline-block bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black px-4 py-0.5 rounded-md text-base sm:text-lg italic mt-1 shadow">
                2026 - 27
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-amber-400 font-black text-xl italic font-['Outfit']">
                👑 Same Ground
              </div>
              <div className="text-yellow-300 font-black text-2xl italic font-['Outfit'] tracking-wide">
                New Champions
              </div>
            </div>
          </div>

          {/* User Request: In place of "PLAYER AUCTION" graphic, place the Player Photo Upload with banner */}
          <div className="mt-6 pt-6 border-t border-blue-400/30 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              {/* Photo Upload Circle / Frame replacing text as requested */}
              <div 
                onClick={() => photoInputRef.current?.click()}
                className="relative group cursor-pointer"
                title="Click to upload your player photo"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-amber-400 bg-slate-900/90 shadow-xl overflow-hidden flex items-center justify-center group-hover:border-yellow-300 transition-colors">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Player" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2 text-slate-300 group-hover:text-amber-400 transition-colors">
                      <Upload className="w-7 h-7 mx-auto mb-1 text-amber-400 animate-bounce" />
                      <span className="text-[11px] font-black uppercase block leading-tight">Upload Photo</span>
                      <span className="text-[9px] text-slate-400 block">Click here</span>
                    </div>
                  )}
                </div>

                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 p-1.5 rounded-full shadow border-2 border-white">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded">
                    PLAYER PHOTO
                  </span>
                  {photoUrl && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Photo Loaded!
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1 font-['Outfit']">
                  {name || 'Your Name Here'}
                </h3>
                <p className="text-xs text-slate-300 font-medium max-w-xs">
                  {photoUrl ? 'Click image anytime to change photo.' : 'Tap on the photo frame to upload your cricket profile photo.'}
                </p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <span className="text-amber-300 font-bold text-xs uppercase tracking-widest block">
                TEAM BUILDING STARTS HERE
              </span>
              <span className="text-slate-200 text-xs font-semibold">
                PLAY • BID • BUILD • WIN
              </span>
            </div>
          </div>
        </div>

        {/* REGISTRATION FORM BODY - Designed exactly with Image 1 colorful side tabs */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-8 bg-slate-900/95 space-y-4">
          
          {/* URGENT PAYMENT NOTICE BAR */}
          {!isPaymentVerified ? (
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-4 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3 text-left">
                <AlertCircle className="w-8 h-8 text-yellow-200 shrink-0" />
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wide">
                    Mandatory: ₹500 Tournament Registration Fee
                  </h4>
                  <p className="text-xs text-yellow-100 font-medium">
                    Without payment you cannot submit the form! Scan QR code to verify.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="bg-slate-950 hover:bg-black text-amber-400 hover:text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shrink-0 transition shadow border border-amber-400/50 cursor-pointer"
              >
                Scan & Pay ₹500 Now
              </button>
            </div>
          ) : (
            <div className="bg-emerald-950/80 border-2 border-emerald-500 p-4 rounded-2xl text-white shadow flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 shrink-0">
                  <CheckCircle2 className="w-5 h-5 font-black" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-300">
                    Payment Verified: ₹500 Received
                  </h4>
                  <p className="text-xs text-slate-300 font-mono">
                    UTR: {paymentUtr} • Bid Process & Registration Unlocked
                  </p>
                </div>
              </div>
              <span className="bg-emerald-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Ready To Submit
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-900/60 border border-red-500 text-red-200 text-xs p-3 rounded-xl font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Form Fields Styled with colored tabs matching Image 1 */}
          <div className="space-y-3 pt-2">
            
            {/* 1. PLAYER NAME (Blue Tab) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow">
              <div className="sm:w-60 bg-blue-600 text-white font-black text-xs sm:text-sm px-4 py-3 flex items-center gap-2.5 shrink-0 tracking-wide uppercase">
                <User className="w-5 h-5 shrink-0" />
                <span>PLAYER NAME</span>
              </div>
              <div className="flex-1 p-2 sm:p-3">
                <input
                  type="text"
                  required
                  placeholder="Enter full name (e.g. Nilesh Yadav)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* 2. PLAYER DOB (Red Tab) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow">
              <div className="sm:w-60 bg-red-600 text-white font-black text-xs sm:text-sm px-4 py-3 flex items-center gap-2.5 shrink-0 tracking-wide uppercase">
                <Calendar className="w-5 h-5 shrink-0" />
                <span>PLAYER DOB</span>
              </div>
              <div className="flex-1 p-2 sm:p-3">
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* 3. PLAYER MOBILE NO. (Green Tab) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow">
              <div className="sm:w-60 bg-emerald-600 text-white font-black text-xs sm:text-sm px-4 py-3 flex items-center gap-2.5 shrink-0 tracking-wide uppercase">
                <Phone className="w-5 h-5 shrink-0" />
                <span>PLAYER MOBILE NO.</span>
              </div>
              <div className="flex-1 p-2 sm:p-3">
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number (e.g. 9820123456)"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono font-semibold text-sm focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* 4. T-SHIRT NAME (Purple Tab) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow">
              <div className="sm:w-60 bg-purple-600 text-white font-black text-xs sm:text-sm px-4 py-3 flex items-center gap-2.5 shrink-0 tracking-wide uppercase">
                <Shirt className="w-5 h-5 shrink-0" />
                <span>T-SHIRT NAME</span>
              </div>
              <div className="flex-1 p-2 sm:p-3">
                <input
                  type="text"
                  required
                  placeholder="Name to print on back of Jersey (e.g. NILESH)"
                  value={tshirtName}
                  onChange={(e) => setTshirtName(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold tracking-wider text-sm focus:outline-none focus:border-amber-400 placeholder:text-slate-500 uppercase"
                />
              </div>
            </div>

            {/* 5. T-SHIRT SIZE (Orange Tab with XL badge) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow">
              <div className="sm:w-60 bg-orange-600 text-white font-black text-xs sm:text-sm px-4 py-3 flex items-center gap-2.5 shrink-0 tracking-wide uppercase">
                <span className="w-6 h-6 rounded bg-white text-orange-600 flex items-center justify-center font-black text-xs">
                  XL
                </span>
                <span>T-SHIRT SIZE</span>
              </div>
              <div className="flex-1 p-2 sm:p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {(['S', 'M', 'L', 'XL', 'XXL'] as TShirtSize[]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setTshirtSize(size)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                        tshirtSize === size
                          ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. T-SHIRT NO. (Cyan/Teal Tab with 07 badge) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow">
              <div className="sm:w-60 bg-cyan-600 text-white font-black text-xs sm:text-sm px-4 py-3 flex items-center gap-2.5 shrink-0 tracking-wide uppercase">
                <span className="w-6 h-6 rounded bg-white text-cyan-600 flex items-center justify-center font-black text-xs">
                  07
                </span>
                <span>T-SHIRT NO.</span>
              </div>
              <div className="flex-1 p-2 sm:p-3">
                <input
                  type="text"
                  required
                  placeholder="Jersey number (e.g. 07, 18, 99)"
                  value={tshirtNumber}
                  onChange={(e) => setTshirtNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  className="w-full max-w-[140px] bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono font-black text-base focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* 7. BATSMAN STYLE (Indigo/Blue Tab) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow">
              <div className="sm:w-60 bg-blue-700 text-white font-black text-xs sm:text-sm px-4 py-3 flex items-center gap-2.5 shrink-0 tracking-wide uppercase">
                <span className="font-serif font-black text-sm">🏏</span>
                <div>
                  <span className="block leading-tight">Batsman Style</span>
                  <span className="text-[10px] text-blue-200 block font-normal">(Right Hand / Left Hand)</span>
                </div>
              </div>
              <div className="flex-1 p-2 sm:p-3">
                <div className="flex items-center gap-3">
                  {(['Right Hand', 'Left Hand'] as BatsmanStyle[]).map((style) => (
                    <label key={style} className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 hover:border-amber-400 text-xs font-semibold text-white">
                      <input
                        type="radio"
                        name="batsmanStyle"
                        checked={batsmanStyle === style}
                        onChange={() => setBatsmanStyle(style)}
                        className="accent-amber-400 w-4 h-4"
                      />
                      <span>{style}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 8. BOWLING STYLE (Pink/Magenta Tab) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow">
              <div className="sm:w-60 bg-pink-600 text-white font-black text-xs sm:text-sm px-4 py-3 flex items-center gap-2.5 shrink-0 tracking-wide uppercase">
                <span className="text-sm">⚪</span>
                <div>
                  <span className="block leading-tight">Bowling Style</span>
                  <span className="text-[10px] text-pink-200 block font-normal">(Right Arm / Left Arm)</span>
                </div>
              </div>
              <div className="flex-1 p-2 sm:p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {(['Right Arm Fast', 'Right Arm Spin', 'Left Arm Fast', 'Left Arm Spin', 'None'] as BowlingStyle[]).map((style) => (
                    <label key={style} className="flex items-center gap-1.5 cursor-pointer bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 hover:border-amber-400 text-xs font-semibold text-white">
                      <input
                        type="radio"
                        name="bowlingStyle"
                        checked={bowlingStyle === style}
                        onChange={() => setBowlingStyle(style)}
                        className="accent-pink-400 w-3.5 h-3.5"
                      />
                      <span>{style}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 9. PRIMARY ROLE */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow">
              <div className="sm:w-60 bg-yellow-600 text-slate-950 font-black text-xs sm:text-sm px-4 py-3 flex items-center gap-2.5 shrink-0 tracking-wide uppercase">
                <Sparkles className="w-5 h-5 shrink-0" />
                <span>CRICKET ROLE</span>
              </div>
              <div className="flex-1 p-2 sm:p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {(['All-Rounder', 'Batsman', 'Bowler', 'Wicketkeeper'] as PlayerRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                        role === r
                          ? 'bg-amber-400 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Slogan Bar matching Image 1 */}
          <div className="mt-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black italic px-4 py-3 rounded-2xl text-center text-sm sm:text-base tracking-wide shadow-md font-['Outfit']">
            👑 "Good Players Win Matches, Great Teams Win Leagues"
          </div>

          {/* Form Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
            <div>
              {!isPaymentVerified ? (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <Lock className="w-4 h-4 text-red-400" />
                  <span>Submission is locked until ₹250 UPI payment is completed.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Payment verified! Ready to lock your registration in live auction.</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isPaymentVerified ? (
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  Pay ₹250 To Unlock Submit
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black px-8 py-3.5 rounded-xl shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 text-base transition transform hover:-translate-y-0.5 cursor-pointer font-['Outfit']"
                >
                  Submit Official Registration
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

        </form>
      </div>

      {/* UPI Payment Modal */}
      <UpiPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        playerName={name}
        amount={250}
      />
    </div>
  );
};
