import React, { useState, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import { PaymentMethod, CustomerKhata } from '../../types';
import {
  Banknote,
  Smartphone,
  CreditCard,
  Building,
  CheckCircle2,
  X,
  QrCode,
  ArrowRight,
  UserCheck,
  Percent,
  BookOpen,
  AlertTriangle,
  ShieldAlert,
  Ban,
  Search,
  ZoomIn,
} from 'lucide-react';

interface PaymentModalProps {
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose }) => {
  const {
    cartGrandTotal,
    storeProfile,
    completeSale,
    paymentGateways,
    khatas,
    systemLimits,
    userSession,
  } = usePos();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isZoomingQr, setIsZoomingQr] = useState(false);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('+92 3');
  const [tenderedAmount, setTenderedAmount] = useState<number>(cartGrandTotal);
  const [notes, setNotes] = useState('');

  // Selected Udhar Khatta customer and search
  const [selectedKhataId, setSelectedKhataId] = useState<string>(khatas[0]?.id || '');
  const [khataSearchQuery, setKhataSearchQuery] = useState('');

  // Split payment state
  const [splitCash, setSplitCash] = useState<number>(Math.floor(cartGrandTotal / 2));
  const [splitDigitalMethod, setSplitDigitalMethod] = useState<'jazzcash' | 'easypaisa' | 'card'>('jazzcash');

  useEffect(() => {
    if (tenderedAmount < cartGrandTotal) {
      setTenderedAmount(cartGrandTotal);
    }
  }, [cartGrandTotal]);

  const changeDue = Math.max(0, tenderedAmount - cartGrandTotal);
  const splitDigital = Math.max(0, cartGrandTotal - splitCash);

  const addCash = (amount: number) => {
    setTenderedAmount((prev) => (prev || 0) + amount);
  };

  const selectedCustomer = khatas.find((k) => k.id === selectedKhataId);
  const newBalanceWithBill = selectedCustomer ? selectedCustomer.currentBalance + cartGrandTotal : cartGrandTotal;
  const isLimitFull = selectedCustomer ? newBalanceWithBill >= selectedCustomer.creditLimit : false;
  const isHalfLimit = selectedCustomer ? newBalanceWithBill >= selectedCustomer.creditLimit * 0.5 && !isLimitFull : false;

  const isBlockedByLimitStop =
    paymentMethod === 'udhar' &&
    isLimitFull &&
    Boolean(systemLimits.enforceHardUdharLimitStop);

  const filteredKhatas = khatas.filter(
    (k) =>
      k.name.toLowerCase().includes(khataSearchQuery.toLowerCase()) ||
      k.phone.includes(khataSearchQuery)
  );

  const handleCheckout = () => {
    if (paymentMethod === 'cash' && tenderedAmount < cartGrandTotal) {
      alert(`Tendered amount (Rs. ${tenderedAmount}) is less than Total (Rs. ${cartGrandTotal})`);
      return;
    }

    if (paymentMethod === 'udhar' && !selectedKhataId) {
      alert('Please select an Udhar Khatta customer account.');
      return;
    }

    if (isBlockedByLimitStop) {
      alert(
        `🚫 LIMIT FULL STOP ENFORCED: ${selectedCustomer?.name} has exceeded their allowable credit ceiling of Rs. ${selectedCustomer?.creditLimit.toLocaleString()}. Payment on credit cannot be completed until outstanding dues are recovered.`
      );
      return;
    }

    completeSale({
      customerName:
        paymentMethod === 'udhar' && selectedCustomer
          ? selectedCustomer.name
          : customerName.trim() || 'Walk-in Customer',
      customerPhone:
        paymentMethod === 'udhar' && selectedCustomer
          ? selectedCustomer.phone
          : customerPhone.trim().length > 5
          ? customerPhone.trim()
          : undefined,
      paymentMethod,
      tenderedCash: paymentMethod === 'cash' ? tenderedAmount : paymentMethod === 'split' ? splitCash : undefined,
      changeDue: paymentMethod === 'cash' ? changeDue : undefined,
      splitDetails:
        paymentMethod === 'split'
          ? {
              cash: splitCash,
              digital: splitDigital,
              digitalMethod: splitDigitalMethod,
            }
          : undefined,
      notes: notes.trim() || undefined,
      udharKhataId: paymentMethod === 'udhar' ? selectedKhataId : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Settlement & Payment
            </span>
            <h2 className="text-xl font-bold">Collect Payment & Finish Sale</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto custom-scrollbar">
          {/* Amount Due Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 text-white flex items-center justify-between shadow-inner">
            <div>
              <div className="text-xs text-slate-400">Total Payable Amount</div>
              <div className="text-3xl font-extrabold font-mono-numbers text-emerald-400 tracking-tight">
                {storeProfile.currency} {cartGrandTotal.toLocaleString()}
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>Store: <strong className="text-white">{storeProfile.name.split(' ')[0]}</strong></div>
              <div>Cur: <strong className="text-emerald-400">{storeProfile.currency}</strong></div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Payment Gateway / Method:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span className="text-[11px] font-bold">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('udhar')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                  paymentMethod === 'udhar'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span className="text-[11px] font-bold">Udhar Khatta</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('jazzcash')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                  paymentMethod === 'jazzcash'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Smartphone className="w-5 h-5 text-red-600" />
                <span className="text-[11px] font-bold">JazzCash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('easypaisa')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                  paymentMethod === 'easypaisa'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span className="text-[11px] font-bold">EasyPaisa</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-[11px] font-bold">Card POS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('split')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                  paymentMethod === 'split'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Percent className="w-5 h-5 text-purple-600" />
                <span className="text-[11px] font-bold">Split Pay</span>
              </button>
            </div>
          </div>

          {/* UDHAR KHATTA PAYMENT SELECTION WITH CLIENT DETAILS & LIMIT FULL STOP */}
          {paymentMethod === 'udhar' && (
            <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Select Udhar Customer Account:
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Shows Name, Balance & Limit</span>
              </div>

              {/* Customer Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={khataSearchQuery ?? ''}
                  onChange={(e) => setKhataSearchQuery(e.target.value)}
                  placeholder="Search customer name or mobile number..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-xl dark:text-white focus:outline-hidden"
                />
              </div>

              {/* Interactive Client List with Name, Balance, Limit */}
              <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                {filteredKhatas.map((khata) => {
                  const isSelected = khata.id === selectedKhataId;
                  const isOver = khata.creditLimit > 0 && khata.currentBalance >= khata.creditLimit;
                  const isHalf = khata.creditLimit > 0 && khata.currentBalance >= khata.creditLimit * 0.5 && !isOver;

                  return (
                    <div
                      key={khata.id}
                      onClick={() => setSelectedKhataId(khata.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-white dark:bg-slate-800 shadow-xs ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/60 hover:bg-white'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{khata.name}</span>
                          {isOver ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700">100% Full</span>
                          ) : isHalf ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-700">50%+ Half</span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-700">Safe</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{khata.phone}</div>
                      </div>

                      <div className="text-right text-[11px] font-mono-numbers">
                        <div className="font-bold text-slate-900 dark:text-white">
                          Bal: {storeProfile.currency} {khata.currentBalance.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Limit: {storeProfile.currency} {khata.creditLimit.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedCustomer && (
                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-700 space-y-2 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center pb-2 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400">Current Balance</span>
                      <div className="font-bold font-mono-numbers text-slate-900 dark:text-white mt-0.5">
                        {storeProfile.currency} {selectedCustomer.currentBalance.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Approved Limit</span>
                      <div className="font-bold font-mono-numbers text-slate-900 dark:text-white mt-0.5">
                        {storeProfile.currency} {selectedCustomer.creditLimit.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Available Credit</span>
                      <div className="font-bold font-mono-numbers text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {storeProfile.currency}{' '}
                        {Math.max(0, selectedCustomer.creditLimit - selectedCustomer.currentBalance).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 font-bold">
                    <span className="text-slate-800 dark:text-slate-200">New Balance after This Bill:</span>
                    <span className="font-mono-numbers font-black text-indigo-600 dark:text-indigo-400 text-sm">
                      {storeProfile.currency} {newBalanceWithBill.toLocaleString()}
                    </span>
                  </div>

                  {/* Limit Full Stop Banner */}
                  {isBlockedByLimitStop ? (
                    <div className="p-3 rounded-xl bg-rose-600 text-white space-y-1 shadow-md shadow-rose-600/30">
                      <div className="flex items-center space-x-1.5 font-black text-xs uppercase tracking-wider">
                        <Ban className="w-4 h-4 text-white shrink-0" />
                        <span>🚫 LIMIT FULL STOP ENFORCED: Credit Blocked</span>
                      </div>
                      <p className="text-[11px] text-rose-100 leading-snug">
                        Customer will exceed credit limit of {storeProfile.currency} {selectedCustomer.creditLimit.toLocaleString()} by {storeProfile.currency} {(newBalanceWithBill - selectedCustomer.creditLimit).toLocaleString()}.
                        Checkout on credit is strictly blocked by system policy.
                      </p>
                    </div>
                  ) : isLimitFull ? (
                    <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1.5 border border-rose-300">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>⚠️ Warning: Bill exceeds 100% of approved credit limit!</span>
                    </div>
                  ) : isHalfLimit ? (
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1.5 border border-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>⚡ Half Limit Reached: Customer is utilizing over 50% of permitted credit.</span>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>✓ Safe Credit Buffer: Available limit remaining.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cash Payment */}
          {paymentMethod === 'cash' && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-white">Cash Received</label>
                <span className="text-xs font-semibold text-emerald-600">Quick Rupee Notes</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-bold text-sm">{storeProfile.currency}</span>
                <input
                  type="number"
                  value={tenderedAmount || ''}
                  onChange={(e) => setTenderedAmount(Number(e.target.value))}
                  className="w-full text-xl font-bold font-mono-numbers px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setTenderedAmount(cartGrandTotal)}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs"
                >
                  Exact ({cartGrandTotal.toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => addCash(100)}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => addCash(500)}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => addCash(1000)}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs"
                >
                  +1,000
                </button>
                <button
                  type="button"
                  onClick={() => addCash(5000)}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs"
                >
                  +5,000
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Change to Return:</span>
                <span
                  className={`text-lg font-bold font-mono-numbers ${
                    tenderedAmount < cartGrandTotal ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {tenderedAmount < cartGrandTotal
                    ? `Short by ${storeProfile.currency} ${(cartGrandTotal - tenderedAmount).toLocaleString()}`
                    : `${storeProfile.currency} ${changeDue.toLocaleString()}`}
                </span>
              </div>
            </div>
          )}

          {/* JAZZCASH / EASYPAISA WITH EDITABLE / UPLOADED QR CODE */}
          {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && (() => {
            const uploadedQr =
              paymentMethod === 'jazzcash'
                ? (paymentGateways.jazzcash.qrCodeUrl || (userSession.paymentQrType === 'jazzcash' ? userSession.paymentQrUrl : null) || storeProfile.paymentQrUrl)
                : (paymentGateways.easypaisa.qrCodeUrl || (userSession.paymentQrType === 'easypaisa' ? userSession.paymentQrUrl : null) || storeProfile.paymentQrUrl);
            const displayQr = uploadedQr || (paymentMethod === 'jazzcash' ? paymentGateways.jazzcash.qrUrl : paymentGateways.easypaisa.qrUrl);

            return (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                <div className="flex items-center space-x-4">
                  {/* QR Code display with click to zoom */}
                  <div
                    onClick={() => setIsZoomingQr(true)}
                    className="relative group cursor-pointer w-24 h-24 bg-white p-1 rounded-xl border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-xs hover:ring-2 hover:ring-indigo-500 transition-all"
                  >
                    <img
                      src={displayQr}
                      alt="Payment QR"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <span className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <ZoomIn className="w-5 h-5" />
                    </span>
                  </div>

                  <div className="space-y-1 text-xs flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {paymentMethod === 'jazzcash' ? 'JazzCash Merchant QR Pay' : 'EasyPaisa Merchant QR Pay'}
                      </span>
                      {uploadedQr && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Uploaded QR
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 truncate">
                      Till ID: <strong className="font-mono text-slate-900 dark:text-white">
                        {paymentMethod === 'jazzcash' ? paymentGateways.jazzcash.tillId : paymentGateways.easypaisa.tillId}
                      </strong>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 truncate">
                      Account: <strong className="text-slate-900 dark:text-white">
                        {paymentMethod === 'jazzcash'
                          ? (userSession.paymentQrTitle || paymentGateways.jazzcash.accountTitle)
                          : (userSession.paymentQrTitle || paymentGateways.easypaisa.accountTitle)}
                      </strong>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 truncate">
                      Phone / Till: <strong className="font-mono text-slate-900 dark:text-white">
                        {paymentMethod === 'jazzcash' ? paymentGateways.jazzcash.phone : paymentGateways.easypaisa.phone}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Customer can scan QR directly to pay.</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsZoomingQr(true)}
                    className="font-bold underline text-emerald-700 hover:text-emerald-900 cursor-pointer ml-2 shrink-0 flex items-center gap-1"
                  >
                    <ZoomIn className="w-3.5 h-3.5" /> Fullscreen QR
                  </button>
                </div>
              </div>
            );
          })()}

          {/* CARD PAYMENT */}
          {paymentMethod === 'card' && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in text-xs">
              <div className="font-bold text-slate-900 dark:text-white">POS Card Reader Machine Ready</div>
              <p className="text-slate-500">Tap, swipe or insert card on physical terminal.</p>
              <div className="font-mono text-emerald-600 font-bold">{paymentGateways.card.terminalId}</div>
            </div>
          )}

          {/* SPLIT PAYMENT */}
          {paymentMethod === 'split' && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
              <div className="text-xs font-bold text-slate-800 dark:text-white">Split Payment Setup</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Cash Amount</label>
                  <input
                    type="number"
                    value={splitCash ?? 0}
                    onChange={(e) => setSplitCash(Number(e.target.value))}
                    className="w-full text-sm font-bold font-mono-numbers px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg mt-1 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Digital Remainder</label>
                  <div className="w-full text-sm font-bold font-mono-numbers px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg mt-1 text-emerald-600 dark:text-emerald-400">
                    {storeProfile.currency} {splitDigital.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer info for non-udhar payments */}
          {paymentMethod !== 'udhar' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName ?? ''}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile (WhatsApp Bill)
                </label>
                <input
                  type="text"
                  value={customerPhone ?? ''}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white font-mono"
                />
              </div>
            </div>
          )}

          {/* Optional notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Bill Reference / Notes
            </label>
            <input
              type="text"
              value={notes ?? ''}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivered to site / Contractor discount"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={
              (paymentMethod === 'cash' && tenderedAmount < cartGrandTotal) ||
              isBlockedByLimitStop
            }
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all ${
              isBlockedByLimitStop
                ? 'bg-rose-600/80 cursor-not-allowed opacity-90'
                : paymentMethod === 'udhar'
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-700/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/20'
            }`}
          >
            <span>
              {isBlockedByLimitStop
                ? '🚫 LIMIT FULL STOP: Credit Blocked'
                : paymentMethod === 'udhar'
                ? 'Confirm Udhar Sale'
                : 'Complete Sale & Issue Bill'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Enlarge / Zoom QR Code Fullscreen Modal */}
      {isZoomingQr && (
        <div
          className="fixed inset-0 z-70 bg-black/85 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsZoomingQr(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                {paymentMethod === 'jazzcash' ? 'JazzCash Counter QR' : 'EasyPaisa Counter QR'}
              </span>
              <button
                type="button"
                onClick={() => setIsZoomingQr(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-center">
              <img
                src={
                  paymentMethod === 'jazzcash'
                    ? (paymentGateways.jazzcash.qrCodeUrl || (userSession.paymentQrType === 'jazzcash' ? userSession.paymentQrUrl : null) || storeProfile.paymentQrUrl || paymentGateways.jazzcash.qrUrl)
                    : (paymentGateways.easypaisa.qrCodeUrl || (userSession.paymentQrType === 'easypaisa' ? userSession.paymentQrUrl : null) || storeProfile.paymentQrUrl || paymentGateways.easypaisa.qrUrl)
                }
                alt="Enlarged Payment QR"
                className="w-64 h-64 object-contain rounded-xl shadow-xs bg-white p-2"
              />
            </div>

            <div className="space-y-1">
              <div className="text-base font-bold text-slate-900">
                {paymentMethod === 'jazzcash'
                  ? (userSession.paymentQrTitle || paymentGateways.jazzcash.accountTitle || storeProfile.name)
                  : (userSession.paymentQrTitle || paymentGateways.easypaisa.accountTitle || storeProfile.name)}
              </div>
              <div className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 py-1 px-3 rounded-full inline-block">
                Till: {paymentMethod === 'jazzcash' ? paymentGateways.jazzcash.tillId : paymentGateways.easypaisa.tillId}
              </div>
              <p className="text-[11px] text-slate-500">
                Hold customer mobile camera to scan and confirm payment of {storeProfile.currency} {cartGrandTotal.toLocaleString()}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsZoomingQr(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
