import React, { useState, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import { PaymentMethod } from '../../types';
import {
  Banknote,
  Smartphone,
  CreditCard,
  Building,
  CheckCircle2,
  X,
  ArrowRight,
  Percent,
  BookOpen,
  AlertTriangle,
  Ban,
  Search,
  Printer,
  FileText,
} from 'lucide-react';

interface PaymentModalProps {
  onClose: () => void;
}

type ModalTab = 'cash' | 'card' | 'bank_transfer' | 'wallet' | 'split' | 'udhar';

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose }) => {
  const {
    cartGrandTotal,
    cartSubtotal,
    cartDiscount,
    cartTaxAmount,
    storeProfile,
    completeSale,
    paymentGateways,
    khatas,
    systemLimits,
    selectedPosCustomer,
  } = usePos();

  const [selectedTab, setSelectedTab] = useState<ModalTab>('cash');
  const [walletProvider, setWalletProvider] = useState<'jazzcash' | 'easypaisa'>('jazzcash');
  const [customerName, setCustomerName] = useState(selectedPosCustomer?.name || 'Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState(selectedPosCustomer?.phone || '');
  const [tenderedAmount, setTenderedAmount] = useState<number>(cartGrandTotal);
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  // Receipt & Digital Invoice preference
  const [receiptOutput, setReceiptOutput] = useState<'print' | 'digital' | 'both'>('both');

  // Inline validation error (never use window.alert)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Udhar Khatta search & selection
  const [selectedKhataId, setSelectedKhataId] = useState<string>(khatas[0]?.id || '');
  const [khataSearchQuery, setKhataSearchQuery] = useState('');

  // Split payment state
  const [splitCash, setSplitCash] = useState<number>(Math.floor(cartGrandTotal / 2));
  const [splitDigitalMethod, setSplitDigitalMethod] = useState<'card' | 'bank_transfer' | 'jazzcash' | 'easypaisa'>('card');

  useEffect(() => {
    setTenderedAmount(cartGrandTotal);
    setSplitCash(Math.floor(cartGrandTotal / 2));
  }, [cartGrandTotal]);

  const changeDue = Math.max(0, tenderedAmount - cartGrandTotal);
  const splitDigital = Math.max(0, cartGrandTotal - splitCash);

  const selectedKhataCustomer = khatas.find((k) => k.id === selectedKhataId);
  const newBalanceWithBill = selectedKhataCustomer
    ? selectedKhataCustomer.currentBalance + cartGrandTotal
    : cartGrandTotal;
  const isLimitFull = selectedKhataCustomer
    ? selectedKhataCustomer.creditLimit > 0 && newBalanceWithBill >= selectedKhataCustomer.creditLimit
    : false;
  const isBlockedByLimitStop =
    selectedTab === 'udhar' && isLimitFull && Boolean(systemLimits.enforceHardUdharLimitStop);

  const filteredKhatas = khatas.filter(
    (k) =>
      k.name.toLowerCase().includes(khataSearchQuery.toLowerCase()) ||
      k.phone.includes(khataSearchQuery)
  );

  const resolvedPaymentMethod: PaymentMethod =
    selectedTab === 'wallet' ? walletProvider : selectedTab;

  const handleCheckout = () => {
    setErrorMsg(null);

    if (selectedTab === 'cash' && tenderedAmount < cartGrandTotal) {
      setErrorMsg(
        `Cash received (${storeProfile.currency} ${tenderedAmount.toLocaleString()}) is less than the grand total (${storeProfile.currency} ${cartGrandTotal.toLocaleString()}).`
      );
      return;
    }

    if (selectedTab === 'udhar' && !selectedKhataId) {
      setErrorMsg('Please select a customer credit account to record this Udhar sale.');
      return;
    }

    if (isBlockedByLimitStop) {
      setErrorMsg(
        `Credit limit reached for ${selectedKhataCustomer?.name} (${storeProfile.currency} ${selectedKhataCustomer?.creditLimit.toLocaleString()}). Recover balance before issuing more credit.`
      );
      return;
    }

    const combinedNotes = [
      referenceNo.trim() ? `Ref: ${referenceNo.trim()}` : '',
      receiptOutput === 'digital'
        ? 'Digital Invoice Issued'
        : receiptOutput === 'both'
        ? 'Receipt & Digital Invoice'
        : 'Thermal Receipt',
      notes.trim(),
    ]
      .filter(Boolean)
      .join(' · ');

    try {
      completeSale({
        customerName:
          selectedTab === 'udhar' && selectedKhataCustomer
            ? selectedKhataCustomer.name
            : customerName.trim() || 'Walk-in Guest',
        customerPhone:
          selectedTab === 'udhar' && selectedKhataCustomer
            ? selectedKhataCustomer.phone
            : customerPhone.trim().length > 4
            ? customerPhone.trim()
            : undefined,
        paymentMethod: resolvedPaymentMethod,
        tenderedCash:
          selectedTab === 'cash'
            ? tenderedAmount
            : selectedTab === 'split'
            ? splitCash
            : undefined,
        changeDue: selectedTab === 'cash' ? changeDue : undefined,
        splitDetails:
          selectedTab === 'split'
            ? {
                cash: splitCash,
                digital: splitDigital,
                digitalMethod: splitDigitalMethod,
              }
            : undefined,
        notes: combinedNotes || undefined,
        udharKhataId: selectedTab === 'udhar' ? selectedKhataId : undefined,
        openReceipt: true,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to complete checkout.');
    }
  };

  const paymentOptions: { id: ModalTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Credit / Debit', icon: CreditCard },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: Building },
    { id: 'wallet', label: 'Digital Wallet', icon: Smartphone },
    { id: 'split', label: 'Split Pay', icon: Percent },
    { id: 'udhar', label: 'Store Credit', icon: BookOpen },
  ];

  const quickDenominations = [500, 1000, 5000, 10000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#1A1816] rounded-3xl max-w-2xl w-full shadow-2xl border border-[#E8E0D8] dark:border-[#2E2A26] overflow-hidden my-6">
        {/* Luxury Header */}
        <div className="bg-[#FAF7F4] dark:bg-[#141210] border-b border-[#E8E0D8] dark:border-[#2A2622] px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-[#7D6E65] dark:text-[#A89E96] uppercase tracking-[0.2em]">
              Boutique Checkout
            </span>
            <h2 className="font-editorial text-xl font-semibold text-[#141414] dark:text-[#F6F1EB]">
              Complete Payment &amp; Issue Receipt
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#EFE8E0] dark:hover:bg-[#24201C] text-[#6B625C] dark:text-[#A89E96] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto custom-scrollbar">
          {/* Amount Summary Banner */}
          <div className="rounded-2xl bg-[#141414] dark:bg-[#221F1C] text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#C9BFB6]">
                Total Payable
              </div>
              <div className="text-3xl font-bold font-mono-numbers tracking-tight mt-0.5 text-[#F6F1EB]">
                {storeProfile.currency} {cartGrandTotal.toLocaleString()}
              </div>
            </div>
            <div className="text-left sm:text-right text-[11px] text-[#C9BFB6] space-y-0.5 font-mono-numbers">
              <div>Subtotal: {storeProfile.currency} {cartSubtotal.toLocaleString()}</div>
              {cartDiscount > 0 && (
                <div className="text-[#F3E1DF]">
                  Savings: − {storeProfile.currency} {cartDiscount.toLocaleString()}
                </div>
              )}
              <div>Tax: {storeProfile.currency} {cartTaxAmount.toLocaleString()}</div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#F3E1DF] dark:bg-[#3A2121] border border-[#E5C6C3] dark:border-[#633634] text-[#8A2626] dark:text-[#FCA5A5] text-xs font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Payment Methods Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#141414] dark:text-[#F6F1EB]">
              Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {paymentOptions.map((opt) => {
                const Icon = opt.icon;
                const active = selectedTab === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedTab(opt.id);
                      setErrorMsg(null);
                    }}
                    className={`px-3 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] border-[#141414] dark:border-[#F6F1EB]'
                        : 'bg-[#FAF7F4] dark:bg-[#141210] text-[#4A433E] dark:text-[#C9BFB6] border-[#E8E0D8] dark:border-[#2E2A26] hover:bg-[#F6F1EB] dark:hover:bg-[#221F1C]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CASH TENDERED SECTION */}
          {selectedTab === 'cash' && (
            <div className="rounded-2xl bg-[#FAF7F4] dark:bg-[#141210] border border-[#E8E0D8] dark:border-[#2E2A26] p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                    Cash Received ({storeProfile.currency})
                  </label>
                  <input
                    type="number"
                    value={tenderedAmount || ''}
                    onChange={(e) => setTenderedAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] text-base font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]"
                  />
                </div>
                <div className="flex flex-col justify-between p-3 rounded-xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26]">
                  <span className="text-[11px] text-[#7D6E65] dark:text-[#A89E96]">Change Due</span>
                  <span className="text-lg font-mono-numbers font-bold text-[#2F6B4F] dark:text-[#6EE7B7]">
                    {storeProfile.currency} {changeDue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTenderedAmount(cartGrandTotal)}
                  className="px-2.5 py-1 rounded-lg bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] text-[11px] font-semibold cursor-pointer"
                >
                  Exact Amount
                </button>
                {quickDenominations.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTenderedAmount((prev) => (prev || 0) + amt)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1F1C19] border border-[#E8E0D8] dark:border-[#2E2A26] text-xs font-mono-numbers font-semibold text-[#141414] dark:text-[#F6F1EB] hover:bg-[#F3E1DF]/50 cursor-pointer"
                  >
                    +{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CREDIT / DEBIT CARD SECTION */}
          {selectedTab === 'card' && (
            <div className="rounded-2xl bg-[#FAF7F4] dark:bg-[#141210] border border-[#E8E0D8] dark:border-[#2E2A26] p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#141414] dark:text-[#F6F1EB]">
                  POS Card Terminal ({paymentGateways.card.terminalId || 'Counter Terminal'})
                </span>
                <span className="text-[#2F6B4F] dark:text-[#6EE7B7] font-semibold">Visa · Mastercard · UnionPay</span>
              </div>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Approval / Auth Code or Last 4 Digits (Optional)"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] font-mono-numbers"
              />
            </div>
          )}

          {/* BANK TRANSFER SECTION */}
          {selectedTab === 'bank_transfer' && (
            <div className="rounded-2xl bg-[#FAF7F4] dark:bg-[#141210] border border-[#E8E0D8] dark:border-[#2E2A26] p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-[#141414] dark:text-[#F6F1EB]">
                  {paymentGateways.bank.bankName || 'Boutique Business Account'}
                </div>
                <div className="text-[#6B625C] dark:text-[#A89E96]">
                  Title: <strong>{paymentGateways.bank.accountTitle || storeProfile.name}</strong>
                </div>
                {paymentGateways.bank.iban && (
                  <div className="font-mono-numbers text-[11px] text-[#4A433E] dark:text-[#C9BFB6]">
                    IBAN: {paymentGateways.bank.iban}
                  </div>
                )}
                {paymentGateways.bank.raastId && (
                  <div className="font-mono-numbers text-[11px] text-[#4A433E] dark:text-[#C9BFB6]">
                    Raast ID: {paymentGateways.bank.raastId}
                  </div>
                )}
              </div>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Transfer Reference / UTR Number (Optional)"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] font-mono-numbers"
              />
            </div>
          )}

          {/* DIGITAL WALLET SECTION */}
          {selectedTab === 'wallet' && (
            <div className="rounded-2xl bg-[#FAF7F4] dark:bg-[#141210] border border-[#E8E0D8] dark:border-[#2E2A26] p-4 space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWalletProvider('jazzcash')}
                  className={`flex-1 py-2 rounded-xl border font-semibold cursor-pointer ${
                    walletProvider === 'jazzcash'
                      ? 'bg-[#141414] text-white border-[#141414] dark:bg-[#F6F1EB] dark:text-[#141414]'
                      : 'bg-white dark:bg-[#1A1816] border-[#E8E0D8] dark:border-[#2E2A26]'
                  }`}
                >
                  JazzCash
                </button>
                <button
                  type="button"
                  onClick={() => setWalletProvider('easypaisa')}
                  className={`flex-1 py-2 rounded-xl border font-semibold cursor-pointer ${
                    walletProvider === 'easypaisa'
                      ? 'bg-[#141414] text-white border-[#141414] dark:bg-[#F6F1EB] dark:text-[#141414]'
                      : 'bg-white dark:bg-[#1A1816] border-[#E8E0D8] dark:border-[#2E2A26]'
                  }`}
                >
                  EasyPaisa
                </button>
              </div>
              <div className="text-[11px] text-[#6B625C] dark:text-[#A89E96] font-mono-numbers">
                {walletProvider === 'jazzcash'
                  ? `Account: ${paymentGateways.jazzcash.accountTitle} · ${paymentGateways.jazzcash.phone}`
                  : `Account: ${paymentGateways.easypaisa.accountTitle} · ${paymentGateways.easypaisa.phone}`}
              </div>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Wallet Transaction ID (TID)"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] font-mono-numbers"
              />
            </div>
          )}

          {/* SPLIT PAYMENT SECTION */}
          {selectedTab === 'split' && (
            <div className="rounded-2xl bg-[#FAF7F4] dark:bg-[#141210] border border-[#E8E0D8] dark:border-[#2E2A26] p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                    Cash Portion ({storeProfile.currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={cartGrandTotal}
                    value={splitCash}
                    onChange={(e) => setSplitCash(Math.min(cartGrandTotal, Math.max(0, Number(e.target.value))))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] font-mono-numbers font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                    Remaining Digital ({storeProfile.currency})
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-[#F3E1DF]/55 dark:bg-[#342322] font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]">
                    {storeProfile.currency} {splitDigital.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['card', 'bank_transfer', 'jazzcash', 'easypaisa'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSplitDigitalMethod(m)}
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold capitalize cursor-pointer ${
                      splitDigitalMethod === m
                        ? 'bg-[#141414] text-white border-[#141414] dark:bg-[#F6F1EB] dark:text-[#141414]'
                        : 'bg-white dark:bg-[#1A1816] border-[#E8E0D8] dark:border-[#2E2A26]'
                    }`}
                  >
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* UDHAR / STORE CREDIT SECTION */}
          {selectedTab === 'udhar' && (
            <div className="rounded-2xl bg-[#FAF7F4] dark:bg-[#141210] border border-[#E8E0D8] dark:border-[#2E2A26] p-4 space-y-3 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8A7E75] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={khataSearchQuery}
                  onChange={(e) => setKhataSearchQuery(e.target.value)}
                  placeholder="Search credit client by name or phone..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26]"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar">
                {filteredKhatas.length === 0 ? (
                  <div className="text-center text-[#7D6E65] py-3">
                    No credit accounts found. Create one under Store Tools → Udhar Khatta.
                  </div>
                ) : (
                  filteredKhatas.map((khata) => {
                    const selected = khata.id === selectedKhataId;
                    return (
                      <button
                        key={khata.id}
                        type="button"
                        onClick={() => setSelectedKhataId(khata.id)}
                        className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                          selected
                            ? 'bg-white dark:bg-[#1F1C19] border-[#141414] dark:border-[#F6F1EB]'
                            : 'bg-white/60 dark:bg-[#1A1816] border-[#E8E0D8] dark:border-[#2E2A26]'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-[#141414] dark:text-[#F6F1EB]">{khata.name}</div>
                          <div className="text-[10px] text-[#7D6E65] font-mono-numbers">{khata.phone}</div>
                        </div>
                        <div className="text-right font-mono-numbers">
                          <div className="font-bold text-[#141414] dark:text-[#F6F1EB]">
                            {storeProfile.currency} {khata.currentBalance.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-[#7D6E65]">
                            Limit {khata.creditLimit.toLocaleString()}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {isBlockedByLimitStop && (
                <div className="p-3 rounded-xl bg-[#9B2C2C] text-white flex items-center gap-2 text-xs font-semibold">
                  <Ban className="w-4 h-4 shrink-0" />
                  <span>Hard Credit Limit Stop active for this customer account.</span>
                </div>
              )}
            </div>
          )}

          {/* Client Details (for non-Udhar methods) */}
          {selectedTab !== 'udhar' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Guest"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F4] dark:bg-[#121110] border border-[#E8E0D8] dark:border-[#2E2A26] text-[#141414] dark:text-[#F6F1EB]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                  Phone / WhatsApp (Digital Invoice)
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F4] dark:bg-[#121110] border border-[#E8E0D8] dark:border-[#2E2A26] font-mono-numbers text-[#141414] dark:text-[#F6F1EB]"
                />
              </div>
            </div>
          )}

          {/* Receipt & Digital Invoice Output Choice */}
          <div className="rounded-2xl bg-[#FAF7F4] dark:bg-[#141210] border border-[#E8E0D8] dark:border-[#2E2A26] p-3.5 space-y-2">
            <div className="text-xs font-semibold text-[#141414] dark:text-[#F6F1EB]">
              Receipt &amp; Invoice Output
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(
                [
                  { id: 'print', label: 'Print Receipt', icon: Printer },
                  { id: 'digital', label: 'Digital Invoice', icon: FileText },
                  { id: 'both', label: 'Print + Digital', icon: CheckCircle2 },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                const active = receiptOutput === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setReceiptOutput(opt.id)}
                    className={`py-2 px-2.5 rounded-xl border font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#F3E1DF] dark:bg-[#3A2827] border-[#E5C6C3] dark:border-[#5C3A38] text-[#141414] dark:text-[#F6F1EB]'
                        : 'bg-white dark:bg-[#1A1816] border-[#E8E0D8] dark:border-[#2E2A26] text-[#6B625C] dark:text-[#A89E96]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Gift wrapping note, alteration memo, or remarks (optional)..."
              className="w-full px-3 py-2 rounded-xl bg-[#FAF7F4] dark:bg-[#121110] border border-[#E8E0D8] dark:border-[#2E2A26] text-xs text-[#141414] dark:text-[#F6F1EB]"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF7F4] dark:bg-[#141210] border-t border-[#E8E0D8] dark:border-[#2A2622] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#1A1816] text-xs font-semibold text-[#4A433E] dark:text-[#C9BFB6] cursor-pointer"
          >
            Back to Bag
          </button>

          <button
            type="button"
            disabled={isBlockedByLimitStop}
            onClick={handleCheckout}
            className="px-6 py-2.5 rounded-xl bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] dark:hover:bg-[#E8E0D8] text-white dark:text-[#141414] text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <span>
              Confirm Payment · {storeProfile.currency} {cartGrandTotal.toLocaleString()}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
