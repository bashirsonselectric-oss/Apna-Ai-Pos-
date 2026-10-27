export type BusinessVertical = 
  | 'mobile_shop'
  | 'marts'
  | 'cash_and_carry'
  | 'fast_food'
  | 'shoes_footwear'
  | 'gift_and_toys'
  | 'books_stationery'
  | 'distributor'
  | 'farm_dairy_distributor'
  | 'digital_products'
  | 'electrical_hardware'
  | 'medical_pharmacy'
  | 'grocery_general'
  | 'bakery_sweets'
  | 'clothing_apparel'
  | 'sanitary_plumbing';

export interface VerticalConfig {
  id: BusinessVertical;
  name: string;
  urduName: string;
  iconName: string;
  description: string;
  unitOptions: string[];
  customFields: {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'boolean';
    options?: string[];
    placeholder?: string;
  }[];
}

export interface Product {
  id: string;
  name: string;
  urduName?: string;
  barcode: string;
  category: string;
  vertical: BusinessVertical;
  costPrice: number;
  retailPrice: number;
  stockQuantity: number;
  minStockAlert: number;
  unit: string; // e.g. pcs, meter, kg, grams, box, strip, pack
  taxPercent: number;
  image?: string;
  // Enhanced Stock Attributes: Image, Color, Size/Gauge, Dual Unit (Pack/Coil + Loose/Meter)
  color?: string; // e.g. "Red", "Black", "Blue", "Yellow", "White"
  size?: string; // e.g. "3/29", "7/29", "7/36", "40mm", "Size 42"
  packUnit?: string; // e.g. "coil", "carton", "box"
  packQuantity?: number; // e.g. 18
  packPrice?: number; // e.g. 6300 per coil
  looseUnit?: string; // e.g. "meter", "loose pcs"
  looseQuantity?: number; // e.g. 305 loss / loose meter
  loosePrice?: number; // e.g. 70 per meter
  subSize?: string; // e.g. "Single Core", "Double Core", "0.75mm", "90m", "100m"
  options?: {
    colors?: string[];
    sizes?: string[];
    subSizes?: string[];
  };
  // Dynamic vertical-specific attributes
  verticalAttributes: Record<string, any>;
  lastUpdated: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number; // in percentage or flat
  subtotal: number;
  notes?: string;
  selectedColor?: string;
  subCategory?: string;
  wasZeroStock?: boolean;
}

export type PaymentMethod = 'cash' | 'jazzcash' | 'easypaisa' | 'card' | 'bank_transfer' | 'split' | 'udhar';

export interface PaymentGatewaySettings {
  jazzcash: {
    enabled: boolean;
    tillId: string;
    accountTitle: string;
    phone: string;
    qrUrl: string;
    qrCodeUrl?: string;
  };
  easypaisa: {
    enabled: boolean;
    tillId: string;
    accountTitle: string;
    phone: string;
    qrUrl: string;
    qrCodeUrl?: string;
  };
  bank: {
    enabled: boolean;
    bankName: string;
    accountTitle: string;
    iban: string;
    raastId: string;
    qrCodeUrl?: string;
  };
  card: {
    enabled: boolean;
    terminalId: string;
  };
  cash: {
    enabled: boolean;
  };
  udhar: {
    enabled: boolean;
    defaultLimit: number;
    requireApprovalAbove: number;
  };
}

export interface SaleRecord {
  id: string;
  invoiceNo: string;
  timestamp: string;
  customerName: string;
  customerPhone?: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
    costPrice: number;
    color?: string;
    size?: string;
    subCategory?: string;
  }[];
  subtotal: number;
  discountAmount: number;
  taxRate?: number;
  taxAmount: number;
  deliveryType?: 'none' | 'rider' | 'cargo' | 'van';
  deliveryFee?: number;
  deliveryAddress?: string;
  riderName?: string;
  grandTotal: number;
  profit: number;
  paymentMethod: PaymentMethod;
  tenderedCash?: number;
  changeDue?: number;
  splitDetails?: {
    cash?: number;
    digital?: number;
    digitalMethod?: 'jazzcash' | 'easypaisa' | 'card' | 'bank_transfer';
  };
  notes?: string;
  isOfflineSale?: boolean;
  isOfflineSyncPending?: boolean;
  syncedAt?: string;
}

export interface EstimateItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  color?: string;
  size?: string;
  subCategory?: string;
  wasZeroStock?: boolean;
}

