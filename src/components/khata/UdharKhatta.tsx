import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { CustomerKhata, KhataEntry } from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  MessageCircle,
  Phone,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Share2,
  Copy,
  Check,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';

export const UdharKhatta: React.FC = () => {
  const {
    khatas,
    addKhataCustomer,
    updateKhataCustomer,
    addKhataTransaction,
    deleteKhata,
    storeProfile,
  } = usePos();

  const [search, setSearch] = useState('');
  const [selectedKhata, setSelectedKhata] = useState<CustomerKhata | null>(null);
  const [limitFilter, setLimitFilter] = useState<'all' | 'full' | 'half' | 'safe'>('all');

  // Modals
  const [isNewCustomerModal, setIsNewCustomerModal] = useState(false);
  const [isAddTxModal, setIsAddTxModal] = useState(false);
  const [isEditLimitModal, setIsEditLimitModal] = useState(false);
  const [newLimitValue, setNewLimitValue] = useState<number>(50000);
  const [txType, setTxType] = useState<'give_credit' | 'receive_payment'>('give_credit');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDesc, setTxDesc] = useState('');
  const [txInvoiceNo, setTxInvoiceNo] = useState('');

  // New Customer Form State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('+92 3');
  const [custAddress, setCustAddress] = useState('');
  const [custLimit, setCustLimit] = useState<number>(50000);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Filter khatas with search and limit full/half highlights
  const filteredKhatas = khatas.filter((k) => {
    const matchesSearch =
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.phone.includes(search) ||
      (k.address && k.address.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    const isFull = k.currentBalance >= k.creditLimit;
    const isHalf = k.currentBalance >= k.creditLimit * 0.5 && !isFull;
    const isSafe = k.currentBalance < k.creditLimit * 0.5;

    if (limitFilter === 'full') return isFull;
    if (limitFilter === 'half') return isHalf;
    if (limitFilter === 'safe') return isSafe;
    return true;
  });

  const totalUdharReceivable = khatas.reduce((sum, k) => sum + Math.max(0, k.currentBalance), 0);
  const totalCustomersWithBalance = khatas.filter((k) => k.currentBalance > 0).length;
  const fullLimitCount = khatas.filter((k) => k.currentBalance >= k.creditLimit).length;
  const halfLimitCount = khatas.filter((k) => k.currentBalance >= k.creditLimit * 0.5 && k.currentBalance < k.creditLimit).length;

  // Active customer object (updated in real time)
  const currentActiveKhata = selectedKhata
    ? khatas.find((k) => k.id === selectedKhata.id) || selectedKhata
    : null;

  // Generate WhatsApp Direct Reminder Message (in Urdu and English)
  const generateWhatsAppReminder = (khata: CustomerKhata) => {
    let msg = `*محترم ${khata.name} صاحب!* 🙏\n`;
    msg += `*${storeProfile.name}* کی طرف سے سلام۔\n\n`;
    msg += `امید ہے آپ بخیریت ہوں گے۔ آپ کے کھاتے کا موجودہ بقایا بیلنس درج ذیل ہے:\n`;
    msg += `💰 *بقایا واجب الادا رقم: ${storeProfile.currency} ${khata.currentBalance.toLocaleString()}*\n`;
    msg += `📅 آخری لین دین: ${khata.lastTransactionDate}\n\n`;
    msg += `برائے مہربانی اپنا کھاتہ جلد از جلد کلیئر فرما کر رسید حاصل کریں۔\n`;
    msg += `آپ رقم بذریعہ کیش، جاز کیش یا ایزی پیسہ پر بھی بھیج سکتے ہیں:\n`;
    msg += `📲 *JazzCash / EasyPaisa / Raast:* ${storeProfile.phone}\n`;
    msg += `📍 *دکان کا پتہ:* ${storeProfile.address}\n\n`;
    msg += `کسی بھی معلومات کے لیے ہم سے رابطہ فرمائیں۔ شکریہ! 🤝\n`;
    msg += `_Apna AI POS Khata Engine by Godigly_`;
    return msg;
  };

  const handleSendWhatsApp = (khata: CustomerKhata) => {
    const text = encodeURIComponent(generateWhatsAppReminder(khata));
    const cleanPhone = khata.phone.replace(/[^0-9]/g, '');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopyWhatsAppText = (khata: CustomerKhata) => {
    navigator.clipboard.writeText(generateWhatsAppReminder(khata));
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) return;

    const created = addKhataCustomer({
      name: custName.trim(),
      phone: custPhone.trim(),
      address: custAddress.trim() || undefined,
      creditLimit: custLimit || 50000,
    });

    setCustName('');
    setCustPhone('+92 3');
    setCustAddress('');
    setCustLimit(50000);
    setIsNewCustomerModal(false);
    setSelectedKhata(created);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentActiveKhata || txAmount <= 0) return;

    addKhataTransaction(currentActiveKhata.id, {
      type: txType,
      amount: txAmount,
      description: txDesc.trim() || (txType === 'give_credit' ? 'Udhar Diya (Material)' : 'Vasooli (Cash/Digital)'),
      invoiceNo: txInvoiceNo.trim() || undefined,
    });

    setTxAmount(0);
    setTxDesc('');
    setTxInvoiceNo('');
    setIsAddTxModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Udhar Khatta (Customer Credit Ledger)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
              WhatsApp Integrated
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track customer debts, send direct WhatsApp balance reminders in Urdu, and record vasooli (payments).
          </p>
        </div>

        <button
          onClick={() => setIsNewCustomerModal(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>+ Add Customer Khata</span>
        </button>
      </div>

      {/* Summary KPI Cards with Full Limit and Half Limit Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-rose-600">Total Udhar Receivable (مارکیٹ میں ادھار)</div>
          <div className="text-2xl font-black text-rose-600 font-mono-numbers mt-1">
            {storeProfile.currency} {totalUdharReceivable.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Owed by {totalCustomersWithBalance} customers
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-700">Total Khata Accounts</div>
          <div className="text-2xl font-black text-slate-900 font-mono-numbers mt-1">
            {khatas.length} Customers
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active credit accounts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="text-xs font-bold text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Full Limit Exceeded (100%+)</span>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono-numbers mt-1">
            {fullLimitCount} Customers
          </div>
          <div className="text-[11px] text-rose-700 font-medium mt-0.5">Urgent collection required</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="text-xs font-bold text-amber-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Half Limit Reached (50%+)</span>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono-numbers mt-1">
            {halfLimitCount} Customers
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">Approaching ceiling limit</div>
        </div>
      </div>

      {/* Main Dual Pane: Customer List (Left) & Ledger Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Customer Directory (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Customer Accounts
            </h3>
            <span className="text-[10px] text-slate-400">{filteredKhatas.length} Accounts</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer by name or phone..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Quick Filter Chips for Full/Half Limit */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
            <button
              onClick={() => setLimitFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                limitFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({khatas.length})
            </button>
            <button
              onClick={() => setLimitFilter('full')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                limitFilter === 'full'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Full Limit ({fullLimitCount})
            </button>
            <button
              onClick={() => setLimitFilter('half')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                limitFilter === 'half'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Half Limit ({halfLimitCount})
            </button>
            <button
              onClick={() => setLimitFilter('safe')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                limitFilter === 'safe'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Safe
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto pr-1">
            {filteredKhatas.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No customer khata found for selected filter.
              </div>
            ) : (
              filteredKhatas.map((khata) => {
                const isSelected = currentActiveKhata?.id === khata.id;
                const isFull = khata.currentBalance >= khata.creditLimit;
                const isHalf = khata.currentBalance >= khata.creditLimit * 0.5 && !isFull;
                const limitUsagePct = khata.creditLimit > 0 ? Math.min(100, Math.round((khata.currentBalance / khata.creditLimit) * 100)) : 0;

                return (
                  <div
                    key={khata.id}
                    onClick={() => setSelectedKhata(khata)}
                    className={`py-3 px-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-50/80 border border-emerald-500/40 shadow-2xs'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">{khata.name}</span>
                        {/* Full / Half Limit Highlights Badges */}
                        {isFull ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-rose-600 text-white font-extrabold uppercase shrink-0 animate-pulse">
                            Limit Full (100%)
                          </span>
                        ) : isHalf ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500 text-white font-bold shrink-0">
                            Half Limit (50%+)
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-semibold shrink-0">
                            Safe
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{khata.phone}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        Limit: {storeProfile.currency} {khata.creditLimit.toLocaleString()} ({limitUsagePct}% used)
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Balance</div>
                      <div
                        className={`font-black text-xs font-mono-numbers ${
                          khata.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {storeProfile.currency} {khata.currentBalance.toLocaleString()}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendWhatsApp(khata);
                        }}
                        className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold shadow-2xs"
                        title="Send WhatsApp payment reminder"
                      >
                        <MessageCircle className="w-2.5 h-2.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Customer Detailed Ledger (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          {currentActiveKhata ? (
            <div className="space-y-4">
              {/* Account Header with Limit Utilization Progress & Edit Limit button */}
              <div className="border-b border-slate-200 pb-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Customer Ledger Account</span>
                      {currentActiveKhata.currentBalance >= currentActiveKhata.creditLimit ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-black">
                          ⚠️ LIMIT EXCEEDED
                        </span>
                      ) : currentActiveKhata.currentBalance >= currentActiveKhata.creditLimit * 0.5 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                          ⚡ HALF LIMIT REACHED
                        </span>
                      ) : null}
                    </div>
                    <h3 className="font-extrabold text-lg text-slate-900">{currentActiveKhata.name}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{currentActiveKhata.phone}</span>
                      {currentActiveKhata.address && <span>• {currentActiveKhata.address}</span>}
                    </div>
                  </div>

                  <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                    <span className="text-xs text-slate-500">Current Balance Due</span>
                    <span className="text-2xl font-black text-rose-600 font-mono-numbers">
                      {storeProfile.currency} {currentActiveKhata.currentBalance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Credit Limit Status Bar & Change Limit Button */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-slate-600">
                        Limit: {storeProfile.currency} {currentActiveKhata.creditLimit.toLocaleString()}
                      </span>
                      <span className={currentActiveKhata.currentBalance >= currentActiveKhata.creditLimit ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {Math.round((currentActiveKhata.currentBalance / Math.max(1, currentActiveKhata.creditLimit)) * 100)}% utilized
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          currentActiveKhata.currentBalance >= currentActiveKhata.creditLimit
                            ? 'bg-rose-600'
                            : currentActiveKhata.currentBalance >= currentActiveKhata.creditLimit * 0.5
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((currentActiveKhata.currentBalance / Math.max(1, currentActiveKhata.creditLimit)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setNewLimitValue(currentActiveKhata.creditLimit);
                      setIsEditLimitModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold shrink-0 self-end sm:self-center"
                  >
                    Set Credit Limit
                  </button>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setTxType('give_credit');
                      setIsAddTxModal(true);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+ ادھار دیا (Give Credit)</span>
                  </button>

                  <button
                    onClick={() => {
                      setTxType('receive_payment');
                      setIsAddTxModal(true);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>+ وصولی کی (Vasooli)</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSendWhatsApp(currentActiveKhata)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Send Reminder</span>
                  </button>

                  <button
                    onClick={() => handleCopyWhatsAppText(currentActiveKhata)}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700"
                    title="Copy reminder text"
                  >
                    {copiedMsg ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>

              {/* Ledger Entries Table */}
              <div>
                <h4 className="font-bold text-xs text-slate-800 mb-2 flex items-center justify-between">
                  <span>Khata Transaction Entries</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {currentActiveKhata.transactions.length} entries recorded
                  </span>
                </h4>

                <div className="overflow-x-auto max-h-[360px] border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Description & Invoice</th>
                        <th className="p-2.5 text-right text-rose-600">ادھار دیا (Debit)</th>
                        <th className="p-2.5 text-right text-emerald-700">وصولی (Credit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono-numbers">
                      {currentActiveKhata.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 font-sans">
                            No transactions recorded yet for this customer.
                          </td>
                        </tr>
                      ) : (
                        currentActiveKhata.transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="p-2.5 text-slate-500 font-mono">{tx.date}</td>
                            <td className="p-2.5 font-sans">
                              <div className="font-semibold text-slate-900">{tx.description}</div>
                              {tx.invoiceNo && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Ref: {tx.invoiceNo} {tx.paymentMethod && `• ${tx.paymentMethod}`}
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-bold text-rose-600">
                              {tx.type === 'give_credit' ? `${storeProfile.currency} ${tx.amount.toLocaleString()}` : '—'}
                            </td>
                            <td className="p-2.5 text-right font-bold text-emerald-700">
                              {tx.type === 'receive_payment' ? `${storeProfile.currency} ${tx.amount.toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-700">No Customer Selected</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an account from the left directory to view full credit ledger entries, record payments, and send WhatsApp reminders.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add New Customer Khata */}
      {isNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Add New Customer Khata Account</h3>
              <button onClick={() => setIsNewCustomerModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Contractor Name *</label>
                <input
                  type="text"
                  required
                  value={custName ?? ''}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Tariq Electrician"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={custPhone ?? ''}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Site / Home Address</label>
                <input
                  type="text"
                  value={custAddress ?? ''}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="e.g. Sector C, Bahria Town"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Limit ({storeProfile.currency})</label>
                <input
                  type="number"
                  value={custLimit || ''}
                  onChange={(e) => setCustLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono-numbers border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Create Khata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Khata Transaction (Debit / Credit) */}
      {isAddTxModal && currentActiveKhata && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className={`p-4 text-white flex items-center justify-between ${
              txType === 'give_credit' ? 'bg-rose-700' : 'bg-emerald-700'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  {txType === 'give_credit' ? 'نئے ادھار کا اندراج' : 'وصولی کا اندراج'}
                </span>
                <h3 className="font-bold text-sm">
                  {txType === 'give_credit' ? 'Give Credit (Udhar Diya)' : 'Receive Payment (Vasooli)'}
                </h3>
              </div>
              <button onClick={() => setIsAddTxModal(false)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount in {storeProfile.currency} *
                </label>
                <input
                  type="number"
                  required
                  value={txAmount || ''}
                  onChange={(e) => setTxAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-xl font-bold font-mono-numbers px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Item Details
                </label>
                <input
                  type="text"
                  value={txDesc ?? ''}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder={txType === 'give_credit' ? 'e.g. 2 Coils wire + 4 Breakers' : 'e.g. Cash received at counter or JazzCash'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bill / Invoice # (Optional)
                </label>
                <input
                  type="text"
                  value={txInvoiceNo ?? ''}
                  onChange={(e) => setTxInvoiceNo(e.target.value)}
                  placeholder="e.g. POS-2026-104"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddTxModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold ${
                    txType === 'give_credit' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Customer Credit Limit */}
      {isEditLimitModal && currentActiveKhata && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">Udhar Ceiling Adjustment</span>
                <h3 className="font-bold text-sm">Set Credit Limit for {currentActiveKhata.name}</h3>
              </div>
              <button onClick={() => setIsEditLimitModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateKhataCustomer(currentActiveKhata.id, {
                  creditLimit: Number(newLimitValue) || 10000,
                });
                setIsEditLimitModal(false);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Credit Limit ({storeProfile.currency}) *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  value={newLimitValue || ''}
                  onChange={(e) => setNewLimitValue(Number(e.target.value))}
                  className="w-full text-xl font-bold font-mono-numbers px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Alerts will trigger automatically when this customer crosses 50% (Half Limit) and 100% (Full Limit).
                </p>
              </div>

              <div className="flex gap-2">
                {[25000, 50000, 100000, 200000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNewLimitValue(preset)}
                    className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                  >
                    {(preset / 1000).toLocaleString()}k
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditLimitModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Save New Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
