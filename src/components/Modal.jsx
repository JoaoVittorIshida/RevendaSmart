import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-4xl' }) => {
    const titleId = useId();

    useEffect(() => {
        if (!isOpen) return undefined;
        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
                className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 p-3 backdrop-blur-sm animate-in fade-in sm:items-center sm:p-4"
            onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`w-full min-w-0 ${maxWidth} max-h-[calc(100dvh-1.5rem)] sm:max-h-[92dvh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 animate-in zoom-in`}
            >
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-700 shrink-0">
                    <h2 id={titleId} className="text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                    className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                        aria-label="Fechar modal"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="min-w-0 overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
