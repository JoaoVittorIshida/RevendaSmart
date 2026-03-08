import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Plus, Package, ChevronDown, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const Estoque = () => {
    const { produtos, itensEstoque } = useData();
    const [produtoExpandido, setProdutoExpandido] = useState(null);

    const estoqueAgrupado = produtos.map(prod => {
        const itens = itensEstoque.filter(item => item.produtoId === prod.id && item.status === 'disponivel');
        return {
            ...prod,
            itens,
            qtdDisponivel: itens.length,
            custoTotalEstoque: itens.reduce((acc, item) => acc + item.precoCusto, 0)
        };
    }).sort((a, b) => b.qtdDisponivel - a.qtdDisponivel);

    return (
        <div className="container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Estoque</h1>
                    <p className="page-subtitle">Gerencie a entrada e visualização de itens</p>
                </div>
                <Link to="/estoque/entrada" className="btn btn-primary">
                    <Plus size={18} />
                    Nova Entrada
                </Link>
            </div>

            {estoqueAgrupado.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon"><Package size={28} /></div>
                        <p className="empty-state-title">Nenhum produto cadastrado</p>
                        <p className="empty-state-subtitle">Cadastre produtos para começar a controlar seu estoque.</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {estoqueAgrupado.map(prod => (
                        <div key={prod.id} className="card p-0 overflow-hidden">
                            {/* Accordion Header */}
                            <div
                                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors duration-150"
                                onClick={() => setProdutoExpandido(produtoExpandido === prod.id ? null : prod.id)}
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    {prod.foto ? (
                                        <img src={prod.foto} className="w-14 h-14 rounded-xl object-cover shadow-sm shrink-0" alt={prod.nome} />
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                            <Package size={24} className="text-slate-400" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-800 truncate">{prod.nome}</h3>
                                        <p className="text-sm text-slate-500 font-medium">{prod.marca}
                                            {prod.categoria && <span className="ml-2"><span className="badge badge-gray">{prod.categoria}</span></span>}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 shrink-0 ml-4">
                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="stat-label">Custo em Estoque</span>
                                        <span className="font-mono font-bold text-slate-800 text-base">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.custoTotalEstoque)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center min-w-[64px]">
                                        <span className={`text-3xl font-bold ${prod.qtdDisponivel > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {prod.qtdDisponivel}
                                        </span>
                                        <span className="stat-label">Unidades</span>
                                    </div>
                                    <ChevronDown
                                        size={20}
                                        className={`text-slate-400 transition-transform duration-200 ${produtoExpandido === prod.id ? 'rotate-180' : ''}`}
                                    />
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {produtoExpandido === prod.id && (
                                <div className="bg-slate-50 border-t border-slate-100 p-5 animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="section-heading text-sm">
                                            <Tag size={15} className="text-slate-400" />
                                            Itens em Estoque
                                        </h4>
                                        <span className="text-xs text-slate-400 font-medium">Ordenado por data de entrada</span>
                                    </div>

                                    {prod.itens.length === 0 ? (
                                        <p className="text-slate-400 text-sm italic">Nenhum item em estoque.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {prod.itens.map((item, idx) => (
                                                <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl text-sm hover:border-blue-300 hover:shadow-sm transition-all duration-150">
                                                    <div className="flex items-center gap-3">
                                                        <span className="badge badge-gray font-mono text-xs">#{idx + 1}</span>
                                                        <div>
                                                            <span className="stat-label">Custo Unitário</span>
                                                            <p className="font-bold text-slate-800 font-mono">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.precoCusto)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="badge badge-blue">
                                                            {item.origem.charAt(0).toUpperCase() + item.origem.slice(1)}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(item.dataEntrada).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Estoque;
