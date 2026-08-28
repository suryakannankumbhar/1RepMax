import React, { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext();

export function useUI() {
  return useContext(UIContext);
}

export function UIProvider({ children }) {
  const [toast, setToast] = useState(null); 
  const [confirmDialog, setConfirmDialog] = useState(null); 

  // Fires a sleek notification from the top of the screen
  const showAlert = useCallback((message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); // Auto-dismiss after 3 seconds
  }, []);

  // Fires a custom modal and waits for a boolean response
  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmDialog({ message, resolve });
    });
  }, []);

  const handleConfirm = (result) => {
    if (confirmDialog) {
      confirmDialog.resolve(result);
      setConfirmDialog(null);
    }
  };

  return (
    <UIContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Global Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl text-sm font-bold text-white transition-all ${
          toast.type === 'success' ? 'bg-highlight' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Global Confirm Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => handleConfirm(false)}></div>
          <div className="relative bg-surface border border-muted/20 p-6 rounded-3xl shadow-2xl max-w-xs w-full text-center scale-100 transition-transform">
            
            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
               <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            
            <h3 className="text-xl font-bold text-accent mb-2">Are you sure?</h3>
            <p className="text-sm text-muted mb-6">{confirmDialog.message}</p>
            
            <div className="flex gap-3">
              <button onClick={() => handleConfirm(false)} className="flex-1 py-3 rounded-xl font-medium text-accent bg-background border border-muted/20 hover:bg-surface/80 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleConfirm(true)} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 shadow-lg shadow-red-500/20 active:scale-95 transition-transform">
                Confirm
              </button>
            </div>

          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}