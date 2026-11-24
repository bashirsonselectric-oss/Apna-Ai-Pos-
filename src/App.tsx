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
import { ActivityLogsView } from './components/activity/ActivityLogsView';
import { CategoriesView } from './components/boutique/CategoriesView';
import { DiscountsPromotionsView } from './components/boutique/DiscountsPromotionsView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { X, Sparkles, Languages, Camera, Upload, Palette, Image as ImageIcon } from 'lucide-react';
import { CameraCaptureModal } from './components/common/CameraCaptureModal';
import { VERTICALS_CONFIG } from './data/defaultData';
import { BOUTIQUE_CATEGORIES } from './data/boutiqueCatalog';
import { autoTranslateToUrdu } from './utils/urduTranslate';

function PosAppContent() {
  const {
    currentReceipt,
    setCurrentReceipt,
    activeVertical,
    addProduct,
    storeProfile,
    isTabAllowedForRole,
    userSession,
    effectiveRole,
    setAppliedCouponCode,
  } = usePos();
  // Default to flagship Fashion Boutique POS Terminal
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [initialPosCategory, setInitialPosCategory] = useState<string>('All');

  const isMasterAdmin = userSession.email.toLowerCase().trim() === 'bashirsonselectric@gmail.com';
  const isUserAdmin = effectiveRole === 'admin' || userSession.role === 'admin' || isMasterAdmin;

  // Enforce Super Admin & RBAC Access
  React.useEffect(() => {
    if (activeTab === 'admin' && !isMasterAdmin) {
      setActiveTab('dashboard');
      return;
    }
    if (!isUserAdmin && (activeTab === 'staff_roles' || activeTab === 'activity_logs')) {
      setActiveTab('dashboard');
      return;
    }
    if (activeTab !== 'activity_logs' && !isTabAllowedForRole(activeTab)) {
      setActiveTab('pos');
    }
  }, [activeTab, isTabAllowedForRole, isMasterAdmin, isUserAdmin]);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomItemOpen, setIsCustomItemOpen] = useState(false);
  const [isPriceAdjusterOpen, setIsPriceAdjusterOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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

  // Quick custom item modal state (preserving Auto-Urdu, Image Upload/Camera, Garment Size & 7-9 Color Sets)
  const [customName, setCustomName] = useState('');
  const [customUrduName, setCustomUrduName] = useState('');
  const [customCategory, setCustomCategory] = useState<string>(BOUTIQUE_CATEGORIES[0].id);
  const [customBrand, setCustomBrand] = useState('Maison Élan');
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [customCost, setCustomCost] = useState<number>(0);
  const [customUnit, setCustomUnit] = useState('pcs');
  const [customImage, setCustomImage] = useState<string>('');
  const [customSize, setCustomSize] = useState<string>('M');
  const [customColorVariants, setCustomColorVariants] = useState<
    { color: string; hex?: string; stock: number; inStock?: boolean }[]
  >([
    { color: 'Ivory Silk', hex: '#F6F0E6', stock: 10, inStock: true },
    { color: 'Blush Rose', hex: '#E8C5C1', stock: 8, inStock: true },
    { color: 'Warm Sand', hex: '#D8C7B4', stock: 6, inStock: true },
    { color: 'Jet Black', hex: '#141414', stock: 5, inStock: true },
    { color: 'Champagne', hex: '#DFC7A7', stock: 4, inStock: true },
    { color: 'Olive Sage', hex: '#7D8471', stock: 3, inStock: true },
    { color: 'Burgundy', hex: '#6E2B3A', stock: 0, inStock: false },
  ]);
  const [isQuickCameraOpen, setIsQuickCameraOpen] = useState(false);

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || customPrice <= 0) return;

    addProduct({
      name: customName.trim(),
      urduName: customUrduName.trim() || autoTranslateToUrdu(customName.trim()),
      barcode: `FB-${Math.floor(100000 + Math.random() * 900000)}`,
      category: activeVertical === 'clothing_apparel' ? customCategory : 'Quick Sale Counter',
      vertical: activeVertical,
      costPrice: customCost || Math.round(customPrice * 0.65),
      retailPrice: customPrice,
      stockQuantity: 25,
      minStockAlert: 4,
      unit: customUnit,
      taxPercent: 5,
      image: customImage || undefined,
      size: customSize || undefined,
      color: customColorVariants[0]?.color || undefined,
      options: {
        colors: customColorVariants.map((c) => c.color),
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '4.5m (Suit)'],
      },
      colorVariants: customColorVariants,
      verticalAttributes: { brand: customBrand.trim() || 'Atelier' },
    });

    setCustomName('');
    setCustomUrduName('');
    setCustomPrice(0);
    setCustomCost(0);
    setCustomImage('');
    setIsCustomItemOpen(false);
  };

  if (!userSession.isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F4] dark:bg-[#11100F] flex flex-col text-[#141414] dark:text-[#F6F1EB] selection:bg-[#141414] selection:text-white dark:selection:bg-[#F3E1DF] dark:selection:text-[#141414] transition-colors">
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

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <main className="flex-1 pb-20 md:pb-8">
            {activeTab === 'dashboard' && (
              <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <DashboardView onNavigate={(tab) => setActiveTab(tab)} />
              </div>
            )}

            {activeTab === 'pos' && (
              <PosTerminal
                onOpenCheckout={() => setIsCheckoutOpen(true)}
                onOpenCustomItem={() => setIsCustomItemOpen(true)}
                initialCategory={initialPosCategory}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesView
                onSelectCategoryForPos={(catId) => {
                  setInitialPosCategory(catId);
                  setActiveTab('pos');
                }}
                onAddNewItem={() => setIsCustomItemOpen(true)}
              />
            )}

            {activeTab === 'promotions' && (
              <DiscountsPromotionsView
                onOpenPriceAdjuster={() => setIsPriceAdjusterOpen(true)}
                onApplyCouponToPos={(code) => {
                  setAppliedCouponCode(code);
                  setActiveTab('pos');
                }}
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

            {activeTab === 'activity_logs' && <ActivityLogsView />}

            {activeTab === 'bill_templates' && <BillTemplateLibrary />}

            {activeTab === 'theme_library' && <ThemeLibrary />}

            {activeTab === 'branches' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <BranchManagement />
              </div>
            )}

            {activeTab === 'admin' && isMasterAdmin && <AdminPanel />}

            {activeTab === 'settings' && <StoreSettings />}
          </main>

          <footer className="bg-white dark:bg-[#161412] border-t border-[#E8E0D8] dark:border-[#2A2622] py-2.5 px-6 text-xs text-[#7D6E65] dark:text-[#A89E96] hidden md:flex items-center justify-between">
            <span>
              <strong className="font-editorial text-[#141414] dark:text-[#F6F1EB]">{storeProfile.name}</strong> · Fashion Boutique POS
            </span>
            <span className="text-[11px]">Offline-First Retail & Cloud Sync</span>
          </footer>
        </div>
      </div>

      {isCheckoutOpen && <PaymentModal onClose={() => setIsCheckoutOpen(false)} />}

      {currentReceipt && (
        <ThermalReceiptModal
          receipt={currentReceipt}
          onClose={() => setCurrentReceipt(null)}
        />
      )}

      <PriceAdjusterModal
        isOpen={isPriceAdjusterOpen}
        onClose={() => setIsPriceAdjusterOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Quick Add Custom Item Modal (Luxury Boutique Styling + Auto-Urdu + Photo + 7-9 Color Sets) */}
      {isCustomItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A1816] rounded-2xl max-w-md w-full shadow-2xl border border-[#E8E0D8] dark:border-[#2E2A26] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EFE8E0] dark:border-[#2A2622] flex items-center justify-between bg-[#FAF7F4] dark:bg-[#161412]">
              <div>
                <span className="text-[10px] font-semibold text-[#7D6E65] dark:text-[#A89E96] uppercase tracking-[0.18em]">
                  Quick Catalog Entry
                </span>
                <h3 className="font-editorial text-lg font-semibold text-[#141414] dark:text-[#F6F1EB]">
                  Add New Boutique Piece
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomItemOpen(false)}
                className="p-1.5 rounded-lg text-[#7D6E65] hover:text-[#141414] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#141414] dark:text-[#F6F1EB]">
                    Item Title (English / Roman) *
                  </label>
                  <span className="text-[10px] text-[#7D6E65] dark:text-[#E5C6C3] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
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
                  placeholder="e.g. Silk Wrap Dress, Calfskin Tote, or Gold Pendant"
                  className="w-full px-3 py-2 text-xs border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB] rounded-xl focus:outline-none focus:border-[#141414] dark:focus:border-[#E5C6C3] font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#141414] dark:text-[#F6F1EB] flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-[#7D6E65]" />
                    <span>اردو نام (Urdu Name)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomUrduName(autoTranslateToUrdu(customName))}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F3E1DF] dark:bg-[#3A2827] text-[#141414] dark:text-[#F6F1EB] cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
                <input
                  type="text"
                  value={customUrduName}
                  onChange={(e) => setCustomUrduName(e.target.value)}
                  placeholder="e.g. سلک ڈریس"
                  className="w-full px-3 py-2 text-xs font-semibold border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB] rounded-xl focus:outline-none focus:border-[#141414]"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                    Category
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB] rounded-xl"
                  >
                    {BOUTIQUE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                    Brand / Designer
                  </label>
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                    Retail Price ({storeProfile.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={customPrice || ''}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono-numbers font-bold border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    value={customCost || ''}
                    onChange={(e) => setCustomCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono-numbers border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB] rounded-xl"
                  />
                </div>
              </div>

              {/* Image Upload & Live Camera */}
              <div>
                <label className="block text-xs font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1.5">
                  Product Photo (Upload or Live Camera)
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110] overflow-hidden flex items-center justify-center shrink-0">
                    {customImage ? (
                      <img src={customImage} alt="Product preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-[#8A7E75]" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#F6F1EB] dark:bg-[#24201C] hover:bg-[#EFE8E0] text-[#141414] dark:text-[#F6F1EB] border border-[#E8E0D8] dark:border-[#2E2A26] text-[11px] font-semibold inline-flex items-center gap-1">
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
                      className="px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] dark:text-[#141414] text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Camera</span>
                    </button>
                    {customImage && (
                      <button
                        type="button"
                        onClick={() => setCustomImage('')}
                        className="text-[11px] text-[#9B2C2C] hover:underline px-1 font-semibold cursor-pointer"
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
                  <label className="block text-xs font-semibold text-[#141414] dark:text-[#F6F1EB]">
                    Size / Cut Length
                  </label>
                  <span className="text-[11px] text-[#7D6E65] dark:text-[#E5C6C3] font-semibold">{customSize}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', '4.5m (Suit)', 'One Size'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setCustomSize(sz)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                        customSize === sz
                          ? 'bg-[#141414] text-white border-[#141414] dark:bg-[#F6F1EB] dark:text-[#141414]'
                          : 'bg-[#FAF7F4] dark:bg-[#221F1C] text-[#4A433E] dark:text-[#C9BFB6] border-[#E8E0D8] dark:border-[#2E2A26]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1-Set Clothes Color Bundle */}
              <div className="p-3 rounded-xl bg-[#FAF7F4] dark:bg-[#141210] border border-[#E8E0D8] dark:border-[#2A2622] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#141414] dark:text-[#F6F1EB] flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#7D6E65]" />
                    <span>Color Swatches (Click to toggle stock)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCustomColorVariants([
                          { color: 'Ivory Silk', hex: '#F6F0E6', stock: 10, inStock: true },
                          { color: 'Blush Rose', hex: '#E8C5C1', stock: 8, inStock: true },
                          { color: 'Warm Sand', hex: '#D8C7B4', stock: 6, inStock: true },
                          { color: 'Jet Black', hex: '#141414', stock: 5, inStock: true },
                          { color: 'Camel', hex: '#B89572', stock: 4, inStock: true },
                          { color: 'Sage', hex: '#8F9A86', stock: 3, inStock: true },
                          { color: 'Maroon', hex: '#7A2036', stock: 0, inStock: false },
                        ])
                      }
                      className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#F3E1DF] dark:bg-[#3A2827] text-[#141414] dark:text-[#F6F1EB] rounded cursor-pointer"
                    >
                      7-Set
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomColorVariants([
                          { color: 'Ivory Silk', hex: '#F6F0E6', stock: 12, inStock: true },
                          { color: 'Jet Black', hex: '#141414', stock: 10, inStock: true },
                          { color: 'Blush Rose', hex: '#E8C5C1', stock: 8, inStock: true },
                          { color: 'Midnight Navy', hex: '#1B253A', stock: 6, inStock: true },
                          { color: 'Emerald', hex: '#1E5A43', stock: 4, inStock: true },
                          { color: 'Ruby', hex: '#9E2A3B', stock: 3, inStock: true },
                          { color: 'Stone Grey', hex: '#9B9690', stock: 0, inStock: false },
                          { color: 'Gold Ochre', hex: '#C69C4D', stock: 0, inStock: false },
                          { color: 'Plum', hex: '#5D2A42', stock: 0, inStock: false },
                        ])
                      }
                      className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#EFE8E0] dark:bg-[#2A2622] text-[#141414] dark:text-[#F6F1EB] rounded cursor-pointer"
                    >
                      9-Set
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
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
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border inline-flex items-center gap-1 cursor-pointer ${
                        cv.inStock === false
                          ? 'bg-[#F3E1DF]/60 dark:bg-[#3A2121] text-[#9B2C2C] dark:text-[#FCA5A5] border-[#E5C6C3] dark:border-[#6B3333] line-through'
                          : 'bg-white dark:bg-[#1F1C19] text-[#141414] dark:text-[#F6F1EB] border-[#E8E0D8] dark:border-[#2E2A26]'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/15"
                        style={{ backgroundColor: cv.hex || '#64748b' }}
                      />
                      <span>{cv.color}</span>
                      {cv.inStock === false && (
                        <span className="text-[9px] font-bold no-underline">Out</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">Unit</label>
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB] rounded-xl"
                >
                  {VERTICALS_CONFIG[activeVertical].unitOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#EFE8E0] dark:border-[#2A2622] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomItemOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] text-xs font-semibold text-[#4A433E] dark:text-[#C9BFB6] hover:bg-[#FAF7F4] dark:hover:bg-[#24201C] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] dark:text-[#141414] text-white text-xs font-semibold cursor-pointer"
                >
                  Save to Boutique Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CameraCaptureModal
        isOpen={isQuickCameraOpen}
        onClose={() => setIsQuickCameraOpen(false)}
        title="Capture Product Photo"
        onCapture={(base64) => setCustomImage(base64)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PosProvider>
        <PosAppContent />
      </PosProvider>
    </ErrorBoundary>
  );
}
