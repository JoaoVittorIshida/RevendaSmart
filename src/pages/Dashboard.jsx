import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { DollarSign, TrendingUp, Percent, BarChart2, ShoppingBag, ShoppingCart, Package, Tag } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LabelList
} from 'recharts';

const CANAL_COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ef4444', '#06b6d4'];

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
}).format(Number(value) || 0);

const formatYAxisCurrency = (value) => (value >= 1000 ? `R$${(value / 1000).toFixed(0)}k` : `R$${value}`);

const truncateLabel = (value, max = 18) => {
    if (!value) return '';
    return value.length > max ? `${value.slice(0, max)}...` : value;
};

const buildChannelData = (items, channelMap, channelIdKey) => {
    const grouped = {};

    items.forEach((item) => {
        const channel = channelMap.get(item[channelIdKey]);
        const channelName = channel?.nome ?? 'Não informado';

        if (!grouped[channelName]) {
            grouped[channelName] = { name: channelName, value: 0 };
        }

        grouped[channelName].value += 1;
    });

    return Object.values(grouped).sort((a, b) => b.value - a.value);
};

const useCountUp = (target, duration = 800, decimals = 0) => {
    const [value, setValue] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        const start = Date.now();

        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setValue(parseFloat((target * eased).toFixed(decimals)));

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(rafRef.current);
    }, [target, duration, decimals]);

    return value;
};

const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl ${className}`} />
);

const DashboardSkeleton = () => (
    <div className="container animate-in fade-in duration-300">
        <div className="page-header mb-8">
            <div>
                <Skeleton className="h-8 w-40 mb-2" />
                <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-10 w-48" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, index) => (
                <Skeleton key={index} className="h-32" />
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 grid gap-6">
                <Skeleton className="h-72" />
                <Skeleton className="h-72" />
            </div>
            <div className="grid gap-6">
                <Skeleton className="h-72" />
                <Skeleton className="h-72" />
            </div>
        </div>

        <Skeleton className="h-64" />
    </div>
);

const KPICard = ({ title, displayValue, subvalue, icon: Icon, variant }) => {
    const variants = {
        green: {
            card: 'kpi-card kpi-card-green',
            icon: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            value: 'text-green-700 dark:text-green-400',
            bar: 'bg-green-500'
        },
        blue: {
            card: 'kpi-card kpi-card-blue',
            icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            value: 'text-blue-700 dark:text-blue-400',
            bar: 'bg-blue-500'
        },
        purple: {
            card: 'kpi-card kpi-card-purple',
            icon: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            value: 'text-purple-700 dark:text-purple-400',
            bar: 'bg-purple-500'
        },
        orange: {
            card: 'kpi-card kpi-card-orange',
            icon: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
            value: 'text-orange-700 dark:text-orange-400',
            bar: 'bg-orange-500'
        }
    };

    const currentVariant = variants[variant] || variants.blue;

    return (
        <div className={currentVariant.card}>
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${currentVariant.bar}`} />

            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <p className="stat-label mb-2">{title}</p>
                    <p className={`text-2xl font-bold font-mono tracking-tight ${currentVariant.value}`}>{displayValue}</p>
                </div>

                <div className={`p-3 rounded-xl ${currentVariant.icon} shrink-0 ml-3 transition-transform duration-200 hover:scale-110`}>
                    <Icon size={22} />
                </div>
            </div>

            {subvalue && <p className="text-xs text-slate-400 font-medium mt-1">{subvalue}</p>}
        </div>
    );
};

const AreaTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="font-semibold text-slate-600 dark:text-slate-300 mb-2">{label}</p>
            {payload.map((item) => (
                <p key={item.dataKey} style={{ color: item.color }} className="font-mono font-bold">
                    {item.name}: {formatCurrency(item.value)}
                </p>
            ))}
        </div>
    );
};

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

const PieCustomTooltip = ({ active, payload, itemLabel = 'venda' }) => {
    if (!active || !payload?.length) return null;

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="font-semibold text-slate-700 dark:text-slate-200">{payload[0].name}</p>
            <p className="text-slate-500 dark:text-slate-400">
                {payload[0].value} {itemLabel}{payload[0].value !== 1 ? 's' : ''}
            </p>
        </div>
    );
};

