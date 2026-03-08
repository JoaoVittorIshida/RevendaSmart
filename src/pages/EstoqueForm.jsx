import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../components/Toast';
import { Save, ArrowLeft, ArrowDownRight, Search, ChevronDown, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

/* ── Searchable Select ─────────────────────────────────────── */
const SearchableSelect = ({ options, value, onChange, placeholder, isLoading }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) searchInputRef.current.focus();
    }, [isOpen]);

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger */}
            <div
                className={`select w-full flex items-center justify-between cursor-pointer ${selectedOption ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
                    }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden">
                    {/* Search row */}
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
                        <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm">
                            <div className="bg-slate-50 dark:bg-slate-700 px-3 py-2 border-r border-slate-200 dark:border-slate-600 flex items-center justify-center">
                                <Search className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="block w-full px-3 py-2 border-none outline-none text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 placeholder-slate-400 focus:ring-0"
                                placeholder="Filtrar por nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="max-h-60 overflow-y-auto pt-1">
                        {isLoading ? (
                            <div className="p-3 text-center text-sm text-slate-500 dark:text-slate-400">Carregando...</div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="p-3 text-center text-sm text-slate-500 dark:text-slate-400">Nenhum produto encontrado.</div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}
                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${opt.value === value
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {opt.label}
                                    {opt.value === value && <Check size={14} />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── EstoqueForm ───────────────────────────────────────────── */
const EstoqueForm = () => {
    const { produtos, canaisCompra, adicionarEstoqueEmLote } = useData();
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        produtoId: '',
        quantidade: 1,
        custoUnitario: '',
        custoTotal: '',
        canalCompraId: '',
        origem: 'importado'
    });

    // Cálculo dinâmico
    useEffect(() => {
        setFormData(prev => {
            if (prev.quantidade && prev.custoUnitario !== '') {
                const novoTotal = Number(prev.quantidade) * Number(prev.custoUnitario);
                if (novoTotal !== Number(prev.custoTotal)) return { ...prev, custoTotal: novoTotal };
            }
            return prev;
        });
    }, [formData.quantidade, formData.custoUnitario]);

    const handleTotalChange = (novoTotal) => {
        if (novoTotal === '') { setFormData({ ...formData, custoTotal: '', custoUnitario: '' }); return; }
        const total = Number(novoTotal);
        const qtd = Number(formData.quantidade) || 1;
        setFormData({ ...formData, custoTotal: novoTotal, custoUnitario: total / qtd });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await adicionarEstoqueEmLote({ ...formData, precoCusto: Number(formData.custoUnitario) });
        toast.success('Estoque registrado!', 'A movimentação foi salva com sucesso.');
        navigate('/estoque');
    };

    const productOptions = produtos.map(p => ({ value: p.id, label: `${p.nome} - ${p.marca}` }));

    return (
        <div className="container max-w-4xl mx-auto">
            {/* Page header */}
            <div className="flex items-center gap-4 mb-8">
                <Link to="/estoque" className="btn-back">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <ArrowDownRight className="text-blue-600" size={28} />
                        Nova Entrada de Estoque
                    </h1>
                    <p className="page-subtitle">Registre a entrada de novos itens no inventário</p>
                </div>
            </div>

            <div className="card dark:border-slate-700">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Produto */}
                        <div className="form-group md:col-span-3">
                            <label className="label">Produto</label>
                            <SearchableSelect
                                options={productOptions}
                                value={formData.produtoId}
                                onChange={(val) => setFormData({ ...formData, produtoId: val })}
                                placeholder="Selecione ou busque o produto..."
                            />
                        </div>

                        {/* Quantidade */}
                        <div className="form-group">
                            <label className="label">Quantidade</label>
                            <input
                                type="number" min="1"
                                className="input text-center font-bold text-lg"
                                value={formData.quantidade}
                                onChange={e => setFormData({ ...formData, quantidade: Number(e.target.value) })}
                            />
                        </div>

                        {/* Custo unitário */}
                        <div className="form-group">
                            <label className="label">Custo Unitário (R$)</label>
                            <input
                                type="number" step="0.01"
                                className="input"
                                placeholder="0.00"
                                value={formData.custoUnitario}
                                onChange={e => setFormData({ ...formData, custoUnitario: e.target.value })}
                            />
                        </div>

                        {/* Custo total */}
                        <div className="form-group">
                            <label className="label text-blue-600 dark:text-blue-400">Custo Total da Compra (R$)</label>
                            <input
                                type="number" step="0.01"
                                className="input border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 font-semibold"
                                placeholder="0.00"
                                value={formData.custoTotal}
                                onChange={e => handleTotalChange(e.target.value)}
                            />
                        </div>

                        {/* Canal de compra */}
                        <div className="form-group">
                            <label className="label">Canal de Compra</label>
                            <select
                                required className="select"
                                value={formData.canalCompraId}
                                onChange={e => setFormData({ ...formData, canalCompraId: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {canaisCompra.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>

                        {/* Origem */}
                        <div className="form-group">
                            <label className="label">Origem</label>
                            <div className="flex gap-4 mt-2">
                                {['importado', 'nacional'].map(op => (
                                    <label key={op} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors capitalize">
                                        <input
                                            type="radio" name="origem" value={op}
                                            checked={formData.origem === op}
                                            onChange={() => setFormData({ ...formData, origem: op })}
                                        />
                                        {op}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
                        <Link to="/estoque" className="btn btn-secondary">Cancelar</Link>
                        <button type="submit" disabled={loading} className="btn btn-primary px-8">
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Confirmar Entrada'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EstoqueForm;
