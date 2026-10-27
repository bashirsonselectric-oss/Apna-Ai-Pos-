import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { VipCustomerAnalysis, VipTier } from '../../types';
import {
  Crown,
  Search,
  Plus,
  Send,
  Trash2,
  Edit2,
  Calendar,
  Receipt,
  Percent,
  CheckCircle2,
  Award,
  Sparkles,
  Phone,
  X,
  FileText,
  DollarSign,
  ShoppingBag,
} from 'lucide-react';

export const VipCustomers: React.FC = () => {
  const {
    vipCustomers,
    addVipCustomer,
    updateVipCustomer,
    deleteVipCustomer,
    sales,
    storeProfile,
  } = usePos();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomerBills, setSelectedCustomerBills] = useState<VipCustomerAnalysis | null>(null);

  // Add form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+92 3');
  const [tier, setTier] = useState<VipTier>('gold');
  const [discountPercent, setDiscountPercent] = useState<number>(5);
  const [preferredCat, setPreferredCat] = useState('');
  const [notes, setNotes] = useState('');

  const filteredVips = vipCustomers.filter((vip) => {
    const matchesSearch =
      vip.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vip.customerPhone.includes(searchQuery) ||
      (vip.notes && vip.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier = filterTier === 'all' || vip.tier === filterTier;
    return matchesSearch && matchesTier;
  });

  // KPI Calculations
  const platinumCount = vipCustomers.filter((v) => v.tier === 'platinum').length;
  const goldCount = vipCustomers.filter((v) => v.tier === 'gold').length;
  const silverCount = vipCustomers.filter((v) => v.tier === 'silver').length;
  const totalVipRevenue = vipCustomers.reduce((sum, v) => sum + v.totalSpend, 0);

  const handleAddVip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addVipCustomer({
      customerName: name.trim(),
      customerPhone: phone.trim(),
      tier,
      totalSpend: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      lastVisitDate: new Date().toISOString().split('T')[0],
      specialDiscountPercent: discountPercent,
      preferredCategories: preferredCat ? [preferredCat.trim()] : ['General'],
      notes: notes.trim() || 'Manually enrolled VIP customer',
      detectedAutomatically: false,
    });

    setIsAddModalOpen(false);
    setName('');
    setPhone('+92 3');
    setNotes('');
    setPreferredCat('');
  };

  const sendVipGreetingWhatsApp = (vip: VipCustomerAnalysis) => {
    const text = `🌟 *EXCLUSIVE VIP GREETING & LOYALTY PRIVILEGE*
🏪 *From:* ${storeProfile.name}
👑 *Honored Customer:* ${vip.customerName}
✨ *Loyalty Status:* ${vip.tier.toUpperCase()} VIP
━━━━━━━━━━━━━━━━━━━━━
Assalam-o-Alaikum! We deeply value your continued partnership and wholesale business with us.

🎁 *Your Exclusive VIP Perk:*
Enjoy an instant *${vip.specialDiscountPercent}% VIP Discount* on your upcoming billing at our counter!

📊 *Your Account Overview:*
• Total Orders: ${vip.totalOrders}
• Total Spend: ${storeProfile.currency} ${vip.totalSpend.toLocaleString()}

Visit us today or WhatsApp us your order list for priority packing & dispatch!
⚡ *Apna AI POS Loyalty Program • Godigly*`;

    const encoded = encodeURI(text);
    const phoneClean = vip.customerPhone ? vip.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const getTierBadge = (t: VipTier) => {
    switch (t) {
      case 'platinum':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs">
            <Crown className="w-3.5 h-3.5 text-amber-300" /> Platinum VIP
          </span>
        );
      case 'gold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-xs">
            <Award className="w-3.5 h-3.5" /> Gold VIP
          </span>
        );
      case 'silver':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" /> Silver VIP
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            Regular
          </span>
        );
    }
  };

  // Get sales of selected VIP customer
  const customerInvoices = selectedCustomerBills
    ? sales.filter(
        (s) =>
          s.customerName.toLowerCase().trim() === selectedCustomerBills.customerName.toLowerCase().trim() ||
          (selectedCustomerBills.customerPhone && s.customerPhone === selectedCustomerBills.customerPhone)
      )
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Crown className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                VIP Customer Intelligence & Bill Detection
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI and rule-based detection of highest-spend customers from sales history, loyalty tier classification, and WhatsApp rewards.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add VIP Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Platinum VIPs</span>
            <Crown className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-purple-600 dark:text-purple-400 mt-1">
            {platinumCount}
          </div>
          <span className="text-[10px] text-slate-400">&gt; Rs. 50k lifetime spend</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Gold VIPs</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-amber-600 dark:text-amber-400 mt-1">
            {goldCount}
          </div>
          <span className="text-[10px] text-slate-400">&gt; Rs. 25k spend</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Silver VIPs</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-blue-600 dark:text-blue-400 mt-1">
            {silverCount}
          </div>
          <span className="text-[10px] text-slate-400">&gt; Rs. 10k spend</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Total VIP Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black font-mono-numbers text-emerald-600 dark:text-emerald-400 mt-1">
            {storeProfile.currency} {totalVipRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Contributed by VIP accounts</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search VIP customer by name, phone, or tags..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="all">All VIP Tiers</option>
              <option value="platinum">Platinum VIP Only</option>
              <option value="gold">Gold VIP Only</option>
              <option value="silver">Silver VIP Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIP Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredVips.map((vip) => (
          <div
            key={vip.customerId}
            className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  {getTierBadge(vip.tier)}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                    {vip.customerName}
                  </h3>
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{vip.customerPhone || 'No phone recorded'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-black">
                    {vip.specialDiscountPercent}% Discount
                  </span>
                </div>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl mt-4 text-center">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Total Spend</div>
                  <div className="text-xs font-black font-mono-numbers text-slate-900 dark:text-white mt-0.5">
                    {storeProfile.currency} {vip.totalSpend.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Total Bills</div>
                  <div className="text-xs font-black font-mono-numbers text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {vip.totalOrders}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Avg Basket</div>
                  <div className="text-xs font-black font-mono-numbers text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {storeProfile.currency} {vip.avgOrderValue.toLocaleString()}
                  </div>
                </div>
              </div>

              {vip.notes && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 italic line-clamp-2">
                  "{vip.notes}"
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedCustomerBills(vip)}
                className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>View Bills</span>
              </button>

              <button
                onClick={() => sendVipGreetingWhatsApp(vip)}
                className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>VIP WhatsApp</span>
              </button>

              <button
                onClick={() => deleteVipCustomer(vip.customerId)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Remove VIP status"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* VIP Customer Bills History Modal (with right-side scrollbar) */}
      {selectedCustomerBills && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Customer Billing History
                </span>
                <h3 className="text-base font-bold">
                  {selectedCustomerBills.customerName} — {getTierBadge(selectedCustomerBills.tier)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCustomerBills(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with right-side scrollbar */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Total Purchase History:</span>
                  <div className="text-base font-black font-mono-numbers text-emerald-600 dark:text-emerald-400">
                    {storeProfile.currency} {selectedCustomerBills.totalSpend.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Invoices on Record:</span>
                  <div className="text-base font-black font-mono-numbers text-slate-900 dark:text-white">
                    {customerInvoices.length} Bills
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Applied Discount:</span>
                  <div className="text-base font-black font-mono-numbers text-indigo-600 dark:text-indigo-400">
                    {selectedCustomerBills.specialDiscountPercent}%
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Invoices & Bills</h4>
                {customerInvoices.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    No individual POS checkout bills recorded with this exact customer name yet.
                  </div>
                ) : (
                  customerInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white font-mono">{inv.invoiceNo}</div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(inv.timestamp).toLocaleDateString()} • {inv.items.length} Items • Paid via {inv.paymentMethod.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono-numbers font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {storeProfile.currency} {inv.grandTotal.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">Bill Total</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerBills(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add VIP Customer Modal (with right-side scrollbar) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  Enrol VIP Customer
                </span>
                <h3 className="text-base font-bold">Add VIP Customer</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVip} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer / Contractor Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood Electrician"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-bold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone (WhatsApp) *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white font-mono focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    VIP Tier
                  </label>
                  <select
                    value={tier}
                    onChange={(e) => {
                      const newTier = e.target.value as VipTier;
                      setTier(newTier);
                      setDiscountPercent(newTier === 'platinum' ? 8 : newTier === 'gold' ? 5 : 3);
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                  >
                    <option value="platinum">Platinum VIP (&gt; 50k)</option>
                    <option value="gold">Gold VIP (&gt; 25k)</option>
                    <option value="silver">Silver VIP (&gt; 10k)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Checkout Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-emerald-600 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Frequent Purchasing Category
                </label>
                <input
                  type="text"
                  value={preferredCat}
                  onChange={(e) => setPreferredCat(e.target.value)}
                  placeholder="e.g. Circuit Breakers, PVC Conduit, Electric Cables"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Remarks / Project Details
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Major housing society contractor, buys in wholesale lots..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20"
                >
                  Save VIP Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
