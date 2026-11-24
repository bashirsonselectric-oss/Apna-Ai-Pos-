import React, { useMemo } from 'react';
import { ArrowRight, Package, AlertTriangle, Plus, Sparkles } from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { BOUTIQUE_CATEGORIES } from '../../data/boutiqueCatalog';

interface CategoriesViewProps {
  onSelectCategoryForPos: (categoryId: string) => void;
  onAddNewItem: () => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  onSelectCategoryForPos,
  onAddNewItem,
}) => {
  const { filteredProducts, storeProfile } = usePos();

  const categoryStats = useMemo(() => {
    return BOUTIQUE_CATEGORIES.map((cat) => {
      const items = filteredProducts.filter((p) => p.category === cat.id);
      const totalUnits = items.reduce((sum, p) => sum + Math.max(0, p.stockQuantity), 0);
      const retailValue = items.reduce(
        (sum, p) => sum + Math.max(0, p.stockQuantity) * p.retailPrice,
        0
      );
      const lowStockCount = items.filter((p) => p.stockQuantity <= p.minStockAlert).length;
      return {
        ...cat,
        skuCount: items.length,
        totalUnits,
        retailValue,
        lowStockCount,
      };
    });
  }, [filteredProducts]);

  const totalRetailValuation = categoryStats.reduce((s, c) => s + c.retailValue, 0);
  const totalUnitsAll = categoryStats.reduce((s, c) => s + c.totalUnits, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E8E0D8] dark:border-[#2E2A26]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7D6E65] dark:text-[#A89E96]">
            Curated Boutique Departments
          </p>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#141414] dark:text-[#F6F1EB] mt-1">
            Fashion Categories
          </h1>
          <p className="text-xs text-[#6B625C] dark:text-[#A89E96] mt-1">
            {BOUTIQUE_CATEGORIES.length} luxury collections ·{' '}
            <span className="font-mono-numbers font-semibold text-[#141414] dark:text-[#F6F1EB]">
              {totalUnitsAll.toLocaleString()}
            </span>{' '}
            units in stock · Valuation{' '}
            <span className="font-mono-numbers font-semibold text-[#141414] dark:text-[#F6F1EB]">
              {storeProfile.currency} {totalRetailValuation.toLocaleString()}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNewItem}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] dark:hover:bg-[#E8E0D8] text-white dark:text-[#141414] text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Piece</span>
        </button>
      </div>

      {/* 10 Fashion Category Editorial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {categoryStats.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategoryForPos(cat.id)}
            className="group rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] hover:border-[#141414]/40 dark:hover:border-[#E5C6C3]/50 overflow-hidden transition-all cursor-pointer flex flex-col"
          >
            {/* Studio Image */}
            <div className="relative aspect-[4/3] bg-[#F6F1EB] dark:bg-[#221F1C] overflow-hidden">
              <img
                src={cat.image}
                alt={cat.label}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {cat.lowStockCount > 0 && (
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-white/95 dark:bg-[#141414]/90 text-[#9B2C2C] dark:text-[#FCA5A5] text-[10px] font-semibold flex items-center gap-1 border border-[#E8E0D8] dark:border-[#3A2626]">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{cat.lowStockCount} low</span>
                </div>
              )}
            </div>

            {/* Category Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h2 className="font-editorial text-base font-semibold text-[#141414] dark:text-[#F6F1EB] leading-snug">
                  {cat.label}
                </h2>
                <p className="text-[11px] text-[#6B625C] dark:text-[#A89E96] mt-1 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#EFE8E0] dark:border-[#2A2622] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#6B625C] dark:text-[#A89E96]">
                  <span className="inline-flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    <span className="font-mono-numbers font-semibold text-[#141414] dark:text-[#F6F1EB]">
                      {cat.skuCount}
                    </span>{' '}
                    styles · {cat.totalUnits} pcs
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]">
                    {storeProfile.currency} {cat.retailValue.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#141414] dark:text-[#E5C6C3] group-hover:translate-x-0.5 transition-transform">
                    <span>Open POS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="rounded-2xl bg-[#F6F1EB] dark:bg-[#1E1B18] border border-[#E8E0D8] dark:border-[#2E2A26] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F3E1DF] dark:bg-[#3A2827] text-[#141414] dark:text-[#F3E1DF] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#141414] dark:text-[#F6F1EB]">
              Instant POS Category Filtering
            </div>
            <div className="text-[11px] text-[#6B625C] dark:text-[#A89E96]">
              Click any department above to jump straight into the billing counter filtered to that collection.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelectCategoryForPos('All')}
          className="px-4 py-2 rounded-xl border border-[#141414] dark:border-[#F6F1EB] text-[#141414] dark:text-[#F6F1EB] hover:bg-[#141414] hover:text-white dark:hover:bg-[#F6F1EB] dark:hover:text-[#141414] text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          View Complete Collection
        </button>
      </div>
    </div>
  );
};
