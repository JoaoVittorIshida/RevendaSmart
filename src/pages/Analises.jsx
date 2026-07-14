import React, { useMemo } from 'react';
import { BarChart3, Clock3, PackageSearch, TrendingUp } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const plural = (value, singular, pluralWord) => `${value} ${value === 1 ? singular : pluralWord}`;

const Analises = () => {
    const { vendas, itensEstoque, analises, isLoading } = useData();
    const completedWithDuration = useMemo(() => {
        const entries = new Map(itensEstoque.map((item) => [item.id, item.dataEntrada]));
        return vendas
            .filter((sale) => sale.status === 'concluida' && !sale.dadosIncompletos && entries.has(sale.estoqueId))
            .map((sale) => ({ ...sale, days: Math.max(0, Math.round((new Date(sale.data) - new Date(entries.get(sale.estoqueId))) / 86400000)) }));
    }, [itensEstoque, vendas]);
    const fastest = useMemo(() => [...completedWithDuration].sort((a, b) => a.days - b.days).slice(0, 5), [completedWithDuration]);
    const averageDays = completedWithDuration.length ? Math.round(completedWithDuration.reduce((sum, sale) => sum + sale.days, 0) / completedWithDuration.length) : 0;
    const data = analises || { vendasConcluidas: 0, capitalImobilizado: 0, maisLucrativos: [] };

    if (isLoading) return <div className="container"><div className="page-header"><div><h1 className="page-title">Análises</h1><p className="page-subtitle">Carregando os indicadores da sua operação...</p></div></div><div className="grid sm:grid-cols-3 gap-4"><div className="card h-36 animate-pulse bg-slate-100 dark:bg-slate-800" /><div className="card h-36 animate-pulse bg-slate-100 dark:bg-slate-800" /><div className="card h-36 animate-pulse bg-slate-100 dark:bg-slate-800" /></div></div>;

    return <div className="container"><div className="page-header"><div><h1 className="page-title">Análises</h1><p className="page-subtitle">Decisões de revenda sem poluir o dashboard.</p></div></div><div className="grid sm:grid-cols-3 gap-4 mb-7"><div className="card"><Clock3 className="text-violet-500 mb-3" /><p className="stat-label">Giro médio</p><p className="text-2xl font-mono font-bold">{averageDays} dias</p><p className="text-xs text-slate-500 mt-1">Baseado em todas as vendas completas</p></div><div className="card"><TrendingUp className="text-green-500 mb-3" /><p className="stat-label">Vendas concluídas</p><p className="text-2xl font-mono font-bold">{data.vendasConcluidas}</p></div><div className="card"><PackageSearch className="text-blue-500 mb-3" /><p className="stat-label">Capital em estoque</p><p className="text-2xl font-mono font-bold">{money(data.capitalImobilizado)}</p></div></div><div className="grid lg:grid-cols-2 gap-6"><section className="card"><div className="flex items-center gap-2 mb-4"><BarChart3 className="text-blue-500" /><h2 className="section-heading">Mais lucrativos</h2></div>{data.maisLucrativos.length ? <div className="space-y-3">{data.maisLucrativos.map((item) => <div key={item.nome} className="flex justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-3"><div className="min-w-0"><p className="font-semibold truncate">{item.nome}</p><p className="text-xs text-slate-500">{plural(item.vendas, 'venda', 'vendas')}</p></div><p className="font-mono font-bold text-green-600 shrink-0">{money(item.lucro)}</p></div>)}</div> : <p className="text-slate-500">Ainda não há vendas completas para analisar.</p>}</section><section className="card"><div className="flex items-center gap-2 mb-4"><Clock3 className="text-amber-500" /><h2 className="section-heading">Vendas mais rápidas</h2></div>{fastest.length ? <div className="space-y-3">{fastest.map((sale) => <div key={sale.id} className="flex justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-3"><div className="min-w-0"><p className="font-semibold truncate">{sale.produto}</p><p className="text-xs text-slate-500">{plural(sale.days, 'dia', 'dias')} em estoque</p></div><p className="font-mono font-bold shrink-0">{money(sale.valor)}</p></div>)}</div> : <p className="text-slate-500">Ainda não há dados de giro.</p>}</section></div></div>;
};

export default Analises;