export interface EstimateRecord {
  id: string;
  estimateNo: string;
  date: string;
  validUntil?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: EstimateItem[];
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  deliveryType: 'none' | 'rider' | 'cargo' | 'van';
  deliveryFee: number;
  deliveryAddress?: string;
  grandTotal: number;
  notes?: string;
  status: 'pending' | 'converted' | 'paid' | 'expired' | 'cancelled';
  convertedSaleId?: string;
  createdAt: string;
}

export interface PartnerShopStock {
  id: string;
  shopName: string;
  branchArea: string;
  phone: string;
  distanceKm: number;
  availableStock: number;
  unit: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  city: string;
  totalPurchased: number;
  totalPaid: number;
  balanceDue: number;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  totalAmount: number;
  itemsCount: number;
  items: {
    name: string;
    quantity: number;
    unit: string;
    costPrice: number;
    retailPrice: number;
  }[];
  status: 'paid' | 'partial' | 'unpaid';
  aiExtracted?: boolean;
}

export interface RateList {
  id: string;
  title: string;
  vendorName: string;
  uploadedAt: string;
  expiresAt: string | null; // ISO string for auto-expiration
  isExpired: boolean;
  itemCount: number;
  items: {
    name: string;
    barcode: string;
    costPrice: number;
    retailPrice: number;
    unit: string;
  }[];
}

export interface KhataEntry {
  id: string;
  date: string;
  type: 'give_credit' | 'receive_payment'; // Udhar Diya vs Vasooli
  amount: number;
  description: string;
  invoiceNo?: string;
  paymentMethod?: string;
}

export interface CustomerKhata {
  id: string;
  name: string;
  phone: string;
  address?: string;
  creditLimit: number;
  currentBalance: number; // positive = customer owes store
  lastTransactionDate: string;
  notes?: string;
  transactions: KhataEntry[];
}

export interface DealBundle {
  id: string;
  title: string;
  description: string;
  itemSummary: string;
  originalPrice: number;
  dealPrice: number;
  discountPercent: number;
  active: boolean;
  tag: string;
  expiryDate?: string;
}

export type StaffRole = 'admin' | 'manager' | 'cashier' | 'accountant';
export type UserRole = StaffRole;

export interface StaffPermission {
  canDiscount: boolean;
  canEditPrices: boolean;
  canAccessAdmin: boolean;
  canManageStock: boolean;
  canViewProfit: boolean;
  canGiveUdhar: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: 'active' | 'suspended';
  lastActive: string;
  assignedBranch: string;
  permissions?: StaffPermission;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin' | 'ai';
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface BusinessAccount {
  id: string;
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  city: string;
  vertical: BusinessVertical;
  currency: string;
  taxRegistrationNo?: string;
  createdAt: string;
}

export type ThemeMode = 'light' | 'dark';

export interface EditableSaaSPlan {
  id: 'starter' | 'professional' | 'enterprise';
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  badge?: string;
  features: string[];
}

export interface StoreProfile {
  name: string;
  legalEntity: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  address: string;
  currency: string;
  taxRegistrationNo: string;
  receiptHeader: string;
  receiptFooter: string;
  activeVertical: BusinessVertical;
  saasTier: 'starter' | 'professional' | 'enterprise';
  saasExpiry: string;
  logoUrl?: string; // Business logo image / data URL
  paymentQrUrl?: string; // Main Store / Counter Payment QR Code (Uploaded Image Data URL or Link)
  paymentQrType?: 'raast' | 'jazzcash' | 'easypaisa' | 'bank' | 'general';
  paymentQrAccountTitle?: string;
  paymentQrAccountNo?: string;
  paymentQrBankName?: string;
}

export interface UserSession {
  email: string;
  displayName: string;
  photoURL?: string;
  role: StaffRole;
  storeId: string;
  isGoogleSignedIn: boolean;
  isAuthenticated?: boolean;
  permissions?: StaffPermission;
  paymentQrUrl?: string; // User personal / cashier uploaded payment QR image
  paymentQrType?: 'raast' | 'jazzcash' | 'easypaisa' | 'bank' | 'general';
  paymentQrTitle?: string;
  paymentQrAccountNo?: string;
}

// Payment & Financial Records Ledger
export interface PaymentRecord {
  id: string;
  type: 'sale_income' | 'udhar_recovery' | 'expense_payout' | 'salary_payout' | 'custom_entry';
  direction: 'inflow' | 'outflow';
  amount: number;
  method: PaymentMethod | 'other';
  referenceNo?: string;
  partyName: string;
  partyPhone?: string;
  category?: string;
  notes?: string;
  date: string;
  invoiceId?: string;
}

// System Feature Locks & Hard Limits Configuration (Admin controlled)
export interface FeatureLockConfig {
  posBilling: boolean;
  aiBillScanner: boolean;
  inventoryCatalog: boolean;
  stockManagement: boolean;
  udharKhatta: boolean;
  personKhatta: boolean;
  vipCustomers: boolean;
  returnsRefunds: boolean;
  expensesManager: boolean;
  staffSalary: boolean;
  supplierLedger: boolean;
  salesAnalytics: boolean;
  aiManagerWhatsApp: boolean;
  aiChatbot: boolean;
  bulkPriceAdjustment: boolean;
  multiBranchSwitch: boolean;
  whatsappDirectShare: boolean;
  unsecuredUdharOverLimit: boolean;
  customCashierDiscount: boolean;
}

export interface SystemLimitConfig {
  maxCustomerUdharLimit: number;
  enforceHardUdharLimitStop: boolean; // Limit Full Stop: strict POS block when limit reached
  maxDailyBills: number;
  maxCatalogProducts: number;
  maxDiscountPercentage: number;
}

// Staff Salary & Advances Management
export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: StaffRole;
  email?: string;
  password?: string;
  baseSalary: number;
  monthlyAdvances: number;
  monthlyDeductions: number;
  monthlyBonuses: number;
  joiningDate: string;
  leftDate?: string;
  leftReason?: string;
  status: 'active' | 'on_leave' | 'resigned' | 'left';
}

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  phone?: string;
  baseSalary?: number;
  assignedBranch?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface SalaryPayoutRecord {
  id: string;
  staffId: string;
  staffName: string;
  monthYear: string;
  baseSalary: number;
  advancesDeducted: number;
  bonusesAdded: number;
  finesDeducted: number;
  netPaid: number;
  paymentMethod: PaymentMethod;
  payoutDate: string;
  notes?: string;
}

