import React, { useState, useRef, useEffect, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import { Product } from '../../types';
import { BOUTIQUE_CATEGORIES } from '../../data/boutiqueCatalog';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Percent,
  Tag,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Mic,
  MicOff,
  Camera,
  RefreshCw,
  WifiOff,
  Loader2,
  PauseCircle,
  PlayCircle,
  Award,
  User,
  SlidersHorizontal,
  X,
  Check,
  FileText,
  Clock,
} from 'lucide-react';

interface PosTerminalProps {
  onOpenCheckout: () => void;
  onOpenCustomItem: () => void;
  initialCategory?: string;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({
  onOpenCheckout,
  onOpenCustomItem,
  initialCategory = 'All',
}) => {
  const {
    products,
    filteredProducts,
    activeVertical,
    cart,
    addToCart,
    removeCartItemAt,
    updateCartItemAt,
    clearCart,
    heldOrders,
    holdCurrentOrder,
    resumeHeldOrder,
    deleteHeldOrder,
    selectedPosCustomer,
    setSelectedPosCustomer,
    loyaltyPointsMap,
    coupons,
    appliedCouponCode,
    setAppliedCouponCode,
    cartSubtotal,
    cartDiscount,
    setCartDiscount,
    cartTaxRate,
    setCartTaxRate,
    cartTaxAmount,
    cartGrandTotal,
    hasZeroStockInCart,
    addEstimate,
    khatas,
    vipCustomers,
    storeProfile,
    isOffline,
    offlineSalesQueue,
    syncOfflineSales,
    isSyncing,
    performSmartSearch,
  } = usePos();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('All');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<'all' | 'under_10k' | '10k_20k' | 'over_20k'>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Per-card quick selected variant map (productId -> { color, size })
  const [cardVariantSelections, setCardVariantSelections] = useState<
    Record<string, { color?: string; size?: string }>
  >({});

  // Barcode & Inline Toast Feedback (no window.alert)
  const [barcodeInput, setBarcodeInput] = useState('');
  const [toast, setToast] = useState<{ text: string; tone: 'neutral' | 'success' | 'warn' } | null>(null);

  // Coupon & Manual Discount & Tax Controls
  const [couponInput, setCouponInput] = useState(appliedCouponCode || '');
  const [redeemPointsActive, setRedeemPointsActive] = useState(false);
  const [showManualAdjustments, setShowManualAdjustments] = useState(false);
  const [manualDiscount, setManualDiscount] = useState<number>(0);

  // Held Orders Popover & Customer Picker
  const [heldOrdersOpen, setHeldOrdersOpen] = useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);

  // Variant Modal for quick detailed selection
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const [modalColor, setModalColor] = useState('');
  const [modalSize, setModalSize] = useState('');

