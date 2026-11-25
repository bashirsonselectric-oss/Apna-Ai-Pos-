/**
 * Background Synchronization Service (IndexedDB -> Cloud Firestore)
 *
 * Responsibilities:
 * 1. Write-ahead caching of POS sales transactions in IndexedDB (`offlineSales`)
 *    whenever the device is offline, in manual offline mode, or encounters a transient network drop.
 * 2. Automatic background push to Firestore upon connectivity restoration (`online`),
 *    tab focus (`visibilitychange`), Firebase Auth hydration (`onAuthStateChanged`),
 *    periodic sweeps, and Service Worker Background Sync registration (when supported).
 * 3. Guaranteed parent-store provisioning before subcollection sale writes (`isStoreOwner` rule).
 * 4. Idempotent Firestore creation by deterministic `saleId` (prevents duplicate sales on retries).
 * 5. Exponential backoff retry scheduling + single-flight lock + cross-tab BroadcastChannel sync.
 */

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from './firebase';
import {
  offlineDb,
  OfflineSaleRecord,
  OfflineSaleStoreMeta,
  sanitizeFirestoreId,
} from './offlineDb';
import { flushOfflineSyncQueue } from './firestoreSync';
import { safeJsonFetch } from './safeFetch';
import type { SaleRecord } from '../types';

export type BackgroundSyncState = 'idle' | 'syncing' | 'offline' | 'error';

export interface BackgroundSyncSnapshot {
  state: BackgroundSyncState;
  isOnline: boolean;
  isManualOffline: boolean;
  isAuthenticatedForCloud: boolean;
  pendingSalesCount: number;
  failedSalesCount: number;
  pendingOtherCount: number;
  totalPendingCount: number;
  syncedThisSession: number;
  lastSyncAt: string | null;
  lastError: string | null;
  nextRetryAt: number | null;
  recentSales: OfflineSaleRecord[];
}

export interface SyncRunResult {
  syncedSales: number;
  syncedOther: number;
  failed: number;
  syncedSaleIds: string[];
  skippedReason?: string;
}

type SnapshotListener = (snapshot: BackgroundSyncSnapshot) => void;
type SaleSyncedCallback = (saleId: string, syncedAt: string) => void;

const ALLOWED_PAYMENT_METHODS = new Set([
  'cash',
  'jazzcash',
  'easypaisa',
  'card',
  'bank_transfer',
  'split',
  'udhar',
]);

const BASE_RETRY_MS = 2500;
const MAX_RETRY_MS = 60_000;
const SWEEP_INTERVAL_MS = 30_000;
const MAX_RETRIES = 8;
const BG_SYNC_TAG = 'apna-pos-sales-sync';
const BROADCAST_CHANNEL_NAME = 'apna-pos-bg-sync';

function normalizePaymentMethod(raw?: string): string {
  const val = String(raw || 'cash').toLowerCase().trim();
  if (ALLOWED_PAYMENT_METHODS.has(val)) return val;
  if (val.includes('jazz')) return 'jazzcash';
  if (val.includes('easy')) return 'easypaisa';
  if (val.includes('bank') || val.includes('raast')) return 'bank_transfer';
  if (val.includes('card')) return 'card';
  if (val.includes('split')) return 'split';
  if (val.includes('udhar') || val.includes('credit')) return 'udhar';
  return 'cash';
}

function isTransientNetworkError(err: unknown): boolean {
  const msg = String((err as any)?.message || err || '').toLowerCase();
  const code = String((err as any)?.code || '').toLowerCase();
  return (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'aborted' ||
    code === 'resource-exhausted' ||
    msg.includes('network') ||
    msg.includes('offline') ||
    msg.includes('failed to fetch') ||
    msg.includes('timeout') ||
    msg.includes('unavailable')
  );
}

function computeBackoffMs(retryCount: number): number {
  const exp = Math.min(MAX_RETRY_MS, BASE_RETRY_MS * Math.pow(2, Math.max(0, retryCount)));
  const jitter = Math.floor(Math.random() * 600);
  return exp + jitter;
}

