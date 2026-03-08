import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import { Plus, Edit2, Trash2, Search, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Produtos = () => {
    const { produtos, removerProduto } = useData();
    const navigate = useNavigate();
    const toast = useToast();
    const confirm = useConfirm();
    const [termoBusca, setTermoBusca] = useState('');

    const handleDelete = async (id, nome) => {
        const ok = await confirm({
            title: 'Excluir Produto',
            message: `Tem certeza que deseja excluir "${nome}"? Esta ação não pode ser desfeita.`,
            confirmLabel: 'Excluir',
            variant: 'danger',
        });
        if (ok) {
            removerProduto(id);
            toast.success('Produto excluído', `"${nome}" foi removido com sucesso.`);
        }
    };

    const produtosFiltrados = produtos.filter(p =>
        p.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        p.marca.toLowerCase().includes(termoBusca.toLowerCase())
    );

    return (
        <div className="container">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/cadastros" className="btn-back">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="page-title">Produtos</h1>
                        <p className="page-subtitle">Gerencie seu catálogo de produtos</p>
                    </div>
                </div>
                <Link to="/cadastros/produtos/novo" className="btn btn-primary">
                    <Plus size={20} />
                    Novo Produto
                </Link>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar produtos por nome ou marca..."
                    className="input pl-10"
                    value={termoBusca}
                    onChange={e => setTermoBusca(e.target.value)}
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {produtosFiltrados.length === 0 ? (
                    <div className="col-span-full">
                        <div className="empty-state">
                            <div className="empty-state-icon"><ImageIcon size={28} /></div>
                            <p className="empty-state-title">Nenhum produto encontrado.</p>
                        </div>
                    </div>
                ) : (
                    produtosFiltrados.map(produto => (
                        <div key={produto.id} className="card group relative flex flex-col overflow-hidden p-0 hover:shadow-lg transition-all duration-200">
                            {/* Image */}
                            <div className="h-56 w-full bg-slate-100 dark:bg-slate-700 relative shrink-0 overflow-hidden border-b border-slate-100 dark:border-slate-700">
                                {produto.foto ? (
                                    <img
                                        src={produto.foto}
                                        alt={produto.nome}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                                        {produto.categoria}
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 line-clamp-1" title={produto.nome}>
                                        {produto.nome}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                                        <span className="font-medium">{produto.marca}</span>
                                        {produto.tipo && (
                                            <>
                                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                                <span className="line-clamp-1">{produto.tipo}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <button
                                        onClick={() => navigate(`/cadastros/produtos/editar/${produto.id}`)}
                                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(produto.id, produto.nome)}
                                        className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Produtos;
