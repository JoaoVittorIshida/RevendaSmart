import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check, X, Loader2 } from 'lucide-react';

/**
 * InlineCreate — pequeno formulário inline para criar um novo item (tag) sem sair da tela.
 *
 * Props:
 *  label      — nome da tag, ex: "Categoria"  →  botão mostra "+ Nova Categoria"
 *  onSave     — async (nome: string) => item   — deve chamar a API e retornar { id, nome }
 *  onCreated  — (item: { id, nome }) => void   — callback após salvar; use para auto-selecionar
 */
const InlineCreate = ({ label, onSave, onCreated }) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    // Foca o input quando abre
    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    const handleOpen = () => { setOpen(true); setValue(''); };

    const handleCancel = () => { setOpen(false); setValue(''); };

    const handleSave = async () => {
        const nome = value.trim();
        if (!nome) return;
        setLoading(true);
        try {
            const item = await onSave(nome);
            if (item && onCreated) onCreated(item);
            setOpen(false);
            setValue('');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
        if (e.key === 'Escape') handleCancel();
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={handleOpen}
                className="flex items-center gap-0.5 text-xs font-semibold text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
                <Plus size={12} strokeWidth={2.5} />
                Nova {label}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Nome do(a) ${label.toLowerCase()}...`}
                className="input py-1 text-sm flex-1 min-w-0"
            />
            <button
                type="button"
                onClick={handleSave}
                disabled={loading || !value.trim()}
                title="Salvar"
                className="p-1.5 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white transition-colors shrink-0"
            >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button
                type="button"
                onClick={handleCancel}
                title="Cancelar"
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-600 dark:text-slate-200 transition-colors shrink-0"
            >
                <X size={14} />
            </button>
        </div>
    );
};

export default InlineCreate;
