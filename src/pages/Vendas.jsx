import React, { useRef, useState } from 'react';
import { ArrowLeft, Calendar, Check, Package, ShoppingCart } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../components/Toast';
import InlineCreate from '../components/InlineCreate';
import { centavosParaReais, formatarMoeda, parsearMoeda } from '../utils/currency';

const localDate = () => new Date().toLocaleDateString('en-CA');
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const Vendas = () => {
    const { produtos, itensEstoque, canaisVenda, venderItem, adicionarCanalVenda, isLoading } = useData();
    const toast = useToast();
    const dateRef = useRef(null);
    const [step, setStep] = useState(1);
    const [product, setProduct] = useState(null);
    const [unit, setUnit] = useState(null);
    const [details, setDetails] = useState(false);
    const [sale, setSale] = useState({ valorLiquido: 0, valorBruto: 0, taxa: 0, frete: 0, canalVendaId: '', dataVenda: localDate() });

    const availableProducts = produtos.filter((item) => itensEstoque.some((stock) => stock.produtoId === item.id && stock.status === 'disponivel'));
    const units = product ? itensEstoque.filter((item) => item.produtoId === product.id && item.status === 'disponivel') : [];
    const liquid = details ? Math.max(0, centavosParaReais(sale.valorBruto) - centavosParaReais(sale.taxa) - centavosParaReais(sale.frete)) : centavosParaReais(sale.valorLiquido);

    const reset = () => { setStep(1); setProduct(null); setUnit(null); setDetails(false); setSale({ valorLiquido: 0, valorBruto: 0, taxa: 0, frete: 0, canalVendaId: '', dataVenda: localDate() }); };
    const finish = async (event) => {
        event.preventDefault();
        if (!unit || !sale.canalVendaId || liquid < 0) return;
        const result = await venderItem(unit.id, {
            precoVenda: details ? undefined : liquid,
            valorBruto: details ? centavosParaReais(sale.valorBruto) : undefined,
            taxaPlataforma: details ? centavosParaReais(sale.taxa) : 0,
            freteVendedor: details ? centavosParaReais(sale.frete) : 0,
            canalVendaId: sale.canalVendaId,
            dataVenda: new Date(`${sale.dataVenda}T12:00:00`).toISOString()
        });
        if (result.ok) { toast.success('Venda registrada!', `${product.nome} entrou no histórico.`); reset(); }
        else toast.error('Erro ao registrar venda', result.message);
    };
    const toggleDetails = () => {
        setDetails((current) => {
            if (!current) setSale((values) => ({ ...values, valorBruto: values.valorLiquido, taxa: 0, frete: 0 }));
            return !current;
        });
    };

    if (isLoading) return <div className="container max-w-6xl"><div className="page-header"><div><h1 className="page-title">Registrar Venda</h1><p className="page-subtitle">Carregando itens disponíveis...</p></div></div><div className="grid sm:grid-cols-3 gap-4"><div className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-800" /><div className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-800" /><div className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-800" /></div></div>;

    return <div className="container max-w-6xl">
        <div className="page-header"><div><h1 className="page-title">Registrar Venda</h1><p className="page-subtitle">Venda rápida por unidade, com detalhamento só quando precisar.</p></div></div>
        <div className="flex items-center gap-2 mb-8 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {[['1', 'Produto'], ['2', 'Unidade'], ['3', 'Finalizar']].map(([number, label], index) => <React.Fragment key={number}><span className={`w-8 h-8 rounded-full grid place-items-center ${step >= Number(number) ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{step > Number(number) ? <Check size={16} /> : number}</span><span>{label}</span>{index < 2 && <span className="w-8 h-px bg-slate-300 dark:bg-slate-600" />}</React.Fragment>)}
        </div>
        {step === 1 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{availableProducts.map((item) => <button type="button" key={item.id} onClick={() => { setProduct(item); setStep(2); }} className="card text-left hover:border-blue-400 hover:-translate-y-0.5 transition-all">
            <div className="flex gap-4 items-center">{item.foto ? <img src={item.foto} alt="" className="w-14 h-14 rounded-xl object-cover" /> : <div className="w-14 h-14 grid place-items-center rounded-xl bg-slate-100 dark:bg-slate-700"><Package className="text-slate-400" /></div>}<div className="min-w-0"><p className="font-bold truncate">{item.nome}</p><p className="text-sm text-slate-500">{item.marca}</p><span className="badge badge-green mt-1">{itensEstoque.filter((stock) => stock.produtoId === item.id && stock.status === 'disponivel').length} un.</span></div></div>
        </button>)}</div>}
        {step === 2 && <div><button onClick={() => setStep(1)} className="btn-back mb-5"><ArrowLeft size={18} /></button><h2 className="text-xl font-bold mb-4">Selecione a unidade de {product.nome}</h2><div className="grid md:grid-cols-2 gap-3">{units.map((item, index) => <button key={item.id} type="button" onClick={() => { setUnit(item); setStep(3); }} className="card text-left hover:border-blue-400 transition-colors"><div className="flex justify-between"><div><span className="badge badge-gray">#{index + 1}</span><p className="mt-2 text-sm text-slate-500">Entrada: {new Date(item.dataEntrada).toLocaleDateString('pt-BR')}</p></div><div className="text-right"><p className="stat-label">Custo</p><p className="font-mono font-bold">{money(item.precoCusto)}</p></div></div></button>)}</div></div>}
        {step === 3 && <div className="max-w-2xl mx-auto"><button onClick={() => setStep(2)} className="btn-back mb-5"><ArrowLeft size={18} /></button><div className="card bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 mb-4 flex justify-between"><div><p className="stat-label">Produto</p><p className="font-bold">{product.nome}</p></div><div className="text-right"><p className="stat-label">Custo</p><p className="font-mono font-bold">{money(unit.precoCusto)}</p></div></div><div className="card"><form onSubmit={finish} className="space-y-5">
            <div className="flex items-center justify-between"><label className="label mb-0">Detalhar taxa e frete</label><button type="button" onClick={toggleDetails} className={`badge ${details ? 'badge-blue' : 'badge-gray'}`}>{details ? 'Ativo' : 'Opcional'}</button></div>
            {!details ? <div><label className="label">Valor líquido recebido (R$)</label><input required inputMode="numeric" className="input text-xl font-mono font-bold text-green-600" value={formatarMoeda(sale.valorLiquido)} onChange={(event) => setSale({ ...sale, valorLiquido: parsearMoeda(event.target.value) })} placeholder="0,00" /></div> : <div className="grid sm:grid-cols-3 gap-4"><div><label className="label">Valor cobrado</label><input required inputMode="numeric" className="input" value={formatarMoeda(sale.valorBruto)} onChange={(event) => setSale({ ...sale, valorBruto: parsearMoeda(event.target.value) })} /></div><div><label className="label">Taxa</label><input inputMode="numeric" className="input" value={formatarMoeda(sale.taxa)} onChange={(event) => setSale({ ...sale, taxa: parsearMoeda(event.target.value) })} /></div><div><label className="label">Frete pago</label><input inputMode="numeric" className="input" value={formatarMoeda(sale.frete)} onChange={(event) => setSale({ ...sale, frete: parsearMoeda(event.target.value) })} /></div></div>}
            {details && <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900"><p className="stat-label">Valor líquido final</p><p className="font-mono text-2xl font-bold text-green-700 dark:text-green-400">{money(liquid)}</p></div>}
            <div><div className="flex justify-between"><label className="label">Canal de venda</label><InlineCreate label="Canal de Venda" onSave={adicionarCanalVenda} onCreated={(item) => setSale((values) => ({ ...values, canalVendaId: item.id }))} /></div><select required className="select" value={sale.canalVendaId} onChange={(event) => setSale({ ...sale, canalVendaId: event.target.value })}><option value="">Selecione...</option>{canaisVenda.map((channel) => <option key={channel.id} value={channel.id}>{channel.nome}</option>)}</select></div>
            <div className="relative"><label className="label">Data da venda</label><input ref={dateRef} required type="date" className="input" value={sale.dataVenda} onChange={(event) => setSale({ ...sale, dataVenda: event.target.value })} /><Calendar className="absolute right-3 bottom-3 text-slate-400" size={18} /></div>
            <button className="btn btn-success w-full py-3"><ShoppingCart size={19} />Confirmar venda</button>
        </form></div></div>}
    </div>;
};

export default Vendas;
