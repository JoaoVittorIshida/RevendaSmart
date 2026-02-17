import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { Save, ArrowLeft, ArrowDownRight, Search, ChevronDown, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div className="relative" ref={containerRef}>
            <div
                className={`select w-full flex items-center justify-between cursor-pointer ${!selectedOption ? 'text-gray-500' : 'text-gray-900'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl" style={{ backgroundColor: '#ffffff' }}>
                    <div className="p-3 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-lg">
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm">
                            <div className="bg-gray-50 px-3 py-2 border-r border-gray-200 flex items-center justify-center">
                                <Search className="h-4 w-4 text-gray-500" />
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="block w-full px-3 py-2 border-none outline-none text-sm text-gray-700 placeholder-gray-400 focus:ring-0"
                                placeholder="Filtrar por nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto pt-1">
                        {isLoading ? (
                            <div className="p-3 text-center text-sm text-gray-500">Carregando...</div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="p-3 text-center text-sm text-gray-500">Nenhum produto encontrado.</div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between ${opt.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
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

const EstoqueForm = () => {
    const { produtos, canaisCompra, adicionarEstoqueEmLote } = useData();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        produtoId: '',
        quantidade: 1,
        custoUnitario: '',
        custoTotal: '',
        canalCompraId: '',
        origem: 'importado'
    });

    // Calculo dinamico
    useEffect(() => {
        setFormData(prev => {
            // Só calcula se ambos tiverem valores válidos
            if (prev.quantidade && prev.custoUnitario !== '') {
                const novoTotal = Number(prev.quantidade) * Number(prev.custoUnitario);
                if (novoTotal !== Number(prev.custoTotal)) {
                    return { ...prev, custoTotal: novoTotal };
                }
            }
            return prev;
        });
    }, [formData.quantidade, formData.custoUnitario]);

    const handleTotalChange = (novoTotal) => {
        // Se apagar tudo
        if (novoTotal === '') {
            setFormData({ ...formData, custoTotal: '', custoUnitario: '' });
            return;
        }

        const total = Number(novoTotal);
        const qtd = Number(formData.quantidade) || 1;

        setFormData({
            ...formData,
            custoTotal: novoTotal, // Mantém string se for o caso
            custoUnitario: total / qtd
        });
    };

    const handleUnitarioChange = (valor) => {
        setFormData({ ...formData, custoUnitario: valor });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await adicionarEstoqueEmLote({
            ...formData,
            precoCusto: Number(formData.custoUnitario)
        });
        alert('Movimentação registrada com sucesso!');
        navigate('/estoque');
    };

    // Prepare options for the custom select
    const productOptions = produtos.map(p => ({
        value: p.id,
        label: `${p.nome} - ${p.marca}`
    }));

    return (
        <div className="container max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/estoque" className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-700 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
                        <ArrowDownRight className="text-blue-600" size={32} />
                        Nova Entrada de Estoque
                    </h1>
                    <p className="text-secondary">Registre a entrada de novos itens no inventário</p>
                </div>
            </div>

            <div className="card shadow-lg border-blue-100">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="form-group md:col-span-3">
                            <label className="label">Produto</label>
                            <SearchableSelect
                                options={productOptions}
                                value={formData.produtoId}
                                onChange={(val) => setFormData({ ...formData, produtoId: val })}
                                placeholder="Selecione ou busque o produto..."
                            />
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
                                placeholder="0.00"
                                value={formData.custoUnitario}
                                onChange={e => handleUnitarioChange(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="label text-blue-600">Custo Total da Compra (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input border-blue-200 bg-blue-50 text-blue-900 font-semibold"
                                placeholder="0.00"
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
                                <label className="flex items-center gap-2 text-secondary cursor-pointer hover:text-primary transition-colors">
                                    <input
                                        type="radio"
                                        name="origem"
                                        value="importado"
                                        checked={formData.origem === 'importado'}
                                        onChange={() => setFormData({ ...formData, origem: 'importado' })}
                                    /> Importado
                                </label>
                                <label className="flex items-center gap-2 text-secondary cursor-pointer hover:text-primary transition-colors">
                                    <input
                                        type="radio"
                                        name="origem"
                                        value="nacional"
                                        checked={formData.origem === 'nacional'}
                                        onChange={() => setFormData({ ...formData, origem: 'nacional' })}
                                    /> Nacional
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <Link to="/estoque" className="btn btn-secondary">
                            Cancelar
                        </Link>
                        <button type="submit" className="btn btn-primary px-8">
                            <Save size={18} />
                            Confirmar Entrada
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EstoqueForm;
