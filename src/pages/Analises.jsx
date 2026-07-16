import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, CircleAlert, Clock3, CreditCard, Landmark, PackageSearch, Percent, ShoppingBag, ShoppingCart, Tags, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';

const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const number = (value) => new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
const percentage = (value) => `${(Number(value) || 0).toFixed(1)}%`;
const chartLabel = (value) => {
    const label = String(value || 'Não informado');
    return label.length > 14 ? `${label.slice(0, 13)}…` : label;
};
const dateInput = (date) => {
    const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return local.toISOString().slice(0, 10);
};
const periodFromDays = (days) => {
    const fim = new Date();
    const inicio = new Date(fim);
    inicio.setDate(inicio.getDate() - (days - 1));
    return { inicio: dateInput(inicio), fim: dateInput(fim) };
};
const initialPeriod = () => periodFromDays(30);
const periodOptions = [
    { id: '7', label: '7 dias', days: 7 },
    { id: '30', label: '30 dias', days: 30 },
    { id: '90', label: '90 dias', days: 90 },
    { id: 'todo', label: 'Todo o período' },
    { id: 'personalizado', label: 'Personalizado' }
];
const tabs = [
    { id: 'resumo', label: 'Resumo', icon: BarChart3 },
    { id: 'vendas', label: 'Canais de venda', icon: ShoppingBag },
    { id: 'compras', label: 'Canais de compra', icon: ShoppingCart },
    { id: 'categorias', label: 'Categorias', icon: Tags }
];

const Delta = ({ value, format = 'number' }) => {
    const numericValue = Number(value) || 0;
    if (numericValue === 0) return <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sem variação</span>;
    const positive = numericValue > 0;
    const formatted = format === 'money' ? money(numericValue) : format === 'points' ? `${numericValue.toFixed(1)} p.p.` : format === 'percent' ? percentage(numericValue) : number(numericValue);
    return <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {positive ? <ArrowUpRight size={14} aria-hidden="true" /> : <ArrowDownRight size={14} aria-hidden="true" />}
        {positive ? '+' : ''}{formatted}
    </span>;
};

