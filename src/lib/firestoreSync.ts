import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { offlineDb, OfflineSyncItem, sanitizeFirestoreId } from './offlineDb';
import type {
  BusinessAccount,
  Product,
  SaleRecord,
  CustomerKhata,
  Supplier,
  ExpenseRecord,
  ReturnRecord,
} from '../types';

export interface ActivityLogEntry {
  id: string;
  ownerId: string;
  storeId: string;
  actorEmail: string;
  actorRole: string;
  category: 'sale' | 'inventory' | 'auth' | 'store' | 'finance' | 'sync';
  action: string;
  details: string;
  timestamp: string;
}

function isCloudReady(): boolean {
  const user = auth.currentUser;
  return Boolean(user && user.uid && user.emailVerified && navigator.onLine);
}

export async function ensureCloudUserProfile(displayName: string, activeStoreId?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || !navigator.onLine) return;

  const userId = sanitizeFirestoreId(user.uid);
  const path = `users/${userId}`;
  try {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: userId,
        email: (user.email || '').slice(0, 200),
        displayName: (displayName || user.displayName || 'Shop Owner').slice(0, 120),
        role: 'owner',
        ...(activeStoreId ? { activeStoreId: sanitizeFirestoreId(activeStoreId) } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (activeStoreId) {
      await updateDoc(ref, {
        displayName: (displayName || user.displayName || 'Shop Owner').slice(0, 120),
        activeStoreId: sanitizeFirestoreId(activeStoreId),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

const ensuredStoreCache = new Set<string>();

export async function ensureCloudStoreExists(
  storeIdRaw: string,
  meta?: { businessName?: string; currency?: string; vertical?: string; phone?: string; city?: string }
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || !navigator.onLine) return false;

  const ownerId = sanitizeFirestoreId(user.uid);
  const storeId = sanitizeFirestoreId(storeIdRaw);
  const cacheKey = `${ownerId}::${storeId}`;
  if (ensuredStoreCache.has(cacheKey)) return true;

  const path = `stores/${storeId}`;
  try {
    const ref = doc(db, 'stores', storeId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.ownerId === ownerId || user.email?.toLowerCase().trim() === 'bashirsonselectric@gmail.com') {
        ensuredStoreCache.add(cacheKey);
        return true;
      }
      return false;
    }

    await setDoc(ref, {
      id: storeId,
      ownerId,
      businessName: (String(meta?.businessName || '').trim() || 'My Boutique').slice(0, 160),
      storeName: (String(meta?.businessName || '').trim() || 'Main Store').slice(0, 160),
      currency: (String(meta?.currency || '').trim() || 'Rs.').slice(0, 12),
      taxRate: 0,
      vertical: (String(meta?.vertical || '').trim() || 'garments_fashion').slice(0, 64),
      ...(meta?.phone ? { phone: String(meta.phone).slice(0, 40) } : {}),
      ...(meta?.city ? { city: String(meta.city).slice(0, 100) } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    ensuredStoreCache.add(cacheKey);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function upsertCloudStore(biz: BusinessAccount, taxRate = 0, receiptFooter = ''): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const ownerId = sanitizeFirestoreId(user.uid);
  const storeId = sanitizeFirestoreId(biz.id);

  if (!navigator.onLine) {
    await offlineDb.enqueueSyncItem({
      id: `store_${storeId}`,
      ownerId,
      storeId,
      entityType: 'store',
      operation: 'upsert',
      payload: { biz, taxRate, receiptFooter },
    });
    return;
  }

  const path = `stores/${storeId}`;
  try {
    const ref = doc(db, 'stores', storeId);
    const snap = await getDoc(ref);
    const baseData = {
      businessName: (biz.businessName || 'My Business').slice(0, 160),
      storeName: (biz.businessName || 'Main Store').slice(0, 160),
      currency: (biz.currency || 'Rs.').slice(0, 12),
      taxRate: Math.max(0, Math.min(100, Number(taxRate) || 0)),
      vertical: (biz.vertical || 'electrical_hardware').slice(0, 64),
      ...(biz.phone ? { phone: biz.phone.slice(0, 40) } : {}),
      ...(biz.city ? { city: biz.city.slice(0, 100) } : {}),
      ...(receiptFooter ? { receiptFooter: receiptFooter.slice(0, 300) } : {}),
      updatedAt: serverTimestamp(),
    };

    if (!snap.exists()) {
      await setDoc(ref, {
        id: storeId,
        ownerId,
        ...baseData,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, baseData);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchCloudStores(): Promise<BusinessAccount[]> {
  const user = auth.currentUser;
  if (!user || !navigator.onLine) return [];
  const ownerId = sanitizeFirestoreId(user.uid);
  const path = 'stores';
  try {
    const q = query(collection(db, 'stores'), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        businessName: String(data.businessName || data.storeName || 'My Store'),
        ownerName: user.displayName || 'Shop Owner',
        ownerEmail: user.email || '',
        phone: String(data.phone || ''),
        city: String(data.city || ''),
        vertical: (data.vertical || 'electrical_hardware') as any,
        currency: String(data.currency || 'Rs.'),
        createdAt: new Date().toISOString(),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function syncProductToCloud(
  storeIdRaw: string,
  product: Product,
  op: 'upsert' | 'delete' = 'upsert',
  forceOffline = false
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const ownerId = sanitizeFirestoreId(user.uid);
  const storeId = sanitizeFirestoreId(storeIdRaw);
  const productId = sanitizeFirestoreId(product.id);

  // Cache image locally in IndexedDB to stay well under Firestore 1MB doc limit
  let imageId: string | undefined;
  if (product.image) {
    imageId = `img_${productId}`;
    await offlineDb.saveProductImage(imageId, ownerId, storeId, product.image);
  }

  if (forceOffline || !navigator.onLine) {
    await offlineDb.enqueueSyncItem({
      id: `prod_${storeId}_${productId}`,
      ownerId,
      storeId,
      entityType: 'product',
      operation: op,
      payload: { ...product, image: undefined, imageId },
    });
    return;
  }

  const path = `stores/${storeId}/products/${productId}`;
  try {
    const storeReady = await ensureCloudStoreExists(storeId, { vertical: product.vertical });
    if (!storeReady) return;

    const ref = doc(db, 'stores', storeId, 'products', productId);
    if (op === 'delete') {
      await deleteDoc(ref);
      return;
    }
    const snap = await getDoc(ref);
    const sanitizedVariants = (product.colorVariants || []).slice(0, 20).map((cv) => ({
      color: String(cv.color || '').slice(0, 48),
      hex: String(cv.hex || '#64748b').slice(0, 16),
      stock: Number(cv.stock) || 0,
      inStock: cv.inStock !== false,
    }));

    const common = {
      name: (String(product.name || '').trim() || 'Item').slice(0, 200),
      ...(product.urduName ? { urduName: String(product.urduName).slice(0, 200) } : {}),
      barcode: String(product.barcode || '').slice(0, 64),
      category: (String(product.category || '').trim() || 'General').slice(0, 100),
      vertical: (String(product.vertical || '').trim() || 'garments_fashion').slice(0, 64),
      costPrice: Math.max(0, Number(product.costPrice) || 0),
      retailPrice: Math.max(0, Number(product.retailPrice) || 0),
      stockQuantity: Number(product.stockQuantity) || 0,
      minStockAlert: Math.max(0, Number(product.minStockAlert) || 0),
      unit: (String(product.unit || '').trim() || 'pcs').slice(0, 32),
      taxPercent: Math.max(0, Math.min(100, Number(product.taxPercent) || 0)),
      ...(product.size ? { size: String(product.size).slice(0, 64) } : {}),
      ...(product.color ? { color: String(product.color).slice(0, 64) } : {}),
      ...(imageId ? { imageId } : {}),
      ...(sanitizedVariants.length > 0 ? { colorVariants: sanitizedVariants } : {}),
      updatedAt: serverTimestamp(),
    };

    if (!snap.exists()) {
      await setDoc(ref, {
        id: productId,
        ownerId,
        storeId,
        ...common,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, common);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchCloudSales(storeIdRaw: string): Promise<SaleRecord[]> {
  const user = auth.currentUser;
  if (!user || !navigator.onLine) return [];
  const ownerId = sanitizeFirestoreId(user.uid);
  const storeId = sanitizeFirestoreId(storeIdRaw);
  const path = `stores/${storeId}/sales`;
  try {
    const q = query(collection(db, 'stores', storeId, 'sales'), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id || d.id),
        invoiceNo: String(data.invoiceNo || d.id),
        timestamp: String(data.timestamp || new Date().toISOString()),
        customerName: String(data.customerName || 'Walk-in Customer'),
        customerPhone: data.customerPhone ? String(data.customerPhone) : undefined,
        items: Array.isArray(data.items) ? data.items : [],
        subtotal: Number(data.subtotal) || 0,
        discountAmount: Number(data.discountAmount) || 0,
        taxAmount: Number(data.taxAmount) || 0,
        grandTotal: Number(data.grandTotal) || 0,
        profit: Number(data.profit) || 0,
        paymentMethod: (data.paymentMethod || 'cash') as SaleRecord['paymentMethod'],
        isOfflineSale: false,
        isOfflineSyncPending: false,
        syncedAt: new Date().toISOString(),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function syncSaleToCloud(storeIdRaw: string, sale: SaleRecord): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const ownerId = sanitizeFirestoreId(user.uid);
  const storeId = sanitizeFirestoreId(storeIdRaw);
  const saleId = sanitizeFirestoreId(sale.id);

  if (!navigator.onLine) {
    await offlineDb.enqueueSyncItem({
      id: `sale_${storeId}_${saleId}`,
      ownerId,
      storeId,
      entityType: 'sale',
      operation: 'upsert',
      payload: sale,
    });
    return;
  }

  const path = `stores/${storeId}/sales/${saleId}`;
  try {
    const storeReady = await ensureCloudStoreExists(storeId);
    if (!storeReady) return;

    const ref = doc(db, 'stores', storeId, 'sales', saleId);
    const snap = await getDoc(ref);
    if (snap.exists()) return; // Idempotent: prevent duplicate offline sales!

    const sanitizedItems = (sale.items || []).slice(0, 100).map((item) => ({
      productId: String(item.productId || '').slice(0, 128),
      name: String(item.name || '').slice(0, 200),
      quantity: Number(item.quantity) || 1,
      unit: String(item.unit || 'pcs').slice(0, 32),
      unitPrice: Math.max(0, Number(item.unitPrice) || 0),
      subtotal: Math.max(0, Number(item.subtotal) || 0),
      costPrice: Math.max(0, Number(item.costPrice) || 0),
    }));

    if (sanitizedItems.length === 0) return;

    await setDoc(ref, {
      id: saleId,
      ownerId,
      storeId,
      invoiceNo: String(sale.invoiceNo || saleId).slice(0, 64),
      customerName: String(sale.customerName || 'Walk-in Customer').slice(0, 160),
      ...(sale.customerPhone ? { customerPhone: String(sale.customerPhone).slice(0, 40) } : {}),
      items: sanitizedItems,
      subtotal: Math.max(0, Number(sale.subtotal) || 0),
      discountAmount: Math.max(0, Number(sale.discountAmount) || 0),
      taxAmount: Math.max(0, Number(sale.taxAmount) || 0),
      grandTotal: Math.max(0, Number(sale.grandTotal) || 0),
      profit: Number(sale.profit) || 0,
      paymentMethod: sale.paymentMethod || 'cash',
      status: 'completed',
      timestamp: String(sale.timestamp || new Date().toISOString()).slice(0, 64),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function syncCustomerToCloud(storeIdRaw: string, khata: CustomerKhata): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const ownerId = sanitizeFirestoreId(user.uid);
  const storeId = sanitizeFirestoreId(storeIdRaw);
  const custId = sanitizeFirestoreId(khata.id);

  if (!navigator.onLine) {
    await offlineDb.enqueueSyncItem({
      id: `cust_${storeId}_${custId}`,
      ownerId,
      storeId,
      entityType: 'customer',
      operation: 'upsert',
      payload: khata,
    });
    return;
  }

  const path = `stores/${storeId}/customers/${custId}`;
  try {
    const storeReady = await ensureCloudStoreExists(storeId);
    if (!storeReady) return;

    const ref = doc(db, 'stores', storeId, 'customers', custId);
    const snap = await getDoc(ref);
    const common = {
      customerName: String(khata.name || 'Customer').slice(0, 160),
      phone: String(khata.phone || '').slice(0, 40),
      creditLimit: Math.max(0, Number(khata.creditLimit) || 0),
      currentBalance: Number(khata.currentBalance) || 0,
      transactions: (khata.transactions || []).slice(0, 200),
      updatedAt: serverTimestamp(),
    };
    if (!snap.exists()) {
      await setDoc(ref, { id: custId, ownerId, storeId, ...common, createdAt: serverTimestamp() });
    } else {
      await updateDoc(ref, common);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function syncExpenseToCloud(storeIdRaw: string, expense: ExpenseRecord): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const ownerId = sanitizeFirestoreId(user.uid);
  const storeId = sanitizeFirestoreId(storeIdRaw);
  const expId = sanitizeFirestoreId(expense.id);

  if (!navigator.onLine) {
    await offlineDb.enqueueSyncItem({
      id: `exp_${storeId}_${expId}`,
      ownerId,
      storeId,
      entityType: 'expense',
      operation: 'upsert',
      payload: expense,
    });
    return;
  }

  const path = `stores/${storeId}/expenses/${expId}`;
  try {
    const storeReady = await ensureCloudStoreExists(storeId);
    if (!storeReady) return;

    const ref = doc(db, 'stores', storeId, 'expenses', expId);
    const snap = await getDoc(ref);
    if (snap.exists()) return;
    await setDoc(ref, {
      id: expId,
      ownerId,
      storeId,
      title: String(expense.title || 'Expense').slice(0, 180),
      category: String(expense.category || 'General').slice(0, 80),
      amount: Math.max(0, Number(expense.amount) || 0),
      paymentMethod: String(expense.paymentMethod || 'cash').slice(0, 40),
      date: String(expense.date || new Date().toISOString().split('T')[0]).slice(0, 40),
      ...(expense.notes ? { notes: String(expense.notes).slice(0, 400) } : {}),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function syncReturnToCloud(storeIdRaw: string, ret: ReturnRecord): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const ownerId = sanitizeFirestoreId(user.uid);
  const storeId = sanitizeFirestoreId(storeIdRaw);
  const retId = sanitizeFirestoreId(ret.id);

  if (!navigator.onLine) {
    await offlineDb.enqueueSyncItem({
      id: `ret_${storeId}_${retId}`,
      ownerId,
      storeId,
      entityType: 'return',
      operation: 'upsert',
      payload: ret,
    });
    return;
  }

  const path = `stores/${storeId}/returns/${retId}`;
  try {
    const storeReady = await ensureCloudStoreExists(storeId);
    if (!storeReady) return;

    const ref = doc(db, 'stores', storeId, 'returns', retId);
    const snap = await getDoc(ref);
    if (snap.exists()) return;
    await setDoc(ref, {
      id: retId,
      ownerId,
      storeId,
      saleId: String(ret.originalInvoiceNo || ret.id).slice(0, 128),
      invoiceNo: String(ret.originalInvoiceNo || '').slice(0, 64) || 'RET',
      customerName: String(ret.customerName || 'Walk-in Customer').slice(0, 160),
      totalRefundAmount: Math.max(0, Number(ret.totalRefundAmount) || 0),
      ...(ret.notes ? { reason: String(ret.notes).slice(0, 300) } : {}),
      date: String(ret.date || new Date().toISOString().split('T')[0]).slice(0, 40),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function syncActivityLogToCloud(entry: ActivityLogEntry): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const ownerId = sanitizeFirestoreId(user.uid);
  const storeId = sanitizeFirestoreId(entry.storeId);
  const logId = sanitizeFirestoreId(entry.id);

  if (!navigator.onLine) {
    await offlineDb.enqueueSyncItem({
      id: `log_${storeId}_${logId}`,
      ownerId,
      storeId,
      entityType: 'activityLog',
      operation: 'upsert',
      payload: entry,
    });
    return;
  }

  const path = `stores/${storeId}/activityLogs/${logId}`;
  try {
    const storeReady = await ensureCloudStoreExists(storeId);
    if (!storeReady) return;

    const ref = doc(db, 'stores', storeId, 'activityLogs', logId);
    const snap = await getDoc(ref);
    if (snap.exists()) return;
    await setDoc(ref, {
      id: logId,
      ownerId,
      storeId,
      actorEmail: String(entry.actorEmail || user.email || 'user').slice(0, 200),
      actorRole: String(entry.actorRole || 'owner').slice(0, 40),
      category: entry.category,
      action: String(entry.action).slice(0, 160),
      details: String(entry.details || '').slice(0, 400),
      createdAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking audit log write
  }
}

export async function flushOfflineSyncQueue(): Promise<{ synced: number; failed: number }> {
  const user = auth.currentUser;
  if (!isCloudReady() || !user) return { synced: 0, failed: 0 };

  const ownerId = sanitizeFirestoreId(user.uid);
  const queue = await offlineDb.getPendingSyncItems(ownerId);
  let synced = 0;
  let failed = 0;

  // Ensure stores sync first before subcollections
  const ordered = [
    ...queue.filter((q) => q.entityType === 'store'),
    ...queue.filter((q) => q.entityType !== 'store'),
  ];

  for (const item of ordered) {
    try {
      await processSyncItem(item);
      await offlineDb.removeSyncItem(item.id);
      synced++;
    } catch (err: any) {
      failed++;
      await offlineDb.updateSyncItemError(item, err?.message || 'Sync error');
    }
  }
  return { synced, failed };
}

async function processSyncItem(item: OfflineSyncItem): Promise<void> {
  switch (item.entityType) {
    case 'store':
      await upsertCloudStore(item.payload.biz, item.payload.taxRate, item.payload.receiptFooter);
      break;
    case 'product':
      await syncProductToCloud(item.storeId, item.payload as Product, item.operation);
      break;
    case 'sale':
      await syncSaleToCloud(item.storeId, item.payload as SaleRecord);
      break;
    case 'customer':
      await syncCustomerToCloud(item.storeId, item.payload as CustomerKhata);
      break;
    case 'expense':
      await syncExpenseToCloud(item.storeId, item.payload as ExpenseRecord);
      break;
    case 'return':
      await syncReturnToCloud(item.storeId, item.payload as ReturnRecord);
      break;
    case 'activityLog':
      await syncActivityLogToCloud(item.payload as ActivityLogEntry);
      break;
    default:
      break;
  }
}
