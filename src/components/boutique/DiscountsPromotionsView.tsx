import React, { useState } from 'react';
import {
  Tag,
  Percent,
  Plus,
  Trash2,
  Award,
  Sparkles,
  Check,
  SlidersHorizontal,
  Copy,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';

interface DiscountsPromotionsViewProps {
  onOpenPriceAdjuster: () => void;
  onApplyCouponToPos: (code: string) => void;
}

export const DiscountsPromotionsView: React.FC<DiscountsPromotionsViewProps> = ({
  onOpenPriceAdjuster,
  onApplyCouponToPos,
}) => {
  const {
    coupons,
    addCoupon,
    toggleCouponActive,
    deleteCoupon,
    loyaltyPointsMap,
    storeProfile,
  } = usePos();

  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<number>(10);
  const [minOrder, setMinOrder] = useState<number>(2000);
  const [expiresAt, setExpiresAt] = useState('2026-12-31');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode || value <= 0) {
      setFormNotice('Enter a valid coupon code and positive discount value.');
      return;
    }
    addCoupon({
      code: cleanCode,
      label: label.trim() || (type === 'percentage' ? `${value}% Boutique Offer` : `Flat ${value} Off`),
      type,
      value,
      minOrder: Math.max(0, minOrder),
      active: true,
      expiresAt,
    });
    setCode('');
    setLabel('');
    setValue(10);
    setFormNotice(`Coupon ${cleanCode} created and ready at checkout.`);
    setTimeout(() => setFormNotice(null), 3500);
  };

  const handleCopy = (c: string) => {
    navigator.clipboard?.writeText(c).catch(() => {});
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const loyaltyEntries = Object.entries(loyaltyPointsMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E8E0D8] dark:border-[#2E2A26]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7D6E65] dark:text-[#A89E96]">
            Atelier Privileges & Offers
          </p>
          <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#141414] dark:text-[#F6F1EB] mt-1">
            Discounts & Promotions
          </h1>
          <p className="text-xs text-[#6B625C] dark:text-[#A89E96] mt-1">
            Manage boutique promo codes, seasonal markdowns, and client loyalty rewards.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenPriceAdjuster}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] dark:hover:bg-[#E8E0D8] text-white dark:text-[#141414] text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Bulk Price Markdown (+/-)</span>
        </button>
      </div>

      {formNotice && (
        <div className="px-4 py-3 rounded-xl bg-[#F3E1DF] dark:bg-[#342322] border border-[#E5C6C3] dark:border-[#533836] text-[#141414] dark:text-[#F6F1EB] text-xs font-medium">
          {formNotice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Coupons List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-lg font-semibold text-[#141414] dark:text-[#F6F1EB]">
              Boutique Promo Codes
            </h2>
            <span className="text-xs text-[#6B625C] dark:text-[#A89E96] font-mono-numbers">
              {coupons.filter((c) => c.active).length} active of {coupons.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.code}
                className={`rounded-2xl p-4 border transition-colors flex flex-col justify-between gap-4 ${
                  coupon.active
                    ? 'bg-white dark:bg-[#1A1816] border-[#E8E0D8] dark:border-[#2E2A26]'
                    : 'bg-[#FAF7F4]/60 dark:bg-[#161412] border-[#E8E0D8]/60 dark:border-[#26221E] opacity-70'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#F6F1EB] dark:bg-[#26221E] flex items-center justify-center text-[#141414] dark:text-[#F3E1DF]">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono-numbers text-sm font-bold tracking-wider text-[#141414] dark:text-[#F6F1EB]">
                          {coupon.code}
                        </div>
                        <div className="text-[11px] text-[#6B625C] dark:text-[#A89E96]">
                          {coupon.label}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCouponActive(coupon.code)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                        coupon.active
                          ? 'bg-[#141414] text-white border-[#141414] dark:bg-[#F6F1EB] dark:text-[#141414] dark:border-[#F6F1EB]'
                          : 'bg-transparent text-[#6B625C] border-[#D8CEC4] dark:border-[#3A342E]'
                      }`}
                    >
                      {coupon.active ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="font-mono-numbers text-2xl font-bold text-[#141414] dark:text-[#F6F1EB]">
                      {coupon.type === 'percentage'
                        ? `${coupon.value}%`
                        : `${storeProfile.currency} ${coupon.value.toLocaleString()}`}
                    </span>
                    <span className="text-[11px] text-[#6B625C] dark:text-[#A89E96]">
                      off · Min. {storeProfile.currency} {coupon.minOrder.toLocaleString()} · Exp {coupon.expiresAt}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EFE8E0] dark:border-[#2A2622] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(coupon.code)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E8E0D8] dark:border-[#2E2A26] hover:bg-[#F6F1EB] dark:hover:bg-[#26221E] text-[11px] font-semibold text-[#141414] dark:text-[#F6F1EB] inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode === coupon.code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode === coupon.code ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCoupon(coupon.code)}
                      className="p-1.5 rounded-lg text-[#7D6E65] hover:text-[#9B2C2C] hover:bg-[#F3E1DF]/50 cursor-pointer"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {coupon.active && (
                    <button
                      type="button"
                      onClick={() => onApplyCouponToPos(coupon.code)}
                      className="px-3 py-1.5 rounded-lg bg-[#F3E1DF] hover:bg-[#E8C9C6] dark:bg-[#3A2827] dark:hover:bg-[#4A3231] text-[#141414] dark:text-[#F6F1EB] text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Use in POS
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Loyalty Points Ledger */}
          <div className="rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F3E1DF] dark:bg-[#3A2827] text-[#141414] dark:text-[#F3E1DF] flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-editorial text-base font-semibold text-[#141414] dark:text-[#F6F1EB]">
                    Client Loyalty Points Program
                  </h3>
                  <p className="text-[11px] text-[#6B625C] dark:text-[#A89E96]">
                    Clients earn 1 point per {storeProfile.currency} 100 spent · Redeemable directly in POS cart (1 pt = {storeProfile.currency} 1)
                  </p>
                </div>
              </div>
            </div>

            {loyaltyEntries.length > 0 ? (
              <div className="divide-y divide-[#EFE8E0] dark:divide-[#2A2622]">
                {loyaltyEntries.slice(0, 6).map(([clientName, pts]) => (
                  <div key={clientName} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#141414] dark:text-[#F6F1EB]">{clientName}</div>
                      <div className="text-[11px] text-[#6B625C] dark:text-[#A89E96]">
                        {pts >= 750 ? 'Atelier Platinum Member' : pts >= 300 ? 'Gold Boutique Member' : 'Silver Member'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono-numbers font-bold text-[#141414] dark:text-[#F6F1EB]">
                        {pts.toLocaleString()} pts
                      </div>
                      <div className="text-[10px] text-[#6B625C] dark:text-[#A89E96]">
                        Worth {storeProfile.currency} {pts.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#6B625C] dark:text-[#A89E96] py-4 text-center">
                Loyalty points automatically accrue when clients complete checkout.
              </div>
            )}
          </div>
        </div>

        {/* Create New Coupon Form */}
        <div className="rounded-2xl bg-white dark:bg-[#1A1816] border border-[#E8E0D8] dark:border-[#2E2A26] p-5 h-fit space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#141414] dark:text-[#E5C6C3]" />
            <h2 className="font-editorial text-lg font-semibold text-[#141414] dark:text-[#F6F1EB]">
              Create Coupon Code
            </h2>
          </div>

          <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                Promo Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ATELIER25"
                className="w-full px-3 py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB] font-mono-numbers uppercase focus:outline-none focus:border-[#141414] dark:focus:border-[#E5C6C3]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                Campaign Description
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Weekend Silk Capsule Sale"
                className="w-full px-3 py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB] focus:outline-none focus:border-[#141414] dark:focus:border-[#E5C6C3]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                  Discount Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB]"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed ({storeProfile.currency})</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                  Value *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB] font-mono-numbers font-bold"
                  />
                  {type === 'percentage' && (
                    <Percent className="w-3.5 h-3.5 text-[#7D6E65] absolute right-3 top-2.5" />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                  Min. Order ({storeProfile.currency})
                </label>
                <input
                  type="number"
                  min={0}
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB] font-mono-numbers"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#141414] dark:text-[#F6F1EB] mb-1">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E0D8] dark:border-[#2E2A26] bg-[#FAF7F4] dark:bg-[#121110] text-[#141414] dark:text-[#F6F1EB] font-mono-numbers"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#141414] hover:bg-[#2B2724] dark:bg-[#F6F1EB] dark:hover:bg-[#E8E0D8] text-white dark:text-[#141414] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save Promo Code</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
