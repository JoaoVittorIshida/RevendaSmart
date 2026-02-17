import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { DollarSign, TrendingUp, TrendingDown, Percent, Calendar } from 'lucide-react';

const KPICard = ({ title, value, subvalue, icon: Icon, color }) => (
    <div className="card">
        <div className="flex items-start justify-between mb-4">
            <div>
                <p className="text-sm font-medium uppercase tracking-wider text-secondary">{title}</p>
                <h3 className="text-2xl font-bold mt-1 text-primary">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
                <Icon size={24} />
            </div>
        </div>
        {subvalue && (
            <p className="text-sm text-secondary">
                {subvalue}
            </p>
        )}
    </div>
);

const Dashboard = () => {
    const { itensEstoque, produtos } = useData();
    const [periodo, setPeriodo] = useState('total'); // 'total' | '30dias'

    const dadosCalculados = useMemo(() => {
        const hoje = new Date();
        const dataLimite = new Date();
        dataLimite.setDate(hoje.getDate() - 30);

        // Filtra itens vendidos e pelo periodo
        const itensVendidos = itensEstoque.filter(item => {
            if (item.status !== 'vendido') return false;
            if (periodo === '30dias') {
                const dataVenda = new Date(item.dataVenda);
                return dataVenda >= dataLimite;
            }
            return true;
        });

        const receita = itensVendidos.reduce((acc, item) => acc + (Number(item.precoVenda) || 0), 0);
        const custo = itensVendidos.reduce((acc, item) => acc + (Number(item.precoCusto) || 0), 0);
        const lucro = receita - custo;

        // Margem = (Lucro / Receita) * 100
        const margem = receita > 0 ? (lucro / receita) * 100 : 0;

        // Markup = (Lucro / Custo) * 100 (ou PrecoVenda / Custo - 1)
        const markup = custo > 0 ? (lucro / custo) * 100 : 0;

        const recentes = itensVendidos
            .sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda))
            .slice(0, 5)
            .map(item => {
                const prod = produtos.find(p => p.id === item.produtoId);
                return {
                    ...item,
                    productName: prod ? prod.nome : 'Produto Desconhecido'
                };
            });

        return {
            receita,
            custo,
            lucro,
            margem,
            markup,
            qtdVendas: itensVendidos.length,
            recentes
        };
    }, [itensEstoque, produtos, periodo]);

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatPercent = (val) => `${val.toFixed(2)}%`;

    return (
        <div className="container">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
                    <p className="text-secondary">Visão geral do seu negócio</p>
                </div>

                <div className="flex items-center gap-2 bg-white/50 p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button
                        onClick={() => setPeriodo('total')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${periodo === 'total' ? 'bg-blue-600 text-white shadow-md' : 'text-secondary hover:text-primary hover:bg-gray-100'}`}
                    >
                        Total
                    </button>
                    <button
                        onClick={() => setPeriodo('30dias')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${periodo === '30dias' ? 'bg-blue-600 text-white shadow-md' : 'text-secondary hover:text-primary hover:bg-gray-100'}`}
                    >
                        Últimos 30 Dias
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KPICard
                    title="Receita Total"
                    value={formatCurrency(dadosCalculados.receita)}
                    subvalue={`${dadosCalculados.qtdVendas} vendas realizadas`}
                    icon={TrendingUp}
                    color="text-green-600 bg-green-100"
                />

                <KPICard
                    title="Lucro Líquido"
                    value={formatCurrency(dadosCalculados.lucro)}
                    subvalue="Retorno real sobre vendas"
                    icon={DollarSign}
                    color="text-blue-600 bg-blue-100"
                />

                <KPICard
                    title="Margem de Lucro"
                    value={formatPercent(dadosCalculados.margem)}
                    subvalue="Sobre a receita"
                    icon={Percent}
                    color="text-purple-600 bg-purple-100"
                />

                <KPICard
                    title="Markup Médio"
                    value={formatPercent(dadosCalculados.markup)}
                    subvalue="Sobre o custo"
                    icon={TrendingUp}
                    color="text-orange-600 bg-orange-100"
                />
            </div>

            <div className="flex flex-col gap-8">


                <div className="card">
                    <h2 className="text-xl font-bold text-primary mb-6">Vendas Recentes</h2>
                    {dadosCalculados.recentes.length === 0 ? (
                        <div className="text-center py-12 text-secondary">Nenhuma venda registrada no período.</div>
                    ) : (
                        <div className="table-container">
                            <table className="w-full text-left">
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
                                            <td className="text-secondary">
                                                {new Date(item.dataVenda).toLocaleDateString()}
                                            </td>
                                            <td className="text-primary font-medium">
                                                {item.productName}
                                            </td>
                                            <td className="text-secondary">
                                                {formatCurrency(item.precoCusto)}
                                            </td>
                                            <td className="text-green-600 font-medium">
                                                {formatCurrency(item.precoVenda)}
                                            </td>
                                            <td className="text-right text-blue-600 font-bold">
                                                {formatCurrency(item.precoVenda - item.precoCusto)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
