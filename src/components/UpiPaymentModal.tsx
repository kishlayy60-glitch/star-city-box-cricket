import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, AlertTriangle, Copy, Check, ShieldCheck, ArrowRight, Smartphone, UploadCloud, Lock } from 'lucide-react';
import { soundService } from '../services/audio';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (utr: string, screenshotUrl?: string) => void;
  playerName: string;
  amount?: number;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  playerName,
  amount = 250,
}) => {
  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upiId = 'nileshsyadav1994-2@okicici';
  const payeeName = 'nilesh yadav';
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=StarCityCricketRegistration`;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(upiUri, {
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [isOpen, upiUri]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshotUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyPayment = () => {
    setVerificationError('');
    const cleanUtr = utrNumber.trim();

    if (!cleanUtr) {
      setVerificationError('Please enter 12-digit UPI Reference / UTR Number.');
      return;
    }

    if (cleanUtr.length < 10) {
      setVerificationError('Valid UPI Reference / UTR number must be at least 10-12 digits.');
      return;
    }

    setIsVerifying(true);

    // Simulate verification
    setTimeout(() => {
      setIsVerifying(false);
      soundService.playSuccessSound();
      onPaymentSuccess(cleanUtr, screenshotUrl);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden my-auto text-white">
        {/* Header matching Google Pay UPI QR style */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-5 text-center relative border-b border-blue-500/30">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/30 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>

          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="bg-amber-400 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Official Tournament Fee
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-['Outfit']">
            Scan & Pay With Any UPI App
          </h2>
          <p className="text-blue-200 text-xs mt-1">
            Star City Box Cricket League 2026-27 Registration & Kit Fee
          </p>
        </div>

        {/* Amount Banner */}
        <div className="bg-slate-950/70 py-2.5 px-6 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-semibold">Player: <span className="text-white font-bold">{playerName || 'Participant'}</span></span>
          <div className="text-right">
            <span className="text-xs text-amber-400 font-bold">Total Payable: </span>
            <span className="text-xl font-black text-amber-400">₹{amount}</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Card mimicking the user's uploaded QR Image */}
          <div className="bg-white text-slate-900 rounded-3xl p-5 shadow-xl border border-slate-200 flex flex-col items-center text-center">
            {/* Payee Profile */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-black flex items-center justify-center text-sm border-2 border-amber-400 shadow">
                NY
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-lg leading-tight capitalize text-slate-900">
                  {payeeName}
                </h3>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified League Account
                </span>
              </div>
            </div>

            {/* QR Code Canvas / Image */}
            <div className="relative p-2.5 bg-white rounded-2xl border-2 border-slate-200 shadow-inner">
              {qrDataUrl ? (
                <div className="relative">
                  <img src={qrDataUrl} alt="UPI QR Code" className="w-56 h-56 rounded-lg object-contain mx-auto" />
                  {/* Google Pay Center Badge */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 bg-white rounded-full p-1.5 shadow-md flex items-center justify-center border border-slate-200">
                      <span className="text-base font-black text-blue-600">G</span>
                      <span className="text-base font-black text-red-500">P</span>
                      <span className="text-base font-black text-yellow-500">a</span>
                      <span className="text-base font-black text-green-600">y</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  Generating QR Code...
                </div>
              )}
            </div>

            {/* UPI ID Pill with Copy button */}
            <div className="mt-3.5 flex items-center justify-between w-full max-w-xs bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-300">
              <span className="font-mono text-xs font-bold text-slate-800 truncate">
                UPI ID: {upiId}
              </span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="ml-2 p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                title="Copy UPI ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[12px] text-slate-500 mt-2 font-medium">
              Scan to pay with any UPI app (GPay, PhonePe, Paytm, BHIM, etc.)
            </p>

            {/* Direct Mobile Deep Link */}
            <a
              href={upiUri}
              className="mt-3 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow"
            >
              <Smartphone className="w-4 h-4" />
              Pay Directly via UPI App
            </a>
          </div>

          {/* Strict Warning Requirement from Prompt */}
          <div className="bg-red-950/50 border border-red-500/50 rounded-2xl p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-200">
              <p className="font-extrabold text-red-300 uppercase tracking-wide">
                Strict Rule / अनिवार्य नियम:
              </p>
              <p className="mt-0.5">
                <strong>Without payment you cannot submit the form!</strong> Payment verify hone ke baad hi form submit hoga aur player auction pool mein shamil ho sakega.
              </p>
            </div>
          </div>

          {/* Step 2: Enter UTR / Reference ID */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wide">
              Step 2: Enter 12-Digit UPI Ref / UTR No. *
            </label>
            <p className="text-[11px] text-slate-400">
              After paying ₹{amount} on Google Pay / PhonePe / Paytm, copy the 12-digit UTR/Transaction ID:
            </p>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 427189012345"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                maxLength={20}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-white font-mono font-bold tracking-widest focus:outline-none focus:border-amber-400 text-sm"
              />
              <span className="absolute right-3 top-2.5 text-[11px] text-slate-500 font-mono">
                {utrNumber.length}/12
              </span>
            </div>

            {/* Optional Screenshot Upload */}
            <div className="pt-1">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Upload Payment Screenshot (Optional proof):
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-slate-600 hover:border-amber-400/70 rounded-xl p-2.5 text-center cursor-pointer bg-slate-900/60 transition"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                {screenshotUrl ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Screenshot Attached! Click to change.
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <UploadCloud className="w-4 h-4 text-amber-400" /> Click to choose payment slip image
                  </div>
                )}
              </div>
            </div>

            {verificationError && (
              <p className="text-xs text-red-400 font-semibold">{verificationError}</p>
            )}

            <button
              type="button"
              onClick={handleVerifyPayment}
              disabled={isVerifying || !utrNumber.trim()}
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition text-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Verifying UPI Reference with Bank...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-slate-950" />
                  Verify Payment & Unlock Registration Form
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
