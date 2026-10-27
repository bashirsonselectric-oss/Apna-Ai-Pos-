import React, { useState, useRef, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import { Product } from '../../types';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Percent,
  CheckCircle,
  Tag,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Layers,
  Filter,
  Mic,
  MicOff,
  Camera,
  RefreshCw,
  WifiOff,
  Zap,
  Image as ImageIcon,
  Loader2,
  Truck,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Palette,
  Check,
  Building2,
  MapPin,
  PhoneCall,
  X,
} from 'lucide-react';
import { DEFAULT_PARTNER_SHOPS } from '../../data/defaultData';

interface PosTerminalProps {
  onOpenCheckout: () => void;
  onOpenCustomItem: () => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({ onOpenCheckout, onOpenCustomItem }) => {
  const {
    products,
    filteredProducts,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartSubtotal,
    cartDiscount,
    setCartDiscount,
    cartTaxRate,
    setCartTaxRate,
    cartTaxAmount,
    cartDeliveryType,
    setCartDeliveryType,
    cartDeliveryFee,
    setCartDeliveryFee,
    cartDeliveryAddress,
    setCartDeliveryAddress,
    cartRiderName,
    setCartRiderName,
    cartGrandTotal,
    hasZeroStockInCart,
    addEstimate,
    transferStockFromPartnerShop,
    storeProfile,
    isOffline,
    offlineSalesQueue,
    syncOfflineSales,
    isSyncing,
    performSmartSearch,
  } = usePos();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  const [showTaxOptions, setShowTaxOptions] = useState(false);

  // Partner Branch Stock Arrangement Modal
  const [partnerArrangeProduct, setPartnerArrangeProduct] = useState<Product | null>(null);
  const [partnerTransferToast, setPartnerTransferToast] = useState<string | null>(null);

  // Estimate Creation Modal State
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [estimateCustomerName, setEstimateCustomerName] = useState('Haji Aslam Contractor');
  const [estimateCustomerPhone, setEstimateCustomerPhone] = useState('+92 300 1234567');
  const [estimateAddress, setEstimateAddress] = useState('');
  const [estimateNotes, setEstimateNotes] = useState('');
  const [estimateValidDays, setEstimateValidDays] = useState(15);
  const [estimateSuccessToast, setEstimateSuccessToast] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Smart POS Query & Voice state
  const [aiQuery, setAiQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchStatus, setAiSearchStatus] = useState<{
    text: string;
    type: 'success' | 'fallback' | 'error';
  } | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Extract unique categories for current vertical
  const categories = ['All', ...Array.from(new Set(filteredProducts.map((p) => p.category)))];

  // Filter products by search and category
  const displayedProducts = filteredProducts.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      product.name.toLowerCase().includes(query) ||
      (product.urduName && product.urduName.includes(query)) ||
      product.barcode.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      JSON.stringify(product.verticalAttributes || {}).toLowerCase().includes(query);

    return matchesCategory && matchesQuery;
  });

  // Handle hardware barcode scanner submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = filteredProducts.find(
      (p) => p.barcode.trim() === barcodeInput.trim()
    );

    if (matched) {
      addToCart(matched, 1);
      setBarcodeInput('');
    } else {
      alert(`No product found with Barcode: "${barcodeInput}". You can add it via Quick Item.`);
    }
  };

  // AI Fast Add Execution (Online Gemini 2.5 Flash / Offline IndexedDB Fallback)
  const handleAiFastAdd = async (overrideQuery?: string, imageBase64?: string) => {
    const queryToUse = overrideQuery !== undefined ? overrideQuery : aiQuery;
    if (!queryToUse.trim() && !imageBase64) return;

    setIsAiSearching(true);
    setAiSearchStatus(null);

    try {
      const res = await performSmartSearch(queryToUse, imageBase64);
      if (res.matches && res.matches.length > 0) {
        let addedCount = 0;
        const matchedDescriptions: string[] = [];

        for (const match of res.matches) {
          const prod = products.find((p) => p.id === match.productId);
          if (prod) {
            const qty = match.quantity > 0 ? match.quantity : 1;
            addToCart(prod, qty);
            addedCount += qty;
            matchedDescriptions.push(`${qty}x ${prod.name}`);
          }
        }

        if (addedCount > 0) {
          setAiSearchStatus({
            text: res.isOfflineFallback
              ? `⚡ Offline Fallback: Added ${matchedDescriptions.join(', ')} to cart`
              : `✨ AI Fast Added: ${matchedDescriptions.join(', ')} to cart`,
            type: res.isOfflineFallback ? 'fallback' : 'success',
          });
          setAiQuery('');
        } else {
          setAiSearchStatus({
            text: `Found ${res.matches.length} matches, but items couldn't be loaded into current vertical.`,
            type: 'error',
          });
        }
      } else {
        setAiSearchStatus({
          text: `No catalog match found for "${queryToUse}". Try item names like "breaker", "wire", or "cable".`,
          type: 'error',
        });
      }
    } catch (err: any) {
      setAiSearchStatus({
        text: `Search error: ${err.message || 'Check connection'}`,
        type: 'error',
      });
    } finally {
      setIsAiSearching(false);
    }
  };

  // Microphone Voice Dictation
  const toggleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is not supported in this browser. Please type your order description.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAiQuery(transcript);
        handleAiFastAdd(transcript);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Camera / Image File Selection for damaged barcode or item photo
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleAiFastAdd('Match loose component or damaged barcode from photo', base64);
    };
    reader.readAsDataURL(file);
  };

  // Keyboard shortcuts (F2 for checkout, F4 for barcode input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) {
          onOpenCheckout();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, onOpenCheckout]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Offline Status & Sales Sync Banner */}
      {(isOffline || offlineSalesQueue.length > 0) && (
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <span>Offline Billing Active</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded font-bold">
                  {offlineSalesQueue.length} unsynced
                </span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-400/90 mt-0.5">
                Sales, stock deductions and Udhar Khatta continue running 100% locally. Transactions sync automatically once restored.
              </p>
            </div>
          </div>
          <button
            onClick={() => syncOfflineSales()}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 shrink-0 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Reconciling Cloud...' : 'Sync Now'}</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Grid & Search (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* AI-Powered Smart Assistant Voice & Text Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 rounded-2xl text-white shadow-md border border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold tracking-tight">AI Smart POS Assistant</span>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  {isOffline ? 'Offline Fallback' : 'Gemini 2.5 Flash'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                Natural speech • Damaged barcode • Multi-item orders
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAiFastAdd();
                    }
                  }}
                  placeholder="Type or speak: e.g. '2 32A breakers and GM wire', '3 miniature circuit breakers'..."
                  className="w-full pl-3 pr-20 py-2.5 text-xs rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  disabled={isAiSearching}
                />
                <div className="absolute right-1.5 top-1.5 flex items-center space-x-1">
                  {/* Voice recognition trigger */}
                  <button
                    type="button"
                    onClick={toggleVoiceSearch}
                    className={`p-1.5 rounded-lg text-slate-300 hover:text-white transition-colors ${
                      isListening ? 'bg-rose-500/80 text-white animate-pulse' : 'hover:bg-slate-700'
                    }`}
                    title={isListening ? 'Listening... click to stop' : 'Click to dictate order'}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  {/* Camera / Image scan trigger */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    title="Snap or upload photo of damaged item or barcode"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAiFastAdd()}
                disabled={isAiSearching || !aiQuery.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/40 flex items-center space-x-1.5 disabled:opacity-40 transition-all shrink-0"
              >
                {isAiSearching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mapping...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI Fast Add</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
              <span className="text-slate-400 shrink-0 font-medium">Try:</span>
              {[
                '2 32A breakers and GM wire',
                '3 miniature circuit breakers',
                '5 led bulbs 12w and tape',
                '1 concealed shower mixer',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setAiQuery(chip);
                    handleAiFastAdd(chip);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors shrink-0 font-mono"
                >
                  "{chip}"
                </button>
              ))}
            </div>

            {/* AI Search Feedback Status */}
            {aiSearchStatus && (
              <div
                className={`mt-2.5 px-3 py-1.5 rounded-xl text-xs flex items-center justify-between border ${
                  aiSearchStatus.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : aiSearchStatus.type === 'fallback'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {aiSearchStatus.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {aiSearchStatus.type === 'fallback' && <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  {aiSearchStatus.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                  <span className="truncate">{aiSearchStatus.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiSearchStatus(null)}
                  className="text-slate-400 hover:text-white ml-2 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Top Bar: Barcode Scanner Input + Search */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            {/* Barcode Quick Input */}
            <form onSubmit={handleBarcodeSubmit} className="sm:col-span-5 relative">
              <div className="relative">
                <Barcode className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan Barcode (F4)..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono bg-slate-50 focus:bg-white"
                />
              </div>
            </form>

            {/* General Search */}
            <div className="sm:col-span-7 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items by name, model, spec or Urdu..."
                className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Categories Tab Pill Strip */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider shrink-0 pl-1">
              <Filter className="w-3 h-3" /> Cat:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {displayedProducts.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No products found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your search query, or use Omni-AI Ingestion to import your catalog.
                </p>
                <button
                  onClick={onOpenCustomItem}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  + Add Custom Item
                </button>
              </div>
            ) : (
              displayedProducts.map((prod) => {
                const isLowStock = prod.stockQuantity <= prod.minStockAlert;
                const isOutOfStock = prod.stockQuantity <= 0;

                // Format attribute preview
                const attrPreview = Object.entries(prod.verticalAttributes || {})
                  .slice(0, 2)
                  .map(([k, v]) => `${v}`)
                  .join(' • ');

                return (
                  <div
                    key={prod.id}
                    onClick={() =>
                      addToCart(prod, 1, {
                        selectedColor: prod.color,
                        subCategory: prod.subSize || prod.category,
                      })
                    }
                    className={`bg-white rounded-2xl p-3.5 border transition-all flex flex-col justify-between cursor-pointer select-none group ${
                      isOutOfStock
                        ? 'border-amber-300 bg-amber-50/30 hover:border-amber-500 hover:shadow-md'
                        : 'border-slate-200/90 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between text-[10px] mb-1.5">
                        <span className="font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider truncate max-w-[90px]">
                          {prod.category}
                        </span>
                        <span
                          className={`font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                            isOutOfStock
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isOutOfStock ? '0 Left (Quote)' : `${prod.stockQuantity} ${prod.unit}`}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 leading-snug line-clamp-2">
                        {prod.name}
                      </h4>
                      {prod.urduName && (
                        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5" dir="rtl">
                          {prod.urduName}
                        </p>
                      )}

                      {/* Color & Sub-Category / Sub-size Tags */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {prod.color && (
                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            <span
                              className="w-2 h-2 rounded-full border border-black/20"
                              style={{
                                backgroundColor:
                                  prod.color.toLowerCase() === 'red'
                                    ? '#ef4444'
                                    : prod.color.toLowerCase() === 'black'
                                    ? '#0f172a'
                                    : prod.color.toLowerCase() === 'blue'
                                    ? '#2563eb'
                                    : prod.color.toLowerCase() === 'yellow'
                                    ? '#eab308'
                                    : prod.color.toLowerCase() === 'green'
                                    ? '#16a34a'
                                    : prod.color.toLowerCase() === 'copper'
                                    ? '#b45309'
                                    : '#94a3b8',
                              }}
                            />
                            {prod.color}
                          </span>
                        )}
                        {(prod.subSize || prod.size) && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 truncate max-w-[120px]">
                            {prod.size ? `${prod.size} ` : ''}
                            {prod.subSize || ''}
                          </span>
                        )}
                      </div>

                      {/* 0-Stock Notice & Other Shop Locator */}
                      {isOutOfStock && (
                        <div className="mt-1.5 flex items-center justify-between gap-1 text-[9px]">
                          <span className="text-amber-800 bg-amber-100/90 border border-amber-300 rounded px-1.5 py-0.5 font-bold truncate">
                            ⚡ 0 Stock (Quote)
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPartnerArrangeProduct(prod);
                            }}
                            className="shrink-0 text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded px-1.5 py-0.5 font-bold inline-flex items-center gap-0.5 cursor-pointer shadow-2xs transition-colors"
                            title="Arrange stock from nearby partner shop or godown"
                          >
                            <Building2 className="w-2.5 h-2.5" />
                            <span>Other Shop</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Pricing & Quick Add */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Price</div>
                        <div className="text-sm font-extrabold text-slate-900 font-mono-numbers">
                          {storeProfile.currency} {prod.retailPrice.toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors shadow-2xs font-bold ${
                          isOutOfStock
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                        }`}
                        title={isOutOfStock ? 'Add to Estimate' : 'Add to Cart'}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Counter Cart Ticket (4 cols / 5 on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden sticky top-20">
          {/* Cart Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm">Active Counter Bill</h3>
                <p className="text-[11px] text-slate-400 font-mono-numbers">
                  {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
                </p>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                title="Discard all items"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart Line Items */}
          <div className="p-3 sm:p-4 divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-slate-200" />
                <p className="text-xs font-semibold text-slate-600">Counter ticket is empty</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Scan barcode, click items from catalog, or use Omni-AI.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const isZeroStockItem = item.wasZeroStock || item.product.stockQuantity <= 0;
                const displayColor = item.selectedColor || item.product.color;
                const displaySub = item.subCategory || item.product.subSize || item.product.category;

                return (
                  <div key={item.product.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-1.5">
                        <span className="truncate">{item.product.name}</span>
                        {isZeroStockItem && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-300 shrink-0">
                            0-Stock
                          </span>
                        )}
                      </div>

                      {/* Color & Sub-category line */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {displayColor && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.2 rounded">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  displayColor.toLowerCase() === 'red'
                                    ? '#ef4444'
                                    : displayColor.toLowerCase() === 'black'
                                    ? '#0f172a'
                                    : displayColor.toLowerCase() === 'blue'
                                    ? '#2563eb'
                                    : '#b45309',
                              }}
                            />
                            {displayColor}
                          </span>
                        )}
                        {displaySub && (
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                            {displaySub}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono-numbers">
                          {storeProfile.currency} {item.unitPrice} / {item.product.unit}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center space-x-1 bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateCartQuantity(item.product.id, Number(e.target.value))}
                        className="w-10 text-center text-xs font-bold font-mono-numbers bg-transparent focus:outline-hidden"
                        min="1"
                      />
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right w-20 shrink-0">
                      <div className="font-extrabold text-xs text-slate-900 font-mono-numbers">
                        {storeProfile.currency} {item.subtotal.toLocaleString()}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-[10px] text-slate-400 hover:text-rose-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Bottom Summary & Checkout Trigger */}
          <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-3">
            {/* Subtotal */}
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Subtotal:</span>
              <span className="font-mono-numbers font-semibold">
                {storeProfile.currency} {cartSubtotal.toLocaleString()}
              </span>
            </div>

            {/* Discount Section */}
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setShowDiscountInput(!showDiscountInput)}
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Percent className="w-3.5 h-3.5" />
                {cartDiscount > 0 ? `Discount: -${storeProfile.currency} ${cartDiscount}` : '+ Add Discount'}
              </button>
              {cartDiscount > 0 && (
                <button
                  onClick={() => setCartDiscount(0)}
                  className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  Clear discount
                </button>
              )}
            </div>

            {showDiscountInput && (
              <div className="flex items-center space-x-2 pt-1 animate-in fade-in">
                <span className="text-xs text-slate-500 font-bold">{storeProfile.currency}</span>
                <input
                  type="number"
                  value={cartDiscount || ''}
                  onChange={(e) => setCartDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="Discount in Rs."
                  className="w-full text-xs font-mono-numbers px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
                <button
                  onClick={() => setShowDiscountInput(false)}
                  className="text-xs px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Delivery Option Toggle & Configuration */}
            <div className="pt-1 border-t border-slate-200/80">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setShowDeliveryOptions(!showDeliveryOptions)}
                  className="text-indigo-700 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  {cartDeliveryFee > 0
                    ? `Delivery (${cartDeliveryType}): +${storeProfile.currency} ${cartDeliveryFee}`
                    : '+ Add Delivery / Bilty Cargo'}
                </button>
                {cartDeliveryFee > 0 && (
                  <button
                    onClick={() => {
                      setCartDeliveryFee(0);
                      setCartDeliveryType('none');
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    Remove delivery
                  </button>
                )}
              </div>

              {showDeliveryOptions && (
                <div className="mt-2 p-2.5 bg-white rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'none', label: 'Pickup', fee: 0 },
                      { id: 'rider', label: 'Rider', fee: 200 },
                      { id: 'cargo', label: 'Bilty Cargo', fee: 500 },
                      { id: 'van', label: 'Van / Truck', fee: 1200 },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setCartDeliveryType(d.id as any);
                          setCartDeliveryFee(d.fee);
                        }}
                        className={`px-1.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                          cartDeliveryType === d.id
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-semibold shrink-0">Fee ({storeProfile.currency}):</span>
                    <input
                      type="number"
                      value={cartDeliveryFee || ''}
                      onChange={(e) => setCartDeliveryFee(Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                      className="w-20 text-xs px-2 py-1 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                    <input
                      type="text"
                      value={cartDeliveryAddress}
                      onChange={(e) => setCartDeliveryAddress(e.target.value)}
                      placeholder="Destination address / site..."
                      className="flex-1 text-xs px-2 py-1 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tax (GST / Sales Tax) Toggle & Configuration */}
            <div className="pt-1 border-t border-slate-200/80">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setShowTaxOptions(!showTaxOptions)}
                  className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Percent className="w-3.5 h-3.5" />
                  {cartTaxRate > 0
                    ? `GST / Sales Tax (${cartTaxRate}%): +${storeProfile.currency} ${cartTaxAmount}`
                    : '+ Add Sales Tax / GST'}
                </button>
                {cartTaxRate > 0 && (
                  <button
                    onClick={() => setCartTaxRate(0)}
                    className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    Clear tax
                  </button>
                )}
              </div>

              {showTaxOptions && (
                <div className="mt-2 p-2.5 bg-white rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold">Select GST Rate:</span>
                    {[0, 5, 17, 18].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setCartTaxRate(rate)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          cartTaxRate === rate
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Grand Net Total */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Net Payable Total
                </span>
                <div className="text-2xl font-black text-slate-900 font-mono-numbers">
                  {storeProfile.currency} {cartGrandTotal.toLocaleString()}
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-500 space-y-0.5">
                <div>Tax: {cartTaxRate > 0 ? `${cartTaxRate}% (${storeProfile.currency} ${cartTaxAmount})` : '0%'}</div>
                <div>Delivery: {cartDeliveryFee > 0 ? `${storeProfile.currency} ${cartDeliveryFee}` : 'None'}</div>
              </div>
            </div>

            {/* Zero-Stock Restriction Warning */}
            {hasZeroStockInCart && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs space-y-1">
                <div className="font-extrabold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Cart Contains 0-Stock Product(s)</span>
                </div>
                <p className="text-[11px] leading-tight text-amber-800">
                  Per strict store policy, out-of-stock items <strong>CANNOT</strong> be completed as a live POS sale. Please save as an <strong>Estimate / Quotation</strong> or remove 0-stock items.
                </p>
              </div>
            )}

            {/* Dual Action Buttons: Collect Payment vs Save Estimate */}
            <div className="space-y-2 pt-1">
              {/* Payment Checkout (Disabled if 0-stock exists) */}
              <button
                onClick={onOpenCheckout}
                disabled={cart.length === 0 || hasZeroStockInCart}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>
                  {hasZeroStockInCart
                    ? '🚫 Regular Sale Blocked (0-Stock)'
                    : 'Collect Payment (F2)'}
                </span>
                {!hasZeroStockInCart && <ArrowRight className="w-4 h-4" />}
              </button>

              {/* Save as Estimate / Quotation Button */}
              <button
                type="button"
                onClick={() => setIsEstimateModalOpen(true)}
                disabled={cart.length === 0}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer border ${
                  hasZeroStockInCart
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 border-transparent animate-pulse'
                    : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Save as Estimate / Quotation (تخمینہ بل)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POS Quick Estimate Generation Modal */}
      {isEstimateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-300" />
                <div>
                  <h3 className="font-bold text-sm">Create Estimate / Quotation (تخمینہ بل)</h3>
                  <p className="text-[10px] text-indigo-200">
                    Includes {cart.length} item(s) • Total: {storeProfile.currency} {cartGrandTotal.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEstimateModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const validUntilDate = new Date();
                validUntilDate.setDate(validUntilDate.getDate() + estimateValidDays);

                addEstimate({
                  date: new Date().toISOString().split('T')[0],
                  validUntil: validUntilDate.toISOString().split('T')[0],
                  customerName: estimateCustomerName.trim() || 'Walk-in Customer',
                  customerPhone: estimateCustomerPhone.trim(),
                  customerAddress: estimateAddress.trim() || cartDeliveryAddress.trim(),
                  items: cart.map((c) => ({
                    productId: c.product.id,
                    name: c.product.name,
                    quantity: c.quantity,
                    unit: c.product.unit,
                    unitPrice: c.unitPrice,
                    subtotal: c.subtotal,
                    color: c.selectedColor || c.product.color,
                    size: c.product.size,
                    subCategory: c.subCategory || c.product.subSize,
                    wasZeroStock: c.wasZeroStock || c.product.stockQuantity <= 0,
                  })),
                  subtotal: cartSubtotal,
                  discountAmount: cartDiscount,
                  taxRate: cartTaxRate,
                  taxAmount: cartTaxAmount,
                  deliveryType: cartDeliveryType,
                  deliveryFee: cartDeliveryFee,
                  deliveryAddress: estimateAddress.trim() || cartDeliveryAddress.trim(),
                  grandTotal: cartGrandTotal,
                  notes: estimateNotes.trim() || 'Official Estimate Quotation. Prices valid for 15 days.',
                  status: 'pending',
                });

                clearCart();
                setIsEstimateModalOpen(false);
                setEstimateSuccessToast('Estimate created & recorded successfully! Check Estimates tab.');
                setTimeout(() => setEstimateSuccessToast(null), 4000);
              }}
              className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Customer / Contractor Name *
                </label>
                <input
                  type="text"
                  required
                  value={estimateCustomerName}
                  onChange={(e) => setEstimateCustomerName(e.target.value)}
                  placeholder="e.g. Haji Aslam Contractor"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={estimateCustomerPhone}
                    onChange={(e) => setEstimateCustomerPhone(e.target.value)}
                    placeholder="+92 300 0000000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Quote Validity (Days)
                  </label>
                  <select
                    value={estimateValidDays}
                    onChange={(e) => setEstimateValidDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value={7}>7 Days</option>
                    <option value={15}>15 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Site / Delivery Destination Address
                </label>
                <input
                  type="text"
                  value={estimateAddress}
                  onChange={(e) => setEstimateAddress(e.target.value)}
                  placeholder="e.g. Plot 24, Main Commercial Avenue"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Notes / Terms (Printed on Quote)
                </label>
                <textarea
                  rows={2}
                  value={estimateNotes}
                  onChange={(e) => setEstimateNotes(e.target.value)}
                  placeholder="e.g. Cables on special batch order. Wire rate subject to metal index."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Financial Recap Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">{storeProfile.currency} {cartSubtotal.toLocaleString()}</span>
                </div>
                {cartDeliveryFee > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery ({cartDeliveryType}):</span>
                    <span className="font-mono">+{storeProfile.currency} {cartDeliveryFee.toLocaleString()}</span>
                  </div>
                )}
                {cartTaxAmount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>GST ({cartTaxRate}%):</span>
                    <span className="font-mono">+{storeProfile.currency} {cartTaxAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Estimate Total:</span>
                  <span className="font-mono text-indigo-700">{storeProfile.currency} {cartGrandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEstimateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Confirm & Save Estimate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {estimateSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-indigo-500/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{estimateSuccessToast}</span>
        </div>
      )}

      {/* Partner Branch Stock Arrangement Modal */}
      {partnerArrangeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-sm">
                  Arrange Stock from Partner Shops
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPartnerArrangeProduct(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                      0 Stock at Counter
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-0.5">
                      {partnerArrangeProduct.name}
                    </h4>
                    {partnerArrangeProduct.urduName && (
                      <p className="text-xs text-slate-500" dir="rtl">{partnerArrangeProduct.urduName}</p>
                    )}
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {partnerArrangeProduct.color && <span className="font-semibold">Color: {partnerArrangeProduct.color} • </span>}
                      <span>Category: {partnerArrangeProduct.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Retail</span>
                    <div className="font-mono font-black text-sm text-purple-700">
                      {storeProfile.currency} {partnerArrangeProduct.retailPrice.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Nearby Partner Branches & Wholesale Depots:
                </h5>
                <div className="space-y-2">
                  {DEFAULT_PARTNER_SHOPS.map((shop) => (
                    <div
                      key={shop.id}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-slate-200 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{shop.shopName}</span>
                          <span className="text-[10px] text-slate-500">({shop.distanceKm} km)</span>
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

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                          {shop.availableStock} {shop.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const res = transferStockFromPartnerShop(partnerArrangeProduct.id, 10, shop.shopName);
                            if (res.success) {
                              setPartnerTransferToast(`✓ Arranged 10 units of "${partnerArrangeProduct.name}" from ${shop.shopName}! New Stock: ${res.newStock}`);
                              setTimeout(() => setPartnerTransferToast(null), 3500);
                              setPartnerArrangeProduct(null);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold cursor-pointer shadow-xs"
                        >
                          Transfer +10
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setPartnerArrangeProduct(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Transfer Toast */}
      {partnerTransferToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-purple-500/50 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{partnerTransferToast}</span>
        </div>
      )}
    </div>
  );
};
