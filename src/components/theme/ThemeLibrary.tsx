import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { SaaSThemePreset } from '../../types';
import {
  Palette,
  Check,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Monitor,
  Eye,
  Sliders,
  Store,
  Layers,
  Crown,
  Zap,
} from 'lucide-react';

export const ThemeLibrary: React.FC = () => {
  const { saasThemes, activeThemeId, setActiveThemeId, theme, toggleTheme } = usePos();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyTheme = (themeId: string, themeName: string) => {
    setActiveThemeId(themeId);
    showToast(`"${themeName}" theme applied successfully!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-500/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                SaaS Program Theme & Design Library
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-urdu mt-0.5">
                متعدد پریمیم ڈیزائنز: ایمرلڈ ریٹیل، مڈ نائٹ سائبر، رائل کارپوریٹ، اور ہائی کنٹراسٹ
              </div>
            </div>
          </div>
        </div>

        {/* Light / Dark Mode Toggle */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center space-x-2 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Switch to Light Canvas</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Switch to Dark Canvas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Active Theme Display & Dynamic Showcase Banner */}
      {(() => {
        const activeThemeObj = saasThemes.find((t) => t.id === activeThemeId) || saasThemes[0];
        return (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: activeThemeObj.primaryColor }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  ACTIVE LIVE SYSTEM THEME
                </span>
              </div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>{activeThemeObj.name}</span>
                <span className="text-xs font-normal text-slate-400">({activeThemeObj.tagline})</span>
              </h3>
              <p className="text-xs text-slate-400">
                All navigation indicators, buttons, active pills, badges, and accents across the application update in real time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400">Live Styling:</span>
              <span className="theme-active-nav px-3 py-1 rounded-lg text-xs font-bold shadow-xs">
                Active Nav Pill
              </span>
              <button
                type="button"
                className="theme-primary-btn px-3 py-1 rounded-lg text-xs font-bold shadow-xs"
              >
                Action Button
              </button>
              <span className="theme-accent-badge text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                Glow Accent
              </span>
            </div>
          </div>
        );
      })()}

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {saasThemes.map((preset) => {
          const isActive = preset.id === activeThemeId;

          return (
            <div
              key={preset.id}
              className={`rounded-3xl border transition-all overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-white dark:bg-slate-900 border-2 shadow-2xl ring-4 ring-offset-2'
                  : 'bg-white/90 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
              style={{
                borderColor: isActive ? preset.primaryColor : undefined,
              }}
            >
              {/* Card Header & Preview Banner */}
              <div>
                <div
                  className={`h-24 bg-gradient-to-r ${preset.gradient} p-4 flex flex-col justify-between text-white relative`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-xs">
                      {preset.id.replace('theme-', '')}
                    </span>
                    {isActive ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white text-slate-950 flex items-center gap-1 shadow-md animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ACTIVE THEME
                      </span>
                    ) : preset.isPopular ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Popular
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <div className="font-black text-sm tracking-tight drop-shadow-xs">{preset.name}</div>
                    <div className="text-[11px] text-white/80 drop-shadow-xs">{preset.tagline}</div>
                  </div>
                </div>

                {/* Simulated UI Preview Box */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
                  <div className="rounded-xl p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                        <span className="text-[10px] font-bold font-mono">POS Counter #1</span>
                      </div>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.2 rounded"
                        style={{
                          backgroundColor: `${preset.primaryColor}20`,
                          color: preset.primaryColor,
                        }}
                      >
                        Live Terminal
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <span className="text-slate-400">Total Bill:</span>
                      <span className="font-bold font-mono" style={{ color: preset.primaryColor }}>
                        Rs. 18,500
                      </span>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center space-x-1.5 pt-1">
                      <span className="text-[9px] text-slate-400">Palette:</span>
                      <div
                        className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                        style={{ backgroundColor: preset.primaryColor }}
                        title="Primary Color"
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                        style={{ backgroundColor: preset.secondaryColor }}
                        title="Secondary Canvas"
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                        style={{ backgroundColor: preset.accentColor }}
                        title="Accent Glow"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 pt-0">
                <button
                  type="button"
                  onClick={() => handleApplyTheme(preset.id, preset.name)}
                  style={{
                    backgroundColor: isActive ? undefined : preset.primaryColor,
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm hover:opacity-90 ${
                    isActive
                      ? 'bg-slate-900 dark:bg-slate-800 text-white cursor-default ring-1 ring-white/20'
                      : 'text-white'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Currently Applied (Active)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>Apply {preset.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
