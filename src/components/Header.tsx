import React, { useState, useRef, useEffect } from 'react';
import { usePos } from '../context/PosContext';
import { PWAInstallButton } from './common/PWAInstallButton';
import {
  Menu,
  RefreshCw,
  WifiOff,
  Cloud,
  CloudOff,
  Bell,
  Plus,
  Moon,
  Sun,
  Store,
  ChevronDown,
  AlertTriangle,
  Check,
  Building2,
  X,
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
  onOpenAuthModal,
}) => {
  const {
    storeProfile,
    isOffline,
    setIsOffline,
    offlineSalesQueue,
    pendingSyncCount,
    isSyncing,
    lastSyncTime,
    syncOfflineSales,
    sales,
    userSession,
    theme,
    toggleTheme,
    businessAccounts,
    activeBusinessId,
    switchBusinessAccount,
    lowStockItems,
    outOfStockItems,
    activityLogs,
  } = usePos();

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const storeMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (storeMenuRef.current && !storeMenuRef.current.contains(e.target as Node)) {
        setStoreMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleManualSync = async () => {
    const res = await syncOfflineSales();
    setSyncFeedback(res.message || (res.success ? 'Synced' : 'Offline'));
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const userEmail = (userSession.email || '').toLowerCase().trim();
  const isSuperAdmin = userEmail === 'bashirsonselectric@gmail.com';
  const myStores = businessAccounts.filter(
    (b) => isSuperAdmin || b.ownerEmail.toLowerCase().trim() === userEmail || b.id === activeBusinessId
  );

  const today = new Date().toISOString().split('T')[0];
  const todayRevenue = sales
    .filter((s) => s.timestamp.startsWith(today))
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const totalPending = Math.max(offlineSalesQueue.length, pendingSyncCount);
  const alertCount = outOfStockItems.length + lowStockItems.length + totalPending;

  return (
    <header className="bg-white/95 dark:bg-[#161412]/95 backdrop-blur-sm text-[#141414] dark:text-[#F6F1EB] border-b border-[#E8E0D8] dark:border-[#2A2622] sticky top-0 z-30 transition-colors">
      <div className="max-w-full px-3 sm:px-5">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Left: Sidebar Toggle, Boutique Lockup & Store Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="p-2 rounded-lg text-[#6B625C] dark:text-[#C9BFB6] hover:bg-[#F6F1EB] dark:hover:bg-[#221F1C] transition-colors cursor-pointer shrink-0"
              title="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {storeProfile.logoUrl ? (
              <img
                src={storeProfile.logoUrl}
                alt={storeProfile.name}
                className="w-8 h-8 rounded-lg object-cover border border-[#E8E0D8] dark:border-[#2E2A26] shrink-0"
              />
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] font-editorial font-semibold text-sm shrink-0">
                M
              </div>
            )}

            {/* Multi-Store Switcher Dropdown */}
            <div className="relative min-w-0" ref={storeMenuRef}>
              <button
                type="button"
                onClick={() => setStoreMenuOpen((p) => !p)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#1F1C19] hover:bg-[#F6F1EB] dark:hover:bg-[#282420] transition-colors max-w-[200px] sm:max-w-[260px] cursor-pointer"
                title="Switch active boutique or add branch"
              >
                <Store className="w-3.5 h-3.5 text-[#7D6E65] dark:text-[#E5C6C3] shrink-0" />
                <span className="font-editorial text-sm font-semibold text-[#141414] dark:text-[#F6F1EB] truncate">
                  {storeProfile.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8A7E75] shrink-0" />
              </button>

              {storeMenuOpen && (
                <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] shadow-xl p-2 z-50">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A7E75]">
                    Your Boutiques ({myStores.length})
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-0.5 mt-1">
                    {myStores.map((biz) => {
                      const active = biz.id === activeBusinessId;
                      return (
                        <button
                          key={biz.id}
                          type="button"
                          onClick={() => {
                            switchBusinessAccount(biz.id, biz);
                            setStoreMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#F3E1DF] dark:bg-[#3A2827] text-[#141414] dark:text-[#F6F1EB] font-semibold'
                              : 'text-[#4A433E] dark:text-[#C9BFB6] hover:bg-[#FAF7F4] dark:hover:bg-[#24201C]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate">{biz.businessName}</div>
                            <div className="text-[10px] text-[#7D6E65] dark:text-[#A89E96] truncate">
                              {biz.city || 'Flagship Boutique'} · {biz.currency}
                            </div>
                          </div>
                          {active && <Check className="w-3.5 h-3.5 text-[#141414] dark:text-[#F3E1DF] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {onOpenAuthModal && (
                    <div className="pt-2 mt-2 border-t border-[#EFE8E0] dark:border-[#2A2622]">
                      <button
                        type="button"
                        onClick={() => {
                          setStoreMenuOpen(false);
                          onOpenAuthModal();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[#F6F1EB] dark:bg-[#24201C] hover:bg-[#EFE8E0] dark:hover:bg-[#2E2924] text-xs font-semibold text-[#141414] dark:text-[#F6F1EB] transition-colors cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Add / Manage Stores</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Today's Revenue Summary */}
            <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-[#E8E0D8] dark:border-[#2A2622] text-xs text-[#7D6E65] dark:text-[#A89E96]">
              <span>Today&apos;s Sales</span>
              <span className="font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]">
                {storeProfile.currency} {todayRevenue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Right: Sync, PWA, Theme Toggle, New Sale CTA, Alerts, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isOffline ? (
              <button
                type="button"
                onClick={() => setIsOffline(false)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#D4B483] dark:border-[#6B5434] bg-[#FBF5EC] dark:bg-[#2B2216] text-[#7A541F] dark:text-[#F1D29B] text-xs font-semibold cursor-pointer whitespace-nowrap"
                title="Offline Mode active. Click to check connection."
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  totalPending > 0
                    ? 'border-[#D4B483] dark:border-[#6B5434] bg-[#FBF5EC] dark:bg-[#2B2216] text-[#7A541F] dark:text-[#F1D29B]'
                    : 'border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#1F1C19] text-[#4A433E] dark:text-[#E8E0D8] hover:bg-[#FAF7F4] dark:hover:bg-[#282420]'
                }`}
                title={lastSyncTime ? `Last synced at ${lastSyncTime}` : 'Sync offline queue with cloud'}
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#141414] dark:text-[#F3E1DF]" />
                ) : totalPending > 0 ? (
                  <CloudOff className="w-3.5 h-3.5 text-[#9A6B2F]" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-[#2F6B4F] dark:text-[#6EE7B7]" />
                )}
                <span className="hidden md:inline">
                  {syncFeedback || (isSyncing ? 'Syncing...' : totalPending > 0 ? `Sync (${totalPending})` : 'Synced')}
                </span>
              </button>
            )}

            <PWAInstallButton />

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#1F1C19] text-[#4A433E] dark:text-[#E8E0D8] hover:bg-[#F6F1EB] dark:hover:bg-[#282420] transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Boutique Light Mode' : 'Switch to Evening Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#E5C6C3]" />
              ) : (
                <Moon className="w-4 h-4 text-[#141414]" />
              )}
            </button>

            {/* Primary CTA: New Sale */}
            {onOpenQuickSale && (
              <button
                type="button"
                onClick={onOpenQuickSale}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] dark:hover:bg-[#E8E0D8] text-white dark:text-[#141414] font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Sale</span>
              </button>
            )}

            {/* Notifications Drawer */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((p) => !p)}
                className="p-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#1F1C19] text-[#4A433E] dark:text-[#E8E0D8] hover:bg-[#F6F1EB] dark:hover:bg-[#282420] transition-colors relative cursor-pointer"
                title="Stock Alerts & Store Activity"
              >
                <Bell className="w-4 h-4" />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#141414] dark:bg-[#F3E1DF] text-white dark:text-[#141414] text-[10px] font-bold flex items-center justify-center font-mono-numbers">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#EFE8E0] dark:border-[#2A2622] flex items-center justify-between">
                    <span className="font-editorial text-sm font-semibold text-[#141414] dark:text-[#F6F1EB]">
                      Boutique Alerts
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-[#8A7E75] hover:text-[#141414] dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#EFE8E0] dark:divide-[#2A2622] text-xs">
                    {outOfStockItems.length > 0 && (
                      <div className="p-3 bg-[#F3E1DF]/50 dark:bg-[#3A2121]/50 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-[#9B2C2C] dark:text-[#FCA5A5] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-[#9B2C2C] dark:text-[#FCA5A5]">
                            {outOfStockItems.length} Out-of-Stock Piece{outOfStockItems.length === 1 ? '' : 's'}
                          </div>
                          <div className="text-[11px] text-[#6B625C] dark:text-[#C9BFB6] mt-0.5 truncate max-w-[230px]">
                            {outOfStockItems.slice(0, 3).map((p) => p.name).join(', ')}
                          </div>
                        </div>
                      </div>
                    )}
                    {lowStockItems.length > 0 && (
                      <div className="p-3 bg-[#FAF7F4] dark:bg-[#24201C] flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-[#9A6B2F] dark:text-[#F1D29B] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-[#141414] dark:text-[#F6F1EB]">
                            {lowStockItems.length} Low-Stock Alert{lowStockItems.length === 1 ? '' : 's'}
                          </div>
                          <div className="text-[11px] text-[#6B625C] dark:text-[#A89E96] mt-0.5 truncate max-w-[230px]">
                            {lowStockItems.slice(0, 3).map((p) => p.name).join(', ')}
                          </div>
                        </div>
                      </div>
                    )}
                    {activityLogs.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="p-3 hover:bg-[#FAF7F4] dark:hover:bg-[#221F1C]">
                        <div className="font-semibold text-[#141414] dark:text-[#F6F1EB]">{entry.action}</div>
                        <div className="text-[11px] text-[#6B625C] dark:text-[#A89E96] truncate">{entry.details}</div>
                        <div className="text-[10px] text-[#8A7E75] mt-0.5 font-mono-numbers">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                    {alertCount === 0 && activityLogs.length === 0 && (
                      <div className="p-6 text-center text-[#8A7E75]">
                        Inventory levels and cloud sync are all clear.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar */}
            {onOpenProfileModal && (
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="w-8 h-8 rounded-full bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F3E1DF] dark:hover:bg-[#E5C6C3] flex items-center justify-center font-semibold text-xs text-white dark:text-[#141414] transition-colors cursor-pointer shrink-0 overflow-hidden"
                title={`${userSession.displayName} (${userSession.email})`}
              >
                {userSession.photoURL ? (
                  <img src={userSession.photoURL} alt={userSession.displayName} className="w-full h-full object-cover" />
                ) : (
                  (userSession.displayName || 'U').charAt(0).toUpperCase()
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
