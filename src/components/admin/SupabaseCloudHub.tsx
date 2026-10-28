import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Copy,
  Check,
  UploadCloud,
  DownloadCloud,
  Layers,
  Key,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Server,
  Zap,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  syncProductsToSupabase,
  syncSalesToSupabase,
  syncKhatasToSupabase,
  fetchProductsFromSupabase,
  getSupabaseSqlSchema,
} from '../../lib/supabase';

export const SupabaseCloudHub: React.FC = () => {
  const { products, sales, khatas, setProducts } = usePos();

  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  // Sync states
  const [isSyncingProducts, setIsSyncingProducts] = useState(false);
  const [isSyncingSales, setIsSyncingSales] = useState(false);
  const [isSyncingKhatas, setIsSyncingKhatas] = useState(false);
  const [isPullingProducts, setIsPullingProducts] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // SQL Copy state
  const [copiedSql, setCopiedSql] = useState(false);

  // Auto sync preference
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    try {
      return localStorage.getItem('godigly_supabase_autosync') === 'true';
    } catch {
      return false;
    }
  });

  // Load saved credentials on mount
  useEffect(() => {
    const cfg = getSavedSupabaseConfig();
    setUrlInput(cfg.url);
    setKeyInput(cfg.anonKey);
    if (cfg.url && cfg.anonKey) {
      testConnectionSilent(cfg.url, cfg.anonKey);
    }
  }, []);

  const testConnectionSilent = async (url: string, key: string) => {
    setIsTesting(true);
    try {
      const res = await testSupabaseConnection(url, key);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim();
    const cleanKey = keyInput.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Please enter both your Supabase Project URL and Anon API Key.',
      });
      return;
    }

    saveSupabaseConfig(cleanUrl, cleanKey);
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testSupabaseConnection(cleanUrl, cleanKey);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error communicating with Supabase.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncProducts = async () => {
    setIsSyncingProducts(true);
    setSyncFeedback(null);
    try {
      const res = await syncProductsToSupabase(products);
      setSyncFeedback(res.message);
    } catch (err: any) {
      setSyncFeedback(err.message || 'Sync failed');
    } finally {
      setIsSyncingProducts(false);
    }
  };

  const handleSyncSales = async () => {
    setIsSyncingSales(true);
    setSyncFeedback(null);
    try {
      const res = await syncSalesToSupabase(sales);
      setSyncFeedback(res.message);
    } catch (err: any) {
      setSyncFeedback(err.message || 'Sync failed');
    } finally {
      setIsSyncingSales(false);
    }
  };

  const handleSyncKhatas = async () => {
    setIsSyncingKhatas(true);
    setSyncFeedback(null);
    try {
      const res = await syncKhatasToSupabase(khatas);
      setSyncFeedback(res.message);
    } catch (err: any) {
      setSyncFeedback(err.message || 'Sync failed');
    } finally {
      setIsSyncingKhatas(false);
    }
  };

  const handlePullProducts = async () => {
    setIsPullingProducts(true);
    setSyncFeedback(null);
    try {
      const res = await fetchProductsFromSupabase();
      if (res.success && res.products.length > 0) {
        setProducts(res.products);
        setSyncFeedback(`Successfully loaded ${res.products.length} products from Supabase!`);
      } else {
        setSyncFeedback(res.message);
      }
    } catch (err: any) {
      setSyncFeedback(err.message || 'Pull failed');
    } finally {
      setIsPullingProducts(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(getSupabaseSqlSchema());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const toggleAutoSync = () => {
    const next = !autoSyncEnabled;
    setAutoSyncEnabled(next);
    localStorage.setItem('godigly_supabase_autosync', String(next));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 rounded-3xl border border-emerald-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  Supabase Cloud PostgreSQL Database
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Backend Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Connect your real-time Supabase cloud database to persistently store products, customer ledgers (Khatas), sales invoices, and system audit logs with automatic multi-device synchronization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAndTest}
              disabled={isTesting}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Pinging Supabase...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Test Connection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                testResult?.success
                  ? 'bg-emerald-400 animate-pulse'
                  : testResult && !testResult.success
                  ? 'bg-rose-500'
                  : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold text-slate-200">
              Connection Status:{' '}
              {testResult?.success ? (
                <strong className="text-emerald-400 font-bold">
                  Connected ({testResult.latencyMs}ms latency)
                </strong>
              ) : testResult && !testResult.success ? (
                <strong className="text-rose-400 font-bold">Disconnected / Invalid Key</strong>
              ) : (
                <strong className="text-amber-400 font-bold">Pending Credentials</strong>
              )}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Cloud Sync • Super Admin Exclusive</span>
          </div>
        </div>
      </div>

      {/* Test feedback */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertOctagon className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-bold">{testResult.message}</p>
            {testResult.success && (
              <p className="text-[11px] text-emerald-400/80">
                Live Supabase client initialized. You can now synchronize inventory, sales records, and customer balances.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sync Operation Feedback */}
      {syncFeedback && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>{syncFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-[10px] text-indigo-400 hover:text-white underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two Column Grid: Credentials Form & Sync Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Supabase API Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">Supabase Credentials</h4>
            </div>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Get Keys from Supabase</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <form onSubmit={handleSaveAndTest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-700 rounded-xl bg-slate-800/80 text-white font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Found in Supabase Project Settings → API → Project URL
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Supabase Anon (Public) Key
                </label>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-[10px] text-slate-400 hover:text-slate-200"
                >
                  {showKey ? 'Hide Key' : 'Reveal Key'}
                </button>
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 text-xs border border-slate-700 rounded-xl bg-slate-800/80 text-white font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Found in Supabase Project Settings → API → Project API keys (anon public)
              </span>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                disabled={isTesting}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Save & Test Credentials</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Cloud Sync Controls & Data Metrics */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              <h4 className="font-bold text-white text-sm">Synchronize Local & Cloud</h4>
            </div>
            <button
              type="button"
              onClick={toggleAutoSync}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                autoSyncEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Auto-Sync: {autoSyncEnabled ? 'ENABLED' : 'MANUAL'}
            </button>
          </div>

          <div className="space-y-3">
            {/* Sync Products */}
            <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">Products & Inventory</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {products.length} items loaded locally
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSyncingProducts || isTesting}
                  onClick={handleSyncProducts}
                  className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isSyncingProducts ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>Push</span>
                </button>
                <button
                  type="button"
                  disabled={isPullingProducts || isTesting}
                  onClick={handlePullProducts}
                  className="py-1.5 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Fetch latest products from Supabase"
                >
                  {isPullingProducts ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <DownloadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>Pull</span>
                </button>
              </div>
            </div>

            {/* Sync Sales */}
            <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">Sales & Invoices</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {sales.length} transactions recorded
                </span>
              </div>
              <button
                type="button"
                disabled={isSyncingSales || isTesting}
                onClick={handleSyncSales}
                className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isSyncingSales ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                <span>Push Sales</span>
              </button>
            </div>

            {/* Sync Khatas */}
            <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">Customer Udhar & Khatas</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {khatas.length} customer ledgers
                </span>
              </div>
              <button
                type="button"
                disabled={isSyncingKhatas || isTesting}
                onClick={handleSyncKhatas}
                className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isSyncingKhatas ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                <span>Push Khatas</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SQL Schema Table Script for Supabase SQL Editor */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Supabase SQL Migration Script (1-Click Setup)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Copy this schema into your Supabase Dashboard → <strong>SQL Editor</strong> and click <strong>RUN</strong> to create all tables with Row Level Security.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopySql}
            className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border border-emerald-500/30"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>SQL Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copy SQL Script</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 overflow-x-auto max-h-60 custom-scrollbar">
          <pre className="text-[11px] font-mono text-emerald-300/90 leading-relaxed">
            {getSupabaseSqlSchema()}
          </pre>
        </div>
      </div>
    </div>
  );
};
