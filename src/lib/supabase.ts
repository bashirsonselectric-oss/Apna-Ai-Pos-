import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default / fallback Supabase credentials from environment or localStorage
const LOCAL_STORAGE_URL_KEY = 'godigly_supabase_url';
const LOCAL_STORAGE_ANON_KEY = 'godigly_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastChecked?: string;
  error?: string | null;
}

// Retrieve saved configuration
export function getSavedSupabaseConfig(): SupabaseConfig {
  try {
    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
    const storedUrl = localStorage.getItem(LOCAL_STORAGE_URL_KEY) || envUrl;
    const storedKey = localStorage.getItem(LOCAL_STORAGE_ANON_KEY) || envKey;

    return {
      url: storedUrl.trim(),
      anonKey: storedKey.trim(),
      isConnected: Boolean(storedUrl && storedKey),
      lastChecked: undefined,
      error: null,
    };
  } catch {
    return { url: '', anonKey: '', isConnected: false, error: null };
  }
}

// Save configuration
export function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_URL_KEY, url.trim());
    localStorage.setItem(LOCAL_STORAGE_ANON_KEY, anonKey.trim());
  } catch (e) {
    console.error('Failed to save Supabase config in localStorage', e);
  }
}

// Create or get Supabase client singleton
let supabaseClientInstance: SupabaseClient | null = null;
let currentClientUrl = '';
let currentClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (
    supabaseClientInstance &&
    currentClientUrl === config.url &&
    currentClientKey === config.anonKey
  ) {
    return supabaseClientInstance;
  }

  try {
    supabaseClientInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentClientUrl = config.url;
    currentClientKey = config.anonKey;
    return supabaseClientInstance;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    return null;
  }
}

// Test Supabase connection
export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const start = Date.now();
  const url = (customUrl ?? getSavedSupabaseConfig().url).trim();
  const key = (customKey ?? getSavedSupabaseConfig().anonKey).trim();

  if (!url || !key) {
    return {
      success: false,
      message: 'Supabase URL and Anon Key are required to connect.',
      latencyMs: 0,
    };
  }

  try {
    const testClient = createClient(url, key, {
      auth: { persistSession: false },
    });

    // Test request to Supabase Auth or a public query
    const { error } = await testClient.auth.getSession();
    const latency = Date.now() - start;

    if (error && error.message && !error.message.includes('session')) {
      return {
        success: false,
        message: `Supabase Error: ${error.message}`,
        latencyMs: latency,
      };
    }

    return {
      success: true,
      message: `Successfully connected to Supabase backend! Live response in ${latency}ms.`,
      latencyMs: latency,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to establish connection to Supabase.',
      latencyMs: Date.now() - start,
    };
  }
}

// Push local products to Supabase 'products' table
export async function syncProductsToSupabase(products: any[]): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, message: 'Supabase is not connected.' };
  }

  if (!products || products.length === 0) {
    return { success: true, count: 0, message: 'No products to sync.' };
  }

  try {
    const rows = products.map((p) => ({
      id: p.id,
      name: p.name,
      urdu_name: p.urduName || '',
      barcode: p.barcode || '',
      category: p.category || '',
      vertical: p.vertical || 'electrical_hardware',
      cost_price: Number(p.costPrice || 0),
      retail_price: Number(p.retailPrice || 0),
      wholesale_price: Number(p.wholesalePrice || 0),
      stock_quantity: Number(p.stockQuantity || 0),
      min_stock_alert: Number(p.minStockAlert || 5),
      unit: p.unit || 'pcs',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('products').upsert(rows, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    return {
      success: true,
      count: rows.length,
      message: `Successfully synced ${rows.length} products to Supabase cloud database!`,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      message: err.message || 'Failed to sync products to Supabase.',
    };
  }
}

// Push local sales to Supabase 'sales' table
export async function syncSalesToSupabase(sales: any[]): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, message: 'Supabase is not connected.' };
  }

  if (!sales || sales.length === 0) {
    return { success: true, count: 0, message: 'No sales to sync.' };
  }

  try {
    const rows = sales.map((s) => ({
      id: s.id || `sale-${s.invoiceNo}`,
      invoice_no: s.invoiceNo,
      timestamp: s.timestamp || new Date().toISOString(),
      customer_name: s.customerName || 'Walk-in Customer',
      customer_phone: s.customerPhone || '',
      subtotal: Number(s.subtotal || 0),
      discount: Number(s.discount || 0),
      grand_total: Number(s.grandTotal || 0),
      tendered_cash: Number(s.tenderedCash || 0),
      change_due: Number(s.changeDue || 0),
      payment_method: s.paymentMethod || 'cash',
      items: s.items || [],
      cashier_name: s.cashierName || 'Cashier',
      created_at: s.timestamp || new Date().toISOString(),
    }));

    const { error } = await client.from('sales').upsert(rows, { onConflict: 'invoice_no' });

    if (error) throw error;

    return {
      success: true,
      count: rows.length,
      message: `Successfully synced ${rows.length} sales to Supabase cloud!`,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      message: err.message || 'Failed to sync sales to Supabase.',
    };
  }
}

