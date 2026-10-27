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
import { Plus, X } from 'lucide-react';
import { VERTICALS_CONFIG } from './data/defaultData';

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

  // Enforce RBAC Tab Permissions & Admin Hiding: non-admin user accounts cannot access admin or staff_roles
  React.useEffect(() => {
    if (!isUserAdmin && (activeTab === 'admin' || activeTab === 'staff_roles')) {
      setActiveTab('dashboard');
      return;
    }
    if (!isTabAllowedForRole(activeTab)) {
      setActiveTab('pos');
    }
  }, [activeTab, isTabAllowedForRole, isUserAdmin]);
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
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [customCost, setCustomCost] = useState<number>(0);
  const [customUnit, setCustomUnit] = useState('pcs');

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || customPrice <= 0) return;

    addProduct({
      name: customName.trim(),
      barcode: `${Math.floor(896000000000 + Math.random() * 9000000000)}`,
      category: 'Quick Sale Counter',
      vertical: activeVertical,
      costPrice: customCost || Math.round(customPrice * 0.75),
      retailPrice: customPrice,
      stockQuantity: 99,
      minStockAlert: 5,
      unit: customUnit,
      taxPercent: 0,
      verticalAttributes: {},
    });

    setCustomName('');
    setCustomPrice(0);
    setCustomCost(0);
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. 10A Circuit Breaker or 500g Tea"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden font-bold"
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
