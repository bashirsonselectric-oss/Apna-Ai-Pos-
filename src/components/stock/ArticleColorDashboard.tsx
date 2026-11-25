import React, { useMemo, useState } from 'react';
import { usePos } from '../../context/PosContext';
import { Product } from '../../types';
import {
  Search,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Package,
  History,
  Palette,
  Ban,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ArticleColorDashboardProps {
  lowColorThreshold?: number;
}

export const ArticleColorDashboard: React.FC<ArticleColorDashboardProps> = ({
  lowColorThreshold = 2,
}) => {
  const {
    filteredProducts,
    sales,
    colorStockHistory,
    restockProductColor,
    cancelSale,
    storeProfile,
  } = usePos();

  const [sectionView, setSectionView] = useState<'articles' | 'history' | 'sales'>('articles');
  const [search, setSearch] = useState('');
  const [colorFilter, setColorFilter] = useState<'all' | 'has_out' | 'has_low' | 'in_stock'>('all');
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({});
  const [restockInputs, setRestockInputs] = useState<Record<string, string>>({});
  const [newColorForm, setNewColorForm] = useState<
    Record<string, { open: boolean; color: string; hex: string; qty: string }>
  >({});
  const [confirmCancelSaleId, setConfirmCancelSaleId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, tone: 'success' | 'error' = 'success') => {
    setFeedback({ text, tone });
    setTimeout(() => {
      setFeedback((curr) => (curr?.text === text ? null : curr));
    }, 3500);
  };

  // Compute sold quantities by productId and (productId::color) from non-cancelled sales
  const soldStats = useMemo(() => {
    let totalSoldUnits = 0;
    const byProduct = new Map<string, number>();
    const byProductColor = new Map<string, number>();

    sales.forEach((sale) => {
      if (sale.status === 'cancelled') return;
      sale.items.forEach((item) => {
        const qty = Math.max(0, Number(item.quantity) || 0);
        totalSoldUnits += qty;
        byProduct.set(item.productId, (byProduct.get(item.productId) || 0) + qty);
        if (item.color) {
          const key = `${item.productId}::${item.color.trim().toLowerCase()}`;
          byProductColor.set(key, (byProductColor.get(key) || 0) + qty);
        }
      });
    });

    return { totalSoldUnits, byProduct, byProductColor };
  }, [sales]);

  // Compute all 7 Inventory Dashboard KPIs
  const kpis = useMemo(() => {
    let totalSuitsInStock = 0;
    let availableColors = 0;
    let outOfStockColors = 0;
    let lowStockColors = 0;

    filteredProducts.forEach((p) => {
      if (p.colorVariants && p.colorVariants.length > 0) {
        p.colorVariants.forEach((cv) => {
          const qty = cv.inStock === false ? 0 : Math.max(0, Number(cv.stock) || 0);
          totalSuitsInStock += qty;
          if (qty <= 0) {
            outOfStockColors += 1;
          } else {
            availableColors += 1;
            if (qty <= lowColorThreshold) {
              lowStockColors += 1;
            }
          }
        });
      } else {
        const qty = Math.max(0, Number(p.stockQuantity) || 0);
        totalSuitsInStock += qty;
        if (qty <= 0) {
          outOfStockColors += 1;
        } else {
          availableColors += 1;
          if (qty <= lowColorThreshold) {
            lowStockColors += 1;
          }
        }
      }
    });

    const totalSoldSuits = soldStats.totalSoldUnits;
    const totalHandled = totalSuitsInStock + totalSoldSuits;
    const remainingPct =
      totalHandled > 0 ? Math.round((totalSuitsInStock / totalHandled) * 100) : 100;

    return {
      totalArticles: filteredProducts.length,
      totalSuitsInStock,
      availableColors,
      outOfStockColors,
      lowStockColors,
      totalSoldSuits,
      remainingStock: totalSuitsInStock,
      remainingPct,
    };
  }, [filteredProducts, soldStats, lowColorThreshold]);

  // Filtered articles for Admin Color Matrix
  const displayedArticles = useMemo(() => {
    const q = search.toLowerCase().trim();
    return filteredProducts.filter((p) => {
      const articleNo = p.articleNumber || p.verticalAttributes?.articleNumber || p.barcode;
      const colorNames = (p.colorVariants || []).map((c) => c.color).join(' ');
      const matchesSearch =
        !q ||
        articleNo.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        colorNames.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      const variants = p.colorVariants || [];
      const hasOut =
        variants.length > 0
          ? variants.some((cv) => cv.inStock === false || cv.stock <= 0)
          : p.stockQuantity <= 0;
      const hasLow =
        variants.length > 0
          ? variants.some((cv) => cv.inStock !== false && cv.stock > 0 && cv.stock <= lowColorThreshold)
          : p.stockQuantity > 0 && p.stockQuantity <= lowColorThreshold;

      if (colorFilter === 'has_out') return hasOut;
      if (colorFilter === 'has_low') return hasLow;
      if (colorFilter === 'in_stock') return !hasOut && p.stockQuantity > 0;
      return true;
    });
  }, [filteredProducts, search, colorFilter, lowColorThreshold]);

  const handleQuickRestock = (product: Product, colorName: string, qty: number, hex?: string) => {
    const res = restockProductColor(product.id, colorName, qty, hex);
    if (!res.ok) {
      showFeedback(res.error || 'Could not add stock.', 'error');
      return;
    }
    const label = product.articleNumber || product.name;
    showFeedback(
      `Added +${qty} ${product.unit} to ${label} (${colorName}). Color is now active in POS.`,
      'success'
    );
  };

  const handleAddNewColor = (product: Product) => {
    const form = newColorForm[product.id];
    if (!form) return;
    const qty = Math.floor(Number(form.qty) || 0);
    const res = restockProductColor(
      product.id,
      form.color,
      qty,
      form.hex || '#64748B',
      'Added new color to existing article'
    );
    if (!res.ok) {
      showFeedback(res.error || 'Enter a valid color name and quantity.', 'error');
      return;
    }
    setNewColorForm((prev) => ({
      ...prev,
      [product.id]: { open: false, color: '', hex: '#2563EB', qty: '2' },
    }));
    showFeedback(
      `Added color "${form.color}" (+${qty} ${product.unit}) to ${product.articleNumber || product.name}.`,
      'success'
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedArticles((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  return (
    <div className="space-y-6">
      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
            feedback.tone === 'error'
              ? 'bg-[#F3E1DF] dark:bg-[#3A2322] border-[#E5C6C3] dark:border-[#5C3A38] text-[#8A2626] dark:text-[#FCA5A5]'
              : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.tone === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 7 INVENTORY DASHBOARD KPIs (Tabular Numerals, Clean Editorial Surfaces) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white dark:bg-[#1A1816] p-4 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26]">
          <div className="text-[11px] font-medium text-[#7D6E65] dark:text-[#A89E96]">
            Total Articles
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-[#141414] dark:text-[#F6F1EB] mt-1">
            {kpis.totalArticles}
          </div>
          <div className="text-[10px] text-[#8A7E75] mt-0.5">Active catalog</div>
        </div>

        <div className="bg-white dark:bg-[#1A1816] p-4 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26]">
          <div className="text-[11px] font-medium text-[#7D6E65] dark:text-[#A89E96]">
            Total Suits in Stock
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-[#141414] dark:text-[#F6F1EB] mt-1">
            {kpis.totalSuitsInStock}
          </div>
          <div className="text-[10px] text-[#8A7E75] mt-0.5">Across all colors</div>
        </div>

        <div className="bg-white dark:bg-[#1A1816] p-4 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26]">
          <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            Available Colors
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-emerald-700 dark:text-emerald-400 mt-1">
            {kpis.availableColors}
          </div>
          <div className="text-[10px] text-[#8A7E75] mt-0.5">Visible in POS</div>
        </div>

        <div className="bg-white dark:bg-[#1A1816] p-4 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26]">
          <div className="text-[11px] font-medium text-rose-700 dark:text-rose-400">
            Out-of-Stock Colors
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-rose-600 dark:text-rose-400 mt-1">
            {kpis.outOfStockColors}
          </div>
          <div className="text-[10px] text-[#8A7E75] mt-0.5">Auto-hidden in POS</div>
        </div>

        <div className="bg-white dark:bg-[#1A1816] p-4 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26]">
          <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
            Low Stock Colors
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-amber-600 dark:text-amber-400 mt-1">
            {kpis.lowStockColors}
          </div>
          <div className="text-[10px] text-[#8A7E75] mt-0.5">1–{lowColorThreshold} units left</div>
        </div>

        <div className="bg-white dark:bg-[#1A1816] p-4 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26]">
          <div className="text-[11px] font-medium text-[#7D6E65] dark:text-[#A89E96]">
            Total Sold Suits
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-[#141414] dark:text-[#F6F1EB] mt-1">
            {kpis.totalSoldSuits}
          </div>
          <div className="text-[10px] text-[#8A7E75] mt-0.5">Completed sales</div>
        </div>

        <div className="bg-white dark:bg-[#1A1816] p-4 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26]">
          <div className="text-[11px] font-medium text-[#7D6E65] dark:text-[#A89E96]">
            Remaining Stock
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-[#141414] dark:text-[#F6F1EB] mt-1">
            {kpis.remainingStock}
          </div>
          <div className="text-[10px] text-[#8A7E75] font-mono-numbers mt-0.5">
            {kpis.remainingPct}% remaining
          </div>
        </div>
      </div>

      {/* Sub-navigation: Article Color Matrix | Stock Movement History | Completed Sales & Cancel/Restore */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F6F1EB] dark:bg-[#221F1C] border border-[#E8E0D8] dark:border-[#2E2A26] w-fit">
          <button
            type="button"
            onClick={() => setSectionView('articles')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
              sectionView === 'articles'
                ? 'bg-white dark:bg-[#141414] text-[#141414] dark:text-[#F6F1EB] shadow-2xs'
                : 'text-[#6B625C] dark:text-[#A89E96] hover:text-[#141414] dark:hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Article Color Stock ({filteredProducts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSectionView('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
              sectionView === 'history'
                ? 'bg-white dark:bg-[#141414] text-[#141414] dark:text-[#F6F1EB] shadow-2xs'
                : 'text-[#6B625C] dark:text-[#A89E96] hover:text-[#141414] dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stock History ({colorStockHistory.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSectionView('sales')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
              sectionView === 'sales'
                ? 'bg-white dark:bg-[#141414] text-[#141414] dark:text-[#F6F1EB] shadow-2xs'
                : 'text-[#6B625C] dark:text-[#A89E96] hover:text-[#141414] dark:hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sales & Cancel Restore ({sales.length})</span>
          </button>
        </div>

        {sectionView === 'articles' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#8A7E75] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Article #, product or color..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#1A1816] text-[#141414] dark:text-[#F6F1EB] focus:outline-none"
              />
            </div>

            {(['all', 'has_out', 'has_low', 'in_stock'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setColorFilter(f)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                  colorFilter === f
                    ? 'bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] border-[#141414] dark:border-[#F6F1EB]'
                    : 'bg-white dark:bg-[#1A1816] text-[#6B625C] dark:text-[#C9BFB6] border-[#E8E0D8] dark:border-[#2E2A26]'
                }`}
              >
                {f === 'all'
                  ? 'All Articles'
                  : f === 'has_out'
                  ? 'Out-of-Stock Colors'
                  : f === 'has_low'
                  ? 'Low Stock'
                  : 'All Available'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: ADMIN ARTICLE-WISE COLOR MATRIX (Shows ALL colors including 0-stock colors) */}
      {sectionView === 'articles' && (
        <div className="space-y-4">
          {displayedArticles.length === 0 ? (
            <div className="bg-white dark:bg-[#1A1816] rounded-2xl border border-[#E8E0D8] dark:border-[#2E2A26] p-12 text-center space-y-2">
              <Package className="w-8 h-8 mx-auto text-[#B5A99F]" />
              <div className="text-sm font-semibold text-[#141414] dark:text-[#F6F1EB]">
                No articles match this filter
              </div>
              <p className="text-xs text-[#7D6E65] dark:text-[#A89E96]">
                Adjust your search or add a new article with color-wise stock from Inventory.
              </p>
            </div>
          ) : (
            displayedArticles.map((product) => {
              const articleLabel =
                product.articleNumber ||
                product.verticalAttributes?.articleNumber ||
                product.barcode;
              const variants = product.colorVariants || [];
              const availCount = variants.filter((cv) => cv.inStock !== false && cv.stock > 0).length;
              const outCount = variants.filter((cv) => cv.inStock === false || cv.stock <= 0).length;
              const soldForArticle = soldStats.byProduct.get(product.id) || 0;
              const isExpanded = expandedArticles[product.id] ?? true;
              const addColorState = newColorForm[product.id] || {
                open: false,
                color: '',
                hex: '#2563EB',
                qty: '2',
              };

              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-[#1A1816] rounded-2xl border border-[#E8E0D8] dark:border-[#2E2A26] overflow-hidden"
                >
                  {/* Article Summary Header */}
                  <div className="px-5 py-3.5 bg-[#FAF7F4] dark:bg-[#161412] border-b border-[#EFE8E0] dark:border-[#2A2622] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover border border-[#E8E0D8] dark:border-[#2E2A26] shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[#F6F1EB] dark:bg-[#221F1C] flex items-center justify-center text-[#8A7E75] shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-2 text-xs">
                          <span className="font-bold text-[#141414] dark:text-[#F6F1EB]">
                            {articleLabel}
                          </span>
                          <span className="text-[#B5A99F]">·</span>
                          <span className="font-semibold text-[#4A433E] dark:text-[#E8E0D8] truncate">
                            {product.name}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-2 text-[11px] text-[#7D6E65] dark:text-[#A89E96] mt-0.5 font-mono-numbers">
                          <span>
                            {storeProfile.currency} {product.retailPrice.toLocaleString()} / {product.unit}
                          </span>
                          <span>·</span>
                          <span>
                            Stock:{' '}
                            <strong className="text-[#141414] dark:text-[#F6F1EB]">
                              {product.stockQuantity} {product.unit}
                            </strong>
                          </span>
                          <span>·</span>
                          <span>
                            Sold:{' '}
                            <strong className="text-[#141414] dark:text-[#F6F1EB]">
                              {soldForArticle}
                            </strong>
                          </span>
                          {variants.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-700 dark:text-emerald-400">
                                {availCount} available
                              </span>
                              {outCount > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                    {outCount} out of stock
                                  </span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setNewColorForm((prev) => ({
                            ...prev,
                            [product.id]: {
                              ...addColorState,
                              open: !addColorState.open,
                            },
                          }))
                        }
                        className="px-3 py-1.5 rounded-lg border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#1F1C19] hover:bg-[#F6F1EB] dark:hover:bg-[#282420] text-[#141414] dark:text-[#F6F1EB] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Color</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(product.id)}
                        className="p-1.5 rounded-lg border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#1F1C19] text-[#6B625C] dark:text-[#C9BFB6] cursor-pointer"
                        title={isExpanded ? 'Collapse colors' : 'Expand colors'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Inline Add New Color Bar */}
                  {addColorState.open && (
                    <div className="px-5 py-3 bg-[#F6F1EB]/70 dark:bg-[#221F1C] border-b border-[#EFE8E0] dark:border-[#2A2622] flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-[#141414] dark:text-[#F6F1EB]">
                        New Color for {articleLabel}:
                      </span>
                      <input
                        type="color"
                        value={addColorState.hex}
                        onChange={(e) =>
                          setNewColorForm((prev) => ({
                            ...prev,
                            [product.id]: { ...addColorState, hex: e.target.value },
                          }))
                        }
                        className="w-7 h-7 rounded cursor-pointer border border-[#D8CEC4]"
                      />
                      <input
                        type="text"
                        placeholder="Color name (e.g. Maroon)"
                        value={addColorState.color}
                        onChange={(e) =>
                          setNewColorForm((prev) => ({
                            ...prev,
                            [product.id]: { ...addColorState, color: e.target.value },
                          }))
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-[#D8CEC4] dark:border-[#3A3530] bg-white dark:bg-[#141414] text-[#141414] dark:text-[#F6F1EB] text-xs w-40"
                      />
                      <input
                        type="number"
                        min={1}
                        placeholder="Qty"
                        value={addColorState.qty}
                        onChange={(e) =>
                          setNewColorForm((prev) => ({
                            ...prev,
                            [product.id]: { ...addColorState, qty: e.target.value },
                          }))
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-[#D8CEC4] dark:border-[#3A3530] bg-white dark:bg-[#141414] text-[#141414] dark:text-[#F6F1EB] text-xs font-mono-numbers w-20"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNewColor(product)}
                        className="px-3 py-1.5 rounded-lg bg-[#141414] dark:bg-[#F6F1EB] text-white dark:text-[#141414] text-xs font-semibold cursor-pointer"
                      >
                        Save Color
                      </button>
                    </div>
                  )}

                  {/* Color-Wise Stock Table (ALL colors including Out-of-Stock visible to Admin) */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      {variants.length === 0 ? (
                        <div className="px-5 py-4 text-xs text-[#7D6E65] dark:text-[#A89E96] flex items-center justify-between">
                          <span>
                            Single-variant item ({product.color || 'Default'}) ·{' '}
                            <strong className="font-mono-numbers text-[#141414] dark:text-[#F6F1EB]">
                              {product.stockQuantity} {product.unit}
                            </strong>{' '}
                            in stock
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setNewColorForm((prev) => ({
                                ...prev,
                                [product.id]: { open: true, color: product.color || 'Red', hex: '#DC2626', qty: '2' },
                              }))
                            }
                            className="text-[#141414] dark:text-[#F3E1DF] font-semibold underline cursor-pointer"
                          >
                            Convert to Color-Wise Stock
                          </button>
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FAF7F4]/60 dark:bg-[#161412]/60 text-[11px] font-semibold text-[#7D6E65] dark:text-[#A89E96] border-b border-[#EFE8E0] dark:border-[#2A2622]">
                            <tr>
                              <th className="px-5 py-2.5">Color</th>
                              <th className="px-4 py-2.5 text-right">Remaining Stock</th>
                              <th className="px-4 py-2.5 text-right">Sold</th>
                              <th className="px-4 py-2.5">POS Availability</th>
                              <th className="px-5 py-2.5 text-right">Add Stock to Color</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EFE8E0] dark:divide-[#2A2622]">
                            {variants.map((cv) => {
                              const currentQty =
                                cv.inStock === false ? 0 : Math.max(0, Number(cv.stock) || 0);
                              const isOut = currentQty <= 0;
                              const isLow = !isOut && currentQty <= lowColorThreshold;
                              const soldColorQty =
                                soldStats.byProductColor.get(
                                  `${product.id}::${cv.color.trim().toLowerCase()}`
                                ) || 0;
                              const inputKey = `${product.id}::${cv.color}`;
                              const customQty = restockInputs[inputKey] ?? '2';

                              return (
                                <tr
                                  key={cv.color}
                                  className={`transition-colors ${
                                    isOut
                                      ? 'bg-[#F3E1DF]/25 dark:bg-[#3A2322]/25'
                                      : 'hover:bg-[#FAF7F4] dark:hover:bg-[#221F1C]/50'
                                  }`}
                                >
                                  <td className="px-5 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                      <span
                                        className="w-4 h-4 rounded-full border border-black/20 dark:border-white/25 shrink-0"
                                        style={{ backgroundColor: cv.hex || '#64748B' }}
                                      />
                                      <span className="font-semibold text-[#141414] dark:text-[#F6F1EB]">
                                        {cv.color}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-mono-numbers font-bold">
                                    <span
                                      className={
                                        isOut
                                          ? 'text-rose-600 dark:text-rose-400'
                                          : isLow
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-[#141414] dark:text-[#F6F1EB]'
                                      }
                                    >
                                      {currentQty} {product.unit}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-mono-numbers text-[#7D6E65] dark:text-[#A89E96]">
                                    {soldColorQty}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    {isOut ? (
                                      <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                                        Out of Stock · Hidden in POS
                                      </span>
                                    ) : isLow ? (
                                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                        Low Stock · Visible in POS
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                        Available · Visible in POS
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-2.5 text-right">
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuickRestock(product, cv.color, 2, cv.hex)
                                        }
                                        className="px-2 py-1 rounded-lg border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#1F1C19] hover:bg-[#F6F1EB] dark:hover:bg-[#2A2622] text-[11px] font-mono-numbers font-semibold text-[#141414] dark:text-[#F6F1EB] cursor-pointer"
                                        title={`Quick add 2 ${product.unit} to ${cv.color}`}
                                      >
                                        +2
                                      </button>
                                      <input
                                        type="number"
                                        min={1}
                                        value={customQty}
                                        onChange={(e) =>
                                          setRestockInputs((prev) => ({
                                            ...prev,
                                            [inputKey]: e.target.value,
                                          }))
                                        }
                                        className="w-12 px-1.5 py-1 text-center text-[11px] font-mono-numbers font-bold rounded-lg border border-[#E8E0D8] dark:border-[#2E2A26] bg-white dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB]"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuickRestock(
                                            product,
                                            cv.color,
                                            Math.max(1, Math.floor(Number(customQty) || 1)),
                                            cv.hex
                                          )
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-[#141414] dark:bg-[#F6F1EB] hover:bg-[#2B2724] text-white dark:text-[#141414] text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                                      >
                                        Add Stock
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: COMPLETE COLOR STOCK MOVEMENT HISTORY */}
      {sectionView === 'history' && (
        <div className="bg-white dark:bg-[#1A1816] rounded-2xl border border-[#E8E0D8] dark:border-[#2E2A26] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#EFE8E0] dark:border-[#2A2622] flex items-center justify-between bg-[#FAF7F4] dark:bg-[#161412]">
            <div>
              <h3 className="text-sm font-bold text-[#141414] dark:text-[#F6F1EB]">
                Color-Wise Stock Movement History
              </h3>
              <p className="text-[11px] text-[#7D6E65] dark:text-[#A89E96]">
                Every sale deduction, admin restock, return restoration, and sale cancellation logged by article and color.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F4]/60 dark:bg-[#161412]/60 text-[11px] font-semibold text-[#7D6E65] dark:text-[#A89E96] border-b border-[#EFE8E0] dark:border-[#2A2622]">
                <tr>
                  <th className="px-5 py-2.5">Date & Time</th>
                  <th className="px-4 py-2.5">Article</th>
                  <th className="px-4 py-2.5">Color</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5 text-right">Change</th>
                  <th className="px-4 py-2.5 text-right">Before → After</th>
                  <th className="px-5 py-2.5">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE8E0] dark:divide-[#2A2622]">
                {colorStockHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[#7D6E65] dark:text-[#A89E96]">
                      No color stock movements recorded yet. Complete a sale or restock a color to see live audit history.
                    </td>
                  </tr>
                ) : (
                  colorStockHistory.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-[#FAF7F4] dark:hover:bg-[#221F1C]/50"
                    >
                      <td className="px-5 py-2.5 font-mono-numbers text-[11px] text-[#7D6E65] dark:text-[#A89E96] whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-[#141414] dark:text-[#F6F1EB]">
                          {entry.articleNumber}
                        </div>
                        <div className="text-[11px] text-[#7D6E65] truncate max-w-[200px]">
                          {entry.productName}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: entry.hex || '#64748B' }}
                          />
                          <span className="font-medium text-[#141414] dark:text-[#F6F1EB]">
                            {entry.color}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] font-semibold">
                        {entry.type === 'sale' ? (
                          <span className="text-rose-600 dark:text-rose-400">POS Sale</span>
                        ) : entry.type === 'restock' ? (
                          <span className="text-emerald-700 dark:text-emerald-400">Admin Restock</span>
                        ) : entry.type === 'return' ? (
                          <span className="text-indigo-700 dark:text-indigo-400">Return Restored</span>
                        ) : entry.type === 'cancel_sale' ? (
                          <span className="text-amber-700 dark:text-amber-400">Sale Cancelled</span>
                        ) : (
                          <span className="text-[#4A433E] dark:text-[#C9BFB6]">Stock Entry</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono-numbers font-bold">
                        <span
                          className={
                            entry.quantityDelta < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }
                        >
                          {entry.quantityDelta > 0 ? `+${entry.quantityDelta}` : entry.quantityDelta}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono-numbers text-[#4A433E] dark:text-[#C9BFB6]">
                        {entry.previousStock} → <strong>{entry.newStock}</strong>
                      </td>
                      <td className="px-5 py-2.5 text-[11px] text-[#7D6E65] dark:text-[#A89E96]">
                        {entry.referenceNo ? (
                          <span className="font-mono-numbers font-semibold text-[#141414] dark:text-[#F6F1EB]">
                            {entry.referenceNo}
                          </span>
                        ) : (
                          entry.note || '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: SALES LOG WITH CANCEL & AUTOMATIC COLOR STOCK RESTORATION */}
      {sectionView === 'sales' && (
        <div className="bg-white dark:bg-[#1A1816] rounded-2xl border border-[#E8E0D8] dark:border-[#2E2A26] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#EFE8E0] dark:border-[#2A2622] bg-[#FAF7F4] dark:bg-[#161412]">
            <h3 className="text-sm font-bold text-[#141414] dark:text-[#F6F1EB]">
              Completed Sales & Color-Wise Stock Restoration
            </h3>
            <p className="text-[11px] text-[#7D6E65] dark:text-[#A89E96]">
              Cancelling any sale immediately restores the exact sold quantities back to each color&apos;s stock and makes zero-stock colors available in POS again.
            </p>
          </div>

          <div className="divide-y divide-[#EFE8E0] dark:divide-[#2A2622]">
            {sales.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#7D6E65] dark:text-[#A89E96]">
                No sales completed yet.
              </div>
            ) : (
              sales.slice(0, 30).map((sale) => {
                const isCancelled = sale.status === 'cancelled';
                const totalUnits = sale.items.reduce((sum, i) => sum + i.quantity, 0);
                return (
                  <div
                    key={sale.id}
                    className={`px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCancelled ? 'opacity-65 bg-[#FAF7F4]/60 dark:bg-[#161412]/40' : ''
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 text-xs">
                        <span className="font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]">
                          {sale.invoiceNo}
                        </span>
                        <span className="text-[#B5A99F]">·</span>
                        <span className="text-[#4A433E] dark:text-[#C9BFB6]">
                          {sale.customerName}
                        </span>
                        <span className="text-[#B5A99F]">·</span>
                        <span className="font-mono-numbers text-[11px] text-[#7D6E65]">
                          {new Date(sale.timestamp).toLocaleString()}
                        </span>
                        {isCancelled && (
                          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            · Cancelled (Stock Restored)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#6B625C] dark:text-[#A89E96]">
                        {sale.items
                          .map(
                            (i) =>
                              `${i.articleNumber ? `${i.articleNumber} ` : ''}${i.name}${i.color ? ` (${i.color})` : ''} × ${i.quantity}`
                          )
                          .join(' · ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]">
                          {storeProfile.currency} {sale.grandTotal.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-mono-numbers text-[#7D6E65]">
                          {totalUnits} unit{totalUnits === 1 ? '' : 's'}
                        </div>
                      </div>

                      {!isCancelled && (
                        confirmCancelSaleId === sale.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const res = cancelSale(sale.id, 'Cancelled from Inventory Dashboard');
                                setConfirmCancelSaleId(null);
                                if (!res.ok) {
                                  showFeedback(res.error || 'Could not cancel sale.', 'error');
                                } else {
                                  showFeedback(
                                    `Cancelled ${sale.invoiceNo} and restored color-wise stock automatically.`,
                                    'success'
                                  );
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                            >
                              Confirm Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCancelSaleId(null)}
                              className="px-2 py-1.5 rounded-lg border border-[#E8E0D8] dark:border-[#2E2A26] text-[11px] text-[#6B625C] cursor-pointer"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmCancelSaleId(sale.id)}
                            className="px-3 py-1.5 rounded-lg border border-[#E5C6C3] dark:border-[#5C3A38] text-rose-700 dark:text-rose-400 hover:bg-[#F3E1DF]/50 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Cancel & Restore</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
