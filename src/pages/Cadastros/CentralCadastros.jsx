import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Tags, DollarSign, ShoppingBag, ArrowRight } from 'lucide-react';

const CadastroCard = ({ to, icon: Icon, title, description, color }) => (
    <Link to={to} className="card group hover:border-blue-500/50 transition-colors cursor-pointer block" style={{ textDecoration: 'none' }}>
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${color} text-white shadow-lg`}>
                <Icon size={24} />
            </div>
            <ArrowRight className="text-gray-400 group-hover:text-blue-500 transition-colors" size={20} />
        </div>
        <h3 className="text-xl font-bold text-primary mb-2 tracking-wide">{title}</h3>
        <p className="text-secondary text-sm leading-relaxed">{description}</p>
    </Link>
);

const CentralCadastros = () => {
    return (
        <div className="container">
            <h1 className="text-3xl font-bold text-primary mb-8">Central de Cadastros</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
