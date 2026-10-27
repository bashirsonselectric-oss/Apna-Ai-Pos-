import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { AttendanceStatus, AttendanceRecord } from '../../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  Users,
  Search,
  Filter,
  Download,
  Share2,
  Check,
  TrendingUp,
  Award,
  CalendarDays,
  FileText,
  Building,
  Sparkles,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const AttendanceTracker: React.FC = () => {
  const {
    staffMembers,
    attendanceRecords,
    markAttendance,
    updateAttendance,
    deleteAttendance,
    quickMarkAllPresent,
    storeProfile,
  } = usePos();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [activeView, setActiveView] = useState<'daily' | 'monthly_summary'>('daily');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Get attendance records for the selected date
  const recordsForDate = attendanceRecords.filter((r) => r.date === selectedDate);
  const recordMap = new Map<string, AttendanceRecord>();
  recordsForDate.forEach((r) => recordMap.set(r.staffId, r));

  // Staff members matching search
  const filteredStaff = staffMembers.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      s.phone.includes(q);

    if (!matchesSearch) return false;

    if (statusFilter !== 'all') {
      const rec = recordMap.get(s.id);
      return rec ? rec.status === statusFilter : statusFilter === 'absent';
    }
    return true;
  });

  // Today's summary stats
  const totalStaff = staffMembers.length;
  const presentCount = recordsForDate.filter((r) => r.status === 'present').length;
  const lateCount = recordsForDate.filter((r) => r.status === 'late').length;
  const halfDayCount = recordsForDate.filter((r) => r.status === 'half_day').length;
  const leaveCount = recordsForDate.filter((r) => r.status === 'leave').length;
  const absentCount = totalStaff - (presentCount + lateCount + halfDayCount + leaveCount);
  const totalOvertime = recordsForDate.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
  const attendanceRate = totalStaff > 0 ? Math.round(((presentCount + lateCount * 0.8 + halfDayCount * 0.5) / totalStaff) * 100) : 0;

  const handleStatusChange = (staffId: string, status: AttendanceStatus) => {
    const staff = staffMembers.find((s) => s.id === staffId);
    if (!staff) return;

    const existing = recordMap.get(staffId);
    let checkIn = existing?.checkInTime || (status === 'late' ? '10:15 AM' : status === 'absent' ? '' : '09:00 AM');
    let checkOut = existing?.checkOutTime || (status === 'half_day' ? '02:00 PM' : status === 'absent' ? '' : '08:00 PM');
    let hours = status === 'absent' ? 0 : status === 'half_day' ? 5 : status === 'late' ? 9.5 : 11;
    let ot = hours > 9 ? hours - 9 : 0;

    markAttendance({
      staffId: staff.id,
      staffName: staff.name,
      role: staff.role,
      date: selectedDate,
      status,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      workingHours: hours,
      overtimeHours: ot,
      notes: existing?.notes || (status === 'present' ? 'Marked present' : status === 'late' ? 'Marked late' : ''),
    });

    showToast(`Haazri updated: ${staff.name} -> ${status.toUpperCase()}`);
  };

  const handleTimeUpdate = (staffId: string, field: 'checkInTime' | 'checkOutTime' | 'notes', val: string) => {
    const existing = recordMap.get(staffId);
    const staff = staffMembers.find((s) => s.id === staffId);
    if (!staff) return;

    if (existing) {
      updateAttendance(existing.id, { [field]: val });
    } else {
      markAttendance({
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
        date: selectedDate,
        status: 'present',
        checkInTime: field === 'checkInTime' ? val : '09:00 AM',
        checkOutTime: field === 'checkOutTime' ? val : '08:00 PM',
        workingHours: 11,
        overtimeHours: 2,
        notes: field === 'notes' ? val : '',
      });
    }
  };

  // WhatsApp daily report
  const shareAttendanceOnWhatsApp = () => {
    const dateFormatted = new Date(selectedDate).toLocaleDateString('en-PK', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    let msg = `*📋 ${storeProfile.name.toUpperCase()} - DAILY STAFF ATTENDANCE REGISTER*\n`;
    msg += `📅 *Date:* ${dateFormatted}\n`;
    msg += `------------------------------------\n`;
    msg += `👥 *Total Staff:* ${totalStaff}\n`;
    msg += `✅ *Present:* ${presentCount}\n`;
    msg += `⏰ *Late:* ${lateCount}\n`;
    msg += `⏳ *Half-Day:* ${halfDayCount}\n`;
    msg += `🏖️ *Leave:* ${leaveCount}\n`;
    msg += `❌ *Absent:* ${Math.max(0, absentCount)}\n`;
    msg += `⭐ *Attendance Rate:* ${attendanceRate}%\n`;
    msg += `⏱️ *Total Overtime:* ${totalOvertime.toFixed(1)} Hours\n\n`;
    msg += `*DETAILED ROSTER:*\n`;

    staffMembers.forEach((s, idx) => {
      const rec = recordMap.get(s.id);
      const st = rec ? rec.status.toUpperCase() : 'ABSENT (NOT MARKED)';
      const times = rec?.checkInTime ? `(${rec.checkInTime} - ${rec.checkOutTime || 'On Shift'})` : '';
      msg += `${idx + 1}. *${s.name}* [${s.role}]: ${st} ${times}\n`;
    });

    msg += `\n_Generated securely by Apna AI POS Engine_`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-500/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Staff Attendance & Haazri Register
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-urdu mt-0.5">
                ملازمین کی روزانہ حاضری، چیک ان ٹائم، اوور ٹائم اور تنخواہ کٹوتی کا حساب
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Date Picker */}
          <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* Quick Mark All Present */}
          <button
            type="button"
            onClick={() => {
              quickMarkAllPresent(selectedDate);
              showToast(`All ${totalStaff} staff members marked Present for ${selectedDate}`);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Mark all staff members Present for this date"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark All Present</span>
          </button>

          {/* WhatsApp Share */}
          <button
            type="button"
            onClick={shareAttendanceOnWhatsApp}
            className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Share daily attendance register on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">WhatsApp Sheet</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Total Staff</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {totalStaff} <span className="text-xs font-normal text-slate-400">Members</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-500/30 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>Present (حاضر)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
            {presentCount} <span className="text-xs font-normal text-slate-400">Staff</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-500/30 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span>Late (دیر سے)</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {lateCount} <span className="text-xs font-normal text-slate-400">Staff</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-orange-500/30 shadow-xs">
          <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 flex items-center justify-between">
            <span>Half Day (نصف)</span>
            <CalendarDays className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1">
            {halfDayCount} <span className="text-xs font-normal text-slate-400">Staff</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-500/30 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-between">
            <span>Absent (غیر حاضر)</span>
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {Math.max(0, absentCount)} <span className="text-xs font-normal text-slate-400">Staff</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-indigo-500/30 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
            <span>Total Overtime</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-indigo-700 dark:text-indigo-400 mt-1">
            {totalOvertime.toFixed(1)} <span className="text-xs font-normal text-slate-400">Hours</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search staff by name or role..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {(['all', 'present', 'late', 'half_day', 'absent', 'leave'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {st === 'all'
                ? 'All'
                : st === 'present'
                ? 'Present'
                : st === 'late'
                ? 'Late'
                : st === 'half_day'
                ? 'Half Day'
                : st === 'leave'
                ? 'Leave'
                : 'Absent'}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Daily Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Employee / Role</th>
                <th className="p-3.5 text-center">Status (Haazri)</th>
                <th className="p-3.5">Check-In / Out</th>
                <th className="p-3.5 text-center">Working Hours</th>
                <th className="p-3.5 text-center">Overtime</th>
                <th className="p-3.5">Shift Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    No staff members match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const rec = recordMap.get(staff.id);
                  const currentStatus = rec?.status || 'absent';

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Name & Role */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{staff.name}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                              staff.role === 'cashier'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : staff.role === 'manager'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : staff.role === 'accountant'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {staff.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{staff.phone}</div>
                      </td>

                      {/* Status Badges / Buttons */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(staff.id, 'present')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                            }`}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(staff.id, 'late')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
                            }`}
                          >
                            L
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(staff.id, 'half_day')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              currentStatus === 'half_day'
                                ? 'bg-orange-500 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-orange-500'
                            }`}
                          >
                            HD
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(staff.id, 'leave')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              currentStatus === 'leave'
                                ? 'bg-sky-500 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-sky-500'
                            }`}
                          >
                            LV
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(staff.id, 'absent')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                            }`}
                          >
                            A
                          </button>
                        </div>
                      </td>

                      {/* Check-In / Check-Out */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={rec?.checkInTime || ''}
                            onChange={(e) => handleTimeUpdate(staff.id, 'checkInTime', e.target.value)}
                            placeholder="In: 09:00 AM"
                            className="w-24 px-2 py-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
                          />
                          <span className="text-slate-400">-</span>
                          <input
                            type="text"
                            value={rec?.checkOutTime || ''}
                            onChange={(e) => handleTimeUpdate(staff.id, 'checkOutTime', e.target.value)}
                            placeholder="Out: 08:00 PM"
                            className="w-24 px-2 py-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
                          />
                        </div>
                      </td>

                      {/* Working Hours */}
                      <td className="p-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                        {rec?.workingHours ? `${rec.workingHours} hrs` : '-'}
                      </td>

                      {/* Overtime */}
                      <td className="p-3.5 text-center font-bold">
                        {rec?.overtimeHours && rec.overtimeHours > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full text-[10px]">
                            +{rec.overtimeHours} hrs
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">0</span>
                        )}
                      </td>

                      {/* Shift Notes */}
                      <td className="p-3.5">
                        <input
                          type="text"
                          value={rec?.notes || ''}
                          onChange={(e) => handleTimeUpdate(staff.id, 'notes', e.target.value)}
                          placeholder="e.g. Counter shift, on-time"
                          className="w-full px-2.5 py-1 text-[11px] border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary & Payroll Integration Notice */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-4 text-white border border-indigo-900 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-white">Automated Salary Payout & Deductions Sync</div>
            <div className="text-[11px] text-slate-300">
              Absences, half-days, and logged overtime automatically sync with Staff Payroll in the Salary tab.
            </div>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          Month: {new Date(selectedDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
};
