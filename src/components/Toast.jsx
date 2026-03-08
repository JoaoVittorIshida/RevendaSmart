import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};

let idCounter = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
        const id = ++idCounter;
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (title, message) => addToast({ type: 'success', title, message }),
        error: (title, message) => addToast({ type: 'error', title, message }),
        warning: (title, message) => addToast({ type: 'warning', title, message }),
        info: (title, message) => addToast({ type: 'info', title, message }),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

const icons = {
    success: <CheckCircle size={20} className="shrink-0" />,
    error: <XCircle size={20} className="shrink-0" />,
    warning: <AlertTriangle size={20} className="shrink-0" />,
    info: <Info size={20} className="shrink-0" />,
};

const styles = {
    success: 'bg-white dark:bg-slate-800 border-green-500  text-green-700  dark:text-green-400  [&_.toast-icon]:text-green-500',
    error: 'bg-white dark:bg-slate-800 border-red-500    text-red-700    dark:text-red-400    [&_.toast-icon]:text-red-500',
    warning: 'bg-white dark:bg-slate-800 border-orange-400 text-orange-700 dark:text-orange-400 [&_.toast-icon]:text-orange-400',
    info: 'bg-white dark:bg-slate-800 border-blue-500   text-blue-700   dark:text-blue-400   [&_.toast-icon]:text-blue-500',
};

const ToastItem = ({ toast, onRemove }) => (
    <div className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border-l-4 shadow-lg min-w-[300px] max-w-sm animate-in slide-in-from-right-4 duration-300 ${styles[toast.type]}`}>
        <span className="toast-icon mt-0.5">{icons[toast.type]}</span>
        <div className="flex-1 min-w-0">
            {toast.title && <p className="font-semibold text-sm leading-tight">{toast.title}</p>}
            {toast.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{toast.message}</p>}
        </div>
        <button
            onClick={() => onRemove(toast.id)}
            className="text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 transition-colors shrink-0 mt-0.5"
        >
            <X size={16} />
        </button>
    </div>
);

const ToastContainer = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;
    return (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2">
            {toasts.map(t => (
                <ToastItem key={t.id} toast={t} onRemove={onRemove} />
            ))}
        </div>
    );
};
