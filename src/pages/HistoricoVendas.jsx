import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { FileText, Calendar, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';

const HistoricoVendas = () => {
    const { vendas, formatDate } = useData();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });

    if (!vendas) {
        return (
            <div className="container">
                <div className="text-center p-8 text-slate-500 dark:text-slate-400">Carregando histórico...</div>
            </div>
        );
    }

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'none';
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey || sortConfig.direction === 'none')
            return <ChevronsUpDown size={14} className="text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity" />;
        if (sortConfig.direction === 'asc') return <ArrowUp size={14} className="text-blue-500" />;
        return <ArrowDown size={14} className="text-blue-500" />;
    };

    const processedVendas = useMemo(() => {
        let result = vendas.filter(venda => {
            if (!searchTerm) return true;
            const s = searchTerm.toLowerCase();
            const dateStr = formatDate(venda.data).toLowerCase();
            return (
                venda.produto?.toLowerCase().includes(s) ||
                venda.categoria?.toLowerCase().includes(s) ||
                venda.canal?.toLowerCase().includes(s) ||
                dateStr.includes(s) ||
                venda.valor?.toString().includes(s) ||
                venda.custo?.toString().includes(s)
            );
        });

        if (sortConfig.direction !== 'none') {
            result.sort((a, b) => {
                let aVal = sortConfig.key === 'data' ? new Date(a.data).getTime() : a[sortConfig.key];
                let bVal = sortConfig.key === 'data' ? new Date(b.data).getTime() : b[sortConfig.key];
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [vendas, searchTerm, sortConfig, formatDate]);

    const totalItems = processedVendas.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentVendas = processedVendas.slice(indexOfFirstItem, indexOfLastItem);

    const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

    /* ── sortable th class ── */
    const thSort = 'cursor-pointer group select-none hover:bg-slate-100/60 dark:hover:bg-slate-700/60 transition-colors';

    return (
        <div className="container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Histórico de Vendas</h1>
                    <p className="page-subtitle">Visualize todas as vendas realizadas no sistema</p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4 relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar nas vendas..."
                    className="input pl-10"
                    value={searchTerm}
                    onChange={handleSearch}
                />
                {searchTerm && (
                    <button
                        onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <span className="sr-only">Limpar</span>
                        ×
                    </button>
                )}
            </div>

            <div className="card overflow-hidden p-0">
                {/* Card header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="section-heading">
                        <FileText size={18} className="text-blue-500" />
                        {searchTerm ? 'Resultados da Busca' : 'Todas as Vendas'}
                    </h2>
                    <span className="badge badge-blue">
                        {searchTerm
                            ? `${totalItems} resultado${totalItems !== 1 ? 's' : ''}`
                            : `${totalItems} registro${totalItems !== 1 ? 's' : ''}`}
                    </span>
                </div>

                <div className="table-container">
                    {totalItems === 0 ? (
                        <div className="p-12 text-center">
                            <Search size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                            <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-1">Nenhum resultado encontrado</p>
                            <p className="text-sm text-slate-400 dark:text-slate-500">Não encontramos nenhuma venda correspondente à sua busca.</p>
                            {searchTerm && (
                                <button
                                    onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                                    className="mt-4 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th className={thSort} onClick={() => handleSort('data')}>
                                        <div className="flex items-center gap-2">Data <SortIcon columnKey="data" /></div>
                                    </th>
                                    <th>Produto</th>
                                    <th>Categoria</th>
                                    <th>Canal de Venda</th>
                                    <th className={`text-right ${thSort}`} onClick={() => handleSort('custo')}>
                                        <div className="flex items-center justify-end gap-2">Valor de Custo <SortIcon columnKey="custo" /></div>
                                    </th>
                                    <th className={`text-right ${thSort}`} onClick={() => handleSort('valor')}>
                                        <div className="flex items-center justify-end gap-2">Valor de Venda <SortIcon columnKey="valor" /></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentVendas.map(venda => (
                                    <tr key={venda.id}>
                                        <td className="font-medium text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                                                {formatDate(venda.data)}
                                            </div>
                                        </td>
                                        <td className="font-semibold text-slate-800 dark:text-slate-100">{venda.produto}</td>
                                        <td><span className="badge badge-gray">{venda.categoria}</span></td>
                                        <td><span className="capitalize text-sm text-slate-600 dark:text-slate-400">{venda.canal}</span></td>
                                        <td className="text-right font-mono text-slate-600 dark:text-slate-400">
                                            R$ {venda.custo.toFixed(2)}
                                        </td>
                                        <td className="text-right font-bold text-blue-600 dark:text-blue-400">
                                            R$ {venda.valor.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalItems > 0 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-sm bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <span>Mostrar</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span>itens por página</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, totalItems)} de {totalItems}
                            </span>

                            <div className="flex items-center gap-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-1 shadow-sm">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`p-1 rounded-md transition-colors ${currentPage === 1
                                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    title="Página Anterior"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <span className="font-semibold text-slate-700 dark:text-slate-200 px-3 min-w-[80px] text-center">
                                    {currentPage} / {totalPages || 1}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className={`p-1 rounded-md transition-colors ${currentPage === totalPages || totalPages === 0
                                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    title="Próxima Página"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoricoVendas;
