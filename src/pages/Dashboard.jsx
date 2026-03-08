import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { DollarSign, TrendingUp, Percent, BarChart2, ShoppingBag } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

/* ─── CountUp Hook ────────────────────────────────────────── */
const useCountUp = (target, duration = 800, decimals = 0) => {
    const [value, setValue] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        const start = Date.now();

        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(parseFloat((target * eased).toFixed(decimals)));
            if (progress < 1) rafRef.current = requestAnimationFrame(tick);
        };

        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [target, duration, decimals]);

    return value;
};

/* ─── Skeleton ────────────────────────────────────────────── */
const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl ${className}`} />
);

const DashboardSkeleton = () => (
    <div className="container animate-in fade-in duration-300">
        <div className="page-header mb-8">
            <div><Skeleton className="h-8 w-40 mb-2" /><Skeleton className="h-4 w-56" /></div>
            <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Skeleton className="h-72 lg:col-span-2" />
            <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-64" />
    </div>
);

/* ─── KPI Card ────────────────────────────────────────────── */
const CANAL_COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ef4444', '#06b6d4'];

const KPICard = ({ title, rawValue, displayValue, subvalue, icon: Icon, variant }) => {
    const variants = {
        green: { card: 'kpi-card kpi-card-green', icon: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', value: 'text-green-700 dark:text-green-400', bar: 'bg-green-500' },
        blue: { card: 'kpi-card kpi-card-blue', icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', value: 'text-blue-700 dark:text-blue-400', bar: 'bg-blue-500' },
        purple: { card: 'kpi-card kpi-card-purple', icon: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', value: 'text-purple-700 dark:text-purple-400', bar: 'bg-purple-500' },
        orange: { card: 'kpi-card kpi-card-orange', icon: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', value: 'text-orange-700 dark:text-orange-400', bar: 'bg-orange-500' },
    };
    const v = variants[variant] || variants.blue;

    return (
        <div className={v.card}>
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${v.bar}`} />
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <p className="stat-label mb-2">{title}</p>
                    <p className={`text-2xl font-bold font-mono tracking-tight ${v.value}`}>{displayValue}</p>
                </div>
                <div className={`p-3 rounded-xl ${v.icon} shrink-0 ml-3 transition-transform duration-200 hover:scale-110`}>
                    <Icon size={22} />
                </div>
            </div>
            {subvalue && <p className="text-xs text-slate-400 font-medium mt-1">{subvalue}</p>}
        </div>
    );
};

/* ─── Custom Tooltip (AreaChart) ──────────────────────────── */
const AreaTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="font-semibold text-slate-600 dark:text-slate-300 mb-2">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color }} className="font-mono font-bold">
                    {p.name}: {fmt(p.value)}
                </p>
            ))}
        </div>
    );
};

/* ─── Custom Legend (Pie) ─────────────────────────────────── */
const PieLegend = ({ payload }) => (
    <div className="flex flex-col gap-1.5 mt-2">
        {payload?.map((entry) => (
            <div key={entry.value} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{entry.value}</span>
            </div>
        ))}
    </div>
);

const PieCustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="font-semibold text-slate-700 dark:text-slate-200">{payload[0].name}</p>
            <p className="text-slate-500 dark:text-slate-400">{payload[0].value} venda{payload[0].value !== 1 ? 's' : ''}</p>
        </div>
    );
};

