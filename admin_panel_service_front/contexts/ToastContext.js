import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const success = useCallback((msg) => show(msg, 'success'), [show]);
  const error = useCallback((msg) => show(msg, 'error'), [show]);
  const info = useCallback((msg) => show(msg, 'info'), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, info }}>
      {children}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[100] max-w-sm px-4 py-3 rounded-lg shadow-lg border text-sm font-medium"
          style={{
            backgroundColor: toast.type === 'error' ? '#fef2f2' : toast.type === 'success' ? '#f0fdf4' : '#f8fafc',
            color: toast.type === 'error' ? '#b91c1c' : toast.type === 'success' ? '#15803d' : '#0f172a',
            borderColor: toast.type === 'error' ? '#fecaca' : toast.type === 'success' ? '#bbf7d0' : '#e2e8f0',
          }}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || { show: () => {}, success: () => {}, error: (m) => alert(m), info: () => {} };
}
