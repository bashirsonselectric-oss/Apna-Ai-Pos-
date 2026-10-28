import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Apna POS App crashed:', error, errorInfo);
  }

  handleReset = () => {
    try {
      // Clear potentially corrupted tenant storage keys
      const keysToPreserve = ['apna_pos_theme'];
      Object.keys(localStorage).forEach((key) => {
        if (!keysToPreserve.includes(key)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-white">Apna POS Recovery</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected initialization error occurred. This can happen if stale browser cache or local storage keys are out of sync.
            </p>
            {this.state.error && (
              <div className="p-3 bg-slate-950/70 rounded-xl text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-32 border border-slate-800">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
              >
                Clear Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// In development, unregister service workers and purge caches to avoid Vite HMR/dependency cache collisions
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key);
        }
      });
    }
  } else {
    // Production PWA registration safely using relative path
    window.addEventListener('load', () => {
      try {
        const swUrl = new URL('sw.js', window.location.href).href;
        navigator.serviceWorker
          .register(swUrl)
          .then((reg) => {
            console.log('Apna POS Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('Service Worker registration skipped/failed:', err);
          });
      } catch (e) {
        console.warn('SW registration bypassed:', e);
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
