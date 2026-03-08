import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider');
    return ctx;
};

export const ConfirmProvider = ({ children }) => {
    const [dialog, setDialog] = useState(null);

    const confirm = useCallback(({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'danger' }) => {
        return new Promise((resolve) => {
            setDialog({ title, message, confirmLabel, cancelLabel, variant, resolve });
        });
    }, []);

    const close = (result) => {
        dialog?.resolve(result);
        setDialog(null);
    };

    const btnVariants = {
        danger: 'bg-red-600 hover:bg-red-700 text-white',
        warning: 'bg-orange-500 hover:bg-orange-600 text-white',
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}

            {dialog && (
                <div
                    className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50"
                    onClick={() => close(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between p-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${dialog.variant === 'danger' ? 'bg-red-50 text-red-500' :
                                        dialog.variant === 'warning' ? 'bg-orange-50 text-orange-500' :
                                            'bg-blue-50 text-blue-500'
                                    }`}>
                                    <AlertTriangle size={20} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-base">{dialog.title}</h3>
                            </div>
                            <button
                                onClick={() => close(false)}
                                className="text-slate-300 hover:text-slate-500 transition-colors -mt-1 -mr-1 p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {dialog.message && (
                            <p className="px-6 pb-5 text-sm text-slate-500 leading-relaxed">{dialog.message}</p>
                        )}

                        <div className="flex gap-3 p-4 pt-0">
                            <button
                                onClick={() => close(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200"
                            >
                                {dialog.cancelLabel}
                            </button>
                            <button
                                onClick={() => close(true)}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm ${btnVariants[dialog.variant] || btnVariants.primary}`}
                            >
                                {dialog.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};
