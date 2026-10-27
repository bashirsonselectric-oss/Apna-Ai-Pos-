import React, { useState, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import { VERTICALS_CONFIG } from '../../data/defaultData';
import { BusinessVertical } from '../../types';
import {
  Store,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Phone,
  Building,
  ArrowRight,
  X,
  CheckCircle2,
  Sparkles,
  LogOut,
  Layers,
  Database,
  Key,
  Eye,
  EyeOff,
  Code,
  Terminal,
  Cpu,
  AlertCircle,
  RefreshCw,
  Server,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup_business' | 'db_architecture' | 'accounts_switch';
}

interface UserTableRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  password_preview: string;
  salt: string;
  role: string;
  storeName: string;
  created_at: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode }) => {
  const {
    userSession,
    setUserSession,
    googleSignIn,
    googleSignOut,
    businessAccounts,
    activeBusinessId,
    switchBusinessAccount,
    registerBusinessAccount,
    storeProfile,
  } = usePos();

  const [authMode, setAuthMode] = useState<
    'signin' | 'signup_business' | 'db_architecture' | 'accounts_switch'
  >(() => {
    if (initialMode) return initialMode;
    try {
      const onboarded = localStorage.getItem('apna_pos_onboarded');
      return onboarded ? 'signin' : 'signup_business';
    } catch {
      return 'signup_business';
    }
  });

  // Signin form state
  const [loginEmail, setLoginEmail] = useState('bashirsonselectric@gmail.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Business Onboarding Signup Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupStoreName, setSignupStoreName] = useState('');
  const [signupPhone, setSignupPhone] = useState('+92 3');
  const [signupCity, setSignupCity] = useState('Lahore');
  const [signupVertical, setSignupVertical] = useState<BusinessVertical>('electrical_hardware');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  // Database Schema & Live Table State
  const [dbUsers, setDbUsers] = useState<UserTableRow[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [testPassword, setTestPassword] = useState('secret_password_123');
  const [hashResult, setHashResult] = useState<any>(null);
  const [hashCalculating, setHashCalculating] = useState(false);

  // Fetch live database users table
  const fetchDbUsers = async () => {
    setDbLoading(true);
    try {
      const res = await fetch('/api/auth/users-table');
      const data = await res.json();
      if (data.rows) {
        setDbUsers(data.rows);
      }
    } catch (err) {
      console.error('Failed to load database users table:', err);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (authMode === 'db_architecture' && isOpen) {
      fetchDbUsers();
    }
  }, [authMode, isOpen]);

  if (!isOpen) return null;

  // Handle Login with Email & Password (Database Verification)
  const handleDatabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    setLoginSuccess(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login verification failed');
      }

      setLoginSuccess(`Verified! Welcome back, ${data.user.name}.`);
      localStorage.setItem('apna_pos_onboarded', 'true');
      localStorage.setItem('apna_pos_auth_token', data.token);

      // Resolve or switch to user-specific business tenant
      const normalizedEmail = data.user.email.toLowerCase().trim();
      const isMasterAdmin = normalizedEmail === 'bashirsonselectric@gmail.com';
      let targetBizId = 'biz-1';

      if (!isMasterAdmin) {
        const foundBiz = businessAccounts.find(
          (b) => b.ownerEmail.toLowerCase().trim() === normalizedEmail
        );
        if (foundBiz) {
          targetBizId = foundBiz.id;
          switchBusinessAccount(targetBizId, foundBiz);
        } else {
          const newAccount = registerBusinessAccount({
            businessName: data.user.storeName || `${data.user.name}'s Store`,
            ownerName: data.user.name,
            ownerEmail: data.user.email,
            phone: '',
            city: '',
            vertical: 'electrical_hardware',
            currency: 'Rs.',
          });
          targetBizId = newAccount.id;
        }
      } else {
        switchBusinessAccount('biz-1');
      }

      // Update PosContext UserSession
      setUserSession({
        email: data.user.email,
        displayName: data.user.name,
        role: data.user.role || 'admin',
        storeId: targetBizId,
        isGoogleSignedIn: false,
        permissions: {
          canDiscount: true,
          canEditPrices: data.user.role === 'admin' || data.user.role === 'manager',
          canAccessAdmin: data.user.role === 'admin',
          canManageStock: true,
          canViewProfit: data.user.role === 'admin',
          canGiveUdhar: true,
        },
      });

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setLoginError(err.message || 'Login error occurred');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle New User & Store Registration (Save to Database Table)
  const handleDatabaseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError(null);
    setSignupSuccess(null);

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      setSignupLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          role: 'admin',
          storeName: signupStoreName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed in database');
      }

      setSignupSuccess(`Account registered in database! Row ID #${data.user.id} created.`);
      localStorage.setItem('apna_pos_onboarded', 'true');
      localStorage.setItem('apna_pos_auth_token', data.token);

      // Register business tenant in POS Context with 0 initial data
      const newBiz = registerBusinessAccount({
        businessName: signupStoreName.trim(),
        ownerName: signupName.trim(),
        ownerEmail: signupEmail.trim(),
        phone: signupPhone.trim(),
        city: signupCity.trim(),
        vertical: signupVertical,
        currency: 'Rs.',
      });

      // Update PosContext UserSession
      setUserSession({
        email: data.user.email,
        displayName: data.user.name,
        role: 'admin',
        storeId: newBiz.id,
        isGoogleSignedIn: false,
        permissions: {
          canDiscount: true,
          canEditPrices: true,
          canAccessAdmin: true,
          canManageStock: true,
          canViewProfit: true,
          canGiveUdhar: true,
        },
      });

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setSignupError(err.message || 'Registration error');
    } finally {
      setSignupLoading(false);
    }
  };

  // Live Password Hashing Sandbox Demonstration
  const handleRunHashDemo = async (pwd: string) => {
    setHashCalculating(true);
    try {
      const res = await fetch('/api/auth/verify-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });
      const data = await res.json();
      setHashResult(data);
    } catch (err) {
      console.error('Hash calc failed:', err);
    } finally {
      setHashCalculating(false);
    }
  };

  const handleGoogleQuickAuth = (email: string, name: string) => {
    localStorage.setItem('apna_pos_onboarded', 'true');
    googleSignIn(email, name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center font-black text-xl text-white shadow-lg">
              AI
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Apna AI POS • Database Authentication</span>
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                {authMode === 'signup_business'
                  ? 'Sign Up & Create Database Account'
                  : authMode === 'db_architecture'
                  ? 'Database Structure & Password Hashing'
                  : authMode === 'accounts_switch'
                  ? 'Switch Business Store'
                  : 'Sign In to Your Account'}
              </h2>
            </div>
          </div>
        </div>

        {/* Auth Sub Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-950/60 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setAuthMode('signin')}
            className={`py-3 px-4 text-center border-b-2 transition-all whitespace-nowrap ${
              authMode === 'signin'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In (Login)
          </button>
          <button
            onClick={() => setAuthMode('signup_business')}
            className={`py-3 px-4 text-center border-b-2 transition-all whitespace-nowrap ${
              authMode === 'signup_business'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign Up (Register)
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          {/* TAB 1: LOGIN (SIGN IN) WITH DATABASE VERIFICATION */}
          {authMode === 'signin' && (
            <div className="space-y-4">
              {/* Quick Fill Test Accounts */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="font-bold text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>⚡ Quick Demo Credentials (Saved in Database):</span>
                  <span className="text-[10px] text-emerald-600 font-mono">Password Encrypted</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('bashirsonselectric@gmail.com');
                      setLoginPassword('admin123');
                    }}
                    className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-left hover:border-emerald-500 transition-colors"
                  >
                    <div className="font-bold text-slate-900 dark:text-white text-[11px]">Super Admin</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">admin123</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('manager@bashirsons.com');
                      setLoginPassword('manager123');
                    }}
                    className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-left hover:border-emerald-500 transition-colors"
                  >
                    <div className="font-bold text-slate-900 dark:text-white text-[11px]">Manager</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">manager123</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('cashier1@bashirsons.com');
                      setLoginPassword('cashier123');
                    }}
                    className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-left hover:border-emerald-500 transition-colors"
                  >
                    <div className="font-bold text-slate-900 dark:text-white text-[11px]">Cashier #1</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">cashier123</div>
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleDatabaseLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="user@store.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Database Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In & Verify Credentials</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex items-center justify-center pt-1">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
                <span className="bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-400 uppercase font-semibold">
                  Or Google Fast Auth
                </span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    handleGoogleQuickAuth('bashirsonselectric@gmail.com', 'Muhammad Bashir & Sons')
                  }
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white shadow-2xs transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                      G
                    </div>
                    <span>Continue as Muhammad Bashir (Demo Store)</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Demo Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const email = prompt('Enter your Google Email for fresh 0-data account:', 'newuser@gmail.com');
                    if (email && email.trim()) {
                      const name = prompt('Enter your Store / Owner Name:', 'Retail Shop Owner') || 'Store Owner';
                      handleGoogleQuickAuth(email.trim(), name.trim());
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Sign In as New User (Fresh 0-Data Dashboard)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded">All 0 Data</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN UP / REGISTRATION (DATABASE SAVE) */}
          {authMode === 'signup_business' && (
            <form onSubmit={handleDatabaseRegister} className="space-y-3.5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Secure Registration with Bcrypt/PBKDF2 Password Hashing</span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Your credentials will be saved in the database <code>users</code> table. Passwords are salted and hashed before persistence.
                </p>
              </div>

              {signupError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{signupError}</span>
                </div>
              )}

              {signupSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{signupSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name (`name`) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Asad Malik"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Login Email (`email`) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="asad@electricstore.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password (`password`) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Never stored in plain text. Salted hash preview:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {signupPassword ? 'SHA-512 Ready' : 'Awaiting input'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Store / Business Name *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={signupStoreName}
                    onChange={(e) => setSignupStoreName(e.target.value)}
                    placeholder="e.g. Asad Electrical Traders"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Store Vertical Category
                  </label>
                  <select
                    value={signupVertical}
                    onChange={(e) => setSignupVertical(e.target.value as BusinessVertical)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  >
                    {(Object.keys(VERTICALS_CONFIG) as BusinessVertical[]).map((vKey) => (
                      <option key={vKey} value={vKey}>
                        {VERTICALS_CONFIG[vKey].name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City / Market
                  </label>
                  <input
                    type="text"
                    value={signupCity}
                    onChange={(e) => setSignupCity(e.target.value)}
                    placeholder="e.g. Lahore / Rawalpindi"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {signupLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Inserting Record into Database...</span>
                  </>
                ) : (
                  <>
                    <span>Create Database User & Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