class BackgroundSyncService {
  private started = false;
  private isProcessing = false;
  private isManualOffline = false;
  private syncedThisSession = 0;
  private lastSyncAt: string | null = null;
  private lastError: string | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private sweepInterval: ReturnType<typeof setInterval> | null = null;
  private unsubscribeAuth: (() => void) | null = null;
  private channel: BroadcastChannel | null = null;

  private listeners = new Set<SnapshotListener>();
  private saleSyncedCallbacks = new Set<SaleSyncedCallback>();

  private snapshot: BackgroundSyncSnapshot = {
    state: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'idle',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isManualOffline: false,
    isAuthenticatedForCloud: false,
    pendingSalesCount: 0,
    failedSalesCount: 0,
    pendingOtherCount: 0,
    totalPendingCount: 0,
    syncedThisSession: 0,
    lastSyncAt: null,
    lastError: null,
    nextRetryAt: null,
    recentSales: [],
  };

  private handleWindowOnline = () => {
    this.lastError = null;
    void this.refreshSnapshot().then(() => {
      if (!this.isManualOffline) {
        void this.syncNow('online_event');
      }
    });
  };

  private handleWindowOffline = () => {
    this.clearRetryTimer();
    void this.refreshSnapshot();
  };

  private handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      void this.refreshSnapshot().then(() => {
        if (this.canSyncOnline() && this.snapshot.totalPendingCount > 0) {
          void this.syncNow('visibility_restore');
        }
      });
    }
  };

  private handleSwMessage = (event: MessageEvent) => {
    if (event.data && (event.data.type === 'TRIGGER_BG_SYNC' || event.data.tag === BG_SYNC_TAG)) {
      void this.syncNow('service_worker');
    }
  };

  public start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    window.addEventListener('online', this.handleWindowOnline);
    window.addEventListener('offline', this.handleWindowOffline);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleSwMessage);
    }

    // Cross-tab coordination so multiple open POS tabs stay in sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (ev) => {
          if (ev.data?.type === 'QUEUE_UPDATED') {
            void this.refreshSnapshot();
          } else if (ev.data?.type === 'SALE_SYNCED' && ev.data.saleId) {
            this.notifySaleSynced(ev.data.saleId, ev.data.syncedAt || new Date().toISOString(), false);
            void this.refreshSnapshot();
          }
        };
      } catch {
        this.channel = null;
      }
    }

    // Trigger sync automatically whenever Firebase Auth signs in or hydrates
    this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      void this.refreshSnapshot().then(() => {
        if (user && user.emailVerified && this.canSyncToCloud()) {
          void this.syncNow('auth_ready');
        }
      });
    });

    // Periodic safety-net sweep while online and queue is non-empty
    this.sweepInterval = setInterval(() => {
      if (this.canSyncOnline() && this.snapshot.totalPendingCount > 0 && !this.isProcessing) {
        void this.syncNow('periodic_sweep');
      }
    }, SWEEP_INTERVAL_MS);

    void this.refreshSnapshot().then(() => {
      if (this.canSyncOnline() && this.snapshot.totalPendingCount > 0) {
        void this.syncNow('startup');
      }
    });
  }

  public stop(): void {
    if (!this.started || typeof window === 'undefined') return;
    this.started = false;
    window.removeEventListener('online', this.handleWindowOnline);
    window.removeEventListener('offline', this.handleWindowOffline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', this.handleSwMessage);
    }
    this.clearRetryTimer();
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval);
      this.sweepInterval = null;
    }
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
      this.unsubscribeAuth = null;
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }

  public setManualOffline(offline: boolean): void {
    const wasOffline = this.isManualOffline;
    this.isManualOffline = offline;
    void this.refreshSnapshot().then(() => {
      if (wasOffline && !offline && navigator.onLine) {
        void this.syncNow('manual_reconnect');
      }
    });
  }

  public getSnapshot(): BackgroundSyncSnapshot {
    return this.snapshot;
  }

  public subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onSaleSynced(callback: SaleSyncedCallback): () => void {
    this.saleSyncedCallbacks.add(callback);
    return () => {
      this.saleSyncedCallbacks.delete(callback);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.snapshot);
      } catch {
        // Ignore subscriber errors
      }
    }
  }

  private broadcast(message: Record<string, any>): void {
    try {
      this.channel?.postMessage(message);
    } catch {
      // Non-fatal
    }
  }

  private notifySaleSynced(saleId: string, syncedAt: string, shouldBroadcast = true): void {
    for (const cb of this.saleSyncedCallbacks) {
      try {
        cb(saleId, syncedAt);
      } catch {
        // Ignore
      }
    }
    if (shouldBroadcast) {
      this.broadcast({ type: 'SALE_SYNCED', saleId, syncedAt });
    }
  }

  private clearRetryTimer(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private canSyncOnline(): boolean {
    if (typeof navigator === 'undefined') return false;
    return Boolean(navigator.onLine && !this.isManualOffline);
  }

  private canSyncToCloud(): boolean {
    if (!this.canSyncOnline()) return false;
    const user = auth.currentUser;
    return Boolean(user && user.uid && user.emailVerified);
  }

  private getCurrentOwnerId(): string | undefined {
    const user = auth.currentUser;
    return user?.uid ? sanitizeFirestoreId(user.uid) : undefined;
  }

  private async registerNativeBackgroundSync(): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const syncManager = (reg as any).sync;
      if (syncManager && typeof syncManager.register === 'function') {
        await syncManager.register(BG_SYNC_TAG);
      }
    } catch {
      // Native Background Sync API is optional (not supported in Safari/Firefox)
    }
  }

  /**
   * Write-ahead cache a POS sale transaction in IndexedDB first, then push to Firestore
   * immediately if online, or schedule background synchronization once connectivity returns.
   */
  public async cacheAndSyncSale(
    storeIdRaw: string,
    sale: SaleRecord,
    storeMeta?: OfflineSaleStoreMeta,
    forceOfflineCache = false
  ): Promise<{ cached: boolean; syncedImmediately: boolean; recordId: string }> {
    const user = auth.currentUser;
    const ownerId = user?.uid ? sanitizeFirestoreId(user.uid) : 'unclaimed';
    const storeId = sanitizeFirestoreId(storeIdRaw);
    const saleId = sanitizeFirestoreId(sale.id);
    const nowIso = new Date().toISOString();

    const record: OfflineSaleRecord = {
      id: saleId,
      ownerId,
      ownerEmail: user?.email || undefined,
      storeId,
      storeMeta,
      invoiceNo: String(sale.invoiceNo || saleId).slice(0, 64),
      customerName: String(sale.customerName || 'Walk-in Customer').slice(0, 160),
      grandTotal: Math.max(0, Number(sale.grandTotal) || 0),
      paymentMethod: normalizePaymentMethod(sale.paymentMethod),
      sale,
      status: 'pending',
      retryCount: 0,
      maxRetries: MAX_RETRIES,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 1. Always durably persist to IndexedDB first (Write-Ahead Cache)
    await offlineDb.putOfflineSale(record);
    this.broadcast({ type: 'QUEUE_UPDATED' });
    await this.refreshSnapshot();

    // 2. Register browser Background Sync tag as progressive enhancement
    void this.registerNativeBackgroundSync();

    // 3. If offline or manual offline mode, leave queued in IndexedDB for automatic push later
    if (forceOfflineCache || !this.canSyncOnline()) {
      return { cached: true, syncedImmediately: false, recordId: saleId };
    }

    // 4. Online: trigger immediate background push (Firestore if verified, otherwise persistent Server Ledger)
    const res = await this.syncNow('immediate_sale');
    const syncedImmediately = res.syncedSaleIds.includes(sale.id) || res.syncedSaleIds.includes(saleId);
    return { cached: true, syncedImmediately, recordId: saleId };
  }

  /**
   * Update a cached offline sale record before or during online sync.
   */
  public async updateCachedSale(sale: SaleRecord): Promise<void> {
    const saleId = sanitizeFirestoreId(sale.id);
    const existing = await offlineDb.getOfflineSale(saleId);
    if (!existing) return;

    await offlineDb.updateOfflineSale(saleId, {
      sale,
      customerName: String(sale.customerName || existing.customerName).slice(0, 160),
      grandTotal: Math.max(0, Number(sale.grandTotal) || 0),
      paymentMethod: normalizePaymentMethod(sale.paymentMethod),
      status: 'pending',
      retryCount: 0,
      nextRetryAt: undefined,
      lastError: undefined,
    });
    this.broadcast({ type: 'QUEUE_UPDATED' });
    await this.refreshSnapshot();

    if (this.canSyncOnline()) {
      void this.syncNow('sale_updated');
    }
  }

  /**
   * Ensures parent `stores/{storeId}` document exists in Firestore before pushing sales
   * so `isStoreOwner(storeId)` in `firestore.rules` always passes.
   */
  private async ensureParentStoreDoc(
    ownerId: string,
    storeId: string,
    storeMeta?: OfflineSaleStoreMeta
  ): Promise<void> {
    const storeRef = doc(db, 'stores', storeId);
    const storeSnap = await getDoc(storeRef);
    if (storeSnap.exists()) return;

    const path = `stores/${storeId}`;
    try {
      await setDoc(storeRef, {
        id: storeId,
        ownerId,
        businessName: String(storeMeta?.businessName || 'My Retail Store').slice(0, 160),
        storeName: String(storeMeta?.businessName || 'Main Store').slice(0, 160),
        currency: String(storeMeta?.currency || 'Rs.').slice(0, 12),
        taxRate: 0,
        vertical: String(storeMeta?.vertical || 'electrical_hardware').slice(0, 64),
        ...(storeMeta?.phone ? { phone: String(storeMeta.phone).slice(0, 40) } : {}),
        ...(storeMeta?.city ? { city: String(storeMeta.city).slice(0, 100) } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      if (!isTransientNetworkError(err)) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
      throw err;
    }
  }

  /**
   * Idempotently pushes a single IndexedDB-cached sale record to Firestore.
   */
  private async pushSaleRecordToFirestore(record: OfflineSaleRecord, ownerId: string): Promise<string> {
    const storeId = sanitizeFirestoreId(record.storeId);
    const saleId = sanitizeFirestoreId(record.id);
    const path = `stores/${storeId}/sales/${saleId}`;

    // Guarantee parent store exists for `isStoreOwner(storeId)` security rule
    await this.ensureParentStoreDoc(ownerId, storeId, record.storeMeta);

    const ref = doc(db, 'stores', storeId, 'sales', saleId);
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      // Already present in Firestore (idempotent deduplication)
      return new Date().toISOString();
    }

    const sale = record.sale;
    const rawItems = Array.isArray(sale.items) ? sale.items : [];
    const sanitizedItems = rawItems.slice(0, 100).map((item) => ({
      productId: String(item.productId || 'custom_item').slice(0, 128),
      name: String(item.name || 'Item').slice(0, 200),
      quantity: Math.max(0.01, Number(item.quantity) || 1),
      unit: String(item.unit || 'pcs').slice(0, 32),
      unitPrice: Math.max(0, Number(item.unitPrice) || 0),
      subtotal: Math.max(0, Number(item.subtotal) || 0),
      costPrice: Math.max(0, Number(item.costPrice) || 0),
    }));

    // Firestore rule `isValidSale` requires items.size() >= 1
    const safeItems =
      sanitizedItems.length > 0
        ? sanitizedItems
        : [
            {
              productId: 'pos_sale_item',
              name: 'POS Sale',
              quantity: 1,
              unit: 'pcs',
              unitPrice: Math.max(0, Number(sale.grandTotal) || 0),
              subtotal: Math.max(0, Number(sale.grandTotal) || 0),
              costPrice: 0,
            },
          ];

    try {
      await setDoc(ref, {
        id: saleId,
        ownerId,
        storeId,
        invoiceNo: String(sale.invoiceNo || saleId).slice(0, 64),
        customerName: String(sale.customerName || 'Walk-in Customer').slice(0, 160),
        ...(sale.customerPhone ? { customerPhone: String(sale.customerPhone).slice(0, 40) } : {}),
        items: safeItems,
        subtotal: Math.max(0, Number(sale.subtotal) || 0),
        discountAmount: Math.max(0, Number(sale.discountAmount) || 0),
        taxAmount: Math.max(0, Number(sale.taxAmount) || 0),
        grandTotal: Math.max(0, Number(sale.grandTotal) || 0),
        profit: Number(sale.profit) || 0,
        paymentMethod: normalizePaymentMethod(sale.paymentMethod),
        status: 'completed',
        timestamp: String(sale.timestamp || record.createdAt || new Date().toISOString()).slice(0, 64),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return new Date().toISOString();
    } catch (err) {
      if (!isTransientNetworkError(err)) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
      throw err;
    }
  }

  /**
   * Executes a single-flight background synchronization pass, pushing all eligible
   * IndexedDB-cached sales + pending entities to Firestore.
   */
  public async syncNow(_reason = 'manual'): Promise<SyncRunResult> {
    if (this.isProcessing) {
      return { syncedSales: 0, syncedOther: 0, failed: 0, syncedSaleIds: [], skippedReason: 'already_syncing' };
    }

    if (!navigator.onLine || this.isManualOffline) {
      await this.refreshSnapshot();
      return { syncedSales: 0, syncedOther: 0, failed: 0, syncedSaleIds: [], skippedReason: 'offline' };
    }

    const user = auth.currentUser;
    const useFirestore = Boolean(user && user.uid && user.emailVerified);

    this.isProcessing = true;
    this.clearRetryTimer();
    this.lastError = null;
    await this.refreshSnapshot('syncing');

    const ownerId: string | undefined = useFirestore && user ? sanitizeFirestoreId(user.uid) : undefined;
    let syncedSales = 0;
    let syncedOther = 0;
    let failed = 0;
    const syncedSaleIds: string[] = [];
    let earliestNextRetry: number | null = null;

    try {
      const pendingSales: OfflineSaleRecord[] = await offlineDb.getPendingOfflineSales(ownerId);
      const now = Date.now();

      if (useFirestore && ownerId && user) {
        const verifiedOwnerId: string = ownerId;
        for (const record of pendingSales) {
          if (!navigator.onLine || this.isManualOffline) break;

          // Skip records waiting on backoff unless explicitly triggered manually
          if (_reason !== 'manual' && record.nextRetryAt && record.nextRetryAt > now) {
            earliestNextRetry =
              earliestNextRetry === null ? record.nextRetryAt : Math.min(earliestNextRetry, record.nextRetryAt);
            continue;
          }

          // Claim unclaimed offline sales created before Firebase auth hydrated
          const claimedOwnerId: string = record.ownerId === 'unclaimed' ? verifiedOwnerId : record.ownerId;
          if (claimedOwnerId !== verifiedOwnerId) continue;

          await offlineDb.updateOfflineSale(record.id, {
            ownerId,
            ownerEmail: user.email || record.ownerEmail,
            status: 'syncing',
            lastError: undefined,
          });
          await this.refreshSnapshot('syncing');

          try {
            const syncedAt = await this.pushSaleRecordToFirestore(record, ownerId);
            await offlineDb.updateOfflineSale(record.id, {
              ownerId,
              status: 'synced',
              syncTarget: 'firestore',
              syncedAt,
              nextRetryAt: undefined,
              lastError: undefined,
            });
            syncedSales++;
            this.syncedThisSession++;
            syncedSaleIds.push(record.sale.id);
            if (record.id !== record.sale.id) {
              syncedSaleIds.push(record.id);
            }
            this.notifySaleSynced(record.sale.id, syncedAt, true);
          } catch (err: any) {
            failed++;
            const nextRetryCount = (record.retryCount || 0) + 1;
            const backoffMs = computeBackoffMs(nextRetryCount);
            const nextRetryAt = Date.now() + backoffMs;
            const errorMsg = err?.message || 'Failed to push sale to Firestore';
            this.lastError = errorMsg;

            await offlineDb.updateOfflineSale(record.id, {
              status: 'failed',
              retryCount: nextRetryCount,
              nextRetryAt: nextRetryCount <= record.maxRetries ? nextRetryAt : undefined,
              lastError: errorMsg.slice(0, 240),
            });

            if (nextRetryCount <= record.maxRetries) {
              earliestNextRetry =
                earliestNextRetry === null ? nextRetryAt : Math.min(earliestNextRetry, nextRetryAt);
            }
          }
        }

        // Also flush general IndexedDB entity queue (products stock, stores, customers, expenses, returns, logs)
        const otherRes = await flushOfflineSyncQueue();
        syncedOther = otherRes.synced;
        failed += otherRes.failed;
      } else {
        // Server Online Ledger Sync for Email/Password & Local Boutique Sessions
        const eligibleRecords = pendingSales.filter((record) => {
          if (_reason !== 'manual' && record.nextRetryAt && record.nextRetryAt > now) {
            earliestNextRetry =
              earliestNextRetry === null ? record.nextRetryAt : Math.min(earliestNextRetry, record.nextRetryAt);
            return false;
          }
          return true;
        });

        // Group by storeId so each boutique's sales reconcile cleanly
        const byStore = new Map<string, OfflineSaleRecord[]>();
        for (const rec of eligibleRecords) {
          const list = byStore.get(rec.storeId) || [];
          list.push(rec);
          byStore.set(rec.storeId, list);
        }

        for (const [storeId, batch] of byStore.entries()) {
          if (!navigator.onLine || this.isManualOffline) break;

          for (const rec of batch) {
            await offlineDb.updateOfflineSale(rec.id, { status: 'syncing', lastError: undefined });
          }
          await this.refreshSnapshot('syncing');

          try {
            const res = await safeJsonFetch<{
              success: boolean;
              syncedIds?: string[];
              serverTimestamp?: string;
              error?: string;
            }>('/api/pos/sync-offline-sales', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessId: storeId,
                sales: batch.map((r) => r.sale),
              }),
            });

            if (res.isStaticFallback) {
              // Static Vercel hosting without Express /api server: keep sales safely pending for Cloud Firestore sync once signed in with Google
              for (const rec of batch) {
                await offlineDb.updateOfflineSale(rec.id, {
                  status: 'pending',
                  lastError: 'Sign in with Google to sync offline sales to Cloud Firestore.',
                });
              }
              this.lastError = 'Sign in with Google to sync offline sales to Cloud Firestore.';
              return { syncedSales, syncedOther, failed, syncedSaleIds, skippedReason: 'unauthenticated' };
            }

            if (!res.ok || !res.data?.success) {
              throw new Error(res.error || res.data?.error || `Online sync returned HTTP ${res.status}`);
            }

            const data = res.data;
            const serverTimestamp = data.serverTimestamp || new Date().toISOString();
            const confirmedSet = new Set<string>(Array.isArray(data.syncedIds) ? data.syncedIds : []);

            for (const rec of batch) {
              if (confirmedSet.size === 0 || confirmedSet.has(rec.sale.id) || confirmedSet.has(rec.id)) {
                await offlineDb.updateOfflineSale(rec.id, {
                  status: 'synced',
                  syncTarget: 'server',
                  syncedAt: serverTimestamp,
                  nextRetryAt: undefined,
                  lastError: undefined,
                });
                syncedSales++;
                this.syncedThisSession++;
                syncedSaleIds.push(rec.sale.id);
                if (rec.id !== rec.sale.id) {
                  syncedSaleIds.push(rec.id);
                }
                this.notifySaleSynced(rec.sale.id, serverTimestamp, true);
              }
            }
          } catch (err: any) {
            const errorMsg = err?.message || 'Unable to reach online sync server';
            this.lastError = errorMsg;
            for (const rec of batch) {
              failed++;
              const nextRetryCount = (rec.retryCount || 0) + 1;
              const backoffMs = computeBackoffMs(nextRetryCount);
              const nextRetryAt = Date.now() + backoffMs;
              await offlineDb.updateOfflineSale(rec.id, {
                status: 'failed',
                retryCount: nextRetryCount,
                nextRetryAt: nextRetryCount <= rec.maxRetries ? nextRetryAt : undefined,
                lastError: errorMsg.slice(0, 240),
              });
              if (nextRetryCount <= rec.maxRetries) {
                earliestNextRetry =
                  earliestNextRetry === null ? nextRetryAt : Math.min(earliestNextRetry, nextRetryAt);
              }
            }
          }
        }
      }

      if (syncedSales > 0 || syncedOther > 0) {
        this.lastSyncAt = new Date().toISOString();
        this.broadcast({ type: 'QUEUE_UPDATED' });
      }

      if (earliestNextRetry !== null && this.canSyncOnline()) {
        this.scheduleRetry(Math.max(1500, earliestNextRetry - Date.now()));
      }

      return { syncedSales, syncedOther, failed, syncedSaleIds };
    } finally {
      this.isProcessing = false;
      await this.refreshSnapshot();
    }
  }

  public async retryItem(recordId: string): Promise<SyncRunResult> {
    await offlineDb.updateOfflineSale(recordId, {
      status: 'pending',
      retryCount: 0,
      nextRetryAt: undefined,
      lastError: undefined,
    });
    this.broadcast({ type: 'QUEUE_UPDATED' });
    await this.refreshSnapshot();
    return this.syncNow('manual');
  }

  public async clearSyncedHistory(): Promise<number> {
    const ownerId = this.getCurrentOwnerId();
    const removed = await offlineDb.clearSyncedOfflineSales(ownerId);
    this.broadcast({ type: 'QUEUE_UPDATED' });
    await this.refreshSnapshot();
    return removed;
  }

  private scheduleRetry(delayMs: number): void {
    this.clearRetryTimer();
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (this.canSyncOnline()) {
        void this.syncNow('backoff_retry');
      }
    }, delayMs);
  }

  public async refreshSnapshot(overrideState?: BackgroundSyncState): Promise<BackgroundSyncSnapshot> {
    const ownerId = this.getCurrentOwnerId();
    const allSales = await offlineDb.getAllOfflineSales(ownerId);
    const pendingOther = ownerId ? (await offlineDb.getPendingSyncItems(ownerId)).length : 0;

    const pendingSales = allSales.filter((s) => s.status === 'pending' || s.status === 'syncing');
    const failedSales = allSales.filter((s) => s.status === 'failed');

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const effectivelyOffline = !isOnline || this.isManualOffline;
    const user = auth.currentUser;
    const isAuthenticatedForCloud = Boolean(user && user.uid && user.emailVerified);

    const nextRetryCandidates = failedSales
      .map((s) => s.nextRetryAt)
      .filter((t): t is number => typeof t === 'number' && t > Date.now());
    const nextRetryAt = nextRetryCandidates.length > 0 ? Math.min(...nextRetryCandidates) : null;

    let state: BackgroundSyncState = overrideState || 'idle';
    if (!overrideState) {
      if (this.isProcessing) {
        state = 'syncing';
      } else if (effectivelyOffline) {
        state = 'offline';
      } else if (failedSales.length > 0) {
        state = 'error';
      } else {
        state = 'idle';
      }
    }

    this.snapshot = {
      state,
      isOnline,
      isManualOffline: this.isManualOffline,
      isAuthenticatedForCloud,
      pendingSalesCount: pendingSales.length,
      failedSalesCount: failedSales.length,
      pendingOtherCount: pendingOther,
      totalPendingCount: pendingSales.length + failedSales.length + pendingOther,
      syncedThisSession: this.syncedThisSession,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
      nextRetryAt,
      recentSales: allSales.slice(0, 50),
    };

    this.emit();
    return this.snapshot;
  }
}

export const backgroundSyncService = new BackgroundSyncService();
