/**
 * Offline-First IndexedDB Engine for Apna AI POS
 * Stores per-user / per-store snapshots, product images (bypassing 5MB localStorage limit),
 * dedicated offline sales transaction cache for background Firestore synchronization,
 * general idempotent sync queue, and verified offline sessions.
 */

import type { SaleRecord } from '../types';

const DB_NAME = 'ApnaPosOfflineDB';
const DB_VERSION = 2;

export type OfflineSaleStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface OfflineSaleStoreMeta {
  businessName: string;
  currency: string;
  vertical: string;
  phone?: string;
  city?: string;
}

export interface OfflineSaleRecord {
  id: string; // Deterministic sanitized sale ID for idempotent Firestore push
  ownerId: string; // Firebase UID or 'unclaimed' until user authenticates
  ownerEmail?: string;
  storeId: string;
  storeMeta?: OfflineSaleStoreMeta;
  invoiceNo: string;
  customerName: string;
  grandTotal: number;
  paymentMethod: string;
  sale: SaleRecord;
  status: OfflineSaleStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  syncTarget?: 'firestore' | 'server';
}

export interface OfflineSyncItem {
  id: string; // Deterministic UUID for duplicate-free sync
  ownerId: string;
  storeId: string;
  entityType: 'store' | 'product' | 'sale' | 'customer' | 'supplier' | 'expense' | 'return' | 'staff' | 'activityLog';
  operation: 'upsert' | 'delete';
  payload: Record<string, any>;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface CachedUserSession {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'owner' | 'admin' | 'manager' | 'cashier' | 'staff';
  activeStoreId?: string;
  lastVerifiedAt: string;
}

export interface ProductImageRecord {
  id: string;
  ownerId: string;
  storeId: string;
  dataUrl: string;
  updatedAt: string;
}

export interface StoreSnapshotRecord {
  key: string; // `${ownerId}::${storeId}`
  ownerId: string;
  storeId: string;
  data: Record<string, any>;
  updatedAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openOfflineDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('storeSnapshots')) {
        db.createObjectStore('storeSnapshots', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('productImages')) {
        const store = db.createObjectStore('productImages', { keyPath: 'id' });
        store.createIndex('by_store', ['ownerId', 'storeId'], { unique: false });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
        store.createIndex('by_owner', 'ownerId', { unique: false });
      }
      if (!db.objectStoreNames.contains('cachedSessions')) {
        db.createObjectStore('cachedSessions', { keyPath: 'email' });
      }
      if (!db.objectStoreNames.contains('offlineSales')) {
        const salesStore = db.createObjectStore('offlineSales', { keyPath: 'id' });
        salesStore.createIndex('by_owner', 'ownerId', { unique: false });
        salesStore.createIndex('by_status', 'status', { unique: false });
        salesStore.createIndex('by_store', 'storeId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error || new Error('Failed to open IndexedDB'));
    };
  });
  return dbPromise;
}

function runTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openOfflineDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const req = executor(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export const offlineDb = {
  // ---------------- DEDICATED OFFLINE SALES CACHE ----------------
  async putOfflineSale(record: OfflineSaleRecord): Promise<void> {
    try {
      await runTx('offlineSales', 'readwrite', (s) => s.put(record));
    } catch {
      // Fallback gracefully if IndexedDB is blocked in private mode
    }
  },

  async getOfflineSale(id: string): Promise<OfflineSaleRecord | null> {
    try {
      const rec = await runTx<OfflineSaleRecord | undefined>('offlineSales', 'readonly', (s) => s.get(id));
      return rec || null;
    } catch {
      return null;
    }
  },

  async getAllOfflineSales(ownerId?: string): Promise<OfflineSaleRecord[]> {
    try {
      const all = await runTx<OfflineSaleRecord[]>('offlineSales', 'readonly', (s) => s.getAll());
      const list = Array.isArray(all) ? all : [];
      const filtered = ownerId
        ? list.filter((r) => r.ownerId === ownerId || r.ownerId === 'unclaimed')
        : list;
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  },

  async getPendingOfflineSales(ownerId?: string): Promise<OfflineSaleRecord[]> {
    const all = await this.getAllOfflineSales(ownerId);
    // Process oldest first (FIFO) to preserve chronological ledger ordering
    return all
      .filter((r) => r.status === 'pending' || r.status === 'failed' || r.status === 'syncing')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async updateOfflineSale(
    id: string,
    patch: Partial<OfflineSaleRecord>
  ): Promise<OfflineSaleRecord | null> {
    try {
      const existing = await this.getOfflineSale(id);
      if (!existing) return null;
      const updated: OfflineSaleRecord = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      await runTx('offlineSales', 'readwrite', (s) => s.put(updated));
      return updated;
    } catch {
      return null;
    }
  },

  async deleteOfflineSale(id: string): Promise<void> {
    try {
      await runTx('offlineSales', 'readwrite', (s) => s.delete(id));
    } catch {
      // Non-fatal
    }
  },

  async clearSyncedOfflineSales(ownerId?: string): Promise<number> {
    try {
      const all = await this.getAllOfflineSales(ownerId);
      const synced = all.filter((r) => r.status === 'synced');
      for (const item of synced) {
        await this.deleteOfflineSale(item.id);
      }
      return synced.length;
    } catch {
      return 0;
    }
  },

  // ---------------- STORE SNAPSHOTS ----------------
  async saveStoreSnapshot(ownerId: string, storeId: string, data: Record<string, any>): Promise<void> {
    try {
      const record: StoreSnapshotRecord = {
        key: `${ownerId}::${storeId}`,
        ownerId,
        storeId,
        data,
        updatedAt: new Date().toISOString(),
      };
      await runTx('storeSnapshots', 'readwrite', (s) => s.put(record));
    } catch {
      // Fallback gracefully in restricted environments
    }
  },

  async loadStoreSnapshot(ownerId: string, storeId: string): Promise<Record<string, any> | null> {
    try {
      const rec = await runTx<StoreSnapshotRecord | undefined>('storeSnapshots', 'readonly', (s) =>
        s.get(`${ownerId}::${storeId}`)
      );
      return rec?.data || null;
    } catch {
      return null;
    }
  },

  // ---------------- PRODUCT IMAGES ----------------
  async saveProductImage(id: string, ownerId: string, storeId: string, dataUrl: string): Promise<string> {
    try {
      const record: ProductImageRecord = {
        id,
        ownerId,
        storeId,
        dataUrl,
        updatedAt: new Date().toISOString(),
      };
      await runTx('productImages', 'readwrite', (s) => s.put(record));
    } catch {
      // Non-fatal
    }
    return id;
  },

  async getProductImage(id: string): Promise<string | null> {
    try {
      const rec = await runTx<ProductImageRecord | undefined>('productImages', 'readonly', (s) => s.get(id));
      return rec?.dataUrl || null;
    } catch {
      return null;
    }
  },

  // ---------------- GENERAL SYNC QUEUE ----------------
  async enqueueSyncItem(item: Omit<OfflineSyncItem, 'createdAt' | 'retryCount'>): Promise<void> {
    try {
      const fullItem: OfflineSyncItem = {
        ...item,
        createdAt: new Date().toISOString(),
        retryCount: 0,
      };
      await runTx('syncQueue', 'readwrite', (s) => s.put(fullItem));
    } catch {
      // Non-fatal
    }
  },

  async getPendingSyncItems(ownerId: string): Promise<OfflineSyncItem[]> {
    try {
      const db = await openOfflineDb();
      return await new Promise<OfflineSyncItem[]>((resolve, reject) => {
        const tx = db.transaction('syncQueue', 'readonly');
        const index = tx.objectStore('syncQueue').index('by_owner');
        const req = index.getAll(ownerId);
        req.onsuccess = () => resolve((req.result as OfflineSyncItem[]) || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  },

  async removeSyncItem(id: string): Promise<void> {
    try {
      await runTx('syncQueue', 'readwrite', (s) => s.delete(id));
    } catch {
      // Non-fatal
    }
  },

  async updateSyncItemError(item: OfflineSyncItem, errorMessage: string): Promise<void> {
    try {
      await runTx('syncQueue', 'readwrite', (s) =>
        s.put({
          ...item,
          retryCount: (item.retryCount || 0) + 1,
          lastError: errorMessage.slice(0, 200),
        })
      );
    } catch {
      // Non-fatal
    }
  },

  // ---------------- CACHED SESSIONS ----------------
  async saveCachedSession(session: CachedUserSession): Promise<void> {
    try {
      await runTx('cachedSessions', 'readwrite', (s) =>
        s.put({ ...session, email: session.email.toLowerCase().trim() })
      );
    } catch {
      // Non-fatal
    }
  },

  async getCachedSession(email: string): Promise<CachedUserSession | null> {
    try {
      const rec = await runTx<CachedUserSession | undefined>('cachedSessions', 'readonly', (s) =>
        s.get(email.toLowerCase().trim())
      );
      return rec || null;
    } catch {
      return null;
    }
  },
};

export function sanitizeFirestoreId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `id_${Date.now()}`;
}
