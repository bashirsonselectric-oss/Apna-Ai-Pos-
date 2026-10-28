import React, { useState, useRef } from 'react';
import { usePos } from '../../context/PosContext';
import { VERTICALS_CONFIG } from '../../data/defaultData';
import { BusinessVertical } from '../../types';
import {
  Settings,
  Store,
  CreditCard,
  ShieldCheck,
  RotateCcw,
  Check,
  Building,
  Phone,
  Mail,
  Receipt,
  FileCheck,
  ExternalLink,
  Layers,
  Sparkles,
  QrCode,
  Smartphone,
  Landmark,
  Copy,
  Download,
  Upload,
  Trash2,
  ZoomIn,
  Printer,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export const StoreSettings: React.FC = () => {
  const {
    storeProfile,
    updateStoreProfile,
    resetAllData,
    userSession,
    setUserSession,
    paymentGateways,
    updatePaymentGateways,
    activeVertical,
    setActiveVertical,
  } = usePos();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [gatewaySavedSuccess, setGatewaySavedSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState({
    ...storeProfile,
    name: storeProfile?.name || '',
    legalEntity: storeProfile?.legalEntity || '',
    taxRegistrationNo: storeProfile?.taxRegistrationNo || '',
    phone: storeProfile?.phone || '',
    currency: storeProfile?.currency || 'Rs.',
    address: storeProfile?.address || '',
    receiptHeader: storeProfile?.receiptHeader || '',
    receiptFooter: storeProfile?.receiptFooter || '',
    activeVertical: storeProfile?.activeVertical || activeVertical || 'mobile_shop',
  });
  const [gatewaysForm, setGatewaysForm] = useState(paymentGateways);
  const [selectedQrMethod, setSelectedQrMethod] = useState<'jazzcash' | 'easypaisa' | 'bank'>('jazzcash');
  const [copiedQr, setCopiedQr] = useState(false);

  // Dedicated Thermal Receipt Custom Payment QR State
  const receiptQrFileInputRef = useRef<HTMLInputElement>(null);
  const [receiptQrUrl, setReceiptQrUrl] = useState<string>(storeProfile.paymentQrUrl || '');
  const [receiptQrType, setReceiptQrType] = useState<'raast' | 'jazzcash' | 'easypaisa' | 'bank' | 'general'>(
    storeProfile.paymentQrType || 'raast'
  );
  const [receiptQrTitle, setReceiptQrTitle] = useState<string>(
    storeProfile.paymentQrAccountTitle || storeProfile.name || ''
  );
  const [receiptQrAccountNo, setReceiptQrAccountNo] = useState<string>(
    storeProfile.paymentQrAccountNo || storeProfile.phone || ''
  );
  const [receiptQrBankName, setReceiptQrBankName] = useState<string>(
    storeProfile.paymentQrBankName || 'Meezan Bank / SBP Raast'
  );
  const [receiptQrSavedSuccess, setReceiptQrSavedSuccess] = useState(false);
  const [receiptQrUploadTimestamp, setReceiptQrUploadTimestamp] = useState<number>(Date.now());
  const [isNewlyUploaded, setIsNewlyUploaded] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreProfile(profileForm);
    if (profileForm.activeVertical && profileForm.activeVertical !== activeVertical) {
      setActiveVertical(profileForm.activeVertical);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveGateways = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentGateways(gatewaysForm);
    setGatewaySavedSuccess(true);
    setTimeout(() => setGatewaySavedSuccess(false), 3000);
  };

  const handleQrUpload = (
    method: 'jazzcash' | 'easypaisa' | 'bank' | 'store_primary',
    file: File
  ) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      if (method === 'store_primary') {
        updateStoreProfile({ paymentQrUrl: dataUrl });
      } else if (method === 'jazzcash') {
        setGatewaysForm((prev) => ({
          ...prev,
          jazzcash: { ...prev.jazzcash, qrCodeUrl: dataUrl },
        }));
      } else if (method === 'easypaisa') {
        setGatewaysForm((prev) => ({
          ...prev,
          easypaisa: { ...prev.easypaisa, qrCodeUrl: dataUrl },
        }));
      } else if (method === 'bank') {
        setGatewaysForm((prev) => ({
          ...prev,
          bank: { ...prev.bank, qrCodeUrl: dataUrl },
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleThermalReceiptQrUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      setReceiptQrUrl(dataUrl);
      setReceiptQrUploadTimestamp(Date.now());
      setIsNewlyUploaded(true);
      setTimeout(() => setIsNewlyUploaded(false), 2500);

      updateStoreProfile({
        paymentQrUrl: dataUrl,
        paymentQrType: receiptQrType,
        paymentQrAccountTitle: receiptQrTitle,
        paymentQrAccountNo: receiptQrAccountNo,
        paymentQrBankName: receiptQrBankName,
      });
      setReceiptQrSavedSuccess(true);
      setTimeout(() => setReceiptQrSavedSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveReceiptQrDetails = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateStoreProfile({
      paymentQrUrl: receiptQrUrl,
      paymentQrType: receiptQrType,
      paymentQrAccountTitle: receiptQrTitle,
      paymentQrAccountNo: receiptQrAccountNo,
      paymentQrBankName: receiptQrBankName,
    });
    setReceiptQrSavedSuccess(true);
    setTimeout(() => setReceiptQrSavedSuccess(false), 3000);
  };

  const handleRemoveThermalReceiptQr = () => {
    if (confirm('Are you sure you want to remove the custom QR code from all thermal receipts?')) {
      setReceiptQrUrl('');
      updateStoreProfile({
        paymentQrUrl: '',
      });
      setReceiptQrUploadTimestamp(Date.now());
    }
  };

  const saasPlans = [
    {
      id: 'starter',
      name: 'Starter Retailer',
      price: 'Rs. 0 / Free',
      period: 'Forever free',
      features: [
        'Single POS counter terminal',
        'Up to 500 inventory items',
        'Standard thermal receipt printing',
        'Cash & Card payment recording',
      ],
      current: storeProfile.saasTier === 'starter',
    },
    {
      id: 'professional',
      name: 'Professional Store',
      badge: 'Popular for Retailers',
      price: 'Rs. 2,999',
      period: 'per month',
      features: [
        'Omni-Input AI Bill Scanner (unlimited)',
        'AI Shelf & Product Vision recognition',
        'Messy CSV & Rate List auto-mapper',
        'WhatsApp digital invoice sharing',
        'JazzCash & EasyPaisa integrated QR',
        'Smart rate list auto-expiration',
      ],
      current: storeProfile.saasTier === 'professional',
    },
    {
      id: 'enterprise',
      name: 'Enterprise Multi-Branch',
      price: 'Rs. 7,999',
      period: 'per month',
      features: [
        'Everything in Professional',
        'Unlimited store branches & warehouses',
        'AI Business Intelligence & Demand forecast',
        'Multi-cashier role-based permissions',
        '24/7 Priority support by Godigly',
      ],
      current: storeProfile.saasTier === 'enterprise',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Store Configuration & Godigly SaaS Subscription
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Customize your business information, thermal receipt templates, and manage your Apna AI POS cloud subscription.
        </p>
      </div>

      {/* Google Sign In & Cloud Auth Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-indigo-900 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 flex items-center justify-center font-bold text-xl shadow-md">
            G
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">Google Workspace & Cloud SSO</h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Signed in as <strong className="text-white">{userSession.email}</strong> ({userSession.displayName})
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cloud backups and multi-device POS terminals sync to this Google Identity.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const newName = prompt('Enter Merchant Store Owner Name:', userSession.displayName);
            if (newName) {
              setUserSession((prev) => ({ ...prev, displayName: newName }));
            }
          }}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-colors"
        >
          Manage Google Account
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Business Profile Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              Merchant Business Profile
            </h3>
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> Changes Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Public Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name ?? ''}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Business Category / POS Vertical *</span>
                  <span className="text-[10px] text-emerald-600 font-normal">Adapts schema, units, & custom fields</span>
                </label>
                <select
                  value={profileForm.activeVertical}
                  onChange={(e) => setProfileForm({ ...profileForm, activeVertical: e.target.value as BusinessVertical })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                >
                  {(Object.keys(VERTICALS_CONFIG) as BusinessVertical[]).map((vKey) => (
                    <option key={vKey} value={vKey}>
                      {VERTICALS_CONFIG[vKey].name} ({VERTICALS_CONFIG[vKey].urduName})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {VERTICALS_CONFIG[profileForm.activeVertical as BusinessVertical]?.description}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Entity / Company Name
                </label>
                <input
                  type="text"
                  value={profileForm.legalEntity ?? ''}
                  onChange={(e) => setProfileForm({ ...profileForm, legalEntity: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tax NTN / STRN Registration
                </label>
                <input
                  type="text"
                  value={profileForm.taxRegistrationNo ?? ''}
                  onChange={(e) => setProfileForm({ ...profileForm, taxRegistrationNo: e.target.value })}
                  placeholder="NTN: 1234567-8"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Support Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={profileForm.phone ?? ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={profileForm.currency ?? ''}
                  onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Physical Address
                </label>
                <input
                  type="text"
                  value={profileForm.address ?? ''}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thermal Receipt Tagline (Header)
                </label>
                <input
                  type="text"
                  value={profileForm.receiptHeader ?? ''}
                  onChange={(e) => setProfileForm({ ...profileForm, receiptHeader: e.target.value })}
                  placeholder="e.g. Quality Electrical, Cables & Hardware"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Receipt Policy Note (Footer)
                </label>
                <input
                  type="text"
                  value={profileForm.receiptFooter ?? ''}
                  onChange={(e) => setProfileForm({ ...profileForm, receiptFooter: e.target.value })}
                  placeholder="e.g. Thank you for shopping! Exchange within 7 days."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
              >
                Save Store Settings
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: SaaS Plans & Reset (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                Product by Godigly
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Apna AI POS Subscription Tier
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current active plan:{' '}
                <strong className="text-slate-800 capitalize">{storeProfile.saasTier}</strong> (Valid until{' '}
                {new Date(storeProfile.saasExpiry).toLocaleDateString()})
              </p>
            </div>

            <div className="space-y-3">
              {saasPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 rounded-xl border transition-all ${
                    plan.current
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="font-bold text-xs text-slate-900">{plan.name}</span>
                      {plan.badge && (
                        <span className="ml-2 text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-900 font-bold">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    {plan.current && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="text-base font-extrabold text-slate-900 font-mono-numbers">
                    {plan.price}{' '}
                    <span className="text-xs font-normal text-slate-500 font-sans">
                      {plan.period}
                    </span>
                  </div>

                  <ul className="mt-2.5 space-y-1 text-[11px] text-slate-600">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {!plan.current && (
                    <button
                      type="button"
                      onClick={() => {
                        updateStoreProfile({ saasTier: plan.id as any });
                        alert(`Switched to ${plan.name}! Payment verified.`);
                      }}
                      className="mt-3 w-full py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700"
                    >
                      Upgrade / Switch to {plan.name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-slate-500" />
              Reset Demonstration Data
            </h4>
            <p className="text-xs text-slate-500">
              Restore default multi-vertical catalogs (Electrical, Medical, Grocery, Bakery, Clothing) and sample invoices.
            </p>
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to reset all data to default demo state?')) {
                  resetAllData();
                }
              }}
              className="mt-2 px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* NEW SETTINGS SECTION: Custom Thermal Receipt Payment QR Code */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Printer className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Custom Thermal Receipt Payment QR Code
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Auto-Print on Bills
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload a custom payment QR image from your device. This QR code will automatically appear on all printed 80mm & 58mm thermal receipts, digital vouchers, and WhatsApp bill cards.
              </p>
            </div>
          </div>

          {receiptQrSavedSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 animate-in fade-in">
              <Check className="w-4 h-4" /> Thermal QR Settings Saved!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Columns: File Upload & QR Identification Settings */}
          <div className="lg:col-span-7 space-y-5">
            {/* Device File Upload Box */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-indigo-600" /> Upload QR Code Image from Device *
                </span>
                <span className="text-[11px] font-normal text-slate-500">PNG, JPG, WebP (Max 5MB)</span>
              </label>

              <input
                ref={receiptQrFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleThermalReceiptQrUpload(file);
                }}
                className="hidden"
              />

              {receiptQrUrl ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5 w-full sm:w-auto">
                    <img
                      src={receiptQrUrl}
                      alt="Uploaded QR Code"
                      className="w-16 h-16 object-contain rounded-xl border border-slate-300 bg-white p-1 shadow-2xs shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {receiptQrTitle || 'Custom Payment QR'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-600 truncate mt-0.5">
                        {receiptQrAccountNo || receiptQrType.toUpperCase()}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                        <Check className="w-3 h-3" /> Enabled on all thermal receipts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => receiptQrFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Replace Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveThermalReceiptQr}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => receiptQrFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 flex items-center justify-center mx-auto mb-2 transition-transform shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                    Click to browse and upload QR code image
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                    Upload a high-contrast screenshot or photo of your Raast, JazzCash, EasyPaisa, or Bank QR code.
                  </p>
                </div>
              )}
            </div>

            {/* Gateway Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Payment QR Gateway Category:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'raast', label: 'SBP Raast', icon: Landmark, color: 'text-indigo-600' },
                  { id: 'jazzcash', label: 'JazzCash', icon: Smartphone, color: 'text-rose-600' },
                  { id: 'easypaisa', label: 'EasyPaisa', icon: Smartphone, color: 'text-emerald-600' },
                  { id: 'bank', label: 'Bank IBAN', icon: Building, color: 'text-blue-600' },
                ].map((type) => {
                  const IconComp = type.icon;
                  const active = receiptQrType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setReceiptQrType(type.id as any)}
                      className={`p-2 rounded-xl border flex items-center space-x-2 transition-all font-bold ${
                        active
                          ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 shadow-2xs ring-1 ring-indigo-500'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 ${type.color}`} />
                      <span className="truncate">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Identification Inputs */}
            <form onSubmit={handleSaveReceiptQrDetails} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Merchant Account Title:
                  </label>
                  <input
                    type="text"
                    value={receiptQrTitle}
                    onChange={(e) => setReceiptQrTitle(e.target.value)}
                    placeholder="e.g. Bashir Sons Electric"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Till ID / Account / Raast Number:
                  </label>
                  <input
                    type="text"
                    value={receiptQrAccountNo}
                    onChange={(e) => setReceiptQrAccountNo(e.target.value)}
                    placeholder="e.g. 03008765432 or PK45..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Bank / Wallet Service Name:
                  </label>
                  <input
                    type="text"
                    value={receiptQrBankName}
                    onChange={(e) => setReceiptQrBankName(e.target.value)}
                    placeholder="e.g. Meezan Bank Ltd / SBP Raast Real-time"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Save Thermal Receipt QR Settings</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right 5 Columns: Live Thermal Receipt Preview with Smooth Transition Animation */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-slate-500" /> Live Thermal Ticket Simulation (80mm)
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Ready to Print
              </span>
            </div>

            {/* Miniature Thermal Paper Slip */}
            <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-md border border-slate-300 font-mono text-[11px] leading-tight space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <div className="font-bold text-xs uppercase tracking-wide">{storeProfile.name}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{storeProfile.address}</div>
                <div className="text-[10px] text-slate-600 font-bold">Tel: {storeProfile.phone}</div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-600 pb-1 border-b border-dashed border-slate-300">
                <span>INV: <strong>#INV-7842</strong></span>
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="space-y-1 text-[10px] pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>Clipsal Switch 1-Way (White)</span>
                  <span className="font-bold">Rs. 2,400</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-xs pb-2 border-b border-slate-800">
                <span>TOTAL:</span>
                <span className="text-emerald-700">Rs. 2,400</span>
              </div>

              {/* QR Code Display Area with Smooth Elegant Fade-in Transition Animation */}
              <div
                key={receiptQrUploadTimestamp}
                className={`transition-all duration-700 ease-out transform animate-in fade-in zoom-in-95 my-2 p-3 rounded-xl border flex flex-col items-center justify-center text-center ${
                  isNewlyUploaded
                    ? 'border-emerald-500 bg-emerald-50/80 ring-4 ring-emerald-400/30 shadow-lg scale-102'
                    : 'border-slate-300 bg-slate-50'
                }`}
              >
                {receiptQrUrl ? (
                  <div className="flex flex-col items-center space-y-1.5 transition-all duration-500">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Printed on All Thermal Bills
                    </span>
                    <img
                      src={receiptQrUrl}
                      alt="Thermal Receipt Custom Payment QR"
                      className="w-32 h-32 object-contain bg-white rounded-lg p-1 border border-slate-300 shadow-2xs transition-transform duration-500 hover:scale-105"
                    />
                    <div className="text-center font-mono">
                      <div className="text-[10px] font-bold text-slate-900 uppercase">
                        Scan to Pay ({receiptQrType.toUpperCase()})
                      </div>
                      <div className="text-[10px] font-bold text-indigo-700">
                        {receiptQrAccountNo || 'Till / Account Number'}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate max-w-[200px]">
                        {receiptQrTitle}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5 px-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-1.5">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-slate-700">No Custom QR Uploaded</div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Upload image from device to display on paper receipt
                    </p>
                  </div>
                )}
              </div>

              <div className="text-center text-[9px] text-slate-500 pt-1">
                {storeProfile.receiptFooter}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Payment Gateway Details & Dynamic QR Code Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <QrCode className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Payment Method Details & Dynamic QR Codes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure JazzCash, EasyPaisa, Bank Transfer (Raast), and POS Card terminals. Real-time generated QR codes are ready for counter display and receipt printing.
                </p>
              </div>
            </div>
          </div>

          {gatewaySavedSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 animate-in fade-in">
              <Check className="w-4 h-4" /> Payment Gateways Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveGateways} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: Editable Details */}
            <div className="lg:col-span-7 space-y-6">
              {/* JazzCash Block */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs">
                      JC
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">JazzCash Business & Till</h4>
                      <p className="text-[11px] text-slate-500">Merchant Till & Mobile Wallet</p>
                    </div>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gatewaysForm.jazzcash?.enabled ?? true}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          jazzcash: { ...gatewaysForm.jazzcash, enabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">Active</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      JazzCash Till ID
                    </label>
                    <input
                      type="text"
                      value={gatewaysForm.jazzcash?.tillId || ''}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          jazzcash: { ...gatewaysForm.jazzcash, tillId: e.target.value },
                        })
                      }
                      placeholder="e.g. JC-092418-LHR"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Registered Phone
                    </label>
                    <input
                      type="text"
                      value={gatewaysForm.jazzcash?.phone || ''}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          jazzcash: { ...gatewaysForm.jazzcash, phone: e.target.value },
                        })
                      }
                      placeholder="e.g. 03008765432"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Account Title / Merchant Name
                    </label>
                    <input
                      type="text"
                      value={gatewaysForm.jazzcash?.accountTitle || ''}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          jazzcash: { ...gatewaysForm.jazzcash, accountTitle: e.target.value },
                        })
                      }
                      placeholder="e.g. Bashir Sons Electric"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>

                  {/* JazzCash QR Upload Option */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-bold">
                        <QrCode className="w-3.5 h-3.5 text-rose-600" />
                        Upload JazzCash QR Code Image
                      </span>
                      <span className="text-[10px] text-slate-500">Till Stand / App Screenshot</span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      {gatewaysForm.jazzcash?.qrCodeUrl && (
                        <div className="relative shrink-0">
                          <img
                            src={gatewaysForm.jazzcash.qrCodeUrl}
                            alt="JazzCash QR"
                            className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-300 p-0.5 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setGatewaysForm((prev) => ({
                                ...prev,
                                jazzcash: { ...prev.jazzcash, qrCodeUrl: '' },
                              }))
                            }
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <label className="flex-1 cursor-pointer">
                        <div className="px-3 py-1.5 border border-dashed border-slate-300 hover:border-rose-500 hover:bg-rose-50/40 rounded-lg text-center text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors">
                          <Upload className="w-3.5 h-3.5 text-rose-600" />
                          <span>{gatewaysForm.jazzcash?.qrCodeUrl ? 'Replace Uploaded QR' : 'Upload JazzCash Till QR Image'}</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleQrUpload('jazzcash', file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* EasyPaisa Block */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                      EP
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">EasyPaisa Merchant & Till</h4>
                      <p className="text-[11px] text-slate-500">Telenor Microfinance Bank</p>
                    </div>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gatewaysForm.easypaisa?.enabled ?? true}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          easypaisa: { ...gatewaysForm.easypaisa, enabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">Active</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      EasyPaisa Till ID
                    </label>
                    <input
                      type="text"
                      value={gatewaysForm.easypaisa?.tillId || ''}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          easypaisa: { ...gatewaysForm.easypaisa, tillId: e.target.value },
                        })
                      }
                      placeholder="e.g. EP-55120-LHR"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Registered Phone
                    </label>
                    <input
                      type="text"
                      value={gatewaysForm.easypaisa?.phone || ''}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          easypaisa: { ...gatewaysForm.easypaisa, phone: e.target.value },
                        })
                      }
                      placeholder="e.g. 03008765432"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Account Title / Merchant Name
                    </label>
                    <input
                      type="text"
                      value={gatewaysForm.easypaisa?.accountTitle || ''}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          easypaisa: { ...gatewaysForm.easypaisa, accountTitle: e.target.value },
                        })
                      }
                      placeholder="e.g. Muhammad Bashir & Sons"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>

                  {/* EasyPaisa QR Upload Option */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-bold">
                        <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                        Upload EasyPaisa QR Code Image
                      </span>
                      <span className="text-[10px] text-slate-500">Till Stand / App Screenshot</span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      {gatewaysForm.easypaisa?.qrCodeUrl && (
                        <div className="relative shrink-0">
                          <img
                            src={gatewaysForm.easypaisa.qrCodeUrl}
                            alt="EasyPaisa QR"
                            className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-300 p-0.5 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setGatewaysForm((prev) => ({
                                ...prev,
                                easypaisa: { ...prev.easypaisa, qrCodeUrl: '' },
                              }))
                            }
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <label className="flex-1 cursor-pointer">
                        <div className="px-3 py-1.5 border border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-lg text-center text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors">
                          <Upload className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{gatewaysForm.easypaisa?.qrCodeUrl ? 'Replace Uploaded QR' : 'Upload EasyPaisa Till QR Image'}</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleQrUpload('easypaisa', file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank & Raast Block */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Bank Transfer & Raast ID</h4>
                      <p className="text-[11px] text-slate-500">Instant SBP Raast Real-time Payment</p>
                    </div>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gatewaysForm.bank?.enabled ?? true}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          bank: { ...gatewaysForm.bank, enabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">Active</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={gatewaysForm.bank?.bankName || ''}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          bank: { ...gatewaysForm.bank, bankName: e.target.value },
                        })
                      }
                      placeholder="e.g. Meezan Bank Ltd"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      SBP Raast ID / Phone
                    </label>
                    <input
                      type="text"
                      value={gatewaysForm.bank?.raastId || ''}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          bank: { ...gatewaysForm.bank, raastId: e.target.value },
                        })
                      }
                      placeholder="e.g. 03008765432"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Account Title
                    </label>
                    <input
                      type="text"
                      value={gatewaysForm.bank?.accountTitle || ''}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          bank: { ...gatewaysForm.bank, accountTitle: e.target.value },
                        })
                      }
                      placeholder="e.g. Bashir Sons Electric Co. (Pvt) Ltd"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      IBAN (24 Characters)
                    </label>
                    <input
                      type="text"
                      value={gatewaysForm.bank?.iban || ''}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          bank: { ...gatewaysForm.bank, iban: e.target.value },
                        })
                      }
                      placeholder="e.g. PK45MEZN0001234567890101"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                    />
                  </div>

                  {/* Bank / Raast QR Upload Option */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-bold">
                        <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                        Upload Bank / SBP Raast QR Code Image
                      </span>
                      <span className="text-[10px] text-slate-500">Bank App / Raast P2M Stand</span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      {gatewaysForm.bank?.qrCodeUrl && (
                        <div className="relative shrink-0">
                          <img
                            src={gatewaysForm.bank.qrCodeUrl}
                            alt="Bank Raast QR"
                            className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-300 p-0.5 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setGatewaysForm((prev) => ({
                                ...prev,
                                bank: { ...prev.bank, qrCodeUrl: '' },
                              }))
                            }
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <label className="flex-1 cursor-pointer">
                        <div className="px-3 py-1.5 border border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/40 rounded-lg text-center text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors">
                          <Upload className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{gatewaysForm.bank?.qrCodeUrl ? 'Replace Uploaded QR' : 'Upload Bank / Raast QR Image'}</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleQrUpload('bank', file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* POS Card Terminal Block */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Debit / Credit Card POS Terminal</h4>
                      <p className="text-[11px] text-slate-500">Ingenico / Pax / Verifone Terminal</p>
                    </div>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gatewaysForm.card?.enabled ?? true}
                      onChange={(e) =>
                        setGatewaysForm({
                          ...gatewaysForm,
                          card: { ...gatewaysForm.card, enabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">Active</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Terminal ID / Machine Serial
                  </label>
                  <input
                    type="text"
                    value={gatewaysForm.card?.terminalId || ''}
                    onChange={(e) =>
                      setGatewaysForm({
                        ...gatewaysForm,
                        card: { ...gatewaysForm.card, terminalId: e.target.value },
                      })
                    }
                    placeholder="e.g. INGENICO-PK-8849 [ONLINE]"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Save Payment Method Settings</span>
                </button>
              </div>
            </div>

            {/* Right 5 Cols: Live Dynamic SVG QR Code Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 text-white shadow-xl space-y-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Live Counter QR Generator
                  </span>
                  <h4 className="text-sm font-bold mt-0.5">Counter Payment Display</h4>
                  <p className="text-[11px] text-slate-400">
                    Customers can scan this directly from your tablet or printed counter acrylic display to pay instantly.
                  </p>
                </div>

                {/* QR Method Selector Buttons */}
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedQrMethod('jazzcash')}
                    className={`py-2 px-1 rounded-xl transition-all border ${
                      selectedQrMethod === 'jazzcash'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    JazzCash
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedQrMethod('easypaisa')}
                    className={`py-2 px-1 rounded-xl transition-all border ${
                      selectedQrMethod === 'easypaisa'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    EasyPaisa
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedQrMethod('bank')}
                    className={`py-2 px-1 rounded-xl transition-all border ${
                      selectedQrMethod === 'bank'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    Raast / IBAN
                  </button>
                </div>

                {/* Pure White Background Card for High-Contrast QR Code */}
                <div className="bg-white rounded-2xl p-5 text-slate-900 shadow-lg text-center space-y-3">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {selectedQrMethod === 'jazzcash'
                      ? 'JazzCash Merchant QR'
                      : selectedQrMethod === 'easypaisa'
                      ? 'EasyPaisa Merchant QR'
                      : 'SBP Raast QR Code'}
                  </div>

                  {/* QR Image Display (Uploaded Custom Image or Generated) */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {(() => {
                      const uploadedQr =
                        selectedQrMethod === 'jazzcash'
                          ? gatewaysForm.jazzcash?.qrCodeUrl
                          : selectedQrMethod === 'easypaisa'
                          ? gatewaysForm.easypaisa?.qrCodeUrl
                          : gatewaysForm.bank?.qrCodeUrl || storeProfile.paymentQrUrl;

                      if (uploadedQr) {
                        return (
                          <div className="space-y-2 flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" /> Custom Uploaded QR
                            </span>
                            <img
                              src={uploadedQr}
                              alt="Custom Merchant QR"
                              className="w-48 h-48 object-contain rounded-lg shadow-xs bg-white p-1"
                            />
                          </div>
                        );
                      }

                      const qrData =
                        selectedQrMethod === 'jazzcash'
                          ? `jazzcash://pay?till=${encodeURIComponent(gatewaysForm.jazzcash?.tillId || '')}&title=${encodeURIComponent(gatewaysForm.jazzcash?.accountTitle || '')}`
                          : selectedQrMethod === 'easypaisa'
                          ? `easypaisa://pay?till=${encodeURIComponent(gatewaysForm.easypaisa?.tillId || '')}&title=${encodeURIComponent(gatewaysForm.easypaisa?.accountTitle || '')}`
                          : `raast://pay?iban=${encodeURIComponent(gatewaysForm.bank?.iban || '')}&raast=${encodeURIComponent(gatewaysForm.bank?.raastId || '')}`;
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`;
                      return (
                        <div className="space-y-2 flex flex-col items-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                            Auto-Generated Stand QR
                          </span>
                          <img
                            src={qrUrl}
                            alt="Dynamic Payment QR Code"
                            className="w-48 h-48 rounded-lg shadow-xs bg-white p-1"
                          />
                        </div>
                      );
                    })()}
                  </div>

                  <div className="text-[11px] space-y-1">
                    <div className="font-bold text-slate-900">
                      {selectedQrMethod === 'jazzcash'
                        ? gatewaysForm.jazzcash?.accountTitle || storeProfile.name
                        : selectedQrMethod === 'easypaisa'
                        ? gatewaysForm.easypaisa?.accountTitle || storeProfile.name
                        : gatewaysForm.bank?.accountTitle || storeProfile.name}
                    </div>
                    <div className="font-mono text-emerald-700 font-bold">
                      {selectedQrMethod === 'jazzcash'
                        ? `Till ID: ${gatewaysForm.jazzcash?.tillId || 'N/A'}`
                        : selectedQrMethod === 'easypaisa'
                        ? `Till ID: ${gatewaysForm.easypaisa?.tillId || 'N/A'}`
                        : `Raast: ${gatewaysForm.bank?.raastId || 'N/A'}`}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const payload =
                        selectedQrMethod === 'jazzcash'
                          ? `JazzCash Till: ${gatewaysForm.jazzcash?.tillId} | Title: ${gatewaysForm.jazzcash?.accountTitle}`
                          : selectedQrMethod === 'easypaisa'
                          ? `EasyPaisa Till: ${gatewaysForm.easypaisa?.tillId} | Title: ${gatewaysForm.easypaisa?.accountTitle}`
                          : `Bank: ${gatewaysForm.bank?.bankName} | IBAN: ${gatewaysForm.bank?.iban} | Raast: ${gatewaysForm.bank?.raastId}`;
                      navigator.clipboard.writeText(payload);
                      setCopiedQr(true);
                      setTimeout(() => setCopiedQr(false), 2000);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    {copiedQr ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Details</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      alert('Display counter stand QR generated! Ready to print or display on POS customer facing screen.');
                    }}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Print QR</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
