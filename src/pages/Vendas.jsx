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
    const [sale, setSale] = useState({ valorLiquido: 0, valorBruto: 0, taxa: 0, frete: 0, canalVendaId: '', dataVenda: localDate(), recebido: true });

    const availableProducts = produtos.filter((item) => itensEstoque.some((stock) => stock.produtoId === item.id && stock.status === 'disponivel'));
    const units = product ? itensEstoque.filter((item) => item.produtoId === product.id && item.status === 'disponivel') : [];
    const liquid = details ? Math.max(0, centavosParaReais(sale.valorBruto) - centavosParaReais(sale.taxa) - centavosParaReais(sale.frete)) : centavosParaReais(sale.valorLiquido);

    const reset = () => { setStep(1); setProduct(null); setUnit(null); setDetails(false); setSale({ valorLiquido: 0, valorBruto: 0, taxa: 0, frete: 0, canalVendaId: '', dataVenda: localDate(), recebido: true }); };
    const finish = async (event) => {
        event.preventDefault();
        if (!unit || !sale.canalVendaId || liquid < 0) return;
        const result = await venderItem(unit.id, {
            precoVenda: details ? undefined : liquid,
            valorBruto: details ? centavosParaReais(sale.valorBruto) : undefined,
            taxaPlataforma: details ? centavosParaReais(sale.taxa) : 0,
            freteVendedor: details ? centavosParaReais(sale.frete) : 0,
            canalVendaId: sale.canalVendaId,
            dataVenda: new Date(`${sale.dataVenda}T12:00:00`).toISOString(),
            recebido: sale.recebido
        });
        if (result.ok) { toast.success('Venda registrada!', sale.recebido ? `${product.nome} entrou no histórico.` : `${product.nome} foi adicionada aos recebimentos pendentes.`); reset(); }
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
        <div className="mb-8 grid grid-cols-3 text-xs font-semibold text-slate-500 dark:text-slate-400" aria-label={`Etapa ${step} de 3`}>
            {[['1', 'Produto'], ['2', 'Unidade'], ['3', 'Finalizar']].map(([number, label], index) => <div key={number} className={`relative flex min-w-0 flex-col items-center gap-1.5 ${index < 2 ? 'after:absolute after:left-[calc(50%+1.25rem)] after:top-4 after:h-px after:w-[calc(100%-2.5rem)] after:bg-slate-300 after:content-[\'\'] dark:after:bg-slate-600' : ''}`}><span className={`relative z-10 grid h-8 w-8 place-items-center rounded-full ${step >= Number(number) ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{step > Number(number) ? <Check size={16} /> : number}</span><span className="truncate">{label}</span></div>)}
        </div>
        {step === 1 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{availableProducts.map((item) => <button type="button" key={item.id} onClick={() => { setProduct(item); setStep(2); }} className="card text-left hover:border-blue-400 hover:-translate-y-0.5 transition-all">
            <div className="flex gap-4 items-center">{item.foto ? <img src={item.foto} alt="" className="w-14 h-14 rounded-xl object-cover" /> : <div className="w-14 h-14 grid place-items-center rounded-xl bg-slate-100 dark:bg-slate-700"><Package className="text-slate-400" /></div>}<div className="min-w-0"><p className="font-bold truncate">{item.nome}</p><p className="text-sm text-slate-500">{item.marca}</p><span className="badge badge-green mt-1">{itensEstoque.filter((stock) => stock.produtoId === item.id && stock.status === 'disponivel').length} un.</span></div></div>
        </button>)}</div>}
        {step === 2 && <div><button onClick={() => setStep(1)} className="btn-back mb-5"><ArrowLeft size={18} /></button><h2 className="mb-4 break-words text-xl font-bold">Selecione a unidade de {product.nome}</h2><div className="grid gap-3 md:grid-cols-2">{units.map((item, index) => <button key={item.id} type="button" onClick={() => { setUnit(item); setStep(3); }} className="card text-left transition-colors hover:border-blue-400"><div className="flex min-w-0 justify-between gap-3"><div className="min-w-0"><span className="badge badge-gray">#{index + 1}</span><p className="mt-2 text-sm text-slate-500">Entrada: {new Date(item.dataEntrada).toLocaleDateString('pt-BR')}</p></div><div className="shrink-0 text-right"><p className="stat-label">Custo</p><p className="font-mono font-bold">{money(item.precoCusto)}</p></div></div></button>)}</div></div>}
        {step === 3 && <div className="mx-auto max-w-2xl"><button onClick={() => setStep(2)} className="btn-back mb-5"><ArrowLeft size={18} /></button><div className="card mb-4 flex flex-col justify-between gap-3 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 sm:flex-row"><div className="min-w-0"><p className="stat-label">Produto</p><p className="break-words font-bold">{product.nome}</p></div><div className="shrink-0 sm:text-right"><p className="stat-label">Custo</p><p className="font-mono font-bold">{money(unit.precoCusto)}</p></div></div><div className="card"><form onSubmit={finish} className="space-y-5">
            <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50"><div><p className="label mb-0">Detalhar taxa e frete</p><p id="details-switch-description" className="mt-1 text-xs text-slate-500 dark:text-slate-400">{details ? 'Taxa e frete serão descontados do valor cobrado.' : 'Ative para informar o valor cobrado, taxa e frete separadamente.'}</p></div><button type="button" role="switch" aria-checked={details} aria-describedby="details-switch-description" aria-label="Detalhar taxa e frete" onClick={toggleDetails} className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${details ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700'}`}><span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${details ? 'translate-x-7' : 'translate-x-1'}`} /><span className="sr-only">{details ? 'Desativar detalhamento' : 'Ativar detalhamento'}</span></button></div>
            {!details ? <div><label className="label">Valor líquido da venda (R$)</label><input required inputMode="numeric" className="input text-xl font-mono font-bold text-green-600" value={formatarMoeda(sale.valorLiquido)} onChange={(event) => setSale({ ...sale, valorLiquido: parsearMoeda(event.target.value) })} placeholder="0,00" /></div> : <div className="grid sm:grid-cols-3 gap-4"><div><label className="label">Valor cobrado</label><input required inputMode="numeric" className="input" value={formatarMoeda(sale.valorBruto)} onChange={(event) => setSale({ ...sale, valorBruto: parsearMoeda(event.target.value) })} /></div><div><label className="label">Taxa</label><input inputMode="numeric" className="input" value={formatarMoeda(sale.taxa)} onChange={(event) => setSale({ ...sale, taxa: parsearMoeda(event.target.value) })} /></div><div><label className="label">Frete pago</label><input inputMode="numeric" className="input" value={formatarMoeda(sale.frete)} onChange={(event) => setSale({ ...sale, frete: parsearMoeda(event.target.value) })} /></div></div>}
            {details && <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900"><p className="stat-label">Valor líquido final</p><p className="font-mono text-2xl font-bold text-green-700 dark:text-green-400">{money(liquid)}</p></div>}
            <div><div className="flex flex-wrap items-start justify-between gap-2"><label className="label">Canal de venda</label><InlineCreate label="Canal de Venda" onSave={adicionarCanalVenda} onCreated={(item) => setSale((values) => ({ ...values, canalVendaId: item.id }))} /></div><select required className="select" value={sale.canalVendaId} onChange={(event) => setSale({ ...sale, canalVendaId: event.target.value })}><option value="">Selecione...</option>{canaisVenda.map((channel) => <option key={channel.id} value={channel.id}>{channel.nome}</option>)}</select></div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30"><input type="checkbox" checked={sale.recebido} onChange={(event) => setSale({ ...sale, recebido: event.target.checked })} className="mt-0.5 h-4 w-4 accent-emerald-600" /><span><span className="block font-semibold text-emerald-800 dark:text-emerald-300">Recebido</span><span className="mt-0.5 block text-xs text-emerald-700/80 dark:text-emerald-400/80">Desmarque para registrar a venda e acompanhá-la em Recebimentos até a baixa.</span></span></label>
            <div className="relative"><label className="label">Data da venda</label><input ref={dateRef} required type="date" className="input date-input pr-11" value={sale.dataVenda} onChange={(event) => setSale({ ...sale, dataVenda: event.target.value })} /><Calendar className="pointer-events-none absolute right-3 bottom-3 text-slate-400 dark:text-slate-500" size={18} aria-hidden="true" /></div>
            <button className="btn btn-success w-full py-3"><ShoppingCart size={19} />Confirmar venda</button>
        </form></div></div>}
    </div>;
};

export default Vendas;
