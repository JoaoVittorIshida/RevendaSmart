import React from 'react';
import { useData } from '../contexts/DataContext';
import { FileText, Calendar, DollarSign, Search } from 'lucide-react';

const HistoricoVendas = () => {
    const { vendas } = useData();

    if (!vendas) {
        return (
            <div className="container">
                <div className="text-center p-8 text-gray-500">Carregando histórico...</div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Histórico de Vendas</h1>
                    <p className="text-secondary">Visualize todas as vendas realizadas no sistema</p>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FileText size={20} className="text-blue-500" />
                        Todas as Vendas
                    </h2>
                    <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                        Total: {vendas.length} registros
                    </span>
                </div>

                <div className="table-container">
                    {vendas.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <FileText size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Nenhuma venda registrada até o momento.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Produto</th>
                                    <th>Categoria</th>
                                    <th>Canal de Venda</th>
                                    <th className="text-right">Valor de Custo</th>
                                    <th className="text-right">Valor de Venda</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendas.map(venda => (
                                    <tr key={venda.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="font-medium text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(venda.data).toLocaleDateString()}
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
            </div>
        </div>
    );
};

export default HistoricoVendas;
