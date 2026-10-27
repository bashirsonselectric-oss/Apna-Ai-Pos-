import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { ExpenseRecord, ExpenseCategory, PaymentMethod } from '../../types';
import {
  TrendingDown,
  Plus,
  Send,
  Calendar,
  Search,
  Filter,
  Trash2,
  FileSpreadsheet,
  X,
  CheckCircle2,
  Receipt,
  Coffee,
  Home,
  Zap,
  Truck,
  Wrench,
  Utensils,
  PackageCheck,
  Tag,
  Copy,
  Share2,
} from 'lucide-react';

export const ExpenseManager: React.FC = () => {
  const {
    expenses,
    addExpense,
    deleteExpense,
    storeProfile,
  } = usePos();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isDigitalSheetOpen, setIsDigitalSheetOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // New expense form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('utilities');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'jazzcash' | 'easypaisa' | 'bank_transfer'>('cash');
  const [paidTo, setPaidTo] = useState('');
  const [notes, setNotes] = useState('');

  // Date filter for WhatsApp sheet (defaults to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [sheetDate, setSheetDate] = useState(todayStr);

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || e.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Today's expenses for the digital sheet
  const sheetExpenses = expenses.filter((e) => e.date === sheetDate);

  // Calculations
  const totalSpentAll = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSpentToday = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCashSpent = expenses
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalDigitalSpent = expenses
    .filter((e) => e.paymentMethod !== 'cash')
    .reduce((sum, e) => sum + e.amount, 0);

  const sheetTotal = sheetExpenses.reduce((sum, e) => sum + e.amount, 0);
  const sheetCash = sheetExpenses
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);
  const sheetDigital = sheetExpenses
    .filter((e) => e.paymentMethod !== 'cash')
    .reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    addExpense({
      title: title.trim(),
      category,
      amount,
      paymentMethod,
      paidTo: paidTo.trim() || 'Store Operator',
      notes: notes.trim() || undefined,
    });

    setIsAddExpenseOpen(false);
    setTitle('');
    setAmount(0);
    setPaidTo('');
    setNotes('');
  };

  const getCategoryIcon = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'utilities':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'rent':
        return <Home className="w-3.5 h-3.5 text-blue-500" />;
      case 'tea_refreshment':
        return <Coffee className="w-3.5 h-3.5 text-amber-600" />;
      case 'staff_lunch':
        return <Utensils className="w-3.5 h-3.5 text-emerald-500" />;
      case 'repair_maintenance':
        return <Wrench className="w-3.5 h-3.5 text-rose-500" />;
      case 'transport_freight':
        return <Truck className="w-3.5 h-3.5 text-indigo-500" />;
      case 'marketing_packing':
        return <PackageCheck className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Generate WhatsApp digital sheet text
  const generateWhatsAppSheetText = () => {
    const lines = sheetExpenses.map(
      (e, index) =>
        `${index + 1}. *${e.title}* (${e.paidTo}): ${storeProfile.currency} ${e.amount.toLocaleString()} [${e.paymentMethod.toUpperCase()}]`
    );

    return `📋 *DAILY EXPENSE / SPEND MONEY SHEET*
🏪 *Store:* ${storeProfile.name}
📅 *Date:* ${sheetDate}
💰 *Total Expenses:* ${storeProfile.currency} ${sheetTotal.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
${lines.length > 0 ? lines.join('\n') : 'No expenses recorded for this date.'}
━━━━━━━━━━━━━━━━━━━━━
💵 *Paid from Cash Drawer:* ${storeProfile.currency} ${sheetCash.toLocaleString()}
📱 *Paid via Online/Bank:* ${storeProfile.currency} ${sheetDigital.toLocaleString()}
⚡ *Verified by Apna AI POS by Godigly*`;
  };

  const shareViaWhatsApp = () => {
    const text = generateWhatsAppSheetText();
    const encoded = encodeURI(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateWhatsAppSheetText());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Spend Money & Expense Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track shop utility bills, tea, refreshments, store rent, and auto-generate WhatsApp digital spend sheets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsDigitalSheetOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>WhatsApp Digital Sheet</span>
          </button>
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-rose-600 dark:hover:bg-rose-700 text-xs font-bold shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Spend Money</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Spent Today</span>
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-rose-600 dark:text-rose-400 mt-1">
            {storeProfile.currency} {totalSpentToday.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Today's direct disbursements</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Total Monthly Expenses</span>
            <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-slate-900 dark:text-white mt-1">
            {storeProfile.currency} {totalSpentAll.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">{expenses.length} expense vouchers</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Paid From Cash Drawer</span>
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-amber-600 dark:text-amber-400 mt-1">
            {storeProfile.currency} {totalCashSpent.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Deducted from drawer cash</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Online / Bank Paid</span>
            <Zap className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-blue-600 dark:text-blue-400 mt-1">
            {storeProfile.currency} {totalDigitalSpent.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Bank, JazzCash, EasyPaisa</span>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses by title, paid to, or notes..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="all">All Expense Categories</option>
              <option value="utilities">Utility Bills</option>
              <option value="rent">Shop Rent</option>
              <option value="tea_refreshment">Tea & Refreshments</option>
              <option value="staff_lunch">Staff Daily Lunch</option>
              <option value="transport_freight">Transport / Freight</option>
              <option value="marketing_packing">Packaging & Bags</option>
              <option value="repair_maintenance">Shop Repair & Maintenance</option>
              <option value="misc">Miscellaneous</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expense List Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-white">
            Recorded Vouchers ({filteredExpenses.length})
          </span>
          <span className="text-[11px] text-slate-400">Expenses reduce drawer net balance</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Title & Description</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Paid To</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No expense records match the search.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">{exp.date}</td>

                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div>{exp.title}</div>
                      {exp.notes && (
                        <div className="text-[10px] font-normal text-slate-400 truncate max-w-xs">{exp.notes}</div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 capitalize">
                        {getCategoryIcon(exp.category)}
                        <span>{exp.category.replace('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">{exp.paidTo}</td>

                    <td className="p-3.5 uppercase font-mono text-[10px] font-bold text-slate-500">
                      {exp.paymentMethod.replace('_', ' ')}
                    </td>

                    <td className="p-3.5 text-right font-mono-numbers font-black text-rose-600 dark:text-rose-400 text-sm">
                      -{storeProfile.currency} {exp.amount.toLocaleString()}
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Digital Sheet Modal (with right-side scrollbar) */}
      {isDigitalSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-emerald-300" />
                <div>
                  <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                    WhatsApp Digital Sheet
                  </span>
                  <h3 className="text-base font-bold">Daily Spend Sheet Summary</h3>
                </div>
              </div>
              <button
                onClick={() => setIsDigitalSheetOpen(false)}
                className="p-1 text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with right-side scrollbar */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Sheet Date:
                </label>
                <input
                  type="date"
                  value={sheetDate}
                  onChange={(e) => setSheetDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                />
              </div>

              {/* Digital Sheet Preview Card on Pure White Background */}
              <div className="bg-white text-slate-900 p-5 rounded-2xl border border-slate-300 shadow-md font-mono text-xs space-y-3">
                <div className="text-center pb-2 border-b border-dashed border-slate-300">
                  <div className="text-sm font-black uppercase text-slate-900 tracking-wider">
                    📋 DAILY EXPENSE / SPEND MONEY SHEET
                  </div>
                  <div className="font-bold text-xs text-slate-800 mt-0.5">{storeProfile.name}</div>
                  <div className="text-[11px] text-slate-500">Date: {sheetDate}</div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  {sheetExpenses.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 italic font-sans">
                      No expense entries recorded for this date.
                    </div>
                  ) : (
                    sheetExpenses.map((item, idx) => (
                      <div key={item.id} className="flex justify-between items-start py-0.5 border-b border-slate-100">
                        <div className="pr-2">
                          <span className="font-bold">{idx + 1}. {item.title}</span>
                          <span className="text-[10px] text-slate-500 block">Paid to: {item.paidTo} [{item.paymentMethod}]</span>
                        </div>
                        <span className="font-bold shrink-0">
                          {storeProfile.currency} {item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t-2 border-slate-900 font-bold space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>TOTAL SPENT:</span>
                    <span className="text-rose-600 font-black">
                      {storeProfile.currency} {sheetTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Cash Drawer Paid:</span>
                    <span>{storeProfile.currency} {sheetCash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Digital / Bank Paid:</span>
                    <span>{storeProfile.currency} {sheetDigital.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-200">
                  Powered by Apna AI POS • Godigly Cloud
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={shareViaWhatsApp}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Direct Send WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal (with right-side scrollbar) */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  Disbursement Voucher
                </span>
                <h3 className="text-base font-bold">Record Shop Expense</h3>
              </div>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  value={title ?? ''}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Electric bill sub-meter, daily tea, packing tape..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-bold focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount ({storeProfile.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-2 text-base font-black font-mono-numbers text-rose-600 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Disbursed From
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                  >
                    <option value="cash">Cash Drawer</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">EasyPaisa</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                >
                  <option value="utilities">Utility Bills (Electricity, Water, Gas)</option>
                  <option value="rent">Shop / Plaza Rent</option>
                  <option value="tea_refreshment">Tea, Refreshments & Water</option>
                  <option value="staff_lunch">Staff Daily Lunch</option>
                  <option value="transport_freight">Transport & Freight Delivery</option>
                  <option value="marketing_packing">Packaging Bags & Receipt Paper</option>
                  <option value="repair_maintenance">Shop Repair & Maintenance</option>
                  <option value="supplier_cash">Supplier Cash Settlement</option>
                  <option value="misc">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Paid To / Recipient
                </label>
                <input
                  type="text"
                  value={paidTo ?? ''}
                  onChange={(e) => setPaidTo(e.target.value)}
                  placeholder="e.g. LESCO, Hotel Boy, Driver, Landlord"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Receipt Number
                </label>
                <textarea
                  rows={2}
                  value={notes ?? ''}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Voucher or sub-meter reading details..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
