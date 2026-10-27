import React, { useState, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import { EstimateRecord, EstimateItem, Product } from '../../types';
import { DEFAULT_PARTNER_SHOPS } from '../../data/defaultData';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  X,
  Phone,
  MapPin,
  Truck,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  Building2,
  Store,
  Share2,
  Check,
  AlertCircle,
  ShoppingBag,
  ArrowUpRight,
  PhoneCall,
  RefreshCw,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';

type EstimateSubTab = 'dashboard' | 'create' | 'partner_stock';

export const EstimatesManager: React.FC = () => {
  const {
    estimates,
    addEstimate,
    deleteEstimate,
    convertEstimateToSale,
    markEstimateAsPaid,
    transferStockFromPartnerShop,
    storeProfile,
    filteredProducts,
    khatas,
  } = usePos();

  const [activeSubTab, setActiveSubTab] = useState<EstimateSubTab>('dashboard');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'converted' | 'paid' | 'expired'>('all');
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Create Estimate Form State ---
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [newEstimateItems, setNewEstimateItems] = useState<EstimateItem[]>([]);
  const [customerName, setCustomerName] = useState('Haji Aslam Contractor');
  const [customerPhone, setCustomerPhone] = useState('+92 300 1234567');
  const [deliveryType, setDeliveryType] = useState<'none' | 'rider' | 'cargo' | 'van'>('none');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [validDays, setValidDays] = useState<number>(15);
  const [notes, setNotes] = useState('Payment within 15 days. Price subject to market copper revision.');

  // --- Partner Stock Locator State ---
  const [partnerStockSearch, setPartnerStockSearch] = useState('');
  const [transferQuantities, setTransferQuantities] = useState<Record<string, number>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered estimate records for dashboard
  const filteredEstimates = useMemo(() => {
    return estimates.filter((est) => {
      const matchesSearch =
        est.estimateNo.toLowerCase().includes(search.toLowerCase()) ||
        est.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (est.customerPhone && est.customerPhone.includes(search)) ||
        est.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'converted'
          ? est.status === 'converted' || est.status === 'paid'
          : est.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [estimates, search, statusFilter]);

  // KPI Calculations
  const totalEstimatesCount = estimates.length;
  const totalEstimatesAmount = estimates.reduce((sum, e) => sum + e.grandTotal, 0);
  const pendingCount = estimates.filter((e) => e.status === 'pending').length;
  const paidOrConvertedCount = estimates.filter((e) => e.status === 'converted' || e.status === 'paid').length;
  const zeroStockQuotesCount = estimates.filter((e) => e.items.some((i) => i.wasZeroStock)).length;

  // Handle Mark as Paid (Automatically reduces inventory stock)
  const handleMarkAsPaid = (id: string) => {
    const sale = markEstimateAsPaid(id, 'cash');
    if (sale) {
      showToast(`✓ Estimate #${sale.invoiceNo} marked PAID! Stock automatically deducted from inventory.`);
      if (selectedEstimate?.id === id) {
        setSelectedEstimate((prev) => (prev ? { ...prev, status: 'paid' } : null));
      }
    } else {
      showToast('Could not mark estimate as paid. Please verify status.');
    }
  };

  // Handle Convert to Official Sale (Also reduces inventory stock)
  const handleConvert = (id: string) => {
    const sale = convertEstimateToSale(id);
    if (sale) {
      showToast(`✓ Converted to POS Sale #${sale.invoiceNo}! Inventory stock updated.`);
      if (selectedEstimate?.id === id) {
        setSelectedEstimate((prev) => (prev ? { ...prev, status: 'converted' } : null));
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = (est: EstimateRecord) => {
    const text = `*ESTIMATE / QUOTATION - ${storeProfile.name}*\n` +
      `Quote No: ${est.estimateNo}\n` +
      `Date: ${est.date}\n` +
      `Customer: ${est.customerName}\n` +
      `--------------------------------\n` +
      est.items.map((i, idx) => `${idx + 1}. ${i.name} [${i.color || ''} ${i.subCategory || ''}] x${i.quantity} = ${storeProfile.currency} ${i.subtotal}`).join('\n') +
      `\n--------------------------------\n` +
      `Subtotal: ${storeProfile.currency} ${est.subtotal}\n` +
      (est.deliveryFee > 0 ? `Delivery (${est.deliveryType}): ${storeProfile.currency} ${est.deliveryFee}\n` : '') +
      (est.taxAmount > 0 ? `GST (${est.taxRate}%): ${storeProfile.currency} ${est.taxAmount}\n` : '') +
      `*Grand Total: ${storeProfile.currency} ${est.grandTotal}*\n` +
      (est.notes ? `Notes: ${est.notes}\n` : '') +
      `Thank you for your business!`;

    const encoded = encodeURIComponent(text);
    const phoneClean = (est.customerPhone || '').replace(/[^0-9]/g, '');
    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // --- Product Search Autocomplete for "Create Estimate" ---
  const matchingProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return [];
    const q = productSearchQuery.toLowerCase().trim();
    return filteredProducts
      .filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.urduName && p.urduName.includes(q)) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [productSearchQuery, filteredProducts]);

  // Add Product to Estimate (Auto-populates price, color, sub-category, etc.)
  const handleSelectProductForEstimate = (prod: Product) => {
    const wasZero = prod.stockQuantity <= 0;
    const existingIndex = newEstimateItems.findIndex((i) => i.productId === prod.id);

    if (existingIndex >= 0) {
      // Increase qty
      const updated = [...newEstimateItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setNewEstimateItems(updated);
    } else {
      const newItem: EstimateItem = {
        productId: prod.id,
        name: prod.name,
        quantity: 1,
        unitPrice: prod.retailPrice,
        unit: prod.unit || 'pcs',
        color: prod.color || '',
        size: prod.size || '',
        subCategory: prod.subSize || prod.category,
        subtotal: prod.retailPrice,
        wasZeroStock: wasZero,
      };
      setNewEstimateItems([...newEstimateItems, newItem]);
    }

    setProductSearchQuery('');
    setShowProductSuggestions(false);
    showToast(`Added "${prod.name}" @ ${storeProfile.currency} ${prod.retailPrice}`);
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...newEstimateItems];
    updated[index].quantity = newQty;
    updated[index].subtotal = newQty * updated[index].unitPrice;
    setNewEstimateItems(updated);
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    const updated = [...newEstimateItems];
    updated[index].unitPrice = Math.max(0, newPrice);
    updated[index].subtotal = updated[index].quantity * Math.max(0, newPrice);
    setNewEstimateItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setNewEstimateItems(newEstimateItems.filter((_, i) => i !== index));
  };

  // Calculation for Create Form
  const createSubtotal = newEstimateItems.reduce((sum, item) => sum + item.subtotal, 0);
  const calculatedTaxAmount = Math.round(createSubtotal * (taxRate / 100));
  const createGrandTotal = Math.max(0, createSubtotal - discountAmount + calculatedTaxAmount + deliveryFee);

  const handleSaveEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEstimateItems.length === 0) {
      showToast('Please search and add at least one product to the estimate.');
      return;
    }
    if (!customerName.trim()) {
      showToast('Please enter customer name or contractor party.');
      return;
    }

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + validDays);

    const saved = addEstimate({
      date: new Date().toISOString().split('T')[0],
      validUntil: validUntilDate.toISOString().split('T')[0],
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: newEstimateItems,
      subtotal: createSubtotal,
      discountAmount,
      taxRate,
      taxAmount: calculatedTaxAmount,
      deliveryType,
      deliveryFee,
      deliveryAddress: deliveryAddress.trim(),
      grandTotal: createGrandTotal,
      notes: notes.trim(),
      status: 'pending',
    });

    showToast(`✓ Estimate #${saved.estimateNo} created successfully!`);
    setSelectedEstimate(saved);
    setActiveSubTab('dashboard');

    // Reset create form
    setNewEstimateItems([]);
    setDeliveryAddress('');
    setDiscountAmount(0);
    setDeliveryFee(0);
  };

  // --- Partner Stock Arranger ---
  const outOfStockProducts = useMemo(() => {
    const q = partnerStockSearch.toLowerCase().trim();
    return filteredProducts.filter((p) => {
      const isOut = p.stockQuantity <= 0 || p.stockQuantity <= p.minStockAlert;
      if (!isOut) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.urduName && p.urduName.includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [filteredProducts, partnerStockSearch]);

  const handleTransferStock = (productId: string, partnerShopName: string) => {
    const qty = transferQuantities[productId] || 10;
    const res = transferStockFromPartnerShop(productId, qty, partnerShopName);
    if (res.success) {
      showToast(`✓ ${qty} units transferred from "${partnerShopName}" into local stock! New Stock: ${res.newStock}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Estimates & Quotations Hub (تخمینہ بل اور کوٹیشن)
              </h2>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                Generate estimates, auto-fill product rates, deduct stock on payment, and arrange 0-stock items from partner shops.
              </div>
            </div>
          </div>
        </div>

        {/* Top Sub-page Nav Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'dashboard'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Invoices</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSubTab === 'dashboard' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
              {estimates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'create'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Estimate</span>
            {newEstimateItems.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white">
                {newEstimateItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('partner_stock')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'partner_stock'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-500" />
            <span>Partner Shop Stock</span>
            {outOfStockProducts.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono">
                {outOfStockProducts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-PAGE 1: DASHBOARD & ALL ESTIMATE INVOICES            */}
      {/* ========================================================= */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Total Estimates
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono-numbers">
                {totalEstimatesCount}
              </div>
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                Valued at {storeProfile.currency} {totalEstimatesAmount.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Pending Quotes</span>
              </div>
              <div className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-1 font-mono-numbers">
                {pendingCount}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Waiting for client approval
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Paid / Converted</span>
              </div>
              <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1 font-mono-numbers">
                {paidOrConvertedCount}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                ✓ Stock Auto-Deducted
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>0-Stock Special Orders</span>
              </div>
              <div className="text-2xl font-black text-purple-800 dark:text-purple-300 mt-1 font-mono-numbers">
                {zeroStockQuotesCount}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Quoted via partner stock
              </div>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quote #, customer, item, phone..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'pending', 'converted', 'expired'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {st === 'converted' ? 'Paid / Converted' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Estimates Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {filteredEstimates.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-900 dark:text-white">No Estimates Found</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  Click the "Create Estimate" tab above or create a quote from POS Counter to record your first quotation.
                </p>
                <button
                  onClick={() => setActiveSubTab('create')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Estimate Now</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Quote # & Date</th>
                      <th className="px-4 py-3">Customer Party</th>
                      <th className="px-4 py-3">Items (Color / Size)</th>
                      <th className="px-4 py-3">Delivery & Tax</th>
                      <th className="px-4 py-3 text-right">Grand Total</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredEstimates.map((est) => {
                      const hasZeroStock = est.items.some((i) => i.wasZeroStock);
                      const isPaidOrConverted = est.status === 'converted' || est.status === 'paid';

                      return (
                        <tr
                          key={est.id}
                          className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold font-mono text-purple-700 dark:text-purple-400">
                              {est.estimateNo}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {est.date}
                            </div>
                            {hasZeroStock && (
                              <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                0-Stock Special Order
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {est.customerName}
                            </div>
                            {est.customerPhone && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{est.customerPhone}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="text-slate-900 dark:text-slate-100 font-semibold">
                              {est.items.length} product(s)
                            </div>
                            <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-xs">
                              {est.items.map((i) => `${i.name} [${i.color || ''} ${i.subCategory || ''}] x${i.quantity}`).join(', ')}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="text-[11px] text-slate-800 dark:text-slate-200">
                              {est.deliveryType !== 'none' ? (
                                <span className="font-bold capitalize text-slate-900 dark:text-white flex items-center gap-1">
                                  <Truck className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>{est.deliveryType}: {storeProfile.currency} {est.deliveryFee}</span>
                                </span>
                              ) : (
                                <span className="text-slate-500">Self Pickup</span>
                              )}
                            </div>
                            {est.taxRate > 0 && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                GST ({est.taxRate}%): {storeProfile.currency} {est.taxAmount}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
                              {storeProfile.currency} {est.grandTotal.toLocaleString()}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold capitalize ${
                                isPaidOrConverted
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                  : est.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                              }`}
                            >
                              {isPaidOrConverted ? '✓ Paid & Stock Less' : est.status}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedEstimate(est)}
                              title="Full Preview & Print Quote"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Mark as Paid & Auto-Deduct Stock Button */}
                            {est.status === 'pending' && (
                              <button
                                onClick={() => handleMarkAsPaid(est.id)}
                                title="Customer Paid: Deduct items from stock immediately"
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] inline-flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Paid & Stock Less</span>
                              </button>
                            )}

                            {/* WhatsApp Share Button */}
                            <button
                              onClick={() => handleWhatsAppShare(est)}
                              title="Share Quote on WhatsApp"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => deleteEstimate(est.id)}
                              title="Delete Estimate"
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 2: CREATE ESTIMATE INVOICE (LIVE PRODUCT SEARCH) */}
      {/* ========================================================= */}
      {activeSubTab === 'create' && (
        <form onSubmit={handleSaveEstimate} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Create New Estimate Invoice (نیا تخمینہ بل بنائیں)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Search any product to automatically populate current retail price, color, size, and category.
                </p>
              </div>
              <div className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                0-Stock Items Allowed on Estimate
              </div>
            </div>

            {/* Live Product Search Bar (Auto Add & Populate) */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Search Product to Auto-Add (پروڈکٹ تلاش کریں اور خودکار شامل کریں)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => {
                    setProductSearchQuery(e.target.value);
                    setShowProductSuggestions(true);
                  }}
                  onFocus={() => setShowProductSuggestions(true)}
                  placeholder="Type product name, barcode (e.g. GM Wire 7/29, Breaker 32A, PVC Pipe)..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border-2 border-purple-500/40 focus:border-purple-600 rounded-xl focus:outline-hidden text-slate-900 dark:text-white font-semibold"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showProductSuggestions && matchingProducts.length > 0 && (
                <div className="absolute top-full mt-1.5 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {matchingProducts.map((prod) => {
                    const isOut = prod.stockQuantity <= 0;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectProductForEstimate(prod)}
                        className="p-3 hover:bg-purple-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-purple-600 truncate">
                            {prod.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="uppercase text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {prod.category}
                            </span>
                            {prod.color && (
                              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">
                                Color: {prod.color}
                              </span>
                            )}
                            {(prod.subSize || prod.size) && (
                              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">
                                Size: {prod.size || prod.subSize}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right ml-4 shrink-0">
                          <div className="text-xs font-black font-mono text-purple-700 dark:text-purple-400">
                            {storeProfile.currency} {prod.retailPrice.toLocaleString()}
                          </div>
                          <div className={`text-[10px] font-bold ${isOut ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {isOut ? '0 Stock (Quoted)' : `${prod.stockQuantity} ${prod.unit} in store`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Added Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Estimate Items ({newEstimateItems.length})
                </span>
                {newEstimateItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNewEstimateItems([])}
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold"
                  >
                    Clear All Items
                  </button>
                )}
              </div>

              {newEstimateItems.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-center">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    No items in estimate yet. Type in the search box above to add items automatically.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5 text-left">Product</th>
                        <th className="p-2.5 text-center">Color / Sub-Size</th>
                        <th className="p-2.5 text-center w-28">Quantity</th>
                        <th className="p-2.5 text-right w-32">Rate ({storeProfile.currency})</th>
                        <th className="p-2.5 text-right">Line Total</th>
                        <th className="p-2.5 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {newEstimateItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                            {item.wasZeroStock && (
                              <span className="text-[9px] font-bold text-amber-600">
                                Special Order (0 Stock)
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                              {item.color || item.size || item.subCategory || '-'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(idx, item.quantity - 1)}
                                className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 font-bold text-slate-800 dark:text-white"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQty(idx, parseInt(e.target.value) || 1)}
                                className="w-12 text-center py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-bold text-slate-900 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(idx, item.quantity + 1)}
                                className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 font-bold text-slate-800 dark:text-white"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              min={0}
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItemPrice(idx, parseFloat(e.target.value) || 0)}
                              className="w-24 text-right py-0.5 px-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {storeProfile.currency} {item.subtotal.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-rose-500 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Customer & Delivery Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              {/* Customer Box */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Customer / Contractor Party
                </h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="e.g. Haji Aslam Builder & Contractor"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quote Validity
                  </label>
                  <select
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                  >
                    <option value={7}>Valid for 7 Days</option>
                    <option value={15}>Valid for 15 Days</option>
                    <option value={30}>Valid for 30 Days</option>
                  </select>
                </div>
              </div>

              {/* Delivery & Tax Adjustments */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Delivery & Taxes Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Delivery Option
                    </label>
                    <select
                      value={deliveryType}
                      onChange={(e) => {
                        const t = e.target.value as any;
                        setDeliveryType(t);
                        if (t === 'none') setDeliveryFee(0);
                        if (t === 'rider') setDeliveryFee(250);
                        if (t === 'cargo') setDeliveryFee(1200);
                        if (t === 'van') setDeliveryFee(800);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="none">Self Pickup (Rs 0)</option>
                      <option value="rider">Rider / Bike (Rs 250)</option>
                      <option value="cargo">Faisal / Bilty Cargo (Rs 1,200)</option>
                      <option value="van">Shahzore Mini Van (Rs 800)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Delivery Fee ({storeProfile.currency})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Delivery Destination Address
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. Site #4, Phase 6 DHA, Lahore"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      GST Tax Rate
                    </label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                    >
                      <option value={0}>0% Tax Exempt</option>
                      <option value={5}>5% Special GST</option>
                      <option value={12}>12% Service Tax</option>
                      <option value={18}>18% Standard GST</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Discount ({storeProfile.currency})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Grand Total Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Terms & Note for Customer
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="text-right flex items-center gap-4">
                <div>
                  <div className="text-[11px] text-slate-500 uppercase font-bold">Estimated Grand Total</div>
                  <div className="text-2xl font-black font-mono text-purple-700 dark:text-purple-400">
                    {storeProfile.currency} {createGrandTotal.toLocaleString()}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={newEstimateItems.length === 0}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-500/30 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Estimate Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* SUB-PAGE 3: OUT OF STOCK & ARRANGE OTHER SHOP             */}
      {/* ========================================================= */}
      {activeSubTab === 'partner_stock' && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                Nearby Partner Branches Stock Locator (دیگر دکانوں سے اسٹاک منگوائیں)
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                When items run out of stock in your main counter, view nearby godowns, sister branches, and wholesale partners to arrange stock instantly. 1-click transfer adds the requested stock directly to your counter inventory.
              </p>
            </div>
          </div>

          {/* Search Out-of-Stock Items */}
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={partnerStockSearch}
                onChange={(e) => setPartnerStockSearch(e.target.value)}
                placeholder="Search out-of-stock items..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-900 dark:text-white font-medium"
              />
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">
              {outOfStockProducts.length} low or 0-stock products requiring restock
            </div>
          </div>

          {/* Out of Stock Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outOfStockProducts.map((prod) => {
              const transferQty = transferQuantities[prod.id] || 10;

              return (
                <div
                  key={prod.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-300/80 dark:border-slate-800 p-4 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        {prod.stockQuantity <= 0 ? 'Out of Stock (0 Left)' : `Low Stock: ${prod.stockQuantity} ${prod.unit}`}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                        {prod.name}
                      </h4>
                      {prod.urduName && (
                        <p className="text-xs text-slate-500 font-medium" dir="rtl">
                          {prod.urduName}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>Category: {prod.category}</span>
                        {prod.color && <span>• Color: {prod.color}</span>}
                        {(prod.subSize || prod.size) && <span>• Size: {prod.size || prod.subSize}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-bold">Retail Rate</div>
                      <div className="text-sm font-black font-mono text-purple-700 dark:text-purple-400">
                        {storeProfile.currency} {prod.retailPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Partner Branches Offering this item */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Available at Nearby Partner Branches:</span>
                      <span className="text-[10px] text-emerald-600 font-bold">✓ Verified Stock</span>
                    </div>

                    <div className="space-y-1.5">
                      {DEFAULT_PARTNER_SHOPS.map((shop) => (
                        <div
                          key={shop.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{shop.shopName}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({shop.distanceKm} km away)
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{shop.branchArea}</span>
                              </span>
                              <span className="flex items-center gap-1 font-mono">
                                <PhoneCall className="w-3 h-3 text-slate-400" />
                                <span>{shop.phone}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                              {shop.availableStock} {shop.unit}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleTransferStock(prod.id, shop.shopName)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Arrange +{transferQty}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quantity stepper for transfer */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500 font-medium">Quantity to arrange:</span>
                      <div className="flex items-center space-x-1">
                        {[5, 10, 25, 50].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() =>
                              setTransferQuantities({
                                ...transferQuantities,
                                [prod.id]: q,
                              })
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              transferQty === q
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            +{q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DETAILED INVOICE PREVIEW MODAL & PDF PRINT SHEET          */}
      {/* ========================================================= */}
      {selectedEstimate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-sm">
                  Estimate / Quotation: {selectedEstimate.estimateNo}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => handleWhatsAppShare(selectedEstimate)}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => setSelectedEstimate(null)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Printable Sheet Body */}
            <div className="p-6 overflow-y-auto space-y-4 print:p-0 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              {/* Store & Header */}
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">
                    {storeProfile.name}
                  </h3>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{storeProfile.address}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Phone: {storeProfile.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 uppercase inline-block">
                    ESTIMATE / تخمینہ بل
                  </div>
                  <div className="text-sm font-black font-mono mt-1 text-slate-900 dark:text-white">
                    {selectedEstimate.estimateNo}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Date: {selectedEstimate.date}</div>
                  {selectedEstimate.validUntil && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Valid Until: {selectedEstimate.validUntil}</div>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                selectedEstimate.status === 'converted' || selectedEstimate.status === 'paid'
                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30'
              }`}>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    Status: {selectedEstimate.status === 'converted' || selectedEstimate.status === 'paid' ? 'PAID & INVENTORY DEDUCTED' : 'PENDING ESTIMATE'}
                  </span>
                </div>
                <span className="text-[10px] font-normal">
                  {selectedEstimate.status === 'pending'
                    ? 'Click "Mark as Paid & Deduct Stock" below when client confirms payment.'
                    : 'Stock was automatically deducted from catalog upon payment.'}
                </span>
              </div>

              {/* Customer Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Customer / Party:</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedEstimate.customerName}
                  </div>
                  {selectedEstimate.customerPhone && (
                    <div className="text-slate-600 dark:text-slate-400 font-mono">{selectedEstimate.customerPhone}</div>
                  )}
                </div>
                {selectedEstimate.deliveryAddress && (
                  <div className="text-right mt-2 sm:mt-0">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Delivery Destination:</span>
                    <div className="text-slate-800 dark:text-slate-200 font-medium">
                      {selectedEstimate.deliveryAddress}
                    </div>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 text-left">Item Description</th>
                      <th className="p-2.5 text-center">Color / Sub-Size</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Rate</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedEstimate.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                          {item.name}
                          {item.wasZeroStock && (
                            <span className="ml-1 text-[9px] text-amber-600 font-bold">
                              (Special Order)
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                            {item.color || item.size || item.subCategory || '-'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono-numbers font-bold text-slate-900 dark:text-white">
                          {item.quantity} {item.unit || ''}
                        </td>
                        <td className="p-2.5 text-right font-mono-numbers text-slate-800 dark:text-slate-200">
                          {storeProfile.currency} {item.unitPrice.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {storeProfile.currency} {item.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Items Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {storeProfile.currency} {selectedEstimate.subtotal.toLocaleString()}
                    </span>
                  </div>
                  {selectedEstimate.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Discount:</span>
                      <span className="font-mono">
                        -{storeProfile.currency} {selectedEstimate.discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedEstimate.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>GST ({selectedEstimate.taxRate}%):</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        +{storeProfile.currency} {selectedEstimate.taxAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedEstimate.deliveryFee > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Delivery ({selectedEstimate.deliveryType}):</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        +{storeProfile.currency} {selectedEstimate.deliveryFee.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-300 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-white">
                    <span>Estimated Total:</span>
                    <span className="font-mono text-purple-700 dark:text-purple-400">
                      {storeProfile.currency} {selectedEstimate.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedEstimate.notes && (
                <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white">Notes & Terms:</strong> {selectedEstimate.notes}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-urdu">
                تخمینہ بل ادا ہونے پر اسٹاک خود بخود کم ہو جائے گا۔
              </span>
              <div className="flex items-center space-x-2">
                {selectedEstimate.status === 'pending' && (
                  <button
                    onClick={() => handleMarkAsPaid(selectedEstimate.id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark as Paid & Deduct Stock</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedEstimate(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