/* ─── Dashboard ────────────────────────────────────────────── */
const Dashboard = () => {
    const { itensEstoque, produtos, canaisVenda, formatDate } = useData();
    const [periodo, setPeriodo] = useState('total');
    const isLoading = itensEstoque.length === 0 && produtos.length === 0;

    const dadosCalculados = useMemo(() => {
        const hoje = new Date();
        const dataLimite = new Date();
        dataLimite.setDate(hoje.getDate() - 30);

        const itensVendidos = itensEstoque.filter(item => {
            if (item.status !== 'vendido') return false;
            if (periodo === '30dias') return new Date(item.dataVenda) >= dataLimite;
            return true;
        });

        const receita = itensVendidos.reduce((acc, i) => acc + (Number(i.precoVenda) || 0), 0);
        const custo = itensVendidos.reduce((acc, i) => acc + (Number(i.precoCusto) || 0), 0);
        const lucro = receita - custo;
        const margem = receita > 0 ? (lucro / receita) * 100 : 0;
        const markup = custo > 0 ? (lucro / custo) * 100 : 0;

        const recentes = itensVendidos
            .sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda))
            .slice(0, 5)
            .map(item => {
                const prod = produtos.find(p => p.id === item.produtoId);
                return { ...item, productName: prod?.nome ?? 'Produto Desconhecido' };
            });

        // ── Area Chart data: group by date ──────────────────
        const byDate = {};
        itensVendidos.forEach(item => {
            const d = formatDate(item.dataVenda);
            if (!byDate[d]) byDate[d] = { date: d, receita: 0, lucro: 0, _ts: new Date(item.dataVenda) };
            byDate[d].receita += Number(item.precoVenda) || 0;
            byDate[d].lucro += (Number(item.precoVenda) - Number(item.precoCusto)) || 0;
        });
        const areaData = Object.values(byDate)
            .sort((a, b) => a._ts - b._ts)
            .map(({ _ts, ...rest }) => rest);

        // ── Pie Chart data: group by canal ──────────────────
        const byCanal = {};
        itensVendidos.forEach(item => {
            const canal = canaisVenda.find(c => c.id === item.canalVendaId);
            const nome = canal?.nome ?? 'Não informado';
            if (!byCanal[nome]) byCanal[nome] = { name: nome, value: 0 };
            byCanal[nome].value += 1;
        });
        const pieData = Object.values(byCanal).sort((a, b) => b.value - a.value);

        return { receita, custo, lucro, margem, markup, qtdVendas: itensVendidos.length, recentes, areaData, pieData };
    }, [itensEstoque, produtos, canaisVenda, periodo, formatDate]);

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatYAxis = (val) => val >= 1000 ? `R$${(val / 1000).toFixed(0)}k` : `R$${val}`;

    // CountUp values
    const animReceita = useCountUp(dadosCalculados.receita, 900, 2);
    const animLucro = useCountUp(dadosCalculados.lucro, 900, 2);
    const animMargem = useCountUp(dadosCalculados.margem, 900, 1);
    const animMarkup = useCountUp(dadosCalculados.markup, 900, 1);

    if (isLoading) return <DashboardSkeleton />;

    return (
        <div className="container animate-in fade-in duration-300">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Visão geral do seu negócio</p>
                </div>
                {/* Period Toggle */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm self-start sm:self-auto">
                    {[{ key: 'total', label: 'Total' }, { key: '30dias', label: 'Últimos 30 dias' }].map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setPeriodo(opt.key)}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${periodo === opt.key
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                <KPICard title="Receita Total" rawValue={dadosCalculados.receita} displayValue={formatCurrency(animReceita)} subvalue={`${dadosCalculados.qtdVendas} venda${dadosCalculados.qtdVendas !== 1 ? 's' : ''} realizadas`} icon={TrendingUp} variant="blue" />
                <KPICard title="Lucro Líquido" rawValue={dadosCalculados.lucro} displayValue={formatCurrency(animLucro)} subvalue="Retorno real sobre vendas" icon={DollarSign} variant="green" />
                <KPICard title="Margem de Lucro" rawValue={dadosCalculados.margem} displayValue={`${animMargem.toFixed(1)}%`} subvalue="Percentual sobre receita" icon={Percent} variant="purple" />
                <KPICard title="Markup Médio" rawValue={dadosCalculados.markup} displayValue={`${animMarkup.toFixed(1)}%`} subvalue="Retorno sobre custo" icon={BarChart2} variant="orange" />
            </div>

            {/* Charts Row */}
            {dadosCalculados.areaData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                    {/* Area Chart */}
                    <div className="card lg:col-span-2 p-0 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="section-heading">
                                <TrendingUp size={18} className="text-blue-500" />
                                Evolução de Receita e Lucro
                            </h2>
                        </div>
                        <div className="p-4 pt-6">
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={dadosCalculados.areaData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                    <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={52} />
                                    <RechartsTooltip content={<AreaTooltip />} />
                                    <Area type="monotone" dataKey="receita" name="Receita" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradReceita)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
                                    <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#22c55e" strokeWidth={2.5} fill="url(#gradLucro)" dot={false} activeDot={{ r: 4, fill: '#22c55e' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Donut Chart */}
                    <div className="card p-0 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="section-heading">
                                <ShoppingBag size={18} className="text-purple-500" />
                                Vendas por Canal
                            </h2>
                        </div>
                        <div className="p-4 flex flex-col items-center">
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie
                                        data={dadosCalculados.pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={48}
                                        outerRadius={72}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {dadosCalculados.pieData.map((_, i) => (
                                            <Cell key={i} fill={CANAL_COLORS[i % CANAL_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<PieCustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <PieLegend payload={dadosCalculados.pieData.map((d, i) => ({ value: d.name, color: CANAL_COLORS[i % CANAL_COLORS.length] }))} />
                        </div>
                    </div>

                </div>
            )}

            {/* Recent Sales */}
            <div className="card p-0 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="section-heading">
                        <BarChart2 size={18} className="text-blue-500" />
                        Vendas Recentes
                    </h2>
                    {dadosCalculados.recentes.length > 0 && (
                        <span className="badge badge-blue">{dadosCalculados.recentes.length} registros</span>
                    )}
                </div>

                {dadosCalculados.recentes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon"><BarChart2 size={28} /></div>
                        <p className="empty-state-title">Nenhuma venda no período</p>
                        <p className="empty-state-subtitle">Registre sua primeira venda para ver o resumo aqui.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Produto</th>
                                    <th>Custo</th>
                                    <th>Venda</th>
                                    <th className="text-right">Lucro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dadosCalculados.recentes.map(item => (
                                    <tr key={item.id}>
                                        <td className="text-slate-500 dark:text-slate-400 text-sm">{formatDate(item.dataVenda)}</td>
                                        <td className="font-semibold text-slate-800 dark:text-slate-100">{item.productName}</td>
                                        <td className="text-slate-500 dark:text-slate-400 font-mono text-sm">{formatCurrency(item.precoCusto)}</td>
                                        <td className="text-blue-600 dark:text-blue-400 font-mono font-semibold">{formatCurrency(item.precoVenda)}</td>
                                        <td className="text-right">
                                            <span className="font-mono font-bold text-green-600">
                                                {formatCurrency(item.precoVenda - item.precoCusto)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
