import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ShoppingBag,
  UserCheck,
  Sparkles,
  Printer,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Trash2,
  MessageCircle,
  LayoutDashboard,
  Zap,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { CryptoinModularDashboard } from './CryptoinModularDashboard';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    sales,
    khatas,
    totalUdhar,
    returns,
    products,
    totalStockCost,
    totalStockRetail,
    outOfStockItems,
    lowStockItems,
    triggerAiManagerWhatsApp,
    storeProfile,
    resetAllData,
    loadDemoSampleData,
    setCurrentReceipt,
  } = usePos();

  // Active Layout: Default is 'cryptoin' (the requested Obsidian Purple Modular Layout from the screenshot)
  const [activeLayout, setActiveLayout] = useState<'cryptoin' | 'classic'>(() => {
    try {
      const saved = localStorage.getItem('godigly_active_dashboard_layout');
      return saved === 'classic' ? 'classic' : 'cryptoin';
    } catch {
      return 'cryptoin';
    }
  });

  const handleSwitchLayout = (layout: 'cryptoin' | 'classic') => {
    setActiveLayout(layout);
    localStorage.setItem('godigly_active_dashboard_layout', layout);
  };

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('today');
  const [isTriggeringAi, setIsTriggeringAi] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);
  const [zeroFeedback, setZeroFeedback] = useState<string | null>(null);


  const handleZeroBalances = () => {
    resetAllData();
    setZeroFeedback('All sales, returns, udhar, and balances reset to clean 0!');
    setTimeout(() => setZeroFeedback(null), 4000);
  };

  const handleLoadDemo = () => {
    loadDemoSampleData();
    setZeroFeedback('Demo hardware store data loaded for test exploration.');
    setTimeout(() => setZeroFeedback(null), 4000);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.slice(0, 7);

  // Filtered sales
  const filteredSales = sales.filter((s) => {
    if (dateFilter === 'today') return s.timestamp.startsWith(todayStr);
    if (dateFilter === 'month') return s.timestamp.startsWith(thisMonthStr);
    return true;
  });

  const totalSalesAmount = filteredSales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalNetProfit = filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0);
  const totalOrdersCount = filteredSales.length;

  // Recovery (Vasooli) from Khata entries (receive_payment)
  const totalRecovery = khatas.reduce((acc, k) => {
    const receivedEntries = k.transactions.filter((t) => {
      if (t.type !== 'receive_payment') return false;
      if (dateFilter === 'today') return t.date.startsWith(todayStr);
      if (dateFilter === 'month') return t.date.startsWith(thisMonthStr);
      return true;
    });
    return acc + receivedEntries.reduce((sub, entry) => sub + entry.amount, 0);
  }, 0);

  // Returns filtered
  const filteredReturns = returns.filter((r) => {
    if (dateFilter === 'today') return r.date.startsWith(todayStr);
    if (dateFilter === 'month') return r.date.startsWith(thisMonthStr);
    return true;
  });
  const totalReturnsAmount = filteredReturns.reduce((acc, r) => acc + r.totalRefundAmount, 0);
  const totalReturnsCount = filteredReturns.length;

  // Payment Breakdown
  const cashSales = filteredSales.filter((s) => s.paymentMethod === 'cash').reduce((acc, s) => acc + s.grandTotal, 0);
  const digitalSales = filteredSales.filter((s) => ['card', 'easypaisa', 'jazzcash', 'raast', 'bank'].includes(s.paymentMethod)).reduce((acc, s) => acc + s.grandTotal, 0);
  const udharSales = filteredSales.filter((s) => s.paymentMethod === 'udhar').reduce((acc, s) => acc + s.grandTotal, 0);

  const handleTriggerAiReport = async () => {
    setIsTriggeringAi(true);
    setAiSuccessMsg(null);
    try {
      const res = await triggerAiManagerWhatsApp('daily_sales');
      setAiSuccessMsg('Daily WhatsApp report ready! Opening link...');
      window.open(res.whatsappLink, '_blank');
    } catch {
      setAiSuccessMsg('WhatsApp report dispatched');
    } finally {
      setIsTriggeringAi(false);
      setTimeout(() => setAiSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Layout Switcher Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#171825] p-5 rounded-3xl border border-white/5 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-400 flex items-center justify-center font-black">
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              GoDigly POS Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Active Layout
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dark-themed modular layout with real-time sales curves, register balance, and fast checkout terminal for <strong className="text-purple-300 font-semibold">{storeProfile.name}</strong>
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          {/* Layout Mode Switcher */}
          <div className="flex items-center bg-[#10111a] p-1 rounded-2xl border border-white/5 text-xs font-bold">
            <button
              onClick={() => handleSwitchLayout('cryptoin')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLayout === 'cryptoin'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Obsidian Purple (Active)</span>
            </button>
            <button
              onClick={() => handleSwitchLayout('classic')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeLayout === 'classic'
                  ? 'bg-slate-800 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Classic Grid</span>
            </button>
          </div>

          {/* Quick Zero All Balances Action */}
          <button
            onClick={handleZeroBalances}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10111a] hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-white/5 rounded-2xl text-xs font-bold transition-all shadow-2xs active:scale-95"
            title="Reset store metrics: sales, returns, udhar, and stock to strictly 0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>Reset 0 Balance</span>
          </button>
        </div>
      </div>

      {/* ACTIVE LAYOUT: Cryptoin Modular Layout (Matches attached screenshot) */}
      {activeLayout === 'cryptoin' ? (
        <CryptoinModularDashboard onNavigate={onNavigate} />
      ) : (
        <>
          {/* Classic Grid Filter Bar */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === 'today'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === 'month'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Time
              </button>
            </div>

            <button
              onClick={handleTriggerAiReport}
              disabled={isTriggeringAi}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isTriggeringAi ? 'Generating AI...' : 'AI Daily WhatsApp'}
            </button>
          </div>


      {/* Zero Feedback Toast */}
      {zeroFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{zeroFeedback}</span>
          </div>
          <button onClick={() => setZeroFeedback(null)} className="text-emerald-700 dark:text-emerald-400 hover:underline">Dismiss</button>
        </div>
      )}

      {aiSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-between">
          <span>{aiSuccessMsg}</span>
          <button onClick={() => setAiSuccessMsg(null)} className="text-emerald-600 dark:text-emerald-400 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Fresh New User 0-Balance Banner */}
      {sales.length === 0 && khatas.length === 0 && returns.length === 0 && (
        <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
              0
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                New Store Ready • 0 Balance Baseline
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                All sales (Rs 0), returns (Rs 0), and udhar khatta (Rs 0) are completely clear. Start billing customers or load sample hardware data.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => onNavigate('pos')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              + First Bill (F2)
            </button>
            <button
              onClick={handleLoadDemo}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              Load Demo Store
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Sales</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono-numbers">
              Rs {totalSalesAmount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{totalOrdersCount}</span> billed invoices
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Net Profit</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono-numbers">
              Rs {totalNetProfit.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{totalSalesAmount > 0 ? ((totalNetProfit / totalSalesAmount) * 100).toFixed(1) : '0'}% margin</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Total Udhar / Credit Ledger */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Udhar Khatta</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono-numbers">
              Rs {totalUdhar.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-amber-600 dark:text-amber-400">{khatas.filter((k) => k.currentBalance > 0).length}</span> customers with balance
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Recovery (Vasooli) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Recovery (Vasooli)</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono-numbers">
              Rs {totalRecovery.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
              Udhar cash collected into drawer
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-teal-500/5 rounded-full pointer-events-none" />
        </div>
      </div>

      {/* Secondary Row: Returns, Inventory Asset Value, Stock Warning & Fast Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Returns & Refunds */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">Returns & Refunds</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono-numbers">
              Rs {totalReturnsAmount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {totalReturnsCount} returned transactions
            </div>
          </div>
        </div>

        {/* Total Inventory Stock Value */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Stock Retail Value</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono-numbers">
              Rs {totalStockRetail.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cost: Rs {totalStockCost.toLocaleString()} ({products.length} products)
            </div>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Critical Stockouts</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-red-600 dark:text-red-400 font-mono-numbers">
              {outOfStockItems.length} items 0 stock
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lowStockItems.length} items low inventory
            </div>
          </div>
        </div>

        {/* Payment Channels Split */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Revenue Channels</span>
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span>Cash:</span>
              <span className="font-bold font-mono-numbers">Rs {cashSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400">
              <span>Digital/QR:</span>
              <span className="font-bold font-mono-numbers">Rs {digitalSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
              <span>Udhar (Credit):</span>
              <span className="font-bold font-mono-numbers">Rs {udharSales.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launchpad & Fast Actions */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Quick Operations Hub</h2>
            <p className="text-xs text-indigo-200 mt-0.5">Jump directly to billing counter, customer returns, udhar recovery, or inventory</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('pos')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              New Sale (POS)
            </button>
            <button
              onClick={() => onNavigate('returns')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Process Return
            </button>
            <button
              onClick={() => onNavigate('khata')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              Udhar Khatta
            </button>
            <button
              onClick={() => onNavigate('ai_manager')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              AI Manager WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Sales & Top Udhar Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <ShoppingBag className="w-4 h-4 text-indigo-500" />
              Recent Billed Invoices
            </h3>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-semibold"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
            {sales.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No invoices recorded yet. Start billing in POS tab!
              </div>
            ) : (
              sales.slice(0, 5).map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => setCurrentReceipt(sale)}
                  className="py-2.5 px-2 -mx-2 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                  title="Click to view & send bill image on WhatsApp"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono-numbers">
                        {sale.invoiceNo}
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 px-1.5 py-0.2 rounded font-bold inline-flex items-center gap-0.5">
                        <MessageCircle className="w-2.5 h-2.5" /> WhatsApp Bill
                      </span>
                    </div>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                      {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {sale.customerName ? `${sale.customerName} • ` : ''}
                      {sale.items.length} items ({sale.paymentMethod.toUpperCase()})
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="font-black text-slate-900 dark:text-white font-mono-numbers">
                        Rs {sale.grandTotal.toLocaleString()}
                      </div>
                      {sale.profit !== undefined && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          +Rs {sale.profit.toLocaleString()} profit
                        </span>
                      )}
                    </div>
                    <span className="p-1 rounded-lg bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Udhar Khatta Pending Recovery */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-amber-500" />
              Highest Pending Udhar (Needs Recovery)
            </h3>
            <button
              onClick={() => onNavigate('khata')}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 font-semibold"
            >
              Open Khatta <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
            {khatas.filter((k) => k.currentBalance > 0).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Clean ledger! No customers currently owe udhar.
              </div>
            ) : (
              khatas
                .filter((k) => k.currentBalance > 0)
                .sort((a, b) => b.currentBalance - a.currentBalance)
                .slice(0, 5)
                .map((khata) => {
                  const percentOfLimit = Math.round((khata.currentBalance / khata.creditLimit) * 100);
                  return (
                    <div key={khata.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {khata.name}
                        </div>
                        <div className="text-slate-400 dark:text-slate-500 text-[11px]">
                          {khata.phone} • Limit: Rs {khata.creditLimit.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-amber-600 dark:text-amber-400 font-mono-numbers">
                          Rs {khata.currentBalance.toLocaleString()}
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          percentOfLimit >= 100
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                            : percentOfLimit >= 75
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                        }`}>
                          {percentOfLimit}% limit
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
