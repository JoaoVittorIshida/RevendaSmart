import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Calendar, ChevronLeft, ChevronRight, ChevronsUpDown, FileText, FilterX, Search, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const normalize = (value) => String(value ?? '').trim();
const saleProfit = (sale) => sale.status === 'cancelada' || sale.valor == null || sale.custo == null ? null : Number(sale.valor) - Number(sale.custo);

const SortIcon = ({ active, direction }) => {
    if (!active || direction === 'none') return <ChevronsUpDown size={14} className="text-slate-400 opacity-50" />;
    return direction === 'asc' ? <ArrowUp size={14} className="text-blue-500" /> : <ArrowDown size={14} className="text-blue-500" />;
};

const HistoricoVendas = () => {
    const { vendas, formatDate, cancelarVenda, isLoading } = useData();
    const toast = useToast();
    const confirm = useConfirm();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [channelFilter, setChannelFilter] = useState('');
    const [receiptFilter, setReceiptFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'data', direction: 'desc' });
    const [cancelingId, setCancelingId] = useState(null);

    const filterOptions = useMemo(() => ({
        categories: [...new Set((vendas || []).map((sale) => normalize(sale.categoria)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
        channels: [...new Set((vendas || []).map((sale) => normalize(sale.canal)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    }), [vendas]);

    const activeFilterCount = [searchTerm.trim(), categoryFilter, channelFilter, receiptFilter, startDate, endDate].filter(Boolean).length;
    const resetPage = () => setCurrentPage(1);
    const clearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('');
        setChannelFilter('');
        setReceiptFilter('');
        setStartDate('');
        setEndDate('');
        resetPage();
    };

    const toggleSort = (key) => setSortConfig((current) => ({
        key,
        direction: current.key !== key || current.direction === 'none' ? 'asc' : current.direction === 'asc' ? 'desc' : 'none'
    }));

    const processedVendas = useMemo(() => {
        const query = searchTerm.trim().toLocaleLowerCase('pt-BR');
        const result = (vendas || []).filter((venda) => {
            const saleDate = venda.data ? String(venda.data).slice(0, 10) : '';
            const matchesSearch = !query || [venda.produto, venda.categoria, venda.canal, formatDate(venda.data), venda.valor, venda.custo]
                .some((value) => String(value ?? '').toLocaleLowerCase('pt-BR').includes(query));
            const matchesReceipt = !receiptFilter
                || (receiptFilter === 'recebido' && venda.status === 'concluida' && venda.recebido)
                || (receiptFilter === 'pendente' && venda.status === 'concluida' && !venda.recebido)
                || (receiptFilter === 'cancelada' && venda.status === 'cancelada');
            return matchesSearch
                && (!categoryFilter || normalize(venda.categoria) === categoryFilter)
                && (!channelFilter || normalize(venda.canal) === channelFilter)
                && matchesReceipt
                && (!startDate || saleDate >= startDate)
                && (!endDate || saleDate <= endDate);
        });

        if (sortConfig.direction === 'none') return result;
        return result.sort((a, b) => {
            const getValue = (sale) => {
                if (sortConfig.key === 'data') return new Date(sale.data).getTime();
                if (sortConfig.key === 'lucro') return saleProfit(sale) ?? Number.NEGATIVE_INFINITY;
                return Number(sale[sortConfig.key]) || 0;
            };
            return (getValue(a) - getValue(b)) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [vendas, searchTerm, categoryFilter, channelFilter, receiptFilter, startDate, endDate, sortConfig, formatDate]);

    const totalPages = Math.max(1, Math.ceil(processedVendas.length / itemsPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const currentVendas = processedVendas.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

    const handleCancel = async (venda) => {
        const accepted = await confirm({ title: 'Cancelar venda', message: `Deseja cancelar a venda de "${venda.produto}"?`, confirmLabel: 'Sim, cancelar', cancelLabel: 'Não', variant: 'danger' });
        if (!accepted) return;
        setCancelingId(venda.id);
        const result = await cancelarVenda(venda.estoqueId);
        if (result.ok) toast.success('Venda cancelada', `"${venda.produto}" voltou para o estoque disponível.`);
        else toast.error('Erro ao cancelar venda', result.message);
        setCancelingId(null);
    };

    const sortHead = (key, label, align = '') => (
        <th
            scope="col"
            className={align}
            aria-sort={sortConfig.key === key && sortConfig.direction !== 'none' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
            <button
                type="button"
                onClick={() => toggleSort(key)}
                className={`flex w-full items-center gap-2 rounded-md py-1 text-left transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:hover:text-slate-200 ${align ? 'justify-end' : ''}`}
            >
                {label}<SortIcon active={sortConfig.key === key} direction={sortConfig.direction} />
            </button>
        </th>
    );

    if (isLoading) return <div className="container"><div className="page-header"><div><h1 className="page-title">Histórico de Vendas</h1><p className="page-subtitle">Carregando seu histórico...</p></div></div><div className="card h-64 animate-pulse bg-slate-100 dark:bg-slate-800" /></div>;

    return (
        <div className="container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Histórico de Vendas</h1>
                    <p className="page-subtitle">Visualize, filtre e compare todas as vendas realizadas</p>
                </div>
            </div>

            <div className="card mb-5 p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <div className="relative md:col-span-2 xl:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                        <input type="search" placeholder="Buscar nas vendas..." className="input pl-10" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); resetPage(); }} />
                    </div>
                    <select className="select" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); resetPage(); }} aria-label="Filtrar por categoria">
                        <option value="">Todas as categorias</option>
                        {filterOptions.categories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                    <select className="select" value={channelFilter} onChange={(event) => { setChannelFilter(event.target.value); resetPage(); }} aria-label="Filtrar por canal de venda">
                        <option value="">Todos os canais</option>
                        {filterOptions.channels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
                    </select>
                    <select className="select" value={receiptFilter} onChange={(event) => { setReceiptFilter(event.target.value); resetPage(); }} aria-label="Filtrar por situação">
                        <option value="">Todas as situações</option>
                        <option value="recebido">Recebidas</option>
                        <option value="pendente">Recebimento pendente</option>
                        <option value="cancelada">Canceladas</option>
                    </select>
                    <button type="button" onClick={clearFilters} disabled={!activeFilterCount} className="btn btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto">
                        <FilterX size={18} /> Limpar {activeFilterCount ? `(${activeFilterCount})` : ''}
                    </button>
                </div>
                <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-slate-700 sm:flex-row sm:items-center">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Período da venda</span>
                    <label className="flex min-w-0 flex-col gap-1 text-sm text-slate-500 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-2">
                        De
                        <input type="date" className="input date-input w-full py-2 min-[420px]:w-auto" value={startDate} max={endDate || undefined} onChange={(event) => { setStartDate(event.target.value); resetPage(); }} />
                    </label>
                    <label className="flex min-w-0 flex-col gap-1 text-sm text-slate-500 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-2">
                        Até
                        <input type="date" className="input date-input w-full py-2 min-[420px]:w-auto" value={endDate} min={startDate || undefined} onChange={(event) => { setEndDate(event.target.value); resetPage(); }} />
                    </label>
                </div>
            </div>

            <div className="card overflow-hidden p-0">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 dark:border-slate-700 sm:px-6">
                    <h2 className="section-heading"><FileText size={18} className="text-blue-500" />{searchTerm || activeFilterCount ? 'Resultados filtrados' : 'Todas as vendas'}</h2>
                    <span className="badge badge-blue">{processedVendas.length} {processedVendas.length === 1 ? 'registro' : 'registros'}</span>
                </div>
                <div className="table-container">
                    {!currentVendas.length ? (
                        <div className="p-12 text-center text-slate-500">Nenhuma venda encontrada com os filtros selecionados.</div>
                    ) : (
                        <table className="min-w-[1180px]">
                            <thead>
                                <tr>
                                    {sortHead('data', 'Data')}
                                    <th>Produto</th>
                                    <th>Categoria</th>
                                    <th>Canal de venda</th>
                                    {sortHead('custo', 'Valor de custo', 'text-right')}
                                    {sortHead('valor', 'Valor de venda', 'text-right')}
                                    {sortHead('lucro', 'Lucro', 'text-right')}
                                    <th>Recebimento</th>
                                    <th className="text-center">Funções</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentVendas.map((venda) => {
                                    const lucro = saleProfit(venda);
                                    return (
                                        <tr key={venda.id}>
                                            <td className="font-medium"><div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" />{formatDate(venda.data)}</div></td>
                                            <td className="font-semibold"><div className="flex items-center gap-2">{venda.produto}{venda.status === 'cancelada' && <span className="badge badge-gray">Cancelada</span>}{venda.dadosIncompletos && <span className="badge badge-yellow">Dados incompletos</span>}</div></td>
                                            <td><span className="badge badge-gray">{venda.categoria}</span></td>
                                            <td>{venda.canal}</td>
                                            <td className="text-right font-mono">{venda.custo == null ? '—' : money.format(Number(venda.custo))}</td>
                                            <td className="text-right font-mono font-bold text-blue-600 dark:text-blue-400">{venda.valor == null ? '—' : money.format(Number(venda.valor))}</td>
                                            <td className={`text-right font-mono font-bold ${lucro == null ? 'text-slate-400' : lucro >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{lucro == null ? '—' : money.format(lucro)}</td>
                                            <td>{venda.status === 'cancelada' ? <span className="badge badge-gray">—</span> : venda.recebido ? <span className="badge badge-green">Recebido</span> : <span className="badge badge-yellow">Pendente</span>}</td>
                                            <td className="text-center"><button onClick={() => handleCancel(venda)} disabled={cancelingId === venda.id || venda.status === 'cancelada'} className="p-2 rounded-lg text-red-500 disabled:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20" title={venda.status === 'cancelada' ? 'Venda já cancelada' : 'Cancelar venda'} aria-label={`Cancelar venda de ${venda.produto}`}><Trash2 size={18} /></button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                {processedVendas.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-100 p-4 text-sm dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2"><span>Mostrar</span><select value={itemsPerPage} onChange={(event) => { setItemsPerPage(Number(event.target.value)); resetPage(); }} className="input w-auto py-1"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select><span>por página</span></div>
                        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end"><span className="mr-auto sm:mr-1">{(safePage - 1) * itemsPerPage + 1}–{Math.min(safePage * itemsPerPage, processedVendas.length)} de {processedVendas.length}</span><button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safePage === 1} className="grid min-h-10 min-w-10 place-items-center rounded-lg disabled:opacity-40" aria-label="Página anterior"><ChevronLeft size={20} /></button><span>{safePage} / {totalPages}</span><button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safePage === totalPages} className="grid min-h-10 min-w-10 place-items-center rounded-lg disabled:opacity-40" aria-label="Próxima página"><ChevronRight size={20} /></button></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoricoVendas;
