import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { BusinessVertical } from '../../types';
import { VERTICALS_CONFIG } from '../../data/defaultData';
import { auth, SUPER_ADMIN_EMAIL, FIREBASE_AUTH_SETTINGS_URL } from '../../lib/firebase';
import { offlineDb } from '../../lib/offlineDb';
import {
  safeJsonFetch,
  loginLocalFallbackAccount,
  registerLocalFallbackAccount,
} from '../../lib/safeFetch';
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  Store,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  KeyRound,
  Moon,
  Sun,
  Copy,
  ExternalLink,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const {
    setUserSession,
    businessAccounts,
    registerBusinessAccount,
    switchBusinessAccount,
    staffAccounts,
    firebaseSignInWithGoogle,
    theme,
    toggleTheme,
    logActivity,
  } = usePos();

  const [mode, setMode] = useState<'signin' | 'signup' | 'staff' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [vertical, setVertical] = useState<BusinessVertical>('electrical_hardware');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isUnauthorizedDomainError = Boolean(
    error && (error.includes('not authorized for Firebase Auth') || error.includes('unauthorized-domain'))
  );

  const handleCopyDomain = async () => {
    if (!currentHostname) return;
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    } catch {
      // Clipboard API may be restricted in some frames
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await firebaseSignInWithGoogle();
      if (!res.success) {
        setError(res.message || 'Google Sign-In could not be completed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your account email address.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccess(`Password reset link sent to ${cleanEmail}. Check your inbox.`);
    } catch (err: any) {
      setError(
        err?.code === 'auth/user-not-found'
          ? 'No account found with that email address.'
          : 'If your account uses Google Sign-In, click "Continue with Google" to access your stores.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      // 1. Staff Counter Sign-In (Role-Scoped to Employer's Store)
      if (mode === 'staff') {
        const staffAcc = staffAccounts.find(
          (s) => s.email.toLowerCase().trim() === normalizedEmail
        );
        if (!staffAcc || staffAcc.password !== password) {
          throw new Error('Invalid staff credentials. Please verify with your store manager.');
        }

        setUserSession({
          email: staffAcc.email,
          displayName: staffAcc.name,
          role: staffAcc.role,
          storeId: 'biz-1',
          isGoogleSignedIn: false,
          isAuthenticated: true,
          permissions: {
            canDiscount: staffAcc.role === 'manager' || staffAcc.role === 'admin',
            canEditPrices: staffAcc.role === 'manager' || staffAcc.role === 'admin',
            canAccessAdmin: staffAcc.role === 'admin',
            canManageStock: staffAcc.role !== 'cashier',
            canViewProfit: staffAcc.role === 'admin' || staffAcc.role === 'manager',
            canGiveUdhar: staffAcc.role !== 'cashier',
          },
        });
        localStorage.setItem('apna_pos_onboarded', 'true');
        logActivity('auth', 'Staff Counter Login', `${staffAcc.name} (${staffAcc.role}) logged in`);
        return;
      }

      // 2. Merchant Sign-In (Firebase Email/Password -> Server Verified -> Offline Cached Session)
      if (mode === 'signin') {
        if (!normalizedEmail || !password) {
          throw new Error('Please enter both your email address and password.');
        }

        // Offline verified session continuity
        if (!navigator.onLine) {
          const cached = await offlineDb.getCachedSession(normalizedEmail);
          if (cached) {
            const matchedBiz = businessAccounts.find(
              (b) => b.ownerEmail.toLowerCase().trim() === normalizedEmail
            );
            if (matchedBiz) switchBusinessAccount(matchedBiz.id, matchedBiz);
            setUserSession({
              email: cached.email,
              displayName: cached.displayName,
              photoURL: cached.photoURL,
              role: cached.role === 'admin' || cached.email === SUPER_ADMIN_EMAIL ? 'admin' : 'admin',
              storeId: matchedBiz?.id || cached.activeStoreId || 'biz-1',
              isGoogleSignedIn: false,
              isAuthenticated: true,
              permissions: {
                canDiscount: true,
                canEditPrices: true,
                canAccessAdmin: cached.email === SUPER_ADMIN_EMAIL,
                canManageStock: true,
                canViewProfit: true,
                canGiveUdhar: true,
              },
            });
            localStorage.setItem('apna_pos_onboarded', 'true');
            return;
          }
          throw new Error('You are offline and this account has not signed in on this device yet.');
        }

        // Attempt Firebase Email/Password sign-in first (if enabled on project)
        try {
          const fbCred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
          const displayName = fbCred.user.displayName || normalizedEmail.split('@')[0];
          const matchedBiz = businessAccounts.find(
            (b) => b.ownerEmail.toLowerCase().trim() === normalizedEmail
          );
          const targetBiz =
            matchedBiz ||
            registerBusinessAccount({
              businessName: `${displayName}'s Store`,
              ownerName: displayName,
              ownerEmail: normalizedEmail,
              phone: '',
              city: '',
              vertical: 'electrical_hardware',
              currency: 'Rs.',
            });
          switchBusinessAccount(targetBiz.id, targetBiz);
          await offlineDb.saveCachedSession({
            uid: fbCred.user.uid,
            email: normalizedEmail,
            displayName,
            role: normalizedEmail === SUPER_ADMIN_EMAIL ? 'admin' : 'owner',
            activeStoreId: targetBiz.id,
            lastVerifiedAt: new Date().toISOString(),
          });
          setUserSession({
            email: normalizedEmail,
            displayName,
            role: 'admin',
            storeId: targetBiz.id,
            isGoogleSignedIn: false,
            isAuthenticated: true,
            permissions: {
              canDiscount: true,
              canEditPrices: true,
              canAccessAdmin: normalizedEmail === SUPER_ADMIN_EMAIL,
              canManageStock: true,
              canViewProfit: true,
              canGiveUdhar: true,
            },
          });
          localStorage.setItem('apna_pos_onboarded', 'true');
          return;
        } catch (fbErr: any) {
          // Fall through to backend verified auth if Email/Password provider is not enabled in Firebase Console
          if (fbErr?.code === 'auth/wrong-password' || fbErr?.code === 'auth/invalid-credential') {
            // Still check server auth in case account was registered via server API
          }
        }

        // Server-side verified PBKDF2/scrypt login (with static Vercel deployment fallback)
        const res = await safeJsonFetch<{ user?: any; error?: string }>('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });

        let authedUser: { id: string | number; name: string; email: string; role?: string; storeName?: string };
        if (res.isStaticFallback) {
          const localLogin = await loginLocalFallbackAccount(normalizedEmail, password);
          if (!localLogin.success || !localLogin.user) {
            throw new Error(localLogin.error || 'Account not found on this deployment. Create a new account or continue with Google.');
          }
          authedUser = localLogin.user;
        } else if (!res.ok || !res.data?.user) {
          throw new Error(res.data?.error || res.error || 'Invalid email or password. Or use Continue with Google.');
        } else {
          authedUser = res.data.user;
        }

        const matchedBiz = businessAccounts.find(
          (b) => b.ownerEmail.toLowerCase().trim() === normalizedEmail
        );
        const targetBiz =
          matchedBiz ||
          registerBusinessAccount({
            businessName: authedUser.storeName || `${authedUser.name}'s Store`,
            ownerName: authedUser.name,
            ownerEmail: normalizedEmail,
            phone: '',
            city: '',
            vertical: 'electrical_hardware',
            currency: 'Rs.',
          });
        switchBusinessAccount(targetBiz.id, targetBiz);

        await offlineDb.saveCachedSession({
          uid: `usr_${authedUser.id}`,
          email: normalizedEmail,
          displayName: authedUser.name,
          role: normalizedEmail === SUPER_ADMIN_EMAIL ? 'admin' : 'owner',
          activeStoreId: targetBiz.id,
          lastVerifiedAt: new Date().toISOString(),
        });

        setUserSession({
          email: normalizedEmail,
          displayName: authedUser.name,
          role: (authedUser.role as any) || 'admin',
          storeId: targetBiz.id,
          isGoogleSignedIn: false,
          isAuthenticated: true,
          permissions: {
            canDiscount: true,
            canEditPrices: true,
            canAccessAdmin: normalizedEmail === SUPER_ADMIN_EMAIL,
            canManageStock: true,
            canViewProfit: true,
            canGiveUdhar: true,
          },
        });
        localStorage.setItem('apna_pos_onboarded', 'true');
        logActivity('auth', 'Email Sign-In', `Signed in as ${normalizedEmail}`);
        return;
      }

      // 3. New Business Registration (Strictly Isolated Zero-Data Store)
      if (mode === 'signup') {
        if (!storeName.trim() || !fullName.trim() || !normalizedEmail || !password) {
          throw new Error('Please fill in your name, store name, email, and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }

        // Register on server with salted cryptographic hashing (or browser-side Web Crypto fallback on static Vercel deploys)
        const regRes = await safeJsonFetch<{ user?: any; error?: string }>('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName.trim(),
            email: normalizedEmail,
            password,
            role: 'admin',
            storeName: storeName.trim(),
          }),
        });

        let registeredUserId: string | number = Date.now();
        if (regRes.isStaticFallback) {
          const localReg = await registerLocalFallbackAccount({
            name: fullName.trim(),
            email: normalizedEmail,
            password,
            role: 'admin',
            storeName: storeName.trim(),
          });
          if (!localReg.success || !localReg.user) {
            throw new Error(localReg.error || 'Could not register account.');
          }
          registeredUserId = localReg.user.id;
        } else if (!regRes.ok) {
          throw new Error(regRes.data?.error || regRes.error || 'Could not register account.');
        } else if (regRes.data?.user?.id) {
          registeredUserId = regRes.data.user.id;
        }

        // Also register in Firebase Email/Password if enabled
        let uid = `usr_${registeredUserId}`;
        try {
          const fbCred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          await updateProfile(fbCred.user, { displayName: fullName.trim() });
          uid = fbCred.user.uid;
        } catch {
          // Server account succeeded; Google Auth remains primary cloud provider
        }

        const newBiz = registerBusinessAccount({
          businessName: storeName.trim(),
          ownerName: fullName.trim(),
          ownerEmail: normalizedEmail,
          phone: phone.trim(),
          city: city.trim(),
          vertical,
          currency: 'Rs.',
        });

        await offlineDb.saveCachedSession({
          uid,
          email: normalizedEmail,
          displayName: fullName.trim(),
          role: normalizedEmail === SUPER_ADMIN_EMAIL ? 'admin' : 'owner',
          activeStoreId: newBiz.id,
          lastVerifiedAt: new Date().toISOString(),
        });

        setUserSession({
          email: normalizedEmail,
          displayName: fullName.trim(),
          role: 'admin',
          storeId: newBiz.id,
          isGoogleSignedIn: false,
          isAuthenticated: true,
          permissions: {
            canDiscount: true,
            canEditPrices: true,
            canAccessAdmin: normalizedEmail === SUPER_ADMIN_EMAIL,
            canManageStock: true,
            canViewProfit: true,
            canGiveUdhar: true,
          },
        });
        localStorage.setItem('apna_pos_onboarded', 'true');
        logActivity('auth', 'Business Account Created', `Created isolated store "${storeName.trim()}"`);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors">
      {/* Left Brand & Value Column */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-sm tracking-tight">
            POS
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">Apna AI POS</div>
            <div className="text-xs text-slate-400">Commercial Multi-Store Retail Suite</div>
          </div>
        </div>

        <div className="space-y-8 max-w-md">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              Fast counter billing built for online and offline retail.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Manage isolated multi-store inventory, product photos, Urdu auto-fill, Udhar Khatta ledgers, garment 7–9 color sets, and AI bill scanning from any device.
            </p>
          </div>

          <div className="space-y-3.5 text-xs text-slate-300">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-white">Strict Multi-User Data Isolation</div>
                <div className="text-slate-400">Every account owns private stores, products, sales, and financial reports.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <WifiOff className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-white">Offline-First IndexedDB & PWA</div>
                <div className="text-slate-400">Keep scanning and printing receipts without internet; auto-syncs cleanly when online.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-white">Multi-Store & Staff Role Control</div>
                <div className="text-slate-400">Switch branches in one click and assign cashier, manager, or owner permissions.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Apna AI POS • Cloud & Offline Retail Engine
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 relative">
        <div className="absolute top-5 right-5">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle Light / Dark Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xs">
              POS
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-white">Apna AI POS</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Commercial Multi-Store Retail Suite</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {mode === 'signin' && 'Sign in to your store'}
                {mode === 'signup' && 'Create your business account'}
                {mode === 'staff' && 'Staff counter sign in'}
                {mode === 'reset' && 'Reset your password'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {mode === 'signin' && 'Access your isolated POS terminal, inventory, and live reports.'}
                {mode === 'signup' && 'Start with a clean, private store workspace in seconds.'}
                {mode === 'staff' && 'Sign in with cashier or manager credentials created by your owner.'}
                {mode === 'reset' && 'Enter your email to receive a password reset link.'}
              </p>
            </div>

            {/* Mode Switcher */}
            {mode !== 'reset' && (
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('staff'); setError(null); setSuccess(null); }}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                    mode === 'staff'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Staff POS
                </button>
              </div>
            )}

            {/* Google Sign-In CTA (Recommended Cloud Sync Auth) */}
            {(mode === 'signin' || mode === 'signup') && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google (Cloud Sync)</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[11px]">
                    <span className="px-2 bg-white dark:bg-slate-900 text-slate-400">or with email & password</span>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {isUnauthorizedDomainError && currentHostname && (
                  <div className="pt-2 border-t border-rose-200/70 dark:border-rose-800/70 space-y-2">
                    <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 rounded-lg px-2.5 py-1.5 border border-rose-200 dark:border-rose-900">
                      <code className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate">
                        {currentHostname}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyDomain}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-semibold shrink-0 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <a
                      href={FIREBASE_AUTH_SETTINGS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-rose-800 dark:text-rose-200 hover:underline"
                    >
                      <span>Open Firebase Console → Authorized domains</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {mode === 'reset' ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@yourshop.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
                  className="w-full text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Your Full Name *
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ahmed Khan"
                            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Store / Business Name *
                        </label>
                        <div className="relative">
                          <Store className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="Al-Noor Traders"
                            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Phone
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+92 300 0000000"
                            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Business Type
                        </label>
                        <select
                          value={vertical}
                          onChange={(e) => setVertical(e.target.value as BusinessVertical)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        >
                          {(Object.keys(VERTICALS_CONFIG) as BusinessVertical[]).map((v) => (
                            <option key={v} value={v}>
                              {VERTICALS_CONFIG[v].name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@yourshop.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password *
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => { setMode('reset'); setError(null); setSuccess(null); }}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Lahore, Karachi, Islamabad..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>
                    {loading
                      ? 'Authenticating...'
                      : mode === 'signup'
                      ? 'Create Isolated Store Account'
                      : mode === 'staff'
                      ? 'Open Staff POS Counter'
                      : 'Sign In'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
