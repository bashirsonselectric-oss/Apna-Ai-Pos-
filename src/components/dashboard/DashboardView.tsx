import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  CreditCard,
  Printer,
  ShieldCheck,
  ArrowUpRight,
  Wallet,
  Sparkles,
  BarChart3,
  Award,
  Tag,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
}

type DateFilter = 'today' | 'week' | 'month' | 'all';

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    sales,
    khatas,
    totalUdhar,
    returns,
    filteredProducts,
    expenses,
    outOfStockItems,
    lowStockItems,
    loyaltyPointsMap,
    coupons,
    storeProfile,
    setCurrentReceipt,
    userSession,
  } = usePos();

  const [dateFilter, setDateFilter] = useState<DateFilter>('today');

  const isMasterAdmin = userSession.email.toLowerCase().trim() === 'bashirsonselectric@gmail.com';

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const thisMonthStr = todayStr.slice(0, 7);
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const matchesRange = (dateStr: string) => {
    if (!dateStr) return false;
    const day = dateStr.slice(0, 10);
    if (dateFilter === 'today') return day === todayStr;
    if (dateFilter === 'week') return day >= weekAgoStr;
    if (dateFilter === 'month') return day.startsWith(thisMonthStr);
    return true;
  };

  const filteredSales = useMemo(() => sales.filter((s) => matchesRange(s.timestamp)), [sales, dateFilter]);
  const filteredReturns = useMemo(() => returns.filter((r) => matchesRange(r.date)), [returns, dateFilter]);
  const filteredExpenses = useMemo(() => expenses.filter((e) => matchesRange(e.date)), [expenses, dateFilter]);

  const todayRevenue = useMemo(
    () => sales.filter((s) => s.timestamp.startsWith(todayStr)).reduce((acc, s) => acc + s.grandTotal, 0),
    [sales, todayStr]
  );
  const totalRevenue = useMemo(() => filteredSales.reduce((acc, s) => acc + s.grandTotal, 0), [filteredSales]);
  const grossProfit = useMemo(() => filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0), [filteredSales]);
  const totalRefunds = useMemo(() => filteredReturns.reduce((acc, r) => acc + r.totalRefundAmount, 0), [filteredReturns]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((acc, e) => acc + e.amount, 0), [filteredExpenses]);
  const netProfit = grossProfit - totalExpenses - totalRefunds;

  // Payment breakdown
  const cashSales = filteredSales.filter((s) => s.paymentMethod === 'cash').reduce((a, s) => a + s.grandTotal, 0);
  const cardAndBank = filteredSales
    .filter((s) => ['card', 'bank_transfer'].includes(s.paymentMethod))
    .reduce((a, s) => a + s.grandTotal, 0);
  const walletAndSplit = filteredSales
    .filter((s) => ['easypaisa', 'jazzcash', 'split'].includes(s.paymentMethod))
    .reduce((a, s) => a + s.grandTotal, 0);
  const udharSales = filteredSales.filter((s) => s.paymentMethod === 'udhar').reduce((a, s) => a + s.grandTotal, 0);

  // 7-Day Real Revenue Curve
  const last7Days = useMemo(() => {
    const days: { label: string; dateKey: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const daySales = sales.filter((s) => s.timestamp.startsWith(dateKey));
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dateKey,
        revenue: daySales.reduce((acc, s) => acc + s.grandTotal, 0),
        orders: daySales.length,
      });
    }
    return days;
  }, [sales]);

  const maxDayRevenue = Math.max(...last7Days.map((d) => d.revenue), 1);

  const loyaltyCount = Object.keys(loyaltyPointsMap).length;
  const activeCoupons = coupons.filter((c) => c.active).length;
  const activeUdharCount = khatas.filter((k) => k.currentBalance > 0).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Editorial Top Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-5 border-b border-[#E8E0D8] dark:border-[#2E2A26]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7D6E65] dark:text-[#A89E96]">
            Atelier Performance Summary
          </p>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#141414] dark:text-[#F6F1EB] mt-1">
            {storeProfile.name}
          </h1>
          <p className="text-xs text-[#6B625C] dark:text-[#A89E96] mt-1">
            Daily revenue summary, real-time stock health, and client loyalty activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 rounded-xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] text-xs font-semibold">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'week', label: '7 Days' },
                { id: 'month', label: 'Month' },
                { id: 'all', label: 'All Time' },
              ] as { id: DateFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDateFilter(f.id)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  dateFilter === f.id
                    ? 'bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414]'
                    : 'text-[#6B625C] dark:text-[#A89E96] hover:text-[#141414] dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('pos')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] dark:hover:bg-[#E8E0D8] text-white dark:text-[#141414] text-xs font-semibold transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Open POS Counter</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('ai_hub')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#1A1816] hover:bg-[#F6F1EB] dark:hover:bg-[#24201C] text-[#141414] dark:text-[#F6F1EB] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7D6E65]" />
            <span>AI Scanner</span>
          </button>
        </div>
      </div>

      {/* Super Admin Control Center Card — Strictly ONLY for bashirsonselectric@gmail.com */}
      {isMasterAdmin && (
        <div className="rounded-2xl border border-[#E5C6C3] dark:border-[#533836] bg-[#F3E1DF]/55 dark:bg-[#342322]/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#141414] dark:text-[#F6F1EB]">
                Super Admin Control Center
              </div>
              <div className="text-[11px] text-[#6B625C] dark:text-[#C9BFB6]">
                Owner-only controls locked to {userSession.email} — strictly hidden from regular user accounts.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="px-3.5 py-2 rounded-xl bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <span>Open Admin Panel</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] p-5">
          <div className="flex items-center justify-between text-xs text-[#7D6E65] dark:text-[#A89E96]">
            <span className="font-medium">Daily Revenue</span>
            <TrendingUp className="w-4 h-4 text-[#2F6B4F] dark:text-[#6EE7B7]" />
          </div>
          <div className="mt-2.5 text-2xl font-bold font-mono-numbers text-[#141414] dark:text-[#F6F1EB]">
            {storeProfile.currency} {todayRevenue.toLocaleString()}
          </div>
          <div className="mt-1.5 text-[11px] text-[#7D6E65] dark:text-[#A89E96]">
            Selected period:{' '}
            <span className="font-mono-numbers font-semibold text-[#141414] dark:text-[#F6F1EB]">
              {storeProfile.currency} {totalRevenue.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] p-5">
          <div className="flex items-center justify-between text-xs text-[#7D6E65] dark:text-[#A89E96]">
            <span className="font-medium">Orders Completed</span>
            <ShoppingBag className="w-4 h-4 text-[#141414] dark:text-[#E5C6C3]" />
          </div>
          <div className="mt-2.5 text-2xl font-bold font-mono-numbers text-[#141414] dark:text-[#F6F1EB]">
            {filteredSales.length.toLocaleString()}
          </div>
          <div className="mt-1.5 text-[11px] text-[#7D6E65] dark:text-[#A89E96]">
            Avg basket:{' '}
            <span className="font-mono-numbers font-semibold text-[#141414] dark:text-[#F6F1EB]">
              {storeProfile.currency}{' '}
              {filteredSales.length > 0 ? Math.round(totalRevenue / filteredSales.length).toLocaleString() : '0'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] p-5">
          <div className="flex items-center justify-between text-xs text-[#7D6E65] dark:text-[#A89E96]">
            <span className="font-medium">Net Boutique Margin</span>
            <Wallet className="w-4 h-4 text-[#2F6B4F] dark:text-[#6EE7B7]" />
          </div>
          <div
            className={`mt-2.5 text-2xl font-bold font-mono-numbers ${
              netProfit >= 0 ? 'text-[#2F6B4F] dark:text-[#6EE7B7]' : 'text-[#9B2C2C] dark:text-[#FCA5A5]'
            }`}
          >
            {storeProfile.currency} {netProfit.toLocaleString()}
          </div>
          <div className="mt-1.5 text-[11px] text-[#7D6E65] dark:text-[#A89E96]">
            Expenses {storeProfile.currency} {totalExpenses.toLocaleString()} · Refunds {storeProfile.currency}{' '}
            {totalRefunds.toLocaleString()}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] p-5">
          <div className="flex items-center justify-between text-xs text-[#7D6E65] dark:text-[#A89E96]">
            <span className="font-medium">Collection &amp; Stock</span>
            <Package className="w-4 h-4 text-[#9A6B2F] dark:text-[#F1D29B]" />
          </div>
          <div className="mt-2.5 text-2xl font-bold font-mono-numbers text-[#141414] dark:text-[#F6F1EB]">
            {filteredProducts.length.toLocaleString()}{' '}
            <span className="text-xs font-normal text-[#8A7E75]">pieces</span>
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => onNavigate('stock')}
              className="text-[#9A6B2F] dark:text-[#F1D29B] font-semibold hover:underline cursor-pointer"
            >
              {lowStockItems.length} low stock
            </button>
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="text-[#9B2C2C] dark:text-[#FCA5A5] font-semibold hover:underline cursor-pointer"
            >
              {outOfStockItems.length} sold out
            </button>
          </div>
        </div>
      </div>

      {/* Main Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 7-Day Sales Performance */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-editorial text-lg font-semibold text-[#141414] dark:text-[#F6F1EB] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#7D6E65]" />
                <span>7-Day Sales Analytics</span>
              </h2>
              <p className="text-[11px] text-[#7D6E65] dark:text-[#A89E96]">
                Completed checkout totals across the past 7 days
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-semibold text-[#141414] dark:text-[#E5C6C3] hover:underline cursor-pointer"
            >
              Full Report →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2.5 items-end h-44 pt-4">
            {last7Days.map((day) => {
              const heightPct = day.revenue > 0 ? Math.max(12, Math.round((day.revenue / maxDayRevenue) * 100)) : 6;
              return (
                <div key={day.dateKey} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="text-[10px] font-mono-numbers text-[#7D6E65] dark:text-[#A89E96]">
                    {day.revenue > 0 ? `${Math.round(day.revenue / 1000)}k` : '0'}
                  </div>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-xl transition-all ${
                        day.revenue > 0
                          ? 'bg-[#141414] dark:bg-[#F3E1DF]'
                          : 'bg-[#EFE8E0] dark:bg-[#282420]'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`${day.dateKey}: ${storeProfile.currency} ${day.revenue.toLocaleString()} (${day.orders} orders)`}
                    />
                  </div>
                  <div className="text-[11px] font-medium text-[#6B625C] dark:text-[#A89E96]">{day.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Mix, Loyalty & Promotions Card */}
        <div className="rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] p-5 space-y-4">
          <h2 className="font-editorial text-lg font-semibold text-[#141414] dark:text-[#F6F1EB]">
            Payment &amp; Client Mix
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-[#EFE8E0] dark:border-[#2A2622]">
              <span className="text-[#6B625C] dark:text-[#A89E96]">Cash</span>
              <span className="font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]">
                {storeProfile.currency} {cashSales.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#EFE8E0] dark:border-[#2A2622]">
              <span className="text-[#6B625C] dark:text-[#A89E96]">Card &amp; Bank Transfer</span>
              <span className="font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]">
                {storeProfile.currency} {cardAndBank.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#EFE8E0] dark:border-[#2A2622]">
              <span className="text-[#6B625C] dark:text-[#A89E96]">Digital Wallet &amp; Split</span>
              <span className="font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]">
                {storeProfile.currency} {walletAndSplit.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#6B625C] dark:text-[#A89E96]">Store Credit ({activeUdharCount})</span>
              <span className="font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]">
                {storeProfile.currency} {(udharSales || totalUdhar).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('vip_customers')}
              className="p-3 rounded-xl bg-[#FAF7F4] dark:bg-[#221F1C] border border-[#E8E0D8] dark:border-[#2E2A26] text-left hover:border-[#141414]/40 cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#7D6E65] mb-1" />
              <div className="font-mono-numbers text-base font-bold text-[#141414] dark:text-[#F6F1EB]">
                {loyaltyCount}
              </div>
              <div className="text-[10px] text-[#7D6E65]">Loyalty Members</div>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('promotions')}
              className="p-3 rounded-xl bg-[#F3E1DF]/55 dark:bg-[#342322] border border-[#E5C6C3] dark:border-[#533836] text-left hover:border-[#141414]/40 cursor-pointer"
            >
              <Tag className="w-4 h-4 text-[#141414] dark:text-[#F3E1DF] mb-1" />
              <div className="font-mono-numbers text-base font-bold text-[#141414] dark:text-[#F6F1EB]">
                {activeCoupons}
              </div>
              <div className="text-[10px] text-[#6B625C] dark:text-[#C9BFB6]">Active Promos</div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Low Stock Alerts + Recent Boutique Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Low Stock Alerts */}
        <div className="rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-base font-semibold text-[#141414] dark:text-[#F6F1EB] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#9A6B2F]" />
              <span>Low-Stock Alerts</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('stock')}
              className="text-[11px] font-semibold text-[#141414] dark:text-[#E5C6C3] hover:underline cursor-pointer"
            >
              Restock →
            </button>
          </div>

          {lowStockItems.length === 0 && outOfStockItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#7D6E65]">
              All fashion pieces are well stocked.
            </div>
          ) : (
            <div className="divide-y divide-[#EFE8E0] dark:divide-[#2A2622]">
              {[...outOfStockItems, ...lowStockItems].slice(0, 5).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#141414] dark:text-[#F6F1EB] truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-[#7D6E65] font-mono-numbers">
                      {item.category} · {item.barcode}
                    </div>
                  </div>
                  <span
                    className={`font-mono-numbers font-bold text-xs shrink-0 ${
                      item.stockQuantity <= 0
                        ? 'text-[#9B2C2C] dark:text-[#FCA5A5]'
                        : 'text-[#9A6B2F] dark:text-[#F1D29B]'
                    }`}
                  >
                    {item.stockQuantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-base font-semibold text-[#141414] dark:text-[#F6F1EB]">
              Recent Boutique Sales
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('payments')}
              className="text-[11px] font-semibold text-[#141414] dark:text-[#E5C6C3] hover:underline cursor-pointer"
            >
              Sales History →
            </button>
          </div>

          {sales.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="text-xs text-[#7D6E65]">
                No completed bills yet. Open the POS Counter to ring up your first boutique sale.
              </div>
              <button
                type="button"
                onClick={() => onNavigate('pos')}
                className="px-4 py-2 rounded-xl bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] text-xs font-semibold cursor-pointer"
              >
                Start First Sale
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#EFE8E0] dark:border-[#2A2622] text-left text-[10px] uppercase tracking-wider text-[#8A7E75]">
                    <th className="py-2 pr-3">Invoice</th>
                    <th className="py-2 pr-3">Client</th>
                    <th className="py-2 pr-3">Method</th>
                    <th className="py-2 pr-3 text-right">Amount</th>
                    <th className="py-2 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE8E0] dark:divide-[#2A2622]">
                  {sales.slice(0, 6).map((sale) => (
                    <tr key={sale.id}>
                      <td className="py-2.5 pr-3 font-mono-numbers font-semibold text-[#141414] dark:text-[#F6F1EB]">
                        {sale.invoiceNo}
                      </td>
                      <td className="py-2.5 pr-3 text-[#4A433E] dark:text-[#C9BFB6] truncate max-w-[160px]">
                        {sale.customerName}
                      </td>
                      <td className="py-2.5 pr-3 capitalize text-[#7D6E65] dark:text-[#A89E96]">
                        {sale.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]">
                        {storeProfile.currency} {sale.grandTotal.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setCurrentReceipt(sale)}
                          className="p-1.5 rounded-lg border border-[#E8E0D8] dark:border-[#2E2A26] hover:bg-[#F6F1EB] dark:hover:bg-[#24201C] text-[#141414] dark:text-[#F6F1EB] cursor-pointer"
                          title="Print Receipt / Digital Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