  // AI Smart Voice / Visual Search
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, tone: 'neutral' | 'success' | 'warn' = 'neutral') => {
    setToast({ text, tone });
    setTimeout(() => {
      setToast((curr) => (curr?.text === text ? null : curr));
    }, 3200);
  };

  // Sync external initialCategory changes (e.g. from CategoriesView)
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Sync coupon input when appliedCouponCode is set externally (e.g. from DiscountsPromotionsView)
  useEffect(() => {
    if (appliedCouponCode) {
      setCouponInput(appliedCouponCode);
    }
  }, [appliedCouponCode]);

  // Build unified customer list (VIP + Khata + Boutique Loyalty Members)
  const customerDirectory = useMemo(() => {
    const map = new Map<string, { id: string; name: string; phone: string; points: number }>();
    Object.entries(loyaltyPointsMap).forEach(([name, pts]) => {
      map.set(name.toLowerCase(), {
        id: `loy-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        phone: '+92 300 4120099',
        points: pts,
      });
    });
    vipCustomers.forEach((v) => {
      const key = v.customerName.toLowerCase();
      map.set(key, {
        id: v.customerId,
        name: v.customerName,
        phone: v.customerPhone || '',
        points: loyaltyPointsMap[v.customerName] ?? Math.floor(v.totalSpend / 100),
      });
    });
    khatas.forEach((k) => {
      const key = k.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: k.id,
          name: k.name,
          phone: k.phone,
          points: loyaltyPointsMap[k.name] || 0,
        });
      }
    });
    return Array.from(map.values());
  }, [loyaltyPointsMap, vipCustomers, khatas]);

  // Recompute total cartDiscount whenever subtotal, appliedCouponCode, redeemPointsActive, or manualDiscount changes
  useEffect(() => {
    let totalDisc = Math.max(0, manualDiscount);

    if (appliedCouponCode) {
      const matched = coupons.find(
        (c) => c.code.toUpperCase() === appliedCouponCode.toUpperCase() && c.active
      );
      if (matched && cartSubtotal >= matched.minOrder) {
        if (matched.type === 'percentage') {
          totalDisc += Math.round((cartSubtotal * matched.value) / 100);
        } else {
          totalDisc += matched.value;
        }
      }
    }

    if (redeemPointsActive && selectedPosCustomer) {
      const availablePts = loyaltyPointsMap[selectedPosCustomer.name] ?? selectedPosCustomer.points ?? 0;
      const redeemable = Math.min(availablePts, Math.max(0, cartSubtotal - totalDisc));
      totalDisc += redeemable;
    }

    const capped = Math.min(cartSubtotal, Math.max(0, totalDisc));
    if (capped !== cartDiscount) {
      setCartDiscount(capped);
    }
  }, [
    cartSubtotal,
    appliedCouponCode,
    coupons,
    redeemPointsActive,
    selectedPosCustomer,
    loyaltyPointsMap,
    manualDiscount,
  ]);

  // Filter options extracted dynamically from filteredProducts
  const brandOptions = useMemo(() => {
    const set = new Set<string>();
    filteredProducts.forEach((p) => {
      const b = p.verticalAttributes?.brand;
      if (b) set.add(String(b));
    });
    return ['All', ...Array.from(set).sort()];
  }, [filteredProducts]);

  const sizeOptions = useMemo(() => {
    const set = new Set<string>();
    filteredProducts.forEach((p) => {
      if (p.size) set.add(p.size);
      p.options?.sizes?.forEach((s) => set.add(s));
    });
    return ['All', ...Array.from(set)];
  }, [filteredProducts]);

  const colorOptions = useMemo(() => {
    const set = new Set<string>();
    filteredProducts.forEach((p) => {
      if (p.color) set.add(p.color);
      p.colorVariants?.forEach((cv) => set.add(cv.color));
    });
    return ['All', ...Array.from(set)];
  }, [filteredProducts]);

  const isFashionBoutique = activeVertical === 'clothing_apparel';

  // Category tabs: all 10 Fashion Boutique categories with studio images when in Boutique mode
  const dynamicCategories = useMemo(() => {
    if (isFashionBoutique) {
      return BOUTIQUE_CATEGORIES;
    }
    const unique = Array.from(new Set(filteredProducts.map((p) => p.category)));
    return unique.map((c) => ({
      id: c,
      label: c,
      shortLabel: c,
      image: '',
      description: '',
    }));
  }, [isFashionBoutique, filteredProducts]);

  // Apply all search & filters
  const displayedProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return filteredProducts.filter((product) => {
      if (selectedCategory !== 'All' && product.category !== selectedCategory) return false;

      if (selectedBrand !== 'All') {
        const brand = String(product.verticalAttributes?.brand || '');
        if (brand !== selectedBrand) return false;
      }

      if (selectedSizeFilter !== 'All') {
        const allSizes = [product.size, ...(product.options?.sizes || [])].filter(Boolean);
        if (!allSizes.includes(selectedSizeFilter)) return false;
      }

      if (selectedColorFilter !== 'All') {
        const allColors = [
          product.color,
          ...(product.colorVariants?.map((c) => c.color) || []),
          ...(product.options?.colors || []),
        ].filter(Boolean);
        if (!allColors.includes(selectedColorFilter)) return false;
      }

      if (priceRange === 'under_10k' && product.retailPrice >= 10000) return false;
      if (priceRange === '10k_20k' && (product.retailPrice < 10000 || product.retailPrice > 20000)) return false;
      if (priceRange === 'over_20k' && product.retailPrice <= 20000) return false;

      if (lowStockOnly && product.stockQuantity > product.minStockAlert) return false;

      if (query) {
        const haystack = [
          product.name,
          product.urduName || '',
          product.barcode,
          product.category,
          String(product.verticalAttributes?.brand || ''),
          String(product.verticalAttributes?.collection || ''),
          product.color || '',
          product.size || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [
    filteredProducts,
    selectedCategory,
    selectedBrand,
    selectedSizeFilter,
    selectedColorFilter,
    priceRange,
    lowStockOnly,
    searchQuery,
  ]);

  const activeFilterCount =
    (selectedBrand !== 'All' ? 1 : 0) +
    (selectedSizeFilter !== 'All' ? 1 : 0) +
    (selectedColorFilter !== 'All' ? 1 : 0) +
    (priceRange !== 'all' ? 1 : 0) +
    (lowStockOnly ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSelectedBrand('All');
    setSelectedSizeFilter('All');
    setSelectedColorFilter('All');
    setPriceRange('all');
    setLowStockOnly(false);
    setSearchQuery('');
  };

  // Barcode submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const matched = filteredProducts.find(
      (p) => p.barcode.trim().toLowerCase() === code.toLowerCase()
    );
    if (matched) {
      addToCart(matched, 1, {
        selectedColor: matched.colorVariants?.find((c) => c.inStock !== false)?.color || matched.color,
        selectedSize: matched.size || matched.options?.sizes?.[0],
      });
      setBarcodeInput('');
      showToast(`Added ${matched.name} (${matched.barcode})`, 'success');
    } else {
      showToast(`No SKU/barcode found for "${code}". Use + Add Piece to create it.`, 'warn');
    }
  };

  // Apply coupon code
  const handleApplyCoupon = (codeOverride?: string) => {
    const raw = (codeOverride !== undefined ? codeOverride : couponInput).trim().toUpperCase();
    if (!raw) {
      setAppliedCouponCode(null);
      return;
    }
    const found = coupons.find((c) => c.code.toUpperCase() === raw);
    if (!found) {
      showToast(`Coupon "${raw}" not found.`, 'warn');
      return;
    }
    if (!found.active) {
      showToast(`Coupon "${raw}" is currently paused.`, 'warn');
      return;
    }
    if (cartSubtotal < found.minOrder) {
      showToast(
        `${raw} requires minimum order of ${storeProfile.currency} ${found.minOrder.toLocaleString()}.`,
        'warn'
      );
      return;
    }
    setCouponInput(found.code);
    setAppliedCouponCode(found.code);
    showToast(`Applied ${found.code} — ${found.label}`, 'success');
  };

  // Quick add from product card using selected swatch & size
  const handleQuickAddCard = (product: Product) => {
    const sel = cardVariantSelections[product.id];
    const firstInStockColor =
      product.colorVariants?.find((cv) => cv.inStock !== false && cv.stock > 0)?.color ||
      product.color ||
      '';
    const chosenColor = sel?.color || firstInStockColor;
    const chosenSize = sel?.size || product.size || product.options?.sizes?.[0] || '';

    addToCart(product, 1, {
      selectedColor: chosenColor,
      selectedSize: chosenSize,
    });
    showToast(`Added ${product.name}${chosenSize ? ` · ${chosenSize}` : ''}`, 'success');
  };

  // Open variant modal
  const openVariantModal = (product: Product) => {
    const sel = cardVariantSelections[product.id];
    const firstAvailable =
      product.colorVariants?.find((cv) => cv.inStock !== false && cv.stock > 0)?.color ||
      product.color ||
      '';
    setVariantModalProduct(product);
    setModalColor(sel?.color || firstAvailable);
    setModalSize(sel?.size || product.size || product.options?.sizes?.[0] || '');
  };

  // Voice & Visual AI Smart Search
  const handleAiSmartSearch = async (queryText: string, imageBase64?: string) => {
    if (!queryText.trim() && !imageBase64) return;
    setIsAiSearching(true);
    try {
      const res = await performSmartSearch(queryText, imageBase64);
      if (res.matches && res.matches.length > 0) {
        let count = 0;
        for (const match of res.matches) {
          const prod = products.find((p) => p.id === match.productId);
          if (prod) {
            addToCart(prod, match.quantity > 0 ? match.quantity : 1);
            count += match.quantity > 0 ? match.quantity : 1;
          }
        }
        showToast(
          count > 0 ? `Added ${count} matched piece(s) to cart.` : 'No matching item in current boutique.',
          count > 0 ? 'success' : 'warn'
        );
      } else {
        showToast(`No catalog match found for "${queryText}".`, 'warn');
      }
    } catch {
      showToast('Smart search unavailable offline. Use manual search or barcode.', 'warn');
    } finally {
      setIsAiSearching(false);
    }
  };

  const toggleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice search is not supported in this browser.', 'warn');
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
        setSearchQuery(transcript);
        handleAiSmartSearch(transcript);
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleImageLookup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      if (base64) handleAiSmartSearch('Identify fashion item from photo', base64);
    };
    reader.readAsDataURL(file);
  };

  // Hold Current Order
  const handleHoldOrder = () => {
    const held = holdCurrentOrder(selectedPosCustomer?.name || 'Walk-in Guest');
    if (held) {
      setManualDiscount(0);
      setRedeemPointsActive(false);
      setCouponInput('');
      showToast(`Order placed on hold for ${held.customerName}.`, 'neutral');
    }
  };

  // Save as Estimate/Order when 0-stock items exist
  const handleSaveAsOrderQuote = () => {
    if (cart.length === 0) return;
    const est = addEstimate({
      date: new Date().toISOString().split('T')[0],
      customerName: selectedPosCustomer?.name || 'Boutique Guest',
      customerPhone: selectedPosCustomer?.phone || '',
      items: cart.map((c) => ({
        productId: c.product.id,
        name: c.product.name,
        quantity: c.quantity,
        unit: c.product.unit,
        unitPrice: c.unitPrice,
        subtotal: c.subtotal,
        color: c.selectedColor,
        size: c.selectedSize,
        wasZeroStock: c.wasZeroStock,
      })),
      subtotal: cartSubtotal,
      discountAmount: cartDiscount,
      taxRate: cartTaxRate,
      taxAmount: cartTaxAmount,
      deliveryType: 'none',
      deliveryFee: 0,
      grandTotal: cartGrandTotal,
      status: 'pending',
    });
    clearCart();
    setManualDiscount(0);
    setRedeemPointsActive(false);
    setCouponInput('');
    showToast(`Saved Order #${est.estimateNo}. View under Orders tab.`, 'success');
  };

  // Keyboard shortcuts (F2 Checkout, F4 Focus Barcode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0 && !hasZeroStockInCart) {
          onOpenCheckout();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, hasZeroStockInCart, onOpenCheckout]);

  const activeCustomerPoints = selectedPosCustomer
    ? loyaltyPointsMap[selectedPosCustomer.name] ?? selectedPosCustomer.points ?? 0
    : 0;
  const totalCartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 py-4">
      {/* Offline Banner (Compact, Boutique Palette) */}
      {(isOffline || offlineSalesQueue.length > 0) && (
        <div className="mb-4 px-4 py-2.5 rounded-2xl bg-[#FBF5EC] dark:bg-[#261F15] border border-[#E6D1AE] dark:border-[#5C472B] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-xs">
            <WifiOff className="w-4 h-4 text-[#9A6B2F] dark:text-[#F1D29B] shrink-0" />
            <span className="font-semibold text-[#6E4B1D] dark:text-[#F1D29B]">
              Offline Billing Active
            </span>
            <span className="text-[#8A6D43] dark:text-[#C8AE82]">
              · {offlineSalesQueue.length} queued sale{offlineSalesQueue.length === 1 ? '' : 's'} cached in IndexedDB
            </span>
          </div>
          <button
            type="button"
            onClick={() => syncOfflineSales()}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Queue'}</span>
          </button>
        </div>
      )}

      {/* Inline Feedback Toast */}
      {toast && (
        <div
          className={`mb-3 px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
            toast.tone === 'success'
              ? 'bg-[#EEF6F1] dark:bg-[#192A22] border-[#C5DFCF] dark:border-[#2C523E] text-[#1D5438] dark:text-[#86EFAC]'
              : toast.tone === 'warn'
              ? 'bg-[#F3E1DF] dark:bg-[#3A2322] border-[#E5C6C3] dark:border-[#633634] text-[#8A2626] dark:text-[#FCA5A5]'
              : 'bg-white dark:bg-[#1A1816] border-[#E8E0D8] dark:border-[#2E2A26] text-[#141414] dark:text-[#F6F1EB]'
          }`}
        >
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MAIN 16:9 TWO-COLUMN WORKSPACE: Left Product Showcase (~68%) + Right Checkout Cart (~32%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ================= LEFT COLUMN: CATALOG, CATEGORIES, FILTERS & PRODUCT GRID ================= */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-4 min-w-0">
          {/* Top Search, Barcode Scanner & Actions Bar */}
          <div className="bg-white dark:bg-[#1A1816] rounded-2xl border border-[#E8E0D8] dark:border-[#2E2A26] p-3 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Product Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-[#8A7E75] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dresses, bags, watches, brand, SKU or Urdu name..."
                  className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-[#FAF7F4] dark:bg-[#121110] border border-[#E8E0D8] dark:border-[#2E2A26] text-xs text-[#141414] dark:text-[#F6F1EB] placeholder:text-[#8A7E75] focus:outline-none focus:border-[#141414] dark:focus:border-[#E5C6C3]"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-[#8A7E75] hover:text-[#141414] dark:hover:text-white cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggleVoiceSearch}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isListening
                        ? 'bg-[#9B2C2C] text-white'
                        : 'text-[#7D6E65] hover:bg-[#EFE8E0] dark:hover:bg-[#282420]'
                    }`}
                    title="Voice Quick Search"
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAiSearching}
                    className="p-1.5 rounded-lg text-[#7D6E65] hover:bg-[#EFE8E0] dark:hover:bg-[#282420] cursor-pointer"
                    title="Visual Item Lookup"
                  >
                    {isAiSearching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageLookup}
                  />
                </div>
              </div>

              {/* Hardware Barcode Input (F4) */}
              <form onSubmit={handleBarcodeSubmit} className="relative sm:w-52 shrink-0">
                <Barcode className="w-4 h-4 text-[#8A7E75] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan SKU / Barcode (F4)"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF7F4] dark:bg-[#121110] border border-[#E8E0D8] dark:border-[#2E2A26] text-xs font-mono-numbers text-[#141414] dark:text-[#F6F1EB] placeholder:text-[#8A7E75] focus:outline-none focus:border-[#141414] dark:focus:border-[#E5C6C3]"
                />
              </form>

              {/* Filter Drawer Toggle & + Add Piece */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFilters((p) => !p)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showFilters || activeFilterCount > 0
                      ? 'bg-[#F3E1DF] dark:bg-[#3A2827] border-[#E5C6C3] dark:border-[#5C3A38] text-[#141414] dark:text-[#F6F1EB]'
                      : 'bg-white dark:bg-[#1F1C19] border-[#E8E0D8] dark:border-[#2E2A26] text-[#4A433E] dark:text-[#E8E0D8] hover:bg-[#FAF7F4]'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenCustomItem}
                  className="px-3.5 py-2.5 rounded-xl bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] dark:hover:bg-[#E8E0D8] text-white dark:text-[#141414] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Add Piece</span>
                </button>
              </div>
            </div>

            {/* Expandable Brand / Size / Color / Price Filter Strip */}
            {showFilters && (
              <div className="pt-3 border-t border-[#EFE8E0] dark:border-[#2A2622] grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB]"
                >
                  <option value="All">All Brands</option>
                  {brandOptions
                    .filter((b) => b !== 'All')
                    .map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                </select>

                <select
                  value={selectedSizeFilter}
                  onChange={(e) => setSelectedSizeFilter(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB]"
                >
                  <option value="All">All Sizes</option>
                  {sizeOptions
                    .filter((s) => s !== 'All')
                    .map((s) => (
                      <option key={s} value={s}>
                        Size: {s}
                      </option>
                    ))}
                </select>

                <select
                  value={selectedColorFilter}
                  onChange={(e) => setSelectedColorFilter(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB]"
                >
                  <option value="All">All Colors</option>
                  {colorOptions
                    .filter((c) => c !== 'All')
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>

                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value as any)}
                  className="px-2.5 py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB]"
                >
                  <option value="all">All Prices</option>
                  <option value="under_10k">Under {storeProfile.currency} 10,000</option>
                  <option value="10k_20k">
                    {storeProfile.currency} 10,000 – 20,000
                  </option>
                  <option value="over_20k">Over {storeProfile.currency} 20,000</option>
                </select>

                <div className="flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#4A433E] dark:text-[#C9BFB6] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lowStockOnly}
                      onChange={(e) => setLowStockOnly(e.target.checked)}
                      className="rounded border-[#D8CEC4]"
                    />
                    <span>Low stock</span>
                  </label>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="text-[11px] font-semibold text-[#9B2C2C] dark:text-[#FCA5A5] hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 10 Fashion Category Visual Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] border-[#141414] dark:border-[#F6F1EB]'
                  : 'bg-white dark:bg-[#1A1816] text-[#4A433E] dark:text-[#C9BFB6] border-[#E8E0D8] dark:border-[#2E2A26] hover:bg-[#F6F1EB] dark:hover:bg-[#24201C]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>All Collection</span>
              <span className="font-mono-numbers text-[10px] opacity-75">
                {filteredProducts.length}
              </span>
            </button>

            {dynamicCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = filteredProducts.filter((p) => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] border-[#141414] dark:border-[#F6F1EB]'
                      : 'bg-white dark:bg-[#1A1816] text-[#4A433E] dark:text-[#C9BFB6] border-[#E8E0D8] dark:border-[#2E2A26] hover:bg-[#F6F1EB] dark:hover:bg-[#24201C]'
                  }`}
                >
                  {cat.image && (
                    <img
                      src={cat.image}
                      alt={cat.label}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-lg object-cover shrink-0 border border-black/10"
                    />
                  )}
                  <span className="whitespace-nowrap">{cat.label}</span>
                  <span className="font-mono-numbers text-[10px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Results Summary Line */}
          <div className="flex items-center justify-between px-0.5 text-xs text-[#7D6E65] dark:text-[#A89E96]">
            <div>
              Showing{' '}
              <span className="font-mono-numbers font-semibold text-[#141414] dark:text-[#F6F1EB]">
                {displayedProducts.length}
              </span>{' '}
              piece{displayedProducts.length === 1 ? '' : 's'}
              {selectedCategory !== 'All' && (
                <span>
                  {' '}
                  in <strong className="text-[#141414] dark:text-[#F6F1EB]">{selectedCategory}</strong>
                </span>
              )}
            </div>
            {(selectedCategory !== 'All' || activeFilterCount > 0 || searchQuery) && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[11px] font-semibold text-[#141414] dark:text-[#E5C6C3] hover:underline cursor-pointer"
              >
                Show All Pieces
              </button>
            )}
          </div>

          {/* LUXURY PRODUCT GRID (3–4 cols on desktop, 2 cols on tablet) */}
          {displayedProducts.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] p-12 text-center space-y-3">
              <ShoppingBag className="w-8 h-8 mx-auto text-[#B5A99F]" />
              <div className="font-editorial text-lg font-semibold text-[#141414] dark:text-[#F6F1EB]">
                No pieces match your current filter
              </div>
              <p className="text-xs text-[#7D6E65] dark:text-[#A89E96]">
                Adjust your search or add a new item directly to your boutique catalog.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-4 py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] text-xs font-semibold cursor-pointer"
                >
                  Clear Filters
                </button>
                <button
                  type="button"
                  onClick={onOpenCustomItem}
                  className="px-4 py-2 rounded-xl bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] text-xs font-semibold cursor-pointer"
                >
                  + Add New Piece
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedProducts.map((product) => {
                const sel = cardVariantSelections[product.id] || {};
                const availableColors = product.colorVariants || [];
                const availableSizes = product.options?.sizes || (product.size ? [product.size] : []);
                const activeColor =
                  sel.color ||
                  availableColors.find((c) => c.inStock !== false && c.stock > 0)?.color ||
                  product.color ||
                  '';
                const activeSize = sel.size || product.size || availableSizes[0] || '';
                const isOutOfStock = product.stockQuantity <= 0;
                const isLowStock = !isOutOfStock && product.stockQuantity <= product.minStockAlert;
                const brandName = product.verticalAttributes?.brand || product.category;

                return (
                  <div
                    key={product.id}
                    className="group rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] hover:border-[#141414]/35 dark:hover:border-[#E5C6C3]/40 overflow-hidden transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Studio Photography Frame (4:3) */}
                      <div
                        onClick={() => openVariantModal(product)}
                        className="relative aspect-[4/3] bg-[#F6F1EB] dark:bg-[#221F1C] overflow-hidden cursor-pointer"
                      >
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[#A89E96] gap-1">
                            <ShoppingBag className="w-7 h-7 opacity-50" />
                            <span className="text-[10px] uppercase tracking-widest">
                              {product.category}
                            </span>
                          </div>
                        )}

                        {/* Subtle Stock Corner Cue (Only when low/out) */}
                        {isOutOfStock ? (
                          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#141414]/90 text-white text-[10px] font-semibold">
                            Out of Stock
                          </div>
                        ) : isLowStock ? (
                          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#F3E1DF]/95 text-[#8A2626] text-[10px] font-semibold border border-[#E5C6C3]">
                            Only {product.stockQuantity} left
                          </div>
                        ) : null}
                      </div>

                      {/* Quiet Editorial Card Body (Zero-Pill Metadata) */}
                      <div className="p-3.5 space-y-2.5">
                        <div className="space-y-0.5">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A7E75] dark:text-[#A89E96] truncate">
                            {brandName} · <span className="font-mono-numbers">{product.barcode}</span>
                          </div>
                          <h3
                            onClick={() => openVariantModal(product)}
                            className="text-[13px] font-semibold text-[#141414] dark:text-[#F6F1EB] leading-snug line-clamp-2 cursor-pointer hover:underline"
                          >
                            {product.name}
                          </h3>
                        </div>

                        {/* Price & Stock Line */}
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="font-mono-numbers text-base font-bold text-[#141414] dark:text-[#F6F1EB]">
                            {storeProfile.currency} {product.retailPrice.toLocaleString()}
                          </div>
                          <div
                            className={`text-[11px] font-mono-numbers ${
                              isOutOfStock
                                ? 'text-[#9B2C2C] dark:text-[#FCA5A5] font-semibold'
                                : isLowStock
                                ? 'text-[#9A6B2F] dark:text-[#F1D29B] font-semibold'
                                : 'text-[#7D6E65] dark:text-[#A89E96]'
                            }`}
                          >
                            {product.stockQuantity} {product.unit}
                          </div>
                        </div>

                        {/* Interactive Color Swatches (with Out-of-Stock Strike Highlight) */}
                        {availableColors.length > 0 && (
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {availableColors.slice(0, 5).map((cv) => {
                                const isSoldOut = cv.inStock === false || cv.stock <= 0;
                                const isChosen = activeColor === cv.color;
                                return (
                                  <button
                                    key={cv.color}
                                    type="button"
                                    disabled={isSoldOut}
                                    title={isSoldOut ? `${cv.color} (Out of stock)` : `${cv.color} (${cv.stock} left)`}
                                    onClick={() =>
                                      setCardVariantSelections((prev) => ({
                                        ...prev,
                                        [product.id]: { ...prev[product.id], color: cv.color },
                                      }))
                                    }
                                    className={`relative w-4 h-4 rounded-full border transition-transform ${
                                      isChosen
                                        ? 'ring-2 ring-offset-1 ring-[#141414] dark:ring-[#F6F1EB] scale-110'
                                        : 'border-black/20 dark:border-white/25'
                                    } ${isSoldOut ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                                    style={{ backgroundColor: cv.hex || '#C9B8A8' }}
                                  >
                                    {isSoldOut && (
                                      <span className="absolute inset-0 flex items-center justify-center">
                                        <span className="w-4 h-[1.5px] bg-[#9B2C2C] rotate-45 block" />
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            <span className="text-[10px] text-[#7D6E65] dark:text-[#A89E96] truncate max-w-[95px]">
                              {activeColor}
                            </span>
                          </div>
                        )}

                        {/* Interactive Size Selector Chips */}
                        {availableSizes.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {availableSizes.slice(0, 5).map((sz) => {
                              const isChosen = activeSize === sz;
                              return (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() =>
                                    setCardVariantSelections((prev) => ({
                                      ...prev,
                                      [product.id]: { ...prev[product.id], size: sz },
                                    }))
                                  }
                                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                                    isChosen
                                      ? 'bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] border-[#141414] dark:border-[#F6F1EB]'
                                      : 'bg-[#FAF7F4] dark:bg-[#221F1C] text-[#4A433E] dark:text-[#C9BFB6] border-[#E8E0D8] dark:border-[#2E2A26] hover:border-[#141414]/40'
                                  }`}
                                >
                                  {sz}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart Footer */}
                    <div className="px-3.5 pb-3.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleQuickAddCard(product)}
                        className={`w-full py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isOutOfStock
                            ? 'bg-[#F6F1EB] dark:bg-[#24201C] text-[#7D6E65] border border-[#E8E0D8] dark:border-[#2E2A26] hover:bg-[#EFE8E0]'
                            : 'bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] dark:hover:bg-[#E8E0D8] text-white dark:text-[#141414]'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isOutOfStock ? 'Add for Quote' : 'Add to Cart'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: STICKY SHOPPING CART & CHECKOUT PANEL (~32%) ================= */}
        <aside className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-[4.5rem]">
          <div className="bg-white dark:bg-[#1A1816] rounded-2xl border border-[#E8E0D8] dark:border-[#2E2A26] shadow-sm flex flex-col overflow-hidden lg:max-h-[calc(100vh-5.5rem)]">
            {/* Cart Header */}
            <div className="px-4 py-3.5 border-b border-[#EFE8E0] dark:border-[#2A2622] flex items-center justify-between gap-2 bg-[#FAF7F4] dark:bg-[#161412]">
              <div>
                <h2 className="font-editorial text-base font-semibold text-[#141414] dark:text-[#F6F1EB] flex items-center gap-2">
                  <span>Shopping Bag</span>
                  <span className="font-mono-numbers text-xs font-semibold text-[#7D6E65] dark:text-[#A89E96]">
                    ({totalCartUnits})
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-1.5 relative">
                {/* Held Orders Popover Trigger */}
                <button
                  type="button"
                  onClick={() => setHeldOrdersOpen((p) => !p)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                    heldOrders.length > 0
                      ? 'bg-[#F3E1DF] dark:bg-[#3A2827] border-[#E5C6C3] dark:border-[#5C3A38] text-[#141414] dark:text-[#F6F1EB]'
                      : 'bg-white dark:bg-[#1F1C19] border-[#E8E0D8] dark:border-[#2E2A26] text-[#6B625C] dark:text-[#A89E96]'
                  }`}
                  title="View held orders"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Held ({heldOrders.length})</span>
                </button>

                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearCart();
                      setManualDiscount(0);
                      setRedeemPointsActive(false);
                      setCouponInput('');
                    }}
                    className="p-1.5 rounded-lg text-[#8A7E75] hover:text-[#9B2C2C] hover:bg-[#F3E1DF]/50 transition-colors cursor-pointer"
                    title="Clear Cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Held Orders Popover */}
                {heldOrdersOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] shadow-xl p-3 z-40 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-[#EFE8E0] dark:border-[#2A2622]">
                      <span className="text-xs font-semibold text-[#141414] dark:text-[#F6F1EB]">
                        Held Orders ({heldOrders.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setHeldOrdersOpen(false)}
                        className="text-[#8A7E75] hover:text-[#141414] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {heldOrders.length === 0 ? (
                      <div className="text-[11px] text-[#7D6E65] py-4 text-center">
                        No orders currently on hold.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {heldOrders.map((h) => (
                          <div
                            key={h.id}
                            className="p-2.5 rounded-xl bg-[#FAF7F4] dark:bg-[#221F1C] border border-[#E8E0D8] dark:border-[#2E2A26] space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-[#141414] dark:text-[#F6F1EB] truncate">
                                {h.customerName}
                              </span>
                              <span className="font-mono-numbers font-bold">
                                {storeProfile.currency} {h.subtotal.toLocaleString()}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#7D6E65]">
                              {h.items.length} item(s) · {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  resumeHeldOrder(h.id);
                                  setHeldOrdersOpen(false);
                                  showToast(`Resumed order for ${h.customerName}`, 'success');
                                }}
                                className="flex-1 py-1 rounded-lg bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <PlayCircle className="w-3 h-3" />
                                <span>Resume</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteHeldOrder(h.id)}
                                className="p-1 rounded-lg text-[#9B2C2C] hover:bg-[#F3E1DF] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Selection & Loyalty Points Bar */}
            <div className="px-4 py-2.5 border-b border-[#EFE8E0] dark:border-[#2A2622] space-y-2 relative">
              <button
                type="button"
                onClick={() => setCustomerDropdownOpen((p) => !p)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#FAF7F4] dark:bg-[#121110] border border-[#E8E0D8] dark:border-[#2E2A26] hover:border-[#141414]/40 text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <User className="w-3.5 h-3.5 text-[#7D6E65] shrink-0" />
                  <span className="font-semibold text-[#141414] dark:text-[#F6F1EB] truncate">
                    {selectedPosCustomer ? selectedPosCustomer.name : 'Walk-in Guest (Select Client)'}
                  </span>
                </div>
                {selectedPosCustomer ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono-numbers font-semibold text-[#7A4A47] dark:text-[#F3E1DF] shrink-0">
                    <Award className="w-3 h-3" />
                    {activeCustomerPoints} pts
                  </span>
                ) : (
                  <span className="text-[10px] text-[#8A7E75]">Loyalty</span>
                )}
              </button>

              {selectedPosCustomer && activeCustomerPoints > 0 && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#F3E1DF]/55 dark:bg-[#342322] text-[11px]">
                  <span className="text-[#4A433E] dark:text-[#E8E0D8] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#141414] dark:text-[#F3E1DF]" />
                    <span>
                      Redeem <strong className="font-mono-numbers">{activeCustomerPoints}</strong> pts (-
                      {storeProfile.currency} {activeCustomerPoints})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setRedeemPointsActive((p) => !p)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer transition-colors ${
                      redeemPointsActive
                        ? 'bg-[#141414] text-white dark:bg-[#F6F1EB] dark:text-[#141414]'
                        : 'bg-white dark:bg-[#1A1816] text-[#141414] dark:text-[#F6F1EB] border border-[#E5C6C3]'
                    }`}
                  >
                    {redeemPointsActive ? 'Applied' : 'Redeem'}
                  </button>
                </div>
              )}

              {customerDropdownOpen && (
                <div className="absolute left-4 right-4 top-12 rounded-xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] shadow-xl p-1.5 z-40 max-h-56 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPosCustomer(null);
                      setRedeemPointsActive(false);
                      setCustomerDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#FAF7F4] dark:hover:bg-[#24201C] text-xs font-medium text-[#6B625C] dark:text-[#A89E96] cursor-pointer"
                  >
                    Walk-in Guest (No Loyalty Account)
                  </button>
                  {customerDirectory.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedPosCustomer(c);
                        setCustomerDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F6F1EB] dark:hover:bg-[#24201C] text-xs flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[#141414] dark:text-[#F6F1EB] truncate">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-[#7D6E65] font-mono-numbers">{c.phone}</div>
                      </div>
                      <span className="text-[10px] font-mono-numbers font-semibold text-[#7A4A47] dark:text-[#F3E1DF] shrink-0">
                        {c.points} pts
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Line Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#EFE8E0] dark:divide-[#2A2622] min-h-[180px] max-h-[340px] lg:max-h-none">
              {cart.length === 0 ? (
                <div className="py-12 px-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF7F4] dark:bg-[#221F1C] border border-[#E8E0D8] dark:border-[#2E2A26] mx-auto flex items-center justify-center text-[#B5A99F]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="font-editorial text-sm font-semibold text-[#141414] dark:text-[#F6F1EB]">
                    Your shopping bag is empty
                  </div>
                  <p className="text-[11px] text-[#7D6E65] dark:text-[#A89E96]">
                    Tap any fashion piece on the left or scan a barcode to start a sale.
                  </p>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const sizes = item.product.options?.sizes || (item.product.size ? [item.product.size] : []);
                  const colors =
                    item.product.colorVariants?.filter((c) => c.inStock !== false).map((c) => c.color) ||
                    item.product.options?.colors ||
                    (item.product.color ? [item.product.color] : []);

                  return (
                    <div key={`${item.product.id}-${idx}`} className="p-3.5 flex gap-3 items-start">
                      {/* Thumbnail */}
                      <div className="w-13 h-13 rounded-xl bg-[#F6F1EB] dark:bg-[#221F1C] border border-[#E8E0D8] dark:border-[#2E2A26] overflow-hidden shrink-0">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#A89E96]">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Item Info & Inline Variant Pickers */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-semibold text-[#141414] dark:text-[#F6F1EB] leading-snug line-clamp-2">
                            {item.product.name}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCartItemAt(idx)}
                            className="text-[#A89E96] hover:text-[#9B2C2C] shrink-0 cursor-pointer"
                            title="Remove item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Inline Size & Color Selectors */}
                        {(sizes.length > 0 || colors.length > 0) && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {sizes.length > 0 && (
                              <select
                                value={item.selectedSize || sizes[0]}
                                onChange={(e) => updateCartItemAt(idx, { selectedSize: e.target.value })}
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110] text-[#4A433E] dark:text-[#E8E0D8]"
                              >
                                {sizes.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            )}
                            {colors.length > 0 && (
                              <select
                                value={item.selectedColor || colors[0]}
                                onChange={(e) => updateCartItemAt(idx, { selectedColor: e.target.value })}
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110] text-[#4A433E] dark:text-[#E8E0D8] max-w-[110px]"
                              >
                                {colors.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}

                        {/* Unit Price + Qty Stepper + Line Total */}
                        <div className="flex items-center justify-between pt-0.5">
                          <div className="inline-flex items-center rounded-lg border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110]">
                            <button
                              type="button"
                              onClick={() => updateCartItemAt(idx, { quantity: item.quantity - 1 })}
                              className="px-2 py-1 text-[#4A433E] dark:text-[#E8E0D8] hover:bg-[#EFE8E0] dark:hover:bg-[#24201C] rounded-l-lg cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartItemAt(idx, { quantity: item.quantity + 1 })}
                              className="px-2 py-1 text-[#4A433E] dark:text-[#E8E0D8] hover:bg-[#EFE8E0] dark:hover:bg-[#24201C] rounded-r-lg cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]">
                              {storeProfile.currency} {(item.quantity * item.unitPrice).toLocaleString()}
                            </div>
                            <div className="text-[10px] font-mono-numbers text-[#8A7E75]">
                              {storeProfile.currency} {item.unitPrice.toLocaleString()} each
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Coupon, Discount, Tax & Totals Footer */}
            <div className="border-t border-[#EFE8E0] dark:border-[#2A2622] p-4 space-y-3 bg-[#FAF7F4]/70 dark:bg-[#161412]">
              {/* Apply Coupon Bar */}
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#8A7E75] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Coupon code (e.g. BOUTIQUE10)"
                      className="w-full pl-8 pr-2 py-1.5 rounded-xl bg-white dark:bg-[#121110] border border-[#E8E0D8] dark:border-[#2E2A26] text-xs font-mono-numbers uppercase text-[#141414] dark:text-[#F6F1EB] focus:outline-none focus:border-[#141414]"
                    />
                  </div>
                  {appliedCouponCode ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCouponCode(null);
                        setCouponInput('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#F3E1DF] dark:bg-[#3A2322] text-[#8A2626] dark:text-[#FCA5A5] text-xs font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      className="px-3 py-1.5 rounded-xl bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] text-xs font-semibold cursor-pointer"
                    >
                      Apply
                    </button>
                  )}
                </div>

                {/* Quick Discount / Tax Toggle */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {coupons
                      .filter((c) => c.active)
                      .slice(0, 2)
                      .map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleApplyCoupon(c.code)}
                          className="text-[10px] font-mono-numbers font-semibold text-[#7D6E65] hover:text-[#141414] dark:hover:text-[#F6F1EB] underline decoration-dotted cursor-pointer"
                        >
                          {c.code}
                        </button>
                      ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualAdjustments((p) => !p)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6B625C] dark:text-[#A89E96] hover:text-[#141414] dark:hover:text-[#F6F1EB] cursor-pointer"
                  >
                    <Percent className="w-3 h-3" />
                    <span>{showManualAdjustments ? 'Hide Tax/Disc' : 'Discount & Tax'}</span>
                  </button>
                </div>

                {showManualAdjustments && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#7D6E65] mb-0.5">
                        Manual Disc ({storeProfile.currency})
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={manualDiscount || ''}
                        onChange={(e) => setManualDiscount(Math.max(0, Number(e.target.value)))}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121110] border border-[#E8E0D8] dark:border-[#2E2A26] text-xs font-mono-numbers"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#7D6E65] mb-0.5">
                        Tax Rate (%)
                      </label>
                      <select
                        value={cartTaxRate}
                        onChange={(e) => setCartTaxRate(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121110] border border-[#E8E0D8] dark:border-[#2E2A26] text-xs font-mono-numbers"
                      >
                        <option value={0}>0% (Tax Free)</option>
                        <option value={5}>5% Boutique GST</option>
                        <option value={12}>12% Standard</option>
                        <option value={18}>18% Luxury VAT</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="space-y-1.5 text-xs pt-2 border-t border-[#E8E0D8] dark:border-[#2A2622]">
                <div className="flex justify-between text-[#6B625C] dark:text-[#A89E96]">
                  <span>Subtotal</span>
                  <span className="font-mono-numbers font-semibold text-[#141414] dark:text-[#F6F1EB]">
                    {storeProfile.currency} {cartSubtotal.toLocaleString()}
                  </span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-[#2F6B4F] dark:text-[#6EE7B7]">
                    <span>
                      Discount{appliedCouponCode ? ` (${appliedCouponCode})` : ''}
                      {redeemPointsActive ? ' + Loyalty' : ''}
                    </span>
                    <span className="font-mono-numbers font-semibold">
                      − {storeProfile.currency} {cartDiscount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B625C] dark:text-[#A89E96]">
                  <span>Tax ({cartTaxRate}%)</span>
                  <span className="font-mono-numbers font-semibold text-[#141414] dark:text-[#F6F1EB]">
                    {storeProfile.currency} {cartTaxAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-[#E8E0D8] dark:border-[#2A2622]">
                  <span className="font-editorial text-base font-semibold text-[#141414] dark:text-[#F6F1EB]">
                    Grand Total
                  </span>
                  <span className="font-mono-numbers text-xl font-bold text-[#141414] dark:text-[#F6F1EB]">
                    {storeProfile.currency} {cartGrandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Zero-stock warning if applicable */}
              {hasZeroStockInCart && (
                <div className="p-2.5 rounded-xl bg-[#F3E1DF] dark:bg-[#3A2322] border border-[#E5C6C3] dark:border-[#633634] text-[11px] text-[#8A2626] dark:text-[#FCA5A5] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Cart contains an out-of-stock piece. Save as an Order Quote instead of direct billing.</span>
                </div>
              )}

              {/* Action Buttons: Hold Order, Clear/Quote, Checkout / Pay Now */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleHoldOrder}
                  className="py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#1F1C19] hover:bg-[#F6F1EB] dark:hover:bg-[#282420] text-[#141414] dark:text-[#F6F1EB] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Hold Order</span>
                </button>
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleSaveAsOrderQuote}
                  className="py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#F6F1EB] dark:bg-[#24201C] hover:bg-[#EFE8E0] text-[#141414] dark:text-[#F6F1EB] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Save Quote</span>
                </button>
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || hasZeroStockInCart}
                onClick={onOpenCheckout}
                className="w-full py-3 rounded-xl bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] dark:hover:bg-[#E8E0D8] text-white dark:text-[#141414] text-xs font-semibold tracking-wide inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <span>Checkout · Pay Now (F2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* QUICK VARIANT DETAIL MODAL */}
      {variantModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A1816] rounded-2xl max-w-md w-full border border-[#E8E0D8] dark:border-[#2E2A26] shadow-2xl overflow-hidden">
            <div className="relative aspect-[16/10] bg-[#F6F1EB] dark:bg-[#221F1C]">
              {variantModalProduct.image && (
                <img
                  src={variantModalProduct.image}
                  alt={variantModalProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => setVariantModalProduct(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 dark:bg-[#141414]/90 text-[#141414] dark:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7D6E65]">
                  {variantModalProduct.verticalAttributes?.brand || variantModalProduct.category} ·{' '}
                  <span className="font-mono-numbers">{variantModalProduct.barcode}</span>
                </div>
                <h3 className="font-editorial text-lg font-semibold text-[#141414] dark:text-[#F6F1EB] mt-0.5">
                  {variantModalProduct.name}
                </h3>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-mono-numbers text-xl font-bold text-[#141414] dark:text-[#F6F1EB]">
                    {storeProfile.currency} {variantModalProduct.retailPrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#6B625C] dark:text-[#A89E96] font-mono-numbers">
                    {variantModalProduct.stockQuantity} {variantModalProduct.unit} available
                  </span>
                </div>
              </div>

              {variantModalProduct.colorVariants && variantModalProduct.colorVariants.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[#141414] dark:text-[#F6F1EB]">
                    Colorway: <span className="font-normal text-[#6B625C] dark:text-[#A89E96]">{modalColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {variantModalProduct.colorVariants.map((cv) => {
                      const out = cv.inStock === false || cv.stock <= 0;
                      const chosen = modalColor === cv.color;
                      return (
                        <button
                          key={cv.color}
                          type="button"
                          disabled={out}
                          onClick={() => setModalColor(cv.color)}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                            out
                              ? 'bg-[#F3E1DF]/50 text-[#9B2C2C] border-[#E5C6C3] line-through opacity-60 cursor-not-allowed'
                              : chosen
                              ? 'bg-[#141414] text-white border-[#141414] dark:bg-[#F6F1EB] dark:text-[#141414]'
                              : 'bg-[#FAF7F4] dark:bg-[#221F1C] text-[#141414] dark:text-[#F6F1EB] border-[#E8E0D8] dark:border-[#2E2A26] cursor-pointer'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/15"
                            style={{ backgroundColor: cv.hex || '#C9B8A8' }}
                          />
                          <span>{cv.color}</span>
                          {chosen && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(variantModalProduct.options?.sizes?.length || 0) > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[#141414] dark:text-[#F6F1EB]">Size</div>
                  <div className="flex flex-wrap gap-1.5">
                    {variantModalProduct.options!.sizes!.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setModalSize(sz)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                          modalSize === sz
                            ? 'bg-[#141414] text-white border-[#141414] dark:bg-[#F6F1EB] dark:text-[#141414]'
                            : 'bg-[#FAF7F4] dark:bg-[#221F1C] text-[#4A433E] dark:text-[#C9BFB6] border-[#E8E0D8] dark:border-[#2E2A26]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  addToCart(variantModalProduct, 1, {
                    selectedColor: modalColor,
                    selectedSize: modalSize,
                  });
                  setCardVariantSelections((prev) => ({
                    ...prev,
                    [variantModalProduct.id]: { color: modalColor, size: modalSize },
                  }));
                  showToast(`Added ${variantModalProduct.name} to bag.`, 'success');
                  setVariantModalProduct(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] dark:text-[#141414] text-white text-xs font-semibold cursor-pointer"
              >
                Add to Shopping Bag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
