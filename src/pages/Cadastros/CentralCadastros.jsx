import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Tags, DollarSign, ShoppingBag, ArrowRight } from 'lucide-react';

const CadastroCard = ({ to, icon: Icon, title, description, color }) => (
    <Link to={to} className="card group hover:border-blue-400 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer block no-underline">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${color} text-white shadow-md`}>
                <Icon size={22} />
            </div>
            <ArrowRight className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" size={18} />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </Link>
);

const CentralCadastros = () => {
    return (
        <div className="container">
            <h1 className="page-title mb-8">Central de Cadastros</h1>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
                <CadastroCard
                    to="/cadastros/produtos"
                    icon={Package}
                    title="Produtos"
                    description="Gerencie seu catálogo de produtos, marcas e tipos."
                    color="bg-blue-600"
                />

                <CadastroCard
                    to="/cadastros/categorias"
                    icon={Tags}
                    title="Categorias"
                    description="Organize seus produtos em diferentes categorias."
                    color="bg-purple-600"
                />

                <CadastroCard
                    to="/cadastros/canais-venda"
                    icon={DollarSign}
                    title="Canais de Venda"
                    description="Cadastre onde você vende seus produtos (OLX, Face...)."
                    color="bg-green-600"
                />

                <CadastroCard
                    to="/cadastros/canais-compra"
                    icon={ShoppingBag}
                    title="Canais de Compra"
                    description="Cadastre seus fornecedores e fontes de aquisição."
                    color="bg-orange-600"
                />
            </div>
        </div>
    );
};

export default CentralCadastros;