// Push local khatas / customer ledgers to Supabase 'khatas' table
export async function syncKhatasToSupabase(khatas: any[]): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, message: 'Supabase is not connected.' };
  }

  if (!khatas || khatas.length === 0) {
    return { success: true, count: 0, message: 'No customer khatas to sync.' };
  }

  try {
    const rows = khatas.map((k) => ({
      id: k.id,
      customer_name: k.customerName,
      phone: k.phone || '',
      address: k.address || '',
      current_balance: Number(k.currentBalance || 0),
      credit_limit: Number(k.creditLimit || 50000),
      transactions: k.transactions || [],
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('khatas').upsert(rows, { onConflict: 'id' });

    if (error) throw error;

    return {
      success: true,
      count: rows.length,
      message: `Successfully synced ${rows.length} customer ledgers to Supabase!`,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      message: err.message || 'Failed to sync khatas to Supabase.',
    };
  }
}

// Fetch products from Supabase
export async function fetchProductsFromSupabase(): Promise<{
  success: boolean;
  products: any[];
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, products: [], message: 'Supabase is not connected.' };
  }

  try {
    const { data, error } = await client.from('products').select('*');
    if (error) throw error;

    const formatted = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      urduName: row.urdu_name,
      barcode: row.barcode,
      category: row.category,
      vertical: row.vertical,
      costPrice: Number(row.cost_price || 0),
      retailPrice: Number(row.retail_price || 0),
      wholesalePrice: Number(row.wholesale_price || 0),
      stockQuantity: Number(row.stock_quantity || 0),
      minStockAlert: Number(row.min_stock_alert || 5),
      unit: row.unit || 'pcs',
    }));

    return {
      success: true,
      products: formatted,
      message: `Fetched ${formatted.length} products from Supabase.`,
    };
  } catch (err: any) {
    return {
      success: false,
      products: [],
      message: err.message || 'Failed to fetch products from Supabase.',
    };
  }
}

// Complete SQL Schema Generator for Supabase
export function getSupabaseSqlSchema(): string {
  return `-- ============================================================================
-- GODIGLY POS & INVENTORY SYSTEM - SUPABASE SQL SCHEMA
-- Target Super Admin: bashirsonselectric@gmail.com
-- ============================================================================

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    urdu_name TEXT,
    barcode TEXT UNIQUE,
    category TEXT,
    vertical TEXT DEFAULT 'electrical_hardware',
    cost_price NUMERIC(12,2) DEFAULT 0,
    retail_price NUMERIC(12,2) DEFAULT 0,
    wholesale_price NUMERIC(12,2) DEFAULT 0,
    stock_quantity NUMERIC(12,2) DEFAULT 0,
    min_stock_alert NUMERIC(12,2) DEFAULT 5,
    unit TEXT DEFAULT 'pcs',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Sales & Invoices Table
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    invoice_no TEXT UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    customer_name TEXT DEFAULT 'Walk-in Customer',
    customer_phone TEXT,
    subtotal NUMERIC(12,2) DEFAULT 0,
    discount NUMERIC(12,2) DEFAULT 0,
    grand_total NUMERIC(12,2) DEFAULT 0,
    tendered_cash NUMERIC(12,2) DEFAULT 0,
    change_due NUMERIC(12,2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    items JSONB DEFAULT '[]'::jsonb,
    cashier_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Khatas & Customer Ledgers Table
CREATE TABLE IF NOT EXISTS public.khatas (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    current_balance NUMERIC(12,2) DEFAULT 0,
    credit_limit NUMERIC(12,2) DEFAULT 50000,
    transactions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Store Profile & QR Settings Table
CREATE TABLE IF NOT EXISTS public.store_settings (
    store_id TEXT PRIMARY KEY,
    store_name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    payment_qr_url TEXT,
    payment_qr_type TEXT,
    payment_qr_account_title TEXT,
    payment_qr_account_no TEXT,
    receipt_footer TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Super Admin OTP & Security Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    otp_code TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.khatas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies for authenticated POS clients
CREATE POLICY "Allow authenticated read/write on products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow authenticated read/write on sales" ON public.sales FOR ALL USING (true);
CREATE POLICY "Allow authenticated read/write on khatas" ON public.khatas FOR ALL USING (true);
CREATE POLICY "Allow authenticated read/write on store_settings" ON public.store_settings FOR ALL USING (true);
CREATE POLICY "Allow super admin audit logs" ON public.admin_audit_logs FOR ALL USING (true);
`;
}
