import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Package,
  Printer,
  Calendar,
  DollarSign,
  Plus,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { ReturnItem, ReturnRecord, SaleRecord } from '../../types';

export const ReturnsManager: React.FC = () => {
  const {
    sales,
    returns,
    processReturn,
    products,
    storeProfile,
    featureLocks,
  } = usePos();

  const [activeTab, setActiveTab] = useState<'new_return' | 'return_history'>('new_return');
  const [searchInvoice, setSearchInvoice] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [selectedItems, setSelectedItems] = useState<{
    [productId: string]: {
      selected: boolean;
      returnQty: number;
      restock: boolean;
      reason: 'damaged' | 'wrong_item' | 'customer_mind' | 'expired' | 'other';
    };
  }>({});
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'udhar_credit' | 'digital'>('cash');
  const [returnNotes, setReturnNotes] = useState('');
  const [processedReturnSlip, setProcessedReturnSlip] = useState<ReturnRecord | null>(null);
  const [historySearch, setHistorySearch] = useState('');

  // Check feature lock
  const isLocked = featureLocks.returnsRefunds;

  const handleSearchInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInvoice.trim()) return;
    const query = searchInvoice.trim().toLowerCase();
    const found = sales.find(
      (s) =>
        s.invoiceNo.toLowerCase() === query ||
        s.id.toLowerCase() === query ||
        (s.customerPhone && s.customerPhone.includes(query))
    );

    if (found) {
      setSelectedSale(found);
      // Initialize selected items state
      const initialMap: typeof selectedItems = {};
      found.items.forEach((item) => {
        initialMap[item.productId] = {
          selected: false,
          returnQty: 1,
          restock: true,
          reason: 'customer_mind',
        };
      });
      setSelectedItems(initialMap);
    } else {
      alert(`No sale found matching invoice #${searchInvoice}`);
    }
  };

  const calculateTotalRefund = () => {
    if (!selectedSale) return 0;
    let sum = 0;
    selectedSale.items.forEach((item) => {
      const state = selectedItems[item.productId];
      if (state && state.selected) {
        sum += item.unitPrice * state.returnQty;
      }
    });
    return sum;
  };

  const handleCompleteReturn = () => {
    if (!selectedSale) return;

    const returnItems: ReturnItem[] = [];
    selectedSale.items.forEach((item) => {
      const state = selectedItems[item.productId];
      if (state && state.selected && state.returnQty > 0) {
        returnItems.push({
          productId: item.productId,
          name: item.name,
          quantityReturned: state.returnQty,
          unitPrice: item.unitPrice,
          refundSubtotal: item.unitPrice * state.returnQty,
          reason: state.reason,
          restocked: state.restock,
        });
      }
    });

    if (returnItems.length === 0) {
      alert('Please select at least one item to return.');
      return;
    }

    const totalRefund = calculateTotalRefund();

    const record = processReturn({
      originalInvoiceNo: selectedSale.invoiceNo,
      items: returnItems,
      totalRefundAmount: totalRefund,
      refundMethod,
      customerName: selectedSale.customerName,
      customerPhone: selectedSale.customerPhone,
      notes: returnNotes,
    });

    setProcessedReturnSlip(record);
    setSelectedSale(null);
    setSearchInvoice('');
    setSelectedItems({});
  };

  const filteredHistory = returns.filter((r) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.originalInvoiceNo.toLowerCase().includes(q) ||
      (r.customerName && r.customerName.toLowerCase().includes(q))
    );
  });

  if (isLocked) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
        <RotateCcw className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Returns & Refunds is Locked</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          This feature has been locked by the administrator in the Admin Panel. Unlock it to process customer returns and inventory restocks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Customer Returns & Refunds</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
              Inventory Restock Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Lookup original sales bills, select items for return, auto-restock products, and issue refund slips.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('new_return')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'new_return'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Process New Return
          </button>
          <button
            onClick={() => setActiveTab('return_history')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'return_history'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Return History ({returns.length})
          </button>
        </div>
      </div>

      {/* Return Receipt Modal / Banner */}
      {processedReturnSlip && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Return Processed Successfully! Voucher #{processedReturnSlip.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print Slip
              </button>
              <button
                onClick={() => setProcessedReturnSlip(null)}
                className="text-xs text-slate-500 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl">
            <div>
              <span className="text-slate-400">Original Invoice:</span>
              <p className="font-bold">{processedReturnSlip.originalInvoiceNo}</p>
            </div>
            <div>
              <span className="text-slate-400">Total Refund:</span>
              <p className="font-bold text-rose-600 dark:text-rose-400">Rs {processedReturnSlip.totalRefundAmount.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-400">Refund Method:</span>
              <p className="font-bold uppercase">{processedReturnSlip.refundMethod}</p>
            </div>
            <div>
              <span className="text-slate-400">Items Returned:</span>
              <p className="font-bold">{processedReturnSlip.items.length} items</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'new_return' ? (
        <div className="space-y-6">
          {/* Lookup Invoice Form */}
          {!selectedSale && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-2xl mx-auto text-center space-y-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lookup Sale Invoice for Return</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter the invoice number (e.g., INV-0001) or customer phone number from the sales receipt.
              </p>
              <form onSubmit={handleSearchInvoice} className="flex gap-2 max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Enter Invoice # (e.g. INV-0001)..."
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  className="flex-1 px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs active:scale-95 transition-all"
                >
                  Find Bill
                </button>
              </form>

              {/* Quick List of Recent Sales to pick from */}
              {sales.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Or select from recent sales:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sales.slice(0, 4).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSearchInvoice(s.invoiceNo);
                          setSelectedSale(s);
                          const initialMap: typeof selectedItems = {};
                          s.items.forEach((item) => {
                            initialMap[item.productId] = {
                              selected: false,
                              returnQty: 1,
                              restock: true,
                              reason: 'customer_mind',
                            };
                          });
                          setSelectedItems(initialMap);
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-all bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{s.invoiceNo}</div>
                          <div className="text-[11px] text-slate-500">{new Date(s.timestamp).toLocaleDateString()} • {s.items.length} items</div>
                        </div>
                        <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400 font-mono-numbers">
                          Rs {s.grandTotal.toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bill Found & Item Selection */}
          {selectedSale && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mb-1 font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Select Different Bill
                  </button>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Processing Return for Bill #{selectedSale.invoiceNo}
                  </h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Date: {new Date(selectedSale.timestamp).toLocaleString()} • Customer: {selectedSale.customerName || 'Walk-in'} ({selectedSale.customerPhone || 'N/A'})
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Original Total:</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white font-mono-numbers">
                    Rs {selectedSale.grandTotal.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Items List with Return Selectors */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Items to Return:</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {selectedSale.items.map((item) => {
                    const itemState = selectedItems[item.productId] || {
                      selected: false,
                      returnQty: 1,
                      restock: true,
                      reason: 'customer_mind',
                    };

                    return (
                      <div
                        key={item.productId}
                        className={`p-4 transition-colors ${
                          itemState.selected
                            ? 'bg-rose-50/50 dark:bg-rose-950/20'
                            : 'bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={itemState.selected}
                              onChange={(e) =>
                                setSelectedItems((prev) => ({
                                  ...prev,
                                  [item.productId]: {
                                    ...itemState,
                                    selected: e.target.checked,
                                  },
                                }))
                              }
                              className="mt-1 w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500 border-slate-300"
                            />
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white">
                                {item.name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Purchased: {item.quantity} units @ Rs {item.unitPrice.toLocaleString()} each (Subtotal: Rs {item.subtotal.toLocaleString()})
                              </div>
                            </div>
                          </label>

                          {itemState.selected && (
                            <div className="flex flex-wrap items-center gap-3 pl-7 sm:pl-0">
                              {/* Quantity selector */}
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-slate-500">Return Qty:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max={item.quantity}
                                  value={itemState.returnQty}
                                  onChange={(e) => {
                                    const val = Math.min(item.quantity, Math.max(1, parseInt(e.target.value) || 1));
                                    setSelectedItems((prev) => ({
                                      ...prev,
                                      [item.productId]: {
                                        ...itemState,
                                        returnQty: val,
                                      },
                                    }));
                                  }}
                                  className="w-16 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-center font-bold"
                                />
                              </div>

                              {/* Restock Toggle */}
                              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={itemState.restock}
                                  onChange={(e) =>
                                    setSelectedItems((prev) => ({
                                      ...prev,
                                      [item.productId]: {
                                        ...itemState,
                                        restock: e.target.checked,
                                      },
                                    }))
                                  }
                                  className="w-3.5 h-3.5 text-indigo-600 rounded-sm"
                                />
                                Restock Item
                              </label>

                              {/* Reason */}
                              <select
                                value={itemState.reason}
                                onChange={(e) =>
                                  setSelectedItems((prev) => ({
                                    ...prev,
                                    [item.productId]: {
                                      ...itemState,
                                      reason: e.target.value as any,
                                    },
                                  }))
                                }
                                className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                              >
                                <option value="customer_mind">Customer Changed Mind</option>
                                <option value="damaged">Defective / Damaged</option>
                                <option value="wrong_item">Wrong Item Supplied</option>
                                <option value="expired">Expired</option>
                                <option value="other">Other</option>
                              </select>

                              {/* Item Refund Subtotal */}
                              <div className="font-bold text-xs text-rose-600 dark:text-rose-400 font-mono-numbers">
                                -Rs {(item.unitPrice * itemState.returnQty).toLocaleString()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Refund Method & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Refund Payout Method:
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="cash">Cash Out of Drawer</option>
                    <option value="udhar_credit">Udhar Khatta Credit (Reduce Customer Udhar)</option>
                    <option value="digital">JazzCash / EasyPaisa / Bank</option>
                    <option value="card">Card Refund</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Return Notes:
                  </label>
                  <input
                    type="text"
                    placeholder="Optional notes or remarks..."
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Bottom Finalize Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/80 rounded-xl gap-4">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Refund to Pay Customer:</span>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono-numbers">
                    Rs {calculateTotalRefund().toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCompleteReturn}
                    disabled={calculateTotalRefund() === 0}
                    className="flex-1 sm:flex-none px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs transition-transform active:scale-95 disabled:opacity-50"
                  >
                    Confirm & Refund Rs {calculateTotalRefund().toLocaleString()}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Return History Tab */
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Past Returned Transactions</h3>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search returns..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                No return records found. All returns will appear here.
              </div>
            ) : (
              filteredHistory.map((ret) => (
                <div key={ret.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-600 dark:text-rose-400 font-mono-numbers">{ret.id}</span>
                      <span className="text-slate-400">• Orig: {ret.originalInvoiceNo}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {ret.refundMethod}
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {new Date(ret.date).toLocaleString()} • Processed by: {ret.processedBy} {ret.customerName ? `• Customer: ${ret.customerName}` : ''}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                      {ret.items.map((i) => `${i.quantityReturned}x ${i.name} (${i.reason})`).join(', ')}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-rose-600 dark:text-rose-400 font-mono-numbers">
                      -Rs {ret.totalRefundAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
