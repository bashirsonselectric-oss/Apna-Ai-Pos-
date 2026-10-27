import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { BillTemplate, BillTemplateType } from '../../types';
import {
  Receipt,
  Printer,
  Check,
  CheckCircle2,
  Copy,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  QrCode,
  Barcode,
  Share2,
  Download,
  Settings,
  Eye,
  Store,
  Layers,
  FileText,
  Sliders,
  CheckSquare,
} from 'lucide-react';

export const BillTemplateLibrary: React.FC = () => {
  const {
    billTemplates,
    activeBillTemplateId,
    setActiveBillTemplateId,
    activeBillTemplate,
    addBillTemplate,
    updateBillTemplate,
    deleteBillTemplate,
    storeProfile,
  } = usePos();

  const [previewTemplateId, setPreviewTemplateId] = useState<string>(activeBillTemplateId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BillTemplate | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const previewTemplate =
    billTemplates.find((t) => t.id === previewTemplateId) || activeBillTemplate;

  // Sample items for live preview demonstrating the cable format
  const sampleItems = [
    {
      name: 'Gm Cable 3/29',
      urdu: 'جی ایم کیبل 3/29 ریڈ',
      gauge: '3/29 (1.5mm²)',
      color: 'Red',
      coils: '18 coil',
      coilPrice: 6300,
      loose: '305 meter',
      loosePrice: 70,
      qty: '1 Coil + 15m',
      subtotal: 7350,
    },
    {
      name: 'Schneider 32A DP Breaker',
      urdu: 'شنائیڈر 32 ایمپئر ڈی پی بریکر',
      gauge: '32A 240V',
      color: 'White',
      coils: '-',
      coilPrice: 0,
      loose: '-',
      loosePrice: 0,
      qty: '2 pcs',
      subtotal: 3700,
    },
    {
      name: 'Pakistan Cables 7/0.029 Black',
      urdu: 'پاکستان کیبلز 7/29 بلیک',
      gauge: '7/29 (2.5mm²)',
      color: 'Black',
      coils: '12 coil',
      coilPrice: 11400,
      loose: '140 meter',
      loosePrice: 127,
      qty: '1 Coil',
      subtotal: 11400,
    },
  ];

  const sampleSubtotal = 22450;
  const sampleDiscount = 450;
  const sampleGrandTotal = 22000;
  const samplePreviousBalance = 15500;
  const sampleTotalDue = 37500;

  const handleSetActive = (tmplId: string) => {
    setActiveBillTemplateId(tmplId);
    setPreviewTemplateId(tmplId);
    showToast(`"${billTemplates.find((t) => t.id === tmplId)?.name}" is now the active POS bill template!`);
  };

  const handlePrintSample = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-500/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Bill & Receipt Template Library
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-urdu mt-0.5">
                مختلف ڈیزائنز: 80 ملی میٹر تھرمل، کیبل و کوائل کٹنگ انوائس، A4 کمرشل اور اردو رسید
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrintSample}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center space-x-1.5 shadow-xs hover:bg-slate-50 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Test Print Preview</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Template Selection Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>Available POS & Invoice Templates</span>
              <span className="text-xs font-normal text-slate-500">({billTemplates.length} Ready)</span>
            </h3>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active: {activeBillTemplate.name}
            </span>
          </div>

          <div className="space-y-3">
            {billTemplates.map((tmpl) => {
              const isCurrentActive = tmpl.id === activeBillTemplateId;
              const isPreviewing = tmpl.id === previewTemplateId;

              return (
                <div
                  key={tmpl.id}
                  onClick={() => setPreviewTemplateId(tmpl.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isPreviewing
                      ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {tmpl.name}
                        </span>
                        {isCurrentActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                            Default Active
                          </span>
                        )}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {tmpl.paperWidth}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-urdu mt-0.5">
                        {tmpl.urduName}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                        {tmpl.description}
                      </p>

                      {/* Feature Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {tmpl.showDualPacking && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            ⚡ Coils + Loose Meters
                          </span>
                        )}
                        {tmpl.showQrCode && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                            QR Payment
                          </span>
                        )}
                        {tmpl.showBarcode && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            Barcode
                          </span>
                        )}
                        {tmpl.showUrdu && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            Bilingual Urdu
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {!isCurrentActive ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetActive(tmpl.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Set as Active
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-4 h-4" /> Selected
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTemplate(tmpl);
                          setIsEditModalOpen(true);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                      >
                        Customize Layout
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Bill Preview Sheet (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Live Bill Preview: {previewTemplate.name}
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono text-slate-400">
                {previewTemplate.paperWidth}
              </span>
            </div>

            {/* Simulated Thermal / Invoice Paper Sheet */}
            <div
              className={`bg-white text-slate-900 p-5 rounded-2xl shadow-inner border border-slate-200 mx-auto transition-all ${
                previewTemplate.category === 'thermal_58mm'
                  ? 'max-w-[280px] text-[10px]'
                  : previewTemplate.category === 'a4_commercial'
                  ? 'max-w-full text-xs font-sans'
                  : 'max-w-[360px] text-[11px] font-mono'
              }`}
            >
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
                {previewTemplate.showLogo && (
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center mx-auto mb-1 shadow-xs">
                    {storeProfile.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="font-black text-sm tracking-tight">{storeProfile.name}</div>
                <div className="text-[10px] text-slate-600 font-urdu">{storeProfile.receiptHeader || previewTemplate.headerTagline}</div>
                <div className="text-[10px] text-slate-500">Ph: {storeProfile.phone}</div>
                <div className="text-[9px] text-slate-400">NTN: {storeProfile.taxRegistrationNo || '1234567-8'}</div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">
                  Inv: <strong>POS-2026-0042</strong> • 25-Oct-2026 01:45 PM
                </div>
              </div>

              {/* Items Table */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
                <div className="flex justify-between font-bold border-b border-slate-200 pb-1 text-[10px]">
                  <span>Item Description</span>
                  <span className="text-right">Total</span>
                </div>

                {sampleItems.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{item.name}</span>
                      <span>Rs. {item.subtotal.toLocaleString()}</span>
                    </div>

                    {/* Dual-pack / Loose Breakdown if enabled */}
                    {previewTemplate.showDualPacking && item.coils !== '-' && (
                      <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">
                        Pack: {item.coils} @ {item.coilPrice} | Loose: {item.loose} @ {item.loosePrice}/m
                      </div>
                    )}

                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{previewTemplate.showUrdu ? item.urdu : item.gauge} ({item.qty})</span>
                      <span>Color: {item.color}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>Rs. {sampleSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bill Discount:</span>
                  <span>-Rs. {sampleDiscount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>Rs. {sampleGrandTotal.toLocaleString()}</span>
                </div>

                {/* Customer Khatta Balance if enabled */}
                {previewTemplate.showCustomerKhataBalance && (
                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-700 font-mono space-y-0.5">
                    <div className="flex justify-between">
                      <span>Previous Udhar (سابقہ بقایا):</span>
                      <span>Rs. {samplePreviousBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-700">
                      <span>Net Balance Due (کل بقایا):</span>
                      <span>Rs. {sampleTotalDue.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code and Barcode */}
              <div className="pt-3 text-center space-y-2">
                {previewTemplate.showQrCode && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-lg p-1 flex items-center justify-center shadow-xs">
                      <QrCode className="w-12 h-12 text-slate-800" />
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1">Scan to Pay via JazzCash / EasyPaisa</span>
                  </div>
                )}

                {previewTemplate.showBarcode && (
                  <div className="flex flex-col items-center pt-1">
                    <div className="font-mono text-[10px] tracking-widest font-bold">||||| | |||| ||| |||||||</div>
                    <span className="text-[9px] text-slate-400 font-mono">896400100991</span>
                  </div>
                )}

                <div className="text-[9px] text-slate-500 pt-1 leading-tight font-urdu">
                  {storeProfile.receiptFooter || previewTemplate.footerNotes}
                </div>
              </div>
            </div>

            {/* Set active quick button */}
            {previewTemplate.id !== activeBillTemplateId && (
              <button
                type="button"
                onClick={() => handleSetActive(previewTemplate.id)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Apply "{previewTemplate.name}" as Default POS Template
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customize Template Modal */}
      {isEditModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Customize Template: {editingTemplate.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Header Tagline / Notice
                </label>
                <input
                  type="text"
                  value={editingTemplate.headerTagline}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, headerTagline: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Footer Return Policy Note
                </label>
                <input
                  type="text"
                  value={editingTemplate.footerNotes}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, footerNotes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { key: 'showDualPacking' as const, label: 'Coil + Loose Meter Columns' },
                  { key: 'showQrCode' as const, label: 'Show QR Payment Code' },
                  { key: 'showBarcode' as const, label: 'Show POS Barcode' },
                  { key: 'showUrdu' as const, label: 'Bilingual Urdu Text' },
                  { key: 'showCustomerKhataBalance' as const, label: 'Customer Udhar Ledger Balance' },
                  { key: 'showLogo' as const, label: 'Show Store Logo' },
                ].map((toggle) => (
                  <label key={toggle.key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTemplate[toggle.key]}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, [toggle.key]: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{toggle.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateBillTemplate(editingTemplate.id, editingTemplate);
                  setIsEditModalOpen(false);
                  showToast('Template customizations saved!');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Save Customizations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
