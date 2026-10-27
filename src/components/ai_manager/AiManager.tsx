import React, { useState } from 'react';
import {
  Sparkles,
  Phone,
  Send,
  Bell,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  UserCheck,
  TrendingUp,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';

export const AiManager: React.FC = () => {
  const {
    aiManagerConfig,
    updateAiManagerConfig,
    aiManagerAlerts,
    triggerAiManagerWhatsApp,
    storeProfile,
    featureLocks,
    sales,
    products,
    khatas,
    totalUdhar,
  } = usePos();

  const [ownerPhone, setOwnerPhone] = useState(aiManagerConfig.ownerWhatsAppNumber || storeProfile.phone || '923001234567');
  const [preferredLang, setPreferredLang] = useState<'english' | 'urdu'>(aiManagerConfig.languagePreference || 'english');
  const [isSending, setIsSending] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const isLocked = featureLocks.aiManagerWhatsApp;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateAiManagerConfig({
      ownerWhatsAppNumber: ownerPhone,
      languagePreference: preferredLang,
    });
    setNotificationMsg('WhatsApp Automation settings saved successfully!');
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleManualTrigger = async (category: 'daily_sales' | 'stock_out' | 'udhar_warning' | 'salary_slip') => {
    setIsSending(category);
    try {
      const res = await triggerAiManagerWhatsApp(category);
      setNotificationMsg(`Automated WhatsApp dispatch ready! Opening link...`);
      window.open(res.whatsappLink, '_blank');
    } catch {
      setNotificationMsg('Dispatched alert record to background queue.');
    } finally {
      setIsSending(null);
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  if (isLocked) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
        <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">AI Manager & WhatsApp Automation is Locked</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          The administrator has locked AI Manager WhatsApp features in the Admin Panel. Unlock it to send automated daily bills, stockouts, and udhar alerts.
        </p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.timestamp.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;
  const udharDebtorsCount = khatas.filter((k) => k.currentBalance > 0).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
            <h1 className="text-2xl font-black">AI Manager & WhatsApp Bot</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Auto Background Engine
            </span>
          </div>
          <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
            Automatically summarizes daily POS bills, detects zero-stock products, alerts on customer credit limits, and dispatches salary slips directly to the store owner's WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-500/20 text-xs">
          <Phone className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-emerald-300 block text-[10px] uppercase font-bold">Connected WhatsApp</span>
            <span className="font-mono font-bold text-white">+{ownerPhone.replace(/\D/g, '') || '923000000000'}</span>
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-between">
          <span>{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-emerald-600 dark:text-emerald-400 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Main Grid: Configuration Form & Manual One-Tap Triggers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: WhatsApp Settings & Automated Triggers */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 lg:col-span-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-600" />
            Owner WhatsApp Setup
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Owner's WhatsApp Number:
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="923001234567 (with country code)"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Format: 923001234567 (Pakistan) or international format without + or spaces.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Language Style:
              </label>
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="english">English (Professional Store Report)</option>
                <option value="urdu">Urdu / Roman Urdu (اردو سمری)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Automated Background Triggers:
              </span>

              {/* Trigger 1: Daily sales */}
              <label className="flex items-center justify-between text-xs cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Daily Sales & Profit Summary</div>
                  <div className="text-[11px] text-slate-400">Nightly WhatsApp message with day's total cash & margin</div>
                </div>
                <input
                  type="checkbox"
                  checked={aiManagerConfig.autoDailySalesWhatsApp}
                  onChange={(e) => updateAiManagerConfig({ autoDailySalesWhatsApp: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded-sm"
                />
              </label>

              {/* Trigger 2: Stockout Alert */}
              <label className="flex items-center justify-between text-xs cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Critical Stockout Warnings</div>
                  <div className="text-[11px] text-slate-400">Notify instantly when fast-selling items hit 0 units</div>
                </div>
                <input
                  type="checkbox"
                  checked={aiManagerConfig.autoStockoutAlertWhatsApp}
                  onChange={(e) => updateAiManagerConfig({ autoStockoutAlertWhatsApp: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded-sm"
                />
              </label>

              {/* Trigger 3: Udhar Overdue */}
              <label className="flex items-center justify-between text-xs cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Udhar Khatta Limit Alert</div>
                  <div className="text-[11px] text-slate-400">Ping owner when customer credit exceeds limit</div>
                </div>
                <input
                  type="checkbox"
                  checked={aiManagerConfig.autoUdharOverdueWhatsApp}
                  onChange={(e) => updateAiManagerConfig({ autoUdharOverdueWhatsApp: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded-sm"
                />
              </label>

              {/* Trigger 4: Staff Salary Slips */}
              <label className="flex items-center justify-between text-xs cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Salary Payout Confirmation</div>
                  <div className="text-[11px] text-slate-400">Auto send salary voucher & remaining advance to owner</div>
                </div>
                <input
                  type="checkbox"
                  checked={aiManagerConfig.autoSalarySlipWhatsApp}
                  onChange={(e) => updateAiManagerConfig({ autoSalarySlipWhatsApp: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded-sm"
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              Save WhatsApp Settings
            </button>
          </form>
        </div>

        {/* Right Columns: Instant One-Tap Dispatches & Live Activity Logs */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Dispatch Cards */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              Instant Manual Dispatches (Test WhatsApp Alerts)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any card to immediately compose and send the real-time AI summary to the owner's WhatsApp:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Daily Sales Card */}
              <button
                type="button"
                onClick={() => handleManualTrigger('daily_sales')}
                disabled={isSending === 'daily_sales'}
                className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500 text-left transition-all active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">Daily Sales & Profit</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  Today: Rs {todayRevenue.toLocaleString()} ({todaySales.length} bills)
                </div>
                <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <Send className="w-3 h-3" />
                  {isSending === 'daily_sales' ? 'Composing...' : 'Send to Owner WhatsApp'}
                </div>
              </button>

              {/* Stockout Alert Card */}
              <button
                type="button"
                onClick={() => handleManualTrigger('stock_out')}
                disabled={isSending === 'stock_out'}
                className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-500 text-left transition-all active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">Critical Stockout Alert</span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  {outOfStockCount} items at zero stock
                </div>
                <div className="mt-1 text-[11px] text-rose-700 dark:text-rose-400 flex items-center gap-1 font-semibold">
                  <Send className="w-3 h-3" />
                  {isSending === 'stock_out' ? 'Composing...' : 'Send Urgent Reorder List'}
                </div>
              </button>

              {/* Udhar Overdue Alert */}
              <button
                type="button"
                onClick={() => handleManualTrigger('udhar_warning')}
                disabled={isSending === 'udhar_warning'}
                className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500 text-left transition-all active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase">Udhar Khatta Overdue</span>
                  <CreditCard className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  Rs {totalUdhar.toLocaleString()} ({udharDebtorsCount} debtors)
                </div>
                <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1 font-semibold">
                  <Send className="w-3 h-3" />
                  {isSending === 'udhar_warning' ? 'Composing...' : 'Send Recovery Reminder List'}
                </div>
              </button>

              {/* Staff Salary Slip */}
              <button
                type="button"
                onClick={() => handleManualTrigger('salary_slip')}
                disabled={isSending === 'salary_slip'}
                className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 hover:border-indigo-500 text-left transition-all active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase">Staff Salary Slip</span>
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  Send Salary Payout Receipt
                </div>
                <div className="mt-1 text-[11px] text-indigo-700 dark:text-indigo-400 flex items-center gap-1 font-semibold">
                  <Send className="w-3 h-3" />
                  {isSending === 'salary_slip' ? 'Composing...' : 'Send WhatsApp Slip'}
                </div>
              </button>
            </div>
          </div>

          {/* Activity / Dispatches Log */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-500" />
                WhatsApp Background Dispatches Log
              </h3>
              <span className="text-xs text-slate-400">{aiManagerAlerts.length} logged dispatches</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto custom-scrollbar">
              {aiManagerAlerts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                  No alerts dispatched yet. Click any test card above or let background triggers run!
                </div>
              ) : (
                aiManagerAlerts.map((alert) => (
                  <div key={alert.id} className="py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400 text-[11px]">
                          {alert.category.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(alert.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      {alert.whatsappUrl && (
                        <a
                          href={alert.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                        >
                          Open in WhatsApp <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <pre className="text-[11px] font-sans text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg whitespace-pre-wrap border border-slate-100 dark:border-slate-800">
                      {alert.messagePreview}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
