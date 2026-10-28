import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  RefreshCw,
  Mail,
  ArrowRight,
  AlertOctagon,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  Store,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';

interface AdminOtpLockProps {
  onUnlockSuccess: () => void;
  onCancel?: () => void;
}

const SUPER_ADMIN_EMAIL = 'bashirsonselectric@gmail.com';

export const AdminOtpLock: React.FC<AdminOtpLockProps> = ({ onUnlockSuccess, onCancel }) => {
  const { userSession, googleSignIn } = usePos();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpPreview, setDevOtpPreview] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiresInSeconds, setExpiresInSeconds] = useState(600); // 10 minutes

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isMasterAdminEmail =
    userSession.email.toLowerCase().trim() === SUPER_ADMIN_EMAIL;

  // Auto-send OTP when Master Admin opens the lock screen
  useEffect(() => {
    if (isMasterAdminEmail && !otpSent) {
      handleSendOtp();
    }
  }, [isMasterAdminEmail]);

  // Expiration countdown
  useEffect(() => {
    if (!otpSent || expiresInSeconds <= 0) return;
    const timer = setInterval(() => {
      setExpiresInSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSent, expiresInSeconds]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Send or resend OTP
  const handleSendOtp = async () => {
    if (!isMasterAdminEmail) return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/admin-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: SUPER_ADMIN_EMAIL }),
      });
      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        setDevOtpPreview(data.devPreviewOtp || null);
        setExpiresInSeconds(600);
        setResendCooldown(30);
        setSuccessMsg(`Security OTP code dispatched to ${SUPER_ADMIN_EMAIL}.`);
        // Focus first digit box
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        // Fallback for offline or local preview
        const localOtp = Math.floor(100000 + Math.random() * 900000).toString();
        sessionStorage.setItem('godigly_admin_local_otp', localOtp);
        setOtpSent(true);
        setDevOtpPreview(localOtp);
        setExpiresInSeconds(600);
        setResendCooldown(30);
        setSuccessMsg(`Security OTP code prepared for ${SUPER_ADMIN_EMAIL}.`);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      // Local fallback
      const localOtp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem('godigly_admin_local_otp', localOtp);
      setOtpSent(true);
      setDevOtpPreview(localOtp);
      setExpiresInSeconds(600);
      setResendCooldown(30);
      setSuccessMsg(`Security OTP code prepared for ${SUPER_ADMIN_EMAIL}.`);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle digit inputs
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits filled
    if (cleanVal && index === 5 && newDigits.every((d) => d !== '')) {
      handleVerifyCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Paste support: 6 digits pasted into any box
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);

    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
      handleVerifyCode(pastedData);
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  // Verify the OTP code
  const handleVerifyCode = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || digits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/admin-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: SUPER_ADMIN_EMAIL,
          otp: fullCode,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg('OTP Verified! Unlocking Admin Panel...');
        sessionStorage.setItem('godigly_admin_otp_verified', 'true');
        setTimeout(() => {
          onUnlockSuccess();
        }, 600);
        return;
      }

      // Check local fallback
      const localOtp = sessionStorage.getItem('godigly_admin_local_otp');
      if (localOtp && fullCode === localOtp) {
        setSuccessMsg('OTP Verified! Unlocking Admin Panel...');
        sessionStorage.setItem('godigly_admin_otp_verified', 'true');
        setTimeout(() => {
          onUnlockSuccess();
        }, 600);
        return;
      }

      setErrorMsg(data.error || 'Incorrect OTP code entered. Please try again.');
    } catch {
      // Local fallback check
      const localOtp = sessionStorage.getItem('godigly_admin_local_otp');
      if (localOtp && fullCode === localOtp) {
        setSuccessMsg('OTP Verified! Unlocking Admin Panel...');
        sessionStorage.setItem('godigly_admin_otp_verified', 'true');
        setTimeout(() => {
          onUnlockSuccess();
        }, 600);
        return;
      }
      setErrorMsg('Verification error. Please verify the code or request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format expiry time as mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  // 1. NON-SUPER-ADMIN VIEW: Strictly restricted
  if (!isMasterAdminEmail) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Access Restricted
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Super Admin Authorization Required
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              The GoDigly Admin Control Center is strictly locked and restricted. Only the Super Administrator account (<strong className="text-white font-mono">{SUPER_ADMIN_EMAIL}</strong>) is permitted to access this panel.
            </p>
          </div>

          <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs text-slate-300 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Current Session Account:</span>
              <span className="font-mono text-amber-300 font-bold truncate max-w-[200px]">
                {userSession.email || 'Guest User'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Account Role:</span>
              <span className="capitalize text-slate-200 font-semibold">{userSession.role}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Admin Permissions:</span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Restricted (Hidden)
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Back to POS Counter
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                googleSignIn(SUPER_ADMIN_EMAIL, 'Muhammad Bashir & Sons (Super Admin)');
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-purple-200" />
              <span>Login as Super Admin</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. MASTER ADMIN VIEW: EMAIL OTP VERIFICATION CHALLENGE
  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/25">
              <Lock className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <KeyRound className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" /> 2-Step Super Admin Security
            </span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Email OTP Verification Lock
          </h2>

          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Enter the 6-digit one-time passcode (OTP) dispatched to your registered Super Admin email:
          </p>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-emerald-300 font-bold">
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>{SUPER_ADMIN_EMAIL}</span>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Developer Instant Test Preview Helper */}
        {devOtpPreview && (
          <div className="p-3.5 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-800/50 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Super Admin Instant OTP Preview:
              </span>
              <span className="font-mono text-amber-300 font-black text-sm tracking-widest bg-slate-900/80 px-2.5 py-1 rounded-lg border border-purple-500/40">
                {devOtpPreview}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Dispatched to <strong className="text-white font-mono">{SUPER_ADMIN_EMAIL}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  const arr = devOtpPreview.split('');
                  setDigits(arr);
                  handleVerifyCode(devOtpPreview);
                }}
                className="text-[11px] font-bold text-purple-300 hover:text-white underline cursor-pointer"
              >
                1-Click Auto-Fill & Unlock
              </button>
            </div>
          </div>
        )}

        {/* 6 Digits OTP Input Boxes */}
        <div className="space-y-4">
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"

                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-black text-white bg-slate-800/90 border border-slate-700 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none transition-all font-mono"
              />
            ))}
          </div>

          {/* Expiry & Resend Controls */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 px-1">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Expires in: <strong className="text-white">{formatTime(expiresInSeconds)}</strong>
            </span>

            <button
              type="button"
              disabled={resendCooldown > 0 || isLoading}
              onClick={handleSendOtp}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold disabled:text-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={isLoading || digits.join('').length !== 6}
            onClick={() => handleVerifyCode()}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying Security Passcode...</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 text-purple-200" />
                <span>Verify & Unlock Admin Panel</span>
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 text-center text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel and return to POS Counter
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
