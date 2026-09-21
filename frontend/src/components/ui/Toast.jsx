import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext(undefined);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => {
      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      return [...prev, { id, message, type }];
    });

    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) =>
        <div
          key={toast.id}
          className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-lg shadow-lg border flex items-center justify-between gap-3 animate-in slide-in-from-right-full transition-all ${
          toast.type === 'success' ? 'bg-white border-green-200 text-green-800' :
          toast.type === 'error' ? 'bg-white border-red-200 text-red-800' :
          'bg-white border-blue-200 text-blue-800'}`
          }>
          
            <div className="flex items-center gap-3">
              {toast.type === 'success' && <CheckCircle className="text-green-500" size={20} />}
              {toast.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
              {toast.type === 'info' && <Info className="text-blue-500" size={20} />}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600">
            
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>);

}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}