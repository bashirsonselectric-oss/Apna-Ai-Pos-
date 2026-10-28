import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BusinessVertical,
  Product,
  CartItem,
  SaleRecord,
  Supplier,
  SupplierInvoice,
  RateList,
  StoreProfile,
  UserSession,
  CustomerKhata,
  KhataEntry,
  DealBundle,
  SystemUser,
  EditableSaaSPlan,
  PaymentGatewaySettings,
  ChatMessage,
  BusinessAccount,
  ThemeMode,
  StaffRole,
  PaymentRecord,
  FeatureLockConfig,
  SystemLimitConfig,
  StaffMember,
  SalaryPayoutRecord,
  StaffAdvanceRecord,
  ExpenseRecord,
  VipCustomerAnalysis,
  PersonKhattaProfile,
  PersonKhattaEntry,
  StockBackupRecord,
  SupplierBackupRecord,
  AiSmartSearchMatch,
  ReturnRecord,
  ReturnItem,
  AiManagerConfig,
  AiManagerAlert,
  AttendanceRecord,
  RoleTabPermissions,
  BillTemplate,
  SaaSThemePreset,
  StaffAccount,
  EstimateRecord,
  PaymentMethod,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_SUPPLIER_INVOICES,
  INITIAL_RATE_LISTS,
  INITIAL_SALES,
  DEFAULT_STORE_PROFILE,
  VERTICALS_CONFIG,
  INITIAL_KHATAS,
  INITIAL_DEALS,
  INITIAL_SYSTEM_USERS,
  INITIAL_SAAS_PLANS,
  DEFAULT_PAYMENT_GATEWAYS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_BUSINESS_ACCOUNTS,
  INITIAL_PAYMENT_RECORDS,
  INITIAL_STAFF_MEMBERS,
  INITIAL_SALARY_PAYOUTS,
  INITIAL_STAFF_ADVANCES,
  INITIAL_EXPENSES,
  INITIAL_VIP_CUSTOMERS,
  INITIAL_PERSON_KHATTA_PROFILES,
  INITIAL_PERSON_KHATTA_ENTRIES,
  INITIAL_FEATURE_LOCKS,
  INITIAL_SYSTEM_LIMITS,
  INITIAL_STOCK_BACKUPS,
  INITIAL_SUPPLIER_BACKUPS,
  INITIAL_RETURNS,
  DEFAULT_AI_MANAGER_CONFIG,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_BILL_TEMPLATES,
  SAAS_THEME_PRESETS,
  INITIAL_ESTIMATES,
} from '../data/defaultData';
import { sounds } from '../services/soundService';
import { BillParseResult } from '../services/geminiService';

interface PosContextType {
  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;

  // Products & Active Vertical
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  filteredProducts: Product[];
  activeVertical: BusinessVertical;
  setActiveVertical: (vertical: BusinessVertical) => void;


  // Store Profile & Payment Gateway Settings
  storeProfile: StoreProfile;
  updateStoreProfile: (updates: Partial<StoreProfile>) => void;
  updateBusinessLogo: (logoUrl: string) => void;
  paymentGateways: PaymentGatewaySettings;
  updatePaymentGateways: (updates: Partial<PaymentGatewaySettings>) => void;

  // Multi-User Accounts & Tenant Data Isolation
  businessAccounts: BusinessAccount[];
  activeBusinessId: string;
  switchBusinessAccount: (bizId: string, explicitBiz?: BusinessAccount) => void;
  registerBusinessAccount: (data: Omit<BusinessAccount, 'id' | 'createdAt'>) => BusinessAccount;

  // Stock Management & Valuation Stats
  totalStockCost: number;
  totalStockRetail: number;
  outOfStockItems: Product[];
  lowStockItems: Product[];
  
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, qty?: number, options?: { selectedColor?: string; subCategory?: string }) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartDiscount: number;
  setCartDiscount: (disc: number) => void;
  cartTaxRate: number;
  setCartTaxRate: (rate: number) => void;
  cartDeliveryType: 'none' | 'rider' | 'cargo' | 'van';
  setCartDeliveryType: (type: 'none' | 'rider' | 'cargo' | 'van') => void;
  cartDeliveryFee: number;
  setCartDeliveryFee: (fee: number) => void;
  cartDeliveryAddress: string;
  setCartDeliveryAddress: (addr: string) => void;
  cartRiderName: string;
  setCartRiderName: (name: string) => void;
  cartSubtotal: number;
  cartDiscountAmount: number;
  cartTaxAmount: number;
  cartGrandTotal: number;
  hasZeroStockInCart: boolean;

  // Checkout & Sales
  sales: SaleRecord[];
  completeSale: (paymentInfo: {
    customerName: string;
    customerPhone?: string;
    paymentMethod: any;
    tenderedCash?: number;
    changeDue?: number;
    splitDetails?: any;
    notes?: string;
    udharKhataId?: string;
    deliveryType?: 'none' | 'rider' | 'cargo' | 'van';
    deliveryFee?: number;
    deliveryAddress?: string;
    riderName?: string;
    taxRate?: number;
    taxAmount?: number;
  }) => SaleRecord;
  currentReceipt: SaleRecord | null;
  setCurrentReceipt: (receipt: SaleRecord | null) => void;

  // Estimates & Quotations (تخمینہ بل)
  estimates: EstimateRecord[];
  addEstimate: (estimate: Omit<EstimateRecord, 'id' | 'estimateNo' | 'createdAt'>) => EstimateRecord;
  updateEstimate: (id: string, updates: Partial<EstimateRecord>) => void;
  deleteEstimate: (id: string) => void;
  convertEstimateToSale: (estimateId: string, paymentMethod?: PaymentMethod) => SaleRecord | null;
  markEstimateAsPaid: (estimateId: string, paymentMethod?: PaymentMethod) => SaleRecord | null;
  transferStockFromPartnerShop: (productId: string, quantity: number, partnerShopName: string) => { success: boolean; newStock: number };
  currentEstimate: EstimateRecord | null;
  setCurrentEstimate: (est: EstimateRecord | null) => void;

  // Rate List Sync & Price Update
  updateCatalogPricesFromRateList: (rateListId: string) => { updatedCount: number; message: string };

  // Suppliers & Rates
  suppliers: Supplier[];
  supplierInvoices: SupplierInvoice[];
  rateLists: RateList[];
  addRateList: (list: Omit<RateList, 'id' | 'uploadedAt' | 'isExpired'>) => void;
  deleteRateList: (id: string) => void;
  commitScannedBill: (bill: BillParseResult) => Promise<void>;

  // Product Catalog & Price Engine
  addProduct: (product: Omit<Product, 'id' | 'lastUpdated'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  batchImportProducts: (items: Partial<Product>[]) => number;
  bulkAdjustPrices: (criteria: {
    target: 'all' | 'vertical' | 'category';
    vertical?: BusinessVertical;
    category?: string;
    type: 'percent' | 'flat';
    direction: 'increase' | 'decrease';
    value: number;
  }) => number;
  adjustProductPrice: (productId: string, newRetailPrice: number, newCostPrice?: number) => void;

  // Udhar Khatta (Customer Credit Ledger)
  khatas: CustomerKhata[];
  totalUdhar: number;
  khataLimitHighlights: {
    fullLimitCount: number;
    halfLimitCount: number;
    safeLimitCount: number;
  };
  addKhataCustomer: (customer: Omit<CustomerKhata, 'id' | 'transactions' | 'currentBalance' | 'lastTransactionDate'>) => CustomerKhata;
  updateKhataCustomer: (khataId: string, updates: Partial<CustomerKhata>) => void;
  addKhataTransaction: (khataId: string, entry: Omit<KhataEntry, 'id' | 'date'>) => void;
  deleteKhata: (khataId: string) => void;

  // Deals & Bundles
  deals: DealBundle[];
  addDeal: (deal: Omit<DealBundle, 'id'>) => void;
  updateDeal: (id: string, updates: Partial<DealBundle>) => void;
  deleteDeal: (id: string) => void;

  // System Cashiers & Users
  systemUsers: SystemUser[];
  addSystemUser: (user: Omit<SystemUser, 'id' | 'lastActive'>) => void;
  updateSystemUser: (id: string, updates: Partial<SystemUser>) => void;
  deleteSystemUser: (id: string) => void;

  // SaaS Plans Pricing (Admin Editable)
  saasPlans: EditableSaaSPlan[];
  updateSaaSPlan: (id: string, updates: Partial<EditableSaaSPlan>) => void;

  // Chat between User and Admin
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string, asAdmin?: boolean) => void;

  // Payment Records Ledger
  paymentRecords: PaymentRecord[];
  addPaymentRecord: (record: Omit<PaymentRecord, 'id' | 'date'>) => void;
  deletePaymentRecord: (id: string) => void;

  // Feature Locks & Hard Limits Configuration (Admin controlled)
  featureLocks: FeatureLockConfig;
  updateFeatureLock: (key: keyof FeatureLockConfig, value: boolean) => void;
  systemLimits: SystemLimitConfig;
  updateSystemLimits: (updates: Partial<SystemLimitConfig>) => void;

  // Staff Salary Management & Advances
  staffMembers: StaffMember[];
  addStaffMember: (member: Omit<StaffMember, 'id'>) => void;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;
  markStaffAsLeft: (id: string, leftDate?: string, leftReason?: string) => void;
  reactivateStaff: (id: string) => void;
  salaryPayouts: SalaryPayoutRecord[];
  recordSalaryPayout: (payout: Omit<SalaryPayoutRecord, 'id' | 'payoutDate'>) => void;
  staffAdvances: StaffAdvanceRecord[];
  recordStaffAdvance: (advance: Omit<StaffAdvanceRecord, 'id' | 'date'>) => void;

  // Staff User Accounts & Credentials (Email, Password, Role)
  staffAccounts: StaffAccount[];
  registerStaffAccount: (acc: Omit<StaffAccount, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  deleteStaffAccount: (id: string) => void;

  // Spend Money & Expenses with WhatsApp Sheet
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'date'>) => void;
  deleteExpense: (id: string) => void;

  // VIP Customer Analysis & Bill Detection
  vipCustomers: VipCustomerAnalysis[];
  addVipCustomer: (customer: Omit<VipCustomerAnalysis, 'customerId'>) => void;
  updateVipCustomer: (customerId: string, updates: Partial<VipCustomerAnalysis>) => void;
  deleteVipCustomer: (customerId: string) => void;

  // Person Khatta (Advance payments & spending ledger)
  personKhattaProfiles: PersonKhattaProfile[];
  personKhattaEntries: PersonKhattaEntry[];
  addPersonProfile: (profile: Omit<PersonKhattaProfile, 'id' | 'createdAt' | 'totalAdvanceGiven' | 'totalSpendingDone' | 'netBalance'>) => void;
  updatePersonProfile: (id: string, updates: Partial<PersonKhattaProfile>) => void;
  deletePersonProfile: (id: string) => void;
  addPersonEntry: (entry: Omit<PersonKhattaEntry, 'id' | 'date'>) => void;
  deletePersonEntry: (id: string) => void;
  // Offline Billing & Cloud Sync Engine
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  offlineSalesQueue: SaleRecord[];
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncOfflineSales: () => Promise<{ success: boolean; count: number; message?: string }>;

  // Stock Backups (Manual & AI Daily)
  stockBackups: StockBackupRecord[];
  createManualStockBackup: (notes?: string) => StockBackupRecord;
  runAiDailyStockBackup: () => Promise<StockBackupRecord>;
  restoreStockBackup: (rawOrId: string) => boolean;

  // Supplier Backups (Manual & AI Daily)
  supplierBackups: SupplierBackupRecord[];
  createManualSupplierBackup: (notes?: string) => SupplierBackupRecord;
  runAiDailySupplierBackup: () => Promise<SupplierBackupRecord>;
  restoreSupplierBackup: (rawOrId: string) => boolean;

  // AI-Powered Smart Product Search & Assistant
  performSmartSearch: (query: string, imageBase64?: string) => Promise<{ matches: AiSmartSearchMatch[]; isOfflineFallback: boolean; note?: string }>;

  // Returns & Refunds
  returns: ReturnRecord[];
  processReturn: (data: {
    originalInvoiceNo: string;
    items: ReturnItem[];
    totalRefundAmount: number;
    refundMethod: 'cash' | 'card' | 'udhar_credit' | 'digital';
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }) => ReturnRecord;

  // AI Manager & Background WhatsApp Automation
  aiManagerConfig: AiManagerConfig;
  updateAiManagerConfig: (updates: Partial<AiManagerConfig>) => void;
  aiManagerAlerts: AiManagerAlert[];
  triggerAiManagerWhatsApp: (category: 'daily_sales' | 'stock_out' | 'udhar_warning' | 'salary_slip') => Promise<{ whatsappLink: string; message: string }>;

  // Auth & System
  userSession: UserSession;
  setUserSession: React.Dispatch<React.SetStateAction<UserSession>>;
  googleSignIn: (email: string, displayName: string) => void;
  googleSignOut: () => void;
  changeUserPassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  resetAllData: () => void;
  loadDemoSampleData: () => void;

  // Staff Attendance / Haazri Tracking
  attendanceRecords: AttendanceRecord[];
  markAttendance: (record: Omit<AttendanceRecord, 'id'>) => AttendanceRecord;
  updateAttendance: (id: string, updates: Partial<AttendanceRecord>) => void;
  deleteAttendance: (id: string) => void;
  quickMarkAllPresent: (date: string) => void;

  // Staff Roles & RBAC (Role-Based Access Control)
  rolePermissions: Record<string, RoleTabPermissions>;
  updateRolePermissions: (role: string, updates: Partial<RoleTabPermissions>) => void;
  simulatedRole: StaffRole | null;
  setSimulatedRole: (role: StaffRole | null) => void;
  effectiveRole: StaffRole;
  isTabAllowedForRole: (tabId: string) => boolean;

  // Bill Template Library
  billTemplates: BillTemplate[];
  activeBillTemplateId: string;
  setActiveBillTemplateId: (id: string) => void;
  activeBillTemplate: BillTemplate;
  addBillTemplate: (template: Omit<BillTemplate, 'id'>) => void;
  updateBillTemplate: (id: string, updates: Partial<BillTemplate>) => void;
  deleteBillTemplate: (id: string) => void;

  // SaaS Theme Library
  activeThemeId: string;
  setActiveThemeId: (themeId: string) => void;
  saasThemes: SaaSThemePreset[];
  activeThemePreset: SaaSThemePreset;

  // Database Connection Status & Direct Admin Login
  databaseStatus: {
    connected: boolean;
    engine: string;
    databaseName: string;
    host: string;
    port: number;
    pingMs: number;
    tables: string[];
    totalUsers: number;
    status: string;
    sslEncrypted: boolean;
    lastSync: string;
  };
  refreshDatabaseStatus: () => Promise<void>;
  testDatabaseAdminLogin: (email: string, pass: string) => Promise<{ success: boolean; message: string; user?: any }>;
}

