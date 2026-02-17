import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { ShoppingCart, Check, ArrowRight, ArrowLeft } from 'lucide-react';

const Vendas = () => {
    const { produtos, itensEstoque, canaisVenda, venderItem } = useData();

    // Steps: 1-Product, 2-Unit, 3-Details
    const [step, setStep] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);

    const [saleData, setSaleData] = useState({
        precoVenda: '',
        canalVendaId: '',
        dataVenda: new Date().toISOString().split('T')[0]
    });

    // Filter Products with Stock
    const productsWithStock = produtos.filter(p =>
        itensEstoque.some(i => i.produtoId === p.id && i.status === 'disponivel')
    );

    // Get Units for Selected Product
    const availableUnits = selectedProduct
        ? itensEstoque.filter(i => i.produtoId === selectedProduct.id && i.status === 'disponivel')
        : [];

    const handleProductSelect = (prod) => {
        setSelectedProduct(prod);
        setStep(2);
    };

    const handleUnitSelect = (unit) => {
        setSelectedUnit(unit);
        // Suggest sale price = cost * 2 (markup 100%) just as a helper? No, leave empty.
        setSaleData(prev => ({ ...prev, precoVenda: '' }));
        setStep(3);
    };

    const handleFinishSale = async (e) => {
        e.preventDefault();
        if (!selectedUnit || !saleData.precoVenda || !saleData.canalVendaId) return;

        await venderItem(selectedUnit.id, {
            precoVenda: Number(saleData.precoVenda),
            canalVendaId: saleData.canalVendaId,
            dataVenda: saleData.dataVenda
        });

        alert('Venda registrada com sucesso!');
        resetFlow();
    };

    const resetFlow = () => {
        setStep(1);
        setSelectedProduct(null);
        setSelectedUnit(null);
        setSaleData({
            precoVenda: '',
            canalVendaId: '',
            dataVenda: new Date().toISOString().split('T')[0]
        });
    };

    return (
        <div className="container">
            <h1 className="text-3xl font-bold text-primary mb-8">Registrar Venda</h1>

            {/* Progress Bar (Simple) */}
            <div className="flex items-center gap-4 mb-8 text-sm text-secondary">
                <span className={step >= 1 ? 'text-blue-600 font-bold' : ''}>1. Selecionar Produto</span>
                <ArrowRight size={16} />
                <span className={step >= 2 ? 'text-blue-600 font-bold' : ''}>2. Selecionar Unidade</span>
                <ArrowRight size={16} />
                <span className={step >= 3 ? 'text-blue-600 font-bold' : ''}>3. Dados da Venda</span>
            </div>

            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-300" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {productsWithStock.length === 0 ? (
                        <div className="col-span-full text-center text-secondary py-12">
                            Nenhum produto com estoque disponível para venda.
                        </div>
                    ) : (
                        productsWithStock.map(prod => (
                            <div
                                key={prod.id}
                                onClick={() => handleProductSelect(prod)}
                                className="card hover:border-blue-500 cursor-pointer transition-all hover:-translate-y-1 shadow-sm hover:shadow-lg border-gray-200"
                            >
                                <div className="flex items-center gap-4">
                                    {prod.foto ? (
                                        <img src={prod.foto} className="w-16 h-16 rounded object-cover" />
                                    ) : (
                                        <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center">
                                            <ShoppingCart size={24} className="text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-primary">{prod.nome}</h3>
                                        <p className="text-sm text-secondary">{prod.marca}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {step === 2 && selectedProduct && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => setStep(1)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-700 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-6">
                        Qual unidade de <span className="text-blue-600">{selectedProduct.nome}</span> foi vendida?
                    </h2>

                    <div className="flex flex-col gap-3">
                        {availableUnits.map((unit, idx) => (
                            <div
                                key={unit.id}
                                onClick={() => handleUnitSelect(unit)}
                                className="card p-4 flex items-center justify-between cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-colors border-gray-200"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm font-bold">#{idx + 1}</span>
                                    <div>
                                        <p className="text-sm text-secondary">Origem: <span className="text-primary capitalize font-medium">{unit.origem}</span></p>
                                        <p className="text-sm text-secondary">Entrada: {new Date(unit.dataEntrada).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-secondary uppercase">Custo</span>
                                    <span className="text-lg font-mono text-primary font-bold">R$ {unit.precoCusto.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 3 && selectedUnit && (
                <div className="max-w-xl mx-auto animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => setStep(2)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-700 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                    <div className="card border-blue-200 shadow-md">
                        <div className="text-center mb-6 pb-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-primary">Finalizar Venda</h2>
                            <p className="text-secondary mt-2">
                                {selectedProduct.nome} <span className="mx-2">•</span> Custo: R$ {selectedUnit.precoCusto.toFixed(2)}
                            </p>
                        </div>

                        <form onSubmit={handleFinishSale}>
                            <div className="form-group">
                                <label className="label">Valor da Venda (R$)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="input text-lg font-bold text-green-600"
                                    placeholder="0.00"
                                    value={saleData.precoVenda}
                                    onChange={e => setSaleData({ ...saleData, precoVenda: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">Canal de Venda</label>
                                <select
                                    required
                                    className="select"
                                    value={saleData.canalVendaId}
                                    onChange={e => setSaleData({ ...saleData, canalVendaId: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {canaisVenda.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="label">Data da Venda</label>
                                <input
                                    required
                                    type="date"
                                    className="input"
                                    value={saleData.dataVenda}
                                    onChange={e => setSaleData({ ...saleData, dataVenda: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-full mt-6 py-4 text-lg shadow-lg shadow-blue-500/20">
                                <Check size={24} />
                                Confirmar Venda
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendas;
