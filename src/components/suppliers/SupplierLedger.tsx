import React, { useState, useRef } from 'react';
import { usePos } from '../../context/PosContext';
import { Supplier, SupplierInvoice, SupplierBackupRecord } from '../../types';
import {
  Truck,
  Plus,
  Search,
  DollarSign,
  FileText,
  Sparkles,
  Phone,
  MapPin,
  Check,
  X,
  CreditCard,
  Building,
  Download,
  Upload,
  Database,
  History,
  FileDown,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  Share2,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react';

export const SupplierLedger: React.FC<{ onOpenAiScanner: () => void }> = ({ onOpenAiScanner }) => {
  const {
    suppliers,
    supplierInvoices,
    storeProfile,
    supplierBackups,
    createManualSupplierBackup,
    runAiDailySupplierBackup,
    restoreSupplierBackup,
  } = usePos();
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [payModalSupplier, setPayModalSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'cash' | 'jazzcash'>('bank');

  // Supplier Backup Vault & AI state
  const [showBackupVault, setShowBackupVault] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [selectedBackupForAudit, setSelectedBackupForAudit] = useState<SupplierBackupRecord | null>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = suppliers.reduce((sum, s) => sum + s.balanceDue, 0);
  const totalPurchases = suppliers.reduce((sum, s) => sum + s.totalPurchased, 0);

  // Manual Backup Handler (Export JSON snapshot)
  const handleManualBackup = () => {
    const backup = createManualSupplierBackup('Manual supplier payables snapshot');
    downloadBackupJson(backup);
  };

  // AI Daily Backup Handler (Deep Gemini Payables & Cashflow Audit)
  const handleAiDailyBackup = async () => {
    setIsBackingUp(true);
    try {
      const backup = await runAiDailySupplierBackup();
      setSelectedBackupForAudit(backup);
      setShowBackupVault(true);
    } catch (err: any) {
      alert(`AI Daily Supplier Backup failed: ${err.message || 'Check connection'}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Download Backup JSON
  const downloadBackupJson = (b: SupplierBackupRecord) => {
    const jsonStr = b.rawSnapshotJson || JSON.stringify(b, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apna-pos-suppliers-${b.date}-${b.type}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download CSV Export of Supplier Payables
  const downloadPayablesCsv = () => {
    const headers = ['Supplier ID', 'Supplier Name', 'Contact Person', 'Phone', 'City', 'Total Purchased', 'Total Paid', 'Balance Due'];
    const rows = suppliers.map((s) => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.contactPerson.replace(/"/g, '""')}"`,
      s.phone,
      s.city,
      s.totalPurchased,
      s.totalPaid,
      s.balanceDue,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apna-pos-suppliers-payables-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // File Upload Restore
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = restoreSupplierBackup(content);
      if (success) {
        alert('Supplier payables backup successfully restored from file!');
      } else {
        alert('Failed to restore supplier backup. Invalid format.');
      }
    };
    reader.readAsText(file);
  };

  // Share Vendor Payables Daily Audit on WhatsApp
  const sharePayablesOnWhatsApp = (b: SupplierBackupRecord) => {
    const lines = [
      `📊 *${storeProfile.name} - Vendor Payables Audit Snapshot*`,
      `📅 Date: ${b.date}`,
      `🏢 Active Vendors: ${b.totalSuppliers}`,
      `💰 Total Outstanding Payable: ${storeProfile.currency} ${b.totalOutstandingPayable.toLocaleString()}`,
      `🧾 Logged Invoices: ${b.invoicesCount}`,
      b.aiAuditSummary ? `⚠️ Risk Level: ${b.aiAuditSummary.riskLevel.toUpperCase()}` : '',
      b.aiAuditSummary?.cashFlowRecommendation ? `💡 Cashflow Advice: ${b.aiAuditSummary.cashFlowRecommendation}` : '',
      b.aiAuditSummary?.priorityVendorsDue?.length ? `🚨 Priority Dues: ${b.aiAuditSummary.priorityVendorsDue.join(', ')}` : '',
      `🔒 Verified Checksum: ${b.checksum}`,
    ].filter(Boolean);
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalSupplier || paymentAmount <= 0) return;

    // In a live app, update state
    alert(
      `Recorded payment of ${storeProfile.currency} ${paymentAmount.toLocaleString()} to ${payModalSupplier.name} via ${paymentMethod.toUpperCase()}`
    );
    payModalSupplier.balanceDue = Math.max(0, payModalSupplier.balanceDue - paymentAmount);
    payModalSupplier.totalPaid += paymentAmount;
    setPayModalSupplier(null);
    setPaymentAmount(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Summary Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Supplier Ledger & Wholesale Purchases
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Supplier balances and purchase slips with automated AI daily backups and cryptographic verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Daily Backup Button */}
          <button
            onClick={handleAiDailyBackup}
            disabled={isBackingUp}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            title="Run Gemini 3.8 Flash automated accounts payable and cashflow audit"
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing Dues...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Daily Backup</span>
              </>
            )}
          </button>

          {/* Manual Backup Button */}
          <button
            onClick={handleManualBackup}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
            title="Download JSON snapshot of suppliers and invoices"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Manual Backup</span>
          </button>

          {/* CSV Export */}
          <button
            onClick={downloadPayablesCsv}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
            title="Download CSV spreadsheet of vendor payables"
          >
            <FileDown className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Backup Vault & History */}
          <button
            onClick={() => setShowBackupVault(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
            title="View archived supplier backups, verify hashes, and restore"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Vault ({supplierBackups.length})</span>
          </button>

          <button
            onClick={onOpenAiScanner}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 text-emerald-200" />
            <span>AI Bill Ingest</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Supplier Purchases</div>
          <div className="text-2xl font-black text-slate-900 font-mono-numbers mt-1">
            {storeProfile.currency} {totalPurchases.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across {suppliers.length} vendors</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-rose-600">Total Outstanding Payable Balance</div>
          <div className="text-2xl font-black text-rose-600 font-mono-numbers mt-1">
            {storeProfile.currency} {totalOutstanding.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Vendor credit terms</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600">AI Extracted Bills Logged</div>
          <div className="text-2xl font-black text-emerald-700 font-mono-numbers mt-1">
            {supplierInvoices.filter((i) => i.aiExtracted).length} Invoices
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Automated by Omni-Input</div>
        </div>
      </div>

      {/* Main Grid: Suppliers & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Suppliers List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              Vendor Accounts Directory
            </h3>
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors rounded-xl px-2"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">{supplier.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Contact: {supplier.contactPerson}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" /> {supplier.phone}
                    </span>
                    <span>•</span>
                    <span>{supplier.city}</span>
                  </div>
                </div>

                <div className="text-right flex items-center space-x-3 shrink-0">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Balance Due</div>
                    <div
                      className={`font-black text-xs font-mono-numbers ${
                        supplier.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {storeProfile.currency} {supplier.balanceDue.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPayModalSupplier(supplier);
                      setPaymentAmount(supplier.balanceDue);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                  >
                    Pay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices Ledger (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Supplier Purchase Invoices
          </h3>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
            {supplierInvoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No invoices recorded yet. Use AI Bill Scanner to import invoices.
              </div>
            ) : (
              supplierInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{inv.invoiceNumber}</span>
                      {inv.aiExtracted && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold inline-flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> AI Parsed
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[11px] font-mono">{inv.date}</span>
                  </div>

                  <div className="text-[11px] text-slate-600">
                    Vendor: <strong className="text-slate-800">{inv.supplierName}</strong>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[11px]">
                    <span className="text-slate-500">{inv.itemsCount} line items</span>
                    <span className="font-bold text-slate-900 font-mono-numbers">
                      {storeProfile.currency} {inv.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {payModalSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase">
                  Settle Vendor Balance
                </span>
                <h3 className="text-base font-bold">{payModalSupplier.name}</h3>
              </div>
              <button
                onClick={() => setPayModalSupplier(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount ({storeProfile.currency})
                </label>
                <input
                  type="number"
                  required
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full text-lg font-bold font-mono-numbers px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  Outstanding Due: {storeProfile.currency} {payModalSupplier.balanceDue.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bank', 'cash', 'jazzcash'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                        paymentMethod === m
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {m === 'bank' ? 'Bank Transfer' : m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPayModalSupplier(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden File Input for Restoring External JSON Backup */}
      <input
        ref={fileUploadRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleRestoreFile}
      />

      {/* SUPPLIER BACKUP VAULT & AI CASHFLOW AUDIT MODAL */}
      {showBackupVault && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span>Vendor Payables Vault & AI Daily Audit</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      SHA-256 Ledger
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Accounts payable snapshots, priority vendor dues, and WhatsApp cashflow summaries.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fileUploadRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  title="Upload JSON backup file to restore"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Import JSON</span>
                </button>
                <button
                  onClick={() => setShowBackupVault(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Detailed AI Audit Summary (if selected) */}
              {selectedBackupForAudit && selectedBackupForAudit.aiAuditSummary && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-emerald-50/50 border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                        Gemini 3.8 Flash Accounts Payable Audit ({selectedBackupForAudit.date})
                      </h4>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-slate-500">Risk Assessment:</span>
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded-lg border uppercase font-mono ${
                          selectedBackupForAudit.aiAuditSummary.riskLevel === 'low'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : selectedBackupForAudit.aiAuditSummary.riskLevel === 'moderate'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {selectedBackupForAudit.aiAuditSummary.riskLevel}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">
                    {selectedBackupForAudit.aiAuditSummary.payablesStatus}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-xl bg-white border border-rose-200">
                      <div className="font-bold text-[11px] text-rose-700 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Priority Bills Due This Week:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                        {selectedBackupForAudit.aiAuditSummary.priorityVendorsDue.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-emerald-200">
                      <div className="font-bold text-[11px] text-emerald-700 mb-1 flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5" /> Early Payment Discount Opportunities:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                        {selectedBackupForAudit.aiAuditSummary.discountOpportunities.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                    <strong>💡 AI Cashflow Recommendation:</strong> {selectedBackupForAudit.aiAuditSummary.cashFlowRecommendation}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-indigo-100">
                    <button
                      onClick={() => sharePayablesOnWhatsApp(selectedBackupForAudit)}
                      className="inline-flex items-center gap-1.5 text-emerald-700 font-bold hover:underline"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Full Audit on WhatsApp</span>
                    </button>
                    <span className="font-mono text-[10px]">SHA-256: {selectedBackupForAudit.checksum}</span>
                  </div>
                </div>
              )}

              {/* Backups List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Archived Supplier Snapshots ({supplierBackups.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">Stored in browser local vault</span>
                </div>

                {supplierBackups.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 rounded-2xl border border-dashed border-slate-300">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">No supplier backups generated yet</p>
                    <p className="text-[11px] mt-0.5">Click "AI Daily Backup" or "Manual Backup" to archive vendor payables.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {supplierBackups.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors bg-white"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                b.type === 'ai_daily'
                                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300'
                              }`}
                            >
                              {b.type === 'ai_daily' ? '✨ AI Daily Snapshot' : '📦 Manual Snapshot'}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {b.date}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                            <span>Vendors: <strong className="text-slate-800">{b.totalSuppliers}</strong></span>
                            <span>•</span>
                            <span>Purchases: <strong className="text-slate-800">{storeProfile.currency} {b.totalPurchases.toLocaleString()}</strong></span>
                            <span>•</span>
                            <span>Payables Due: <strong className="text-rose-600">{storeProfile.currency} {b.totalOutstandingPayable.toLocaleString()}</strong></span>
                            <span>•</span>
                            <span>Invoices: <strong className="text-emerald-700">{b.invoicesCount}</strong></span>
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>SHA-256: {b.checksum}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {b.aiAuditSummary && (
                            <button
                              onClick={() => setSelectedBackupForAudit(b)}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center space-x-1 transition-colors border border-indigo-200"
                            >
                              <Sparkles className="w-3 h-3 text-indigo-600" />
                              <span>Audit</span>
                            </button>
                          )}

                          <button
                            onClick={() => sharePayablesOnWhatsApp(b)}
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors border border-emerald-200"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => downloadBackupJson(b)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Download JSON snapshot to disk"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Restore supplier ledger to snapshot from ${b.date}?`)) {
                                restoreSupplierBackup(b.id);
                                alert('Supplier ledger successfully restored!');
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1 transition-colors shadow-2xs"
                            title="Restore supplier ledger to this snapshot"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                            <span>Restore</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Total archived backups: <strong className="text-slate-800">{supplierBackups.length}</strong>
              </span>
              <button
                onClick={() => setShowBackupVault(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