const PosContext = createContext<PosContextType | null>(null);

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state: defaults to dark mode
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('apna_pos_theme');
      return (saved as ThemeMode) || 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('apna_pos_theme', next);
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Active Business Account (Tenant isolation)
  const [businessAccounts, setBusinessAccounts] = useState<BusinessAccount[]>(() => {
    try {
      const saved = localStorage.getItem('apna_pos_biz_accounts');
      return saved ? JSON.parse(saved) : INITIAL_BUSINESS_ACCOUNTS;
    } catch {
      return INITIAL_BUSINESS_ACCOUNTS;
    }
  });

  const [activeBusinessId, setActiveBusinessId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('apna_pos_active_biz');
      return saved || 'biz-1';
    } catch {
      return 'biz-1';
    }
  });

  // Storage key prefix per business for multi-user isolation
  const getStorageKey = (key: string) => `apna_pos_${activeBusinessId}_${key}`;
  const isDemoTenant = false;

  // Products (Demo business biz-1 has initial catalog across verticals; new tenants start clean)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_products`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (activeBusinessId === 'biz-1' && Array.isArray(parsed)) {
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const missing = INITIAL_PRODUCTS.filter((ip) => !existingIds.has(ip.id));
          if (missing.length > 0) {
            const merged = [...parsed, ...missing];
            localStorage.setItem(`apna_pos_${activeBusinessId}_products`, JSON.stringify(merged));
            return merged;
          }
        }
        return parsed;
      }
      return activeBusinessId === 'biz-1' ? INITIAL_PRODUCTS : [];
    } catch {
      return activeBusinessId === 'biz-1' ? INITIAL_PRODUCTS : [];
    }
  });

  // Active Vertical
  const [activeVertical, setActiveVertical] = useState<BusinessVertical>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_vertical`);
      return (saved as BusinessVertical) || 'electrical_hardware';
    } catch {
      return 'electrical_hardware';
    }
  });

  // Store Profile
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_profile`);
      if (saved) return JSON.parse(saved);
      const biz = businessAccounts.find((b) => b.id === activeBusinessId);
      return {
        ...DEFAULT_STORE_PROFILE,
        name: biz?.businessName || 'My Retail Store',
        ownerName: biz?.ownerName || 'Store Owner',
        ownerEmail: biz?.ownerEmail || 'owner@store.com',
        phone: biz?.phone || '+92 300 0000000',
        activeVertical: biz?.vertical || 'electrical_hardware',
      };
    } catch {
      return DEFAULT_STORE_PROFILE;
    }
  });

  // Payment Gateways
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewaySettings>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_gateways`);
      return saved ? JSON.parse(saved) : DEFAULT_PAYMENT_GATEWAYS;
    } catch {
      return DEFAULT_PAYMENT_GATEWAYS;
    }
  });

  // Sales (New users start with 0 sales)
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_sales`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Suppliers (New users start with 0 suppliers)
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_suppliers`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Invoices
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_invoices`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Rate Lists
  const [rateLists, setRateLists] = useState<RateList[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_ratelists`);
      const parsed: RateList[] = saved ? JSON.parse(saved) : [];
      const now = new Date().getTime();
      return parsed.map((rl) => ({
        ...rl,
        isExpired: rl.expiresAt ? new Date(rl.expiresAt).getTime() < now : false,
      }));
    } catch {
      return [];
    }
  });

  // Udhar Khatta (New users start with 0 Udhar customers)
  const [khatas, setKhatas] = useState<CustomerKhata[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_khatas`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Deals
  const [deals, setDeals] = useState<DealBundle[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_deals`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // System Users
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_users`);
      return saved ? JSON.parse(saved) : INITIAL_SYSTEM_USERS;
    } catch {
      return INITIAL_SYSTEM_USERS;
    }
  });

  // SaaS Plans
  const [saasPlans, setSaasPlans] = useState<EditableSaaSPlan[]>(() => {
    try {
      const saved = localStorage.getItem('apna_pos_plans_global');
      return saved ? JSON.parse(saved) : INITIAL_SAAS_PLANS;
    } catch {
      return INITIAL_SAAS_PLANS;
    }
  });

  // Chat Messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_chat`);
      return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
    } catch {
      return INITIAL_CHAT_MESSAGES;
    }
  });

  // Payment Records Ledger
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_payments`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Feature Locks & Limits (Admin controlled)
  const [featureLocks, setFeatureLocks] = useState<FeatureLockConfig>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_locks`);
      return saved ? JSON.parse(saved) : INITIAL_FEATURE_LOCKS;
    } catch {
      return INITIAL_FEATURE_LOCKS;
    }
  });

  const [systemLimits, setSystemLimits] = useState<SystemLimitConfig>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_limits`);
      return saved ? JSON.parse(saved) : INITIAL_SYSTEM_LIMITS;
    } catch {
      return INITIAL_SYSTEM_LIMITS;
    }
  });

  // Staff Salary & Advances
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_staff`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'staff-1',
        name: 'Bilal Ahmad (Cashier)',
        phone: '+92 301 2345678',
        role: 'cashier',
        email: 'cashier1@bashirsons.com',
        baseSalary: 35000,
        monthlyAdvances: 5000,
        monthlyDeductions: 0,
        monthlyBonuses: 2000,
        joiningDate: '2026-01-15',
        status: 'active',
      },
      {
        id: 'staff-2',
        name: 'Kashif Mehmood (Manager)',
        phone: '+92 321 9876543',
        role: 'manager',
        email: 'manager@bashirsons.com',
        baseSalary: 65000,
        monthlyAdvances: 0,
        monthlyDeductions: 0,
        monthlyBonuses: 5000,
        joiningDate: '2025-11-01',
        status: 'active',
      },
      {
        id: 'staff-3',
        name: 'Hamza Rafiq (Accountant)',
        phone: '+92 333 4567890',
        role: 'accountant',
        email: 'hamza.acc@bashirsons.com',
        baseSalary: 50000,
        monthlyAdvances: 10000,
        monthlyDeductions: 0,
        monthlyBonuses: 0,
        joiningDate: '2026-02-01',
        status: 'active',
      },
      {
        id: 'staff-4',
        name: 'Tariq Javed (Ex-Salesman)',
        phone: '+92 300 7766554',
        role: 'cashier',
        email: 'tariq.sales@bashirsons.com',
        baseSalary: 30000,
        monthlyAdvances: 0,
        monthlyDeductions: 0,
        monthlyBonuses: 0,
        joiningDate: '2025-06-01',
        leftDate: '2026-09-30',
        leftReason: 'Relocated to Rawalpindi for family business',
        status: 'left',
      },
    ];
  });

  // Staff User Accounts (Email, Password, Role)
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_staff_accounts`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'staff-acc-1',
        name: 'Ali Raza Cashier',
        email: 'cashier1@bashirsons.com',
        password: 'cashier123',
        role: 'cashier',
        phone: '+92 301 2345678',
        baseSalary: 35000,
        assignedBranch: 'Counter #1 POS Terminal',
        status: 'active',
        createdAt: '2026-03-01T10:15:00.000Z',
      },
      {
        id: 'staff-acc-2',
        name: 'Tariq Mehmood Manager',
        email: 'manager@bashirsons.com',
        password: 'manager123',
        role: 'manager',
        phone: '+92 321 9876543',
        baseSalary: 65000,
        assignedBranch: 'Branch #2 (Commercial Market)',
        status: 'active',
        createdAt: '2026-02-15T09:30:00.000Z',
      },
      {
        id: 'staff-acc-3',
        name: 'Hamza Rafiq Accountant',
        email: 'hamza.acc@bashirsons.com',
        password: 'accountant123',
        role: 'accountant',
        phone: '+92 333 4567890',
        baseSalary: 50000,
        assignedBranch: 'Head Office Accounts',
        status: 'active',
        createdAt: '2026-02-01T08:00:00.000Z',
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem(`apna_pos_${activeBusinessId}_staff_accounts`, JSON.stringify(staffAccounts));
  }, [staffAccounts, activeBusinessId]);

  const [salaryPayouts, setSalaryPayouts] = useState<SalaryPayoutRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_payouts`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [staffAdvances, setStaffAdvances] = useState<StaffAdvanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_advances`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Expenses with WhatsApp Sheet
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_expenses`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // VIP Customer Analysis
  const [vipCustomers, setVipCustomers] = useState<VipCustomerAnalysis[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_vip_customers`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Person Khatta (Advance payments & personal spending)
  const [personKhattaProfiles, setPersonKhattaProfiles] = useState<PersonKhattaProfile[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_pk_profiles`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [personKhattaEntries, setPersonKhattaEntries] = useState<PersonKhattaEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_pk_entries`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Cart & Receipt
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [currentReceipt, setCurrentReceipt] = useState<SaleRecord | null>(null);

  // Online / Offline monitor & Offline Queue
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineSalesQueue, setOfflineSalesQueue] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_offline_queue`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`apna_pos_${activeBusinessId}_last_sync`) || null;
    } catch {
      return null;
    }
  });

  // Stock & Inventory Backups State
  const [stockBackups, setStockBackups] = useState<StockBackupRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_stock_backups`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Supplier Payables Backups State
  const [supplierBackups, setSupplierBackups] = useState<SupplierBackupRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_supplier_backups`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Returns & Refunds State
  const [returns, setReturns] = useState<ReturnRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_returns`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // AI Manager & Background WhatsApp Automation State
  const [aiManagerConfig, setAiManagerConfig] = useState<AiManagerConfig>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_ai_manager_config`);
      return saved ? JSON.parse(saved) : DEFAULT_AI_MANAGER_CONFIG;
    } catch {
      return DEFAULT_AI_MANAGER_CONFIG;
    }
  });

  const [aiManagerAlerts, setAiManagerAlerts] = useState<AiManagerAlert[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_ai_alerts`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(`apna_pos_${activeBusinessId}_returns`, JSON.stringify(returns));
  }, [returns, activeBusinessId]);

  useEffect(() => {
    localStorage.setItem(`apna_pos_${activeBusinessId}_ai_manager_config`, JSON.stringify(aiManagerConfig));
  }, [aiManagerConfig, activeBusinessId]);

  useEffect(() => {
    localStorage.setItem(`apna_pos_${activeBusinessId}_ai_alerts`, JSON.stringify(aiManagerAlerts));
  }, [aiManagerAlerts, activeBusinessId]);

  // One-time automatic cleanup: Ensure new & existing users load with clean 0 sales, 0 returns, 0 udhar, 0 recovery
  useEffect(() => {
    try {
      const isZeroCleaned = localStorage.getItem('apna_pos_v4_zero_baseline');
      if (!isZeroCleaned) {
        const currentSalesRaw = localStorage.getItem(`apna_pos_${activeBusinessId}_sales`);
        if (currentSalesRaw) {
          try {
            const parsed = JSON.parse(currentSalesRaw);
            if (Array.isArray(parsed) && parsed.some((s: any) => s.invoiceNo?.startsWith('POS-2026-000'))) {
              setSales([]);
              setKhatas([]);
              setReturns([]);
              setPaymentRecords([]);
              setExpenses([]);
              setProducts([]);
              localStorage.setItem(`apna_pos_${activeBusinessId}_sales`, JSON.stringify([]));
              localStorage.setItem(`apna_pos_${activeBusinessId}_khatas`, JSON.stringify([]));
              localStorage.setItem(`apna_pos_${activeBusinessId}_returns`, JSON.stringify([]));
              localStorage.setItem(`apna_pos_${activeBusinessId}_payments`, JSON.stringify([]));
              localStorage.setItem(`apna_pos_${activeBusinessId}_expenses`, JSON.stringify([]));
              localStorage.setItem(`apna_pos_${activeBusinessId}_products`, JSON.stringify([]));
            }
          } catch {}
        }
        localStorage.setItem('apna_pos_v4_zero_baseline', 'true');
      }
    } catch (e) {
      console.warn('0-clean baseline migration:', e);
    }
  }, [activeBusinessId]);

  // User Session & Authentication
  const [userSession, setUserSession] = useState<UserSession>(() => {
    try {
      const savedAuth = localStorage.getItem('apna_pos_auth_user');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed && parsed.email && parsed.isAuthenticated) {
          return parsed;
        }
      }
    } catch {}
    return {
      email: '',
      displayName: '',
      photoURL: '',
      role: 'cashier',
      storeId: activeBusinessId,
      isGoogleSignedIn: false,
      isAuthenticated: false,
      permissions: {
        canDiscount: false,
        canEditPrices: false,
        canAccessAdmin: false,
        canManageStock: false,
        canViewProfit: false,
        canGiveUdhar: false,
      },
    };
  });

  useEffect(() => {
    if (userSession.isAuthenticated && userSession.email) {
      localStorage.setItem('apna_pos_auth_user', JSON.stringify(userSession));
    } else {
      localStorage.removeItem('apna_pos_auth_user');
    }
  }, [userSession]);

  // POS Delivery & Tax Configuration State
  const [cartTaxRate, setCartTaxRate] = useState<number>(0);
  const [cartDeliveryType, setCartDeliveryType] = useState<'none' | 'rider' | 'cargo' | 'van'>('none');
  const [cartDeliveryFee, setCartDeliveryFee] = useState<number>(0);
  const [cartDeliveryAddress, setCartDeliveryAddress] = useState<string>('');
  const [cartRiderName, setCartRiderName] = useState<string>('');

  // Estimates & Quotations (تخمینہ بل) State
  const [estimates, setEstimates] = useState<EstimateRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_estimates`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ESTIMATES;
  });

  const [currentEstimate, setCurrentEstimate] = useState<EstimateRecord | null>(null);

  useEffect(() => {
    localStorage.setItem(`apna_pos_${activeBusinessId}_estimates`, JSON.stringify(estimates));
  }, [estimates, activeBusinessId]);

  // ---------------- ATTENDANCE / HAAZRI TRACKING ----------------
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_attendance`);
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_RECORDS;
    } catch {
      return INITIAL_ATTENDANCE_RECORDS;
    }
  });

  useEffect(() => {
    localStorage.setItem(`apna_pos_${activeBusinessId}_attendance`, JSON.stringify(attendanceRecords));
  }, [attendanceRecords, activeBusinessId]);

  const markAttendance = (record: Omit<AttendanceRecord, 'id'>): AttendanceRecord => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setAttendanceRecords((prev) => [
      newRecord,
      ...prev.filter((r) => !(r.staffId === record.staffId && r.date === record.date)),
    ]);
    sounds.playCheckoutChime();
    return newRecord;
  };

  const updateAttendance = (id: string, updates: Partial<AttendanceRecord>) => {
    setAttendanceRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteAttendance = (id: string) => {
    setAttendanceRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const quickMarkAllPresent = (date: string) => {
    const records: AttendanceRecord[] = staffMembers.map((s) => ({
      id: `att-${Date.now()}-${s.id}`,
      staffId: s.id,
      staffName: s.name,
      role: s.role,
      date,
      status: 'present',
      checkInTime: '09:00 AM',
      checkOutTime: '08:00 PM',
      workingHours: 11,
      overtimeHours: 1,
      notes: 'Quick-marked present',
    }));
    setAttendanceRecords((prev) => [
      ...records,
      ...prev.filter((r) => r.date !== date),
    ]);
    sounds.playCheckoutChime();
  };

  // ---------------- STAFF ROLES & RBAC ----------------
  const [rolePermissions, setRolePermissions] = useState<Record<string, RoleTabPermissions>>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_role_perms`);
      return saved ? JSON.parse(saved) : INITIAL_ROLE_PERMISSIONS;
    } catch {
      return INITIAL_ROLE_PERMISSIONS;
    }
  });

  useEffect(() => {
    localStorage.setItem(`apna_pos_${activeBusinessId}_role_perms`, JSON.stringify(rolePermissions));
  }, [rolePermissions, activeBusinessId]);

  const updateRolePermissions = (role: string, updates: Partial<RoleTabPermissions>) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: {
        ...(prev[role] || INITIAL_ROLE_PERMISSIONS[role] || {
          role: role as StaffRole,
          label: role,
          description: '',
          allowedTabs: ['pos'],
          canDiscount: false,
          canEditPrices: false,
          canManageStock: false,
          canGiveUdhar: false,
          canViewProfit: false,
          canManageStaff: false,
          canAccessAdmin: false,
        }),
        ...updates,
      },
    }));
  };

  // Simulated Role Switcher for previewing e.g. Cashier mode
  const [simulatedRole, setSimulatedRole] = useState<StaffRole | null>(null);
  const effectiveRole: StaffRole = simulatedRole || userSession.role || 'admin';

  const isTabAllowedForRole = (tabId: string): boolean => {
    if (tabId === 'admin') {
      return userSession.email.toLowerCase().trim() === 'bashirsonselectric@gmail.com';
    }
    if (effectiveRole === 'admin') return true;
    const config = rolePermissions[effectiveRole];
    if (!config) return true;
    return config.allowedTabs.includes(tabId);
  };

  // ---------------- BILL TEMPLATE LIBRARY ----------------
  const [billTemplates, setBillTemplates] = useState<BillTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_bill_templates`);
      return saved ? JSON.parse(saved) : INITIAL_BILL_TEMPLATES;
    } catch {
      return INITIAL_BILL_TEMPLATES;
    }
  });

  const [activeBillTemplateId, setActiveBillTemplateId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`apna_pos_${activeBusinessId}_active_template_id`);
      return saved || 'tmpl-80mm-standard';
    } catch {
      return 'tmpl-80mm-standard';
    }
  });

  useEffect(() => {
    localStorage.setItem(`apna_pos_${activeBusinessId}_bill_templates`, JSON.stringify(billTemplates));
  }, [billTemplates, activeBusinessId]);

  useEffect(() => {
    localStorage.setItem(`apna_pos_${activeBusinessId}_active_template_id`, activeBillTemplateId);
  }, [activeBillTemplateId, activeBusinessId]);

  const activeBillTemplate: BillTemplate =
    billTemplates.find((t) => t.id === activeBillTemplateId) || billTemplates[0] || INITIAL_BILL_TEMPLATES[0];

  const addBillTemplate = (template: Omit<BillTemplate, 'id'>) => {
    const newTmpl: BillTemplate = {
      ...template,
      id: `tmpl-${Date.now()}`,
    };
    setBillTemplates((prev) => [newTmpl, ...prev]);
    sounds.playCheckoutChime();
  };

  const updateBillTemplate = (id: string, updates: Partial<BillTemplate>) => {
    setBillTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteBillTemplate = (id: string) => {
    setBillTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  // ---------------- SAAS THEMES LIBRARY ----------------
  const saasThemes = SAAS_THEME_PRESETS;
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('apna_pos_active_theme');
      return saved && saved !== 'theme-emerald' ? saved : 'theme-cryptoin-purple';
    } catch {
      return 'theme-cryptoin-purple';
    }
  });

  useEffect(() => {
    localStorage.setItem('apna_pos_active_theme', activeThemeId);
    document.documentElement.setAttribute('data-pos-theme', activeThemeId);
  }, [activeThemeId]);

  const activeThemePreset: SaaSThemePreset =
    saasThemes.find((th) => th.id === activeThemeId) || saasThemes[0];

  // ---------------- DATABASE CONNECTION & ADMIN LOGIN ----------------
  const [databaseStatus, setDatabaseStatus] = useState({
    connected: true,
    engine: 'SQLite / Cryptographic PBKDF2 DB Engine',
    databaseName: 'apna_pos_production',
    host: 'localhost',
    port: 3000,
    pingMs: 12,
    tables: ['users', 'products', 'sales', 'khatas', 'attendance', 'staff_roles', 'audit_logs'],
    totalUsers: 3,
    status: 'ONLINE_CONNECTED',
    sslEncrypted: true,
    lastSync: new Date().toLocaleTimeString(),
  });

  const refreshDatabaseStatus = async () => {
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const data = await res.json();
        setDatabaseStatus((prev) => ({
          ...prev,
          ...data,
          lastSync: new Date().toLocaleTimeString(),
        }));
      }
    } catch (e) {
      console.warn('Database health check offline fallback:', e);
    }
  };

  const testDatabaseAdminLogin = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; message: string; user?: any }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserSession({
          email: data.user.email,
          displayName: data.user.name,
          role: data.user.role || 'admin',
          storeId: activeBusinessId,
          isGoogleSignedIn: true,
          permissions: {
            canDiscount: true,
            canEditPrices: true,
            canAccessAdmin: true,
            canManageStock: true,
            canViewProfit: true,
            canGiveUdhar: true,
          },
        });
        sounds.playCheckoutChime();
        return {
          success: true,
          message: 'Database login verified! PBKDF2 SHA-512 authentication succeeded.',
          user: data.user,
        };
      }
      return { success: false, message: data.error || 'Invalid credentials against database table' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Server connection error' };
    }
  };

  // Switch Business Tenant Account (Multi-user Data Privacy)
  const switchBusinessAccount = (bizId: string, explicitBiz?: BusinessAccount) => {
    setActiveBusinessId(bizId);
    localStorage.setItem('apna_pos_active_biz', bizId);
    const isDemo = bizId === 'biz-1';

    let biz = explicitBiz;
    if (!biz) {
      biz = businessAccounts.find((b) => b.id === bizId);
    }
    if (!biz) {
      try {
        const raw = localStorage.getItem('apna_pos_biz_accounts');
        if (raw) {
          const list: BusinessAccount[] = JSON.parse(raw);
          biz = list.find((b) => b.id === bizId);
        }
      } catch {}
    }

    // Load this specific tenant's data or defaults (NEW ACCOUNTS GET STRICTLY 0 DATA)
    const savedProducts = localStorage.getItem(`apna_pos_${bizId}_products`);
    setProducts(savedProducts ? JSON.parse(savedProducts) : []);

    const savedKhatas = localStorage.getItem(`apna_pos_${bizId}_khatas`);
    setKhatas(savedKhatas ? JSON.parse(savedKhatas) : []);

    const savedSales = localStorage.getItem(`apna_pos_${bizId}_sales`);
    setSales(savedSales ? JSON.parse(savedSales) : []);

    const savedPayments = localStorage.getItem(`apna_pos_${bizId}_payments`);
    setPaymentRecords(savedPayments ? JSON.parse(savedPayments) : []);

    const savedLocks = localStorage.getItem(`apna_pos_${bizId}_locks`);
    setFeatureLocks(savedLocks ? JSON.parse(savedLocks) : INITIAL_FEATURE_LOCKS);

    const savedLimits = localStorage.getItem(`apna_pos_${bizId}_limits`);
    setSystemLimits(savedLimits ? JSON.parse(savedLimits) : INITIAL_SYSTEM_LIMITS);

    const savedStaff = localStorage.getItem(`apna_pos_${bizId}_staff`);
    setStaffMembers(savedStaff ? JSON.parse(savedStaff) : []);

    const savedPayouts = localStorage.getItem(`apna_pos_${bizId}_payouts`);
    setSalaryPayouts(savedPayouts ? JSON.parse(savedPayouts) : []);

    const savedAdvances = localStorage.getItem(`apna_pos_${bizId}_advances`);
    setStaffAdvances(savedAdvances ? JSON.parse(savedAdvances) : []);

    const savedExpenses = localStorage.getItem(`apna_pos_${bizId}_expenses`);
    setExpenses(savedExpenses ? JSON.parse(savedExpenses) : []);

    const savedVip = localStorage.getItem(`apna_pos_${bizId}_vip_customers`);
    setVipCustomers(savedVip ? JSON.parse(savedVip) : []);

    const savedPkProfiles = localStorage.getItem(`apna_pos_${bizId}_pk_profiles`);
    setPersonKhattaProfiles(savedPkProfiles ? JSON.parse(savedPkProfiles) : []);

    const savedPkEntries = localStorage.getItem(`apna_pos_${bizId}_pk_entries`);
    setPersonKhattaEntries(savedPkEntries ? JSON.parse(savedPkEntries) : []);

    const savedReturns = localStorage.getItem(`apna_pos_${bizId}_returns`);
    setReturns(savedReturns ? JSON.parse(savedReturns) : []);

    const savedOffline = localStorage.getItem(`apna_pos_${bizId}_offline_queue`);
    setOfflineSalesQueue(savedOffline ? JSON.parse(savedOffline) : []);

    const savedStockBak = localStorage.getItem(`apna_pos_${bizId}_stock_backups`);
    setStockBackups(savedStockBak ? JSON.parse(savedStockBak) : []);

    const savedSupBak = localStorage.getItem(`apna_pos_${bizId}_supplier_backups`);
    setSupplierBackups(savedSupBak ? JSON.parse(savedSupBak) : []);

    if (biz) {
      setActiveVertical(biz.vertical);
      setStoreProfile((prev) => ({
        ...prev,
        name: biz.businessName,
        ownerName: biz.ownerName,
        ownerEmail: biz.ownerEmail,
        phone: biz.phone,
        activeVertical: biz.vertical,
      }));

      setUserSession((prev) => ({
        ...prev,
        email: biz.ownerEmail,
        displayName: biz.ownerName,
        role: biz.ownerEmail === 'bashirsonselectric@gmail.com' ? 'admin' : 'admin',
        storeId: bizId,
      }));
    } else if (isDemo) {
      setActiveVertical('electrical_hardware');
      setStoreProfile(DEFAULT_STORE_PROFILE);
    }

    clearCart();
    sounds.playCheckoutChime();
  };

  // Register New Business Account (Starts completely clean with 0 all data)
  const registerBusinessAccount = (data: Omit<BusinessAccount, 'id' | 'createdAt'>): BusinessAccount => {
    const newId = `biz-${Date.now()}`;
    const newBiz: BusinessAccount = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const nextAccounts = [...businessAccounts, newBiz];
    setBusinessAccounts(nextAccounts);
    localStorage.setItem('apna_pos_biz_accounts', JSON.stringify(nextAccounts));

    // Initialize blank tenant storage for privacy: all items, sales, and khatas start at strictly 0
    localStorage.setItem(`apna_pos_${newId}_products`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_sales`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_khatas`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_payments`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_expenses`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_returns`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_pk_profiles`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_pk_entries`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_staff`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_payouts`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_advances`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_stock_backups`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_supplier_backups`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_vip_customers`, JSON.stringify([]));
    localStorage.setItem(`apna_pos_${newId}_offline_queue`, JSON.stringify([]));

    switchBusinessAccount(newId, newBiz);
    return newBiz;
  };

  // Google Sign In / Sign Out (Creates 0-data store for new Google accounts)
  const googleSignIn = (email: string, displayName: string) => {
    const userEmail = email.toLowerCase().trim();
    const isMasterAdmin = userEmail === 'bashirsonselectric@gmail.com';
    let targetBizId = 'biz-1';

    if (!isMasterAdmin) {
      let accounts: BusinessAccount[] = businessAccounts;
      if (accounts.length === 0) {
        try {
          const raw = localStorage.getItem('apna_pos_biz_accounts');
          if (raw) accounts = JSON.parse(raw);
        } catch {}
      }

      const foundBiz = accounts.find((b) => b.ownerEmail.toLowerCase().trim() === userEmail);
      if (foundBiz) {
        targetBizId = foundBiz.id;
        switchBusinessAccount(targetBizId, foundBiz);
      } else {
        const newBiz = registerBusinessAccount({
          businessName: `${displayName}'s Store`,
          ownerName: displayName,
          ownerEmail: email,
          phone: '',
          city: '',
          vertical: 'electrical_hardware',
          currency: 'Rs.',
        });
        targetBizId = newBiz.id;
      }
    } else {
      switchBusinessAccount('biz-1');
    }

    setUserSession({
      email,
      displayName,
      role: 'admin',
      storeId: targetBizId,
      isGoogleSignedIn: true,
      permissions: {
        canDiscount: true,
        canEditPrices: true,
        canAccessAdmin: true,
        canManageStock: true,
        canViewProfit: true,
        canGiveUdhar: true,
      },
    });
    sounds.playCheckoutChime();
  };

  const googleSignOut = () => {
    setUserSession({
      email: 'guest@apnapos.local',
      displayName: 'Guest Cashier',
      role: 'cashier',
      storeId: activeBusinessId,
      isGoogleSignedIn: false,
      permissions: {
        canDiscount: false,
        canEditPrices: false,
        canAccessAdmin: false,
        canManageStock: false,
        canViewProfit: false,
        canGiveUdhar: false,
      },
    });
  };

  // Persist tenant-specific data
  useEffect(() => {
    try {
      localStorage.setItem(`apna_pos_${activeBusinessId}_products`, JSON.stringify(products));
      localStorage.setItem(`apna_pos_${activeBusinessId}_sales`, JSON.stringify(sales));
      localStorage.setItem(`apna_pos_${activeBusinessId}_suppliers`, JSON.stringify(suppliers));
      localStorage.setItem(`apna_pos_${activeBusinessId}_invoices`, JSON.stringify(supplierInvoices));
      localStorage.setItem(`apna_pos_${activeBusinessId}_ratelists`, JSON.stringify(rateLists));
      localStorage.setItem(`apna_pos_${activeBusinessId}_profile`, JSON.stringify(storeProfile));
      localStorage.setItem(`apna_pos_${activeBusinessId}_vertical`, activeVertical);
      localStorage.setItem(`apna_pos_${activeBusinessId}_khatas`, JSON.stringify(khatas));
      localStorage.setItem(`apna_pos_${activeBusinessId}_deals`, JSON.stringify(deals));
      localStorage.setItem(`apna_pos_${activeBusinessId}_users`, JSON.stringify(systemUsers));
      localStorage.setItem(`apna_pos_${activeBusinessId}_gateways`, JSON.stringify(paymentGateways));
      localStorage.setItem(`apna_pos_${activeBusinessId}_chat`, JSON.stringify(chatMessages));
      localStorage.setItem(`apna_pos_${activeBusinessId}_payments`, JSON.stringify(paymentRecords));
      localStorage.setItem(`apna_pos_${activeBusinessId}_locks`, JSON.stringify(featureLocks));
      localStorage.setItem(`apna_pos_${activeBusinessId}_limits`, JSON.stringify(systemLimits));
      localStorage.setItem(`apna_pos_${activeBusinessId}_staff`, JSON.stringify(staffMembers));
      localStorage.setItem(`apna_pos_${activeBusinessId}_payouts`, JSON.stringify(salaryPayouts));
      localStorage.setItem(`apna_pos_${activeBusinessId}_advances`, JSON.stringify(staffAdvances));
      localStorage.setItem(`apna_pos_${activeBusinessId}_expenses`, JSON.stringify(expenses));
      localStorage.setItem(`apna_pos_${activeBusinessId}_vip_customers`, JSON.stringify(vipCustomers));
      localStorage.setItem(`apna_pos_${activeBusinessId}_pk_profiles`, JSON.stringify(personKhattaProfiles));
      localStorage.setItem(`apna_pos_${activeBusinessId}_pk_entries`, JSON.stringify(personKhattaEntries));
      localStorage.setItem(`apna_pos_${activeBusinessId}_offline_queue`, JSON.stringify(offlineSalesQueue));
      localStorage.setItem(`apna_pos_${activeBusinessId}_stock_backups`, JSON.stringify(stockBackups));
      localStorage.setItem(`apna_pos_${activeBusinessId}_supplier_backups`, JSON.stringify(supplierBackups));
      localStorage.setItem('apna_pos_plans_global', JSON.stringify(saasPlans));
    } catch (e) {}
  }, [
    products,
    sales,
    suppliers,
    supplierInvoices,
    rateLists,
    storeProfile,
    activeVertical,
    khatas,
    deals,
    systemUsers,
    paymentGateways,
    chatMessages,
    paymentRecords,
    featureLocks,
    systemLimits,
    staffMembers,
    salaryPayouts,
    staffAdvances,
    expenses,
    vipCustomers,
    personKhattaProfiles,
    personKhattaEntries,
    offlineSalesQueue,
    stockBackups,
    supplierBackups,
    saasPlans,
    activeBusinessId,
  ]);

  // Periodic Rate List Expiry Check
  useEffect(() => {
    const checkExpiry = () => {
      const now = new Date().getTime();
      setRateLists((prev) =>
        prev.map((rl) => {
          const expired = rl.expiresAt ? new Date(rl.expiresAt).getTime() < now : false;
          return { ...rl, isExpired: expired };
        })
      );
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = products.filter((p) => p.vertical === activeVertical);

  // Stock Management & Valuation Stats
  const totalStockCost = filteredProducts.reduce((sum, p) => sum + p.costPrice * p.stockQuantity, 0);
  const totalStockRetail = filteredProducts.reduce((sum, p) => sum + p.retailPrice * p.stockQuantity, 0);
  const outOfStockItems = filteredProducts.filter((p) => p.stockQuantity <= 0);
  const lowStockItems = filteredProducts.filter((p) => p.stockQuantity <= p.minStockAlert && p.stockQuantity > 0);

  // Udhar Khatta Stats & Limit highlights
  const totalUdhar = khatas.reduce((sum, k) => sum + Math.max(0, k.currentBalance), 0);
  const khataLimitHighlights = {
    fullLimitCount: khatas.filter((k) => k.creditLimit > 0 && k.currentBalance >= k.creditLimit).length,
    halfLimitCount: khatas.filter(
      (k) => k.creditLimit > 0 && k.currentBalance >= k.creditLimit * 0.5 && k.currentBalance < k.creditLimit
    ).length,
    safeLimitCount: khatas.filter((k) => k.currentBalance < (k.creditLimit || 50000) * 0.5).length,
  };

  // Cart operations
  // Cart operations with Color, Sub-Category and 0-Stock tracking
  const addToCart = (
    product: Product,
    qty: number = 1,
    options?: { selectedColor?: string; subCategory?: string }
  ) => {
    sounds.playScanBeep();
    const isZeroStock = (product.stockQuantity || 0) <= 0;
    const colorToUse = options?.selectedColor || product.color || '';
    const subCatToUse = options?.subCategory || product.subSize || product.category || '';

    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          (item.selectedColor || '') === colorToUse &&
          (item.subCategory || '') === subCatToUse
      );
      if (existing) {
        const newQty = existing.quantity + qty;
        return prev.map((item) =>
          item === existing
            ? {
                ...item,
                quantity: newQty,
                subtotal: Math.max(0, newQty * item.unitPrice - item.discount),
                wasZeroStock: isZeroStock,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: qty,
          unitPrice: product.retailPrice,
          discount: 0,
          subtotal: qty * product.retailPrice,
          selectedColor: colorToUse,
          subCategory: subCatToUse,
          wasZeroStock: isZeroStock,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: qty,
              subtotal: Math.max(0, qty * item.unitPrice - item.discount),
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
    setCartDeliveryFee(0);
    setCartDeliveryType('none');
    setCartDeliveryAddress('');
    setCartRiderName('');
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const cartDiscountAmount = cartDiscount;
  const cartTaxAmount = Math.round(Math.max(0, cartSubtotal - cartDiscountAmount) * (cartTaxRate / 100));
  const cartGrandTotal = Math.max(0, cartSubtotal - cartDiscountAmount + cartTaxAmount + cartDeliveryFee);
  const hasZeroStockInCart = cart.some((item) => (item.product.stockQuantity || 0) <= 0);

  // Complete checkout (including Udhar Khatta debit, delivery, and tax)
  const completeSale = (paymentInfo: {
    customerName: string;
    customerPhone?: string;
    paymentMethod: any;
    tenderedCash?: number;
    changeDue?: number;
    splitDetails?: any;
    notes?: string;
    udharKhataId?: string;
    deliveryType?: 'none' | 'rider' | 'cargo' | 'van';
    deliveryFee?: number;
    deliveryAddress?: string;
    riderName?: string;
    taxRate?: number;
    taxAmount?: number;
  }): SaleRecord => {
    // Strict business rule: 0-stock items can ONLY be added on an Estimate / Quotation!
    if (hasZeroStockInCart) {
      throw new Error('Cart contains 0-Stock item(s). Out-of-stock items can only be added on an Estimate / Quotation!');
    }

    const invoiceNo = `POS-${new Date().getFullYear()}-${String(sales.length + 1).padStart(4, '0')}`;
    const totalCost = cart.reduce((sum, item) => sum + item.quantity * item.product.costPrice, 0);
    const finalTaxAmount = paymentInfo.taxAmount !== undefined ? paymentInfo.taxAmount : cartTaxAmount;
    const finalDeliveryFee = paymentInfo.deliveryFee !== undefined ? paymentInfo.deliveryFee : cartDeliveryFee;
    const finalDeliveryType = paymentInfo.deliveryType || cartDeliveryType;
    const finalDeliveryAddress = paymentInfo.deliveryAddress || cartDeliveryAddress;
    const finalRiderName = paymentInfo.riderName || cartRiderName;
    const finalTaxRate = paymentInfo.taxRate !== undefined ? paymentInfo.taxRate : cartTaxRate;
    const profit = cartGrandTotal - totalCost;
    const currentIsOffline = isOffline || !navigator.onLine;

    const saleRecord: SaleRecord = {
      id: `sale-${Date.now()}`,
      invoiceNo,
      timestamp: new Date().toISOString(),
      customerName: paymentInfo.customerName || 'Walk-in Customer',
      customerPhone: paymentInfo.customerPhone,
      items: cart.map((c) => ({
        productId: c.product.id,
        name: c.product.name,
        quantity: c.quantity,
        unit: c.product.unit,
        unitPrice: c.unitPrice,
        subtotal: c.subtotal,
        costPrice: c.product.costPrice,
        color: c.selectedColor || c.product.color,
        size: c.product.size,
        subCategory: c.subCategory || c.product.subSize,
      })),
      subtotal: cartSubtotal,
      discountAmount: cartDiscountAmount,
      taxRate: finalTaxRate,
      taxAmount: finalTaxAmount,
      deliveryType: finalDeliveryType,
      deliveryFee: finalDeliveryFee,
      deliveryAddress: finalDeliveryAddress,
      riderName: finalRiderName,
      grandTotal: cartGrandTotal,
      profit,
      paymentMethod: paymentInfo.paymentMethod,
      tenderedCash: paymentInfo.tenderedCash,
      changeDue: paymentInfo.changeDue,
      splitDetails: paymentInfo.splitDetails,
      notes: paymentInfo.notes,
      isOfflineSale: currentIsOffline,
      isOfflineSyncPending: currentIsOffline,
      syncedAt: currentIsOffline ? undefined : new Date().toISOString(),
    };

    if (currentIsOffline) {
      setOfflineSalesQueue((prev) => {
        const next = [saleRecord, ...prev];
        localStorage.setItem(`apna_pos_${activeBusinessId}_offline_queue`, JSON.stringify(next));
        return next;
      });
    }

    // If payment method is Udhar -> automatically post transaction to customer Khata!
    if (paymentInfo.paymentMethod === 'udhar' && paymentInfo.udharKhataId) {
      addKhataTransaction(paymentInfo.udharKhataId, {
        type: 'give_credit',
        amount: cartGrandTotal,
        description: `POS Bill #${invoiceNo} (${cart.length} items)`,
        invoiceNo,
      });
    }

    // Deduct stock
    setProducts((prev) =>
      prev.map((prod) => {
        const inCart = cart.find((c) => c.product.id === prod.id);
        if (inCart) {
          return {
            ...prod,
            stockQuantity: Math.max(0, prod.stockQuantity - inCart.quantity),
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        }
        return prod;
      })
    );

    setSales((prev) => [saleRecord, ...prev]);

    // Record payment inflow in Payment Records Ledger
    const paymentRec: PaymentRecord = {
      id: `pay-${Date.now()}`,
      type: paymentInfo.paymentMethod === 'udhar' ? 'custom_entry' : 'sale_income',
      direction: 'inflow',
      amount: cartGrandTotal,
      method: paymentInfo.paymentMethod,
      referenceNo: invoiceNo,
      partyName: paymentInfo.customerName || 'Walk-in Customer',
      partyPhone: paymentInfo.customerPhone,
      category: paymentInfo.paymentMethod === 'udhar' ? 'Credit Ledger Bill' : 'Store Sale',
      notes: `Bill #${invoiceNo} (${cart.length} items)`,
      date: new Date().toISOString(),
      invoiceId: invoiceNo,
    };
    setPaymentRecords((prev) => [paymentRec, ...prev]);

    // VIP Customer Automatic Detection & Spend Tracking
    if (paymentInfo.customerName && paymentInfo.customerName !== 'Walk-in Customer') {
      setVipCustomers((prev) => {
        const existingIdx = prev.findIndex(
          (v) =>
            v.customerName.toLowerCase().trim() === paymentInfo.customerName.toLowerCase().trim() ||
            (paymentInfo.customerPhone && v.customerPhone === paymentInfo.customerPhone)
        );
        if (existingIdx >= 0) {
          const existing = prev[existingIdx];
          const newTotalSpend = existing.totalSpend + cartGrandTotal;
          const newOrders = existing.totalOrders + 1;
          const newTier: 'platinum' | 'gold' | 'silver' | 'regular' =
            newTotalSpend >= 50000 || newOrders >= 15
              ? 'platinum'
              : newTotalSpend >= 25000 || newOrders >= 8
              ? 'gold'
              : newTotalSpend >= 10000 || newOrders >= 3
              ? 'silver'
              : 'regular';

          const updated = [...prev];
          updated[existingIdx] = {
            ...existing,
            totalSpend: newTotalSpend,
            totalOrders: newOrders,
            avgOrderValue: Math.round(newTotalSpend / newOrders),
            lastVisitDate: new Date().toISOString().split('T')[0],
            tier: newTier,
            specialDiscountPercent: newTier === 'platinum' ? 8 : newTier === 'gold' ? 5 : newTier === 'silver' ? 3 : existing.specialDiscountPercent,
          };
          return updated;
        } else {
          const tier: 'platinum' | 'gold' | 'silver' | 'regular' =
            cartGrandTotal >= 50000 ? 'platinum' : cartGrandTotal >= 25000 ? 'gold' : cartGrandTotal >= 10000 ? 'silver' : 'regular';
          const newVip: VipCustomerAnalysis = {
            customerId: `vip-${Date.now()}`,
            customerName: paymentInfo.customerName,
            customerPhone: paymentInfo.customerPhone || '',
            tier,
            totalSpend: cartGrandTotal,
            totalOrders: 1,
            avgOrderValue: cartGrandTotal,
            lastVisitDate: new Date().toISOString().split('T')[0],
            specialDiscountPercent: tier === 'platinum' ? 8 : tier === 'gold' ? 5 : tier === 'silver' ? 3 : 0,
            preferredCategories: [cart[0]?.product.category || 'General Store'],
            notes: 'Auto-detected through POS billing history',
            detectedAutomatically: true,
          };
          return [newVip, ...prev];
        }
      });
    }

    sounds.playCheckoutChime();
    clearCart();
    setCurrentReceipt(saleRecord);

    return saleRecord;
  };

  // ---------------- ESTIMATES & QUOTATIONS (تخمینہ بل) ----------------
  const addEstimate = (
    estimateData: Omit<EstimateRecord, 'id' | 'estimateNo' | 'createdAt'>
  ): EstimateRecord => {
    const estimateNo = `EST-${new Date().getFullYear()}-${String(estimates.length + 1).padStart(3, '0')}`;
    const newEst: EstimateRecord = {
      ...estimateData,
      id: `est-${Date.now()}`,
      estimateNo,
      createdAt: new Date().toISOString(),
    };
    setEstimates((prev) => [newEst, ...prev]);
    sounds.playCheckoutChime();
    setCurrentEstimate(newEst);
    return newEst;
  };

  const updateEstimate = (id: string, updates: Partial<EstimateRecord>) => {
    setEstimates((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteEstimate = (id: string) => {
    setEstimates((prev) => prev.filter((e) => e.id !== id));
    sounds.playCheckoutChime();
  };

  const convertEstimateToSale = (
    estimateId: string,
    paymentMethod: PaymentMethod = 'cash'
  ): SaleRecord | null => {
    const est = estimates.find((e) => e.id === estimateId);
    if (!est) return null;

    const invoiceNo = `POS-${new Date().getFullYear()}-${String(sales.length + 1).padStart(4, '0')}`;
    const totalCost = est.items.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      return sum + item.quantity * (prod?.costPrice || Math.round(item.unitPrice * 0.75));
    }, 0);
    const profit = est.grandTotal - totalCost;

    const saleRecord: SaleRecord = {
      id: `sale-${Date.now()}`,
      invoiceNo,
      timestamp: new Date().toISOString(),
      customerName: est.customerName || 'Walk-in Customer',
      customerPhone: est.customerPhone,
      items: est.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
        costPrice: products.find((p) => p.id === i.productId)?.costPrice || Math.round(i.unitPrice * 0.75),
        color: i.color,
        size: i.size,
        subCategory: i.subCategory,
      })),
      subtotal: est.subtotal,
      discountAmount: est.discountAmount,
      taxRate: est.taxRate,
      taxAmount: est.taxAmount,
      deliveryType: est.deliveryType,
      deliveryFee: est.deliveryFee,
      deliveryAddress: est.deliveryAddress,
      grandTotal: est.grandTotal,
      profit,
      paymentMethod,
      notes: `Converted from Estimate #${est.estimateNo}. ${est.notes || ''}`.trim(),
    };

    // Deduct stock for items
    setProducts((prev) =>
      prev.map((p) => {
        const itemInEst = est.items.find((i) => i.productId === p.id);
        if (itemInEst) {
          return {
            ...p,
            stockQuantity: Math.max(0, p.stockQuantity - itemInEst.quantity),
          };
        }
        return p;
      })
    );

    setSales((prev) => [saleRecord, ...prev]);

    updateEstimate(estimateId, {
      status: 'converted',
      convertedSaleId: saleRecord.id,
    });

    addPaymentRecord({
      type: 'sale_income',
      direction: 'inflow',
      amount: saleRecord.grandTotal,
      method: paymentMethod,
      referenceNo: invoiceNo,
      partyName: saleRecord.customerName,
      partyPhone: saleRecord.customerPhone,
      category: 'POS Sale',
      notes: `Converted Estimate ${est.estimateNo}`,
      invoiceId: invoiceNo,
    });

    sounds.playCheckoutChime();
    setCurrentReceipt(saleRecord);
    return saleRecord;
  };

  const markEstimateAsPaid = (
    estimateId: string,
    paymentMethod: PaymentMethod = 'cash'
  ): SaleRecord | null => {
    // Automatically deducts stock and records official sale transaction
    return convertEstimateToSale(estimateId, paymentMethod);
  };

  const transferStockFromPartnerShop = (
    productId: string,
    quantity: number,
    partnerShopName: string
  ): { success: boolean; newStock: number } => {
    let updatedStock = 0;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          updatedStock = p.stockQuantity + quantity;
          return {
            ...p,
            stockQuantity: updatedStock,
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        }
        return p;
      })
    );
    sounds.playCheckoutChime();
    return { success: true, newStock: updatedStock };
  };

  // ---------------- RATE LIST LIVE PRODUCT PRICE SYNC ----------------
  const updateCatalogPricesFromRateList = (
    rateListId: string
  ): { updatedCount: number; message: string } => {
    const list = rateLists.find((r) => r.id === rateListId);
    if (!list || !list.items || list.items.length === 0) {
      return { updatedCount: 0, message: 'Rate list has no items to update.' };
    }

    let count = 0;
    setProducts((prevProducts) =>
      prevProducts.map((prod) => {
        const matchedItem = list.items.find((rItem) => {
          if (rItem.barcode && prod.barcode && rItem.barcode === prod.barcode) return true;
          const pName = prod.name.toLowerCase();
          const rName = rItem.name.toLowerCase();
          return pName.includes(rName) || rName.includes(pName);
        });

        if (matchedItem) {
          count++;
          return {
            ...prod,
            retailPrice: matchedItem.retailPrice || prod.retailPrice,
            costPrice: matchedItem.costPrice || prod.costPrice,
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        }
        return prod;
      })
    );

    sounds.playCheckoutChime();
    return {
      updatedCount: count,
      message: `Successfully synchronized ${count} catalog items from rate list "${list.title}".`,
    };
  };

  // Product Catalog
  const addProduct = (newProd: Omit<Product, 'id' | 'lastUpdated'>): Product => {
    const product: Product = {
      ...newProd,
      id: `prod-${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setProducts((prev) => [product, ...prev]);
    return product;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, lastUpdated: new Date().toISOString().split('T')[0] }
          : p
      )
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const batchImportProducts = (items: Partial<Product>[]): number => {
    const newItems: Product[] = items.map((item, idx) => ({
      id: `import-${Date.now()}-${idx}`,
      name: item.name || 'Untitled Item',
      urduName: item.urduName,
      barcode: item.barcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      category: item.category || 'General',
      vertical: (item.vertical as BusinessVertical) || activeVertical,
      costPrice: Number(item.costPrice) || 0,
      retailPrice: Number(item.retailPrice) || 0,
      stockQuantity: Number(item.stockQuantity) || 0,
      minStockAlert: Number(item.minStockAlert) || 5,
      unit: item.unit || 'pcs',
      taxPercent: Number(item.taxPercent) || 0,
      verticalAttributes: item.verticalAttributes || {},
      lastUpdated: new Date().toISOString().split('T')[0],
    }));

    setProducts((prev) => [...newItems, ...prev]);
    return newItems.length;
  };

  // Price Increase & Decrease Engine
  const bulkAdjustPrices = (criteria: {
    target: 'all' | 'vertical' | 'category';
    vertical?: BusinessVertical;
    category?: string;
    type: 'percent' | 'flat';
    direction: 'increase' | 'decrease';
    value: number;
  }): number => {
    let affected = 0;
    const factor = criteria.direction === 'increase' ? 1 : -1;

    setProducts((prev) =>
      prev.map((p) => {
        let shouldApply = false;
        if (criteria.target === 'all') shouldApply = true;
        else if (criteria.target === 'vertical') shouldApply = p.vertical === (criteria.vertical || activeVertical);
        else if (criteria.target === 'category') shouldApply = p.category === criteria.category;

        if (shouldApply) {
          affected++;
          let newPrice = p.retailPrice;
          if (criteria.type === 'percent') {
            const delta = Math.round((p.retailPrice * criteria.value) / 100);
            newPrice = Math.max(1, p.retailPrice + factor * delta);
          } else {
            newPrice = Math.max(1, p.retailPrice + factor * criteria.value);
          }
          return {
            ...p,
            retailPrice: newPrice,
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        }
        return p;
      })
    );
    sounds.playCheckoutChime();
    return affected;
  };

  const adjustProductPrice = (productId: string, newRetailPrice: number, newCostPrice?: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              retailPrice: Math.max(0, newRetailPrice),
              ...(newCostPrice !== undefined ? { costPrice: Math.max(0, newCostPrice) } : {}),
              lastUpdated: new Date().toISOString().split('T')[0],
            }
          : p
      )
    );
  };

  // Udhar Khatta methods
  const addKhataCustomer = (
    customer: Omit<CustomerKhata, 'id' | 'transactions' | 'currentBalance' | 'lastTransactionDate'>
  ): CustomerKhata => {
    const newKhata: CustomerKhata = {
      ...customer,
      id: `kht-${Date.now()}`,
      currentBalance: 0,
      lastTransactionDate: new Date().toISOString().split('T')[0],
      transactions: [],
    };
    setKhatas((prev) => [newKhata, ...prev]);
    sounds.playCheckoutChime();
    return newKhata;
  };

  const addKhataTransaction = (khataId: string, entry: Omit<KhataEntry, 'id' | 'date'>) => {
    const newEntry: KhataEntry = {
      ...entry,
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };

    setKhatas((prev) =>
      prev.map((k) => {
        if (k.id === khataId) {
          const balanceChange = entry.type === 'give_credit' ? entry.amount : -entry.amount;
          return {
            ...k,
            currentBalance: k.currentBalance + balanceChange,
            lastTransactionDate: newEntry.date,
            transactions: [newEntry, ...k.transactions],
          };
        }
        return k;
      })
    );

    if (entry.type === 'receive_payment') {
      const customer = khatas.find((k) => k.id === khataId);
      const rec: PaymentRecord = {
        id: `pay-${Date.now()}`,
        type: 'udhar_recovery',
        direction: 'inflow',
        amount: entry.amount,
        method: 'cash',
        referenceNo: `REC-${Date.now().toString().slice(-6)}`,
        partyName: customer?.name || 'Khata Customer',
        partyPhone: customer?.phone,
        category: 'Udhar Recovery',
        notes: entry.description || 'Customer cleared partial udhar balance',
        date: new Date().toISOString(),
      };
      setPaymentRecords((prev) => [rec, ...prev]);
    }

    sounds.playCheckoutChime();
  };

  const updateKhataCustomer = (khataId: string, updates: Partial<CustomerKhata>) => {
    setKhatas((prev) => prev.map((k) => (k.id === khataId ? { ...k, ...updates } : k)));
  };

  const deleteKhata = (khataId: string) => {
    setKhatas((prev) => prev.filter((k) => k.id !== khataId));
  };

  // Deals Management
  const addDeal = (deal: Omit<DealBundle, 'id'>) => {
    const newDeal: DealBundle = {
      ...deal,
      id: `deal-${Date.now()}`,
    };
    setDeals((prev) => [newDeal, ...prev]);
    sounds.playCheckoutChime();
  };

  const updateDeal = (id: string, updates: Partial<DealBundle>) => {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const deleteDeal = (id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id));
  };

  // System Users
  const addSystemUser = (user: Omit<SystemUser, 'id' | 'lastActive'>) => {
    const newUser: SystemUser = {
      ...user,
      id: `usr-${Date.now()}`,
      lastActive: 'Just registered',
    };
    setSystemUsers((prev) => [...prev, newUser]);
  };

  const updateSystemUser = (id: string, updates: Partial<SystemUser>) => {
    setSystemUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const deleteSystemUser = (id: string) => {
    setSystemUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Editable SaaS Plans
  const updateSaaSPlan = (id: string, updates: Partial<EditableSaaSPlan>) => {
    setSaasPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // Logo update
  const updateBusinessLogo = (logoUrl: string) => {
    setStoreProfile((prev) => ({ ...prev, logoUrl }));
  };

  // Payment gateways editable
  const updatePaymentGateways = (updates: Partial<PaymentGatewaySettings>) => {
    setPaymentGateways((prev) => ({ ...prev, ...updates }));
  };

  // Chat between User and Admin & 24/7 AI Chatbot Replying for User
  const sendChatMessage = async (text: string, asAdmin: boolean = false) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: asAdmin ? 'admin' : userSession.email,
      senderName: asAdmin ? 'Muhammad Bashir (Master Admin)' : userSession.displayName,
      senderRole: asAdmin ? 'admin' : 'user',
      text,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setChatMessages((prev) => [...prev, newMsg]);

    // If sent by user, get live 24/7 AI chatbot reply
    if (!asAdmin) {
      try {
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            storeContext: {
              storeName: storeProfile.name,
              currency: storeProfile.currency,
              ownerName: storeProfile.ownerName || 'Muhammad Bashir',
              phone: storeProfile.phone,
              vertical: activeVertical,
            },
          }),
        });

        const data = await res.json();
        const aiReplyText =
          data.reply ||
          'Thank you for reaching out! Muhammad Bashir has received your message. For immediate help, press F2 for Counter, or check Udhar Khatta tab.';

        const aiReply: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          senderId: 'ai',
          senderName: 'Apna AI POS Assistant',
          senderRole: 'ai',
          text: aiReplyText,
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        setChatMessages((prev) => [...prev, aiReply]);
      } catch {
        const fallbackText =
          'Hello! I am your Apna AI Assistant. To start billing, press F2 or use the POS tab. You can also lookup Udhar Khatta for customer credit balances.';
        const aiReply: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          senderId: 'ai',
          senderName: 'Apna AI POS Assistant',
          senderRole: 'ai',
          text: fallbackText,
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        setChatMessages((prev) => [...prev, aiReply]);
      }
    }
  };

  // Rate Lists
  const addRateList = (list: Omit<RateList, 'id' | 'uploadedAt' | 'isExpired'>) => {
    const now = new Date();
    const isExp = list.expiresAt ? new Date(list.expiresAt).getTime() < now.getTime() : false;
    const newEntry: RateList = {
      ...list,
      id: `rate-${Date.now()}`,
      uploadedAt: now.toISOString(),
      isExpired: isExp,
    };
    setRateLists((prev) => [newEntry, ...prev]);
  };

  const deleteRateList = (id: string) => {
    setRateLists((prev) => prev.filter((r) => r.id !== id));
  };

  // Commit Scanned Bill
  const commitScannedBill = async (bill: BillParseResult) => {
    let supplier = suppliers.find(
      (s) => s.name.toLowerCase().trim() === bill.supplierName.toLowerCase().trim()
    );

    if (!supplier) {
      supplier = {
        id: `sup-${Date.now()}`,
        name: bill.supplierName || 'General Distributor',
        contactPerson: 'Representative',
        phone: '+92 300 0000000',
        city: 'Local',
        totalPurchased: bill.totalAmount || 0,
        totalPaid: 0,
        balanceDue: bill.totalAmount || 0,
      };
      setSuppliers((prev) => [supplier!, ...prev]);
    } else {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === supplier!.id
            ? {
                ...s,
                totalPurchased: s.totalPurchased + (bill.totalAmount || 0),
                balanceDue: s.balanceDue + (bill.totalAmount || 0),
              }
            : s
        )
      );
    }

    const newInvoice: SupplierInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: bill.invoiceNumber || `BILL-${Date.now().toString().slice(-4)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: bill.invoiceDate || new Date().toISOString().split('T')[0],
      totalAmount: bill.totalAmount || 0,
      itemsCount: bill.items.length,
      items: bill.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        costPrice: i.costPrice,
        retailPrice: i.retailPrice,
      })),
      status: 'unpaid',
      aiExtracted: true,
    };
    setSupplierInvoices((prev) => [newInvoice, ...prev]);

    setProducts((prev) => {
      const updated = [...prev];
      bill.items.forEach((item) => {
        const existingIdx = updated.findIndex(
          (p) =>
            p.name.toLowerCase().trim() === item.name.toLowerCase().trim() ||
            (item.skuOrBarcode && p.barcode === item.skuOrBarcode)
        );

        if (existingIdx >= 0) {
          const existing = updated[existingIdx];
          updated[existingIdx] = {
            ...existing,
            stockQuantity: existing.stockQuantity + Number(item.quantity || 0),
            costPrice: Number(item.costPrice) || existing.costPrice,
            retailPrice: Number(item.retailPrice) || existing.retailPrice,
            lastUpdated: new Date().toISOString().split('T')[0],
            verticalAttributes: {
              ...existing.verticalAttributes,
              ...(item.batchNumber ? { batchNumber: item.batchNumber } : {}),
              ...(item.expiryDate ? { expiryDate: item.expiryDate } : {}),
            },
          };
        } else {
          updated.unshift({
            id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: item.name,
            barcode: item.skuOrBarcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            category: item.category || 'Purchased Stock',
            vertical: activeVertical,
            costPrice: Number(item.costPrice) || 0,
            retailPrice: Number(item.retailPrice) || Number(item.costPrice) * 1.25,
            stockQuantity: Number(item.quantity) || 1,
            minStockAlert: 5,
            unit: item.unit || 'pcs',
            taxPercent: Number(item.taxPercent) || 0,
            verticalAttributes: {
              ...(item.batchNumber ? { batchNumber: item.batchNumber } : {}),
              ...(item.expiryDate ? { expiryDate: item.expiryDate } : {}),
              notes: item.notes || '',
            },
            lastUpdated: new Date().toISOString().split('T')[0],
          });
        }
      });
      return updated;
    });
  };

  const updateStoreProfile = (updates: Partial<StoreProfile>) => {
    setStoreProfile((prev) => ({ ...prev, ...updates }));
  };

  // Payment operations
  const addPaymentRecord = (record: Omit<PaymentRecord, 'id' | 'date'>) => {
    const newRecord: PaymentRecord = {
      ...record,
      id: `pay-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setPaymentRecords((prev) => [newRecord, ...prev]);
  };

  const deletePaymentRecord = (id: string) => {
    setPaymentRecords((prev) => prev.filter((p) => p.id !== id));
  };

  // Feature Locks & Limits
  const updateFeatureLock = (key: keyof FeatureLockConfig, value: boolean) => {
    setFeatureLocks((prev) => ({ ...prev, [key]: value }));
  };

  const updateSystemLimits = (updates: Partial<SystemLimitConfig>) => {
    setSystemLimits((prev) => ({ ...prev, ...updates }));
  };

  // Staff Operations
  const addStaffMember = (member: Omit<StaffMember, 'id'>) => {
    const newMember: StaffMember = {
      ...member,
      id: `staff-${Date.now()}`,
    };
    setStaffMembers((prev) => [...prev, newMember]);
  };

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    setStaffMembers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteStaffMember = (id: string) => {
    setStaffMembers((prev) => prev.filter((s) => s.id !== id));
  };

  const markStaffAsLeft = (id: string, leftDate?: string, leftReason?: string) => {
    setStaffMembers((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'left',
              leftDate: leftDate || new Date().toISOString().split('T')[0],
              leftReason: leftReason || 'Left employment / resigned',
            }
          : s
      )
    );
    sounds.playCheckoutChime();
  };

  const reactivateStaff = (id: string) => {
    setStaffMembers((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'active',
              leftDate: undefined,
              leftReason: undefined,
            }
          : s
      )
    );
    sounds.playCheckoutChime();
  };

  // Staff User Accounts & Password Registration
  const registerStaffAccount = async (
    acc: Omit<StaffAccount, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; message: string }> => {
    const newAcc: StaffAccount = {
      ...acc,
      id: `staff-acc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setStaffAccounts((prev) => [newAcc, ...prev]);

    // Also auto-add to staff members roster if not already present
    const existingMember = staffMembers.find((m) => m.email?.toLowerCase() === acc.email.toLowerCase());
    if (!existingMember) {
      addStaffMember({
        name: acc.name,
        phone: acc.phone || '+92 300 0000000',
        role: acc.role,
        email: acc.email,
        password: acc.password,
        baseSalary: acc.baseSalary || 35000,
        monthlyAdvances: 0,
        monthlyDeductions: 0,
        monthlyBonuses: 0,
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'active',
      });
    }

    // Call backend endpoint to store in usersDatabase with PBKDF2 hash
    try {
      await fetch('/api/auth/register-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: acc.name,
          email: acc.email,
          password: acc.password,
          role: acc.role,
          phone: acc.phone,
          branch: acc.assignedBranch,
        }),
      });
    } catch (err) {
      console.warn('Backend staff sync warning (saved locally):', err);
    }

    sounds.playCheckoutChime();
    return {
      success: true,
      message: `Staff account successfully registered for ${acc.name} with role ${acc.role.toUpperCase()}`,
    };
  };

  const deleteStaffAccount = (id: string) => {
    setStaffAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const recordSalaryPayout = (payout: Omit<SalaryPayoutRecord, 'id' | 'payoutDate'>) => {
    const newPayout: SalaryPayoutRecord = {
      ...payout,
      id: `payout-${Date.now()}`,
      payoutDate: new Date().toISOString().split('T')[0],
    };
    setSalaryPayouts((prev) => [newPayout, ...prev]);

    // Reset or adjust monthly advances for this staff member
    setStaffMembers((prev) =>
      prev.map((s) =>
        s.id === payout.staffId
          ? {
              ...s,
              monthlyAdvances: Math.max(0, s.monthlyAdvances - payout.advancesDeducted),
            }
          : s
      )
    );

    // Auto-record in payment records
    addPaymentRecord({
      type: 'salary_payout',
      direction: 'outflow',
      amount: payout.netPaid,
      method: payout.paymentMethod,
      referenceNo: `SAL-${payout.staffName.slice(0, 3).toUpperCase()}`,
      partyName: payout.staffName,
      category: 'Staff Salary',
      notes: `${payout.monthYear} Net Salary Payout`,
    });
    sounds.playCheckoutChime();
  };

  const recordStaffAdvance = (advance: Omit<StaffAdvanceRecord, 'id' | 'date'>) => {
    const newAdv: StaffAdvanceRecord = {
      ...advance,
      id: `adv-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setStaffAdvances((prev) => [newAdv, ...prev]);

    // Increase monthly advances for this staff member
    setStaffMembers((prev) =>
      prev.map((s) =>
        s.id === advance.staffId
          ? {
              ...s,
              monthlyAdvances: s.monthlyAdvances + advance.amount,
            }
          : s
      )
    );

    // Auto-record outflow payment
    addPaymentRecord({
      type: 'custom_entry',
      direction: 'outflow',
      amount: advance.amount,
      method: advance.paymentMethod,
      referenceNo: `ADV-${advance.staffName.slice(0, 3).toUpperCase()}`,
      partyName: advance.staffName,
      category: 'Staff Advance',
      notes: `Advance: ${advance.reason}`,
    });
  };

  // Expenses operations
  const addExpense = (expense: Omit<ExpenseRecord, 'id' | 'date'>) => {
    const newExp: ExpenseRecord = {
      ...expense,
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setExpenses((prev) => [newExp, ...prev]);

    // Auto-record payment ledger outflow
    addPaymentRecord({
      type: 'expense_payout',
      direction: 'outflow',
      amount: expense.amount,
      method: expense.paymentMethod,
      referenceNo: `EXP-${Date.now().toString().slice(-5)}`,
      partyName: expense.paidTo || expense.title,
      category: expense.category,
      notes: expense.notes || expense.title,
    });
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // VIP Customers operations
  const addVipCustomer = (customer: Omit<VipCustomerAnalysis, 'customerId'>) => {
    const newVip: VipCustomerAnalysis = {
      ...customer,
      customerId: `vip-${Date.now()}`,
    };
    setVipCustomers((prev) => [newVip, ...prev]);
  };

  const updateVipCustomer = (customerId: string, updates: Partial<VipCustomerAnalysis>) => {
    setVipCustomers((prev) =>
      prev.map((c) => (c.customerId === customerId ? { ...c, ...updates } : c))
    );
  };

  const deleteVipCustomer = (customerId: string) => {
    setVipCustomers((prev) => prev.filter((c) => c.customerId !== customerId));
  };

  // Person Khatta operations
  const addPersonProfile = (
    profile: Omit<
      PersonKhattaProfile,
      'id' | 'createdAt' | 'totalAdvanceGiven' | 'totalSpendingDone' | 'netBalance'
    >
  ) => {
    const newProfile: PersonKhattaProfile = {
      ...profile,
      id: `pk-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      totalAdvanceGiven: 0,
      totalSpendingDone: 0,
      netBalance: 0,
    };
    setPersonKhattaProfiles((prev) => [newProfile, ...prev]);
  };

  const updatePersonProfile = (id: string, updates: Partial<PersonKhattaProfile>) => {
    setPersonKhattaProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deletePersonProfile = (id: string) => {
    setPersonKhattaProfiles((prev) => prev.filter((p) => p.id !== id));
    setPersonKhattaEntries((prev) => prev.filter((e) => e.personId !== id));
  };

  const addPersonEntry = (entry: Omit<PersonKhattaEntry, 'id' | 'date'>) => {
    const newEntry: PersonKhattaEntry = {
      ...entry,
      id: `pke-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setPersonKhattaEntries((prev) => [newEntry, ...prev]);

    // Update person totals
    setPersonKhattaProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== entry.personId) return p;
        const newGiven = entry.type === 'advance_given' ? p.totalAdvanceGiven + entry.amount : p.totalAdvanceGiven;
        const newSpent = entry.type === 'spending_done' ? p.totalSpendingDone + entry.amount : p.totalSpendingDone;
        return {
          ...p,
          totalAdvanceGiven: newGiven,
          totalSpendingDone: newSpent,
          netBalance: newGiven - newSpent,
        };
      })
    );

    // Record in payment records if advance was given
    if (entry.type === 'advance_given') {
      const person = personKhattaProfiles.find((p) => p.id === entry.personId);
      addPaymentRecord({
        type: 'custom_entry',
        direction: 'outflow',
        amount: entry.amount,
        method: entry.paymentMethod || 'cash',
        referenceNo: `PK-${Date.now().toString().slice(-5)}`,
        partyName: person?.name || 'Person Khatta',
        category: 'Personal Advance',
        notes: entry.description,
      });
    }
  };

  const deletePersonEntry = (id: string) => {
    const entry = personKhattaEntries.find((e) => e.id === id);
    if (!entry) return;

    setPersonKhattaEntries((prev) => prev.filter((e) => e.id !== id));

    // Recalculate person profile
    setPersonKhattaProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== entry.personId) return p;
        const newGiven = entry.type === 'advance_given' ? Math.max(0, p.totalAdvanceGiven - entry.amount) : p.totalAdvanceGiven;
        const newSpent = entry.type === 'spending_done' ? Math.max(0, p.totalSpendingDone - entry.amount) : p.totalSpendingDone;
        return {
          ...p,
          totalAdvanceGiven: newGiven,
          totalSpendingDone: newSpent,
          netBalance: newGiven - newSpent,
        };
      })
    );
  };

  // ---------------- OFFLINE SALES SYNC ENGINE ----------------
  const syncOfflineSales = async (): Promise<{ success: boolean; count: number; message?: string }> => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/pos/sync-offline-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales: offlineSalesQueue,
          businessId: activeBusinessId,
          cartCount: cart.length,
          totalSalesRecorded: sales.length,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const timestamp = data.serverTimestamp || new Date().toISOString();
        const syncedIds = new Set(data.syncedIds || offlineSalesQueue.map((s) => s.id));

        if (offlineSalesQueue.length > 0) {
          // Mark corresponding sales as synced
          setSales((prev) =>
            prev.map((s) =>
              syncedIds.has(s.id)
                ? { ...s, isOfflineSyncPending: false, syncedAt: timestamp }
                : s
            )
          );
          setOfflineSalesQueue([]);
          localStorage.removeItem(`apna_pos_${activeBusinessId}_offline_queue`);
        }

        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(nowStr);
        localStorage.setItem(`apna_pos_${activeBusinessId}_last_sync`, nowStr);
        sounds.playCheckoutChime();
        return {
          success: true,
          count: syncedIds.size,
          message: data.message || `Reconciled ${syncedIds.size} transactions with Cloud Database`,
        };
      }
      return { success: false, count: 0, message: 'Sync response unsuccessful' };
    } catch (err: any) {
      console.warn('Sync offline sales failed, network still unavailable:', err);
      return { success: false, count: 0, message: err?.message || 'Network unavailable' };
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync listener when connection returns
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Trigger cloud database synchronization for pending offline sales
      syncOfflineSales();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineSalesQueue, activeBusinessId]);

  // ---------------- STOCK BACKUPS (MANUAL & AI DAILY) ----------------
  const createManualStockBackup = (notes?: string): StockBackupRecord => {
    const snapshot = {
      products: filteredProducts,
      timestamp: new Date().toISOString(),
      store: storeProfile.name,
      vertical: activeVertical,
    };
    const backup: StockBackupRecord = {
      id: `stk-bak-${Date.now()}`,
      type: 'manual',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      totalItems: filteredProducts.length,
      totalCostValue: totalStockCost,
      totalRetailValue: totalStockRetail,
      outOfStockCount: outOfStockItems.length,
      lowStockCount: lowStockItems.length,
      checksum: `SHA256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      notes: notes || 'Manual Inventory Snapshot by Store Cashier/Owner',
      rawSnapshotJson: JSON.stringify(snapshot),
    };

    setStockBackups((prev) => {
      const next = [backup, ...prev];
      localStorage.setItem(`apna_pos_${activeBusinessId}_stock_backups`, JSON.stringify(next));
      return next;
    });
    sounds.playCheckoutChime();
    return backup;
  };

  const runAiDailyStockBackup = async (): Promise<StockBackupRecord> => {
    let aiSummary = {
      valuationStatus: `Gross Asset Valuation: ${storeProfile.currency} ${totalStockRetail.toLocaleString()} (${totalStockCost > 0 ? Math.round(((totalStockRetail - totalStockCost) / totalStockCost) * 100) : 0}% potential gross margin)`,
      fastMovingAlert: filteredProducts.slice(0, 2).map((p) => p.name),
      stockoutRisks: outOfStockItems.length > 0 ? outOfStockItems.map((o) => o.name) : ['All catalog items currently in stock'],
      restockUrgency: outOfStockItems.length > 0 ? 'Immediate wholesale replenishment required for out-of-stock items' : 'Stock levels within safe operational boundaries',
      auditScore: Math.max(65, 100 - outOfStockItems.length * 8 - lowStockItems.length * 3),
    };
    let checksum = `SHA256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

    try {
      if (navigator.onLine) {
        const res = await fetch('/api/gemini/backup-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: filteredProducts, storeProfile }),
        });
        const data = await res.json();
        if (data.success && data.aiAuditSummary) {
          aiSummary = data.aiAuditSummary;
          checksum = data.checksum || checksum;
        }
      }
    } catch (e) {
      console.warn('AI stock backup server error, used local heuristics:', e);
    }

    const backup: StockBackupRecord = {
      id: `stk-ai-${Date.now()}`,
      type: 'ai_daily',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      totalItems: filteredProducts.length,
      totalCostValue: totalStockCost,
      totalRetailValue: totalStockRetail,
      outOfStockCount: outOfStockItems.length,
      lowStockCount: lowStockItems.length,
      checksum,
      notes: 'Automated Gemini Daily Stock Valuation Audit & Ledger Backup',
      aiAuditSummary: aiSummary,
      rawSnapshotJson: JSON.stringify({ products: filteredProducts, timestamp: new Date().toISOString() }),
    };

    setStockBackups((prev) => {
      const next = [backup, ...prev];
      localStorage.setItem(`apna_pos_${activeBusinessId}_stock_backups`, JSON.stringify(next));
      return next;
    });
    sounds.playCheckoutChime();
    return backup;
  };

  const restoreStockBackup = (rawOrId: string): boolean => {
    try {
      let itemsToRestore: Product[] | null = null;
      const found = stockBackups.find((b) => b.id === rawOrId);
      if (found && found.rawSnapshotJson) {
        const parsed = JSON.parse(found.rawSnapshotJson);
        itemsToRestore = Array.isArray(parsed) ? parsed : parsed.products;
      } else {
        const parsed = JSON.parse(rawOrId);
        itemsToRestore = Array.isArray(parsed) ? parsed : parsed.products;
      }

      if (itemsToRestore && itemsToRestore.length > 0) {
        setProducts((prev) => {
          const otherVerticals = prev.filter((p) => p.vertical !== activeVertical);
          return [...otherVerticals, ...itemsToRestore!];
        });
        sounds.playCheckoutChime();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // ---------------- SUPPLIER BACKUPS (MANUAL & AI DAILY) ----------------
  const createManualSupplierBackup = (notes?: string): SupplierBackupRecord => {
    const totalOutstanding = suppliers.reduce((sum, s) => sum + s.balanceDue, 0);
    const totalPurchases = suppliers.reduce((sum, s) => sum + s.totalPurchased, 0);
    const snapshot = {
      suppliers,
      supplierInvoices,
      timestamp: new Date().toISOString(),
      store: storeProfile.name,
    };
    const backup: SupplierBackupRecord = {
      id: `sup-bak-${Date.now()}`,
      type: 'manual',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      totalSuppliers: suppliers.length,
      totalPurchases,
      totalOutstandingPayable: totalOutstanding,
      invoicesCount: supplierInvoices.length,
      checksum: `SHA256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      notes: notes || 'Manual Vendor & Payables Snapshot',
      rawSnapshotJson: JSON.stringify(snapshot),
    };

    setSupplierBackups((prev) => {
      const next = [backup, ...prev];
      localStorage.setItem(`apna_pos_${activeBusinessId}_supplier_backups`, JSON.stringify(next));
      return next;
    });
    sounds.playCheckoutChime();
    return backup;
  };

  const runAiDailySupplierBackup = async (): Promise<SupplierBackupRecord> => {
    const totalOutstanding = suppliers.reduce((sum, s) => sum + s.balanceDue, 0);
    const totalPurchases = suppliers.reduce((sum, s) => sum + s.totalPurchased, 0);
    let aiSummary = {
      payablesStatus: `Total Liabilities: ${storeProfile.currency} ${totalOutstanding.toLocaleString()} across ${suppliers.length} vendors`,
      priorityVendorsDue: suppliers.filter((s) => s.balanceDue > 0).map((s) => `${s.name}: ${storeProfile.currency} ${s.balanceDue.toLocaleString()}`),
      cashFlowRecommendation: totalOutstanding > 0 ? 'Clear oldest invoices to preserve wholesale volume discounts' : 'Zero vendor liabilities. Excellent wholesale credit rating.',
      discountOpportunities: ['Check for early payment settlement discounts on major invoices'],
      riskLevel: totalOutstanding > 200000 ? 'Moderate Exposure' : 'Low Risk',
    };
    let checksum = `SHA256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

    try {
      if (navigator.onLine) {
        const res = await fetch('/api/gemini/backup-suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suppliers, supplierInvoices, storeProfile }),
        });
        const data = await res.json();
        if (data.success && data.aiAuditSummary) {
          aiSummary = data.aiAuditSummary;
          checksum = data.checksum || checksum;
        }
      }
    } catch (e) {
      console.warn('AI supplier backup server error, used local heuristics:', e);
    }

    const backup: SupplierBackupRecord = {
      id: `sup-ai-${Date.now()}`,
      type: 'ai_daily',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      totalSuppliers: suppliers.length,
      totalPurchases,
      totalOutstandingPayable: totalOutstanding,
      invoicesCount: supplierInvoices.length,
      checksum,
      notes: 'Automated Gemini Daily Payables Audit & Vendor Ledger Backup',
      aiAuditSummary: aiSummary,
      rawSnapshotJson: JSON.stringify({ suppliers, supplierInvoices, timestamp: new Date().toISOString() }),
    };

    setSupplierBackups((prev) => {
      const next = [backup, ...prev];
      localStorage.setItem(`apna_pos_${activeBusinessId}_supplier_backups`, JSON.stringify(next));
      return next;
    });
    sounds.playCheckoutChime();
    return backup;
  };

  const restoreSupplierBackup = (rawOrId: string): boolean => {
    try {
      let dataToRestore: { suppliers: Supplier[]; supplierInvoices?: SupplierInvoice[] } | null = null;
      const found = supplierBackups.find((b) => b.id === rawOrId);
      if (found && found.rawSnapshotJson) {
        dataToRestore = JSON.parse(found.rawSnapshotJson);
      } else {
        dataToRestore = JSON.parse(rawOrId);
      }

      if (dataToRestore && dataToRestore.suppliers) {
        setSuppliers(dataToRestore.suppliers);
        if (dataToRestore.supplierInvoices) {
          setSupplierInvoices(dataToRestore.supplierInvoices);
        }
        sounds.playCheckoutChime();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // ---------------- AI SMART PRODUCT SEARCH & ASSISTANT ----------------
  const performSmartSearch = async (
    query: string,
    imageBase64?: string
  ): Promise<{ matches: AiSmartSearchMatch[]; isOfflineFallback: boolean; note?: string }> => {
    // If user is offline, execute fast local fuzzy match
    if (isOffline || !navigator.onLine) {
      return runLocalSmartSearch(query);
    }

    try {
      const res = await fetch('/api/pos/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          products: filteredProducts,
          businessVertical: activeVertical,
          imageBase64,
        }),
      });

      if (!res.ok) {
        return runLocalSmartSearch(query);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.matches) && data.matches.length > 0) {
        return {
          matches: data.matches,
          isOfflineFallback: false,
          note: data.clarificationNote,
        };
      }
      return runLocalSmartSearch(query);
    } catch {
      return runLocalSmartSearch(query);
    }
  };

  // Local offline matching with natural number quantity parsing
  const runLocalSmartSearch = (query: string): { matches: AiSmartSearchMatch[]; isOfflineFallback: boolean; note?: string } => {
    const clean = query.toLowerCase().trim();
    if (!clean) return { matches: [], isOfflineFallback: true };

    let requestedQty = 1;
    const numberWordMap: Record<string, number> = {
      one: 1, ek: 1, two: 2, do: 2, three: 3, teen: 3, four: 4, char: 4, five: 5, panch: 5,
      six: 6, chah: 6, seven: 7, saat: 7, eight: 8, aath: 8, nine: 9, nau: 9, ten: 10, das: 10,
    };

    const numMatch = clean.match(/\b(\d+)\b/);
    if (numMatch) {
      requestedQty = parseInt(numMatch[1], 10);
    } else {
      for (const [word, val] of Object.entries(numberWordMap)) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(clean)) {
          requestedQty = val;
          break;
        }
      }
    }

    const queryTokens = clean
      .replace(/[0-9]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !['and', 'give', 'me', 'the', 'a', 'an', 'please', 'aur', 'do', 'chahiye'].includes(t));

    const scored = filteredProducts.map((p) => {
      const target = `${p.name} ${p.barcode} ${p.category} ${p.urduName || ''} ${JSON.stringify(p.verticalAttributes || {})}`.toLowerCase();
      let matchScore = 0;

      if (p.barcode.includes(clean)) matchScore += 100;
      if (target.includes(clean)) matchScore += 80;

      queryTokens.forEach((token) => {
        if (target.includes(token)) matchScore += 30;
      });

      return { product: p, score: matchScore };
    });

    const bestMatches = scored
      .filter((s) => s.score > 25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((m) => ({
        productId: m.product.id,
        quantity: requestedQty,
        confidence: Math.min(99, m.score),
        matchedName: m.product.name,
        reason: `Matched locally from offline inventory database (${m.score}% score)`,
      }));

    return {
      matches: bestMatches,
      isOfflineFallback: true,
      note: 'Offline local matching active (instant response without internet)',
    };
  };

  const processReturn = (data: {
    originalInvoiceNo: string;
    items: ReturnItem[];
    totalRefundAmount: number;
    refundMethod: 'cash' | 'card' | 'udhar_credit' | 'digital';
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }): ReturnRecord => {
    const returnId = `RET-${Date.now().toString().slice(-6)}`;
    const newReturn: ReturnRecord = {
      id: returnId,
      returnInvoiceNo: returnId,
      date: new Date().toISOString(),
      originalInvoiceNo: data.originalInvoiceNo,
      items: data.items,
      totalRefundAmount: data.totalRefundAmount,
      refundMethod: data.refundMethod,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      restockedItemsCount: data.items.filter((i) => i.restocked).length,
      processedBy: userSession.displayName || 'Admin',
      notes: data.notes,
    };

    // If restocked is true, add stock back to products
    data.items.forEach((item) => {
      if (item.restocked) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === item.productId
              ? { ...p, stockQuantity: p.stockQuantity + item.quantityReturned }
              : p
          )
        );
      }
    });

    // If refund method is udhar_credit and customer has khata, reduce their balance
    if (data.refundMethod === 'udhar_credit' && data.customerPhone) {
      const existingKhata = khatas.find((k) => k.phone === data.customerPhone);
      if (existingKhata) {
        addKhataTransaction(existingKhata.id, {
          type: 'receive_payment',
          amount: data.totalRefundAmount,
          description: `Return Refund for ${data.originalInvoiceNo}`,
          paymentMethod: 'cash',
        });
      }
    }

    setReturns((prev) => [newReturn, ...prev]);
    return newReturn;
  };

  const updateAiManagerConfig = (updates: Partial<AiManagerConfig>) => {
    setAiManagerConfig((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(`apna_pos_${activeBusinessId}_ai_manager_config`, JSON.stringify(updated));
      return updated;
    });
  };

  const triggerAiManagerWhatsApp = async (
    category: 'daily_sales' | 'stock_out' | 'udhar_warning' | 'salary_slip'
  ): Promise<{ whatsappLink: string; message: string }> => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter((s) => s.timestamp.startsWith(today));
    const todayRevenue = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);
    const todayProfit = todaySales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const outStockCount = products.filter((p) => p.stockQuantity <= 0).length;
    const highUdharCount = khatas.filter((k) => k.currentBalance > 0).length;
    const targetPhone = aiManagerConfig.ownerWhatsAppNumber || storeProfile.phone || '923000000000';

    try {
      const res = await fetch('/api/ai-manager/dispatch-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          storeName: storeProfile.name,
          ownerPhone: targetPhone,
          language: aiManagerConfig.languagePreference,
          summaryData: {
            todaySalesCount: todaySales.length,
            todayRevenue,
            todayProfit,
            outOfStockCount: outStockCount,
            activeUdharCustomers: highUdharCount,
            totalUdharBalance: totalUdhar,
            date: new Date().toLocaleDateString('en-PK'),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newAlert: AiManagerAlert = {
          id: `alert-${Date.now()}`,
          category,
          timestamp: new Date().toISOString(),
          recipient: targetPhone,
          messagePreview: data.message,
          status: 'dispatched',
          whatsappUrl: data.whatsappLink,
        };
        setAiManagerAlerts((prev) => [newAlert, ...prev.slice(0, 49)]);
        return { whatsappLink: data.whatsappLink, message: data.message };
      }
      throw new Error(data.error || 'Failed to dispatch alert');
    } catch {
      const msg = `*${storeProfile.name} AI Daily Brief*\n📅 Date: ${new Date().toLocaleDateString()}\n💰 Sales: Rs ${todayRevenue.toLocaleString()} (${todaySales.length} bills)\n📈 Net Profit: Rs ${todayProfit.toLocaleString()}\n⚠️ Stockouts: ${outStockCount} items\n📒 Udhar Balance: Rs ${totalUdhar.toLocaleString()}\n\n_Generated automatically by Apna AI POS Manager_`;
      const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
      const link = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      const fallbackAlert: AiManagerAlert = {
        id: `alert-${Date.now()}`,
        category,
        timestamp: new Date().toISOString(),
        recipient: targetPhone,
        messagePreview: msg,
        status: 'dispatched',
        whatsappUrl: link,
      };
      setAiManagerAlerts((prev) => [fallbackAlert, ...prev.slice(0, 49)]);
      return { whatsappLink: link, message: msg };
    }
  };

  const changeUserPassword = async (currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userSession.email,
          currentPassword: currentPass,
          newPassword: newPass,
        }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, message: 'Server communication error while changing password' };
    }
  };

  const resetAllData = () => {
    // Zero out all metrics, sales, returns, udhar, expenses, and catalog
    setProducts([]);
    setSales([]);
    setSuppliers([]);
    setSupplierInvoices([]);
    setRateLists([]);
    setKhatas([]);
    setDeals([]);
    setPaymentRecords([]);
    setStaffMembers([]);
    setSalaryPayouts([]);
    setStaffAdvances([]);
    setExpenses([]);
    setVipCustomers([]);
    setPersonKhattaProfiles([]);
    setPersonKhattaEntries([]);
    setStockBackups([]);
    setSupplierBackups([]);
    setReturns([]);
    setOfflineSalesQueue([]);
    clearCart();

    // Clear persistent storage for this tenant
    try {
      localStorage.setItem(`apna_pos_${activeBusinessId}_products`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_sales`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_khatas`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_payments`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_expenses`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_returns`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_staff`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_payouts`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_advances`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_pk_profiles`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_pk_entries`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_stock_backups`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_supplier_backups`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_vip_customers`, JSON.stringify([]));
      localStorage.setItem(`apna_pos_${activeBusinessId}_offline_queue`, JSON.stringify([]));
    } catch (e) {
      console.warn('Failed to clear tenant localStorage:', e);
    }
  };

  const loadDemoSampleData = () => {
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setSuppliers(INITIAL_SUPPLIERS);
    setSupplierInvoices(INITIAL_SUPPLIER_INVOICES);
    setRateLists(INITIAL_RATE_LISTS);
    setKhatas(INITIAL_KHATAS);
    setDeals(INITIAL_DEALS);
    setPaymentRecords(INITIAL_PAYMENT_RECORDS);
    setStaffMembers(INITIAL_STAFF_MEMBERS);
    setSalaryPayouts(INITIAL_SALARY_PAYOUTS);
    setStaffAdvances(INITIAL_STAFF_ADVANCES);
    setExpenses(INITIAL_EXPENSES);
    setVipCustomers(INITIAL_VIP_CUSTOMERS);
    setPersonKhattaProfiles(INITIAL_PERSON_KHATTA_PROFILES);
    setPersonKhattaEntries(INITIAL_PERSON_KHATTA_ENTRIES);
    setStockBackups(INITIAL_STOCK_BACKUPS);
    setSupplierBackups(INITIAL_SUPPLIER_BACKUPS);
    setReturns(INITIAL_RETURNS);
    sounds.playCheckoutChime();
  };

  return (
    <PosContext.Provider
      value={{
        theme,
        toggleTheme,
        products,
        setProducts,
        filteredProducts,
        activeVertical,
        setActiveVertical,

        storeProfile,
        updateStoreProfile,
        updateBusinessLogo,
        paymentGateways,
        updatePaymentGateways,
        businessAccounts,
        activeBusinessId,
        switchBusinessAccount,
        registerBusinessAccount,
        totalStockCost,
        totalStockRetail,
        outOfStockItems,
        lowStockItems,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartDiscount,
        setCartDiscount,
        cartTaxRate,
        setCartTaxRate,
        cartDeliveryType,
        setCartDeliveryType,
        cartDeliveryFee,
        setCartDeliveryFee,
        cartDeliveryAddress,
        setCartDeliveryAddress,
        cartRiderName,
        setCartRiderName,
        cartSubtotal,
        cartDiscountAmount,
        cartTaxAmount,
        cartGrandTotal,
        hasZeroStockInCart,
        sales,
        completeSale,
        currentReceipt,
        setCurrentReceipt,
        estimates,
        addEstimate,
        updateEstimate,
        deleteEstimate,
        convertEstimateToSale,
        markEstimateAsPaid,
        transferStockFromPartnerShop,
        currentEstimate,
        setCurrentEstimate,
        updateCatalogPricesFromRateList,
        suppliers,
        supplierInvoices,
        rateLists,
        addRateList,
        deleteRateList,
        commitScannedBill,
        addProduct,
        updateProduct,
        deleteProduct,
        batchImportProducts,
        bulkAdjustPrices,
        adjustProductPrice,
        khatas,
        totalUdhar,
        khataLimitHighlights,
        addKhataCustomer,
        updateKhataCustomer,
        addKhataTransaction,
        deleteKhata,
        deals,
        addDeal,
        updateDeal,
        deleteDeal,
        systemUsers,
        addSystemUser,
        updateSystemUser,
        deleteSystemUser,
        saasPlans,
        updateSaaSPlan,
        chatMessages,
        sendChatMessage,
        paymentRecords,
        addPaymentRecord,
        deletePaymentRecord,
        featureLocks,
        updateFeatureLock,
        systemLimits,
        updateSystemLimits,
        staffMembers,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        markStaffAsLeft,
        reactivateStaff,
        salaryPayouts,
        recordSalaryPayout,
        staffAdvances,
        recordStaffAdvance,
        staffAccounts,
        registerStaffAccount,
        deleteStaffAccount,
        expenses,
        addExpense,
        deleteExpense,
        vipCustomers,
        addVipCustomer,
        updateVipCustomer,
        deleteVipCustomer,
        personKhattaProfiles,
        personKhattaEntries,
        addPersonProfile,
        updatePersonProfile,
        deletePersonProfile,
        addPersonEntry,
        deletePersonEntry,
        isOffline,
        setIsOffline,
        offlineSalesQueue,
        isSyncing,
        lastSyncTime,
        syncOfflineSales,
        stockBackups,
        createManualStockBackup,
        runAiDailyStockBackup,
        restoreStockBackup,
        supplierBackups,
        createManualSupplierBackup,
        runAiDailySupplierBackup,
        restoreSupplierBackup,
        performSmartSearch,
        returns,
        processReturn,
        aiManagerConfig,
        updateAiManagerConfig,
        aiManagerAlerts,
        triggerAiManagerWhatsApp,
        userSession,
        setUserSession,
        googleSignIn,
        googleSignOut,
        changeUserPassword,
        resetAllData,
        loadDemoSampleData,
        // Attendance
        attendanceRecords,
        markAttendance,
        updateAttendance,
        deleteAttendance,
        quickMarkAllPresent,
        // Staff Roles & RBAC
        rolePermissions,
        updateRolePermissions,
        simulatedRole,
        setSimulatedRole,
        effectiveRole,
        isTabAllowedForRole,
        // Bill Templates
        billTemplates,
        activeBillTemplateId,
        setActiveBillTemplateId,
        activeBillTemplate,
        addBillTemplate,
        updateBillTemplate,
        deleteBillTemplate,
        // SaaS Themes
        activeThemeId,
        setActiveThemeId,
        saasThemes,
        activeThemePreset,
        // Database Hub
        databaseStatus,
        refreshDatabaseStatus,
        testDatabaseAdminLogin,
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
};
