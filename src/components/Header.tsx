import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import {
  Menu,
  RefreshCw,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  Bell,
  Plus,
  Moon,
  Sun,
  Zap,
  Sparkles,
  User,
} from 'lucide-react';


interface HeaderProps {
  onOpenAiHub?: () => void;
  onOpenQuickSale?: () => void;
  onOpenNewProduct?: () => void;
  onOpenPriceAdjuster?: () => void;
  onOpenProfileModal?: () => void;
  onToggleMobileMenu: () => void;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenQuickSale,
  onOpenProfileModal,
}) => {
  const {
    storeProfile,
    isOffline,
    setIsOffline,
    offlineSalesQueue,
    isSyncing,
    lastSyncTime,
    syncOfflineSales,
    sales,
    userSession,
    theme,
    toggleTheme,
  } = usePos();


  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSync = async () => {
    const res = await syncOfflineSales();
    if (res.success) {
      setSyncFeedback(res.message || 'Synced with Cloud!');
    } else {
      setSyncFeedback(res.message || 'Offline mode active');
    }
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  // Today's sales calculation
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.timestamp.startsWith(today));
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Hamburger & Brand & Store Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Side Menu Toggle Button */}
            <button
              onClick={onToggleMobileMenu}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Toggle Side Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Custom Business Logo or Styled Badge */}
            {storeProfile.logoUrl ? (
              <img
                src={storeProfile.logoUrl}
                alt={storeProfile.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover ring-2 ring-emerald-500/40 shadow-md shrink-0"
              />
            ) : (
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 font-extrabold text-base sm:text-lg tracking-wider shrink-0">
                AI
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-1">
                  Apna AI POS
                  <span className="text-[9px] uppercase font-semibold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Godigly
                  </span>
                </span>
                <span className="text-slate-500 text-xs hidden lg:inline">|</span>
                <span className="text-xs text-slate-300 font-medium truncate max-w-[120px] sm:max-w-xs hidden sm:inline">
                  {storeProfile.name}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] text-slate-400">
                {isOffline ? (
                  <button
                    type="button"
                    onClick={() => setIsOffline(false)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[11px] shadow-xs hover:bg-amber-500/30 transition-all"
                    title="Working in Offline Mode. Click to reconnect to Cloud Database"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Working Offline</span>
                    <span className="text-[10px] text-amber-200/70 font-normal hidden sm:inline">(IndexedDB)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {/* Sync Status Indicator */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-semibold transition-all ${
                        isSyncing
                          ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                          : offlineSalesQueue.length > 0
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      }`}
                      title={
                        offlineSalesQueue.length > 0
                          ? `${offlineSalesQueue.length} sales stored locally in IndexedDB pending cloud sync`
                          : lastSyncTime
                          ? `Reconciled with Cloud at ${lastSyncTime}`
                          : 'Cloud Database Active'
                      }
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                          <span className="font-bold">Syncing...</span>
                        </>
                      ) : offlineSalesQueue.length > 0 ? (
                        <>
                          <CloudOff className="w-3 h-3 text-amber-400" />
                          <span className="font-bold">{offlineSalesQueue.length} Local Txns</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-3 h-3 text-emerald-400" />
                          <span className="font-bold">Cloud Synced</span>
                          {lastSyncTime && (
                            <span className="text-[10px] text-emerald-200/70 hidden lg:inline">({lastSyncTime})</span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Sync Now Action Button */}
                    <button
                      type="button"
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold shadow-xs border border-emerald-400/30 transition-all cursor-pointer"
                      title="Sync Now: Reconciles local cart data and IndexedDB transactions with backend database"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-200' : ''}`} />
                      <span>Sync Now</span>
                    </button>
                  </div>
                )}

                {syncFeedback && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-in fade-in">
                    {syncFeedback}
                  </span>
                )}

                <span className="hidden sm:inline">•</span>
                <span className="text-slate-300 truncate hidden sm:inline">
                  Today: <strong className="text-emerald-400 font-mono-numbers">
                    {storeProfile.currency} {todayRevenue.toLocaleString()}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Cryptoin Style Greeting, Quick Bill Button & Profile Avatar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Cashier Greeting */}
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-300 font-medium">
              <span>Hi</span>
              <strong className="text-white font-bold">
                {userSession.displayName ? userSession.displayName.split(' ')[0] : 'Bashir'}
              </strong>
              <span>👋</span>
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Toggle Light / Dark Mode"
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-purple-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Fast Action Quick Bill Button (Vibrant Purple Pill matching the screenshot's 'Send & Receive' button) */}
            {onOpenQuickSale && (
              <button
                type="button"
                onClick={onOpenQuickSale}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Quick Bill (F2)</span>
                <span className="sm:hidden">Bill</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-300" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            </button>

            {/* Cashier Avatar */}
            {onOpenProfileModal && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white ring-2 ring-purple-500/50 hover:ring-purple-400 transition-all cursor-pointer shadow-md"
                title="Cashier Profile & QR Settings"
              >
                {userSession.displayName ? userSession.displayName.charAt(0) : 'B'}
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
