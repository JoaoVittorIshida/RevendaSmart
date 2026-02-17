import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Plus, Package, ChevronDown, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const Estoque = () => {
    const { produtos, itensEstoque } = useData();
    const [produtoExpandido, setProdutoExpandido] = useState(null);

    // Agrupamento
    const estoqueAgrupado = produtos.map(prod => {
        const itens = itensEstoque.filter(item => item.produtoId === prod.id && item.status === 'disponivel');
        return {
            ...prod,
            itens,
            qtdDisponivel: itens.length,
            custoTotalEstoque: itens.reduce((acc, item) => acc + item.precoCusto, 0)
        };
    }).sort((a, b) => b.qtdDisponivel - a.qtdDisponivel); // Ordena por maior estoque

    return (
        <div className="container">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Estoque</h1>
                    <p className="text-secondary">Gerencie a entrada e visualização de itens</p>
                </div>
                <Link to="/estoque/entrada" className="btn btn-primary">
                    <Plus size={20} />
                    Nova Entrada
                </Link>
            </div>

            {/* Lista Agrupada */}
            <div className="flex flex-col gap-4">
                {estoqueAgrupado.map(prod => (
                    <div key={prod.id} className="card p-0 overflow-hidden border-t-4 border-t-transparent hover:border-t-blue-600 transition-all shadow-sm hover:shadow-md">
                        <div
                            className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setProdutoExpandido(produtoExpandido === prod.id ? null : prod.id)}
                        >
                            <div className="flex items-center gap-6">
                                {prod.foto ? (
                                    <img src={prod.foto} className="w-16 h-16 rounded-lg object-cover shadow-sm" />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Package size={28} className="text-gray-400" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-bold text-primary">{prod.nome}</h3>
                                    <span className="text-sm text-secondary font-medium">{prod.marca} • {prod.categoria}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 md:gap-12 bg-gray-50/50 p-2 rounded-lg border border-transparent md:border-gray-100">
                                <div className="text-right hidden md:block pr-4 border-r border-gray-200">
                                    <span className="block text-xs text-secondary uppercase font-semibold tracking-wider">Custo em Estoque</span>
                                    <span className="font-mono text-primary font-bold text-lg">R$ {prod.custoTotalEstoque.toFixed(2)}</span>
                                </div>
                                <div className="text-center min-w-[80px]">
                                    <span className={`text-3xl font-bold ${prod.qtdDisponivel > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {prod.qtdDisponivel}
                                    </span>
                                    <span className="block text-xs text-secondary font-medium uppercase mt-1">Unidades</span>
                                </div>
                                <div className={`transition-transform duration-200 ${produtoExpandido === prod.id ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="text-gray-400" size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Detalhes Expandidos */}
                        {produtoExpandido === prod.id && (
                            <div className="bg-gray-50 p-6 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                                        <Tag size={16} />
                                        Itens Individuais em Estoque
                                    </h4>
                                    <span className="text-xs text-gray-400 font-medium">Ordenado por data de entrada</span>
                                </div>
                                {prod.itens.length === 0 ? (
                                    <p className="text-secondary text-sm italic">Nenhum item em estoque.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {prod.itens.map((item, idx) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg text-sm group hover:border-blue-300 shadow-sm transition-all hover:-translate-y-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-gray-100 text-gray-500 font-mono text-xs px-2 py-1 rounded">#{idx + 1}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-secondary text-xs">Custo Unitário</span>
                                                        <span className="text-primary font-bold text-base">R$ {item.precoCusto.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-100 font-bold tracking-wide">
                                                        {item.origem.charAt(0).toUpperCase() + item.origem.slice(1)}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(item.dataEntrada).toLocaleDateString()}
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
        </div>
    );
};


export default Estoque;
