import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CircleHelp, Package, Plus, TrendingUp, Trash2, Unlock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { calculateRevenueForecast } from '../utils/revenueForecast';

const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const ageInDays = (date) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
const plural = (value, singular, pluralWord) => `${value} ${value === 1 ? singular : pluralWord}`;
const tomorrowInputDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('en-CA');
};
const reservationIsExpired = (item) => item.status === 'reservado' && item.reservadoAte && new Date(item.reservadoAte).getTime() <= Date.now();

const Estoque = () => {
    const { produtos, itensEstoque, vendas, removerItemEstoque, reservarItem, liberarReserva, isLoading } = useData();
    const toast = useToast();
    const confirm = useConfirm();
    const [filter, setFilter] = useState('todos');
    const [reservation, setReservation] = useState(null);
    const [reserveUntil, setReserveUntil] = useState('');
    const [observation, setObservation] = useState('');
    const [expanded, setExpanded] = useState(null);

    const stock = useMemo(() => itensEstoque.filter((item) => {
        const age = ageInDays(item.dataEntrada);
        if (filter === 'disponiveis') return item.status === 'disponivel';
        if (filter === 'reservados') return item.status === 'reservado';
        if (filter.endsWith('+')) return item.status !== 'vendido' && age >= Number.parseInt(filter, 10);
        return item.status !== 'vendido';
    }), [filter, itensEstoque]);
    const forecast = useMemo(
        () => calculateRevenueForecast({ vendas, itensEstoque, produtos }),
        [vendas, itensEstoque, produtos]
    );
    const invested = forecast.invested;
    const stopped = itensEstoque.filter((item) => item.status !== 'vendido' && ageInDays(item.dataEntrada) >= 30).length;
    const expiredReservations = itensEstoque.filter(reservationIsExpired);
    const groups = produtos
        .map((product) => ({ ...product, itens: stock.filter((item) => item.produtoId === product.id) }))
        .filter((product) => product.itens.length)
        .sort((a, b) => b.itens.length - a.itens.length);

    const reserve = async (event) => {
        event.preventDefault();
        if (!reservation) return;
        const result = await reservarItem(reservation.id, {
            reservadoAte: new Date(`${reserveUntil}T23:59:00`).toISOString(),
            observacao: observation
        });
        if (result.ok) {
            toast.success('Item reservado', 'A unidade foi removida da disponibilidade.');
            setReservation(null);
        } else {
            toast.error('Não foi possível reservar', result.message);
        }
    };

    const startReservation = (item) => {
        setReservation(item);
        setReserveUntil(tomorrowInputDate());
        setObservation('');
    };

    const remove = async (item) => {
        const ok = await confirm({
            title: 'Excluir unidade',
            message: 'Esta unidade será removida do estoque.',
            confirmLabel: 'Excluir',
            cancelLabel: 'Cancelar',
            variant: 'danger'
        });
        if (!ok) return;
        const result = await removerItemEstoque(item.id);
        if (result.ok) toast.success('Unidade excluída', 'O estoque foi atualizado.');
        else toast.error('Erro ao excluir', result.message);
    };

    const release = async (item) => {
        const ok = await confirm({
            title: 'Liberar reserva',
            message: reservationIsExpired(item)
                ? 'A data da reserva venceu. Confirme que o produto foi liberado antes de disponibilizá-lo novamente.'
                : 'Confirme que o produto foi liberado antes de disponibilizá-lo novamente.',
            confirmLabel: 'Liberar item',
            cancelLabel: 'Manter reservado'
        });
        if (!ok) return;
        const result = await liberarReserva(item.id);
        if (result.ok) toast.success('Reserva liberada', 'O item voltou a ficar disponível.');
        else toast.error('Erro', result.message);
    };

    if (isLoading) {
        return <div className="container"><div className="page-header"><div><h1 className="page-title">Estoque</h1><p className="page-subtitle">Carregando seu estoque...</p></div></div><div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"><div className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-800" /><div className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-800" /><div className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-800 sm:col-span-2 xl:col-span-1" /></div></div>;
    }

    return <div className="container">
        <div className="page-header">
            <div><h1 className="page-title">Estoque</h1><p className="page-subtitle">Veja o capital investido e o tempo de cada item em estoque.</p></div>
            <Link to="/estoque/entrada" className="btn btn-primary"><Plus size={18} />Nova entrada</Link>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            <div className="card border-blue-200 dark:border-blue-900"><p className="stat-label">Capital imobilizado</p><p className="font-mono text-2xl font-bold text-blue-700 dark:text-blue-400">{money(invested)}</p><p className="text-xs text-slate-500 mt-1">Itens disponíveis e reservados</p></div>
            <div className="card relative overflow-hidden border-emerald-200 dark:border-emerald-900">
                <TrendingUp className="absolute -right-3 -top-3 text-emerald-100 dark:text-emerald-950" size={82} strokeWidth={1.5} aria-hidden="true" />
                <div className="relative">
                    <div className="flex items-center gap-1.5">
                        <p className="stat-label">Faturamento estimado</p>
                        <span
                            className="text-slate-400"
                            title="Estimativa de retorno líquido: usa o ROI histórico por categoria e o ROI geral quando há poucos dados."
                            aria-label="Estimativa baseada no ROI histórico por categoria, ajustado pelo ROI geral quando há poucos dados"
                        >
                            <CircleHelp size={15} />
                        </span>
                    </div>
                    {forecast.hasForecast ? (
                        <>
                            <p className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400">{money(forecast.estimatedRevenue)}</p>
                            <p className={`mt-1 text-xs font-medium ${forecast.estimatedProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {forecast.estimatedProfit >= 0 ? 'Lucro potencial' : 'Perda potencial'}: {money(Math.abs(forecast.estimatedProfit))} · ROI {forecast.projectedRoi.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Confiança {forecast.confidence} · {plural(forecast.sampleSize, 'venda analisada', 'vendas analisadas')}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-mono text-2xl font-bold text-slate-400">—</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {invested > 0 ? 'Registre vendas completas para gerar a estimativa' : 'Adicione itens ao estoque para gerar a estimativa'}
                            </p>
                        </>
                    )}
                </div>
            </div>
            <div className="card border-amber-200 dark:border-amber-900 sm:col-span-2 xl:col-span-1"><p className="stat-label">Itens parados há 30+ dias</p><p className="font-mono text-2xl font-bold text-amber-700 dark:text-amber-400">{stopped}</p><p className="text-xs text-slate-500 mt-1">Use o filtro para revisar oportunidades</p></div>
        </div>

        {expiredReservations.length > 0 && <section role="alert" className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-sm dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200"><AlertTriangle size={19} aria-hidden="true" /></div>
                <div><p className="font-semibold">{plural(expiredReservations.length, 'reserva vencida', 'reservas vencidas')} aguardando revisão</p><p className="mt-1 text-sm text-amber-800 dark:text-amber-200">Os itens continuam reservados até você confirmar a liberação manualmente.</p></div>
            </div>
            <button type="button" className="btn btn-secondary shrink-0 text-sm" onClick={() => setFilter('reservados')}>Ver reservas</button>
        </section>}

        <div className="flex gap-2 overflow-x-auto pb-3 mb-2">{[['todos', 'Todos'], ['disponiveis', 'Disponíveis'], ['reservados', 'Reservados'], ['30+', '30+ dias'], ['60+', '60+ dias'], ['90+', '90+ dias']].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`badge whitespace-nowrap px-3 py-2 ${filter === value ? 'badge-blue' : 'badge-gray'}`}>{label}</button>)}</div>

        <div className="space-y-3">{groups.map((product) => <div key={product.id} className="card p-0 overflow-hidden">
            <button onClick={() => setExpanded(expanded === product.id ? null : product.id)} className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="flex items-center gap-3">{product.foto ? <img src={product.foto} alt="" className="w-12 h-12 rounded-xl object-cover" /> : <div className="w-12 h-12 grid place-items-center rounded-xl bg-slate-100 dark:bg-slate-700"><Package /></div>}<div><p className="font-bold">{product.nome}</p><p className="text-sm text-slate-500">{product.marca} · {plural(product.itens.length, 'unidade', 'unidades')}</p></div></div>
                <span className="badge badge-blue">{money(product.itens.reduce((sum, item) => sum + item.precoCusto, 0))}</span>
            </button>
            {expanded === product.id && <div className="border-t border-slate-100 dark:border-slate-700 p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{product.itens.map((item, index) => {
                const age = ageInDays(item.dataEntrada);
                const isReservationOpen = reservation?.id === item.id;
                const expired = reservationIsExpired(item);
                return <div key={item.id} className={`rounded-xl border p-4 ${expired ? 'border-amber-300 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/10' : 'border-slate-200 dark:border-slate-700'} ${isReservationOpen ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
                    <div className="flex justify-between"><span className="badge badge-gray">#{index + 1}</span><span className={`badge ${expired ? 'badge-yellow' : item.status === 'reservado' ? 'badge-blue' : age >= 30 ? 'badge-yellow' : 'badge-green'}`}>{expired ? 'Reserva vencida' : item.status === 'reservado' ? 'Reservado' : `${age} dias`}</span></div>
                    <p className="font-mono font-bold mt-3">{money(item.precoCusto)}</p>
                    <p className="text-xs text-slate-500 mt-1">Entrada: {new Date(item.dataEntrada).toLocaleDateString('pt-BR')}</p>
                    {item.status === 'reservado' && <p className={`text-xs mt-1 ${expired ? 'text-amber-700 dark:text-amber-300' : 'text-blue-600 dark:text-blue-300'}`}>Até {new Date(item.reservadoAte).toLocaleDateString('pt-BR')}{expired ? ' · aguardando liberação manual' : ''}</p>}
                    <div className="flex gap-2 mt-4">{item.status === 'disponivel' ? <button className="btn btn-secondary text-xs px-3 py-2" onClick={() => startReservation(item)}><CalendarClock size={15} />Reservar</button> : <button className="btn btn-secondary text-xs px-3 py-2" onClick={() => release(item)}><Unlock size={15} />Liberar</button>}<button className="p-2 text-red-500 hover:bg-red-50 rounded-lg" onClick={() => remove(item)} title="Excluir unidade"><Trash2 size={16} /></button></div>
                    {isReservationOpen && <form onSubmit={reserve} className="mt-4 border-t border-violet-100 dark:border-violet-900 pt-4 grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end"><div><label className="label">Reservar até</label><input required type="date" min={new Date().toLocaleDateString('en-CA')} className="input" value={reserveUntil} onChange={(event) => setReserveUntil(event.target.value)} /></div><div><label className="label">Observação opcional</label><input className="input" maxLength="280" value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Ex.: confirmado até amanhã" /></div><div className="flex gap-2"><button className="btn btn-primary">Reservar</button><button type="button" className="btn btn-secondary" onClick={() => setReservation(null)}>Cancelar</button></div></form>}
                </div>;
            })}</div>}
        </div>)}</div>
        {!groups.length && <div className="card text-center p-12 text-slate-500"><Package className="mx-auto mb-3" />Nenhum item corresponde a este filtro.</div>}
    </div>;
};

export default Estoque;
