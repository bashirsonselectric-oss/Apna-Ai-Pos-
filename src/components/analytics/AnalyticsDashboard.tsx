import React from 'react';
import { usePos } from '../../context/PosContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  PieChart,
  MessageCircle,
} from 'lucide-react';

export const AnalyticsDashboard: React.FC<{ onOpenAiForecast: () => void }> = ({
  onOpenAiForecast,
}) => {
  const {
    sales,
    products,
    storeProfile,
    setCurrentReceipt,
    totalStockCost,
    totalStockRetail,
    outOfStockItems,
    lowStockItems,
    khatas,
    totalUdhar,
    khataLimitHighlights,
  } = usePos();

  const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const avgBasket = sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0;
  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  // Customers with limit highlights
  const fullLimitCustomers = khatas.filter((k) => k.currentBalance >= k.creditLimit);
  const halfLimitCustomers = khatas.filter(
    (k) => k.currentBalance >= k.creditLimit * 0.5 && k.currentBalance < k.creditLimit
  );

  // Breakdown by payment gateway
  const paymentBreakdown = sales.reduce((acc: Record<string, { count: number; amount: number }>, s) => {
    const method = s.paymentMethod;
    if (!acc[method]) acc[method] = { count: 0, amount: 0 };
    acc[method].count += 1;
    acc[method].amount += s.grandTotal;
    return acc;
  }, {});

  // Top products sold
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  sales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productSalesMap[item.name]) {
        productSalesMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSalesMap[item.name].qty += item.quantity;
      productSalesMap[item.name].revenue += item.subtotal;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Business Intelligence & Dashboard Overview
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time revenue, warehouse stock valuation, market Udhar exposure, and customer credit ceilings.
          </p>
        </div>
        <button
          onClick={onOpenAiForecast}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center space-x-2 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Launch AI Demand Forecast</span>
        </button>
      </div>

      {/* CORE HIGHLIGHTS ROW: Stock Valuation, Out of Stock, Total Udhar & Limit Warnings */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Stock Valuation</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-numbers mt-1.5">
            {storeProfile.currency} {totalStockCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            Retail Realization: {storeProfile.currency} {totalStockRetail.toLocaleString()}
          </div>
        </div>

        {/* Out of Stock Items Alert */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-600 font-bold">
            <span>Out of Stock Items</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono-numbers mt-1.5">
            {outOfStockItems.length} SKUs
          </div>
          <div className="text-[11px] text-rose-700 mt-1 font-medium">
            {lowStockItems.length} additional items near low buffer
          </div>
        </div>

        {/* Total Udhar Amount */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-indigo-700 font-bold">
            <span>Total Udhar in Market</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold">Receivable</span>
          </div>
          <div className="text-2xl font-black text-indigo-900 font-mono-numbers mt-1.5">
            {storeProfile.currency} {totalUdhar.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1">
            Across {khatas.filter((k) => k.currentBalance > 0).length} debtor customers
          </div>
        </div>

        {/* Udhar Customer Limits: Full Limit vs Half Limit Highlights */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-xs font-semibold text-slate-500 flex justify-between items-center">
            <span>Customer Limit Highlights</span>
            <span className="text-[10px] text-slate-400">Ceilings</span>
          </div>
          <div className="flex items-center space-x-2 pt-0.5">
            <div className="flex-1 p-2 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <div className="text-[10px] uppercase font-bold text-rose-600">Full Limit</div>
              <div className="text-lg font-black text-rose-700 font-mono-numbers">
                {fullLimitCustomers.length}
              </div>
            </div>
            <div className="flex-1 p-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-[10px] uppercase font-bold text-amber-700">Half Limit</div>
              <div className="text-lg font-black text-amber-700 font-mono-numbers">
                {halfLimitCustomers.length}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            {khataLimitHighlights.safeLimitCount} accounts in safe range
          </div>
        </div>
      </div>

      {/* SALES REVENUE & PROFIT ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Gross Sales Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-numbers mt-1.5">
            {storeProfile.currency} {totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> Across {sales.length} orders
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Estimated Gross Profit</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono-numbers mt-1.5">
            {storeProfile.currency} {totalProfit.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avg Margin: <strong className="text-slate-700">{profitMargin}%</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Average Basket Size</span>
            <ShoppingBag className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-numbers mt-1.5">
            {storeProfile.currency} {avgBasket.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Per transaction ticket</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active SKUs in Catalog</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-numbers mt-1.5">
            {products.length} Items
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total active master catalog
          </div>
        </div>
      </div>

      {/* Middle: Gateways & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment Gateway Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            Payment Gateway Collection Mix
          </h3>

          <div className="space-y-3">
            {Object.entries(paymentBreakdown).map(([method, data]) => {
              const pct = totalRevenue > 0 ? Math.round((data.amount / totalRevenue) * 100) : 0;
              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold capitalize text-slate-800">
                      {method === 'jazzcash'
                        ? 'JazzCash'
                        : method === 'easypaisa'
                        ? 'EasyPaisa'
                        : method}
                      <span className="text-slate-400 font-normal ml-1.5">
                        ({data.count} bills)
                      </span>
                    </span>
                    <span className="font-bold font-mono-numbers text-slate-900">
                      {storeProfile.currency} {data.amount.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        method === 'cash'
                          ? 'bg-emerald-500'
                          : method === 'jazzcash'
                          ? 'bg-red-500'
                          : method === 'easypaisa'
                          ? 'bg-teal-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            Top Selling Products by Revenue
          </h3>

          <div className="divide-y divide-slate-100">
            {topProducts.map((p, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 truncate">{p.name}</span>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-black text-slate-900 font-mono-numbers">
                    {storeProfile.currency} {p.revenue.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">{p.qty} units sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          Recent Counter Transactions & Digital Receipts
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Payment</th>
                <th className="p-3 text-right">Items</th>
                <th className="p-3 text-right">Net Total</th>
                <th className="p-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold font-mono text-slate-900">{sale.invoiceNo}</td>
                  <td className="p-3 text-slate-500 font-mono text-[11px]">
                    {new Date(sale.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{sale.customerName}</div>
                    {sale.customerPhone && (
                      <div className="text-[10px] text-slate-400 font-mono">{sale.customerPhone}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono-numbers text-slate-600">
                    {sale.items.length} items
                  </td>
                  <td className="p-3 text-right font-bold font-mono-numbers text-slate-900">
                    {storeProfile.currency} {sale.grandTotal.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentReceipt(sale)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs"
                        title="Send bill on WhatsApp as image"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>WhatsApp Image</span>
                      </button>
                      <button
                        onClick={() => setCurrentReceipt(sale)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1"
                        title="View printable bill"
                      >
                        <Printer className="w-3 h-3 text-slate-500" />
                        <span>Print</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
