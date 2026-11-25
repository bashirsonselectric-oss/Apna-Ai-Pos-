/**
 * Safe JSON fetch utility resilient to static SPA hosting (e.g., Vercel / Netlify)
 * where `/api/*` routes may return plain-text or HTML 404 pages like
 * "The page could not be found" instead of JSON.
 */

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  isStaticFallback: boolean;
  data: T | null;
  error?: string;
}

export async function safeJsonFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(input, init);
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const rawText = await res.text();

    const looksLikeJson =
      contentType.includes('application/json') ||
      rawText.trim().startsWith('{') ||
      rawText.trim().startsWith('[');

    if (!looksLikeJson) {
      const isNotFound = res.status === 404 || res.status === 405;
      return {
        ok: false,
        status: res.status,
        isStaticFallback: isNotFound || rawText.includes('The page could not be found') || rawText.trim().startsWith('<!'),
        data: null,
        error: isNotFound
          ? 'Backend API route is not deployed on this host.'
          : `Unexpected non-JSON response (HTTP ${res.status}).`,
      };
    }

    let parsed: T | null = null;
    try {
      parsed = rawText ? (JSON.parse(rawText) as T) : null;
    } catch {
      return {
        ok: false,
        status: res.status,
        isStaticFallback: res.status === 404,
        data: null,
        error: 'Invalid JSON response from server.',
      };
    }

    return {
      ok: res.ok,
      status: res.status,
      isStaticFallback: false,
      data: parsed,
      error: !res.ok ? (parsed as any)?.error || `Request failed (HTTP ${res.status})` : undefined,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      isStaticFallback: false,
      data: null,
      error: err?.message || 'Network request failed.',
    };
  }
}

/**
 * Browser-side salted SHA-256 credential store for static deployments (Vercel SPA)
 * when Express `/api/auth/*` endpoints are unavailable.
 */
interface LocalAccountRecord {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  storeName: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

const LOCAL_ACCOUNTS_KEY = 'apna_pos_static_auth_accounts_v1';

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const bytes = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Minimal fallback for non-secure contexts
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `fallback_${Math.abs(hash).toString(16)}`;
}

function readLocalAccounts(): LocalAccountRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as LocalAccountRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalAccounts(accounts: LocalAccountRecord[]): void {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore quota errors
  }
}

export async function registerLocalFallbackAccount(params: {
  name: string;
  email: string;
  password: string;
  storeName: string;
  role?: 'admin' | 'manager' | 'cashier';
}): Promise<{ success: boolean; user?: { id: string; name: string; email: string; role: string; storeName: string }; error?: string }> {
  const email = params.email.trim().toLowerCase();
  const accounts = readLocalAccounts();
  if (accounts.some((a) => a.email === email)) {
    return { success: false, error: 'An account with this email already exists on this device. Please sign in.' };
  }

  const salt = `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  const passwordHash = await sha256Hex(`${salt}:${params.password}`);
  const record: LocalAccountRecord = {
    id: `local_${Date.now()}`,
    name: params.name.trim(),
    email,
    role: params.role || 'admin',
    storeName: params.storeName.trim() || `${params.name.trim()}'s Store`,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  writeLocalAccounts([...accounts, record]);
  return {
    success: true,
    user: {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      storeName: record.storeName,
    },
  };
}

export async function loginLocalFallbackAccount(
  emailRaw: string,
  password: string
): Promise<{ success: boolean; user?: { id: string; name: string; email: string; role: string; storeName: string }; error?: string }> {
  const email = emailRaw.trim().toLowerCase();
  const accounts = readLocalAccounts();
  const matched = accounts.find((a) => a.email === email);
  if (!matched) {
    return {
      success: false,
      error: 'Account not found on this deployment. Create a new account or sign in with Google.',
    };
  }

  const candidateHash = await sha256Hex(`${matched.salt}:${password}`);
  if (candidateHash !== matched.passwordHash) {
    return { success: false, error: 'Invalid email or password.' };
  }

  return {
    success: true,
    user: {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      role: matched.role,
      storeName: matched.storeName,
    },
  };
}
