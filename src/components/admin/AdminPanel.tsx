import React, { useState, useRef, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import { AdminOtpLock } from './AdminOtpLock';
import { SupabaseCloudHub } from './SupabaseCloudHub';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  CreditCard,
  Image,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Upload,
  Lock,
  Tag,
  Store,
  Layers,
  Key,
  TrendingUp,
  Percent,
  QrCode,
  Smartphone,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Shield,
  Unlock,
  Ban,
  AlertOctagon,
  Database,
  Building,
  Server,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  SystemUser,
  EditableSaaSPlan,
  DealBundle,
  PaymentGatewaySettings,
  StaffRole,
  StaffPermission,
  FeatureLockConfig,
  SystemLimitConfig,
  BusinessAccount,
  BusinessVertical,
} from '../../types';

interface UserTableRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  password_preview: string;
  salt: string;
  role: string;
  storeName: string;
  created_at: string;
}

interface AdminPanelContentProps {
  onLock: () => void;
}

const AdminPanelContent: React.FC<AdminPanelContentProps> = ({ onLock }) => {
  const {
    userSession,
    googleSignIn,
    systemUsers,
    addSystemUser,
    updateSystemUser,
    deleteSystemUser,
    saasPlans,
    updateSaaSPlan,
    storeProfile,
    updateStoreProfile,
    updateBusinessLogo,
    deals,
    addDeal,
    updateDeal,
    deleteDeal,
    products,
    paymentGateways,
    updatePaymentGateways,
    chatMessages,
    sendChatMessage,
    featureLocks,
    updateFeatureLock,
    systemLimits,
    updateSystemLimits,
    businessAccounts,
    activeBusinessId,
    switchBusinessAccount,
    registerBusinessAccount,
    changeUserPassword,
    databaseStatus,
    refreshDatabaseStatus,
    testDatabaseAdminLogin,
  } = usePos();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'users' | 'plans' | 'logo' | 'deals' | 'payments' | 'chats' | 'ai_config' | 'limits' | 'tenants' | 'database' | 'supabase' | 'security'
  >('users');

  // Database Direct Admin Login State
  const [adminDbEmail, setAdminDbEmail] = useState('bashirsonselectric@gmail.com');
  const [adminDbPassword, setAdminDbPassword] = useState('admin123');
  const [adminDbLoading, setAdminDbLoading] = useState(false);
  const [adminDbError, setAdminDbError] = useState<string | null>(null);
  const [adminDbSuccess, setAdminDbSuccess] = useState<string | null>(null);

  // Payment Gateways Editable State
  const [localGateways, setLocalGateways] = useState<PaymentGatewaySettings>(paymentGateways);
  const [gatewaySavedMsg, setGatewaySavedMsg] = useState(false);

  // Chat message reply state
  const [adminReplyText, setAdminReplyText] = useState('');

  // Password Change State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Database Users Table & SQL Explorer State
  const [dbUsers, setDbUsers] = useState<UserTableRow[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [testPasswordInput, setTestPasswordInput] = useState('secret_password_123');
  const [hashResult, setHashResult] = useState<any>(null);
  const [hashCalculating, setHashCalculating] = useState(false);

  // Handle direct database login
  const handleAdminDatabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminDbLoading(true);
    setAdminDbError(null);
    setAdminDbSuccess(null);
    try {
      const res = await testDatabaseAdminLogin(adminDbEmail, adminDbPassword);
      if (res.success) {
        setAdminDbSuccess(res.message);
      } else {
        setAdminDbError(res.message);
      }
    } catch (err: any) {
      setAdminDbError(err.message || 'Database login failed');
    } finally {
      setAdminDbLoading(false);
    }
  };

  const [isNewTenantModal, setIsNewTenantModal] = useState(false);

  const [tenantName, setTenantName] = useState('');
  const [tenantStoreName, setTenantStoreName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPhone, setTenantPhone] = useState('+92 3');
  const [tenantCity, setTenantCity] = useState('Lahore');
  const [tenantVertical, setTenantVertical] = useState<BusinessVertical>('electrical_hardware');

  // Editing User Permissions State
  const [permissionEditingUser, setPermissionEditingUser] = useState<SystemUser | null>(null);

  // New User Form State
  const [isAddUserModal, setIsAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<StaffRole>('cashier');
  const [newUserBranch, setNewUserBranch] = useState('Main Bazaar Branch # 14');

  // Plan Edit State
  const [editingPlan, setEditingPlan] = useState<EditableSaaSPlan | null>(null);
  const [planMonthlyPrice, setPlanMonthlyPrice] = useState<number>(0);
  const [planYearlyPrice, setPlanYearlyPrice] = useState<number>(0);

  // New Deal State
  const [isAddDealModal, setIsAddDealModal] = useState(false);
  const [dealTitle, setDealTitle] = useState('');
  const [dealDesc, setDealDesc] = useState('');
  const [dealSummary, setDealSummary] = useState('');
  const [dealOriginal, setDealOriginal] = useState<number>(0);
  const [dealPrice, setDealPrice] = useState<number>(0);
  const [dealTag, setDealTag] = useState('Special Offer');

  // Logo file input
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Database Users Table & SQL Explorer Loader
  const fetchDbUsers = async () => {
    setDbLoading(true);
    try {
      const res = await fetch('/api/auth/users-table');
      const data = await res.json();
      if (data.rows) setDbUsers(data.rows);
    } catch (err) {
      console.error('Failed to load database users table:', err);
    } finally {
      setDbLoading(false);
    }
  };

  const handleTestHash = async () => {
    if (!testPasswordInput) return;
    setHashCalculating(true);
    try {
      const res = await fetch('/api/auth/verify-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: testPasswordInput }),
      });
      const data = await res.json();
      setHashResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHashCalculating(false);
    }
  };

  useEffect(() => {
    if (activeAdminTab === 'database') {
      fetchDbUsers();
    }
  }, [activeAdminTab]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) return;
    if (newPass !== confirmPass) {
      setPassError('New password and confirmation do not match.');
      return;
    }
    if (newPass.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }

    setPassLoading(true);
    setPassError(null);
    setPassSuccess(null);
    try {
      const res = await changeUserPassword(currentPass, newPass);
      if (res.success) {
        setPassSuccess('Password successfully updated and securely hashed in the database!');
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setPassError(res.message || 'Failed to update password');
      }
    } catch (err: any) {
      setPassError(err.message || 'An error occurred');
    } finally {
      setPassLoading(false);
    }
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim() || !tenantStoreName.trim()) return;

    registerBusinessAccount({
      businessName: tenantStoreName.trim(),
      ownerName: tenantName.trim(),
      ownerEmail: tenantEmail.trim() || `store${Date.now()}@example.com`,
      phone: tenantPhone.trim(),
      city: tenantCity.trim(),
      vertical: tenantVertical,
      currency: 'Rs.',
    });

    setIsNewTenantModal(false);
    setTenantName('');
    setTenantStoreName('');
    setTenantEmail('');
  };

  const handleQrUpload = (methodKey: 'easypaisa' | 'jazzcash' | 'bank', file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLocalGateways((prev) => ({
        ...prev,
        [methodKey]: {
          ...prev[methodKey],
          qrCodeUrl: dataUrl,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateBusinessLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Handle Add User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    addSystemUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      status: 'active',
      assignedBranch: newUserBranch,
    });

    setNewUserName('');
    setNewUserEmail('');
    setIsAddUserModal(false);
  };

  // Handle Save Plan
  const handleSavePlanPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    updateSaaSPlan(editingPlan.id, {
      monthlyPrice: Number(planMonthlyPrice),
      yearlyPrice: Number(planYearlyPrice),
    });

    setEditingPlan(null);
  };

  // Handle Add Deal
  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealTitle.trim() || dealPrice <= 0) return;

    const disc = dealOriginal > dealPrice ? Math.round(((dealOriginal - dealPrice) / dealOriginal) * 100) : 0;

    addDeal({
      title: dealTitle.trim(),
      description: dealDesc.trim() || dealTitle,
      itemSummary: dealSummary.trim() || 'Bundle pack',
      originalPrice: dealOriginal || dealPrice,
      dealPrice,
      discountPercent: disc,
      active: true,
      tag: dealTag,
    });

    setDealTitle('');
    setDealDesc('');
    setDealSummary('');
    setDealOriginal(0);
    setDealPrice(0);
    setIsAddDealModal(false);
  };

  // AI Deal Generator simulation
  const handleGenerateAiDeal = () => {
    const randomItems = [...products].sort(() => 0.5 - Math.random()).slice(0, 3);
    if (randomItems.length === 0) return;

    const totalRetail = randomItems.reduce((sum, item) => sum + item.retailPrice, 0);
    const discounted = Math.round(totalRetail * 0.85);

    addDeal({
      title: `AI Recommended: ${randomItems[0].name.split(' ')[0]} Power Bundle`,
      description: `Includes: ${randomItems.map((i) => i.name).join(' + ')}`,
      itemSummary: `${randomItems.length} Best-selling items combo`,
      originalPrice: totalRetail,
      dealPrice: discounted,
      discountPercent: 15,
      active: true,
      tag: 'AI Smart Deal',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Admin Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-900 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Master Enterprise Admin Center (Godigly)</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Administrator & SaaS Management Control
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Authenticated as <strong className="text-emerald-400 font-mono">bashirsonselectric@gmail.com</strong>.
            Manage store cashiers, edit SaaS plan rates, customize business logos, and control all deals and AI prompts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-right text-xs">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">Security Status</div>
            <div className="font-mono text-emerald-400 font-bold flex items-center justify-end gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Email OTP Verified</span>
            </div>
            <div className="text-[10px] text-slate-300">Level: Super Admin Only</div>
          </div>

          <button
            type="button"
            onClick={onLock}
            className="py-2.5 px-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-rose-300 hover:text-rose-200 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Lock Admin Panel immediately requiring Email OTP to re-enter"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Lock Admin</span>
          </button>
        </div>
      </div>

      {/* Admin Sub Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 overflow-x-auto scrollbar-none pb-2">
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === 'users'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User & Cashier Management ({systemUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('plans')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === 'plans'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>SaaS Plans & Price Editable</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('logo')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === 'logo'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Business Logo & Receipt Branding</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('deals')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === 'deals'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Deals & Bundles ({deals.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('payments')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === 'payments'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Payment Methods & QR Settings</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('chats')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === 'chats'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat Bot Inbox ({chatMessages.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('ai_config')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === 'ai_config'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Manager Config</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('limits')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === 'limits'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Feature Locks & Limits</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('tenants')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === 'tenants'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Store Tenants & Accounts ({businessAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('database')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === 'database'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Architecture & Audit</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('supabase')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === 'supabase'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Supabase Cloud Database</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('security')}
          className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeAdminTab === 'security'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Change Password</span>
        </button>
      </div>


      {/* ---------------- TAB 1: USER & CASHIER MANAGEMENT ---------------- */}
      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Authorized Cashiers & System Operators
              </h3>
              <p className="text-xs text-slate-500">
                Grant or revoke counter cashier and inventory management permissions.
              </p>
            </div>
            <button
              onClick={() => setIsAddUserModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add New Cashier</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">User & Email</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Assigned Branch</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {systemUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{usr.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{usr.email}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        usr.role === 'admin'
                          ? 'bg-amber-100 text-amber-800'
                          : usr.role === 'manager'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{usr.assignedBranch}</td>
                    <td className="p-3">
                      <button
                        onClick={() =>
                          updateSystemUser(usr.id, {
                            status: usr.status === 'active' ? 'suspended' : 'active',
                          })
                        }
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          usr.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-300'
                        }`}
                      >
                        {usr.status === 'active' ? '● Active' : '○ Suspended'}
                      </button>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px] font-mono">{usr.lastActive}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setPermissionEditingUser(usr)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                          title="Manage staff permissions"
                        >
                          Permissions
                        </button>
                        {usr.email !== 'bashirsonselectric@gmail.com' && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove user account ${usr.name}?`)) deleteSystemUser(usr.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: SAAS PLANS & PRICE EDITABLE ---------------- */}
      {activeAdminTab === 'plans' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Godigly SaaS Pricing & Subscription Editor
            </h3>
            <p className="text-xs text-slate-500">
              As the Master Admin, you can edit subscription rates and annual discounts for all merchant tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {saasPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">{plan.name}</span>
                    {plan.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl font-black text-slate-900 font-mono-numbers">
                      {storeProfile.currency} {plan.monthlyPrice.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-500">/ month</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono-numbers">
                      Yearly Rate: {storeProfile.currency} {plan.yearlyPrice.toLocaleString()} / year
                    </div>
                  </div>

                  <ul className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-200 pt-3">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingPlan(plan);
                    setPlanMonthlyPrice(plan.monthlyPrice);
                    setPlanYearlyPrice(plan.yearlyPrice);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Edit Plan Pricing</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- TAB 3: BUSINESS LOGO & RECEIPT BRANDING ---------------- */}
      {activeAdminTab === 'logo' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Setting Business Logo & Visual Identity
            </h3>
            <p className="text-xs text-slate-500">
              Upload your store emblem or trademark. It will be printed at the top of 80mm/58mm thermal receipts and displayed on customer bills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Upload Area */}
            <div className="space-y-4">
              <input
                type="file"
                ref={logoInputRef}
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <div
                onClick={() => logoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer transition-all space-y-2"
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-800 block">
                  Click to Upload Business Logo
                </span>
                <span className="text-[11px] text-slate-400">
                  Recommended size: 400x400 (PNG, JPG, SVG)
                </span>
              </div>

              {/* Ready Preset Logos */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Or Select a High-Grade Retail Preset Emblem:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Gold Shield', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200' },
                    { label: 'Electric Bolt', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=200' },
                    { label: 'Classic Store', url: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?auto=format&fit=crop&q=80&w=200' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => updateBusinessLogo(preset.url)}
                      className="p-2 border rounded-xl hover:border-emerald-500 flex flex-col items-center space-y-1 text-xs"
                    >
                      <img src={preset.url} alt={preset.label} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="text-[10px] font-semibold text-slate-700">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {storeProfile.logoUrl && (
                <button
                  type="button"
                  onClick={() => updateBusinessLogo('')}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Remove Current Logo
                </button>
              )}
            </div>

            {/* Receipt Preview */}
            <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Live Thermal Receipt Header Preview
              </span>

              <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm text-center font-mono text-xs max-w-xs mx-auto">
                {storeProfile.logoUrl ? (
                  <img
                    src={storeProfile.logoUrl}
                    alt="Store Logo"
                    className="w-16 h-16 rounded-xl mx-auto object-cover mb-2 border border-slate-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg mx-auto mb-2">
                    AI
                  </div>
                )}
                <div className="font-bold text-sm uppercase">{storeProfile.name}</div>
                <div className="text-[10px] text-slate-600">{storeProfile.receiptHeader}</div>
                <div className="text-[9px] text-slate-400 mt-1">{storeProfile.address}</div>
                <div className="text-[9px] text-slate-500 font-bold">Tel: {storeProfile.phone}</div>
                <div className="border-b border-dashed border-slate-400 my-2"></div>
                <div className="text-[10px] text-slate-400">Sample Thermal Item Breakdown...</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 4: DEALS & BUNDLES MANAGEMENT ---------------- */}
      {activeAdminTab === 'deals' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                All Promotional Deals & Bundle Management
              </h3>
              <p className="text-xs text-slate-500">
                Create contractor package combos, seasonal discounts, and AI-suggested high margin bundles.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleGenerateAiDeal}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI Deal Maker</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddDealModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>+ New Deal Bundle</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  deal.active
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-slate-200 bg-slate-50/50 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-900">
                      {deal.tag}
                    </span>
                    <button
                      onClick={() => updateDeal(deal.id, { active: !deal.active })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        deal.active ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {deal.active ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{deal.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{deal.description}</p>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{deal.itemSummary}</div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 line-through">
                      {storeProfile.currency} {deal.originalPrice.toLocaleString()}
                    </div>
                    <div className="text-base font-black text-slate-900 font-mono-numbers">
                      {storeProfile.currency} {deal.dealPrice.toLocaleString()}{' '}
                      <span className="text-xs font-bold text-emerald-600 font-sans">
                        (-{deal.discountPercent}%)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Delete deal "${deal.title}"?`)) deleteDeal(deal.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- TAB 5: PAYMENT GATEWAYS & QR SETTINGS ---------------- */}
      {activeAdminTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Payment Gateways & QR Code Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Set up your merchant Till numbers, bank accounts, and payment QR codes shown during in-store checkout.
              </p>
            </div>
            {gatewaySavedMsg && (
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold animate-in fade-in flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Changes Saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* JazzCash Settings */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-red-600" />
                  <span className="font-bold text-sm text-slate-900">JazzCash Merchant Details</span>
                </div>
                <input
                  type="checkbox"
                  checked={localGateways.jazzcash.enabled}
                  onChange={(e) =>
                    setLocalGateways({
                      ...localGateways,
                      jazzcash: { ...localGateways.jazzcash, enabled: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Till ID / Merchant #</label>
                <input
                  type="text"
                  value={localGateways.jazzcash.tillId}
                  onChange={(e) =>
                    setLocalGateways({
                      ...localGateways,
                      jazzcash: { ...localGateways.jazzcash, tillId: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Title</label>
                <input
                  type="text"
                  value={localGateways.jazzcash.accountTitle}
                  onChange={(e) =>
                    setLocalGateways({
                      ...localGateways,
                      jazzcash: { ...localGateways.jazzcash, accountTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={localGateways.jazzcash.phone}
                  onChange={(e) =>
                    setLocalGateways({
                      ...localGateways,
                      jazzcash: { ...localGateways.jazzcash, phone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">QR Code Image</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleQrUpload('jazzcash', f);
                      }}
                    />
                  </label>
                  {(localGateways.jazzcash.qrCodeUrl || localGateways.jazzcash.qrUrl) && (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={localGateways.jazzcash.qrCodeUrl || localGateways.jazzcash.qrUrl}
                        alt="JazzCash QR"
                        className="w-8 h-8 rounded border object-contain bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setLocalGateways((prev) => ({
                            ...prev,
                            jazzcash: { ...prev.jazzcash, qrCodeUrl: '', qrUrl: '' },
                          }))
                        }
                        className="text-rose-600 hover:text-rose-800 text-[10px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* EasyPaisa Settings */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-sm text-slate-900">EasyPaisa Merchant Details</span>
                </div>
                <input
                  type="checkbox"
                  checked={localGateways.easypaisa.enabled}
                  onChange={(e) =>
                    setLocalGateways({
                      ...localGateways,
                      easypaisa: { ...localGateways.easypaisa, enabled: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Till ID / Merchant #</label>
                <input
                  type="text"
                  value={localGateways.easypaisa.tillId}
                  onChange={(e) =>
                    setLocalGateways({
                      ...localGateways,
                      easypaisa: { ...localGateways.easypaisa, tillId: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Title</label>
                <input
                  type="text"
                  value={localGateways.easypaisa.accountTitle}
                  onChange={(e) =>
                    setLocalGateways({
                      ...localGateways,
                      easypaisa: { ...localGateways.easypaisa, accountTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={localGateways.easypaisa.phone}
                  onChange={(e) =>
                    setLocalGateways({
                      ...localGateways,
                      easypaisa: { ...localGateways.easypaisa, phone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">QR Code Image</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleQrUpload('easypaisa', f);
                      }}
                    />
                  </label>
                  {(localGateways.easypaisa.qrCodeUrl || localGateways.easypaisa.qrUrl) && (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={localGateways.easypaisa.qrCodeUrl || localGateways.easypaisa.qrUrl}
                        alt="EasyPaisa QR"
                        className="w-8 h-8 rounded border object-contain bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setLocalGateways((prev) => ({
                            ...prev,
                            easypaisa: { ...prev.easypaisa, qrCodeUrl: '', qrUrl: '' },
                          }))
                        }
                        className="text-rose-600 hover:text-rose-800 text-[10px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Transfer / Raast */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Raast / Direct Bank Transfer</span>
                <input
                  type="checkbox"
                  checked={localGateways.bank.enabled}
                  onChange={(e) =>
                    setLocalGateways({
                      ...localGateways,
                      bank: { ...localGateways.bank, enabled: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={localGateways.bank.bankName}
                    onChange={(e) =>
                      setLocalGateways({
                        ...localGateways,
                        bank: { ...localGateways.bank, bankName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Title</label>
                  <input
                    type="text"
                    value={localGateways.bank.accountTitle}
                    onChange={(e) =>
                      setLocalGateways({
                        ...localGateways,
                        bank: { ...localGateways.bank, accountTitle: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">IBAN / Account Number</label>
                <input
                  type="text"
                  value={localGateways.bank.iban}
                  onChange={(e) =>
                    setLocalGateways({
                      ...localGateways,
                      bank: { ...localGateways.bank, iban: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Raast / Bank QR Code Image</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Bank QR</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleQrUpload('bank', f);
                      }}
                    />
                  </label>
                  {localGateways.bank.qrCodeUrl && (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={localGateways.bank.qrCodeUrl}
                        alt="Bank QR"
                        className="w-8 h-8 rounded border object-contain bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setLocalGateways((prev) => ({
                            ...prev,
                            bank: { ...prev.bank, qrCodeUrl: '' },
                          }))
                        }
                        className="text-rose-600 hover:text-rose-800 text-[10px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Machine Terminal */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Card POS Machine Reader</span>
                <input
                  type="checkbox"
                  checked={localGateways.card.enabled}
                  onChange={(e) =>
                    setLocalGateways({
                      ...localGateways,
                      card: { ...localGateways.card, enabled: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Terminal ID</label>
                <input
                  type="text"
                  value={localGateways.card.terminalId}
                  onChange={(e) =>
                    setLocalGateways({
                      ...localGateways,
                      card: { ...localGateways.card, terminalId: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                updatePaymentGateways(localGateways);
                setGatewaySavedMsg(true);
                setTimeout(() => setGatewaySavedMsg(false), 2500);
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Save Payment Method Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------- TAB 6: CHAT BOT INBOX ---------------- */}
      {activeAdminTab === 'chats' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                User & Cashier Helpdesk Chat Log
              </h3>
              <p className="text-xs text-slate-500">
                Messages sent by store operators and users via the floating AI & Admin Help widget.
              </p>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Super Admin Line
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 max-h-[420px] overflow-y-auto space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No chat messages recorded yet.
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                    msg.senderRole === 'admin'
                      ? 'bg-amber-50/80 border-amber-200 ml-8'
                      : msg.senderRole === 'ai'
                      ? 'bg-emerald-50/80 border-emerald-200 mr-8'
                      : 'bg-white border-slate-200 mr-8'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold">
                      {msg.senderRole === 'admin' ? (
                        <span className="text-amber-800 font-bold">★ Master Admin (You)</span>
                      ) : msg.senderRole === 'ai' ? (
                        <span className="text-emerald-700 font-bold">⚡ AI Auto-Responder</span>
                      ) : (
                        <span className="text-slate-900 font-bold">👤 {msg.senderName} ({msg.senderId})</span>
                      )}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-800 leading-relaxed font-sans">{msg.text}</div>
                </div>
              ))
            )}
          </div>

          {/* Quick Admin Reply Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!adminReplyText.trim()) return;
              sendChatMessage(adminReplyText.trim(), true);
              setAdminReplyText('');
            }}
            className="flex items-center space-x-2 pt-2"
          >
            <input
              type="text"
              value={adminReplyText}
              onChange={(e) => setAdminReplyText(e.target.value)}
              placeholder="Send administrative response to users and cashiers..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!adminReplyText.trim()}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
          </form>
        </div>
      )}

      {/* ---------------- TAB 7: AI MANAGER CONFIGURATION ---------------- */}
      {activeAdminTab === 'ai_config' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              AI Manager & Model Directive Parameters
            </h3>
            <p className="text-xs text-slate-500">
              Configure how Gemini 3.8 Flash extracts invoices, detects shelf items, and auto-calculates profit margins.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Gemini Intelligence Model
              </label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-emerald-700 font-bold flex items-center justify-between">
                <span>gemini-3.8-flash (Standard Enterprise)</span>
                <span className="text-[10px] text-slate-500 font-sans bg-white px-2 py-0.5 rounded border">
                  User Secrets Attached
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Wholesale Margin Markup % (AI Suggested Retail)
              </label>
              <input
                type="number"
                defaultValue={25}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                When supplier bills don't specify retail prices, AI will default to this margin.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Urdu OCR & Transliteration Tuning
              </label>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold">Multilingual Urdu / Nastaliq Bill Parser Enabled</div>
                <div className="text-[11px] text-emerald-800">
                  Handles handwritten Urdu notes, Pakistani Rupee denominations, and regional product abbreviations (e.g. 7/29, DP MCB, 10A).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 8: FEATURE LOCKS & SYSTEM LIMITS (LIMIT FULL STOP) ---------------- */}
      {activeAdminTab === 'limits' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Notice Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl border border-indigo-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 mb-2">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Operational Governance & Safety Controls</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">System Feature Locks & Limit Enforcement</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Master toggle controls to lock or unlock powerful POS features, and enforce hard credit ceilings with the <strong>Limit Full Stop</strong> safety barrier.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Feature Locks & Unlocks */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Feature Lock & Unlock Toggles</h4>
                  <p className="text-xs text-slate-500">Enable or restrict system capabilities across all staff terminals</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    key: 'posBilling' as keyof FeatureLockConfig,
                    title: 'Core POS Billing & Register',
                    desc: 'Ringing sales, barcode scanning, printing thermal receipts, and taking payments.',
                  },
                  {
                    key: 'aiBillScanner' as keyof FeatureLockConfig,
                    title: 'Omni-AI Supplier Bill Scanner & OCR',
                    desc: 'Allow uploading and parsing supplier invoices and product photos via Gemini 3.8 Flash.',
                  },
                  {
                    key: 'aiManagerWhatsApp' as keyof FeatureLockConfig,
                    title: 'AI Manager Automated Background WhatsApp',
                    desc: 'Auto-dispatches daily sales, stockout alerts, udhar limits, and salary slips to owner phone.',
                  },
                  {
                    key: 'aiChatbot' as keyof FeatureLockConfig,
                    title: '24/7 AI Chatbot & Customer Support',
                    desc: 'Context-aware conversational assistance answering cashier and owner queries in Urdu & English.',
                  },
                  {
                    key: 'inventoryCatalog' as keyof FeatureLockConfig,
                    title: 'Master Inventory Catalog & Pricing',
                    desc: 'Permits browsing, creating, and modifying product master lists.',
                  },
                  {
                    key: 'stockManagement' as keyof FeatureLockConfig,
                    title: 'Inventory Stock & Critical Alert Thresholds',
                    desc: 'Enables warehouse stock adjustments, reorder points, and zero-inventory warnings.',
                  },
                  {
                    key: 'bulkPriceAdjustment' as keyof FeatureLockConfig,
                    title: 'Bulk Master Price +/- Adjustment Engine',
                    desc: 'Allow store managers to apply percentage price increases or decreases across categories.',
                  },
                  {
                    key: 'udharKhatta' as keyof FeatureLockConfig,
                    title: 'Customer Udhar Khatta (Credit Ledger)',
                    desc: 'Record credit transactions, track customer credit limits, and print khatta statements.',
                  },
                  {
                    key: 'unsecuredUdharOverLimit' as keyof FeatureLockConfig,
                    title: 'Allow Unsecured Udhar Beyond Limit',
                    desc: 'When locked (recommended), customers cannot exceed their approved credit limit without warning.',
                  },
                  {
                    key: 'personKhatta' as keyof FeatureLockConfig,
                    title: 'Person Khatta (Personal Advances & Spend)',
                    desc: 'Tracks advance payments and personal funds given to business partners or individuals.',
                  },
                  {
                    key: 'vipCustomers' as keyof FeatureLockConfig,
                    title: 'VIP Customers Intelligence & Top Buyers',
                    desc: 'Automated ranking of high-value shoppers and repeat clients.',
                  },
                  {
                    key: 'returnsRefunds' as keyof FeatureLockConfig,
                    title: 'Customer Returns, Restocking & Refunds',
                    desc: 'Lookup invoices, restock items into inventory, and issue cash or credit refunds.',
                  },
                  {
                    key: 'customCashierDiscount' as keyof FeatureLockConfig,
                    title: 'Cashier Custom Checkout Discount',
                    desc: 'Permit counter operators to enter arbitrary flat or percentage discounts during billing.',
                  },
                  {
                    key: 'expensesManager' as keyof FeatureLockConfig,
                    title: 'Daily Shop Expenses & WhatsApp Sheet',
                    desc: 'Log utility, tea, carriage, and maintenance expenses with WhatsApp export.',
                  },
                  {
                    key: 'staffSalary' as keyof FeatureLockConfig,
                    title: 'Staff Attendance, Salary & Advance Payouts',
                    desc: 'Manage employees, calculate monthly deductions, and record salary payouts.',
                  },
                  {
                    key: 'supplierLedger' as keyof FeatureLockConfig,
                    title: 'Supplier Payables & Bill Management',
                    desc: 'Manage distributor accounts, purchases, and outstanding supplier liabilities.',
                  },
                  {
                    key: 'salesAnalytics' as keyof FeatureLockConfig,
                    title: 'Sales History & Executive Reports',
                    desc: 'View past invoice logs, profit margins, and daily/monthly performance graphs.',
                  },
                  {
                    key: 'multiBranchSwitch' as keyof FeatureLockConfig,
                    title: 'Multi-Store / Tenant Account Switching',
                    desc: 'Allow switching between registered business profiles and isolated store databases.',
                  },
                  {
                    key: 'whatsappDirectShare' as keyof FeatureLockConfig,
                    title: 'Direct WhatsApp Invoicing & Statements',
                    desc: 'Permit sending digital print bills, salary slips, and khata reminders directly to customer phones.',
                  },
                ].map((item) => {
                  const isUnlocked = featureLocks[item.key];
                  return (
                    <div
                      key={item.key}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="pr-2">
                        <div className="flex items-center space-x-1.5">
                          {isUnlocked ? (
                            <Unlock className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Lock className="w-4 h-4 text-rose-600" />
                          )}
                          <span className="font-bold text-xs text-slate-900">{item.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateFeatureLock(item.key, !isUnlocked)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          isUnlocked
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                        }`}
                      >
                        {isUnlocked ? 'Unlocked ✓' : 'Locked 🔒'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Hard Limits & Limit Full Stop */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Set Operational Limits & Hard Stop</h4>
                  <p className="text-xs text-slate-500">Configure financial and volume safety boundaries</p>
                </div>
              </div>

              {/* CRITICAL: Limit Full Stop Option */}
              <div className="p-4 rounded-2xl border-2 border-rose-300 bg-rose-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Ban className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-black text-xs text-rose-950 uppercase tracking-wider block">
                        Limit Full Stop Mode (POS Hard Barrier)
                      </span>
                      <span className="text-[11px] text-rose-800 font-medium">
                        Strictly reject POS credit sales when customer limit is exhausted
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateSystemLimits({
                        enforceHardUdharLimitStop: !systemLimits.enforceHardUdharLimitStop,
                      })
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide transition-all ${
                      systemLimits.enforceHardUdharLimitStop
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {systemLimits.enforceHardUdharLimitStop ? 'FULL STOP ACTIVE ⛔' : 'WARNING ONLY ⚠️'}
                  </button>
                </div>

                <p className="text-[11px] text-rose-900 leading-relaxed pt-1 border-t border-rose-200">
                  {systemLimits.enforceHardUdharLimitStop
                    ? '✓ Full Stop is ACTIVE: If a customer exceeds their credit limit, POS will hard-block the bill and prevent completion on credit until outstanding dues are recovered.'
                    : '⚠️ Warning Only: Cashiers can override the limit and complete checkout with an amber notification.'}
                </p>
              </div>

              {/* Editable Numeric Limits */}
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Default Customer Udhar Credit Limit ({storeProfile.currency})
                  </label>
                  <input
                    type="number"
                    value={systemLimits.maxCustomerUdharLimit}
                    onChange={(e) =>
                      updateSystemLimits({ maxCustomerUdharLimit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Default ceiling assigned to newly opened Udhar accounts
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Max Bills Allowed / Day
                    </label>
                    <input
                      type="number"
                      value={systemLimits.maxDailyBills}
                      onChange={(e) =>
                        updateSystemLimits({ maxDailyBills: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Max Products in Catalog
                    </label>
                    <input
                      type="number"
                      value={systemLimits.maxCatalogProducts}
                      onChange={(e) =>
                        updateSystemLimits({ maxCatalogProducts: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Permissible Counter Discount (%)
                  </label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={systemLimits.maxDiscountPercentage}
                    onChange={(e) =>
                      updateSystemLimits({ maxDiscountPercentage: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-emerald-700 border border-slate-300 rounded-xl focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Caps maximum manual checkout discount cashiers can enter
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 9: STORE TENANTS & MULTI-BRANCH ---------------- */}
      {activeAdminTab === 'tenants' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Store Tenants & Multi-Store Architecture
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage independent tenant instances. Newly registered stores start cleanly with all metrics at 0, while the primary demo store maintains seeded records.
              </p>
            </div>

            <button
              onClick={() => setIsNewTenantModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Store Tenant</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businessAccounts.map((biz) => {
              const isActive = activeBusinessId === biz.id;
              return (
                <div
                  key={biz.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-slate-500" />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{biz.businessName}</h4>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Owner: {biz.ownerName}
                      </span>
                    </div>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Isolated
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div><strong className="text-slate-700 dark:text-slate-300">Email:</strong> {biz.ownerEmail}</div>
                    <div><strong className="text-slate-700 dark:text-slate-300">Phone:</strong> {biz.phone || 'N/A'}</div>
                    <div><strong className="text-slate-700 dark:text-slate-300">City:</strong> {biz.city || 'N/A'}</div>
                    <div><strong className="text-slate-700 dark:text-slate-300">Vertical:</strong> {biz.vertical.replace('_', ' ')}</div>
                    <div><strong className="text-slate-700 dark:text-slate-300">Tenant ID:</strong> <span className="font-mono">{biz.id}</span></div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={isActive}
                      onClick={() => switchBusinessAccount(biz.id)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 cursor-default'
                          : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-98'
                      }`}
                    >
                      {isActive ? 'Currently Active Store' : 'Switch into this Tenant'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- TAB 10: DATABASE ARCHITECTURE & SQL AUDIT ---------------- */}
      {activeAdminTab === 'database' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Database Architecture & SQL Users Table
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inspect how user accounts, salted PBKDF2 password hashes, and schema definitions are stored.
              </p>
            </div>

            <button
              onClick={fetchDbUsers}
              disabled={dbLoading}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dbLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Rows</span>
            </button>
          </div>

          {/* SQL Schema Definition */}
          <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-sans mb-1">MySQL / PostgreSQL DDL:</div>
            <pre className="whitespace-pre">{`CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}</pre>
          </div>

          {/* Live Rows Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Store</th>
                  <th className="p-3">Password Hash Preview</th>
                  <th className="p-3">Salt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dbUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-slate-500">{u.id}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="p-3 uppercase text-[10px] font-bold">{u.role}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{u.storeName}</td>
                    <td className="p-3 font-mono text-[10px] text-emerald-600 dark:text-emerald-400" title={u.password_hash}>
                      {u.password_preview || `${u.password_hash?.slice(0, 16)}...`}
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-400">{u.salt ? `${u.salt.slice(0, 10)}...` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interactive Cryptographic Hash Sandbox */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" />
              Live Cryptographic PBKDF2 Password Hashing Sandbox
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type any sample password to witness how the backend uses a random 128-bit salt and 1000 rounds of HMAC-SHA512 to produce a irreversible hash:
            </p>

            <div className="flex gap-2 max-w-lg">
              <input
                type="text"
                value={testPasswordInput}
                onChange={(e) => setTestPasswordInput(e.target.value)}
                placeholder="Type password..."
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleTestHash}
                disabled={hashCalculating}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95"
              >
                {hashCalculating ? 'Hashing...' : 'Generate Hash'}
              </button>
            </div>

            {hashResult && (
              <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] space-y-1">
                <div><span className="text-slate-400">Algorithm:</span> <strong className="text-indigo-600">{hashResult.algorithm}</strong></div>
                <div><span className="text-slate-400">Generated Salt:</span> <span className="text-amber-600">{hashResult.salt}</span></div>
                <div className="break-all"><span className="text-slate-400">Resulting Hash:</span> <span className="text-emerald-600 font-bold">{hashResult.resultingHash}</span></div>
                <div className="text-[10px] text-slate-400 font-sans pt-1 border-t border-slate-100 dark:border-slate-800">{hashResult.explanation}</div>
              </div>
            )}
          </div>

          {/* STEP-BY-STEP MULTI-USER DATABASE & GITHUB DEPLOYMENT GUIDE */}
          <div className="p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-indigo-900 text-white space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Production Engineering Guide
                </span>
                <h4 className="text-lg font-black text-white mt-1 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  Multi-User Database Architecture & Step-by-Step GitHub Deployment
                </h4>
              </div>
            </div>

            <p className="text-xs text-indigo-200/90 leading-relaxed">
              This guide provides the complete production roadmap to deploy <strong>Apna AI POS</strong> on GitHub with a multi-tenant relational SQL database (PostgreSQL / MySQL) supporting isolated data for unlimited store owners.
            </p>

            {/* Step 1: Multi-User Relational Database Schema */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[11px] font-mono">1</span>
                <span>Multi-Tenant Relational Schema (PostgreSQL / MySQL)</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-indigo-900/60 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                <pre className="whitespace-pre">{`-- 1. Central Users Table (Authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    role VARCHAR(30) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Multi-User Stores / Tenant Isolation Table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(150) NOT NULL,
    vertical VARCHAR(50) NOT NULL DEFAULT 'electrical_hardware',
    currency VARCHAR(10) DEFAULT 'Rs.',
    phone VARCHAR(30),
    city VARCHAR(80),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Isolated Tenant Data Tables (Foreign Key to stores.id)
CREATE TABLE products (
    id VARCHAR(64) PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    barcode VARCHAR(64) NOT NULL,
    cost_price NUMERIC(12,2) DEFAULT 0,
    retail_price NUMERIC(12,2) DEFAULT 0,
    stock_quantity INT DEFAULT 0,
    min_stock_alert INT DEFAULT 5,
    unit VARCHAR(20) DEFAULT 'pcs'
);

CREATE TABLE sales (
    id VARCHAR(64) PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    invoice_no VARCHAR(60) NOT NULL,
    grand_total NUMERIC(12,2) NOT NULL,
    profit NUMERIC(12,2) DEFAULT 0,
    payment_method VARCHAR(30) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_khatas (
    id VARCHAR(64) PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    credit_limit NUMERIC(12,2) DEFAULT 50000,
    current_balance NUMERIC(12,2) DEFAULT 0
);`}</pre>
              </div>
            </div>

            {/* Step 2: Step-by-Step GitHub Setup Commands */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[11px] font-mono">2</span>
                <span>GitHub Repository Setup & Git Push</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-indigo-900/60 font-mono text-[11px] text-cyan-300 overflow-x-auto space-y-1">
                <div><span className="text-slate-500"># 1. Initialize local Git repository</span></div>
                <div>git init</div>
                <div><span className="text-slate-500"># 2. Stage all codebase files</span></div>
                <div>git add .</div>
                <div><span className="text-slate-500"># 3. Create initial commit</span></div>
                <div>git commit -m "feat: complete multi-tenant AI POS with offline-online sync"</div>
                <div><span className="text-slate-500"># 4. Link to your GitHub repository</span></div>
                <div>git remote add origin https://github.com/your-username/apna-ai-pos.git</div>
                <div><span className="text-slate-500"># 5. Push to GitHub main branch</span></div>
                <div>git branch -M main</div>
                <div>git push -u origin main</div>
              </div>
            </div>

            {/* Step 3: GitHub Actions CI/CD Deployment Workflow */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[11px] font-mono">3</span>
                <span>Automated GitHub Actions Deployment (.github/workflows/deploy.yml)</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-indigo-900/60 font-mono text-[11px] text-indigo-300 overflow-x-auto">
                <pre className="whitespace-pre">{`name: Deploy Apna AI POS to Cloud Production

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build Application
        run: npm run build
        env:
          VITE_APP_TITLE: "Apna AI POS"

      - name: Deploy to Cloud Container (Render / Cloud Run / VPS)
        run: |
          echo "Automated deploy step executed via GitHub Webhook!"`}</pre>
              </div>
            </div>

            {/* Step 4: Environment Variables Checklist */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[11px] font-mono">4</span>
                <span>Production Environment Variables Checklist</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-900/90 rounded-xl border border-indigo-900/50">
                  <div className="font-bold text-emerald-400 font-mono">DATABASE_URL</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">PostgreSQL/MySQL connection string (e.g. Neon, Supabase, Cloud SQL)</div>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-indigo-900/50">
                  <div className="font-bold text-emerald-400 font-mono">GEMINI_API_KEY</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Google AI Studio API key for Gemini 3.8 Flash intelligence</div>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-indigo-900/50">
                  <div className="font-bold text-emerald-400 font-mono">JWT_SECRET</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Secure 256-bit secret token for multi-tenant sessions</div>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-xl border border-indigo-900/50">
                  <div className="font-bold text-emerald-400 font-mono">PORT=3000</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Server listen port for production traffic</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 11: CHANGE ADMIN PASSWORD ---------------- */}
      {activeAdminTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6 max-w-xl">
          <div>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Change Account Password
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update password for <strong className="text-slate-700 dark:text-slate-300 font-mono">{userSession.email}</strong>.
              Your new password is immediately encrypted using a salted PBKDF2 hash.
            </p>
          </div>

          {passSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          {passError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Current Password:
              </label>
              <input
                type="password"
                required
                value={currentPass ?? ''}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Enter current password..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                New Password (minimum 6 characters):
              </label>
              <input
                type="password"
                required
                value={newPass ?? ''}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Enter new password..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Confirm New Password:
              </label>
              <input
                type="password"
                required
                value={confirmPass ?? ''}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Confirm new password..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {passLoading ? 'Updating Database...' : 'Save New Password'}
            </button>
          </form>
        </div>
      )}

      {/* ---------------- TAB: SUPABASE CLOUD BACKEND HUB ---------------- */}
      {activeAdminTab === 'supabase' && <SupabaseCloudHub />}

      {/* Modal: Add New Business Tenant */}
      {isNewTenantModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400">Isolated Instance</span>
                <h3 className="font-bold text-sm">Register New Store Tenant</h3>
              </div>
              <button onClick={() => setIsNewTenantModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Store / Business Name *</label>
                <input
                  type="text"
                  required
                  value={tenantStoreName ?? ''}
                  onChange={(e) => setTenantStoreName(e.target.value)}
                  placeholder="e.g. Al-Madina Hardware"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Owner Name *</label>
                <input
                  type="text"
                  required
                  value={tenantName ?? ''}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={tenantEmail ?? ''}
                    onChange={(e) => setTenantEmail(e.target.value)}
                    placeholder="tariq@shop.com"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={tenantPhone ?? ''}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={tenantCity ?? ''}
                    onChange={(e) => setTenantCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Vertical</label>
                  <select
                    value={tenantVertical}
                    onChange={(e) => setTenantVertical(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="electrical_hardware">Electrical & Hardware</option>
                    <option value="retail_supermarket">Retail / Supermarket</option>
                    <option value="pharmacy">Pharmacy & Health</option>
                    <option value="apparel_fashion">Apparel & Fashion</option>
                    <option value="electronics_mobile">Mobile & Electronics</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-[11px] text-indigo-800 dark:text-indigo-300">
                Notice: New tenant instances start with clean 0 data (0 sales, 0 udhar, 0 products) for complete store isolation.
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewTenantModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  Create Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Modal: Edit Plan Price */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Edit {editingPlan.name} Rates</h3>
              <button onClick={() => setEditingPlan(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlanPrice} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Subscription ({storeProfile.currency})
                </label>
                <input
                  type="number"
                  required
                  value={planMonthlyPrice ?? 0}
                  onChange={(e) => setPlanMonthlyPrice(Number(e.target.value))}
                  className="w-full text-base font-bold font-mono-numbers px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yearly Subscription ({storeProfile.currency})
                </label>
                <input
                  type="number"
                  required
                  value={planYearlyPrice ?? 0}
                  onChange={(e) => setPlanYearlyPrice(Number(e.target.value))}
                  className="w-full text-base font-bold font-mono-numbers px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Save Plan Pricing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Cashier / User */}
      {isAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Register New Operator</h3>
              <button onClick={() => setIsAddUserModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName ?? ''}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Asif Khan"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Login Email *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail ?? ''}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="asif.counter@godigly.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="cashier">Counter Cashier</option>
                    <option value="manager">Store Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
                  <input
                    type="text"
                    value={newUserBranch ?? ''}
                    onChange={(e) => setNewUserBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Deal Bundle */}
      {isAddDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Create New Deal Bundle</h3>
              <button onClick={() => setIsAddDealModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={dealTitle ?? ''}
                  onChange={(e) => setDealTitle(e.target.value)}
                  placeholder="e.g. Electrician Deluxe Starter Combo"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Items Included</label>
                <input
                  type="text"
                  value={dealDesc ?? ''}
                  onChange={(e) => setDealDesc(e.target.value)}
                  placeholder="2x Coils 7/29 Wire + 4x Schneider Breakers"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Original MRP ({storeProfile.currency})
                  </label>
                  <input
                    type="number"
                    value={dealOriginal || ''}
                    onChange={(e) => setDealOriginal(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Deal Price ({storeProfile.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={dealPrice || ''}
                    onChange={(e) => setDealPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold text-emerald-700 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={dealTag ?? ''}
                  onChange={(e) => setDealTag(e.target.value)}
                  placeholder="e.g. Hot Deal / Contractor Pack"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddDealModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Launch Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Staff Role & Permissions */}
      {permissionEditingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">Role & Security Policy</span>
                <h3 className="font-bold text-sm">Staff Permissions: {permissionEditingUser.name}</h3>
              </div>
              <button onClick={() => setPermissionEditingUser(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={permissionEditingUser.role}
                  onChange={(e) => {
                    const newRole = e.target.value as StaffRole;
                    setPermissionEditingUser({ ...permissionEditingUser, role: newRole });
                    updateSystemUser(permissionEditingUser.id, { role: newRole });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-bold"
                >
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="manager">Store Manager</option>
                  <option value="cashier">Counter Cashier</option>
                  <option value="accountant">Auditor & Accountant</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="block text-xs font-bold text-slate-800 mb-1">
                  Granular Operational Privileges:
                </span>
                {[
                  { key: 'canDiscount', label: 'Apply Custom Discounts at Checkout' },
                  { key: 'canEditPrices', label: 'Adjust Master Catalog & Wholesale Prices' },
                  { key: 'canAccessAdmin', label: 'Access Admin Dashboard & Management' },
                  { key: 'canManageStock', label: 'Manage Stock Quantities & Adjustments' },
                  { key: 'canViewProfit', label: 'View Revenue, BI Reports & Margins' },
                  { key: 'canGiveUdhar', label: 'Debit & Credit Customer Udhar Ledger' },
                ].map((item) => {
                  const hasPerm =
                    permissionEditingUser.permissions?.[item.key as keyof StaffPermission] ?? true;
                  return (
                    <label
                      key={item.key}
                      className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={hasPerm}
                        onChange={(e) => {
                          const currentPerms: StaffPermission = permissionEditingUser.permissions || {
                            canDiscount: true,
                            canEditPrices: false,
                            canAccessAdmin: false,
                            canManageStock: true,
                            canViewProfit: false,
                            canGiveUdhar: true,
                          };
                          const updated: StaffPermission = {
                            ...currentPerms,
                            [item.key as keyof StaffPermission]: e.target.checked,
                          };
                          setPermissionEditingUser({ ...permissionEditingUser, permissions: updated });
                          updateSystemUser(permissionEditingUser.id, { permissions: updated });
                        }}
                        className="rounded text-emerald-600 w-4 h-4"
                      />
                      <span className="font-medium text-slate-700">{item.label}</span>
                    </label>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPermissionEditingUser(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminPanel: React.FC = () => {
  const { userSession } = usePos();
  const [isOtpUnlocked, setIsOtpUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem('godigly_admin_otp_verified') === 'true';
    } catch {
      return false;
    }
  });

  const isAuthorized = userSession.email.toLowerCase().trim() === 'bashirsonselectric@gmail.com';

  if (!isAuthorized || !isOtpUnlocked) {
    return (
      <AdminOtpLock
        onUnlockSuccess={() => {
          setIsOtpUnlocked(true);
        }}
      />
    );
  }

  return (
    <AdminPanelContent
      onLock={() => {
        sessionStorage.removeItem('godigly_admin_otp_verified');
        setIsOtpUnlocked(false);
      }}
    />
  );
};

