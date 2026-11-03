/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PosProvider, usePos } from './context/PosContext';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { PosTerminal } from './components/pos/PosTerminal';
import { PaymentModal } from './components/pos/PaymentModal';
import { ThermalReceiptModal } from './components/pos/ThermalReceiptModal';
import { OmniInputHub } from './components/ai/OmniInputHub';
import { InventoryManager } from './components/inventory/InventoryManager';
import { SupplierLedger } from './components/suppliers/SupplierLedger';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { StoreSettings } from './components/settings/StoreSettings';
import { UdharKhatta } from './components/khata/UdharKhatta';
import { AdminPanel } from './components/admin/AdminPanel';
import { PriceAdjusterModal } from './components/pricing/PriceAdjusterModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { StockManager } from './components/stock/StockManager';
import { AuthModal } from './components/auth/AuthModal';
import { AdminChatBot } from './components/chat/AdminChatBot';
import { PaymentRecords } from './components/payments/PaymentRecords';
import { StaffSalary } from './components/salary/StaffSalary';
import { ExpenseManager } from './components/expenses/ExpenseManager';
import { VipCustomers } from './components/vip/VipCustomers';
import { PersonKhatta } from './components/person_khata/PersonKhatta';
import { DashboardView } from './components/dashboard/DashboardView';
import { ReturnsManager } from './components/returns/ReturnsManager';
import { AiManager } from './components/ai_manager/AiManager';
import { AttendanceTracker } from './components/attendance/AttendanceTracker';
import { StaffRoleManager } from './components/staff_roles/StaffRoleManager';
import { BillTemplateLibrary } from './components/templates/BillTemplateLibrary';
import { ThemeLibrary } from './components/theme/ThemeLibrary';
import { AuthPage } from './components/auth/AuthPage';
import { EstimatesManager } from './components/estimates/EstimatesManager';
import { BranchManagement } from './components/branches/BranchManagement';
import { Plus, X, Sparkles, Languages, Camera, Upload, Palette, Image as ImageIcon } from 'lucide-react';
import { CameraCaptureModal } from './components/common/CameraCaptureModal';
import { VERTICALS_CONFIG } from './data/defaultData';
import { autoTranslateToUrdu } from './utils/urduTranslate';

