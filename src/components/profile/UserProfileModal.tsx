import React, { useState, useRef } from 'react';
import { usePos } from '../../context/PosContext';
import {
  User,
  LogOut,
  ShieldCheck,
  Check,
  Store,
  Key,
  X,
  Sparkles,
  ExternalLink,
  QrCode,
  Upload,
  Trash2,
  Camera,
  CheckCircle2,
  Eye,
  ZoomIn,
  Building2,
  Smartphone,
  Landmark,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { userSession, setUserSession, googleSignIn, googleSignOut, storeProfile, updateStoreProfile, changeUserPassword } = usePos();
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(userSession.displayName ?? '');
  const [emailInput, setEmailInput] = useState(userSession.email ?? '');

  // User Payment QR Upload state
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>(
    userSession.paymentQrUrl || storeProfile.paymentQrUrl || ''
  );
  const [qrType, setQrType] = useState<'raast' | 'jazzcash' | 'easypaisa' | 'bank' | 'general'>(
    (userSession.paymentQrType as any) || storeProfile.paymentQrType || 'raast'
  );
  const [qrAccountTitle, setQrAccountTitle] = useState<string>(
    userSession.paymentQrTitle || storeProfile.paymentQrAccountTitle || storeProfile.name || ''
  );
  const [qrAccountNo, setQrAccountNo] = useState<string>(
    userSession.paymentQrAccountNo || storeProfile.paymentQrAccountNo || ''
  );
  const [qrSaveSuccess, setQrSaveSuccess] = useState(false);
  const [isZoomingQr, setIsZoomingQr] = useState(false);
  const [isQrSectionOpen, setIsQrSectionOpen] = useState(true);

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setQrImageUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePaymentQr = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateStoreProfile({
      paymentQrUrl: qrImageUrl,
      paymentQrType: qrType,
      paymentQrAccountTitle: qrAccountTitle,
      paymentQrAccountNo: qrAccountNo,
    });
    setUserSession((prev) => ({
      ...prev,
      paymentQrUrl: qrImageUrl,
      paymentQrType: qrType,
      paymentQrTitle: qrAccountTitle,
      paymentQrAccountNo: qrAccountNo,
    }));
    setQrSaveSuccess(true);
    setTimeout(() => setQrSaveSuccess(false), 3000);
  };

  const handleRemovePaymentQr = () => {
    if (confirm('Are you sure you want to remove this Payment QR code?')) {
      setQrImageUrl('');
      updateStoreProfile({
        paymentQrUrl: '',
      });
      setUserSession((prev) => ({
        ...prev,
        paymentQrUrl: '',
      }));
    }
  };

  // Change Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChangeUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassInput || !newPassInput) return;
    if (newPassInput !== confirmPassInput) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassInput.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const res = await changeUserPassword(currentPassInput, newPassInput);
      if (res.success) {
        setPasswordSuccess('Password successfully changed in database!');
        setCurrentPassInput('');
        setNewPassInput('');
        setConfirmPassInput('');
      } else {
        setPasswordError(res.message || 'Failed to change password');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSwitchAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    googleSignIn(emailInput.trim(), nameInput.trim() || 'Store User');
    setIsEditing(false);
  };

  const handleSignInAsBashir = () => {
    googleSignIn('bashirsonselectric@gmail.com', 'Muhammad Bashir & Sons');
    setIsEditing(false);
  };

  const handleSignInAsCashier = () => {
    googleSignIn('asif.cashier@godigly.com', 'Asif Khan (Counter 1)');
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with Google Theme */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="relative">
              {userSession.photoURL ? (
                <img
                  src={userSession.photoURL}
                  alt={userSession.displayName}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-400/50 shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl text-white ring-2 ring-emerald-400/50">
                  {userSession.displayName.charAt(0)}
                </div>
              )}
              {userSession.isGoogleSignedIn && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
                  <span className="text-[10px] font-black text-indigo-600">G</span>
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base text-white truncate">
                  {userSession.displayName}
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-mono truncate">{userSession.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    userSession.email === 'bashirsonselectric@gmail.com'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                  }`}
                >
                  {userSession.email === 'bashirsonselectric@gmail.com' ? 'Super Admin' : userSession.role}
                </span>
                <span className="text-[11px] text-slate-400">
                  {userSession.isGoogleSignedIn ? 'Google Verified' : 'Guest'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto custom-scrollbar">
          {/* Active Store Branch Info */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between items-center text-slate-500">
              <span className="flex items-center gap-1 font-semibold">
                <Store className="w-3.5 h-3.5 text-slate-400" /> Active Branch
              </span>
              <span className="font-mono text-slate-800 font-bold">Main Bazaar Branch # 14</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>SaaS Subscription:</span>
              <span className="font-bold text-emerald-700 capitalize">
                {storeProfile.saasTier} Plan by Godigly
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Master Admin Access:</span>
              <span
                className={`font-bold ${
                  userSession.email === 'bashirsonselectric@gmail.com'
                    ? 'text-emerald-700'
                    : 'text-rose-600'
                }`}
              >
                {userSession.email === 'bashirsonselectric@gmail.com' ? 'Authorized (Unlocked)' : 'Locked (Restricted)'}
              </span>
            </div>
          </div>

          {/* Account Switcher Options */}
          {!isEditing ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Quick Switch Account:
              </div>
              <button
                type="button"
                onClick={handleSignInAsBashir}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                  userSession.email === 'bashirsonselectric@gmail.com'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    B
                  </div>
                  <div>
                    <div className="font-bold">Muhammad Bashir (Owner Admin)</div>
                    <div className="text-[11px] text-slate-500">bashirsonselectric@gmail.com</div>
                  </div>
                </div>
                {userSession.email === 'bashirsonselectric@gmail.com' && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </button>

              <button
                type="button"
                onClick={handleSignInAsCashier}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                  userSession.email === 'asif.cashier@godigly.com'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center font-bold text-xs">
                    A
                  </div>
                  <div>
                    <div className="font-bold">Asif Khan (Counter Cashier)</div>
                    <div className="text-[11px] text-slate-500">asif.cashier@godigly.com</div>
                  </div>
                </div>
                {userSession.email === 'asif.cashier@godigly.com' && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-2 text-xs text-center text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                + Sign in with custom Google Account
              </button>
            </div>
          ) : (
            <form onSubmit={handleSwitchAccount} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Account Email:
                </label>
                <input
                  type="email"
                  required
                  value={emailInput ?? ''}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name:</label>
                <input
                  type="text"
                  required
                  value={nameInput ?? ''}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* Cashier & Store Payment QR Code Upload Section */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Payment QR Code (Cashier / Counter)
              </span>
              <button
                type="button"
                onClick={() => setIsQrSectionOpen(!isQrSectionOpen)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                {isQrSectionOpen ? 'Collapse ▲' : 'Expand ▼'}
              </button>
            </div>

            {isQrSectionOpen && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                {qrSaveSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Payment QR settings saved to counter & user profile!</span>
                  </div>
                )}

                {/* QR Method Type Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                    Select QR Gateway Type:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    {[
                      { id: 'raast', label: 'Raast Pay', icon: Landmark, color: 'text-indigo-600' },
                      { id: 'jazzcash', label: 'JazzCash', icon: Smartphone, color: 'text-rose-600' },
                      { id: 'easypaisa', label: 'EasyPaisa', icon: Smartphone, color: 'text-emerald-600' },
                      { id: 'bank', label: 'Bank IBAN', icon: Building2, color: 'text-blue-600' },
                    ].map((type) => {
                      const IconComp = type.icon;
                      const active = qrType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setQrType(type.id as any)}
                          className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1 ${
                            active
                              ? 'border-indigo-600 bg-white text-indigo-950 shadow-xs ring-1 ring-indigo-500'
                              : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <IconComp className={`w-3.5 h-3.5 ${type.color}`} />
                          <span className="truncate w-full">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Account Title / Name:
                    </label>
                    <input
                      type="text"
                      value={qrAccountTitle}
                      onChange={(e) => setQrAccountTitle(e.target.value)}
                      placeholder="e.g. Muhammad Bashir"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Account No / Till / Raast:
                    </label>
                    <input
                      type="text"
                      value={qrAccountNo}
                      onChange={(e) => setQrAccountNo(e.target.value)}
                      placeholder="e.g. 03001234567"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Upload or Preview Box */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Payment QR Image File:</span>
                    <span className="text-[10px] text-slate-500">PNG, JPG, WebP (Max 5MB)</span>
                  </label>

                  <input
                    ref={qrFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQrFileUpload}
                    className="hidden"
                  />

                  {qrImageUrl ? (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
                      <div className="relative group cursor-pointer" onClick={() => setIsZoomingQr(true)}>
                        <img
                          src={qrImageUrl}
                          alt="Uploaded Payment QR"
                          className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-white p-1 shadow-2xs"
                        />
                        <span className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <ZoomIn className="w-4 h-4" />
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {qrAccountTitle || 'Custom Payment QR'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                          {qrAccountNo || qrType.toUpperCase()}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ready for POS checkout
                        </p>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => qrFileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Upload className="w-3 h-3" /> Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePaymentQr}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => qrFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 rounded-2xl p-5 text-center cursor-pointer transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 group-hover:scale-110 flex items-center justify-center mx-auto mb-2 transition-transform shadow-xs">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                        Click to Upload Payment QR Code
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Upload screenshot or photo of Raast, JazzCash Till, or EasyPaisa QR
                      </p>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Syncs to POS counter modal & customer checkout
                  </span>
                  <button
                    type="button"
                    onClick={handleSavePaymentQr}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Payment QR
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Change Password Section */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-left text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-500" />
                Change Password (PBKDF2 Hash)
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                {isChangingPassword ? 'Hide ▲' : 'Open ▼'}
              </span>
            </button>

            {isChangingPassword && (
              <form onSubmit={handleChangeUserPassword} className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                {passwordSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
                    {passwordSuccess}
                  </div>
                )}
                {passwordError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-[11px] font-semibold">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Current Password:
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassInput}
                    onChange={(e) => setCurrentPassInput(e.target.value)}
                    placeholder="Enter current password..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    New Password:
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="At least 6 characters..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Confirm New Password:
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassInput}
                    onChange={(e) => setConfirmPassInput(e.target.value)}
                    placeholder="Re-enter new password..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating Hash...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>

          {/* Sign Out Button */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                googleSignOut();
                onClose();
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Account</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Enlarge / Zoom QR Code Modal */}
      {isZoomingQr && qrImageUrl && (
        <div
          className="fixed inset-0 z-70 bg-black/85 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsZoomingQr(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                {qrType.toUpperCase()} Counter QR Code
              </span>
              <button
                type="button"
                onClick={() => setIsZoomingQr(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-center">
              <img
                src={qrImageUrl}
                alt="Enlarged Payment QR"
                className="w-64 h-64 object-contain rounded-xl shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <div className="text-base font-bold text-slate-900">{qrAccountTitle || storeProfile.name}</div>
              {qrAccountNo && (
                <div className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 py-1 px-3 rounded-full inline-block">
                  {qrAccountNo}
                </div>
              )}
              <p className="text-[11px] text-slate-500">
                Customer can scan directly from camera or bank/wallet app
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsZoomingQr(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Close Fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
