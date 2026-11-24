import React, { useMemo, useState } from 'react';
import {
  Activity,
  Search,
  ShoppingCart,
  Package,
  ShieldCheck,
  Store,
  Wallet,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';

type CategoryFilter = 'all' | 'sale' | 'inventory' | 'auth' | 'store' | 'finance' | 'sync';

export const ActivityLogsView: React.FC = () => {
  const { activityLogs, storeProfile } = usePos();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activityLogs.filter((entry) => {
      if (category !== 'all' && entry.category !== category) return false;
      if (!q) return true;
      return (
        entry.action.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q) ||
        entry.actorEmail.toLowerCase().includes(q) ||
        entry.actorRole.toLowerCase().includes(q)
      );
    });
  }, [activityLogs, search, category]);

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'sale':
        return <ShoppingCart className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'inventory':
        return <Package className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      case 'auth':
        return <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'store':
        return <Store className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'finance':
        return <Wallet className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      default:
        return <RefreshCw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const tabs: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'All Events' },
    { id: 'sale', label: 'Sales' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'finance', label: 'Finance' },
    { id: 'store', label: 'Stores' },
    { id: 'auth', label: 'Security' },
    { id: 'sync', label: 'Sync' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>User Activity & Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Chronological audit trail for <strong>{storeProfile.name}</strong> — isolated to this store.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by action, user, or detail..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setCategory(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer border ${
              category === t.id
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Audit Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">No activity events yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Sales completions, product updates, stock adjustments, store switches, and sync events will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-4">Event</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4">User & Role</th>
                  <th className="py-2.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                        {categoryIcon(entry.category)}
                        <span>{entry.action}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-md truncate">
                      {entry.details}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">{entry.actorEmail}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{entry.actorRole}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