const ChannelPieCard = ({ title, data, icon: Icon, iconClassName, itemLabel }) => (
    <div className="card p-0 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="section-heading">
                <Icon size={18} className={iconClassName} />
                {title}
            </h2>
        </div>

        <div className="p-4 flex-1 flex flex-col items-center justify-center">
            {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[160px] text-slate-400 dark:text-slate-500">
                    <Icon size={32} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">Sem dados no período</p>
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={72}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {data.map((_, index) => (
                                    <Cell key={index} fill={CANAL_COLORS[index % CANAL_COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip content={<PieCustomTooltip itemLabel={itemLabel} />} />
                        </PieChart>
                    </ResponsiveContainer>

                    <PieLegend
                        payload={data.map((item, index) => ({
                            value: item.name,
                            color: CANAL_COLORS[index % CANAL_COLORS.length]
                        }))}
                    />
                </>
            )}
        </div>
    </div>
);

const TopItemsTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const item = payload[0].payload;

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="font-semibold text-slate-700 dark:text-slate-200">{item.fullName}</p>
            <p className="text-slate-500 dark:text-slate-400">
                {item.value} venda{item.value !== 1 ? 's' : ''}
            </p>
            <p className="mt-2 font-mono font-semibold text-blue-600 dark:text-blue-400">
                Receita: {formatCurrency(item.receita)}
            </p>
        </div>
    );
};

const Dashboard = () => {
    const { isDark } = useTheme();
    const { itensEstoque, produtos, canaisVenda, canaisCompra, formatDate, isLoading } = useData();

    const [periodo, setPeriodo] = useState('total');
    const [topFiltro, setTopFiltro] = useState('produto');

    const dadosCalculados = useMemo(() => {
        const hoje = new Date();
        const dataLimite = new Date();
        dataLimite.setDate(hoje.getDate() - 30);

        const produtosMap = new Map(produtos.map((produto) => [produto.id, produto]));
        const canaisVendaMap = new Map(canaisVenda.map((canal) => [canal.id, canal]));
        const canaisCompraMap = new Map(canaisCompra.map((canal) => [canal.id, canal]));

        const itensVendidos = itensEstoque.filter((item) => {
            if (item.status !== 'vendido') return false;
            if (periodo === '30dias') return new Date(item.dataVenda) >= dataLimite;
            return true;
        });

        const itensComprados = itensEstoque.filter((item) => {
            if (periodo === '30dias') return new Date(item.dataEntrada) >= dataLimite;
            return true;
        });

        const vendasDetalhadas = itensVendidos.map((item) => {
            const produto = produtosMap.get(item.produtoId);
            const precoVenda = Number(item.precoVenda) || 0;
            const precoCusto = Number(item.precoCusto) || 0;

            return {
                ...item,
                precoVenda,
                precoCusto,
                lucro: precoVenda - precoCusto,
                productName: produto?.nome ?? 'Produto desconhecido',
                categoryName: produto?.categoria?.trim() || 'Sem categoria'
            };
        });

        const receita = vendasDetalhadas.reduce((acc, item) => acc + item.precoVenda, 0);
        const custo = vendasDetalhadas.reduce((acc, item) => acc + item.precoCusto, 0);
        const lucro = receita - custo;
        const margem = receita > 0 ? (lucro / receita) * 100 : 0;
        const markup = custo > 0 ? (lucro / custo) * 100 : 0;

        const recentes = [...vendasDetalhadas]
            .sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda))
            .slice(0, 5);

        const vendasPorData = {};
        vendasDetalhadas.forEach((item) => {
            const dateLabel = formatDate(item.dataVenda);

            if (!vendasPorData[dateLabel]) {
                vendasPorData[dateLabel] = {
                    date: dateLabel,
                    receita: 0,
                    lucro: 0,
                    _ts: new Date(item.dataVenda)
                };
            }

            vendasPorData[dateLabel].receita += item.precoVenda;
            vendasPorData[dateLabel].lucro += item.lucro;
        });

        const areaData = Object.values(vendasPorData)
            .sort((a, b) => a._ts - b._ts)
            .map(({ _ts, ...rest }) => rest);

        const salesChannelData = buildChannelData(vendasDetalhadas, canaisVendaMap, 'canalVendaId');
        const purchaseChannelData = buildChannelData(itensComprados, canaisCompraMap, 'canalCompraId');

        return {
            receita,
            custo,
            lucro,
            margem,
            markup,
            qtdVendas: vendasDetalhadas.length,
            recentes,
            areaData,
            salesChannelData,
            purchaseChannelData,
            vendasDetalhadas
        };
    }, [itensEstoque, produtos, canaisVenda, canaisCompra, periodo, formatDate]);

    const topChartData = useMemo(() => {
        const grouped = dadosCalculados.vendasDetalhadas.reduce((acc, item) => {
            const groupKey = topFiltro === 'categoria' ? item.categoryName : item.produtoId;
            const fullName = topFiltro === 'categoria' ? item.categoryName : item.productName;

            if (!acc[groupKey]) {
                acc[groupKey] = {
                    name: truncateLabel(fullName),
                    fullName,
                    value: 0,
                    receita: 0
                };
            }

            acc[groupKey].value += 1;
            acc[groupKey].receita += item.precoVenda;

            return acc;
        }, {});

        return Object.values(grouped)
            .sort((a, b) => b.value - a.value || b.receita - a.receita)
            .slice(0, 5);
    }, [dadosCalculados.vendasDetalhadas, topFiltro]);

    const animReceita = useCountUp(dadosCalculados.receita, 900, 2);
    const animLucro = useCountUp(dadosCalculados.lucro, 900, 2);
    const animMargem = useCountUp(dadosCalculados.margem, 900, 1);
    const animMarkup = useCountUp(dadosCalculados.markup, 900, 1);

    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const tickColor = isDark ? '#94a3b8' : '#64748b';
    const topChartColor = topFiltro === 'categoria' ? '#a855f7' : '#3b82f6';
    const topChartColorSoft = topFiltro === 'categoria' ? '#d8b4fe' : '#93c5fd';
    const TopChartIcon = topFiltro === 'categoria' ? Tag : Package;
    const topFilterLabel = topFiltro === 'categoria' ? 'Categorias' : 'Produtos';

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="container animate-in fade-in duration-300">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Visão geral do seu negócio</p>
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm self-start sm:self-auto">
                    {[
                        { key: 'total', label: 'Total' },
                        { key: '30dias', label: 'Últimos 30 dias' }
                    ].map((option) => (
                        <button
                            key={option.key}
                            onClick={() => setPeriodo(option.key)}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                                periodo === option.key
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                <KPICard
                    title="Receita Total"
                    displayValue={formatCurrency(animReceita)}
                    subvalue={`${dadosCalculados.qtdVendas} venda${dadosCalculados.qtdVendas !== 1 ? 's' : ''} realizadas`}
                    icon={TrendingUp}
                    variant="blue"
                />
                <KPICard
                    title="Lucro Líquido"
                    displayValue={formatCurrency(animLucro)}
                    subvalue="Retorno real sobre vendas"
                    icon={DollarSign}
                    variant="green"
                />
                <KPICard
                    title="Margem de Lucro"
                    displayValue={`${animMargem.toFixed(1)}%`}
                    subvalue="Percentual sobre receita"
                    icon={Percent}
                    variant="purple"
                />
                <KPICard
                    title="Markup Médio"
                    displayValue={`${animMarkup.toFixed(1)}%`}
                    subvalue="Retorno sobre custo"
                    icon={BarChart2}
                    variant="orange"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 grid gap-6">
                    <div className="card p-0 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                            <h2 className="section-heading">
                                <TrendingUp size={18} className="text-blue-500" />
                                Evolução de Receita e Lucro
                            </h2>
                        </div>

                        <div className="p-4 pt-6 flex-1 flex flex-col justify-center">
                            {dadosCalculados.areaData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[220px] text-slate-400 dark:text-slate-500">
                                    <TrendingUp size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm font-medium">Sem dados no período</p>
                                    <p className="text-xs mt-1">Nenhuma venda registrada.</p>
                                </div>
                            ) : (
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

                                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} />
                                        <YAxis
                                            tickFormatter={formatYAxisCurrency}
                                            tick={{ fontSize: 11, fill: tickColor }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={52}
                                        />
                                        <RechartsTooltip content={<AreaTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="receita"
                                            name="Receita"
                                            stroke="#3b82f6"
                                            strokeWidth={2.5}
                                            fill="url(#gradReceita)"
                                            dot={false}
                                            activeDot={{ r: 4, fill: '#3b82f6' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="lucro"
                                            name="Lucro"
                                            stroke="#22c55e"
                                            strokeWidth={2.5}
                                            fill="url(#gradLucro)"
                                            dot={false}
                                            activeDot={{ r: 4, fill: '#22c55e' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="card p-0 overflow-hidden flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                            <h2 className="section-heading">
                                <TopChartIcon size={18} className={topFiltro === 'categoria' ? 'text-purple-500' : 'text-blue-500'} />
                                {`Top ${topFilterLabel}`}
                            </h2>

                            <select
                                value={topFiltro}
                                onChange={(event) => setTopFiltro(event.target.value)}
                                className="select w-full sm:w-[160px] px-3 py-2 text-sm font-semibold self-start sm:self-auto"
                                aria-label="Selecionar filtro do ranking"
                            >
                                <option value="produto">Produtos</option>
                                <option value="categoria">Categorias</option>
                            </select>
                        </div>

                        <div className="p-4 pt-6 flex-1 flex flex-col justify-center">
                            {topChartData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[220px] text-slate-400 dark:text-slate-500">
                                    <TopChartIcon size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm font-medium">Sem dados no período</p>
                                    <p className="text-xs mt-1">As vendas aparecem aqui conforme o filtro escolhido.</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={topChartData} layout="vertical" margin={{ top: 4, right: 20, left: 12, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradTopItems" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor={topChartColorSoft} stopOpacity={0.95} />
                                                <stop offset="100%" stopColor={topChartColor} stopOpacity={0.95} />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                                        <XAxis
                                            type="number"
                                            allowDecimals={false}
                                            tick={{ fontSize: 11, fill: tickColor }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={130}
                                            tick={{ fontSize: 11, fill: tickColor }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <RechartsTooltip
                                            cursor={{ fill: isDark ? 'rgba(51, 65, 85, 0.28)' : 'rgba(148, 163, 184, 0.12)' }}
                                            content={<TopItemsTooltip />}
                                        />
                                        <Bar dataKey="value" name="Vendas" fill="url(#gradTopItems)" radius={[0, 10, 10, 0]} barSize={24}>
                                            <LabelList dataKey="value" position="right" fill={tickColor} fontSize={11} fontWeight={700} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6">
                    <ChannelPieCard
                        title="Vendas por Canal"
                        data={dadosCalculados.salesChannelData}
                        icon={ShoppingBag}
                        iconClassName="text-purple-500"
                        itemLabel="venda"
                    />
                    <ChannelPieCard
                        title="Compras por Canal"
                        data={dadosCalculados.purchaseChannelData}
                        icon={ShoppingCart}
                        iconClassName="text-orange-500"
                        itemLabel="compra"
                    />
                </div>
            </div>

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
                        <div className="empty-state-icon">
                            <BarChart2 size={28} />
                        </div>
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
                                {dadosCalculados.recentes.map((item) => (
                                    <tr key={item.id}>
                                        <td className="text-slate-500 dark:text-slate-400 text-sm">{formatDate(item.dataVenda)}</td>
                                        <td className="font-semibold text-slate-800 dark:text-slate-100">{item.productName}</td>
                                        <td className="text-slate-500 dark:text-slate-400 font-mono text-sm">{formatCurrency(item.precoCusto)}</td>
                                        <td className="text-blue-600 dark:text-blue-400 font-mono font-semibold">{formatCurrency(item.precoVenda)}</td>
                                        <td className="text-right">
                                            <span className="font-mono font-bold text-green-600">
                                                {formatCurrency(item.lucro)}
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
