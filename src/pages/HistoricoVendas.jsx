import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Calendar, ChevronLeft, ChevronRight, ChevronsUpDown, FileText, Search, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

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
    const [sortConfig, setSortConfig] = useState({ key: 'data', direction: 'desc' });
    const [cancelingId, setCancelingId] = useState(null);

    const toggleSort = (key) => setSortConfig((current) => ({
        key,
        direction: current.key !== key || current.direction === 'none' ? 'asc' : current.direction === 'asc' ? 'desc' : 'none'
    }));
    const processedVendas = useMemo(() => {
        const query = searchTerm.trim().toLocaleLowerCase('pt-BR');
        const result = (vendas || []).filter((venda) => !query || [venda.produto, venda.categoria, venda.canal, formatDate(venda.data), venda.valor, venda.custo].some((value) => String(value ?? '').toLocaleLowerCase('pt-BR').includes(query)));
        if (sortConfig.direction === 'none') return result;
        return result.sort((a, b) => {
            const aValue = sortConfig.key === 'data' ? new Date(a.data).getTime() : Number(a[sortConfig.key]) || 0;
            const bValue = sortConfig.key === 'data' ? new Date(b.data).getTime() : Number(b[sortConfig.key]) || 0;
            return (aValue - bValue) * (sortConfig.direction === 'asc' ? 1 : -1);
        });
    }, [vendas, searchTerm, sortConfig, formatDate]);

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
    const sortHead = (key, label, align = '') => <th className={`cursor-pointer select-none hover:bg-slate-100/60 dark:hover:bg-slate-700/60 ${align}`} onClick={() => toggleSort(key)}><div className={`flex items-center gap-2 ${align ? 'justify-end' : ''}`}>{label}<SortIcon active={sortConfig.key === key} direction={sortConfig.direction} /></div></th>;

    if (isLoading) return <div className="container"><div className="page-header"><div><h1 className="page-title">Histórico de Vendas</h1><p className="page-subtitle">Carregando seu histórico...</p></div></div><div className="card h-64 animate-pulse bg-slate-100 dark:bg-slate-800" /></div>;

    return <div className="container">
        <div className="page-header"><div><h1 className="page-title">Histórico de Vendas</h1><p className="page-subtitle">Visualize todas as vendas realizadas no sistema</p></div></div>
        <div className="mb-4 relative w-full md:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="search" placeholder="Buscar nas vendas..." className="input pl-10" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }} /></div>
        <div className="card overflow-hidden p-0"><div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700"><h2 className="section-heading"><FileText size={18} className="text-blue-500" />{searchTerm ? 'Resultados da busca' : 'Todas as vendas'}</h2><span className="badge badge-blue">{processedVendas.length} {processedVendas.length === 1 ? 'registro' : 'registros'}</span></div>
            <div className="table-container">{!currentVendas.length ? <div className="p-12 text-center text-slate-500">Nenhuma venda encontrada.</div> : <table><thead><tr>{sortHead('data', 'Data')}<th>Produto</th><th>Categoria</th><th>Canal de venda</th>{sortHead('custo', 'Valor de custo', 'text-right')}{sortHead('valor', 'Valor de venda', 'text-right')}<th className="text-center">Funções</th></tr></thead><tbody>{currentVendas.map((venda) => <tr key={venda.id}><td className="font-medium"><div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" />{formatDate(venda.data)}</div></td><td className="font-semibold"><div className="flex items-center gap-2">{venda.produto}{venda.status === 'cancelada' && <span className="badge badge-gray">Cancelada</span>}{venda.dadosIncompletos && <span className="badge badge-yellow">Dados incompletos</span>}</div></td><td><span className="badge badge-gray">{venda.categoria}</span></td><td>{venda.canal}</td><td className="text-right font-mono">R$ {(Number(venda.custo) || 0).toFixed(2)}</td><td className="text-right font-bold text-blue-600">R$ {(Number(venda.valor) || 0).toFixed(2)}</td><td className="text-center"><button onClick={() => handleCancel(venda)} disabled={cancelingId === venda.id || venda.status === 'cancelada'} className="p-2 rounded-lg text-red-500 disabled:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20" title={venda.status === 'cancelada' ? 'Venda já cancelada' : 'Cancelar venda'} aria-label={`Cancelar venda de ${venda.produto}`}><Trash2 size={18} /></button></td></tr>)}</tbody></table>}</div>
            {processedVendas.length > 0 && <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-sm"><div className="flex items-center gap-2"><span>Mostrar</span><select value={itemsPerPage} onChange={(event) => { setItemsPerPage(Number(event.target.value)); setCurrentPage(1); }} className="input w-auto py-1"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select><span>por página</span></div><div className="flex items-center gap-3"><span>{(safePage - 1) * itemsPerPage + 1}–{Math.min(safePage * itemsPerPage, processedVendas.length)} de {processedVendas.length}</span><button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safePage === 1} className="p-1 disabled:opacity-40"><ChevronLeft size={20} /></button><span>{safePage} / {totalPages}</span><button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safePage === totalPages} className="p-1 disabled:opacity-40"><ChevronRight size={20} /></button></div></div>}
        </div>
    </div>;
};

export default HistoricoVendas;
