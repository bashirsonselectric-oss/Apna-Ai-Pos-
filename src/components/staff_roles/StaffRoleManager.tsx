import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { StaffRole, RoleTabPermissions } from '../../types';
import { ActiveTab } from '../Navigation';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Lock,
  Unlock,
  Check,
  Eye,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CreditCard,
  LayoutDashboard,
  Package,
  Layers,
  BookOpen,
  UserCheck,
  Receipt,
  Palette,
  Percent,
  Settings,
  HelpCircle,
  UserPlus,
  Key,
  Copy,
  Trash2,
  ExternalLink,
  Shield,
  EyeOff,
  Send,
  CheckCircle2,
} from 'lucide-react';

export const StaffRoleManager: React.FC = () => {
  const {
    rolePermissions,
    updateRolePermissions,
    simulatedRole,
    setSimulatedRole,
    userSession,
    storeProfile,
    staffAccounts,
    registerStaffAccount,
    deleteStaffAccount,
  } = usePos();

  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'register'>('matrix');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('cashier');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Staff Account Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<StaffRole>('cashier');
  const [regPhone, setRegPhone] = useState('+92 3');
  const [regSalary, setRegSalary] = useState<number>(35000);
  const [regBranch, setRegBranch] = useState('Counter #1 POS Terminal');
  const [showPassword, setShowPassword] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789!@#$';
    let pass = 'Staff@';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRegPassword(pass);
  };

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) return;

    const res = await registerStaffAccount({
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword.trim(),
      role: regRole,
      phone: regPhone.trim(),
      baseSalary: Number(regSalary) || 35000,
      assignedBranch: regBranch.trim(),
      status: 'active',
    });

    setRegSuccessMessage(res.message);
    setTimeout(() => setRegSuccessMessage(null), 4000);

    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegPhone('+92 3');
    setRegBranch('Counter #1 POS Terminal');
  };

  const copyCredentials = (acc: any) => {
    const text = `*Store Staff Login Credentials*\nStore: ${storeProfile.name}\nName: ${acc.name}\nEmail: ${acc.email}\nPassword: ${acc.password}\nRole: ${acc.role.toUpperCase()}${acc.role === 'cashier' ? ' (Restricted to POS Counter only)' : ''}\nLogin Link: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const rolesList: { role: StaffRole; label: string; badgeColor: string; defaultFocus: string }[] = [
    {
      role: 'cashier',
      label: 'Cashier / Counter Staff',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      defaultFocus: 'Restricted strictly to POS Counter billing only.',
    },
    {
      role: 'manager',
      label: 'Store Manager',
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      defaultFocus: 'Floor supervision, inventory restocking, attendance & returns.',
    },
    {
      role: 'accountant',
      label: 'Accountant',
      badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      defaultFocus: 'Khatas, cash reconciliations, expenses, and staff payroll.',
    },
    {
      role: 'admin',
      label: 'Master Admin / Owner',
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      defaultFocus: 'Full unrestricted control over all POS modules & database.',
    },
  ];

  const allModules: { id: ActiveTab; label: string; group: string; icon: any }[] = [
    { id: 'pos', label: 'POS Billing Counter (F2)', group: 'Operations', icon: CreditCard },
    { id: 'dashboard', label: 'Sales & Profit Dashboard', group: 'Operations', icon: LayoutDashboard },
    { id: 'returns', label: 'Returns & Refunds', group: 'Operations', icon: RotateCcw },
    { id: 'ai_manager', label: 'AI WhatsApp Manager', group: 'Operations', icon: Sparkles },
    { id: 'ai_hub', label: 'Omni-AI Vision & Scanner', group: 'Operations', icon: Sparkles },
    { id: 'inventory', label: 'Catalog & Schema', group: 'Inventory', icon: Package },
    { id: 'stock', label: 'Stock, Coil & Loose Meters', group: 'Inventory', icon: Layers },
    { id: 'attendance', label: 'Staff Attendance / Haazri', group: 'Staff & HR', icon: UserCheck },
    { id: 'salary', label: 'Staff Salary & Advances', group: 'Staff & HR', icon: Users },
    { id: 'staff_roles', label: 'Role Permissions (RBAC)', group: 'Staff & HR', icon: ShieldCheck },
    { id: 'khata', label: 'Customer Udhar Khatta', group: 'Ledgers', icon: BookOpen },
    { id: 'person_khatta', label: 'Person Spending Khatta', group: 'Ledgers', icon: BookOpen },
    { id: 'vip_customers', label: 'VIP Customer Analytics', group: 'Ledgers', icon: Users },
    { id: 'payments', label: 'Payment Transactions', group: 'Finance', icon: CreditCard },
    { id: 'expenses', label: 'Store Expenses & Payouts', group: 'Finance', icon: Percent },
    { id: 'suppliers', label: 'Supplier & Vendor Ledger', group: 'Finance', icon: Package },
    { id: 'analytics', label: 'Financial Analytics', group: 'Finance', icon: LayoutDashboard },
    { id: 'bill_templates', label: 'Bill Template Library', group: 'Customization', icon: Receipt },
    { id: 'theme_library', label: 'SaaS Theme Library', group: 'Customization', icon: Palette },
    { id: 'admin', label: 'Master Admin Panel & DB', group: 'Administration', icon: ShieldCheck },
    { id: 'settings', label: 'Store & Cloud Settings', group: 'Administration', icon: Settings },
  ];

  const currentConfig = rolePermissions[selectedRole] || {
    role: selectedRole,
    label: selectedRole,
    description: '',
    allowedTabs: selectedRole === 'cashier' ? ['pos'] : ['dashboard', 'pos'],
    canDiscount: false,
    canEditPrices: false,
    canManageStock: false,
    canGiveUdhar: false,
    canViewProfit: false,
    canManageStaff: false,
    canAccessAdmin: false,
  };

  const toggleTabPermission = (tabId: ActiveTab) => {
    if (selectedRole === 'admin') return; // Admin always has full access

    const currentTabs = currentConfig.allowedTabs || [];
    const nextTabs = currentTabs.includes(tabId)
      ? currentTabs.filter((t) => t !== tabId)
      : [...currentTabs, tabId];

    updateRolePermissions(selectedRole, { allowedTabs: nextTabs });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const toggleActionPermission = (key: keyof RoleTabPermissions) => {
    if (selectedRole === 'admin') return;
    const currentVal = !!currentConfig[key];
    updateRolePermissions(selectedRole, { [key]: !currentVal });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // 1-Click: Strictly enforce Cashier = POS only
  const setCashierStrictPosOnly = () => {
    updateRolePermissions('cashier', {
      allowedTabs: ['pos'],
      canDiscount: false,
      canEditPrices: false,
      canManageStock: false,
      canGiveUdhar: false,
      canViewProfit: false,
      canManageStaff: false,
      canAccessAdmin: false,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Staff Roles & Access Permissions (RBAC)
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-urdu mt-0.5">
                ملازمین کے اختیارات، کیشیئر کے لیے صرف پی او ایس کاؤنٹر اور محفوظ حدود
              </div>
            </div>
          </div>
        </div>

        {/* Live Simulator Quick Bar */}
        <div className="bg-slate-900 text-white p-2 rounded-2xl flex items-center space-x-2 border border-slate-700 shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate View:</span>
          </span>
          {(['cashier', 'manager', 'accountant', 'admin'] as const).map((r) => {
            const isActive = (simulatedRole || userSession.role) === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setSimulatedRole(r === 'admin' ? null : r)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {r}
              </button>
            );
          })}
          {simulatedRole && (
            <button
              type="button"
              onClick={() => setSimulatedRole(null)}
              className="text-[10px] text-amber-400 hover:text-amber-300 underline px-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Sub-Page Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'matrix'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Role Permissions Matrix (RBAC)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('register')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'register'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Staff Accounts & Registration ({staffAccounts.length})</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-500 font-bold">
            Email & Pass
          </span>
        </button>
      </div>

      {/* ---------------- SUB-PAGE 1: ROLE PERMISSIONS MATRIX ---------------- */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          {/* Cashier Mode Alert Banner */}
      {(simulatedRole === 'cashier' || userSession.role === 'cashier') && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold">Cashier Role Active: Restricted Strictly to POS Counter</div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
              In this mode, back-office views (Dashboard, Catalog, Khatas, Settings, Admin) are strictly locked. Cashiers only have access to <strong>POS Counter</strong> billing to prevent unauthorized data tampering.
            </p>
          </div>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rolesList.map((rDef) => {
          const isSelected = selectedRole === rDef.role;
          const allowedCount = (rolePermissions[rDef.role]?.allowedTabs || []).length;

          return (
            <button
              key={rDef.role}
              type="button"
              onClick={() => setSelectedRole(rDef.role)}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-lg ring-2 ring-indigo-500/20'
                  : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rDef.badgeColor}`}>
                  {rDef.role.toUpperCase()}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {rDef.role === 'admin' ? 'All (21)' : `${allowedCount} Allowed`}
                </span>
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">{rDef.label}</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {rDef.defaultFocus}
              </p>
            </button>
          );
        })}
      </div>

      {/* Role Settings Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
        {/* Role Config Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base text-slate-900 dark:text-white capitalize">
                {selectedRole} Access Permissions
              </h3>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Toggle navigation tabs and transactional permissions for this staff tier.
            </p>
          </div>

          {selectedRole === 'cashier' && (
            <button
              type="button"
              onClick={setCashierStrictPosOnly}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Reset Cashier to POS Only</span>
            </button>
          )}
        </div>

        {/* Action Privileges Checkboxes */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Transactional Action Permissions
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'canDiscount' as const, label: 'Allow Custom Checkout Discount', desc: 'Can enter bill discounts beyond preset deals' },
              { key: 'canEditPrices' as const, label: 'Allow Price Modification', desc: 'Can adjust wholesale cost and retail rates' },
              { key: 'canManageStock' as const, label: 'Allow Stock Adjustments', desc: 'Can add, remove or adjust inventory quantities' },
              { key: 'canGiveUdhar' as const, label: 'Allow Giving Udhar (Credit)', desc: 'Can complete sales on customer credit account' },
              { key: 'canViewProfit' as const, label: 'Allow Viewing Gross Margin / Profit', desc: 'Can view wholesale purchase costs & margins' },
              { key: 'canManageStaff' as const, label: 'Allow Managing Staff Attendance', desc: 'Can mark or edit daily employee attendance' },
            ].map((perm) => {
              const isChecked = selectedRole === 'admin' ? true : !!currentConfig[perm.key];
              const isDisabled = selectedRole === 'admin';

              return (
                <label
                  key={perm.key}
                  className={`p-3 rounded-xl border flex items-start space-x-3 transition-colors ${
                    isChecked
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  } ${isDisabled ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    disabled={isDisabled}
                    checked={isChecked}
                    onChange={() => toggleActionPermission(perm.key)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">{perm.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{perm.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Modules Navigation Access Matrix */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Allowed Sidebar Navigation Tabs
            </h4>
            <span className="text-[11px] text-slate-400">
              Tabs unchecked will be completely hidden from this staff role
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allModules.map((mod) => {
              const Icon = mod.icon;
              const isAllowed = selectedRole === 'admin' ? true : currentConfig.allowedTabs.includes(mod.id);
              const isDisabled = selectedRole === 'admin';

              return (
                <button
                  key={mod.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggleTabPermission(mod.id)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isAllowed
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-800 dark:border-slate-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isAllowed ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-xs">{mod.label}</div>
                      <div className="text-[10px] opacity-70">{mod.group}</div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isAllowed ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  )}

  {/* ---------------- SUB-PAGE 2: STAFF REGISTRATION & CREDENTIALS ---------------- */}
  {activeSubTab === 'register' && (
    <div className="space-y-6">
      {regSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{regSuccessMessage}</span>
        </div>
      )}

      {/* Cashier Protection Info Box */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold">Automated Role Enforcement for Staff Accounts</div>
          <p className="text-[11px] text-amber-800 dark:text-amber-300">
            When staff members log in with their email and password, their interface automatically adapts. For example, selecting <strong>Cashier</strong> strictly exposes only the POS Counter, locking away catalogs, Khatas, profit, and back-office settings.
          </p>
        </div>
      </div>

      {/* Registration Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Register Regular Staff User Account
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assign Name, Email, Password, and Role (Cashier, Manager, Accountant). Saved in database for staff login.
            </p>
          </div>
        </div>

        <form onSubmit={handleRegisterStaff} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Staff Full Name *
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Asad Ullah (Cashier #2)"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-bold focus:outline-hidden"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Staff Email (Used to Log In) *
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. cashier2@bashirsons.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-mono focus:outline-hidden"
              />
            </div>

            {/* Password with generator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Staff Password *
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                >
                  Auto-Generate
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="e.g. Cashier@2026"
                  className="w-full pl-3 pr-10 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-mono font-bold focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Role *
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as StaffRole)}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
              >
                <option value="cashier">Cashier (Shows ONLY POS Counter option)</option>
                <option value="manager">Store Manager (Floor & Restock)</option>
                <option value="accountant">Accountant (Khatas & Finance)</option>
                <option value="admin">Master Administrator</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone / WhatsApp Number
              </label>
              <input
                type="text"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-mono focus:outline-hidden"
              />
            </div>

            {/* Base Salary */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Salary ({storeProfile.currency})
              </label>
              <input
                type="number"
                value={regSalary}
                onChange={(e) => setRegSalary(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-mono font-bold focus:outline-hidden"
              />
            </div>
          </div>

          {/* Branch or Terminal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Counter / Branch
              </label>
              <input
                type="text"
                value={regBranch}
                onChange={(e) => setRegBranch(e.target.value)}
                placeholder="e.g. Counter #1 POS Terminal"
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Save Staff Account & Generate Credentials</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Registered Staff Accounts Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Active Staff Credentials & Account Directory
            </span>
            <div className="text-[11px] text-slate-400">
              Staff can log in with their email and password • Cashiers will strictly see only POS
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
            {staffAccounts.length} Registered Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Staff Name & Contact</th>
                <th className="p-3.5">Role & Restrictions</th>
                <th className="p-3.5">Login Email</th>
                <th className="p-3.5">Password</th>
                <th className="p-3.5">Terminal / Branch</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {staffAccounts.map((acc) => {
                const isRevealed = revealedPasswords[acc.id] || false;
                const isCashier = acc.role === 'cashier';

                return (
                  <tr key={acc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{acc.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{acc.phone || 'No phone'}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isCashier
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : acc.role === 'manager'
                              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                              : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {acc.role}
                        </span>
                        {isCashier && (
                          <div className="text-[9.5px] text-amber-600 dark:text-amber-400 font-semibold">
                            🔒 Strictly POS Only
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-800 dark:text-slate-200">
                      {acc.email}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center space-x-1.5 font-mono">
                        <span className="font-bold">
                          {isRevealed ? acc.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedPasswords((prev) => ({
                              ...prev,
                              [acc.id]: !prev[acc.id],
                            }))
                          }
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                          title="Toggle password view"
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-500 dark:text-slate-400">
                      {acc.assignedBranch || 'Main Branch'}
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Simulate this role */}
                        <button
                          type="button"
                          onClick={() => {
                            setSimulatedRole(acc.role);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-500/20 flex items-center gap-1 cursor-pointer"
                          title="Test what this staff member sees"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Test View</span>
                        </button>

                        {/* Copy Credentials */}
                        <button
                          type="button"
                          onClick={() => copyCredentials(acc)}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                          title="Copy login details for WhatsApp"
                        >
                          {copiedId === acc.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === acc.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => deleteStaffAccount(acc.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                          title="Delete account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}
</div>
  );
};
