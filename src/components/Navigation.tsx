import React, { useState } from 'react';
import {
  CreditCard,
  Sparkles,
  Package,
  BookOpen,
  Truck,
  BarChart3,
  ShieldCheck,
  Settings,
  X,
  Zap,
  Layers,
  BookUser,
  Crown,
  Receipt,
  TrendingDown,
  Users,
  LayoutDashboard,
  RotateCcw,
  Bot,
  ChevronLeft,
  ChevronDown,
  PanelLeft,
  Cross,
  ShoppingCart,
  Cake,
  Shirt,
  Wrench,
  Percent,
  Building2,
  Smartphone,
  Store,
  Utensils,
  Footprints,
  Gift,
  Milk,
  Cpu,
  User,
  LogOut,
  UserCheck,
  FileText,
  Palette,
  ShieldAlert,
  Activity,
  Grid2x2,
  Tag,
  ClipboardList,
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { VERTICALS_CONFIG } from '../data/defaultData';
import { BusinessVertical } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'categories'
  | 'promotions'
  | 'estimates'
  | 'returns'
  | 'ai_manager'
  | 'ai_hub'
  | 'inventory'
  | 'stock'
  | 'khata'
  | 'person_khatta'
  | 'vip_customers'
  | 'payments'
  | 'expenses'
  | 'attendance'
  | 'salary'
  | 'staff_roles'
  | 'suppliers'
  | 'analytics'
  | 'activity_logs'
  | 'branches'
  | 'bill_templates'
  | 'theme_library'
  | 'admin'
  | 'settings';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenPriceAdjuster?: () => void;
  onOpenProfileModal?: () => void;
  onOpenAuthModal?: () => void;
}

interface NavItemDef {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  alert?: boolean;
}

