import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../components/Toast';
import { ShoppingCart, Check, ArrowLeft, Package } from 'lucide-react';

const Vendas = () => {
    const { produtos, itensEstoque, canaisVenda, venderItem } = useData();
    const toast = useToast();

    const [step, setStep] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);

    const getLocalDate = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const [saleData, setSaleData] = useState({
        precoVenda: '',
        canalVendaId: '',
        dataVenda: getLocalDate()
    });

    const productsWithStock = produtos.filter(p =>
        itensEstoque.some(i => i.produtoId === p.id && i.status === 'disponivel')
    );

    const availableUnits = selectedProduct
        ? itensEstoque.filter(i => i.produtoId === selectedProduct.id && i.status === 'disponivel')
        : [];

    const handleProductSelect = (prod) => { setSelectedProduct(prod); setStep(2); };
    const handleUnitSelect = (unit) => { setSelectedUnit(unit); setSaleData(prev => ({ ...prev, precoVenda: '' })); setStep(3); };

    const handleFinishSale = async (e) => {
        e.preventDefault();
        if (!selectedUnit || !saleData.precoVenda || !saleData.canalVendaId) return;

        const currentDate = new Date();
        const [year, month, day] = saleData.dataVenda.split('-');
        currentDate.setFullYear(year, month - 1, day);

        await venderItem(selectedUnit.id, {
            precoVenda: Number(saleData.precoVenda),
            canalVendaId: saleData.canalVendaId,
            dataVenda: currentDate.toISOString()
        });

        toast.success('Venda registrada!', `${selectedProduct.nome} vendido com sucesso.`);
        resetFlow();
    };

    const resetFlow = () => {
        setStep(1);
        setSelectedProduct(null);
        setSelectedUnit(null);
        setSaleData({ precoVenda: '', canalVendaId: '', dataVenda: getLocalDate() });
    };

    const steps = [
        { n: 1, label: 'Produto' },
        { n: 2, label: 'Unidade' },
        { n: 3, label: 'Finalizar' },
    ];

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="container max-w-6xl">
            <h1 className="page-title mb-6">Registrar Venda</h1>

            {/* Progress Stepper — symmetric grid */}
            <div className="grid grid-cols-[1fr_80px_1fr_80px_1fr] items-center mb-10 max-w-lg">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.n}>
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step > s.n ? 'bg-green-500 text-white shadow-sm' :
                                step === s.n ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100' :
                                    'bg-slate-200 text-slate-400'
                                }`}>
                                {step > s.n ? <Check size={16} /> : s.n}
                            </div>
                            <span className={`text-xs font-semibold text-center ${step === s.n ? 'text-blue-600' : step > s.n ? 'text-green-600' : 'text-slate-400'
                                }`}>
                                {s.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`h-0.5 w-full mb-4 transition-colors duration-300 ${step > s.n ? 'bg-green-400' : 'bg-slate-200'
                                }`} />
                        )}
                    </React.Fragment>
                ))}
            </div>


            {/* Step 1: Select Product */}
            {step === 1 && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    {productsWithStock.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <div className="empty-state-icon"><Package size={28} /></div>
                                <p className="empty-state-title">Nenhum produto em estoque</p>
                                <p className="empty-state-subtitle">Registre entradas no estoque para poder realizar vendas.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {productsWithStock.map(prod => (
                                <div
                                    key={prod.id}
                                    onClick={() => handleProductSelect(prod)}
                                    className="card cursor-pointer hover:border-blue-400 hover:-translate-y-1 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex items-center gap-4">
                                        {prod.foto ? (
                                            <img src={prod.foto} className="w-14 h-14 rounded-xl object-cover shrink-0" alt={prod.nome} />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                                <ShoppingCart size={22} className="text-slate-400" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-800 truncate">{prod.nome}</h3>
                                            <p className="text-sm text-slate-500 font-medium">{prod.marca}</p>
                                            <span className="badge badge-green mt-1">
                                                {itensEstoque.filter(i => i.produtoId === prod.id && i.status === 'disponivel').length} un.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Select Unit */}
            {step === 2 && selectedProduct && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setStep(1)} className="btn-back">
                            <ArrowLeft size={18} />
                        </button>
                        <h2 className="text-xl font-bold text-slate-800">
                            Qual unidade de <span className="text-blue-600">{selectedProduct.nome}</span> foi vendida?
                        </h2>
                    </div>

                    <div className="flex flex-col gap-3">
                        {availableUnits.map((unit, idx) => (
                            <div
                                key={unit.id}
                                onClick={() => handleUnitSelect(unit)}
                                className="card cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-150"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="badge badge-gray font-mono">#{idx + 1}</span>
                                        <div>
                                            <p className="text-sm text-slate-500">
                                                Origem: <span className="text-slate-700 font-semibold capitalize">{unit.origem}</span>
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Entrada: {new Date(unit.dataEntrada).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="stat-label">Custo</span>
                                        <p className="font-mono font-bold text-slate-800 text-base">{formatCurrency(unit.precoCusto)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Finish Sale */}
            {step === 3 && selectedUnit && (
                <div className="max-w-2xl mx-auto animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setStep(2)} className="btn-back">
                            <ArrowLeft size={18} />
                        </button>
                        <h2 className="text-xl font-bold text-slate-800">Finalizar Venda</h2>
                    </div>

                    {/* Summary card */}
                    <div className="card bg-blue-50 border-blue-200 mb-5 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="stat-label">Produto</p>
                                <p className="font-semibold text-slate-800">{selectedProduct.nome}</p>
                            </div>
                            <div className="text-right">
                                <p className="stat-label">Custo da Unidade</p>
                                <p className="font-mono font-bold text-blue-700 text-lg">{formatCurrency(selectedUnit.precoCusto)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <form onSubmit={handleFinishSale} className="flex flex-col gap-6">
                            <div>
                                <label className="label">Valor da Venda (R$)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="input text-xl font-bold text-green-600 font-mono"
                                    placeholder="0,00"
                                    value={saleData.precoVenda}
                                    onChange={e => setSaleData({ ...saleData, precoVenda: e.target.value })}
                                />
                            </div>

                            <div>
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

                            <div>
                                <label className="label">Data da Venda</label>
                                <input
                                    required
                                    type="date"
                                    className="input"
                                    value={saleData.dataVenda}
                                    onChange={e => setSaleData({ ...saleData, dataVenda: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="btn btn-success w-full py-3 text-base mt-2">
                                <Check size={20} />
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
