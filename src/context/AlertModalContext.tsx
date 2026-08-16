'use client';

import React, { createContext, useContext, useState } from 'react';
import { X, CheckCircle2, AlertOctagon, AlertTriangle, Info } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertData {
  title: string;
  message: string;
  type?: AlertType;
  confirmLabel?: string;
  onConfirm?: () => void;
}

interface AlertModalContextType {
  showAlert: (data: AlertData) => void;
  hideAlert: () => void;
}

const AlertModalContext = createContext<AlertModalContextType | undefined>(undefined);

export function AlertModalProvider({ children }: { children: React.ReactNode }) {
  const [activeAlert, setActiveAlert] = useState<AlertData | null>(null);

  const showAlert = (data: AlertData) => {
    setActiveAlert(data);
  };

  const hideAlert = () => {
    setActiveAlert(null);
  };

  // Helper properties based on Alert Type
  const getTypeConfig = (type: AlertType = 'info') => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6" />,
          iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          glowBg: 'bg-emerald-500/20',
          btnBg: 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500/50',
          titleDefault: 'Success',
        };
      case 'error':
        return {
          icon: <AlertOctagon className="w-6 h-6" />,
          iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          glowBg: 'bg-rose-500/20',
          btnBg: 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500/50',
          titleDefault: 'Error Occurred',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6" />,
          iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          glowBg: 'bg-amber-500/20',
          btnBg: 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500/50',
          titleDefault: 'Warning',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-6 h-6" />,
          iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
          glowBg: 'bg-indigo-500/20',
          btnBg: 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500/50',
          titleDefault: 'Information',
        };
    }
  };

  const config = activeAlert ? getTypeConfig(activeAlert.type) : null;

  return (
    <AlertModalContext.Provider value={{ showAlert, hideAlert }}>
      {children}

      {/* Global Alert Modal Overlay */}
      {activeAlert && config && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
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
                    <h3 className="text-lg font-bold text-white font-sans">
                      {activeAlert.title || config.titleDefault}
                    </h3>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                      {activeAlert.type || 'Notice'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={hideAlert}
                  className="p-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
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
        </div>
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