interface NavSection {
  title: string;
  items: NavItemDef[];
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  isCollapsed = false,
  onToggleCollapse,
  onOpenProfileModal,
  onOpenAuthModal,
}) => {
  const {
    cart,
    filteredProducts,
    khatas,
    userSession,
    googleSignOut,
    activeVertical,
    setActiveVertical,
    storeProfile,
    outOfStockItems,
    returns,
    estimates,
    sales,
    coupons,
    isTabAllowedForRole,
    effectiveRole,
    simulatedRole,
    setSimulatedRole,
  } = usePos();

  const [verticalDropdownOpen, setVerticalDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const lowStockCount = filteredProducts.filter((p) => p.stockQuantity <= p.minStockAlert).length;
  const totalUdharCustomers = khatas.filter((k) => k.currentBalance > 0).length;
  const activeCouponCount = coupons.filter((c) => c.active).length;
  const isMasterAdmin = userSession.email.toLowerCase().trim() === 'bashirsonselectric@gmail.com';
  const isUserAdmin = effectiveRole === 'admin' || userSession.role === 'admin' || isMasterAdmin;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Boutique: true,
    'Catalog & Stock': true,
    'Clients & Sales': true,
    'Growth & Settings': true,
    'Store Tools & Ledgers': false,
  });

  const toggleSection = (sectionTitle: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const getVerticalIcon = (v: BusinessVertical) => {
    switch (v) {
      case 'mobile_shop': return <Smartphone className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'marts': return <ShoppingCart className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'cash_and_carry': return <Store className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'fast_food': return <Utensils className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'shoes_footwear': return <Footprints className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'gift_and_toys': return <Gift className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'books_stationery': return <BookOpen className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'distributor': return <Truck className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'farm_dairy_distributor': return <Milk className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'digital_products': return <Cpu className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'electrical_hardware': return <Zap className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'medical_pharmacy': return <Cross className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'grocery_general': return <ShoppingCart className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'bakery_sweets': return <Cake className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'clothing_apparel': return <Shirt className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      case 'sanitary_plumbing': return <Wrench className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
      default: return <Store className="w-3.5 h-3.5 text-[#141414] dark:text-[#E5C6C3]" />;
    }
  };

  // All 13 primary Fashion Boutique POS items + preserved Store Tools
  const navSections: NavSection[] = [
    {
      title: 'Boutique',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'pos', label: 'POS / New Sale', icon: CreditCard, count: cart.length || undefined },
      ],
    },
    {
      title: 'Catalog & Stock',
      items: [
        { id: 'inventory', label: 'Products', icon: Package, count: lowStockCount || undefined, alert: lowStockCount > 0 },
        { id: 'categories', label: 'Categories', icon: Grid2x2, count: 10 },
        { id: 'stock', label: 'Inventory / Stock', icon: Layers, count: outOfStockItems.length || undefined, alert: outOfStockItems.length > 0 },
      ],
    },
    {
      title: 'Clients & Sales',
      items: [
        { id: 'vip_customers', label: 'Customers', icon: Crown },
        { id: 'suppliers', label: 'Suppliers', icon: Truck },
        { id: 'estimates', label: 'Orders', icon: ClipboardList, count: estimates.length || undefined },
        { id: 'payments', label: 'Sales History', icon: Receipt, count: sales.length || undefined },
        { id: 'returns', label: 'Returns & Exchanges', icon: RotateCcw, count: returns.length || undefined },
      ],
    },
    {
      title: 'Growth & Settings',
      items: [
        { id: 'promotions', label: 'Discounts & Promotions', icon: Tag, count: activeCouponCount || undefined },
        { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
    {
      title: 'Store Tools & Ledgers',
      items: [
        { id: 'ai_hub', label: 'AI Bill & Rate Scanner', icon: Sparkles },
        { id: 'khata', label: 'Udhar Khatta', icon: BookOpen, count: totalUdharCustomers || undefined },
        { id: 'person_khatta', label: 'Person Khatta', icon: BookUser },
        { id: 'branches', label: 'Multi-Branch', icon: Building2 },
        { id: 'expenses', label: 'Expenses', icon: TrendingDown },
        { id: 'ai_manager', label: 'WhatsApp Reports', icon: Bot },
        { id: 'staff_roles', label: 'Staff & Roles', icon: ShieldAlert },
        { id: 'attendance', label: 'Attendance', icon: UserCheck },
        { id: 'salary', label: 'Staff Payroll', icon: Users },
        { id: 'bill_templates', label: 'Invoice Templates', icon: FileText },
        { id: 'theme_library', label: 'Appearance Presets', icon: Palette },
        { id: 'activity_logs', label: 'Activity Logs', icon: Activity },
      ],
    },
  ];

  // Strict RBAC & Super Admin Hide Policy: Admin panel NEVER shown in sidebar
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.id === 'admin') return false;
        if (!isUserAdmin && (item.id === 'staff_roles' || item.id === 'activity_logs')) {
          return false;
        }
        if (item.id === 'activity_logs') return isUserAdmin;
        return isTabAllowedForRole(item.id);
      }),
    }))
    .filter((section) => section.items.length > 0);

  React.useEffect(() => {
    const parent = visibleSections.find((sec) =>
      sec.items.some((item) => item.id === activeTab)
    );
    if (parent && !openSections[parent.title]) {
      setOpenSections((prev) => ({ ...prev, [parent.title]: true }));
    }
  }, [activeTab]);

  return (
    <>
      {/* DESKTOP SIDEBAR — Luxury Fashion Boutique Aesthetic */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-[#161412] text-[#141414] dark:text-[#F6F1EB] border-r border-[#E8E0D8] dark:border-[#2A2622] transition-all duration-200 z-20 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] select-none ${
          isCollapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        {/* Boutique Collection / Business Type Switcher */}
        <div className="relative p-3 border-b border-[#EFE8E0] dark:border-[#2A2622]">
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => setVerticalDropdownOpen(!verticalDropdownOpen)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#FAF7F4] dark:bg-[#1F1C19] hover:bg-[#F6F1EB] dark:hover:bg-[#282420] border border-[#E8E0D8] dark:border-[#2E2A26] text-xs transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-[#F3E1DF] dark:bg-[#3A2827] shrink-0">
                  {getVerticalIcon(activeVertical)}
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-[#7D6E65] dark:text-[#A89E96] font-semibold">
                    Store Mode
                  </div>
                  <div className="font-semibold text-[#141414] dark:text-[#F6F1EB] truncate text-xs">
                    {activeVertical === 'clothing_apparel'
                      ? 'Fashion Boutique'
                      : VERTICALS_CONFIG[activeVertical]?.name || 'Boutique'}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#7D6E65] shrink-0" />
            </button>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setVerticalDropdownOpen(!verticalDropdownOpen)}
                className="p-2 rounded-xl bg-[#F6F1EB] dark:bg-[#221F1C] border border-[#E8E0D8] dark:border-[#2E2A26] cursor-pointer"
                title={activeVertical === 'clothing_apparel' ? 'Fashion Boutique' : VERTICALS_CONFIG[activeVertical]?.name}
              >
                {getVerticalIcon(activeVertical)}
              </button>
            </div>
          )}

          {verticalDropdownOpen && (
            <div
              className={`absolute top-full mt-1.5 rounded-xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] shadow-xl p-1.5 z-50 ${
                isCollapsed ? 'left-2 w-60' : 'left-3 right-3'
              }`}
            >
              <div className="space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                {(Object.keys(VERTICALS_CONFIG) as BusinessVertical[]).map((vKey) => {
                  const conf = VERTICALS_CONFIG[vKey];
                  const isSelected = activeVertical === vKey;
                  return (
                    <button
                      key={vKey}
                      type="button"
                      onClick={() => {
                        setActiveVertical(vKey);
                        setVerticalDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#F3E1DF] dark:bg-[#3A2827] text-[#141414] dark:text-[#F6F1EB] font-semibold'
                          : 'text-[#4A433E] dark:text-[#C9BFB6] hover:bg-[#FAF7F4] dark:hover:bg-[#24201C]'
                      }`}
                    >
                      {getVerticalIcon(vKey)}
                      <div className="min-w-0 flex-1">
                        <div className="truncate">
                          {vKey === 'clothing_apparel' ? 'Fashion Boutique & Apparel' : conf.name}
                        </div>
                        <div className="text-[10px] text-[#7D6E65] dark:text-[#8E847C] truncate">{conf.urduName}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Cashier Mode Notice */}
        {effectiveRole === 'cashier' && !isCollapsed && (
          <div className="mx-3 mt-2.5 p-2.5 rounded-xl bg-[#F3E1DF]/60 dark:bg-[#342322] border border-[#E5C6C3] dark:border-[#533836] text-[#141414] dark:text-[#F6F1EB] text-[11px]">
            <div className="font-semibold flex items-center justify-between">
              <span>Cashier Counter Mode</span>
              {simulatedRole && (
                <button
                  type="button"
                  onClick={() => setSimulatedRole(null)}
                  className="underline text-[10px] cursor-pointer"
                >
                  Exit
                </button>
              )}
            </div>
            <div className="text-[10px] text-[#6B625C] dark:text-[#C9BFB6] mt-0.5">
              Counter checkout operations only.
            </div>
          </div>
        )}

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-3 px-2.5 space-y-3">
          {visibleSections.map((section) => {
            const isOpen = openSections[section.title] ?? true;
            return (
              <div key={section.title} className="space-y-1">
                {!isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A7E75] hover:text-[#141414] dark:hover:text-[#F6F1EB] cursor-pointer"
                  >
                    <span>{section.title}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                    />
                  </button>
                ) : (
                  <div className="border-t border-[#EFE8E0] dark:border-[#2A2622] my-1.5" />
                )}

                {(!isCollapsed ? isOpen : true) && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          title={isCollapsed ? item.label : undefined}
                          className={`w-full flex items-center rounded-xl text-xs font-medium transition-all relative cursor-pointer ${
                            isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-2'
                          } ${
                            isActive
                              ? 'bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] font-semibold shadow-xs'
                              : 'text-[#4A433E] dark:text-[#C9BFB6] hover:bg-[#F6F1EB] dark:hover:bg-[#221F1C] hover:text-[#141414] dark:hover:text-[#F6F1EB]'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive
                                  ? 'text-[#F3E1DF] dark:text-[#141414]'
                                  : 'text-[#8A7E75] dark:text-[#8E847C]'
                              }`}
                            />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                          </span>

                          {!isCollapsed && item.count !== undefined && item.count > 0 && (
                            <span
                              className={`text-[10px] font-mono-numbers font-semibold px-1.5 py-0.5 rounded-md ${
                                isActive
                                  ? 'bg-white/15 dark:bg-black/10 text-white dark:text-[#141414]'
                                  : item.alert
                                  ? 'bg-[#F3E1DF] dark:bg-[#422323] text-[#9B2C2C] dark:text-[#FCA5A5]'
                                  : 'text-[#7D6E65] dark:text-[#A89E96]'
                              }`}
                            >
                              {item.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom User Profile & Collapse */}
        <div className="relative border-t border-[#EFE8E0] dark:border-[#2A2622] p-2.5">
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F6F1EB] dark:hover:bg-[#221F1C] transition-colors text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#141414] dark:bg-[#F3E1DF] text-white dark:text-[#141414] flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden">
                  {userSession.photoURL ? (
                    <img src={userSession.photoURL} alt={userSession.displayName} className="w-full h-full object-cover" />
                  ) : (
                    (userSession.displayName || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="text-left min-w-0">
                  <div className="font-semibold text-[#141414] dark:text-[#F6F1EB] truncate">
                    {userSession.displayName}
                  </div>
                  <div className="text-[10px] text-[#7D6E65] dark:text-[#A89E96] truncate">
                    {userSession.email}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#7D6E65] shrink-0" />
            </button>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-8 h-8 rounded-full bg-[#141414] dark:bg-[#F3E1DF] text-white dark:text-[#141414] flex items-center justify-center font-semibold text-xs cursor-pointer"
                title={userSession.displayName}
              >
                {(userSession.displayName || 'U').charAt(0).toUpperCase()}
              </button>
            </div>
          )}

          {userDropdownOpen && (
            <div
              className={`absolute bottom-full mb-2 rounded-xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] shadow-xl p-2 z-50 ${
                isCollapsed ? 'left-2 w-60' : 'left-2.5 right-2.5'
              }`}
            >
              <div className="px-2 py-2 border-b border-[#EFE8E0] dark:border-[#2A2622]">
                <div className="text-xs font-semibold text-[#141414] dark:text-[#F6F1EB] truncate">
                  {userSession.displayName}
                </div>
                <div className="text-[10px] text-[#7D6E65] dark:text-[#A89E96] truncate">
                  {userSession.email}
                </div>
                <div className="text-[10px] text-[#2F6B4F] dark:text-[#6EE7B7] font-semibold flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{isMasterAdmin ? 'Super Owner' : `${effectiveRole.toUpperCase()} Account`}</span>
                </div>
              </div>
              <div className="py-1 space-y-0.5 text-xs">
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#4A433E] dark:text-[#E8E0D8] hover:bg-[#F6F1EB] dark:hover:bg-[#24201C] flex items-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#7D6E65]" />
                    <span>Switch / Add Boutique</span>
                  </button>
                )}
                {onOpenProfileModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenProfileModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#4A433E] dark:text-[#E8E0D8] hover:bg-[#F6F1EB] dark:hover:bg-[#24201C] flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#7D6E65]" />
                    <span>Profile & Password</span>
                  </button>
                )}
              </div>
              <div className="pt-1 border-t border-[#EFE8E0] dark:border-[#2A2622]">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    googleSignOut();
                  }}
                  className="w-full py-1.5 px-2.5 rounded-lg text-[#9B2C2C] dark:text-[#FCA5A5] hover:bg-[#F3E1DF]/50 dark:hover:bg-[#3A2121] text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-full mt-1.5 flex items-center justify-center gap-1.5 p-1.5 rounded-lg text-[#7D6E65] hover:text-[#141414] dark:hover:text-[#F6F1EB] hover:bg-[#F6F1EB] dark:hover:bg-[#221F1C] text-[11px] font-medium transition-colors cursor-pointer"
            >
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Collapse Sidebar</span>
                </>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/50 flex">
          <div className="w-4/5 max-w-xs bg-white dark:bg-[#161412] text-[#141414] dark:text-[#F6F1EB] h-full flex flex-col justify-between p-4 shadow-xl border-r border-[#E8E0D8] dark:border-[#2A2622]">
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE8E0] dark:border-[#2A2622]">
                <div className="min-w-0">
                  <div className="font-editorial font-semibold text-base truncate">{storeProfile.name}</div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[#7D6E65] dark:text-[#A89E96]">
                    Boutique POS
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#7D6E65] hover:text-[#141414] dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                {visibleSections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <div className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A7E75]">
                      {section.title}
                    </div>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            isActive
                              ? 'bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] font-semibold'
                              : 'text-[#4A433E] dark:text-[#C9BFB6] hover:bg-[#F6F1EB] dark:hover:bg-[#221F1C]'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </span>
                          {item.count !== undefined && item.count > 0 && (
                            <span className="text-[10px] font-mono-numbers font-semibold">{item.count}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#EFE8E0] dark:border-[#2A2622] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">{userSession.displayName}</div>
                <div className="text-[10px] text-[#7D6E65] truncate">{userSession.email}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  googleSignOut();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#F3E1DF] dark:bg-[#3A2121] text-[#9B2C2C] dark:text-[#FCA5A5] text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-[#161412] border-t border-[#E8E0D8] dark:border-[#2A2622] px-2 py-2 md:hidden flex justify-around items-center">
        {[
          { id: 'dashboard' as ActiveTab, label: 'Home', icon: LayoutDashboard },
          { id: 'pos' as ActiveTab, label: 'POS', icon: CreditCard },
          { id: 'categories' as ActiveTab, label: 'Catalog', icon: Grid2x2 },
          { id: 'inventory' as ActiveTab, label: 'Products', icon: Package },
          { id: 'analytics' as ActiveTab, label: 'Reports', icon: BarChart3 },
        ]
          .filter((t) => isTabAllowedForRole(t.id))
          .map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex flex-col items-center text-[10px] font-semibold px-2 py-0.5 rounded-lg ${
                  active ? 'text-[#141414] dark:text-[#F3E1DF]' : 'text-[#8A7E75]'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
      </div>
    </>
  );
};
