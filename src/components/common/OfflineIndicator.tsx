import React, { useEffect, useRef, useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  CloudUpload,
  ChevronUp,
  ChevronDown,
  Trash2,
  RotateCw,
  Clock,
  X,
} from 'lucide-react';
import { useBackgroundSync } from '../../hooks/useBackgroundSync';
import { usePos } from '../../context/PosContext';

export const OfflineIndicator: React.FC = () => {
  const { snapshot, syncNow, retryItem, clearSyncedHistory } = useBackgroundSync();
  const { storeProfile, isOffline, setIsOffline, syncOfflineSales } = usePos();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [recentSyncBanner, setRecentSyncBanner] = useState<string | null>(null);
  const prevSyncedRef = useRef<number>(snapshot.syncedThisSession);

  useEffect(() => {
    if (snapshot.syncedThisSession > prevSyncedRef.current) {
      const delta = snapshot.syncedThisSession - prevSyncedRef.current;
      prevSyncedRef.current = snapshot.syncedThisSession;
      setRecentSyncBanner(
        `Updated ${delta} offline sale${delta === 1 ? '' : 's'} online`
      );
      const timer = setTimeout(() => setRecentSyncBanner(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [snapshot.syncedThisSession]);

  const actuallyOffline = !snapshot.isOnline || snapshot.isManualOffline || isOffline;
  const canReconnectManually = isOffline && snapshot.isOnline;
  const pendingCount = snapshot.pendingSalesCount + snapshot.failedSalesCount;
  const hasQueuedWork = pendingCount > 0 || snapshot.pendingOtherCount > 0;
  const isSyncing = snapshot.state === 'syncing';

  // Keep workspace uncluttered when online, idle, and nothing is pending (unless drawer open or brief sync confirmation)
  if (!actuallyOffline && !hasQueuedWork && !isSyncing && !recentSyncBanner && !drawerOpen) {
    return null;
  }

  const handleTriggerSync = async () => {
    await syncOfflineSales();
    await syncNow();
  };

  const handleGoOnlineAndSync = () => {
    setIsOffline(false);
  };

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 z-40 max-w-md w-[calc(100vw-2rem)] sm:w-auto">
      {/* Expandable IndexedDB Offline Sales Queue Drawer */}
      {drawerOpen && (
        <div className="mb-2.5 rounded-2xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#1A1816] shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#EFE8E0] dark:border-[#2A2622] flex items-center justify-between gap-2 bg-[#FAF7F4] dark:bg-[#221F1C]">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#141414] dark:text-[#F6F1EB] flex items-center gap-1.5">
                <CloudUpload className="w-3.5 h-3.5 text-[#7D6E65] dark:text-[#E5C6C3]" />
                <span>Offline Sales Sync Queue</span>
              </div>
              <p className="text-[11px] text-[#7D6E65] dark:text-[#A89E96] truncate">
                {snapshot.isAuthenticatedForCloud
                  ? 'IndexedDB cache → Cloud Firestore automatic update'
                  : 'IndexedDB cache → Online Server Ledger automatic update'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {snapshot.recentSales.some((s) => s.status === 'synced') && (
                <button
                  type="button"
                  onClick={() => void clearSyncedHistory()}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-[#6B625C] dark:text-[#C9BFB6] hover:bg-[#EFE8E0] dark:hover:bg-[#2E2A26] transition-colors cursor-pointer"
                  title="Clear completed sync entries"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close sync queue"
                className="p-1 rounded-lg text-[#8A7E75] hover:text-[#141414] dark:hover:text-white hover:bg-[#EFE8E0] dark:hover:bg-[#2E2A26] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-[#EFE8E0] dark:divide-[#2A2622]">
            {snapshot.recentSales.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[#7D6E65] dark:text-[#A89E96]">
                No cached offline sales in IndexedDB.
              </div>
            ) : (
              snapshot.recentSales.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-[#FAF7F4] dark:hover:bg-[#221F1C]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-numbers font-semibold text-[#141414] dark:text-[#F6F1EB] truncate">
                        {item.invoiceNo}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide ${
                          item.status === 'synced'
                            ? 'text-[#2F6B4F] dark:text-[#6EE7B7]'
                            : item.status === 'syncing'
                            ? 'text-[#141414] dark:text-[#F3E1DF]'
                            : item.status === 'failed'
                            ? 'text-[#9B2C2C] dark:text-[#FCA5A5]'
                            : 'text-[#9A6B2F] dark:text-[#F1D29B]'
                        }`}
                      >
                        {item.status === 'synced'
                          ? `Updated Online${item.syncTarget === 'firestore' ? ' · Firestore' : ''}`
                          : item.status === 'syncing'
                          ? 'Updating...'
                          : item.status === 'failed'
                          ? 'Retry Queued'
                          : 'Pending Offline'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#7D6E65] dark:text-[#A89E96] truncate mt-0.5">
                      {item.customerName} · {storeProfile.currency} {item.grandTotal.toLocaleString()} ·{' '}
                      {item.paymentMethod}
                      {item.syncedAt && item.status === 'synced' && (
                        <> · {new Date(item.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                      )}
                    </div>
                    {item.lastError && item.status === 'failed' && (
                      <div className="text-[10px] text-[#9B2C2C] dark:text-[#FCA5A5] truncate mt-0.5">
                        Retry {item.retryCount}/{item.maxRetries}: {item.lastError}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    {item.status === 'failed' ? (
                      <button
                        type="button"
                        disabled={actuallyOffline || isSyncing}
                        onClick={() => void retryItem(item.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] text-white dark:text-[#141414] text-[11px] font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    ) : item.status === 'synced' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#2F6B4F] dark:text-[#6EE7B7]" />
                    ) : item.status === 'syncing' ? (
                      <RefreshCw className="w-4 h-4 text-[#141414] dark:text-[#F3E1DF] animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 text-[#9A6B2F] dark:text-[#F1D29B]" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-[#EFE8E0] dark:border-[#2A2622] bg-[#FAF7F4] dark:bg-[#221F1C] flex items-center justify-between gap-2 text-[11px]">
            <span className="text-[#7D6E65] dark:text-[#A89E96] truncate">
              {actuallyOffline
                ? 'Waiting for online connection'
                : snapshot.lastSyncAt
                ? `Last updated ${new Date(snapshot.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Auto-updates on reconnect'}
            </span>
            {canReconnectManually ? (
              <button
                type="button"
                onClick={handleGoOnlineAndSync}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] text-white dark:text-[#141414] px-2.5 py-1 text-[11px] font-semibold cursor-pointer shrink-0"
              >
                <Wifi className="w-3 h-3" />
                <span>Go Online &amp; Sync</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleTriggerSync()}
                disabled={actuallyOffline || isSyncing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] text-white dark:text-[#141414] px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Updating...' : 'Update Online'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Compact Floating Status Bar */}
      <div
        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-lg transition-all bg-white dark:bg-[#1A1816] text-[#141414] dark:text-[#F6F1EB] ${
          actuallyOffline
            ? 'border-[#D4B483] dark:border-[#6B5434]'
            : snapshot.failedSalesCount > 0
            ? 'border-[#E5C6C3] dark:border-[#6B3A3A]'
            : isSyncing
            ? 'border-[#141414]/30 dark:border-[#F3E1DF]/40'
            : 'border-[#B7D7C7] dark:border-[#2F6B4F]'
        }`}
      >
        {actuallyOffline ? (
          <WifiOff className="w-4 h-4 text-[#9A6B2F] dark:text-[#F1D29B] shrink-0" />
        ) : isSyncing ? (
          <RefreshCw className="w-4 h-4 text-[#141414] dark:text-[#F3E1DF] animate-spin shrink-0" />
        ) : snapshot.failedSalesCount > 0 ? (
          <AlertTriangle className="w-4 h-4 text-[#9B2C2C] dark:text-[#FCA5A5] shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-[#2F6B4F] dark:text-[#6EE7B7] shrink-0" />
        )}

        <span className="truncate">
          {actuallyOffline
            ? `Offline — Caching sales locally${pendingCount > 0 ? ` (${pendingCount} queued)` : ''}`
            : isSyncing
            ? `Updating ${Math.max(1, pendingCount)} offline sale${pendingCount === 1 ? '' : 's'} online...`
            : snapshot.failedSalesCount > 0
            ? `${snapshot.failedSalesCount} sale${snapshot.failedSalesCount === 1 ? '' : 's'} retrying automatically`
            : hasQueuedWork
            ? `${snapshot.totalPendingCount} offline sale${snapshot.totalPendingCount === 1 ? '' : 's'} ready to update online`
            : recentSyncBanner || 'All offline sales updated online'}
        </span>

        {canReconnectManually && (
          <button
            type="button"
            onClick={handleGoOnlineAndSync}
            className="inline-flex items-center gap-1 rounded-lg bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] text-white dark:text-[#141414] px-2.5 py-1 text-[11px] font-semibold cursor-pointer shrink-0"
          >
            <Wifi className="w-3 h-3" />
            <span>Go Online</span>
          </button>
        )}

        {!actuallyOffline && hasQueuedWork && (
          <button
            type="button"
            onClick={() => void handleTriggerSync()}
            disabled={isSyncing}
            className="inline-flex items-center gap-1 rounded-lg bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] text-white dark:text-[#141414] px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Updating' : 'Update'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setDrawerOpen((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-lg border border-[#E8E0D8] dark:border-[#2E2A26] px-2 py-1 text-[11px] font-semibold text-[#4A433E] dark:text-[#E8E0D8] hover:bg-[#FAF7F4] dark:hover:bg-[#24201C] cursor-pointer shrink-0"
          title="View IndexedDB offline sales queue"
        >
          <span>Queue</span>
          {drawerOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
};