export interface StaffAdvanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  amount: number;
  date: string;
  reason: string;
  paymentMethod: PaymentMethod;
}

// Spend Money & Expense Tracking with WhatsApp Sheet
export type ExpenseCategory = 
  | 'utilities'
  | 'rent'
  | 'supplier_cash'
  | 'tea_refreshment'
  | 'staff_lunch'
  | 'repair_maintenance'
  | 'transport_freight'
  | 'marketing_packing'
  | 'misc';

export interface ExpenseRecord {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: 'cash' | 'jazzcash' | 'easypaisa' | 'bank_transfer';
  paidTo: string;
  date: string;
  notes?: string;
  receiptImage?: string;
}

// VIP Customer Analysis & Bill Detection
export type VipTier = 'platinum' | 'gold' | 'silver' | 'regular';

export interface VipCustomerAnalysis {
  customerId: string;
  customerName: string;
  customerPhone: string;
  tier: VipTier;
  totalSpend: number;
  totalOrders: number;
  avgOrderValue: number;
  lastVisitDate: string;
  specialDiscountPercent: number;
  preferredCategories: string[];
  notes?: string;
  detectedAutomatically: boolean;
}

// Person Khatta: Advance payments & spending ledger
export interface PersonKhattaProfile {
  id: string;
  name: string;
  phone: string;
  roleRelation: string; // Contractor, Electrician, Daily Labour, Partner, Friend
  cnic?: string;
  notes?: string;
  createdAt: string;
  totalAdvanceGiven: number;
  totalSpendingDone: number;
  netBalance: number; // Positive = Advance remaining with person, Negative = Store owes person
}

export interface PersonKhattaEntry {
  id: string;
  personId: string;
  type: 'advance_given' | 'spending_done'; // Pese Diye vs Pese Kharch Kiye
  amount: number;
  date: string;
  description: string;
  paymentMethod?: PaymentMethod;
  receiptNote?: string;
}

// Stock & Inventory Backups (Manual & AI Daily)
export interface StockBackupRecord {
  id: string;
  type: 'manual' | 'ai_daily';
  timestamp: string;
  date: string;
  totalItems: number;
  totalCostValue: number;
  totalRetailValue: number;
  outOfStockCount: number;
  lowStockCount: number;
  checksum: string;
  notes?: string;
  aiAuditSummary?: {
    valuationStatus: string;
    fastMovingAlert: string[];
    stockoutRisks: string[];
    restockUrgency: string;
    auditScore: number;
  };
  rawSnapshotJson?: string;
}

