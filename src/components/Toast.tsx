import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
  };
  toasts: ToastMessage[];
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message, duration };
    
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }, [dismiss]);

  const toast = React.useMemo(() => ({
    success: (message: string, title?: string) => addToast('success', message, title),
    error: (message: string, title?: string) => addToast('error', message, title),
    info: (message: string, title?: string) => addToast('info', message, title),
    warning: (message: string, title?: string) => addToast('warning', message, title),
  }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          // Icon configuration
          let Icon = Info;
          let iconColor = 'text-blue-600';
          let bgColor = 'bg-blue-50';
          let borderColor = 'border-blue-100';
          let progressBg = 'bg-blue-500';

          if (t.type === 'success') {
            Icon = CheckCircle2;
            iconColor = 'text-emerald-600';
            bgColor = 'bg-emerald-50';
            borderColor = 'border-emerald-100';
            progressBg = 'bg-emerald-500';
          } else if (t.type === 'error') {
            Icon = AlertCircle;
            iconColor = 'text-rose-600';
            bgColor = 'bg-rose-50';
            borderColor = 'border-rose-100';
            progressBg = 'bg-rose-500';
          } else if (t.type === 'warning') {
            Icon = AlertTriangle;
            iconColor = 'text-amber-600';
            bgColor = 'bg-amber-50';
            borderColor = 'border-amber-100';
            progressBg = 'bg-amber-500';
          }

          return (
            <div
              key={t.id}
              className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl ring-1 ring-black/5 transition-all duration-300 animate-slide-in"
              style={{
                animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              <div className="flex items-start p-4 gap-3">
                <div className={`shrink-0 rounded-lg p-1.5 ${bgColor} ${borderColor} border`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                
                <div className="flex-1 pt-0.5">
                  {t.title && (
                    <h3 className="text-xs font-semibold text-slate-900 leading-tight">
                      {t.title}
                    </h3>
                  )}
                  <p className="text-xs font-medium text-slate-600 leading-relaxed mt-0.5">
                    {t.message}
                  </p>
                </div>

                <button
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress visual timer bar */}
              <div className="h-1 bg-slate-50 w-full overflow-hidden">
                <div 
                  className={`h-full ${progressBg}`}
                  style={{
                    animation: `shrinkWidth ${t.duration || 4000}ms linear forwards`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(-1rem) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}