const MetricCard = ({ icon: Icon, title, value, helper, delta, deltaFormat, variant = 'blue' }) => {
    const colors = {
        blue: 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40',
        green: 'text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-950/40',
        violet: 'text-violet-600 bg-violet-50 dark:text-violet-300 dark:bg-violet-950/40',
        amber: 'text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40'
    };
    return <section className="card" aria-label={title}>
        <div className="flex items-start justify-between gap-3">
            <div><p className="stat-label">{title}</p><p className="mt-2 text-2xl font-mono font-bold tracking-tight">{value}</p></div>
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[variant]}`}>{React.createElement(Icon, { size: 20, 'aria-hidden': true })}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs text-slate-500 dark:text-slate-400">{helper}</span>{delta !== undefined && <Delta value={delta} format={deltaFormat} />}</div>
    </section>;
};

const EmptyPanel = ({ message }) => <div className="p-8 text-center text-slate-500 dark:text-slate-400"><BarChart3 className="mx-auto mb-3 opacity-50" size={30} aria-hidden="true" /><p className="text-sm">{message}</p></div>;

const PerformanceTable = ({ title, description, rows = [], type, icon: Icon }) => {
    const columns = type === 'venda'
        ? [{ label: 'Canal', get: (row) => row.nome }, { label: 'Vendas', get: (row) => number(row.vendas), className: 'font-mono' }, { label: 'Líquido', get: (row) => money(row.receitaLiquida), className: 'font-mono' }, { label: 'Lucro', get: (row) => money(row.lucroLiquido), className: 'font-mono text-green-600 dark:text-green-400' }, { label: 'Margem', get: (row) => percentage(row.margem), className: 'font-mono' }]
        : type === 'compra'
            ? [{ label: 'Canal', get: (row) => row.nome }, { label: 'Vendas', get: (row) => number(row.vendas), className: 'font-mono' }, { label: 'Lucro', get: (row) => money(row.lucroLiquido), className: 'font-mono text-green-600 dark:text-green-400' }, { label: 'ROI', get: (row) => percentage(row.roi), className: 'font-mono text-green-600 dark:text-green-400' }, { label: 'Giro', get: (row) => `${Math.round(row.giroMedio)} dias`, className: 'font-mono' }]
            : [{ label: 'Categoria', get: (row) => row.nome }, { label: 'Vendas', get: (row) => number(row.vendas), className: 'font-mono' }, { label: 'Lucro', get: (row) => money(row.lucroLiquido), className: 'font-mono text-green-600 dark:text-green-400' }, { label: 'Margem', get: (row) => percentage(row.margem), className: 'font-mono' }, { label: 'Giro', get: (row) => `${Math.round(row.giroMedio)} dias`, className: 'font-mono' }];
    return <section className="card p-0 overflow-hidden">
        <div className="flex gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700">{React.createElement(Icon, { size: 19, className: 'mt-0.5 text-blue-500 shrink-0', 'aria-hidden': true })}<div><h2 className="section-heading">{title}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p></div></div>
        {!rows.length ? <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Ainda não há vendas completas no período.</p> : <div className="table-container" aria-label="Deslize a tabela para ver mais colunas"><table className="min-w-[620px]"><thead><tr>{columns.map((column) => <th scope="col" key={column.label}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id || row.nome}>{columns.map((column) => <td key={column.label} className={column.className || ''}>{column.get(row)}</td>)}</tr>)}</tbody></table></div>}
    </section>;
};

const ProfitChart = ({ title, description, rows = [], color, icon: Icon, chartColors, isDark, emptyMessage }) => {
    const chartData = useMemo(() => rows.slice(0, 6).map((row) => ({ nome: row.nome, lucro: row.lucroLiquido })), [rows]);
    return <section className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700"><h2 className="section-heading">{React.createElement(Icon, { size: 19, className: color === '#8b5cf6' ? 'text-violet-500' : 'text-green-500', 'aria-hidden': true })}{title}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p></div>
        {chartData.length ? <div className="h-72 p-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 10, left: 4, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} /><XAxis dataKey="nome" tickFormatter={chartLabel} minTickGap={16} tick={{ fill: chartColors.tick, fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis tickFormatter={(value) => `R$${value}`} tick={{ fill: chartColors.tick, fontSize: 11 }} tickLine={false} axisLine={false} width={56} /><Tooltip cursor={{ fill: chartColors.cursor }} formatter={(value) => money(value)} contentStyle={{ backgroundColor: chartColors.tooltipBackground, borderColor: chartColors.tooltipBorder, borderRadius: 12, color: chartColors.tooltipText, boxShadow: isDark ? '0 12px 28px rgba(0, 0, 0, 0.3)' : '0 12px 28px rgba(15, 23, 42, 0.12)' }} labelStyle={{ color: chartColors.tooltipText }} itemStyle={{ color }} /><Bar dataKey="lucro" name="Lucro" fill={color} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyPanel message={emptyMessage} />}
    </section>;
};

const InventoryTable = ({ title, description, rows = [], dimension, icon: Icon }) => <section className="card p-0 overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700"><h2 className="section-heading">{React.createElement(Icon, { size: 19, className: 'text-orange-500', 'aria-hidden': true })}{title}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p></div>
    {!rows.length ? <EmptyPanel message="Não há estoque ativo para analisar." /> : <div className="table-container" aria-label="Deslize a tabela para ver mais colunas"><table className="min-w-[620px]"><thead><tr><th scope="col">{dimension}</th><th scope="col">Unidades</th><th scope="col">Capital</th><th scope="col">30–59 dias</th><th scope="col">60–89 dias</th><th scope="col">90+ dias</th></tr></thead><tbody>{rows.map((row) => <tr key={row.nome}><td className="font-medium capitalize">{row.nome}</td><td className="font-mono">{number(row.unidades)}</td><td className="font-mono">{money(row.capital)}</td><td className="font-mono">{number(row.parados30a59)}</td><td className="font-mono">{number(row.parados60a89)}</td><td className="font-mono text-amber-600 dark:text-amber-400">{number(row.parados90Mais)}</td></tr>)}</tbody></table></div>}
</section>;

const CategoryHighlights = ({ categories = [], inventory = [] }) => {
    const highestMargin = [...categories].filter((item) => item.vendas >= 3).sort((a, b) => b.margem - a.margem)[0];
    const mostProfit = categories[0];
    const mostAged = [...inventory].filter((item) => item.parados90Mais > 0).sort((a, b) => b.parados90Mais - a.parados90Mais || b.capital - a.capital)[0];
    const highlights = [
        { label: 'Mais lucrativa', item: mostProfit, value: mostProfit && money(mostProfit.lucroLiquido), helper: mostProfit && `${number(mostProfit.vendas)} vendas no período`, tone: 'text-green-600 dark:text-green-400' },
        { label: 'Maior margem', item: highestMargin, value: highestMargin && percentage(highestMargin.margem), helper: highestMargin ? 'Com pelo menos 3 vendas' : 'Ainda sem amostra suficiente', tone: 'text-violet-600 dark:text-violet-400' },
        { label: 'Capital com 90+ dias', item: mostAged, value: mostAged && money(mostAged.capital), helper: mostAged ? `${number(mostAged.parados90Mais)} unid. com 90+ dias` : 'Sem itens com mais de 90 dias', tone: 'text-amber-600 dark:text-amber-400' }
    ];
    return <section className="card p-0 overflow-hidden"><div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700"><h2 className="section-heading"><Tags size={19} className="text-violet-500" />Decisões por categoria</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Destaques para orientar compra, preço e reposição.</p></div><div className="divide-y divide-slate-100 dark:divide-slate-700">{highlights.map((highlight) => <div key={highlight.label} className="px-5 py-4"><p className="stat-label">{highlight.label}</p>{highlight.item ? <><p className="mt-1 truncate font-medium">{highlight.item.nome}</p><p className={`mt-1 font-mono text-lg font-bold ${highlight.tone}`}>{highlight.value}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{highlight.helper}</p></> : <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{highlight.helper}</p>}</div>)}</div></section>;
};

const Analises = () => {
    const { buscarAnalises } = useData();
    const { isDark } = useTheme();
    const [draft, setDraft] = useState(initialPeriod);
    const [period, setPeriod] = useState(initialPeriod);
    const [periodMode, setPeriodMode] = useState('30');
    const [activeTab, setActiveTab] = useState('resumo');
    const tabRefs = useRef([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        buscarAnalises(period).then((result) => {
            if (!active) return;
            if (result.ok) {
                setData(result.data);
                setError('');
            } else setError(result.message);
            setLoading(false);
        }).catch(() => {
            if (active) {
                setError('Não foi possível carregar as análises.');
                setLoading(false);
            }
        });
        return () => { active = false; };
    }, [buscarAnalises, period]);

    const resumo = data?.resumo;
    const estoque = data?.estoque;
    const allPeriod = data?.periodo?.modo === 'todo';
    const chartColors = isDark
        ? { grid: '#334155', tick: '#94a3b8', tooltipBackground: '#0f172a', tooltipBorder: '#334155', tooltipText: '#e2e8f0', cursor: 'rgba(148, 163, 184, 0.14)' }
        : { grid: '#e2e8f0', tick: '#64748b', tooltipBackground: '#ffffff', tooltipBorder: '#e2e8f0', tooltipText: '#0f172a', cursor: 'rgba(15, 23, 42, 0.05)' };

    const selectPeriodMode = (option) => {
        setPeriodMode(option.id);
        if (option.id === 'personalizado') return;
        const nextPeriod = option.id === 'todo' ? { modo: 'todo' } : periodFromDays(option.days);
        if (option.days) setDraft(nextPeriod);
        setLoading(true);
        setError('');
        setPeriod(nextPeriod);
    };

    const updateCustomDate = (field, value) => {
        const next = { ...draft, [field]: value };
        setDraft(next);
        if (next.inicio && next.fim && next.inicio <= next.fim) {
            setLoading(true);
            setError('');
            setPeriod(next);
        } else if (next.inicio && next.fim) setError('A data inicial não pode ser posterior à data final.');
    };

    const moveTabFocus = (event, currentIndex) => {
        const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        setActiveTab(tabs[nextIndex].id);
        tabRefs.current[nextIndex]?.focus();
    };

    return <div className="container" aria-busy={loading}>
        <div className="page-header"><div><h1 className="page-title">Análises</h1><p className="page-subtitle">Entenda onde comprar, onde vender e onde seu capital está parado.</p></div></div>

        <section className="card mb-6" aria-label="Filtrar período das análises">
            <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 shrink-0"><CalendarDays size={20} aria-hidden="true" /></span><div><h2 className="section-heading">Escolha o período</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{periodMode === 'todo' ? 'Mostra todo o histórico registrado, sem comparar períodos.' : periodMode === 'personalizado' ? 'Atualiza automaticamente quando o intervalo for válido.' : 'Atualiza automaticamente e compara com o período anterior.'}</p></div></div>
            <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div className="flex flex-wrap gap-2" role="group" aria-label="Atalhos de período">{periodOptions.map((option) => <button key={option.id} type="button" onClick={() => selectPeriodMode(option)} aria-pressed={periodMode === option.id} className={`btn px-3 py-2 ${periodMode === option.id ? 'btn-primary' : 'btn-secondary'}`}>{option.label}</button>)}</div>{periodMode === 'personalizado' && <div className="grid sm:grid-cols-2 gap-3"><label className="text-sm font-medium text-slate-700 dark:text-slate-200">Início<input required type="date" className="input mt-1" value={draft.inicio} max={draft.fim} onChange={(event) => updateCustomDate('inicio', event.target.value)} /></label><label className="text-sm font-medium text-slate-700 dark:text-slate-200">Fim<input required type="date" className="input mt-1" value={draft.fim} min={draft.inicio} onChange={(event) => updateCustomDate('fim', event.target.value)} /></label></div>}</div>
            {loading && <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400" aria-live="polite">Atualizando análises…</p>}
        </section>

        {error && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><div className="flex gap-2"><CircleAlert size={18} className="shrink-0" aria-hidden="true" /><p>{error}</p></div></div>}
        {loading && !data ? <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{[0, 1, 2, 3].map((item) => <div key={item} className="card h-36 animate-pulse bg-slate-100 dark:bg-slate-800" />)}</div> : data && <>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
                <MetricCard title="Receita líquida" value={money(resumo.receitaLiquida)} helper={allPeriod ? 'Todo o histórico registrado' : 'Depois de taxas e frete · versus período anterior'} delta={data.comparativo?.receitaLiquida} deltaFormat="money" variant="blue" icon={TrendingUp} />
                <MetricCard title="Lucro líquido" value={money(resumo.lucroLiquido)} helper={allPeriod ? 'Todo o histórico registrado' : 'Receita líquida menos custo · versus período anterior'} delta={data.comparativo?.lucroLiquido} deltaFormat="money" variant="green" icon={Landmark} />
                <MetricCard title="Margem" value={percentage(resumo.margem)} helper={allPeriod ? 'Sobre todo o histórico registrado' : 'Sobre a receita líquida · versus período anterior'} delta={data.comparativo?.margem} deltaFormat="points" variant="violet" icon={Percent} />
                <MetricCard title="Estoque hoje" value={money(estoque.capital)} helper={`${number(estoque.unidades)} unid. ativas · ${number(estoque.parados30Mais)} com 30+ dias`} variant="amber" icon={PackageSearch} />
            </div>

            <div className="mb-6 overflow-x-auto border-b border-slate-200 dark:border-slate-700" role="tablist" aria-label="Dimensão da análise">{tabs.map((tab, index) => { const Icon = tab.icon; const selected = activeTab === tab.id; return <button key={tab.id} ref={(element) => { tabRefs.current[index] = element; }} id={`tab-${tab.id}`} role="tab" type="button" tabIndex={selected ? 0 : -1} aria-selected={selected} aria-controls={selected ? `panel-${tab.id}` : undefined} onClick={() => setActiveTab(tab.id)} onKeyDown={(event) => moveTabFocus(event, index)} className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${selected ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}><Icon size={17} aria-hidden="true" />{tab.label}</button>; })}</div>

            <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                {activeTab === 'resumo' && <>
                    <div className="grid xl:grid-cols-5 gap-6 mb-6">
                        <section className="card p-0 overflow-hidden xl:col-span-2"><div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700"><h2 className="section-heading"><CreditCard size={19} className="text-violet-500" />Origem do produto</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Nacional versus importado.</p></div>{!data.porOrigem.length ? <EmptyPanel message="Sem vendas completas no período." /> : <div className="table-container"><table><thead><tr><th scope="col">Origem</th><th scope="col">Lucro</th><th scope="col">Margem</th><th scope="col">Giro</th></tr></thead><tbody>{data.porOrigem.map((row) => <tr key={row.nome}><td className="font-medium capitalize">{row.nome}</td><td className="font-mono text-green-600 dark:text-green-400">{money(row.lucroLiquido)}</td><td className="font-mono">{percentage(row.margem)}</td><td className="font-mono">{Math.round(row.giroMedio)} dias</td></tr>)}</tbody></table></div>}</section>
                        <div className="xl:col-span-3"><InventoryTable title="Capital parado por origem" description="Faixas exclusivas mostram onde o capital envelhecido está concentrado." rows={estoque.porOrigem} dimension="Origem" icon={PackageSearch} /></div>
                    </div>
                    <div className="grid xl:grid-cols-2 gap-6"><section className="card p-0 overflow-hidden"><div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700"><h2 className="section-heading"><TrendingUp size={19} className="text-green-500" />Produtos mais lucrativos</h2></div>{!data.maisLucrativos.length ? <EmptyPanel message="Sem vendas completas no período." /> : <div className="divide-y divide-slate-100 dark:divide-slate-700">{data.maisLucrativos.map((row) => <div key={row.nome} className="flex items-center justify-between gap-4 px-5 py-3"><div className="min-w-0"><p className="font-medium truncate">{row.nome}</p><p className="text-xs text-slate-500">{number(row.vendas)} {row.vendas === 1 ? 'venda' : 'vendas'}</p></div><p className="font-mono font-bold text-green-600 dark:text-green-400">{money(row.lucro)}</p></div>)}</div>}</section><section className="card p-0 overflow-hidden"><div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700"><h2 className="section-heading"><Clock3 size={19} className="text-blue-500" />Vendas individuais mais rápidas</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use como referência de agilidade, não como média do produto.</p></div>{!data.vendasMaisRapidas.length ? <EmptyPanel message="Sem dados de giro no período." /> : <div className="divide-y divide-slate-100 dark:divide-slate-700">{data.vendasMaisRapidas.map((row) => <div key={row.id} className="flex items-center justify-between gap-4 px-5 py-3"><div className="min-w-0"><p className="font-medium truncate">{row.nome}</p><p className="text-xs text-slate-500">{number(row.dias)} {row.dias === 1 ? 'dia' : 'dias'} em estoque</p></div><p className="font-mono font-bold">{money(row.valor)}</p></div>)}</div>}</section></div>
                </>}

                {activeTab === 'vendas' && <div className="grid xl:grid-cols-2 gap-6"><PerformanceTable title="Canais de venda" description="Compare lucro real, margem e volume de cada canal." rows={data.porCanalVenda} type="venda" icon={ShoppingBag} /><ProfitChart title="Lucro por canal de venda" description="Compare canais com um volume parecido de vendas." rows={data.porCanalVenda} color="#22c55e" icon={BarChart3} chartColors={chartColors} isDark={isDark} emptyMessage="Os canais de venda aparecem após a primeira venda completa." /></div>}

                {activeTab === 'compras' && <div className="grid xl:grid-cols-2 gap-6"><PerformanceTable title="Canais de compra" description="ROI e giro mostram quais fontes retornam melhor." rows={data.porCanalCompra} type="compra" icon={ShoppingCart} /><InventoryTable title="Capital parado por compra" description="Faixas exclusivas de idade do estoque; priorize o valor." rows={estoque.porCanalCompra} dimension="Canal" icon={Clock3} /><section className="card p-0 overflow-hidden xl:col-span-2"><div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700"><h2 className="section-heading"><ShoppingCart size={19} className="text-orange-500" />Compra → venda</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Até 12 combinações mais lucrativas; use poucas vendas apenas como sinal inicial.</p></div>{!data.matrizCompraVenda.length ? <EmptyPanel message="A matriz aparece quando houver vendas completas." /> : <div className="table-container"><table className="min-w-[620px]"><thead><tr><th scope="col">Compra</th><th scope="col">Venda</th><th scope="col">Vendas</th><th scope="col">Lucro</th><th scope="col">Margem</th></tr></thead><tbody>{data.matrizCompraVenda.map((row) => <tr key={`${row.canalCompra}-${row.canalVenda}`}><td>{row.canalCompra}</td><td>{row.canalVenda}</td><td className="font-mono">{number(row.vendas)}{row.vendas < 3 && <span className="block text-xs font-sans text-amber-600 dark:text-amber-400">Amostra pequena</span>}</td><td className="font-mono text-green-600 dark:text-green-400">{money(row.lucroLiquido)}</td><td className="font-mono">{percentage(row.margem)}</td></tr>)}</tbody></table></div>}</section></div>}

                {activeTab === 'categorias' && <div className="space-y-6"><PerformanceTable title="Desempenho por categoria" description="Compare vendas, lucro, margem e giro para decidir o que priorizar." rows={data.porCategoria} type="categoria" icon={Tags} /><div className="grid xl:grid-cols-5 gap-6"><div className="xl:col-span-3"><ProfitChart title="Lucro por categoria" description="Categorias com maior retorno financeiro no período selecionado." rows={data.porCategoria} color="#8b5cf6" icon={Tags} chartColors={chartColors} isDark={isDark} emptyMessage="As categorias aparecem após a primeira venda completa." /></div><div className="xl:col-span-2"><CategoryHighlights categories={data.porCategoria} inventory={estoque.porCategoria} /></div></div><InventoryTable title="Capital parado por categoria" description="Veja quais tipos de produto estão segurando capital há mais tempo." rows={estoque.porCategoria} dimension="Categoria" icon={PackageSearch} /></div>}
            </div>
        </>}
    </div>;
};

export default Analises;
