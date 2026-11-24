import React, { useEffect, useRef, useState } from 'react';
import {
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
  const { storeProfile, isOffline, syncOfflineSales } = usePos();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [recentSyncBanner, setRecentSyncBanner] = useState<string | null>(null);
  const prevSyncedRef = useRef<number>(snapshot.syncedThisSession);

  useEffect(() => {
    if (snapshot.syncedThisSession > prevSyncedRef.current) {
      const delta = snapshot.syncedThisSession - prevSyncedRef.current;
      prevSyncedRef.current = snapshot.syncedThisSession;
      setRecentSyncBanner(
        `Synced ${delta} offline sale${delta === 1 ? '' : 's'} to Firestore`
      );
      const timer = setTimeout(() => setRecentSyncBanner(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [snapshot.syncedThisSession]);

  const actuallyOffline = !snapshot.isOnline || snapshot.isManualOffline || isOffline;
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

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 z-40 max-w-md w-[calc(100vw-2rem)] sm:w-auto">
      {/* Expandable IndexedDB Offline Sales Queue Drawer */}
      {drawerOpen && (
        <div className="mb-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950/60">
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CloudUpload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Offline Sales Sync Queue</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                IndexedDB cache → Firestore automatic push
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {snapshot.recentSales.some((s) => s.status === 'synced') && (
                <button
                  type="button"
                  onClick={() => void clearSyncedHistory()}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {snapshot.recentSales.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No cached offline sales in IndexedDB.
              </div>
            ) : (
              snapshot.recentSales.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white truncate">
                        {item.invoiceNo}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.status === 'synced'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : item.status === 'syncing'
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            : item.status === 'failed'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.customerName} · {storeProfile.currency} {item.grandTotal.toLocaleString()} ·{' '}
                      {item.paymentMethod}
                    </div>
                    {item.lastError && item.status === 'failed' && (
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 truncate mt-0.5">
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
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    ) : item.status === 'synced' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : item.status === 'syncing' ? (
                      <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              {!snapshot.isAuthenticatedForCloud
                ? 'Sign in with Google to push cached sales to Firestore'
                : snapshot.lastSyncAt
                ? `Last synced ${new Date(snapshot.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Auto-syncs on reconnect'}
            </span>
            <button
              type="button"
              onClick={() => void handleTriggerSync()}
              disabled={actuallyOffline || isSyncing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Compact Floating Status Bar */}
      <div
        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-lg transition-all bg-white dark:bg-slate-900 ${
          actuallyOffline
            ? 'border-amber-300 dark:border-amber-700 text-slate-900 dark:text-slate-100'
            : snapshot.failedSalesCount > 0
            ? 'border-rose-300 dark:border-rose-700 text-slate-900 dark:text-slate-100'
            : isSyncing
            ? 'border-indigo-300 dark:border-indigo-700 text-slate-900 dark:text-slate-100'
            : 'border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-slate-100'
        }`}
      >
        {actuallyOffline ? (
          <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        ) : isSyncing ? (
          <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
        ) : snapshot.failedSalesCount > 0 ? (
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        )}

        <span className="truncate">
          {actuallyOffline
            ? `Offline — Caching sales in IndexedDB${pendingCount > 0 ? ` (${pendingCount} queued)` : ''}`
            : isSyncing
            ? `Syncing ${Math.max(1, pendingCount)} cached sale${pendingCount === 1 ? '' : 's'} to Firestore...`
            : snapshot.failedSalesCount > 0
            ? `${snapshot.failedSalesCount} sale${snapshot.failedSalesCount === 1 ? '' : 's'} retrying automatically`
            : hasQueuedWork
            ? `${snapshot.totalPendingCount} transaction${snapshot.totalPendingCount === 1 ? '' : 's'} ready for Firestore sync`
            : recentSyncBanner || 'Synced with Firestore'}
        </span>

        {!actuallyOffline && hasQueuedWork && (
          <button
            type="button"
            onClick={() => void handleTriggerSync()}
            disabled={isSyncing}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing' : 'Sync'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setDrawerOpen((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          title="View IndexedDB sync queue"
        >
          <span>Queue</span>
          {drawerOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
};
