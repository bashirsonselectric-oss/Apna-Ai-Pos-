import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { PaymentRecord, PaymentMethod } from '../../types';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Plus,
  Trash2,
  Download,
  Calendar,
  CheckCircle2,
  X,
  Wallet,
  Receipt,
  FileSpreadsheet,
  MessageCircle,
} from 'lucide-react';

export const PaymentRecords: React.FC = () => {
  const {
    paymentRecords,
    addPaymentRecord,
    deletePaymentRecord,
    storeProfile,
    sales,
    setCurrentReceipt,
  } = usePos();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New manual entry form state
  const [entryType, setEntryType] = useState<'sale_income' | 'udhar_recovery' | 'expense_payout' | 'salary_payout' | 'custom_entry'>('sale_income');
  const [entryDirection, setEntryDirection] = useState<'inflow' | 'outflow'>('inflow');
  const [entryAmount, setEntryAmount] = useState<number>(0);
  const [entryMethod, setEntryMethod] = useState<PaymentMethod>('cash');
  const [entryPartyName, setEntryPartyName] = useState('');
  const [entryPhone, setEntryPhone] = useState('');
  const [entryCategory, setEntryCategory] = useState('Counter Settlement');
  const [entryNotes, setEntryNotes] = useState('');

  // Filtered payment records
  const filteredRecords = paymentRecords.filter((rec) => {
    const matchesSearch =
      rec.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.referenceNo && rec.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.notes && rec.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.category && rec.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || rec.type === filterType;
    const matchesMethod = filterMethod === 'all' || rec.method === filterMethod;

    return matchesSearch && matchesType && matchesMethod;
  });

  // KPI Calculations
  const totalInflow = paymentRecords
    .filter((r) => r.direction === 'inflow')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalOutflow = paymentRecords
    .filter((r) => r.direction === 'outflow')
    .reduce((sum, r) => sum + r.amount, 0);

  const cashInflow = paymentRecords
    .filter((r) => r.direction === 'inflow' && r.method === 'cash')
    .reduce((sum, r) => sum + r.amount, 0);

  const digitalInflow = paymentRecords
    .filter((r) => r.direction === 'inflow' && r.method !== 'cash')
    .reduce((sum, r) => sum + r.amount, 0);

  const udharRecoveries = paymentRecords
    .filter((r) => r.type === 'udhar_recovery')
    .reduce((sum, r) => sum + r.amount, 0);

  const netCashFlow = totalInflow - totalOutflow;

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (entryAmount <= 0 || !entryPartyName.trim()) return;

    addPaymentRecord({
      type: entryType,
      direction: entryDirection,
      amount: entryAmount,
      method: entryMethod,
      referenceNo: `MAN-${Date.now().toString().slice(-5)}`,
      partyName: entryPartyName.trim(),
      partyPhone: entryPhone.trim() || undefined,
      category: entryCategory,
      notes: entryNotes.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setEntryAmount(0);
    setEntryPartyName('');
    setEntryPhone('');
    setEntryNotes('');
  };

  const exportToCSV = () => {
    const headers = 'ID,Date,Direction,Type,Method,Party Name,Phone,Amount,Reference,Notes\n';
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.id}","${new Date(r.date).toLocaleString()}","${r.direction}","${r.type}","${r.method}","${r.partyName}","${r.partyPhone || ''}","${r.amount}","${r.referenceNo || ''}","${r.notes || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apna_pos_payment_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Banknote className="w-3 h-3" /> Cash
          </span>
        );
      case 'jazzcash':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <Smartphone className="w-3 h-3 text-rose-600" /> JazzCash
          </span>
        );
      case 'easypaisa':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Smartphone className="w-3 h-3 text-emerald-600" /> EasyPaisa
          </span>
        );
      case 'bank_transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <Building className="w-3 h-3 text-blue-600" /> Bank Transfer
          </span>
        );
      case 'card':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            <CreditCard className="w-3 h-3" /> Card POS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Wallet className="w-3 h-3" /> {method}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Payment Records & Transactions Ledger
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live cash flow register, digital payment receipts, Udhar recoveries, and expense disbursements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Total Inflow</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-emerald-600 dark:text-emerald-400 mt-1">
            {storeProfile.currency} {totalInflow.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Gross revenue & recoveries</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Cash in Drawer</span>
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-slate-900 dark:text-white mt-1">
            {storeProfile.currency} {cashInflow.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Pure cash received</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Digital Gateways</span>
            <Smartphone className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-indigo-600 dark:text-indigo-400 mt-1">
            {storeProfile.currency} {digitalInflow.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">JazzCash / EasyPaisa / Bank</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Udhar Recoveries</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-indigo-700 dark:text-indigo-300 mt-1">
            {storeProfile.currency} {udharRecoveries.toLocaleString()}
          </div>
          <span className="text-[10px] text-indigo-500 font-semibold">Credit cash settled</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-xs col-span-2 md:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Net Balance Flow</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div
            className={`text-xl font-black font-mono-numbers mt-1 ${
              netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {storeProfile.currency} {netCashFlow.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Inflow minus Outflow</span>
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
              placeholder="Search by customer/party, invoice #, reference, notes..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="all">All Gateways & Methods</option>
              <option value="cash">Cash Only</option>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">EasyPaisa</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card POS</option>
            </select>
          </div>
        </div>

        {/* Filter Type Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'sale_income', label: 'Store Sales' },
            { id: 'udhar_recovery', label: 'Udhar Recoveries' },
            { id: 'expense_payout', label: 'Expense Outflows' },
            { id: 'salary_payout', label: 'Staff Salaries' },
            { id: 'custom_entry', label: 'Custom Advances' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Showing {filteredRecords.length} Payment Transactions
          </span>
          <span className="text-[11px] text-slate-400">Chronological ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Flow</th>
                <th className="p-3.5">Party / Beneficiary</th>
                <th className="p-3.5">Category & Purpose</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No payment records match the current filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div>{new Date(record.date).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>

                    <td className="p-3.5">
                      {record.direction === 'inflow' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <ArrowDownLeft className="w-3 h-3" /> Inflow
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <ArrowUpRight className="w-3 h-3" /> Outflow
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div>{record.partyName}</div>
                      {record.partyPhone && (
                        <div className="text-[10px] font-mono text-slate-400">{record.partyPhone}</div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        {record.category || record.type.replace('_', ' ')}
                      </div>
                      {record.notes && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{record.notes}</div>
                      )}
                    </td>

                    <td className="p-3.5">{getMethodBadge(record.method)}</td>

                    <td className="p-3.5 text-right font-mono-numbers font-black text-sm">
                      <span
                        className={
                          record.direction === 'inflow'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {record.direction === 'inflow' ? '+' : '-'} {storeProfile.currency}{' '}
                        {record.amount.toLocaleString()}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {record.referenceNo && (
                          <button
                            onClick={() => {
                              const matchedSale = sales.find((s) => s.invoiceNo === record.referenceNo);
                              if (matchedSale) {
                                setCurrentReceipt(matchedSale);
                              } else {
                                setCurrentReceipt({
                                  id: record.id,
                                  invoiceNo: record.referenceNo || 'POS-2026-0001',
                                  timestamp: record.date,
                                  customerName: record.partyName || 'Customer',
                                  customerPhone: record.partyPhone,
                                  items: [],
                                  subtotal: record.amount,
                                  discountAmount: 0,
                                  taxAmount: 0,
                                  grandTotal: record.amount,
                                  profit: 0,
                                  paymentMethod: (record.method === 'other' ? 'cash' : record.method) as PaymentMethod,
                                });
                              }
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-white hover:bg-emerald-600 transition-colors"
                            title="Send Receipt Image on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deletePaymentRecord(record.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Entry Modal (with right-side scrollbar) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Cash Register Entry
                </span>
                <h3 className="text-base font-bold">Add Manual Payment Record</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with right-side scrollbar */}
            <form onSubmit={handleCreateEntry} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEntryDirection('inflow')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    entryDirection === 'inflow'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ↓ Money Received (Inflow)
                </button>
                <button
                  type="button"
                  onClick={() => setEntryDirection('outflow')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    entryDirection === 'outflow'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ↑ Money Paid (Outflow)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount ({storeProfile.currency}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={entryAmount || ''}
                  onChange={(e) => setEntryAmount(Number(e.target.value))}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 text-base font-black font-mono-numbers text-emerald-600 dark:text-emerald-400 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={entryMethod}
                    onChange={(e) => setEntryMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                  >
                    <option value="cash">Cash In Drawer</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">EasyPaisa</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card POS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Entry Type
                  </label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                  >
                    <option value="sale_income">Store Sale Income</option>
                    <option value="udhar_recovery">Udhar Recovery</option>
                    <option value="expense_payout">Shop Expense Payout</option>
                    <option value="salary_payout">Staff Salary</option>
                    <option value="custom_entry">Custom Settlement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer / Vendor / Person Name *
                </label>
                <input
                  type="text"
                  required
                  value={entryPartyName ?? ''}
                  onChange={(e) => setEntryPartyName(e.target.value)}
                  placeholder="e.g. Asif Electrician or LESCO Bill"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-bold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={entryPhone ?? ''}
                  onChange={(e) => setEntryPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category / Purpose
                </label>
                <input
                  type="text"
                  value={entryCategory ?? ''}
                  onChange={(e) => setEntryCategory(e.target.value)}
                  placeholder="e.g. Counter Cash, Lunch, Courier, Misc"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Remarks
                </label>
                <textarea
                  rows={2}
                  value={entryNotes ?? ''}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  placeholder="Details, bill voucher number, or reasons..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20"
                >
                  Save Payment Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
