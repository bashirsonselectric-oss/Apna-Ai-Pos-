import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { StaffMember, SalaryPayoutRecord, StaffAdvanceRecord, PaymentMethod } from '../../types';
import {
  Users,
  Banknote,
  Smartphone,
  Building,
  CreditCard,
  Plus,
  Send,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  DollarSign,
  TrendingDown,
  Gift,
  Phone,
  Clock,
  Printer,
  UserMinus,
  UserCheck,
  RotateCcw,
  UserX,
} from 'lucide-react';

export const StaffSalary: React.FC = () => {
  const {
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
    storeProfile,
  } = usePos();

  const [activeTab, setActiveTab] = useState<'roster' | 'payouts' | 'advances'>('roster');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'left'>('all');

  // Modals
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isLeftModalOpen, setIsLeftModalOpen] = useState(false);
  const [staffToMarkLeft, setStaffToMarkLeft] = useState<StaffMember | null>(null);
  const [selectedStaffForAction, setSelectedStaffForAction] = useState<StaffMember | null>(null);
  const [selectedSlipForView, setSelectedSlipForView] = useState<SalaryPayoutRecord | null>(null);

  // Employee Left Form State
  const [leftDate, setLeftDate] = useState(new Date().toISOString().split('T')[0]);
  const [leftReason, setLeftReason] = useState('Resigned / Better Opportunity');
  const [leftCustomNote, setLeftCustomNote] = useState('');

  // New staff form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('+92 3');
  const [newStaffRole, setNewStaffRole] = useState<'cashier' | 'manager' | 'accountant'>('cashier');
  const [newStaffBaseSalary, setNewStaffBaseSalary] = useState<number>(30000);

  // Advance form state
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [advanceReason, setAdvanceReason] = useState('Personal / Family Need');
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>('cash');

  // Payout form state
  const [payoutMonthYear, setPayoutMonthYear] = useState('October 2026');
  const [payoutBonus, setPayoutBonus] = useState<number>(0);
  const [payoutDeduction, setPayoutDeduction] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<PaymentMethod>('bank_transfer');
  const [payoutNotes, setPayoutNotes] = useState('');

  // Filtered employees
  const activeStaffCount = staffMembers.filter((s) => s.status !== 'left').length;
  const leftStaffCount = staffMembers.filter((s) => s.status === 'left').length;

  const displayedStaff = staffMembers.filter((s) => {
    if (statusFilter === 'active') return s.status !== 'left';
    if (statusFilter === 'left') return s.status === 'left';
    return true;
  });

  // Calculations (Active Staff Only for Payroll commitments)
  const totalMonthlyPayroll = staffMembers
    .filter((s) => s.status !== 'left')
    .reduce((sum, s) => sum + s.baseSalary, 0);
  const totalAdvancesActive = staffMembers.reduce((sum, s) => sum + s.monthlyAdvances, 0);
  const totalPaidOutThisMonth = salaryPayouts.reduce((sum, p) => sum + p.netPaid, 0);

  // Handle Mark As Left
  const handleConfirmMarkLeft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffToMarkLeft) return;

    const fullReason = leftReason === 'Other / Custom Reason' && leftCustomNote
      ? leftCustomNote.trim()
      : leftCustomNote
      ? `${leftReason} - ${leftCustomNote.trim()}`
      : leftReason;

    markStaffAsLeft(staffToMarkLeft.id, leftDate, fullReason);
    setIsLeftModalOpen(false);
    setStaffToMarkLeft(null);
    setLeftCustomNote('');
  };

  // Add staff member handler
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || newStaffBaseSalary <= 0) return;

    addStaffMember({
      name: newStaffName.trim(),
      phone: newStaffPhone.trim(),
      role: newStaffRole,
      baseSalary: newStaffBaseSalary,
      monthlyAdvances: 0,
      monthlyDeductions: 0,
      monthlyBonuses: 0,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });

    setIsAddStaffOpen(false);
    setNewStaffName('');
    setNewStaffPhone('+92 3');
    setNewStaffBaseSalary(30000);
  };

  // Give advance payment handler
  const handleGiveAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForAction || advanceAmount <= 0) return;

    recordStaffAdvance({
      staffId: selectedStaffForAction.id,
      staffName: selectedStaffForAction.name,
      amount: advanceAmount,
      reason: advanceReason.trim() || 'General advance',
      paymentMethod: advanceMethod,
    });

    setIsAdvanceModalOpen(false);
    setAdvanceAmount(0);
    setAdvanceReason('');
    setSelectedStaffForAction(null);
  };

  // Record payout handler
  const handleRecordPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForAction) return;

    const base = selectedStaffForAction.baseSalary;
    const advances = selectedStaffForAction.monthlyAdvances;
    const net = Math.max(0, base - advances - payoutDeduction + payoutBonus);

    const payout: Omit<SalaryPayoutRecord, 'id' | 'payoutDate'> = {
      staffId: selectedStaffForAction.id,
      staffName: selectedStaffForAction.name,
      monthYear: payoutMonthYear,
      baseSalary: base,
      advancesDeducted: advances,
      bonusesAdded: payoutBonus,
      finesDeducted: payoutDeduction,
      netPaid: net,
      paymentMethod: payoutMethod,
      notes: payoutNotes.trim() || undefined,
    };

    recordSalaryPayout(payout);
    setIsPayoutModalOpen(false);
    setPayoutBonus(0);
    setPayoutDeduction(0);
    setPayoutNotes('');
    setSelectedStaffForAction(null);
  };

  // Share salary slip via WhatsApp
  const shareSlipViaWhatsApp = (slip: SalaryPayoutRecord) => {
    const text = `💼 *MONTHLY SALARY SLIP / VOUCHER*
🏪 *Store:* ${storeProfile.name}
👤 *Employee:* ${slip.staffName}
📅 *Month:* ${slip.monthYear}
━━━━━━━━━━━━━━━━━━━
💵 *Base Salary:* ${storeProfile.currency} ${slip.baseSalary.toLocaleString()}
➖ *Advance Deducted:* ${storeProfile.currency} ${slip.advancesDeducted.toLocaleString()}
➖ *Fines / Leaves:* ${storeProfile.currency} ${slip.finesDeducted.toLocaleString()}
➕ *Incentive / Bonus:* ${storeProfile.currency} ${slip.bonusesAdded.toLocaleString()}
━━━━━━━━━━━━━━━━━━━
✅ *NET SALARY PAID:* ${storeProfile.currency} ${slip.netPaid.toLocaleString()}
💳 *Disbursed Via:* ${slip.paymentMethod.toUpperCase()}
🗓️ *Payment Date:* ${slip.payoutDate}
${slip.notes ? `📝 *Notes:* ${slip.notes}\n` : ''}
⚡ *Verified by Apna AI POS - Godigly Cloud*`;

    const encoded = encodeURI(text);
    const staff = staffMembers.find((s) => s.id === slip.staffId);
    const phoneClean = staff?.phone ? staff.phone.replace(/[^0-9]/g, '') : '';
    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Staff Salary & Payroll Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly base salaries, advance tracking, deduction calculations, and instant WhatsApp salary slips.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAddStaffOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-700/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Total Monthly Payroll</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-slate-900 dark:text-white mt-1">
            {storeProfile.currency} {totalMonthlyPayroll.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">{staffMembers.length} active employees</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Active Advances</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-amber-600 dark:text-amber-400 mt-1">
            {storeProfile.currency} {totalAdvancesActive.toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-500 font-semibold">Will adjust on payout</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Disbursed Salaries</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-emerald-600 dark:text-emerald-400 mt-1">
            {storeProfile.currency} {totalPaidOutThisMonth.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Paid out this month</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Pending Net Due</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-indigo-600 dark:text-indigo-400 mt-1">
            {storeProfile.currency}{' '}
            {Math.max(0, totalMonthlyPayroll - totalAdvancesActive - totalPaidOutThisMonth).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Estimated remaining payout</span>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'roster'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Staff Roster & Calculations ({staffMembers.length})
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'payouts'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Salary Slips & Disbursed History ({salaryPayouts.length})
        </button>
        <button
          onClick={() => setActiveTab('advances')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'advances'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Advance Payment Ledger ({staffAdvances.length})
        </button>
      </div>

      {/* Tab 1: Staff Roster & Calculations */}
      {activeTab === 'roster' && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          {/* Header & Status Filter Pills */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                Employee List & Monthly Payroll Roster
              </span>
              <div className="text-[11px] text-slate-400">
                Net = Base - Advance - Deductions + Bonus • Filter active vs left/resigned staff
              </div>
            </div>

            {/* Status Filters */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                All Staff ({staffMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-600 hover:text-emerald-700'
                }`}
              >
                Active ({activeStaffCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('left')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === 'left'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-rose-600 hover:text-rose-700'
                }`}
              >
                Left Staff ({leftStaffCount})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">Employee Name</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Employment Status</th>
                  <th className="p-3.5 text-right">Base Salary</th>
                  <th className="p-3.5 text-right">Advances Taken</th>
                  <th className="p-3.5 text-right">Net Payable Now</th>
                  <th className="p-3.5 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedStaff.map((staff) => {
                  const isLeft = staff.status === 'left';
                  const netPayable = Math.max(0, staff.baseSalary - staff.monthlyAdvances);
                  return (
                    <tr
                      key={staff.id}
                      className={`transition-colors ${
                        isLeft
                          ? 'bg-rose-500/5 dark:bg-rose-950/10 hover:bg-rose-500/10'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/40'
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{staff.name}</span>
                          {isLeft && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-500 font-bold uppercase">
                              Left
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">{staff.phone}</div>
                        {staff.email && (
                          <div className="text-[10px] text-slate-400 font-mono">{staff.email}</div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="capitalize px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {staff.role}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {isLeft ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <UserX className="w-3 h-3 text-rose-500" />
                              EMPLOYEE LEFT
                            </span>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                              <div>
                                <strong>Left:</strong> {staff.leftDate || 'Recorded'}
                              </div>
                              <div className="italic truncate max-w-[180px]">
                                {staff.leftReason || 'Resigned'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <UserCheck className="w-3 h-3 text-emerald-500" />
                            ACTIVE
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right font-mono-numbers font-bold text-slate-900 dark:text-white">
                        {storeProfile.currency} {staff.baseSalary.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-right font-mono-numbers font-bold">
                        <span
                          className={
                            staff.monthlyAdvances > 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-400'
                          }
                        >
                          {storeProfile.currency} {staff.monthlyAdvances.toLocaleString()}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono-numbers font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {storeProfile.currency} {netPayable.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5 flex-wrap gap-y-1">
                          {isLeft ? (
                            <button
                              type="button"
                              onClick={() => reactivateStaff(staff.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-500/20 flex items-center gap-1 cursor-pointer"
                              title="Reactivate / Rehire Employee"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reactivate / Rejoin</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStaffForAction(staff);
                                  setIsAdvanceModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-500/20 cursor-pointer"
                              >
                                Advance
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStaffForAction(staff);
                                  setIsPayoutModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs cursor-pointer"
                              >
                                Pay Salary
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setStaffToMarkLeft(staff);
                                  setLeftDate(new Date().toISOString().split('T')[0]);
                                  setLeftReason('Resigned / Better Opportunity');
                                  setLeftCustomNote('');
                                  setIsLeftModalOpen(true);
                                }}
                                className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-500/20 flex items-center gap-1 cursor-pointer"
                                title="Mark this employee as left or resigned"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Mark Left</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Salary Payouts & Slips History */}
      {activeTab === 'payouts' && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-white">Disbursed Salary History & Slips</span>
            <span className="text-[11px] text-slate-400">One-tap WhatsApp delivery</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">Date Paid</th>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Salary Period</th>
                  <th className="p-3.5 text-right">Base</th>
                  <th className="p-3.5 text-right">Advances Adj.</th>
                  <th className="p-3.5 text-right">Net Paid</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5 text-center">WhatsApp Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {salaryPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No monthly salary payouts recorded yet.
                    </td>
                  </tr>
                ) : (
                  salaryPayouts.map((slip) => (
                    <tr key={slip.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">{slip.payoutDate}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{slip.staffName}</td>
                      <td className="p-3.5 font-semibold text-indigo-600 dark:text-indigo-400">{slip.monthYear}</td>
                      <td className="p-3.5 text-right font-mono-numbers">{storeProfile.currency} {slip.baseSalary.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono-numbers text-amber-600">-{storeProfile.currency} {slip.advancesDeducted.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono-numbers font-black text-emerald-600 dark:text-emerald-400">
                        {storeProfile.currency} {slip.netPaid.toLocaleString()}
                      </td>
                      <td className="p-3.5 uppercase font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {slip.paymentMethod}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => shareSlipViaWhatsApp(slip)}
                          className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>WhatsApp Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Advances Ledger */}
      {activeTab === 'advances' && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-white">Staff Advance Payment History</span>
            <span className="text-[11px] text-slate-400">Log of all disbursed advances</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Staff Name</th>
                  <th className="p-3.5">Reason / Note</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5 text-right">Advance Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {staffAdvances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">
                      No advances given to staff yet.
                    </td>
                  </tr>
                ) : (
                  staffAdvances.map((adv) => (
                    <tr key={adv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">{adv.date}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{adv.staffName}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">{adv.reason}</td>
                      <td className="p-3.5 uppercase text-[10px] font-mono text-slate-500">{adv.paymentMethod}</td>
                      <td className="p-3.5 text-right font-mono-numbers font-black text-amber-600 dark:text-amber-400">
                        {storeProfile.currency} {adv.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Give Advance Modal (with right-side scrollbar) */}
      {isAdvanceModalOpen && selectedStaffForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="bg-amber-600 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">Staff Advance</span>
                <h3 className="text-base font-bold">Give Advance: {selectedStaffForAction.name}</h3>
              </div>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="p-1 text-amber-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGiveAdvance} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-xs space-y-1 border border-amber-200 dark:border-amber-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Salary:</span>
                  <span className="font-bold">{storeProfile.currency} {selectedStaffForAction.baseSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Previous Advances Taken:</span>
                  <span className="font-bold text-amber-600">{storeProfile.currency} {selectedStaffForAction.monthlyAdvances.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Advance Amount ({storeProfile.currency}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedStaffForAction.baseSalary}
                  value={advanceAmount || ''}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 text-base font-black font-mono-numbers text-amber-600 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                <select
                  value={advanceMethod}
                  onChange={(e) => setAdvanceMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                >
                  <option value="cash">Cash In Drawer</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={advanceReason ?? ''}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  placeholder="e.g. Family medical expense, house rent..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20"
                >
                  Confirm Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Salary Payout Modal (with right-side scrollbar) */}
      {isPayoutModalOpen && selectedStaffForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Monthly Payout</span>
                <h3 className="text-base font-bold">Pay Salary: {selectedStaffForAction.name}</h3>
              </div>
              <button onClick={() => setIsPayoutModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayout} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-2 text-xs border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Salary:</span>
                  <span className="font-bold">{storeProfile.currency} {selectedStaffForAction.baseSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Advances Already Given:</span>
                  <span className="font-bold text-amber-600">-{storeProfile.currency} {selectedStaffForAction.monthlyAdvances.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono-numbers font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {storeProfile.currency}{' '}
                    {Math.max(
                      0,
                      selectedStaffForAction.baseSalary - selectedStaffForAction.monthlyAdvances - payoutDeduction + payoutBonus
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Salary Month/Period</label>
                <input
                  type="text"
                  required
                  value={payoutMonthYear ?? ''}
                  onChange={(e) => setPayoutMonthYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bonus / Extra (Rs.)</label>
                  <input
                    type="number"
                    value={payoutBonus || ''}
                    onChange={(e) => setPayoutBonus(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-emerald-600 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Leave Fines (Rs.)</label>
                  <input
                    type="number"
                    value={payoutDeduction || ''}
                    onChange={(e) => setPayoutDeduction(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-rose-600 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Disbursement Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                >
                  <option value="bank_transfer">Bank Transfer (Meezan / HBL / UBL)</option>
                  <option value="cash">Cash In Hand</option>
                  <option value="jazzcash">JazzCash Mobile Wallet</option>
                  <option value="easypaisa">EasyPaisa Mobile Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={payoutNotes ?? ''}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Cleared via online banking transfer"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Confirm Payout & Issue Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal (with right-side scrollbar) */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Team Roster</span>
                <h3 className="text-base font-bold">Add New Staff Member</h3>
              </div>
              <button onClick={() => setIsAddStaffOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newStaffName ?? ''}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Muhammad Kashif"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-bold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number (WhatsApp) *</label>
                <input
                  type="text"
                  required
                  value={newStaffPhone ?? ''}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-mono focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Staff Role</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Store Manager</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Base Salary ({storeProfile.currency}) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={newStaffBaseSalary || ''}
                    onChange={(e) => setNewStaffBaseSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Employee as Left / Resigned Modal */}
      {isLeftModalOpen && staffToMarkLeft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900/50 overflow-hidden my-6">
            <div className="bg-gradient-to-r from-rose-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-rose-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    Staff Departure & Exit
                  </span>
                  <h3 className="text-base font-bold">Mark Employee as Left</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLeftModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMarkLeft} className="p-5 space-y-4">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {staffToMarkLeft.name}
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-0.5">
                  Role: <span className="uppercase font-bold text-indigo-500">{staffToMarkLeft.role}</span> •
                  Base: {storeProfile.currency} {staffToMarkLeft.baseSalary.toLocaleString()}
                </div>
                {staffToMarkLeft.monthlyAdvances > 0 && (
                  <div className="mt-1.5 p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-between">
                    <span>Outstanding Advance:</span>
                    <span className="font-mono">
                      {storeProfile.currency} {staffToMarkLeft.monthlyAdvances.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Effective Date Left *
                </label>
                <input
                  type="date"
                  required
                  value={leftDate}
                  onChange={(e) => setLeftDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-bold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Leaving *
                </label>
                <select
                  value={leftReason}
                  onChange={(e) => setLeftReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                >
                  <option value="Resigned / Better Opportunity">Resigned / Better Opportunity</option>
                  <option value="Relocated / Shifted City">Relocated / Shifted City</option>
                  <option value="Contract / Seasonal Duration Ended">Contract / Seasonal Duration Ended</option>
                  <option value="Personal / Family Emergency">Personal / Family Emergency</option>
                  <option value="Dismissed / Terminated">Dismissed / Terminated</option>
                  <option value="Other / Custom Reason">Other / Custom Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Settlement & Exit Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={leftCustomNote}
                  onChange={(e) => setLeftCustomNote(e.target.value)}
                  placeholder="e.g. Cleared counter keys, handed over cash register balance, settled final wage."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsLeftModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Confirm Mark as Left</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