// Supplier Payables & Vendor Backups (Manual & AI Daily)
export interface SupplierBackupRecord {
  id: string;
  type: 'manual' | 'ai_daily';
  timestamp: string;
  date: string;
  totalSuppliers: number;
  totalPurchases: number;
  totalOutstandingPayable: number;
  invoicesCount: number;
  checksum: string;
  notes?: string;
  aiAuditSummary?: {
    payablesStatus: string;
    priorityVendorsDue: string[];
    cashFlowRecommendation: string;
    discountOpportunities: string[];
    riskLevel: string;
  };
  rawSnapshotJson?: string;
}

// Returns & Refunds System
export interface ReturnItem {
  productId: string;
  name: string;
  quantityReturned: number;
  unitPrice: number;
  refundSubtotal: number;
  reason: 'damaged' | 'wrong_item' | 'customer_mind' | 'expired' | 'other';
  restocked: boolean;
}

export interface ReturnRecord {
  id: string;
  returnInvoiceNo: string;
  originalInvoiceNo: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  items: ReturnItem[];
  totalRefundAmount: number;
  refundMethod: 'cash' | 'card' | 'udhar_credit' | 'digital';
  restockedItemsCount: number;
  processedBy: string;
  notes?: string;
}

// AI Manager & Background WhatsApp Automation
export interface AiManagerConfig {
  enabled: boolean;
  ownerWhatsAppNumber: string;
  autoSendDailySales: boolean;
  autoSendStockOutAlerts: boolean;
  autoSendUdharOverdue: boolean;
  autoSendSalaryPayouts: boolean;
  autoDailySalesWhatsApp?: boolean;
  autoStockoutAlertWhatsApp?: boolean;
  autoUdharOverdueWhatsApp?: boolean;
  autoSalarySlipWhatsApp?: boolean;
  dispatchTime: string; // e.g. "21:00"
  languagePreference?: 'english' | 'urdu';
}

export interface AiManagerAlert {
  id: string;
  timestamp: string;
  category: 'daily_sales' | 'stock_out' | 'udhar_warning' | 'salary_slip' | 'custom';
  title?: string;
  message?: string;
  messagePreview?: string;
  recipient?: string;
  status: 'sent' | 'pending' | 'failed' | 'dispatched';
  whatsappLink?: string;
  whatsappUrl?: string;
}
export interface AiSmartSearchMatch {
  productId: string;
  quantity: number;
  confidence: number;
  matchedName: string;
  reason?: string;
}

// ---------------- ATTENDANCE / HAAZRI TRACKING ----------------
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave';

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string; // e.g. "09:15 AM"
  checkOutTime?: string; // e.g. "08:30 PM"
  workingHours?: number; // e.g. 9.5
  overtimeHours?: number; // e.g. 1.5
  notes?: string;
}

// ---------------- ROLE-BASED ACCESS CONTROL (RBAC) ----------------
export interface RoleTabPermissions {
  role: StaffRole;
  label: string;
  description: string;
  allowedTabs: string[]; // List of ActiveTab IDs allowed for this role
  canDiscount: boolean;
  canEditPrices: boolean;
  canManageStock: boolean;
  canGiveUdhar: boolean;
  canViewProfit: boolean;
  canManageStaff: boolean;
  canAccessAdmin: boolean;
}

// ---------------- BILL TEMPLATE LIBRARY ----------------
export type BillTemplateType =
  | 'thermal_80mm'
  | 'thermal_58mm'
  | 'a4_commercial'
  | 'a5_voucher'
  | 'whatsapp_digital'
  | 'urdu_nastaliq'
  | 'technical_cable';

export interface BillTemplate {
  id: string;
  name: string;
  urduName: string;
  category: BillTemplateType;
  paperWidth: string; // "80mm Thermal", "58mm Mini", "A4 Sheet", "A5 Slip", "Mobile E-Bill"
  description: string;
  showLogo: boolean;
  showBarcode: boolean;
  showQrCode: boolean;
  showUrdu: boolean;
  showTaxBreakdown: boolean;
  showCustomerKhataBalance: boolean;
  showDualPacking: boolean; // specifically shows Coil & Loose Meter breakdowns
  headerTagline: string;
  footerNotes: string;
  accentColor: string;
  isDefault: boolean;
  fontFamily: 'sans' | 'mono' | 'serif';
  fontSize: 'compact' | 'standard' | 'large';
}

// ---------------- SAAS THEME LIBRARY ----------------
export interface SaaSThemePreset {
  id: string;
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  gradient: string;
  previewBg: string;
  description: string;
  isPopular?: boolean;
}
