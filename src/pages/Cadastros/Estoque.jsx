import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Plus, Package, ChevronDown, ChevronUp, Save, X, ArrowDownRight, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const Estoque = () => {
    const { produtos, itensEstoque, canaisCompra, adicionarEstoqueEmLote } = useData();
    const [visibilidadeForm, setVisibilidadeForm] = useState(false);
    const [produtoExpandido, setProdutoExpandido] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        produtoId: '',
        quantidade: 1,
        custoUnitario: 0,
        custoTotal: 0,
        canalCompraId: '',
        origem: 'nacional'
    });

    // Calculo dinamico
    useEffect(() => {
        // Se mudou Qtd ou Unitario -> Atualiza Total
        setFormData(prev => {
            const novoTotal = Number(prev.quantidade) * Number(prev.custoUnitario);
            // Evita loop infinito se ja estiver correto
            if (novoTotal !== prev.custoTotal) {
                return { ...prev, custoTotal: novoTotal };
            }
            return prev;
        });
    }, [formData.quantidade, formData.custoUnitario]);

    const handleTotalChange = (novoTotal) => {
        const total = Number(novoTotal);
        const qtd = Number(formData.quantidade) || 1;
        setFormData({
            ...formData,
            custoTotal: total,
            custoUnitario: total / qtd
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        adicionarEstoqueEmLote({
            ...formData,
            precoCusto: Number(formData.custoUnitario)
        });
        setVisibilidadeForm(false);
        setFormData({
            produtoId: '',
            quantidade: 1,
            custoUnitario: 0,
            custoTotal: 0,
            canalCompraId: '',
            origem: 'nacional'
        });
        alert('Estoque adicionado com sucesso!');
    };

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
                    <h1 className="text-3xl font-bold text-white">Estoque</h1>
                    <p className="text-gray-400">Gerencie a entrada e visualização de itens</p>
                </div>
                {!visibilidadeForm && (
                    <button onClick={() => setVisibilidadeForm(true)} className="btn btn-primary">
                        <Plus size={20} />
                        Nova Entrada
                    </button>
                )}
            </div>

            {visibilidadeForm && (
                <div className="card mb-8 animate-in fade-in zoom-in duration-300 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <ArrowDownRight className="text-blue-500" />
                            Entrada de Estoque
                        </h2>
                        <button onClick={() => setVisibilidadeForm(false)} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="form-group md:col-span-3">
                                <label className="label">Produto</label>
                                <select
                                    required
                                    className="select"
                                    value={formData.produtoId}
                                    onChange={e => setFormData({ ...formData, produtoId: e.target.value })}
                                >
                                    <option value="">Selecione o produto...</option>
                                    {produtos.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome} - {p.marca}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="label">Quantidade</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="input text-center font-bold text-lg"
                                    value={formData.quantidade}
                                    onChange={e => setFormData({ ...formData, quantidade: Number(e.target.value) })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">Custo Unitário (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input"
                                    value={formData.custoUnitario}
                                    onChange={e => setFormData({ ...formData, custoUnitario: Number(e.target.value) })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label text-blue-400">Custo Total da Compra (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input border-blue-500/30 bg-blue-500/10"
                                    value={formData.custoTotal}
                                    onChange={e => handleTotalChange(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">Canal de Compra</label>
                                <select
                                    required
                                    className="select"
                                    value={formData.canalCompraId}
                                    onChange={e => setFormData({ ...formData, canalCompraId: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {canaisCompra.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="label">Origem</label>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="origem"
                                            value="nacional"
                                            checked={formData.origem === 'nacional'}
                                            onChange={() => setFormData({ ...formData, origem: 'nacional' })}
                                        /> Nacional
                                    </label>
                                    <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="origem"
                                            value="importado"
                                            checked={formData.origem === 'importado'}
                                            onChange={() => setFormData({ ...formData, origem: 'importado' })}
                                        /> Importado
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button type="submit" className="btn btn-primary px-8">
                                <Save size={18} />
                                Confirmar Entrada
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista Agrupada */}
            <div className="flex flex-col gap-4">
                {estoqueAgrupado.map(prod => (
                    <div key={prod.id} className="card p-0 overflow-hidden border-t-4 border-t-transparent hover:border-t-blue-500 transition-all">
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
                            onClick={() => setProdutoExpandido(produtoExpandido === prod.id ? null : prod.id)}
                        >
                            <div className="flex items-center gap-4">
                                {prod.foto ? (
                                    <img src={prod.foto} className="w-12 h-12 rounded object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center">
                                        <Package size={24} className="text-gray-500" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-white">{prod.nome}</h3>
                                    <span className="text-sm text-gray-400">{prod.marca} • {prod.categoria}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-right hidden md:block">
                                    <span className="block text-xs text-gray-500 uppercase">Custo em Estoque</span>
                                    <span className="font-mono text-gray-300">R$ {prod.custoTotalEstoque.toFixed(2)}</span>
                                </div>
                                <div className="text-center min-w-[60px]">
                                    <span className={`text-2xl font-bold ${prod.qtdDisponivel > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {prod.qtdDisponivel}
                                    </span>
                                    <span className="block text-xs text-gray-500">Unidades</span>
                                </div>
                                {produtoExpandido === prod.id ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
                            </div>
                        </div>

                        {/* Detalhes Expandidos */}
                        {produtoExpandido === prod.id && (
                            <div className="bg-black/20 p-4 border-t border-white/5">
                                <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Itens Individuais em Estoque</h4>
                                {prod.itens.length === 0 ? (
                                    <p className="text-gray-500 text-sm">Nenhum item em estoque.</p>
                                ) : (
                                    <div className="grid grid-col-1 gap-2">
                                        {prod.itens.map((item, idx) => (
                                            <div key={item.id} className="flex items-center justify-between p-2 bg-white/5 rounded text-sm group hover:bg-white/10">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-500 font-mono">#{idx + 1}</span>
                                                    <span className="text-gray-300">
                                                        Custo: <span className="text-white font-bold">R$ {item.precoCusto.toFixed(2)}</span>
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">
                                                        {item.origem}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-gray-400">
                                                    <span className="text-xs">
                                                        Entrada: {new Date(item.dataEntrada).toLocaleDateString()}
                                                    </span>
                                                    <Tag size={14} />
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
