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
  Lock,
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
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
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
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { VERTICALS_CONFIG } from '../data/defaultData';
import { BusinessVertical, UserRole } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'pos'
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
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
  badgeColor?: string;
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
  onOpenPriceAdjuster,
  onOpenProfileModal,
  onOpenAuthModal,
}) => {
  const {
    cart,
    rateLists,
    filteredProducts,
    khatas,
    userSession,
    googleSignOut,
    activeVertical,
    setActiveVertical,
    storeProfile,
    outOfStockItems,
    paymentRecords,
    expenses,
    staffMembers,
    vipCustomers,
    personKhattaProfiles,
    returns,
    attendanceRecords,
    estimates,
    isTabAllowedForRole,
    effectiveRole,
    simulatedRole,
    setSimulatedRole,
  } = usePos();

  const [verticalDropdownOpen, setVerticalDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const activeExpiringLists = rateLists.filter((r) => r.expiresAt && !r.isExpired).length;
  const lowStockCount = filteredProducts.filter((p) => p.stockQuantity <= p.minStockAlert).length;
  const totalUdharCustomers = khatas.filter((k) => k.currentBalance > 0).length;
  const isMasterAdmin = userSession.email.toLowerCase().trim() === 'bashirsonselectric@gmail.com';
  const isUserAdmin = effectiveRole === 'admin' || userSession.role === 'admin' || isMasterAdmin;

  // Dropdown collapse/expand state for sidebar menu groups
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Operations': true,
    'Inventory & Stock': true,
    'Khatas & Ledgers': true,
    'Finance & Team': true,
    'Customization & SaaS': true,
    'System & Admin': true,
  });

  const toggleSection = (sectionTitle: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const getVerticalIcon = (v: BusinessVertical) => {
    switch (v) {
      case 'mobile_shop':
        return <Smartphone className="w-3.5 h-3.5 text-blue-400" />;
      case 'marts':
        return <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />;
      case 'cash_and_carry':
        return <Store className="w-3.5 h-3.5 text-indigo-400" />;
      case 'fast_food':
        return <Utensils className="w-3.5 h-3.5 text-amber-500" />;
      case 'shoes_footwear':
        return <Footprints className="w-3.5 h-3.5 text-orange-400" />;
      case 'gift_and_toys':
        return <Gift className="w-3.5 h-3.5 text-pink-400" />;
      case 'books_stationery':
        return <BookOpen className="w-3.5 h-3.5 text-teal-400" />;
      case 'distributor':
        return <Truck className="w-3.5 h-3.5 text-cyan-400" />;
      case 'farm_dairy_distributor':
        return <Milk className="w-3.5 h-3.5 text-lime-400" />;
      case 'digital_products':
        return <Cpu className="w-3.5 h-3.5 text-violet-400" />;
      case 'electrical_hardware':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'medical_pharmacy':
        return <Cross className="w-3.5 h-3.5 text-rose-500" />;
      case 'grocery_general':
        return <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />;
      case 'bakery_sweets':
        return <Cake className="w-3.5 h-3.5 text-pink-500" />;
      case 'clothing_apparel':
        return <Shirt className="w-3.5 h-3.5 text-purple-500" />;
      case 'sanitary_plumbing':
        return <Wrench className="w-3.5 h-3.5 text-cyan-500" />;
      default:
        return <Store className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const navSections: NavSection[] = [
    {
      title: 'Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          sublabel: 'Sales & Profit',
          icon: LayoutDashboard,
          badge: 'Live',
          badgeColor: 'bg-indigo-600 text-white font-bold',
        },
        {
          id: 'pos',
          label: 'POS Counter',
          sublabel: 'Billing (F2)',
          icon: CreditCard,
          badge: cart.length > 0 ? `${cart.length}` : null,
          badgeColor: 'bg-emerald-500 text-white font-bold',
        },
        {
          id: 'estimates',
          label: 'Estimates & Quotes',
          sublabel: 'تخمینہ بل اور کوٹیشن',
          icon: FileText,
          badge: estimates.length > 0 ? `${estimates.length}` : null,
          badgeColor: 'bg-indigo-600 text-white font-bold',
        },
        {
          id: 'returns',
          label: 'Returns',
          sublabel: 'Refunds & Restock',
          icon: RotateCcw,
          badge: returns.length > 0 ? `${returns.length}` : null,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'ai_manager',
          label: 'AI WhatsApp',
          sublabel: 'Auto Manager',
          icon: Bot,
          badge: 'Bot',
          badgeColor: 'bg-emerald-500 text-white font-bold',
        },
        {
          id: 'ai_hub',
          label: 'Omni-AI Hub',
          sublabel: 'Scanner & Vision',
          icon: Sparkles,
          badge: activeExpiringLists > 0 ? `${activeExpiringLists} Exp` : 'AI',
          badgeColor: 'bg-amber-500 text-slate-900 font-bold',
        },
      ],
    },
    {
      title: 'Inventory & Stock',
      items: [
        {
          id: 'inventory',
          label: 'Catalog & Schema',
          sublabel: 'Dynamic Fields',
          icon: Package,
          badge: lowStockCount > 0 ? `${lowStockCount}` : null,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'stock',
          label: 'Stock & AI',
          sublabel: 'Valuation & Alert',
          icon: Layers,
          badge: outOfStockItems.length > 0 ? `${outOfStockItems.length} Out` : null,
          badgeColor: 'bg-rose-600 text-white font-bold',
        },
      ],
    },
    {
      title: 'Khatas & Ledgers',
      items: [
        {
          id: 'khata',
          label: 'Udhar Khatta',
          sublabel: 'WhatsApp Ledger',
          icon: BookOpen,
          badge: totalUdharCustomers > 0 ? `${totalUdharCustomers}` : null,
          badgeColor: 'bg-indigo-600 text-white font-bold',
        },
        {
          id: 'person_khatta',
          label: 'Person Khatta',
          sublabel: 'Contractor & Advance',
          icon: BookUser,
          badge: personKhattaProfiles.length > 0 ? `${personKhattaProfiles.length}` : null,
          badgeColor: 'bg-amber-500 text-slate-900 font-bold',
        },
        {
          id: 'vip_customers',
          label: 'VIP Customers',
          sublabel: 'Loyalty & Bills',
          icon: Crown,
          badge: vipCustomers.length > 0 ? `${vipCustomers.length}` : null,
          badgeColor: 'bg-yellow-400 text-slate-900 font-bold',
        },
        {
          id: 'payments',
          label: 'Payment Records',
          sublabel: 'Cash & Digital Ledger',
          icon: Receipt,
          badge: paymentRecords.length > 0 ? `${paymentRecords.length}` : null,
          badgeColor: 'bg-cyan-600 text-white',
        },
      ],
    },
    {
      title: 'Finance & Team',
      items: [
        {
          id: 'attendance',
          label: 'Staff Attendance',
          sublabel: 'Haazri & Hours',
          icon: UserCheck,
          badge: `${attendanceRecords.filter((r) => r.date === new Date().toISOString().split('T')[0]).length} Today`,
          badgeColor: 'bg-emerald-600 text-white font-bold',
        },
        {
          id: 'salary',
          label: 'Staff Salary',
          sublabel: 'Payroll & Advance',
          icon: Users,
          badge: staffMembers.length > 0 ? `${staffMembers.length}` : null,
          badgeColor: 'bg-purple-600 text-white',
        },
        {
          id: 'staff_roles',
          label: 'Staff Roles & RBAC',
          sublabel: 'Cashier/POS Guard',
          icon: ShieldAlert,
          badge: effectiveRole.toUpperCase(),
          badgeColor:
            effectiveRole === 'cashier'
              ? 'bg-amber-500 text-slate-950 font-black'
              : 'bg-indigo-600 text-white',
        },
        {
          id: 'expenses',
          label: 'Spend Money',
          sublabel: 'Daily Sheet & WA',
          icon: TrendingDown,
          badge: expenses.length > 0 ? `${expenses.length}` : null,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'suppliers',
          label: 'Suppliers',
          sublabel: 'Payables Ledger',
          icon: Truck,
          badge: null,
          badgeColor: '',
        },
        {
          id: 'analytics',
          label: 'Analytics & BI',
          sublabel: 'Growth Forecast',
          icon: BarChart3,
          badge: null,
          badgeColor: '',
        },
      ],
    },
    {
      title: 'Customization & SaaS',
      items: [
        {
          id: 'bill_templates',
          label: 'Bill Templates',
          sublabel: 'Thermal, A4, Dual-Cable',
          icon: FileText,
          badge: '7 Designs',
          badgeColor: 'bg-indigo-500 text-white font-bold',
        },
        {
          id: 'theme_library',
          label: 'SaaS Themes',
          sublabel: '7 UI Layouts',
          icon: Palette,
          badge: 'Presets',
          badgeColor: 'bg-purple-500 text-white font-bold',
        },
      ],
    },
    {
      title: 'System & Admin',
      items: [
        {
          id: 'admin',
          label: 'Admin Panel',
          sublabel: isMasterAdmin ? 'Authorized' : 'Restricted',
          icon: isMasterAdmin ? ShieldCheck : Lock,
          badge: isMasterAdmin ? 'Admin' : 'Locked',
          badgeColor: isMasterAdmin ? 'bg-amber-400 text-slate-900 font-black' : 'bg-slate-400 text-white',
        },
        {
          id: 'settings',
          label: 'Settings',
          sublabel: 'Store & QR Codes',
          icon: Settings,
          badge: null,
          badgeColor: '',
        },
      ],
    },
  ];

  // User account & RBAC Filter:
  // If user is not an admin, completely hide 'admin' (Admin Panel) and 'staff_roles'
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!isUserAdmin && (item.id === 'admin' || item.id === 'staff_roles')) {
          return false;
        }
        return isTabAllowedForRole(item.id);
      }),
    }))
    .filter((section) => section.items.length > 0);

  // Auto-expand the dropdown section that contains the currently active tab
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
      {/* DESKTOP SIDE MENU (SIDEBAR) */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 text-white border-r border-slate-800 transition-all duration-300 z-20 shrink-0 sticky top-16 h-[calc(100vh-4rem)] select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* 1. DYNAMIC VERTICAL ENGINE SWITCHER (Moved to Side Menu) */}
        <div className="relative p-2.5 border-b border-slate-800">
          {!isCollapsed ? (
            <button
              onClick={() => setVerticalDropdownOpen(!verticalDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs transition-colors group cursor-pointer"
              title="Switch business category & dynamic inventory schema"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 shrink-0">
                  {getVerticalIcon(activeVertical)}
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                    Vertical Engine
                  </div>
                  <div className="font-bold text-white truncate text-xs">
                    {VERTICALS_CONFIG[activeVertical]?.name || 'Retail'}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0 ml-1" />
            </button>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setVerticalDropdownOpen(!verticalDropdownOpen)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                title={`Vertical: ${VERTICALS_CONFIG[activeVertical]?.name} (Click to switch)`}
              >
                {getVerticalIcon(activeVertical)}
              </button>
            </div>
          )}

          {/* Vertical Selection Dropdown Menu */}
          {verticalDropdownOpen && (
            <div
              className={`absolute top-full mt-1.5 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 ${
                isCollapsed ? 'left-2 w-64' : 'left-2.5 right-2.5'
              }`}
            >
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-700 flex justify-between items-center">
                <span>DYNAMIC VERTICAL ENGINE</span>
                <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1 rounded">
                  Adapts Schema
                </span>
              </div>
              <div className="space-y-1 mt-1 max-h-56 overflow-y-auto custom-scrollbar">
                {(Object.keys(VERTICALS_CONFIG) as BusinessVertical[]).map((vKey) => {
                  const conf = VERTICALS_CONFIG[vKey];
                  const isSelected = activeVertical === vKey;
                  return (
                    <button
                      key={vKey}
                      onClick={() => {
                        setActiveVertical(vKey);
                        setVerticalDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/20 text-white font-semibold border border-emerald-500/30'
                          : 'text-slate-300 hover:bg-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {getVerticalIcon(vKey)}
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{conf.name}</div>
                          <div className="text-[10px] text-slate-400">{conf.urduName}</div>
                        </div>
                      </div>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. PRICE ADJUSTER (+/-) QUICK TRIGGER (Moved to Side Menu) */}
        {onOpenPriceAdjuster && (
          <div className="px-2.5 pt-2">
            {!isCollapsed ? (
              <button
                onClick={onOpenPriceAdjuster}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors shadow-2xs group cursor-pointer"
                title="Increase or Decrease Catalog Prices"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">Price Adjuster (+/-)</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  Quick
                </span>
              </button>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={onOpenPriceAdjuster}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-amber-400 transition-colors cursor-pointer"
                  title="Price Adjuster (+/-)"
                >
                  <Percent className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Role Notice & Simulation Banner */}
        {effectiveRole === 'cashier' && !isCollapsed && (
          <div className="mx-2.5 mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px]">
            <div className="font-bold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                CASHIER MODE
              </span>
              {simulatedRole && (
                <button
                  onClick={() => setSimulatedRole(null)}
                  className="underline hover:text-white text-[9px] text-amber-400"
                >
                  Exit Demo
                </button>
              )}
            </div>
            <div className="text-slate-400 text-[9px] mt-0.5 leading-tight">
              Only POS option is visible as requested.
            </div>
          </div>
        )}

        {/* 3. SCROLLABLE NAVIGATION GROUPS (Interactive Dropdown Accordions) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-3 px-2.5 space-y-2.5">
          {visibleSections.map((section, sIdx) => {
            const isOpen = openSections[section.title] ?? true;
            const hasActiveChild = section.items.some((item) => item.id === activeTab);

            return (
              <div key={sIdx} className="space-y-1">
                {!isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer group select-none"
                    title={`Click to ${isOpen ? 'collapse' : 'expand'} ${section.title}`}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className={hasActiveChild ? 'text-indigo-400 font-extrabold' : 'text-slate-300 group-hover:text-white'}>
                        {section.title}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-semibold group-hover:text-slate-200">
                        {section.items.length}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${
                        isOpen ? 'rotate-0 text-indigo-400' : '-rotate-90 text-slate-500'
                      }`}
                    />
                  </button>
                ) : (
                  sIdx > 0 && <div className="border-t border-slate-800/80 my-2 mx-1" />
                )}

                {/* Sub-pages dropdown list */}
                {(!isCollapsed ? isOpen : true) && (
                  <div className={!isCollapsed ? 'space-y-1 ml-2 pl-2 border-l-2 border-slate-800/80' : 'space-y-1'}>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          title={isCollapsed ? `${item.label} (${item.sublabel})` : undefined}
                          className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all group relative cursor-pointer ${
                            isCollapsed
                              ? 'justify-center p-2.5'
                              : 'justify-between px-3 py-2'
                          } ${
                            isActive
                              ? 'theme-active-nav shadow-md font-bold text-white'
                              : 'text-slate-200 hover:text-white hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-transform ${
                                isActive
                                  ? 'text-white scale-110'
                                  : 'text-slate-400 group-hover:text-white'
                              }`}
                            />
                            {!isCollapsed && (
                              <div className="text-left min-w-0">
                                <div className="leading-tight truncate text-white font-medium">{item.label}</div>
                                <div
                                  className={`text-[9.5px] font-normal leading-tight truncate ${
                                    isActive ? 'text-white/80' : 'text-slate-400'
                                  }`}
                                >
                                  {item.sublabel}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Badge */}
                          {!isCollapsed ? (
                            item.badge && (
                              <span
                                className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 ${
                                  isActive ? 'bg-white/20 text-white' : item.badgeColor
                                }`}
                              >
                                {item.badge}
                              </span>
                            )
                          ) : (
                            item.badge && (
                              <span
                                className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-slate-900 ${
                                  item.badgeColor?.includes('bg-rose') ? 'bg-rose-500' : 'bg-emerald-400'
                                }`}
                              />
                            )
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 4. USER PROFILE & SIGN OUT COMPONENT (Moved to Side Menu Bottom) */}
        <div className="relative border-t border-slate-800 p-2.5 bg-slate-950/40">
          {!isCollapsed ? (
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 transition-all text-xs group cursor-pointer"
              title="Google Account Profile & Settings"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                {userSession.photoURL ? (
                  <img
                    src={userSession.photoURL}
                    alt={userSession.displayName}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-emerald-400/60 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/20 shrink-0">
                    {userSession.displayName.charAt(0)}
                  </div>
                )}
                <div className="text-left min-w-0 leading-tight">
                  <div className="font-bold text-white truncate max-w-[120px]">
                    {userSession.displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px] font-mono">
                    {userSession.email}
                  </div>
                  <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{isMasterAdmin ? 'Super Admin' : 'Cashier'}</span>
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0 ml-1" />
            </button>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="p-1 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                title={`${userSession.displayName} (${userSession.email})`}
              >
                {userSession.photoURL ? (
                  <img
                    src={userSession.photoURL}
                    alt={userSession.displayName}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-emerald-400/60"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/20">
                    {userSession.displayName.charAt(0)}
                  </div>
                )}
              </button>
            </div>
          )}

          {/* User Profile Dropdown Popover */}
          {userDropdownOpen && (
            <div
              className={`absolute bottom-full mb-2 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-bottom-2 ${
                isCollapsed ? 'left-2 w-72' : 'left-2.5 right-2.5'
              }`}
            >
              {/* Profile Header */}
              <div className="flex items-center space-x-2.5 pb-2.5 border-b border-slate-700">
                {userSession.photoURL ? (
                  <img
                    src={userSession.photoURL}
                    alt={userSession.displayName}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500/50"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    G
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">
                    {userSession.displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-mono">
                    {userSession.email}
                  </div>
                  <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{isMasterAdmin ? 'Super Owner' : 'Verified Google'}</span>
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="py-2 space-y-1 text-xs">
                {onOpenAuthModal && (
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-emerald-300 hover:bg-slate-700 flex items-center justify-between font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Switch Store / Register</span>
                    </span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded">New</span>
                  </button>
                )}

                {onOpenProfileModal && (
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenProfileModal();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-slate-200 hover:bg-slate-700 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Account Identity Settings</span>
                    </span>
                    <span className="text-[9px] text-slate-500">View</span>
                  </button>
                )}

                <div className="p-2 rounded-lg bg-slate-900/60 text-[10px] text-slate-400 space-y-0.5 mt-1">
                  <div className="flex justify-between">
                    <span>Store:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[120px]">{storeProfile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="text-amber-400 font-medium capitalize">{storeProfile.saasTier}</span>
                  </div>
                </div>
              </div>

              {/* Sign Out Action */}
              <div className="pt-2 border-t border-slate-700">
                <button
                  onClick={() => {
                    googleSignOut();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Account</span>
                </button>
              </div>
            </div>
          )}

          {/* Sidebar Collapse Toggle Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`w-full mt-2 flex items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer ${
                !isCollapsed ? 'space-x-2' : ''
              }`}
              title={isCollapsed ? 'Expand Side Menu' : 'Collapse Side Menu'}
            >
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">Collapse Side Menu</span>
                </>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE DRAWER MENU (RESPONSIVE SLIDE-OVER) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/80 backdrop-blur-xs flex animate-in fade-in">
          <div className="w-4/5 max-w-xs bg-slate-900 text-white h-full flex flex-col justify-between p-4 shadow-2xl animate-in slide-in-from-left">
            <div>
              {/* Drawer Top */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-xs text-white">
                    AI
                  </div>
                  <div>
                    <div className="font-bold text-sm">Apna AI POS</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {storeProfile.name}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Vertical Selector in Mobile Drawer */}
              <div className="py-2.5 border-b border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Business Vertical
                </span>
                <select
                  value={activeVertical}
                  onChange={(e) => setActiveVertical(e.target.value as BusinessVertical)}
                  className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg p-2 font-semibold"
                >
                  {(Object.keys(VERTICALS_CONFIG) as BusinessVertical[]).map((vKey) => (
                    <option key={vKey} value={vKey}>
                      {VERTICALS_CONFIG[vKey].name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Price Adjuster Button */}
              {onOpenPriceAdjuster && (
                <div className="py-2 border-b border-slate-800">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenPriceAdjuster();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800 border border-amber-500/30 text-amber-300 text-xs font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <Percent className="w-3.5 h-3.5 text-amber-400" />
                      <span>Price Adjuster (+/-)</span>
                    </span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                      Open
                    </span>
                  </button>
                </div>
              )}

              {/* Navigation Links in Mobile Drawer (Dropdown Accordions) */}
              <div className="py-2.5 space-y-2.5 overflow-y-auto max-h-[50vh] custom-scrollbar">
                {visibleSections.map((section, sIdx) => {
                  const isOpen = openSections[section.title] ?? true;
                  const hasActiveChild = section.items.some((item) => item.id === activeTab);

                  return (
                    <div key={sIdx} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.title)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <span className={hasActiveChild ? 'text-indigo-400 font-extrabold' : 'text-slate-300'}>
                          {section.title} ({section.items.length})
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isOpen ? 'rotate-0 text-indigo-400' : '-rotate-90 text-slate-500'
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="space-y-1 ml-2 pl-2 border-l-2 border-slate-800">
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setActiveTab(item.id);
                                  setMobileMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                                  isActive
                                    ? 'theme-active-nav font-bold text-white'
                                    : 'text-slate-200 hover:text-white hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5">
                                  <Icon className="w-4 h-4 text-slate-300" />
                                  <div>
                                    <div className="text-white font-medium">{item.label}</div>
                                    <div className="text-[10px] text-slate-400 font-normal">
                                      {item.sublabel}
                                    </div>
                                  </div>
                                </div>
                                {item.badge && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${item.badgeColor}`}>
                                    {item.badge}
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
              </div>
            </div>

            {/* Mobile Drawer Bottom User Session Info */}
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-bold truncate">{userSession.displayName}</div>
                  <div className="text-slate-400 text-[10px] font-mono truncate">{userSession.email}</div>
                  {effectiveRole === 'cashier' && (
                    <div className="text-amber-400 text-[9px] font-semibold mt-0.5">Role: Cashier (POS Only)</div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    googleSignOut();
                  }}
                  className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Out</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* MOBILE STICKY BOTTOM ACTION BAR FOR QUICK POS ACCESS */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-2 md:hidden flex justify-around items-center shadow-lg">
        {isTabAllowedForRole('pos') && (
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex flex-col items-center text-[10px] font-bold ${
              activeTab === 'pos' ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            <CreditCard className="w-4 h-4 mb-0.5" />
            <span>Counter</span>
          </button>
        )}

        {isTabAllowedForRole('khata') && (
          <button
            onClick={() => setActiveTab('khata')}
            className={`flex flex-col items-center text-[10px] font-bold ${
              activeTab === 'khata' ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span>Khata</span>
          </button>
        )}

        {isTabAllowedForRole('ai_hub') && (
          <button
            onClick={() => setActiveTab('ai_hub')}
            className={`flex flex-col items-center text-[10px] font-bold ${
              activeTab === 'ai_hub' ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5 text-amber-500" />
            <span>AI Ingest</span>
          </button>
        )}

        {isTabAllowedForRole('inventory') && (
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center text-[10px] font-bold ${
              activeTab === 'inventory' ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            <Package className="w-4 h-4 mb-0.5" />
            <span>Catalog</span>
          </button>
        )}

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center text-[10px] font-bold text-slate-500"
        >
          <PanelLeft className="w-4 h-4 mb-0.5" />
          <span>Menu</span>
        </button>
      </div>
    </>
  );
};
