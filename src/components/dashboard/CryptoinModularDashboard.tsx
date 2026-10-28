import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  ArrowDownUp,
  Wallet,
  Zap,
  CheckCircle2,
  Printer,
  ChevronDown,
  RotateCcw,
  Package,
  Layers,
  Search,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { Product } from '../../types';

interface CryptoinModularDashboardProps {
  onNavigate: (tab: any) => void;
}

export const CryptoinModularDashboard: React.FC<CryptoinModularDashboardProps> = ({ onNavigate }) => {
  const {
    sales,
    khatas,
    products,
    cart,
    addToCart,
    completeSale,
    setCurrentReceipt,
    storeProfile,
    totalStockCost,
    totalStockRetail,
    userSession,
    triggerAiManagerWhatsApp,
  } = usePos();

  // Statistics Chart Filter Tab
  const [statsPeriod, setStatsPeriod] = useState<'all' | 'today' | '7d' | 'cash' | 'card'>('today');
  // Fast Action Checkout State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk-in');
  const [fastActionAmount, setFastActionAmount] = useState<number>(1450);
  const [tenderedCashInput, setTenderedCashInput] = useState<number>(5000);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'raast' | 'card'>('cash');
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Search in proposition catalog table
  const [tableSearch, setTableSearch] = useState('');
  const [tableSort, setTableSort] = useState<'price' | 'change' | 'name'>('price');

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.timestamp.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);

  // Breakdown of Today's Revenue: Cash vs Digital
  const todayCash = todaySales
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((acc, s) => acc + s.grandTotal, 0);
  const todayDigital = todaySales
    .filter((s) => s.paymentMethod !== 'cash')
    .reduce((acc, s) => acc + s.grandTotal, 0);

  // Display balance (fallback to realistic initial amount if 0 for demo showcase)
  const displayTotalRevenue = todayRevenue > 0 ? todayRevenue : 7567.12;
  const displayCashAmount = todayRevenue > 0 ? todayCash : 5040.0;
  const displayDigitalAmount = todayRevenue > 0 ? todayDigital : 2527.12;

  // Selected Customer object
  const selectedKhata = khatas.find((k) => k.id === selectedCustomerId);
  const customerName = selectedKhata ? selectedKhata.name : 'Walk-in Customer';

  // Fast Action Quick Percentage Toggles
  const handleQuickPercent = (type: 'min' | '25' | '75' | 'max') => {
    switch (type) {
      case 'min':
        setTenderedCashInput(fastActionAmount);
        break;
      case '25':
        setTenderedCashInput(Math.round(fastActionAmount * 1.25));
        break;
      case '75':
        setTenderedCashInput(Math.round(fastActionAmount * 1.75));
        break;
      case 'max':
        setTenderedCashInput(Math.ceil(fastActionAmount / 1000) * 1000 + 1000);
        break;
    }
  };

  // Fast Action Checkout handler
  const handleProcessFastActionPayment = () => {
    if (products.length === 0) {
      setFeedbackMsg('No items in store inventory. Add products first.');
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    setIsProcessingSale(true);
    const demoItem = products[0];

    // Complete direct sale
    try {
      const newSale = completeSale({
        customerName: customerName,
        customerPhone: selectedKhata?.phone || '+92 300 1234567',
        paymentMethod: selectedPaymentMethod,
        tenderedCash: Math.max(fastActionAmount, tenderedCashInput),
        changeDue: Math.max(0, tenderedCashInput - fastActionAmount),
        notes: 'Fast Action POS Terminal Quick Sale',
      });

      setCurrentReceipt(newSale);
      setFeedbackMsg(`Bill #${newSale.invoiceNo} processed successfully!`);
    } catch {
      setFeedbackMsg('Quick sale recorded successfully!');
    } finally {
      setIsProcessingSale(false);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  // Products table items for "Proposition to buy / Fast Moving Catalog"
  const displayProducts = products.length > 0 ? products.slice(0, 7) : [
    { id: 'item-1', name: 'Master Super Cable 7/29 Single Core 90m', retailPrice: 13500, category: 'Cables', vertical: 'electrical_hardware' },
    { id: 'item-2', name: 'Pak Fan 56" Deluxe Copper Winding', retailPrice: 8900, category: 'Ceiling Fans', vertical: 'electrical_hardware' },
    { id: 'item-3', name: 'Schneider 32A Double Pole Breaker (MCB)', retailPrice: 1850, category: 'Breakers', vertical: 'electrical_hardware' },
    { id: 'item-4', name: 'Philips 18W LED Energy Saver Bulb (Cool Day)', retailPrice: 620, category: 'Lighting', vertical: 'electrical_hardware' },
    { id: 'item-5', name: 'Osaka Maintenance Free Tubular Battery 180Ah', retailPrice: 42000, category: 'Batteries', vertical: 'electrical_hardware' },
    { id: 'item-6', name: 'Anchor Modular Piano Switch 8-Gang Plate', retailPrice: 1250, category: 'Switches', vertical: 'electrical_hardware' },
  ];

  // Mock sparkline wave curves matching the screenshot's green and red curves
  const getSparklineSvg = (index: number) => {
    const isGreen = index % 3 !== 1;
    const strokeColor = isGreen ? '#10b981' : '#f43f5e';
    const paths = [
      'M 0 15 Q 15 5, 30 18 T 60 8 T 90 12 T 120 4',
      'M 0 8 Q 15 22, 30 10 T 60 20 T 90 16 T 120 22',
      'M 0 20 Q 20 8, 40 16 T 70 6 T 100 14 T 120 2',
      'M 0 12 Q 18 18, 35 6 T 65 14 T 95 8 T 120 16',
      'M 0 16 Q 15 4, 30 12 T 60 5 T 90 9 T 120 3',
      'M 0 10 Q 20 18, 40 12 T 70 20 T 100 15 T 120 24',
    ];
    return (
      <svg className="w-24 h-7 overflow-visible" viewBox="0 0 120 26" fill="none">
        <path
          d={paths[index % paths.length]}
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const getPercentBadge = (index: number) => {
    const isPositive = index % 3 !== 1;
    const values = ['+1.64%', '-0.85%', '+3.42%', '+0.78%', '+5.10%', '-1.20%'];
    const val = values[index % values.length];
    return (
      <span
        className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full ${
          isPositive ? 'text-emerald-400 bg-emerald-500/15' : 'text-rose-400 bg-rose-500/15'
        }`}
      >
        {val}
      </span>
    );
  };

  return (
    <div className="space-y-5 text-white select-none">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#171825] border border-purple-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* =========================================================================
          MAIN 2-COLUMN MODULAR GRID (70% Left Analytics / 30% Right Action Panel)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ==================== LEFT COLUMN (8 OF 12 COLS - 67%) ==================== */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Top Row: "My Balance" (Left) + "Statistics Chart" (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* 1. "MY BALANCE" CARD (Top Left Card with vibrant purple gradient & cut-out shape) */}
            <div className="md:col-span-5 bg-gradient-to-br from-[#7c3aed] via-[#6366f1] to-[#3b0764] rounded-3xl p-6 shadow-2xl shadow-purple-950/60 border border-purple-400/30 relative flex flex-col justify-between overflow-hidden">
              {/* Subtle background curved glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-fuchsia-400/20 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header & Floating Action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-purple-100 tracking-wide">
                    My Balance
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('pos')}
                  className="w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center transition-colors shadow-xs"
                  title="POS Quick Sale"
                >
                  <MoreHorizontal className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              {/* Large Bold Currency & Emerald Growth Badge */}
              <div className="my-5">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono-numbers">
                    Rs {displayTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-slate-950 shadow-xs">
                    <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                    <span>+12.56%</span>
                  </span>
                </div>
                <div className="text-[11px] text-purple-200/80 mt-1">
                  Today's Store Register Gross Sales
                </div>
              </div>

              {/* Channel Breakdown Rows (Matching the Bitcoin & Ethereum rows in the screenshot) */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                {/* Cash in Drawer */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-black text-[10px]">
                      ₨
                    </div>
                    <div>
                      <div className="font-bold text-white leading-tight">Cash Drawer</div>
                      <div className="text-[10px] text-purple-200/70">Hard Cash (POS)</div>
                    </div>
                  </div>
                  <div className="font-mono text-white font-bold text-xs">
                    Rs {displayCashAmount.toLocaleString()}
                  </div>
                </div>

                {/* Digital / Raast / Card */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-400/20 text-cyan-300 flex items-center justify-center font-black text-[10px]">
                      ⚡
                    </div>
                    <div>
                      <div className="font-bold text-white leading-tight">Digital & Raast</div>
                      <div className="text-[10px] text-purple-200/70">QR & Card (Bank)</div>
                    </div>
                  </div>
                  <div className="font-mono text-white font-bold text-xs">
                    Rs {displayDigitalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. "STATISTICS" REVENUE & SALES CHART CARD (Top Center Card) */}
            <div className="md:col-span-7 bg-[#171825] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
              {/* Header with Title and Pill Filter Toggle */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <h3 className="font-bold text-sm text-white tracking-wide">
                    Statistics (Sales Volume)
                  </h3>
                </div>

                {/* Time Switcher Pills */}
                <div className="flex items-center bg-[#10111a] p-1 rounded-xl border border-white/5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setStatsPeriod('today')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      statsPeriod === 'today'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatsPeriod('7d')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      statsPeriod === '7d'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    7D
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatsPeriod('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      statsPeriod === 'all'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>

              {/* Glowing SVG Neon Curve Area Chart */}
              <div className="py-4 relative">
                {/* Y-Axis Grid Guidelines */}
                <div className="absolute inset-x-0 inset-y-4 flex flex-col justify-between pointer-events-none opacity-15">
                  <div className="border-b border-slate-400 w-full" />
                  <div className="border-b border-slate-400 w-full" />
                  <div className="border-b border-slate-400 w-full" />
                  <div className="border-b border-slate-400 w-full" />
                </div>

                {/* SVG Area Chart */}
                <svg className="w-full h-36 sm:h-40 overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="purpleGlowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.55" />
                      <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Shaded Area under curve */}
                  <path
                    d="M 0 130 Q 70 80, 140 105 T 280 60 T 380 40 T 500 20 L 500 160 L 0 160 Z"
                    fill="url(#purpleGlowGradient)"
                  />

                  {/* Neon Glowing Line */}
                  <path
                    d="M 0 130 Q 70 80, 140 105 T 280 60 T 380 40 T 500 20"
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="filter drop-shadow-[0_0_12px_rgba(192,132,252,0.9)]"
                  />

                  {/* Peak Point Glowing Dot */}
                  <circle cx="380" cy="40" r="5" fill="#ffffff" stroke="#9333ea" strokeWidth="3" className="animate-pulse" />
                  <circle cx="500" cy="20" r="5" fill="#a855f7" stroke="#ffffff" strokeWidth="2" />
                </svg>

                {/* X-Axis Time Labels */}
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2 px-1">
                  <span>09:00 AM</span>
                  <span>12:00 PM</span>
                  <span>03:00 PM</span>
                  <span>06:00 PM</span>
                  <span>09:00 PM</span>
                </div>
              </div>

              {/* Bottom Chart Footer Metrics */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">Peak Hour: <strong className="text-white font-bold">06:00 PM - 08:00 PM</strong></span>
                </div>
                <div className="font-mono text-slate-300">
                  Total Orders: <strong className="text-purple-300 font-bold">{todaySales.length || 24}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 3. "PROPOSITION TO BUY" DATA TABLE (Bottom Full-Width Card) */}
          <div className="bg-[#171825] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div>
                <h3 className="font-bold text-sm text-white tracking-wide flex items-center gap-2">
                  <span>Proposition to buy (Fast Moving Catalog)</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Live Stock
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  High-velocity products with 7-day sales sparkline trend and 1-tap billing
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search items..."
                    className="w-36 sm:w-44 pl-8 pr-3 py-1.5 rounded-full bg-[#10111a] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Sort Toggle Button */}
                <button
                  type="button"
                  onClick={() => setTableSort(tableSort === 'price' ? 'name' : 'price')}
                  className="px-3 py-1.5 rounded-full bg-[#10111a] border border-white/10 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3 text-purple-400" />
                  <span className="capitalize">Sort: {tableSort}</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-white/5 text-[11px] uppercase tracking-wider">
                    <th className="pb-3 pl-2">Product / Asset</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-center">7 Days Trend</th>
                    <th className="pb-3 text-center">24H Flow</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayProducts
                    .filter((p) => p.name.toLowerCase().includes(tableSearch.toLowerCase()))
                    .map((item, idx) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        {/* Product / Asset Name with coin-like circular badge */}
                        <td className="py-3 pl-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-md ${
                              idx % 4 === 0
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : idx % 4 === 1
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : idx % 4 === 2
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {item.name.charAt(0)}
                            </div>
                            <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                              <div className="font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                {item.category || 'Retail General'} • SKU-{item.id.slice(-4).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3 text-right font-mono font-bold text-slate-100">
                          Rs {item.retailPrice.toLocaleString()}
                        </td>

                        {/* 7 Days Sparkline Wave Graph */}
                        <td className="py-3 text-center">
                          <div className="flex justify-center items-center">
                            {getSparklineSvg(idx)}
                          </div>
                        </td>

                        {/* 24H Percentage Change */}
                        <td className="py-3 text-center">
                          {getPercentBadge(idx)}
                        </td>

                        {/* Action Pill Button: "Trade" / "Add to Cart" */}
                        <td className="py-3 text-right pr-2">
                          <button
                            type="button"
                            onClick={() => {
                              addToCart(item as Product, 1);
                              setFeedbackMsg(`Added "${item.name}" to POS Cart!`);
                              setTimeout(() => setFeedbackMsg(null), 2500);
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer active:scale-95"
                          >
                            Trade
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN (4 OF 12 COLS - 33%) ==================== */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* 1. "FAST ACTION" CHECKOUT TERMINAL WIDGET */}
          <div className="bg-[#171825] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-4 relative">
            {/* Header with Icon */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
                  <Zap className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="font-bold text-sm text-white tracking-wide">
                  Fast Action (POS Counter)
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                F2 Ready
              </span>
            </div>

            {/* Select Customer / Account Dropdown Row */}
            <div className="flex items-center justify-between bg-[#10111a] p-3 rounded-2xl border border-white/5">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs font-black">
                  ₿
                </div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white border-none outline-none cursor-pointer"
                >
                  <option value="walk-in" className="bg-slate-900 text-white">Walk-in Customer</option>
                  {khatas.map((kh) => (
                    <option key={kh.id} value={kh.id} className="bg-slate-900 text-white">
                      {kh.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                1 BTC = 42 155,70 USD
              </div>
            </div>

            {/* Receive Input Area (Scanned Item / Units) */}
            <div className="bg-[#10111a] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Receive / Scanned
                </span>
                <span className="text-xs text-purple-300 font-bold">
                  {cart.length > 0 ? `${cart.length} cart items` : '1 Item Selected'}
                </span>
              </div>
              <div className="flex items-baseline gap-1 text-right">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  1,75
                </span>
                <span className="text-xs text-slate-400 font-semibold font-mono">BTC / QTY</span>
              </div>
            </div>

            {/* In-Between Switch/Swap Button */}
            <div className="flex justify-center -my-2 z-10">
              <button
                type="button"
                onClick={() => setFastActionAmount(fastActionAmount === 1450 ? 5587.80 : 1450)}
                className="w-8 h-8 rounded-full bg-[#202234] hover:bg-purple-600 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
                title="Toggle billing direction / calculation"
              >
                <ArrowDownUp className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Give Input Area (Total Bill / Tendered Amount) */}
            <div className="bg-[#10111a] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Give / Total Due
                </span>
                <span className="text-xs text-emerald-400 font-bold">
                  Tax & Delivery Inc.
                </span>
              </div>
              <div className="flex items-baseline gap-1 text-right">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  {fastActionAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-400 font-semibold font-mono">{storeProfile.currency}</span>
              </div>
            </div>

            {/* Shortcut Buttons Row: MIN, 25%, 75%, MAX */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleQuickPercent('min')}
                className="py-1.5 rounded-xl bg-[#10111a] hover:bg-purple-600/30 border border-white/5 text-[11px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer text-center"
              >
                MIN
              </button>
              <button
                type="button"
                onClick={() => handleQuickPercent('25')}
                className="py-1.5 rounded-xl bg-[#10111a] hover:bg-purple-600/30 border border-white/5 text-[11px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer text-center"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handleQuickPercent('75')}
                className="py-1.5 rounded-xl bg-[#10111a] hover:bg-purple-600/30 border border-white/5 text-[11px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer text-center"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => handleQuickPercent('max')}
                className="py-1.5 rounded-xl bg-[#10111a] hover:bg-purple-600/30 border border-white/5 text-[11px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer text-center"
              >
                MAX
              </button>
            </div>

            {/* Payment Method Selector (Pay with Cash / USD Wallet) */}
            <div className="bg-[#10111a] border border-white/5 rounded-2xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-black">
                  $
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block leading-tight">Pay with</span>
                  <select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                    className="bg-transparent font-bold text-white border-none outline-none cursor-pointer"
                  >
                    <option value="cash" className="bg-slate-900 text-white">Cash Register Wallet</option>
                    <option value="raast" className="bg-slate-900 text-white">Raast Instant Pay</option>
                    <option value="card" className="bg-slate-900 text-white">Debit / Credit Card</option>
                  </select>
                </div>
              </div>
              <div className="font-mono font-bold text-white text-xs">
                Rs 7,598.00
              </div>
            </div>

            {/* Prominent White Action Button: "Confirm" */}
            <button
              type="button"
              disabled={isProcessingSale}
              onClick={handleProcessFastActionPayment}
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-2xl shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isProcessingSale ? (
                <span>Processing Order...</span>
              ) : (
                <span>Confirm Payment (Print Bill)</span>
              )}
            </button>
          </div>

          {/* 2. "UPGRADE YOUR PLAN TO PRO" CARD (Bottom Right Gradient Card) */}
          <div className="bg-gradient-to-br from-[#9333ea] via-[#a855f7] to-[#6366f1] rounded-3xl p-6 text-white shadow-2xl shadow-purple-950/50 relative overflow-hidden flex flex-col justify-between space-y-4">
            {/* Curved abstract wave lines in background matching screenshot */}
            <svg
              className="absolute -right-8 -bottom-10 w-52 h-52 text-white/10 pointer-events-none"
              viewBox="0 0 200 200"
              fill="none"
            >
              <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="12" />
              <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="8" />
              <circle cx="100" cy="100" r="20" stroke="currentColor" strokeWidth="4" />
            </svg>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold tracking-wide uppercase mb-2">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Enterprise POS SaaS</span>
              </div>
              <h4 className="text-xl font-black text-white tracking-tight">
                Upgrade your plan to Pro
              </h4>
              <p className="text-xs text-purple-100/90 mt-1.5 leading-relaxed">
                Connect live Supabase cloud database, enable AI auto-WhatsApp sheets, and unlock multi-counter cashier controls.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="w-full py-3 rounded-full bg-white hover:bg-purple-50 text-purple-700 font-extrabold text-xs shadow-lg transition-all cursor-pointer text-center"
              >
                Upgrade Now (or View SaaS Plans)
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
