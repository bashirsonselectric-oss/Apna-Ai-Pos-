import React, { useState } from 'react';
import {
  Search,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  Building2,
  Moon,
  Sun,
  User,
  Bell,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { usePos } from '../../context/PosContext';

interface AppLayoutProps {
  children: React.ReactNode;
  activeNav?: string;
  onNavigate?: (tab: string) => void;
  title?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeNav = 'dashboard',
  onNavigate,
  title = 'Apna SaaS POS',
}) => {
  const { theme, toggleTheme, userSession, storeProfile } = usePos();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Terminal', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'branches', label: 'Branch Khatta', icon: Building2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectNav = (id: string) => {
    if (onNavigate) {
      onNavigate(id);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0e0f17] text-white flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* 1. PERSISTENT TOP HEADER BAR (Glassmorphism & Neon Purple Accents) */}
      <header className="sticky top-0 z-40 bg-[#13141f]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 h-16 flex items-center justify-between shadow-2xl">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-purple-600/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-white">
                  Apna AI POS
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  SaaS Pro
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                {storeProfile.name}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search Field */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items, invoices, customers, or branches (Ctrl + K)..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 hover:bg-white/8 focus:bg-[#181926] border border-white/10 focus:border-purple-500/80 rounded-2xl text-xs text-white placeholder-slate-400 outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Right: Theme Switcher, Quick Action, Profile Dropdown */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-purple-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* User Profile Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-white">
                {userSession.displayName ? userSession.displayName.charAt(0) : 'B'}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-white truncate max-w-[100px]">
                {userSession.displayName ? userSession.displayName.split(' ')[0] : 'Bashir'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-3xl bg-[#171825] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-2.5 border-b border-white/5">
                  <p className="text-xs font-bold text-white truncate">
                    {userSession.displayName || 'Muhammad Bashir'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {userSession.email || 'bashirsonselectric@gmail.com'}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleSelectNav('settings');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-purple-400" />
                    <span>Store Settings & QR</span>
                  </button>
                  <button
                    onClick={() => {
                      handleSelectNav('branches');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Branch Management</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. BODY: PERSISTENT SIDEBAR NAVIGATION & MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside
          className={`fixed md:sticky top-16 z-30 h-[calc(100vh-4rem)] bg-[#13141f]/95 md:bg-[#13141f]/80 backdrop-blur-2xl border-r border-white/10 transition-all duration-300 flex flex-col justify-between p-3.5 ${
            sidebarOpen ? 'left-0 w-64' : '-left-full md:left-0 md:w-20 lg:w-60'
          }`}
        >
          {/* Main Navigation List */}
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-500 hidden lg:block">
              Main Menu
            </div>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/40 ring-1 ring-purple-400/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110 text-white' : 'group-hover:scale-105'}`} />
                  <span className="truncate md:hidden lg:inline">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 ml-auto md:hidden lg:inline animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Upgrade / Plan Indicator */}
          <div className="bg-gradient-to-br from-purple-900/30 to-indigo-950/40 rounded-2xl p-3 border border-purple-500/20 text-center hidden lg:block">
            <span className="text-[11px] font-bold text-purple-300 block">GoDigly Cloud POS</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Multi-Branch Running</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between">
          <main className="p-4 sm:p-6 lg:p-8 flex-1">
            {children}
          </main>

          {/* 3. CLEAN, MINIMAL PERSISTENT FOOTER */}
          <footer className="border-t border-white/5 bg-[#10111a]/80 backdrop-blur-md py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-400">Apna AI POS</span>
              <span>•</span>
              <span>Obsidian Purple Glassmorphism Suite</span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Backend SQLite/Prisma Active
              </span>
              <span>•</span>
              <span>v4.2 Production</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
