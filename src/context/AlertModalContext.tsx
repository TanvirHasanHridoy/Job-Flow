'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import Dialog from '@/app/components/Dialog';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertData {
  title: string;
  message: string;
  type?: AlertType;
  confirmLabel?: string;
  onConfirm?: () => void;
  /**
   * Force a blocking modal even for a success message. By default a success
   * alert without an `onConfirm` callback is shown as a non-blocking toast.
   */
  blocking?: boolean;
}

interface ToastData {
  id: number;
  title: string;
  message: string;
  type: AlertType;
}

interface AlertModalContextType {
  showAlert: (data: AlertData) => void;
  hideAlert: () => void;
  /** Non-blocking notification that disappears by itself. */
  showToast: (data: Omit<ToastData, 'id' | 'type'> & { type?: AlertType }) => void;
}

const AlertModalContext = createContext<AlertModalContextType | undefined>(undefined);

const TOAST_DURATION_MS = 3500;

// Helper properties based on Alert Type
const getTypeConfig = (type: AlertType = 'info') => {
  switch (type) {
    case 'success':
      return {
        icon: <CheckCircle2 className="w-6 h-6" aria-hidden="true" />,
        smallIcon: <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />,
        iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        glowBg: 'bg-emerald-500/20',
        btnBg: 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500/50',
        titleDefault: 'Success',
      };
    case 'error':
      return {
        icon: <AlertOctagon className="w-6 h-6" aria-hidden="true" />,
        smallIcon: <AlertOctagon className="w-5 h-5 text-rose-400" aria-hidden="true" />,
        iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        glowBg: 'bg-rose-500/20',
        btnBg: 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500/50',
        titleDefault: 'Error Occurred',
      };
    case 'warning':
      return {
        icon: <AlertTriangle className="w-6 h-6" aria-hidden="true" />,
        smallIcon: <AlertTriangle className="w-5 h-5 text-amber-400" aria-hidden="true" />,
        iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        glowBg: 'bg-amber-500/20',
        btnBg: 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500/50',
        titleDefault: 'Warning',
      };
    case 'info':
    default:
      return {
        icon: <Info className="w-6 h-6" aria-hidden="true" />,
        smallIcon: <Info className="w-5 h-5 text-indigo-400" aria-hidden="true" />,
        iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
        glowBg: 'bg-indigo-500/20',
        btnBg: 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500/50',
        titleDefault: 'Information',
      };
  }
};

export function AlertModalProvider({ children }: { children: React.ReactNode }) {
  const [activeAlert, setActiveAlert] = useState<AlertData | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const nextToastId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback<AlertModalContextType['showToast']>(({ title, message, type = 'success' }) => {
    const id = nextToastId.current++;
    // Keep at most 3 toasts on screen at once.
    setToasts(prev => [...prev.slice(-2), { id, title, message, type }]);
    timers.current.set(id, setTimeout(() => dismissToast(id), TOAST_DURATION_MS));
  }, [dismissToast]);

  const showAlert = useCallback((data: AlertData) => {
    // A plain success confirmation doesn't need to block the user: show a toast.
    if (data.type === 'success' && !data.onConfirm && !data.blocking) {
      showToast({ title: data.title, message: data.message, type: 'success' });
      return;
    }
    setActiveAlert(data);
  }, [showToast]);

  const hideAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach(t => clearTimeout(t));
      map.clear();
    };
  }, []);

  const config = activeAlert ? getTypeConfig(activeAlert.type) : null;

  return (
    <AlertModalContext.Provider value={{ showAlert, hideAlert, showToast }}>
      {children}

      {/* Toast stack (non-blocking) */}
      <div
        className="no-print fixed z-[100000] left-1/2 -translate-x-1/2 bottom-24 lg:bottom-6 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {toasts.map(t => {
          const tc = getTypeConfig(t.type);
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-md shadow-2xl px-4 py-3 text-left animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <span className="mt-0.5 shrink-0">{tc.smallIcon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{t.title || tc.titleDefault}</p>
                {t.message && <p className="text-sm text-zinc-300 leading-snug">{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 p-1 -m-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Global Alert Modal Overlay */}
      {activeAlert && config && (
        <Dialog
          onClose={hideAlert}
          labelledBy="global-alert-title"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
        >
          {/* Modal Backdrop click handler */}
          <div className="absolute inset-0" onClick={hideAlert} />

          {/* Modal Card */}
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl glass-panel border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 bg-zinc-900/90 text-left z-10">

            {/* Ambient Background Glow */}
            <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full ${config.glowBg} blur-3xl pointer-events-none`} />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

            <div className="p-6 relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${config.iconBg}`}>
                    {config.icon}
                  </div>
                  <div>
                    <h3 id="global-alert-title" className="text-lg font-bold text-white font-sans">
                      {activeAlert.title || config.titleDefault}
                    </h3>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                      {activeAlert.type || 'Notice'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={hideAlert}
                  aria-label="Close"
                  className="p-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* Message */}
              <div className="mb-6 text-sm text-zinc-300 font-sans leading-relaxed whitespace-pre-line">
                {activeAlert.message}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (activeAlert.onConfirm) {
                      activeAlert.onConfirm();
                    }
                    hideAlert();
                  }}
                  className={`w-full py-3 px-4 font-semibold text-sm text-white rounded-xl ${config.btnBg} hover:scale-[1.01] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2`}
                >
                  {activeAlert.confirmLabel || 'OK'}
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </AlertModalContext.Provider>
  );
}

export function useAlertModal() {
  const context = useContext(AlertModalContext);
  if (context === undefined) {
    throw new Error('useAlertModal must be used within an AlertModalProvider');
  }
  return context;
}
