import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { BusinessVertical } from '../../types';
import { VERTICALS_CONFIG } from '../../data/defaultData';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  X,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface PriceAdjusterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PriceAdjusterModal: React.FC<PriceAdjusterModalProps> = ({ isOpen, onClose }) => {
  const { products, activeVertical, bulkAdjustPrices, storeProfile } = usePos();

  const [direction, setDirection] = useState<'increase' | 'decrease'>('increase');
  const [adjustType, setAdjustType] = useState<'percent' | 'flat'>('percent');
  const [value, setValue] = useState<number>(5);
  const [scope, setScope] = useState<'all' | 'vertical' | 'category'>('vertical');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentVerticalName = VERTICALS_CONFIG[activeVertical].name;
  const categories = Array.from(new Set(products.filter((p) => p.vertical === activeVertical).map((p) => p.category)));

  // Preview affected items
  const candidateItems = products.filter((p) => {
    if (scope === 'all') return true;
    if (scope === 'vertical') return p.vertical === activeVertical;
    if (scope === 'category') return p.category === selectedCategory && p.vertical === activeVertical;
    return false;
  });

  const previewItems = candidateItems.slice(0, 5);

  const calculateNewPrice = (oldPrice: number) => {
    const factor = direction === 'increase' ? 1 : -1;
    if (adjustType === 'percent') {
      const delta = Math.round((oldPrice * value) / 100);
      return Math.max(1, oldPrice + factor * delta);
    } else {
      return Math.max(1, oldPrice + factor * value);
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (value <= 0) return;

    const affected = bulkAdjustPrices({
      target: scope,
      vertical: activeVertical,
      category: scope === 'category' ? selectedCategory : undefined,
      type: adjustType,
      direction,
      value,
    });

    setSuccessCount(affected);
    setTimeout(() => {
      setSuccessCount(null);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              direction === 'increase' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              {direction === 'increase' ? <TrendingUp className="w-5 h-5 text-white" /> : <TrendingDown className="w-5 h-5 text-white" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Bulk Margin & Price Engine
              </span>
              <h3 className="font-extrabold text-base">Price Increase & Decrease Adjuster</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleApply} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto custom-scrollbar">
          {/* Direction toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Action: Increase or Decrease Prices?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDirection('increase')}
                className={`py-2.5 px-4 rounded-xl border flex items-center justify-center space-x-2 font-bold text-xs transition-all ${
                  direction === 'increase'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Price Increase (+ قیمت بڑھائیں)</span>
              </button>

              <button
                type="button"
                onClick={() => setDirection('decrease')}
                className={`py-2.5 px-4 rounded-xl border flex items-center justify-center space-x-2 font-bold text-xs transition-all ${
                  direction === 'decrease'
                    ? 'border-rose-600 bg-rose-50 text-rose-950 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>Price Decrease (- ڈسکاؤنٹ / کمی)</span>
              </button>
            </div>
          </div>

          {/* Adjustment Type and Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adjustment Type
              </label>
              <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdjustType('percent')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    adjustType === 'percent' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('flat')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    adjustType === 'flat' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  Flat ({storeProfile.currency})
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {adjustType === 'percent' ? 'Percentage Value (%)' : `Flat Rupee Amount (${storeProfile.currency})`}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.5"
                  step={adjustType === 'percent' ? '0.5' : '1'}
                  required
                  value={value ?? 0}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm font-bold font-mono-numbers border border-slate-300 rounded-xl focus:outline-hidden"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                  {adjustType === 'percent' ? '%' : storeProfile.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Scope of Products
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope('vertical')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  scope === 'vertical'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Current Vertical ({currentVerticalName.split(' ')[0]})
              </button>

              <button
                type="button"
                onClick={() => setScope('category')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  scope === 'category'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Specific Category
              </button>

              <button
                type="button"
                onClick={() => setScope('all')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  scope === 'all'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Entire Store ({products.length})
              </button>
            </div>

            {scope === 'category' && (
              <div className="mt-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="All">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Live Preview of Price Changes */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Live Preview ({candidateItems.length} items will be updated):
              </span>
              <span className={`font-bold font-mono-numbers ${
                direction === 'increase' ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {direction === 'increase' ? '+' : '-'}{value}{adjustType === 'percent' ? '%' : storeProfile.currency}
              </span>
            </div>

            <div className="divide-y divide-slate-200 text-[11px] max-h-36 overflow-y-auto font-mono-numbers">
              {previewItems.map((item) => {
                const newPrice = calculateNewPrice(item.retailPrice);
                return (
                  <div key={item.id} className="py-1.5 flex justify-between items-center">
                    <span className="text-slate-700 font-sans truncate max-w-[240px]">
                      {item.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 line-through">
                        {storeProfile.currency} {item.retailPrice.toLocaleString()}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className={`font-bold ${
                        direction === 'increase' ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {storeProfile.currency} {newPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notification on Success */}
          {successCount !== null && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Successfully adjusted prices for {successCount} products!</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md ${
                direction === 'increase'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-700/20'
              }`}
            >
              Apply Price {direction === 'increase' ? 'Increase' : 'Decrease'} to {candidateItems.length} Items
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
