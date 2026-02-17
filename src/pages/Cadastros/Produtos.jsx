import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Edit2, Trash2, Search, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Produtos = () => {
    const { produtos, removerProduto } = useData();
    const navigate = useNavigate();
    const [termoBusca, setTermoBusca] = useState('');

    const handleDelete = (id) => {
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            removerProduto(id);
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
                    <Link to="/cadastros" className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-700 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-primary">Produtos</h1>
                        <p className="text-secondary">Gerencie seu catálogo de produtos</p>
                    </div>
                </div>

                <Link
                    to="/cadastros/produtos/novo"
                    className="btn btn-primary"
                >
                    <Plus size={20} />
                    Novo Produto
                </Link>
            </div>

            {/* Lista de Produtos (Sempre Visível) */}
            <div>
                {/* Search Bar */}
                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar produtos por nome ou marca..."
                        className="input pl-10"
                        style={{ paddingLeft: '2.5rem' }}
                        value={termoBusca}
                        onChange={e => setTermoBusca(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {produtosFiltrados.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-secondary">
                            Nenhum produto encontrado.
                        </div>
                    ) : (
                        produtosFiltrados.map(produto => (
                            <div key={produto.id} className="card group relative flex flex-col border-gray-200 shadow-sm hover:shadow-lg transition-all h-full bg-white overflow-hidden p-0">
                                {/* Image Container - Fixed Height */}
                                <div className="h-56 w-full bg-gray-100 relative shrink-0 overflow-hidden border-b border-gray-100">
                                    {produto.foto ? (
                                        <img
                                            src={produto.foto}
                                            alt={produto.nome}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                            <ImageIcon size={48} />
                                        </div>
                                    )}
                                </div>

                                {/* Card Content */}
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex-1">
                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">{produto.categoria}</span>
                                        <h3 className="text-lg font-bold text-primary mb-1 line-clamp-1" title={produto.nome}>{produto.nome}</h3>
                                        <div className="flex items-center gap-2 text-sm text-secondary mb-3">
                                            <span className="font-medium">{produto.marca}</span>
                                            {produto.tipo && (
                                                <>
                                                    <span className="text-gray-300">•</span>
                                                    <span className="text-gray-500 line-clamp-1">{produto.tipo}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions Footer */}
                                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => navigate(`/cadastros/produtos/editar/${produto.id}`)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(produto.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
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
        </div>
    );
};

export default Produtos;
