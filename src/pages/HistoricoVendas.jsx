import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { FileText, Calendar, DollarSign, Search, ChevronLeft, ChevronRight, X, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';

const HistoricoVendas = () => {
    const { vendas, formatDate } = useData();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });

    if (!vendas) {
        return (
            <div className="container">
                <div className="text-center p-8 text-gray-500">Carregando histórico...</div>
            </div>
        );
    }

    // Handle sort column click
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'none';
        }
        setSortConfig({ key, direction });
    };

    // Render Sort Icon
    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey || sortConfig.direction === 'none') {
            return <ChevronsUpDown size={14} className="text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity" />;
        }
        if (sortConfig.direction === 'asc') {
            return <ArrowUp size={14} className="text-blue-500" />;
        }
        return <ArrowDown size={14} className="text-blue-500" />;
    };

    // Filter AND Sort logic combined using useMemo for performance
    const processedVendas = useMemo(() => {
        // 1. Filter
        let result = vendas.filter(venda => {
            if (!searchTerm) return true;

            const searchLower = searchTerm.toLowerCase();
            const dateStr = formatDate(venda.data).toLowerCase();

            return (
                venda.produto?.toLowerCase().includes(searchLower) ||
                venda.categoria?.toLowerCase().includes(searchLower) ||
                venda.canal?.toLowerCase().includes(searchLower) ||
                dateStr.includes(searchLower) ||
                venda.valor?.toString().includes(searchLower) ||
                venda.custo?.toString().includes(searchLower)
            );
        });

        // 2. Sort
        if (sortConfig.direction !== 'none') {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'data') {
                    aValue = new Date(a.data).getTime();
                    bValue = new Date(b.data).getTime();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [vendas, searchTerm, sortConfig, formatDate]);

    // Pagination logic
    const totalItems = processedVendas.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentVendas = processedVendas.slice(indexOfFirstItem, indexOfLastItem);

    // Handle search change
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };

    return (
        <div className="container">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Histórico de Vendas</h1>
                    <p className="text-secondary">Visualize todas as vendas realizadas no sistema</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4 relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar nas vendas..."
                    className="input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>

            <div className="card overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FileText size={20} className="text-blue-500" />
                        {searchTerm ? 'Resultados da Busca' : 'Todas as Vendas'}
                    </h2>
                    <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                        {searchTerm ? `Encontrados: ${totalItems}` : `Total: ${totalItems} registros`}
                    </span>
                </div>

                <div className="table-container">
                    {totalItems === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Search size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium text-gray-600 mb-1">Nenhum resultado encontrado</p>
                            <p className="text-sm">Não encontramos nenhuma venda correspondente à sua busca.</p>
                            {searchTerm && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setCurrentPage(1);
                                    }}
                                    className="mt-4 text-blue-500 hover:text-blue-600 font-medium text-sm transition-colors"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th
                                        className="cursor-pointer group select-none hover:bg-gray-100/50 transition-colors"
                                        onClick={() => handleSort('data')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Data <SortIcon columnKey="data" />
                                        </div>
                                    </th>
                                    <th>Produto</th>
                                    <th>Categoria</th>
                                    <th>Canal de Venda</th>
                                    <th
                                        className="text-right cursor-pointer group select-none hover:bg-gray-100/50 transition-colors"
                                        onClick={() => handleSort('custo')}
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            Valor de Custo <SortIcon columnKey="custo" />
                                        </div>
                                    </th>
                                    <th
                                        className="text-right cursor-pointer group select-none hover:bg-gray-100/50 transition-colors"
                                        onClick={() => handleSort('valor')}
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            Valor de Venda <SortIcon columnKey="valor" />
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentVendas.map(venda => (
                                    <tr key={venda.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="font-medium text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                {formatDate(venda.data)}
                                            </div>
                                        </td>
                                        <td className="font-semibold text-gray-800">{venda.produto}</td>
                                        <td>
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold border border-gray-200">
                                                {venda.categoria}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="capitalize text-sm text-gray-600">
                                                {venda.canal}
                                            </span>
                                        </td>
                                        <td className="text-right font-mono text-gray-600">
                                            R$ {venda.custo.toFixed(2)}
                                        </td>
                                        <td className="text-right font-bold text-green-600">
                                            R$ {venda.valor.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalItems > 0 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm bg-gray-50/30">
                        <div className="flex items-center gap-2 text-gray-600">
                            <span>Mostrar</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1); // Reset to first page
                                }}
                                className="border border-gray-200 rounded-lg px-2 py-1 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span>itens por página</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <span className="text-gray-500 font-medium">
                                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, totalItems)} de {totalItems}
                            </span>

                            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`p-1 rounded-md transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                                    title="Página Anterior"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <span className="font-semibold text-gray-700 px-3 min-w-[80px] text-center">
                                    {currentPage} / {totalPages || 1}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className={`p-1 rounded-md transition-colors ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
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
