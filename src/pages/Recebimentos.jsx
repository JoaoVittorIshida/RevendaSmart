import React, { useMemo, useState } from 'react';
import { BadgeCheck, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Search } from 'lucide-react';
import Modal from '../components/Modal';
import { useData } from '../contexts/DataContext';
import { useToast } from '../components/Toast';

const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const localDate = () => new Date().toLocaleDateString('en-CA');

const Recebimentos = () => {
    const { vendas, formatDate, registrarRecebimento, isLoading } = useData();
    const toast = useToast();
    const [tab, setTab] = useState('pendentes');
    const [search, setSearch] = useState('');
    const [selectedSale, setSelectedSale] = useState(null);
    const [receiptDate, setReceiptDate] = useState(localDate);
    const [savingId, setSavingId] = useState(null);

    const { pending, history, pendingTotal } = useMemo(() => {
        const completed = vendas.filter((sale) => sale.status === 'concluida' && !sale.dadosIncompletos);
        const pendingSales = completed.filter((sale) => !sale.recebido);
        const receivedSales = completed.filter((sale) => sale.recebido);
        return { pending: pendingSales, history: receivedSales, pendingTotal: pendingSales.reduce((total, sale) => total + (Number(sale.valor) || 0), 0) };
    }, [vendas]);

    const rows = tab === 'pendentes' ? pending : history;
    const filteredRows = rows.filter((sale) => `${sale.produto} ${sale.categoria} ${sale.canal}`.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')));
    const closeModal = () => { if (!savingId) setSelectedSale(null); };
    const openReceiptModal = (sale) => { setSelectedSale(sale); setReceiptDate(localDate()); };
    const confirmReceipt = async (event) => {
        event.preventDefault();
        if (!selectedSale || !receiptDate) return;
        setSavingId(selectedSale.id);
        const result = await registrarRecebimento(selectedSale.id, new Date(`${receiptDate}T12:00:00`).toISOString());
        if (result.ok) {
            toast.success('Recebimento registrado', `${selectedSale.produto} foi baixado como recebido.`);
            setSelectedSale(null);
        } else toast.error('Não foi possível registrar', result.message);
        setSavingId(null);
    };

    if (isLoading) return <div className="container"><div className="page-header"><div><h1 className="page-title">Recebimentos</h1><p className="page-subtitle">Carregando recebimentos...</p></div></div><div className="card h-64 animate-pulse bg-slate-100 dark:bg-slate-800" /></div>;

    return <div className="container">
        <div className="page-header"><div><h1 className="page-title">Recebimentos</h1><p className="page-subtitle">Acompanhe o que já entrou e dê baixa nas vendas pendentes.</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2 mb-6"><section className="card border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20"><div className="flex items-center justify-between gap-4"><div><p className="stat-label">A receber</p><p className="mt-1 font-mono text-2xl font-bold text-amber-700 dark:text-amber-300">{money(pendingTotal)}</p><p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">{pending.length} {pending.length === 1 ? 'venda pendente' : 'vendas pendentes'}</p></div><Clock3 className="text-amber-500" size={30} /></div></section><section className="card"><div className="flex items-center justify-between gap-4"><div><p className="stat-label">Recebimentos concluídos</p><p className="mt-1 font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-300">{history.length}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Vendas baixadas como recebidas</p></div><BadgeCheck className="text-emerald-500" size={30} /></div></section></div>
        <section className="card p-0 overflow-hidden"><div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-700 md:flex-row md:items-center md:justify-between"><div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist" aria-label="Situação dos recebimentos"><button type="button" role="tab" aria-selected={tab === 'pendentes'} onClick={() => setTab('pendentes')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === 'pendentes' ? 'bg-white text-amber-700 shadow-sm dark:bg-slate-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>Pendentes ({pending.length})</button><button type="button" role="tab" aria-selected={tab === 'historico'} onClick={() => setTab('historico')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === 'historico' ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>Histórico</button></div></div><div className="relative m-5 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="search" className="input pl-9" placeholder="Buscar produto ou canal..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="table-container">{!filteredRows.length ? <div className="p-12 text-center text-slate-500"><CircleDollarSign className="mx-auto mb-3 opacity-40" size={30} />{tab === 'pendentes' ? 'Nenhum recebimento pendente.' : 'Nenhum recebimento no histórico.'}</div> : <table><thead><tr><th>Venda</th><th>Produto</th><th>Canal</th><th className="text-right">Valor líquido</th><th>{tab === 'pendentes' ? 'Status' : 'Recebido em'}</th>{tab === 'pendentes' && <th className="text-right">Ação</th>}</tr></thead><tbody>{filteredRows.map((sale) => <tr key={sale.id}><td className="font-medium">{formatDate(sale.data)}</td><td><p className="font-semibold">{sale.produto}</p><p className="text-xs text-slate-500">{sale.categoria}</p></td><td>{sale.canal}</td><td className="text-right font-mono font-bold">{money(sale.valor)}</td><td>{tab === 'pendentes' ? <span className="badge badge-yellow">Pendente</span> : <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={16} />{formatDate(sale.dataRecebimento)}</span>}</td>{tab === 'pendentes' && <td className="text-right"><button type="button" onClick={() => openReceiptModal(sale)} className="btn btn-success px-3 py-2 text-xs">Dar baixa</button></td>}</tr>)}</tbody></table>}</div></section>
        <Modal isOpen={Boolean(selectedSale)} onClose={closeModal} title="Confirmar recebimento" maxWidth="max-w-lg"><form onSubmit={confirmReceipt} className="space-y-6"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30"><p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Confira os dados antes de registrar a baixa.</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><p className="stat-label">Produto</p><p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{selectedSale?.produto}</p></div><div><p className="stat-label">Data da venda</p><p className="mt-1 font-medium">{selectedSale && formatDate(selectedSale.data)}</p></div><div><p className="stat-label">Valor líquido</p><p className="mt-1 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">{selectedSale && money(selectedSale.valor)}</p></div></div><div><label className="label" htmlFor="receipt-date">Data de recebimento</label><div className="relative"><input id="receipt-date" required type="date" max={localDate()} min={selectedSale?.data?.slice(0, 10)} className="input date-input pr-11" value={receiptDate} onChange={(event) => setReceiptDate(event.target.value)} /><CalendarDays className="pointer-events-none absolute right-3 bottom-3 text-slate-400 dark:text-slate-500" size={18} aria-hidden="true" /></div></div><div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end dark:border-slate-700"><button type="button" onClick={closeModal} disabled={Boolean(savingId)} className="btn btn-secondary">Cancelar</button><button type="submit" disabled={Boolean(savingId)} className="btn btn-success">{savingId ? 'Confirmando...' : 'Confirmar recebimento'}</button></div></form></Modal>
    </div>;
};

export default Recebimentos;