function PosAppContent() {
  const {
    currentReceipt,
    setCurrentReceipt,
    activeVertical,
    addProduct,
    storeProfile,
    cart,
    isTabAllowedForRole,
    userSession,
    effectiveRole,
  } = usePos();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const isMasterAdmin = userSession.email.toLowerCase().trim() === 'bashirsonselectric@gmail.com';
  const isUserAdmin = effectiveRole === 'admin' || userSession.role === 'admin' || isMasterAdmin;

  // Enforce Super Admin & RBAC Access: Admin Panel ONLY accessible by bashirsonselectric@gmail.com
  // Strictly hidden and redirected for all other user accounts
  React.useEffect(() => {
    if (activeTab === 'admin' && !isMasterAdmin) {
      setActiveTab('dashboard');
      return;
    }
    if (!isUserAdmin && activeTab === 'staff_roles') {
      setActiveTab('dashboard');
      return;
    }
    if (!isTabAllowedForRole(activeTab)) {
      setActiveTab('pos');
    }
  }, [activeTab, isTabAllowedForRole, isMasterAdmin, isUserAdmin]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomItemOpen, setIsCustomItemOpen] = useState(false);
  const [isPriceAdjusterOpen, setIsPriceAdjusterOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  // Direct land new user on sign up / business registration wizard
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => {
    try {
      const onboarded = localStorage.getItem('apna_pos_onboarded');
      return !onboarded;
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('apna_pos_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileMenuOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('apna_pos_sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  // Quick custom item modal form
  const [customName, setCustomName] = useState('');
  const [customUrduName, setCustomUrduName] = useState('');
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [customCost, setCustomCost] = useState<number>(0);
  const [customUnit, setCustomUnit] = useState('pcs');
  const [customImage, setCustomImage] = useState<string>('');
  const [customSize, setCustomSize] = useState<string>('L');
  const [customColorVariants, setCustomColorVariants] = useState<{ color: string; hex?: string; stock: number; inStock?: boolean }[]>([
    { color: 'Navy Blue', hex: '#1e3a8a', stock: 10, inStock: true },
    { color: 'Jet Black', hex: '#09090b', stock: 8, inStock: true },
    { color: 'Off White', hex: '#f8fafc', stock: 6, inStock: true },
    { color: 'Slate Grey', hex: '#64748b', stock: 5, inStock: true },
    { color: 'Ruby Red', hex: '#dc2626', stock: 4, inStock: true },
    { color: 'Olive Green', hex: '#3f6212', stock: 3, inStock: true },
    { color: 'Royal Blue', hex: '#2563eb', stock: 0, inStock: false }, // Out of stock highlight
  ]);
  const [isQuickCameraOpen, setIsQuickCameraOpen] = useState(false);

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || customPrice <= 0) return;

    addProduct({
      name: customName.trim(),
      urduName: customUrduName.trim() || autoTranslateToUrdu(customName.trim()),
      barcode: `${Math.floor(896000000000 + Math.random() * 9000000000)}`,
      category: activeVertical === 'clothing_apparel' ? 'Fabrics & Clothes' : 'Quick Sale Counter',
      vertical: activeVertical,
      costPrice: customCost || Math.round(customPrice * 0.75),
      retailPrice: customPrice,
      stockQuantity: 99,
      minStockAlert: 5,
      unit: customUnit,
      taxPercent: 0,
      image: customImage || undefined,
      size: customSize || undefined,
      color: customColorVariants[0]?.color || undefined,
      options: {
        colors: customColorVariants.map((c) => c.color),
        sizes: ['S', 'M', 'L', 'XL', 'XXL', '4.5m (Suit)'],
      },
      colorVariants: customColorVariants,
      verticalAttributes: {},
    });

    setCustomName('');
    setCustomUrduName('');
    setCustomPrice(0);
    setCustomCost(0);
    setCustomImage('');
    setIsCustomItemOpen(false);
  };

  // Direct land new user or shop owner on Sign up / Login page first
  // After login, dashboard shows. When anyone logs out, direct land back on Sign up / Login page
  if (!userSession.isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors">
      {/* Header with Google User Profile & Price Adjuster */}
      <Header
        onOpenAiHub={() => setActiveTab('ai_hub')}
        onOpenQuickSale={() => setActiveTab('pos')}
        onOpenNewProduct={() => setIsCustomItemOpen(true)}
        onOpenPriceAdjuster={() => setIsPriceAdjusterOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onToggleMobileMenu={handleToggleSidebar}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Menu */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => {
            setSidebarCollapsed((prev) => {
              const next = !prev;
              try {
                localStorage.setItem('apna_pos_sidebar_collapsed', String(next));
              } catch {}
              return next;
            });
          }}
          onOpenPriceAdjuster={() => setIsPriceAdjusterOpen(true)}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Main Content Body Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <main className="flex-1 pb-20 md:pb-12">
            {activeTab === 'dashboard' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <DashboardView onNavigate={(tab) => setActiveTab(tab)} />
              </div>
            )}

        {activeTab === 'pos' && (
          <PosTerminal
            onOpenCheckout={() => setIsCheckoutOpen(true)}
            onOpenCustomItem={() => setIsCustomItemOpen(true)}
          />
        )}

        {activeTab === 'estimates' && <EstimatesManager />}

        {activeTab === 'returns' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ReturnsManager />
          </div>
        )}

        {activeTab === 'ai_manager' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AiManager />
          </div>
        )}

        {activeTab === 'ai_hub' && <OmniInputHub />}

        {activeTab === 'inventory' && (
          <InventoryManager onOpenAiIngest={() => setActiveTab('ai_hub')} />
        )}

        {activeTab === 'stock' && (
          <StockManager onOpenAiIngest={() => setActiveTab('ai_hub')} />
        )}

        {activeTab === 'khata' && <UdharKhatta />}

        {activeTab === 'person_khatta' && <PersonKhatta />}

        {activeTab === 'vip_customers' && <VipCustomers />}

        {activeTab === 'payments' && <PaymentRecords />}

        {activeTab === 'expenses' && <ExpenseManager />}

        {activeTab === 'attendance' && <AttendanceTracker />}

        {activeTab === 'salary' && <StaffSalary />}

        {activeTab === 'staff_roles' && <StaffRoleManager />}

        {activeTab === 'suppliers' && (
          <SupplierLedger onOpenAiScanner={() => setActiveTab('ai_hub')} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard onOpenAiForecast={() => setActiveTab('ai_hub')} />
        )}

        {activeTab === 'bill_templates' && <BillTemplateLibrary />}

        {activeTab === 'theme_library' && <ThemeLibrary />}

        {activeTab === 'branches' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <BranchManagement />
          </div>
        )}

        {activeTab === 'admin' && <AdminPanel />}

        {activeTab === 'settings' && <StoreSettings />}
      </main>

      {/* Footer Branding */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 text-center text-xs text-slate-500 dark:text-slate-400 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">Apna AI POS</span>
            <span>•</span>
            <span>Cloud Retail & Udhar Khatta Engine by <strong>Godigly</strong></span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Dynamic Multi-Vertical Schemas</span>
            <span>•</span>
            <span>WhatsApp Direct Ledger</span>
            <span>•</span>
            <span>Price Adjuster Engine</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  </div>

      {/* Payment Checkout Modal */}
      {isCheckoutOpen && <PaymentModal onClose={() => setIsCheckoutOpen(false)} />}

      {/* Thermal Receipt Preview & Print Modal */}
      {currentReceipt && (
        <ThermalReceiptModal
          receipt={currentReceipt}
          onClose={() => setCurrentReceipt(null)}
        />
      )}

      {/* Price Increase & Decrease Modal */}
      <PriceAdjusterModal
        isOpen={isPriceAdjusterOpen}
        onClose={() => setIsPriceAdjusterOpen(false)}
      />

      {/* User Profile Component Modal (Google Account / Sign Out) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Quick Add Custom Item Modal */}
      {isCustomItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Quick Catalog Entry
                </span>
                <h3 className="text-base font-bold">Add Item to {VERTICALS_CONFIG[activeVertical].name}</h3>
              </div>
              <button
                onClick={() => setIsCustomItemOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Item Title (English / Roman) *
                  </label>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                    Auto-Urdu
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomName(val);
                    setCustomUrduName(autoTranslateToUrdu(val));
                  }}
                  placeholder="e.g. 10A Circuit Breaker, 7/29 Wire, or 500g Tea"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-purple-500" />
                    <span>اردو نام (Urdu Name - Auto-Filled)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomUrduName(autoTranslateToUrdu(customName))}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    <span>Auto-Fill</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={customUrduName}
                  onChange={(e) => setCustomUrduName(e.target.value)}
                  placeholder="e.g. 10 ایمپیئر بریکر"
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 dark:border-slate-700 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 rounded-lg focus:outline-hidden"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Retail Price ({storeProfile.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={customPrice || ''}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono-numbers font-bold text-emerald-700 border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price (Wholesale)
                  </label>
                  <input
                    type="number"
                    value={customCost || ''}
                    onChange={(e) => setCustomCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono-numbers border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Visual Image Upload & Capture */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Product Image / Garment Photo
                  </label>
                  <span className="text-[10px] text-purple-600 font-bold">
                    Upload or Live Camera
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
                    {customImage ? (
                      <img src={customImage} alt="custom" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 text-[11px] font-bold inline-flex items-center gap-1 transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const base64 = ev.target?.result as string;
                            if (base64) setCustomImage(base64);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsQuickCameraOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-white" />
                      <span>Live Camera</span>
                    </button>

                    {customImage && (
                      <button
                        type="button"
                        onClick={() => setCustomImage('')}
                        className="text-[10px] text-rose-500 hover:underline px-1 font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Garment Size Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Garment Size / Cut
                  </label>
                  <span className="text-[10px] text-purple-600 font-bold">{customSize}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {['S', 'M', 'L', 'XL', 'XXL', '4.5m (Suit)', '7.0m (Double)'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setCustomSize(sz)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                        customSize === sz
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1-Set Clothes Color Bundle Preview & Out of Stock Highlights */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-purple-600" />
                    <span>1 Set (7-9 Colors)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomColorVariants([
                          { color: 'Navy Blue', hex: '#1e3a8a', stock: 10, inStock: true },
                          { color: 'Jet Black', hex: '#09090b', stock: 8, inStock: true },
                          { color: 'Off White', hex: '#f8fafc', stock: 6, inStock: true },
                          { color: 'Slate Grey', hex: '#64748b', stock: 5, inStock: true },
                          { color: 'Camel Brown', hex: '#b45309', stock: 4, inStock: true },
                          { color: 'Olive Green', hex: '#3f6212', stock: 3, inStock: true },
                          { color: 'Maroon', hex: '#881337', stock: 0, inStock: false }, // Out of stock
                        ]);
                      }}
                      className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-100 text-purple-700 rounded"
                    >
                      7-Set
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomColorVariants([
                          { color: 'Navy Blue', hex: '#1e3a8a', stock: 12, inStock: true },
                          { color: 'Jet Black', hex: '#09090b', stock: 10, inStock: true },
                          { color: 'Crisp White', hex: '#f8fafc', stock: 8, inStock: true },
                          { color: 'Royal Blue', hex: '#2563eb', stock: 6, inStock: true },
                          { color: 'Emerald Green', hex: '#16a34a', stock: 4, inStock: true },
                          { color: 'Ruby Red', hex: '#dc2626', stock: 3, inStock: true },
                          { color: 'Heather Grey', hex: '#94a3b8', stock: 0, inStock: false },
                          { color: 'Mustard Yellow', hex: '#ca8a04', stock: 0, inStock: false },
                          { color: 'Burgundy', hex: '#701a75', stock: 0, inStock: false },
                        ]);
                      }}
                      className="px-1.5 py-0.5 text-[9px] font-bold bg-fuchsia-100 text-fuchsia-700 rounded"
                    >
                      9-Set
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {customColorVariants.map((cv, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const updated = [...customColorVariants];
                        const nextInStock = updated[idx].inStock === false;
                        updated[idx] = { ...updated[idx], inStock: nextInStock, stock: nextInStock ? 5 : 0 };
                        setCustomColorVariants(updated);
                      }}
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold border inline-flex items-center gap-1 cursor-pointer transition-all ${
                        cv.inStock === false
                          ? 'bg-rose-50 text-rose-700 border-rose-300 line-through'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                      title="Click to toggle In Stock / Out of Stock"
                    >
                      <span className="w-2 h-2 rounded-full border border-black/20" style={{ backgroundColor: cv.hex || '#64748b' }} />
                      <span>{cv.color}</span>
                      {cv.inStock === false && <span className="text-[8px] bg-rose-600 text-white px-1 rounded no-underline">0</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                >
                  {VERTICALS_CONFIG[activeVertical].unitOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCustomItemOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20"
                >
                  Add & Ready to Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Item Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isQuickCameraOpen}
        onClose={() => setIsQuickCameraOpen(false)}
        title="Capture Custom Product Photo"
        onCapture={(base64) => setCustomImage(base64)}
      />

      {/* Floating Interactive Chat Bot (User to Master Admin) */}
      <AdminChatBot />

      {/* Sign In & Sign Up / Business Onboarding Popup */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <PosProvider>
      <PosAppContent />
    </PosProvider>
  );
}
