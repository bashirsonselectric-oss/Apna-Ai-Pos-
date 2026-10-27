import React, { useState, useRef } from 'react';
import { usePos } from '../../context/PosContext';
import {
  FileText,
  Camera,
  Upload,
  Sparkles,
  Check,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Plus,
  Trash2,
  Calendar,
  Eye,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  parseBillWithAI,
  recognizeShelfWithAI,
  parseRateListWithAI,
  getDemandForecastWithAI,
  BillParseResult,
  ShelfRecognizeResult,
  RateListParseResult,
  ForecastInsightsResult,
} from '../../services/geminiService';
import { DEMO_PRESET_BILLS, DEMO_MESSY_RATE_LIST, VERTICALS_CONFIG } from '../../data/defaultData';
import { sounds } from '../../services/soundService';

type AiHubTab = 'bill_scanner' | 'shelf_vision' | 'csv_parser' | 'bi_forecast';

export const OmniInputHub: React.FC = () => {
  const {
    activeVertical,
    commitScannedBill,
    batchImportProducts,
    addRateList,
    rateLists,
    deleteRateList,
    updateCatalogPricesFromRateList,
    products,
    sales,
    storeProfile,
  } = usePos();

  const [activeTab, setActiveTab] = useState<AiHubTab>('bill_scanner');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab 1: Bill Scanner State
  const [billImageBase64, setBillImageBase64] = useState<string | null>(null);
  const [billRawText, setBillRawText] = useState('');
  const [extractedBill, setExtractedBill] = useState<BillParseResult | null>(null);
  const [selectedDemoBill, setSelectedDemoBill] = useState('');

  // Tab 2: Shelf Vision State
  const [shelfImageBase64, setShelfImageBase64] = useState<string | null>(null);
  const [shelfResult, setShelfResult] = useState<ShelfRecognizeResult | null>(null);

  // Tab 3: CSV & Messy Rate List State
  const [csvContent, setCsvContent] = useState(DEMO_MESSY_RATE_LIST);
  const [rateListImageBase64, setRateListImageBase64] = useState<string | null>(null);
  const [autoExpireDays, setAutoExpireDays] = useState<number>(14);
  const [rateListResult, setRateListResult] = useState<RateListParseResult | null>(null);

  // Tab 4: BI Forecast State
  const [forecastResult, setForecastResult] = useState<ForecastInsightsResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const shelfFileInputRef = useRef<HTMLInputElement>(null);
  const rateListFileInputRef = useRef<HTMLInputElement>(null);

  // File to base64 helper
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'bill' | 'shelf' | 'ratelist'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === 'ratelist' && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
      const textReader = new FileReader();
      textReader.onload = () => {
        setCsvContent(textReader.result as string);
        setRateListImageBase64(null);
      };
      textReader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (target === 'bill') {
        setBillImageBase64(result);
        setBillRawText('');
      } else if (target === 'shelf') {
        setShelfImageBase64(result);
      } else if (target === 'ratelist') {
        setRateListImageBase64(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Run Bill Parsing
  const handleScanBill = async () => {
    if (!billImageBase64 && !billRawText.trim()) {
      setErrorMsg('Please select a preset demo bill, paste text, or upload a photo.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const data = await parseBillWithAI({
        imageBase64: billImageBase64 || undefined,
        billText: billRawText.trim() || undefined,
        businessVertical: VERTICALS_CONFIG[activeVertical].name,
      });
      setExtractedBill(data);
      sounds.playCheckoutChime();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse invoice with Gemini.');
    } finally {
      setLoading(false);
    }
  };

  // Commit Bill to Catalog & Ledger
  const handleCommitBill = async () => {
    if (!extractedBill) return;
    try {
      await commitScannedBill(extractedBill);
      setSuccessMsg(
        `Successfully imported ${extractedBill.items.length} items to inventory and updated ledger for ${extractedBill.supplierName}!`
      );
      setExtractedBill(null);
      setBillImageBase64(null);
      setBillRawText('');
      sounds.playCheckoutChime();
    } catch (e: any) {
      setErrorMsg('Error committing bill to database: ' + e.message);
    }
  };

  // Run Shelf Recognition
  const handleScanShelf = async () => {
    if (!shelfImageBase64) {
      setErrorMsg('Please upload a photo of a shelf, rack, or catalog.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await recognizeShelfWithAI({
        imageBase64: shelfImageBase64,
        businessVertical: VERTICALS_CONFIG[activeVertical].name,
      });
      setShelfResult(data);
      sounds.playCheckoutChime();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to analyze shelf image with Gemini.');
    } finally {
      setLoading(false);
    }
  };

  // Import shelf items
  const handleCommitShelfItems = () => {
    if (!shelfResult) return;
    const count = batchImportProducts(
      shelfResult.detectedItems.map((item) => ({
        name: item.name,
        category: item.category || 'Shelf Stock',
        vertical: activeVertical,
        costPrice: item.suggestedCostPrice,
        retailPrice: item.suggestedRetailPrice,
        stockQuantity: item.estimatedCount || 5,
        minStockAlert: 2,
        unit: item.unit || 'pcs',
        barcode: item.generatedBarcode,
        verticalAttributes: item.verticalAttributes,
      }))
    );
    setSuccessMsg(`Successfully imported ${count} shelf items into ${VERTICALS_CONFIG[activeVertical].name}!`);
    setShelfResult(null);
    setShelfImageBase64(null);
  };

  // Run CSV / Rate List Parser
  const handleParseRateList = async () => {
    if (!csvContent.trim() && !rateListImageBase64) {
      setErrorMsg('Please paste rate list text, upload a CSV/text file, or upload a photo of the rate list sheet.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const data = await parseRateListWithAI({
        rawContent: csvContent.trim() || undefined,
        imageBase64: rateListImageBase64 || undefined,
        businessVertical: VERTICALS_CONFIG[activeVertical].name,
        autoExpireDays: autoExpireDays > 0 ? autoExpireDays : undefined,
      });
      setRateListResult(data);
      sounds.playCheckoutChime();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse rate list with AI.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Update Rates in Catalog from Rate List
  const handleUpdateRatesFromList = (listId: string) => {
    setErrorMsg(null);
    const res = updateCatalogPricesFromRateList(listId);
    setSuccessMsg(res.message);
    sounds.playCheckoutChime();
  };

  // Delete Recent Rate List
  const handleDeleteRecentRateList = (listId: string, title: string) => {
    deleteRateList(listId);
    setSuccessMsg(`Successfully deleted recent rate list "${title}".`);
    sounds.playCheckoutChime();
  };

  // Save Rate List with Auto-Expiration & Live Sync
  const handleCommitRateList = () => {
    if (!rateListResult) return;

    let expiresAt: string | null = null;
    if (autoExpireDays > 0) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + autoExpireDays);
      expiresAt = expiry.toISOString();
    }

    addRateList({
      title: rateListResult.listTitle || 'Vendor Rate List',
      vendorName: rateListResult.detectedVendor || 'Vendor',
      expiresAt,
      itemCount: rateListResult.items.length,
      items: rateListResult.items.map((i) => ({
        name: i.name,
        barcode: i.barcode,
        costPrice: i.costPrice,
        retailPrice: i.retailPrice,
        unit: i.unit,
      })),
    });

    // Also sync products into catalog
    const count = batchImportProducts(
      rateListResult.items.map((i) => ({
        name: i.name,
        barcode: i.barcode,
        category: i.category,
        costPrice: i.costPrice,
        retailPrice: i.retailPrice,
        stockQuantity: i.stockQuantity || 10,
        unit: i.unit,
        verticalAttributes: i.verticalSpecs || {},
      }))
    );

    setSuccessMsg(
      `Saved rate list "${rateListResult.listTitle}" and updated ${count} products in catalog! ${autoExpireDays > 0 ? `Auto-expiration in ${autoExpireDays} days.` : 'Set as permanent rate list.'}`
    );
    setRateListResult(null);
    setRateListImageBase64(null);
  };

  // Run BI & Forecast
  const handleGenerateForecast = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await getDemandForecastWithAI({
        salesSummary: {
          totalSales: sales.length,
          recentInvoices: sales.slice(0, 10),
        },
        inventoryStats: {
          totalProducts: products.length,
          lowStockItems: products.filter((p) => p.stockQuantity <= p.minStockAlert),
        },
        businessVertical: VERTICALS_CONFIG[activeVertical].name,
        storeName: storeProfile.name,
      });
      setForecastResult(data);
      sounds.playCheckoutChime();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate forecast.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Omni Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Omni-Input AI Automation Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Zero-Manual Entry Inventory & Rate List Sync
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Eliminate tedious inventory typing. Upload supplier bills, photograph store shelves, or drop messy CSV price lists. Gemini AI extracts items, maps columns, and auto-updates stock and ledgers in seconds.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 sm:space-x-8 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            setActiveTab('bill_scanner');
            setErrorMsg(null);
          }}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'bill_scanner'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. AI Bill Scanner (بل اسکینر)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('csv_parser');
            setErrorMsg(null);
          }}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'csv_parser'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>2. AI Enhanced Rate List & Live Price Update (ریٹ لسٹ)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('shelf_vision');
            setErrorMsg(null);
          }}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'shelf_vision'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>3. AI Shelf Recognition</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('bi_forecast');
            setErrorMsg(null);
          }}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'bi_forecast'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>4. AI Demand & BI Forecast</span>
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ----------------- TAB 1: AI BILL SCANNER ----------------- */}
      {activeTab === 'bill_scanner' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  Select or Upload Supplier Bill
                </h3>

                {/* Preset Demos */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Or Test with Ready Vendor Bill Presets:
                  </label>
                  <div className="space-y-2">
                    {DEMO_PRESET_BILLS.map((demo) => (
                      <button
                        key={demo.id}
                        type="button"
                        onClick={() => {
                          setSelectedDemoBill(demo.id);
                          setBillRawText(demo.text);
                          setBillImageBase64(null);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                          selectedDemoBill === demo.id
                            ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-semibold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="font-bold">{demo.title}</div>
                        <div className="text-[11px] text-slate-500 font-normal truncate">
                          Vendor: {demo.vendor}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Real Photo / PDF */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Upload Real Invoice Photo / Scan:
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'bill')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700 block">
                      {billImageBase64 ? 'Photo Selected (Click to change)' : 'Click to Upload Invoice Image'}
                    </span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, WebP supported</span>
                  </button>
                </div>

                {/* Raw Text View / Edit */}
                {billRawText && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Raw Invoice Text Data:
                    </label>
                    <textarea
                      rows={5}
                      value={billRawText}
                      onChange={(e) => setBillRawText(e.target.value)}
                      className="w-full p-2 text-[11px] font-mono border border-slate-300 rounded-lg bg-slate-50"
                    />
                  </div>
                )}

                {/* Scan Button */}
                <button
                  type="button"
                  onClick={handleScanBill}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini AI Analyzing Invoice...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Parse Bill with Gemini AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Extracted Review Screen (7 cols) */}
            <div className="lg:col-span-7">
              {loading ? (
                <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto animate-pulse">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">
                    Extracting Items, Quantities & Rates with Gemini Vision...
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Mapping line items, computing wholesale margins, detecting batch numbers and tax exemptions.
                  </p>
                </div>
              ) : extractedBill ? (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        Review & Confirm (Confidence {extractedBill.confidenceScore || 98}%)
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900">
                        {extractedBill.supplierName || 'Unknown Vendor'}
                      </h3>
                      <div className="text-xs text-slate-500">
                        Inv #{extractedBill.invoiceNumber} • Date: {extractedBill.invoiceDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Invoice Value</div>
                      <div className="text-xl font-black text-slate-900 font-mono-numbers">
                        {storeProfile.currency} {extractedBill.totalAmount?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Items Review Table */}
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Item Name & Specs</th>
                          <th className="p-2 text-center">Qty</th>
                          <th className="p-2 text-right">Cost</th>
                          <th className="p-2 text-right">Retail</th>
                          <th className="p-2 text-center">Batch/Exp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {extractedBill.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.name ?? ''}
                                onChange={(e) => {
                                  const updated = [...extractedBill.items];
                                  updated[idx].name = e.target.value;
                                  setExtractedBill({ ...extractedBill, items: updated });
                                }}
                                className="font-semibold text-slate-900 w-full bg-transparent focus:bg-white border-b border-transparent focus:border-slate-300"
                              />
                              <div className="text-[10px] text-slate-400">
                                Unit: {item.unit} {item.notes && `• ${item.notes}`}
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                value={item.quantity ?? 1}
                                onChange={(e) => {
                                  const updated = [...extractedBill.items];
                                  updated[idx].quantity = Number(e.target.value);
                                  setExtractedBill({ ...extractedBill, items: updated });
                                }}
                                className="w-14 text-center font-bold font-mono-numbers bg-slate-100 rounded px-1 py-0.5"
                              />
                            </td>
                            <td className="p-2 text-right font-mono-numbers">
                              <input
                                type="number"
                                value={item.costPrice ?? 0}
                                onChange={(e) => {
                                  const updated = [...extractedBill.items];
                                  updated[idx].costPrice = Number(e.target.value);
                                  setExtractedBill({ ...extractedBill, items: updated });
                                }}
                                className="w-16 text-right font-mono-numbers bg-slate-100 rounded px-1 py-0.5"
                              />
                            </td>
                            <td className="p-2 text-right font-mono-numbers font-bold text-emerald-700">
                              <input
                                type="number"
                                value={item.retailPrice ?? 0}
                                onChange={(e) => {
                                  const updated = [...extractedBill.items];
                                  updated[idx].retailPrice = Number(e.target.value);
                                  setExtractedBill({ ...extractedBill, items: updated });
                                }}
                                className="w-16 text-right font-mono-numbers bg-slate-100 rounded px-1 py-0.5"
                              />
                            </td>
                            <td className="p-2 text-center text-[10px] text-slate-500">
                              {item.batchNumber ? (
                                <span className="bg-slate-100 px-1 py-0.5 rounded">
                                  {item.batchNumber} {item.expiryDate && `(${item.expiryDate})`}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {extractedBill.summaryNotes && (
                    <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-200">
                      💡 <strong>AI Summary:</strong> {extractedBill.summaryNotes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExtractedBill(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleCommitBill}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Commit to Inventory & Update Ledger</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 border border-dashed border-slate-300 text-center space-y-2">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-700">No Bill Analyzed Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Select a preset bill on the left or upload an invoice photo, then click "Parse Bill with Gemini AI".
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: AI SHELF RECOGNITION ----------------- */}
      {activeTab === 'shelf_vision' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  Photograph Shelf, Showcase or Products
                </h3>
                <p className="text-xs text-slate-500">
                  Snap a picture of your store showcase or stock shelf. Gemini AI detects items, estimates counts, assigns barcodes, and extracts attributes for {VERTICALS_CONFIG[activeVertical].name}.
                </p>

                <input
                  type="file"
                  ref={shelfFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'shelf')}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => shelfFileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-slate-700 block">
                    {shelfImageBase64 ? 'Shelf Photo Loaded (Click to change)' : 'Upload Shelf / Product Photo'}
                  </span>
                  <span className="text-[10px] text-slate-400">Works with smartphone camera snapshots</span>
                </button>

                {shelfImageBase64 && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-h-48">
                    <img src={shelfImageBase64} alt="Shelf Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleScanShelf}
                  disabled={loading || !shelfImageBase64}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Recognizing Products with AI Vision...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Detect Products & Quantities</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7">
              {shelfResult ? (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        AI Detected Items
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900">
                        {shelfResult.detectedItems.length} Products Identified on Shelf
                      </h3>
                      <div className="text-xs text-slate-500">
                        Condition: {shelfResult.shelfCondition || 'Organized Display'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCommitShelfItems}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Import All to Catalog</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto">
                    {shelfResult.detectedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-500">
                            Brand: {item.brand} • Unit: {item.unit} • Est. Count: {item.estimatedCount}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Barcode: {item.generatedBarcode}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Suggested Retail</div>
                          <div className="font-black text-emerald-700 font-mono-numbers">
                            {storeProfile.currency} {item.suggestedRetailPrice?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {shelfResult.restockAdvice && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                      <strong>Restock Advice:</strong> {shelfResult.restockAdvice}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 border border-dashed border-slate-300 text-center space-y-2">
                  <Camera className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-700">No Shelf Image Processed</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Upload an image of a retail shelf or showroom rack to auto-identify products and import them.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: AI ENHANCED RATE LIST & LIVE RATE UPDATE ----------------- */}
      {activeTab === 'csv_parser' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    AI Rate List Upload & Ingest
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                    Gemini Vision & OCR
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Upload vendor rate lists (Pakistan Cables, GM Cables, Fast Cables, etc.) via photo, printed sheet scan, CSV, or text. AI parses items, calculates margins, and updates live catalog prices in 1 click.
                </p>

                {/* Upload Rate List Image or Document */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Option A: Upload Rate List Photo or Sheet Scan:
                  </label>
                  <input
                    type="file"
                    ref={rateListFileInputRef}
                    accept="image/*,.csv,.txt"
                    onChange={(e) => handleFileChange(e, 'ratelist')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => rateListFileInputRef.current?.click()}
                    className="w-full py-5 border-2 border-dashed border-slate-300 rounded-xl text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700 block">
                      {rateListImageBase64 ? 'Rate Sheet Photo Attached (Click to change)' : 'Upload Rate List Photo / CSV / Sheet'}
                    </span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, WebP, CSV or TXT</span>
                  </button>

                  {rateListImageBase64 && (
                    <div className="mt-2 relative rounded-xl overflow-hidden border border-emerald-300 max-h-36">
                      <img src={rateListImageBase64} alt="Rate Sheet Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setRateListImageBase64(null)}
                        className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 hover:bg-black text-white text-[10px] rounded-md font-semibold"
                      >
                        Remove Photo
                      </button>
                    </div>
                  )}
                </div>

                {/* Paste Text / CSV */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Option B: Paste Rate List Text or CSV</label>
                    <button
                      type="button"
                      onClick={() => {
                        setCsvContent(DEMO_MESSY_RATE_LIST);
                        setRateListImageBase64(null);
                      }}
                      className="text-[11px] text-emerald-700 hover:underline font-semibold"
                    >
                      Load Sample Cables Rate List
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    placeholder="e.g. GM Cable 3/29 Red 18 coil 6300 per coil, Loss 305m 70/meter..."
                    className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>

                {/* Auto-Expiration Setting */}
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Rate List Expiration Policy
                    </label>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Set validity period for seasonal or promotional manufacturer prices.
                  </p>
                  <div className="flex items-center space-x-2">
                    {[7, 14, 30, 0].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setAutoExpireDays(days)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                          autoExpireDays === days
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-700 border-amber-200'
                        }`}
                      >
                        {days === 0 ? 'Permanent' : `${days} Days`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleParseRateList}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Parsing Rates with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Parse Rate List with Gemini AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Active & Recently Uploaded Rate Lists Tracker */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">
                      Recently Uploaded Rate Lists ({rateLists.length})
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      1-click live price sync to catalog or delete recent list
                    </p>
                  </div>
                </div>

                {rateLists.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    No rate lists saved yet. Upload or parse one above.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto">
                    {rateLists.map((rl) => (
                      <div
                        key={rl.id}
                        className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                          rl.isExpired
                            ? 'border-slate-200 bg-slate-50 text-slate-500'
                            : 'border-emerald-200 bg-emerald-50/40 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {rl.title}
                              {rl.isExpired ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-semibold">
                                  Expired
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Vendor: <strong>{rl.vendorName}</strong> • {rl.itemCount || rl.items?.length || 0} items
                            </div>
                            {rl.expiresAt && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                Valid until: {new Date(rl.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons: Update Rates in Catalog + Delete */}
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateRatesFromList(rl.id)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                            title="Update matching catalog items with these rates"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Update Rates in Catalog</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRecentRateList(rl.id, rl.title)}
                            className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            title="Delete this recent rate list"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7">
              {rateListResult ? (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        AI Parsed Rate List Preview
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900">
                        {rateListResult.listTitle || 'Standardized Rate List'}
                      </h3>
                      <div className="text-xs text-slate-500">
                        Vendor: <strong>{rateListResult.detectedVendor || 'Vendor'}</strong> • {rateListResult.items.length} Items Extracted
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRateListResult(null)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={handleCommitRateList}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save & Sync Catalog Rates</span>
                      </button>
                    </div>
                  </div>

                  {/* Mapping badge summary */}
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {Object.entries(rateListResult.columnMappingDetected || {}).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        {k}: <strong>{v}</strong>
                      </span>
                    ))}
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Item Name & Specs</th>
                          <th className="p-2 text-right">Cost Price</th>
                          <th className="p-2 text-right">Retail Price</th>
                          <th className="p-2 text-right">Margin %</th>
                          <th className="p-2 text-center">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rateListResult.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2">
                              <div className="font-semibold text-slate-900">{item.name}</div>
                              {item.category && (
                                <div className="text-[10px] text-slate-400">Cat: {item.category}</div>
                              )}
                            </td>
                            <td className="p-2 text-right font-mono-numbers">
                              {storeProfile.currency} {item.costPrice?.toLocaleString()}
                            </td>
                            <td className="p-2 text-right font-mono-numbers font-bold text-emerald-700">
                              {storeProfile.currency} {item.retailPrice?.toLocaleString()}
                            </td>
                            <td className="p-2 text-right font-mono-numbers text-slate-600">
                              {item.marginPercent ? `${item.marginPercent}%` : `${Math.round(((item.retailPrice - item.costPrice) / (item.costPrice || 1)) * 100)}%`}
                            </td>
                            <td className="p-2 text-center text-slate-500">{item.unit || 'pcs'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rateListResult.warningsOrAnomalies && rateListResult.warningsOrAnomalies.length > 0 && (
                    <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-800 border border-amber-200">
                      <strong>Notes & Anomalies:</strong> {rateListResult.warningsOrAnomalies.join(' • ')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 border border-dashed border-slate-300 text-center space-y-3">
                  <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-700">Ready to Ingest Rate Lists & Update Rates</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Upload an image of a manufacturer price sheet (e.g. Pakistan Cables, GM Cables) or paste CSV/text on the left, then click "Parse Rate List with Gemini AI".
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-2 text-left">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">⚡ Live Catalog Price Sync</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Matches products by barcode or cable name and updates cost and selling rates instantly.
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">🗑️ Delete Recent Rate Lists</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Keep your active price lists organized and discard outdated or test sheets in 1 click.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 4: AI DEMAND & BI FORECAST ----------------- */}
      {activeTab === 'bi_forecast' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  AI Demand Forecasting & Inventory Optimization
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time intelligence based on active catalog items, stockout risks, and recent transaction velocity.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateForecast}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-1.5 shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Analyzing Trends...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Run AI Intelligence</span>
                  </>
                )}
              </button>
            </div>

            {forecastResult ? (
              <div className="space-y-6 pt-4 border-t border-slate-200 animate-in fade-in">
                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500">Projected 7-Day Revenue</div>
                    <div className="text-2xl font-black text-slate-900 font-mono-numbers mt-1">
                      {storeProfile.currency} {forecastResult.projectedWeeklyRevenue?.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500">Urgency Health Status</div>
                    <div
                      className={`text-lg font-bold mt-1 ${
                        forecastResult.urgencyLevel === 'Critical Stockout Risk'
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {forecastResult.urgencyLevel}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500">Active Vertical</div>
                    <div className="text-lg font-bold text-slate-900 mt-1">
                      {VERTICALS_CONFIG[activeVertical].name}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                  <strong>AI Executive Summary:</strong> {forecastResult.forecastSummary}
                </div>

                {/* Reorder Alerts */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                    Priority Reorder Recommendations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {forecastResult.reorderAlerts?.map((alert, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1 text-xs"
                      >
                        <div className="font-bold text-slate-900 flex justify-between">
                          <span>{alert.itemName}</span>
                          <span className="text-rose-600 font-mono-numbers font-semibold">
                            Stock: {alert.currentStock} left
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{alert.reason}</div>
                        <div className="text-[11px] font-semibold text-emerald-700">
                          Recommended Order: +{alert.recommendedReorderQty} units
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dead Stock Actions */}
                {forecastResult.deadStockRecommendations?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
                      Dead / Slow-Moving Stock Liquidation Plan
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {forecastResult.deadStockRecommendations.map((dead, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1 text-xs"
                        >
                          <div className="font-bold text-amber-950">{dead.itemName}</div>
                          <div className="text-[11px] text-amber-900">Action: {dead.action}</div>
                          <div className="text-[11px] font-semibold text-emerald-700">
                            Cash Unlocked: ~{storeProfile.currency} {dead.expectedCashRelease?.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No Forecast Generated Yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click "Run AI Intelligence" to generate demand forecasting, reorder alerts, and margin tips.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
