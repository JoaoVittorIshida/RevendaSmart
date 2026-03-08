import React, { useState } from 'react';
import { Trash2, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

const CrudBase = ({ title, items, onAdd, onRemove, backPath = '/cadastros' }) => {
    const [novoItem, setNovoItem] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const confirm = useConfirm();

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!novoItem.trim()) return;
        setLoading(true);
        await onAdd(novoItem);
        toast.success('Item adicionado!', `"${novoItem}" foi cadastrado.`);
        setNovoItem('');
        setLoading(false);
    };

    const handleRemove = async (item) => {
        const ok = await confirm({
            title: 'Remover Item',
            message: `Deseja remover "${item.nome}"? Esta ação não pode ser desfeita.`,
            confirmLabel: 'Remover',
            variant: 'danger',
        });
        if (ok) {
            onRemove(item.id);
            toast.success('Item removido', `"${item.nome}" foi removido com sucesso.`);
        }
    };

    return (
        <div className="container">
            <div className="flex items-center gap-4 mb-8">
                <Link to={backPath} className="btn-back">
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="page-title">{title}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form */}
                <div className="card h-fit">
                    <h2 className="section-heading mb-5">Adicionar Novo</h2>
                    <form onSubmit={handleAdd}>
                        <div className="form-group">
                            <label className="label">Nome</label>
                            <input
                                type="text"
                                className="input"
                                value={novoItem}
                                onChange={(e) => setNovoItem(e.target.value)}
                                placeholder="Ex: Novo Item..."
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-full" disabled={loading || !novoItem.trim()}>
                            {loading
                                ? <Loader2 size={18} className="animate-spin" />
                                : <Plus size={18} />
                            }
                            {loading ? 'Adicionando...' : 'Adicionar'}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="card">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="section-heading">Lista de Itens</h2>
                        <span className="badge badge-gray">{items.length}</span>
                    </div>
                    {items.length === 0 ? (
                        <div className="empty-state py-8">
                            <p className="empty-state-title">Nenhum item cadastrado</p>
                            <p className="empty-state-subtitle">Use o formulário ao lado para adicionar.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors group">
                                    <span className="font-semibold text-slate-700">{item.nome}</span>
                                    <button
                                        onClick={() => handleRemove(item)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                        title="Remover"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CrudBase;
