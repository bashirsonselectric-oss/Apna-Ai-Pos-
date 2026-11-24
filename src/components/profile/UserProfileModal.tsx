import React, { useState, useRef } from 'react';
import { usePos } from '../../context/PosContext';
import {
  LogOut,
  Check,
  Store,
  Key,
  X,
  QrCode,
  Upload,
  Trash2,
  CheckCircle2,
  ZoomIn,
  Building2,
  Smartphone,
  Landmark,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    userSession,
    setUserSession,
    googleSignOut,
    storeProfile,
    updateStoreProfile,
    changeUserPassword,
    logActivity,
  } = usePos();

  const [profileName, setProfileName] = useState(userSession.displayName ?? '');
  const [profileSaved, setProfileSaved] = useState(false);

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
  const [qrError, setQrError] = useState<string | null>(null);
  const [confirmRemoveQr, setConfirmRemoveQr] = useState(false);
  const [isZoomingQr, setIsZoomingQr] = useState(false);
  const [isQrSectionOpen, setIsQrSectionOpen] = useState(false);

  // Change Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSuperAdmin = userSession.email.toLowerCase().trim() === 'bashirsonselectric@gmail.com';

  const handleSaveProfileName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = profileName.trim();
    if (!cleaned) return;
    setUserSession((prev) => ({ ...prev, displayName: cleaned }));
    logActivity('store', 'Updated Profile', `Updated account display name to ${cleaned}`);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrError(null);

    if (!file.type.startsWith('image/')) {
      setQrError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setQrError('Image file is too large. Please select an image under 5MB.');
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
    setQrError(null);
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
    logActivity('store', 'Updated Payment QR', `Updated counter payment QR (${qrType.toUpperCase()})`);
    setQrSaveSuccess(true);
    setTimeout(() => setQrSaveSuccess(false), 3000);
  };

  const handleRemovePaymentQr = () => {
    setQrImageUrl('');
    setConfirmRemoveQr(false);
    updateStoreProfile({ paymentQrUrl: '' });
    setUserSession((prev) => ({ ...prev, paymentQrUrl: '' }));
  };

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
        setPasswordSuccess(res.message || 'Password updated successfully.');
        setCurrentPassInput('');
        setNewPassInput('');
        setConfirmPassInput('');
        logActivity('auth', 'Password Updated', 'Account password updated from profile modal');
      } else {
        setPasswordError(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 relative border-b border-slate-800">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3.5 pr-8">
            <div className="relative">
              {userSession.photoURL ? (
                <img
                  src={userSession.photoURL}
                  alt={userSession.displayName}
                  className="w-13 h-13 rounded-xl object-cover ring-2 ring-indigo-400/50"
                />
              ) : (
                <div className="w-13 h-13 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white">
                  {(userSession.displayName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base text-white truncate">{userSession.displayName}</h3>
              <p className="text-xs text-slate-300 font-mono truncate">{userSession.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  {isSuperAdmin ? 'Super Admin' : userSession.role}
                </span>
                <span className="text-[11px] text-emerald-300 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  {userSession.isGoogleSignedIn ? 'Verified Account' : 'Active Session'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Active Store Info */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Store className="w-3.5 h-3.5" /> Active Store
              </span>
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                {storeProfile.name}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Account Scope</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Private Isolated Workspace
              </span>
            </div>
          </div>

          {/* Profile Display Name Update */}
          <form onSubmit={handleSaveProfileName} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Display Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your full name"
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                {profileSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </form>

          {/* Cashier & Store Payment QR Code Section */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsQrSectionOpen(!isQrSectionOpen)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Counter Payment QR (Raast / Wallet)
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                {isQrSectionOpen ? 'Hide' : 'Configure'}
              </span>
            </button>

            {isQrSectionOpen && (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                {qrSaveSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Payment QR saved for POS checkout.</span>
                  </div>
                )}

                {qrError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{qrError}</span>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {[
                    { id: 'raast', label: 'Raast', icon: Landmark, color: 'text-indigo-600' },
                    { id: 'jazzcash', label: 'JazzCash', icon: Smartphone, color: 'text-rose-600' },
                    { id: 'easypaisa', label: 'EasyPaisa', icon: Smartphone, color: 'text-emerald-600' },
                    { id: 'bank', label: 'Bank', icon: Building2, color: 'text-blue-600' },
                  ].map((type) => {
                    const IconComp = type.icon;
                    const active = qrType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setQrType(type.id as any)}
                        className={`py-2 px-1.5 rounded-lg border text-[11px] font-semibold transition-all flex flex-col items-center gap-1 ${
                          active
                            ? 'border-indigo-600 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <IconComp className={`w-3.5 h-3.5 ${type.color}`} />
                        <span className="truncate w-full">{type.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Account Title
                    </label>
                    <input
                      type="text"
                      value={qrAccountTitle}
                      onChange={(e) => setQrAccountTitle(e.target.value)}
                      placeholder="Business Account Title"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Account / Till No.
                    </label>
                    <input
                      type="text"
                      value={qrAccountNo}
                      onChange={(e) => setQrAccountNo(e.target.value)}
                      placeholder="03001234567"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <input
                  ref={qrFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQrFileUpload}
                  className="hidden"
                />

                {qrImageUrl ? (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="relative group cursor-pointer" onClick={() => setIsZoomingQr(true)}>
                      <img
                        src={qrImageUrl}
                        alt="Uploaded Payment QR"
                        className="w-14 h-14 object-contain rounded-lg border border-slate-200 bg-white p-1"
                      />
                      <span className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <ZoomIn className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {qrAccountTitle || 'Payment QR'}
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 truncate">
                        {qrAccountNo || qrType.toUpperCase()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => qrFileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> Replace
                      </button>
                      {confirmRemoveQr ? (
                        <button
                          type="button"
                          onClick={handleRemovePaymentQr}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-semibold"
                        >
                          Confirm?
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveQr(true)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => qrFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer transition-colors"
                  >
                    <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto mb-1.5" />
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Upload Payment QR Image
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, WebP up to 5MB</p>
                  </button>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSavePaymentQr}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5"
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
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Change Account Password
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                {isChangingPassword ? 'Hide' : 'Update'}
              </span>
            </button>

            {isChangingPassword && (
              <form
                onSubmit={handleChangeUserPassword}
                className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
              >
                {passwordSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                    {passwordSuccess}
                  </div>
                )}
                {passwordError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassInput}
                    onChange={(e) => setCurrentPassInput(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassInput}
                    onChange={(e) => setConfirmPassInput(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
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
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Enlarge / Zoom QR Code Modal */}
      {isZoomingQr && qrImageUrl && (
        <div
          className="fixed inset-0 z-70 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsZoomingQr(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                {qrType.toUpperCase()} Counter QR Code
              </span>
              <button
                type="button"
                onClick={() => setIsZoomingQr(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 flex justify-center">
              <img src={qrImageUrl} alt="Enlarged Payment QR" className="w-60 h-60 object-contain" />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {qrAccountTitle || storeProfile.name}
              </div>
              {qrAccountNo && (
                <div className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {qrAccountNo}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsZoomingQr(false)}
              className="w-full py-2.5 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
