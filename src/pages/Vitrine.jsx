import React, { useMemo, useState } from 'react';
import {
    Copy, Download, ExternalLink, Globe2, ImagePlus, MapPin, MessageCircle,
    Pencil, Plus, Radio, Store, Trash2
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import RichTextEditor from '../components/RichTextEditor';
import { formatarMoeda, parsearMoeda, centavosParaReais } from '../utils/currency';

const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const emptyAdForm = { produtoId: '', nomeAnuncio: '', precoCentavos: 0, descricao: '', linkOlx: '', linkFacebook: '', linkMercadoLivre: '', linkOutros: '' };
const states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const htmlToText = (html) => {
    const element = document.createElement('div');
    element.innerHTML = html || '';
    return element.textContent?.trim() || '';
};

const formatWhatsapp = (value) => {
    const digits = String(value || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) => {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (ctx.measureText(candidate).width > maxWidth && line) { lines.push(line); line = word; }
        else line = candidate;
    });
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach((current, index) => ctx.fillText(index === maxLines - 1 && lines.length > maxLines ? `${current}…` : current, x, y + index * lineHeight));
};

const loadImage = (src) => new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
});

const createCard = async (ad, storeName) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponível neste navegador.');
    let imageDrawn = false;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(0, 0, 1080, 18);
    ctx.fillStyle = '#e2e8f0'; ctx.font = '700 64px sans-serif'; drawWrappedText(ctx, storeName || 'RevendaSmart', 80, 120, 920, 70, 1);
    if (ad.produto.foto) {
        const image = await loadImage(ad.produto.foto);
        if (image?.naturalWidth) {
            ctx.fillStyle = '#fff'; ctx.fillRect(80, 180, 920, 450);
            const scale = Math.min(920 / image.naturalWidth, 450 / image.naturalHeight);
            const width = image.naturalWidth * scale; const height = image.naturalHeight * scale;
            ctx.drawImage(image, 540 - width / 2, 405 - height / 2, width, height);
            imageDrawn = true;
        }
    }
    ctx.fillStyle = '#fff'; ctx.font = '800 66px sans-serif'; drawWrappedText(ctx, ad.nomeAnuncio, 80, 735, 920, 78);
    ctx.fillStyle = '#94a3b8'; ctx.font = '500 38px sans-serif'; ctx.fillText([ad.produto.marca, ad.produto.tipo].filter(Boolean).join(' · ').slice(0, 45), 80, 895);
    ctx.fillStyle = '#4ade80'; ctx.font = '800 82px sans-serif'; ctx.fillText(money(ad.precoAnuncio), 80, 1000);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Não foi possível gerar o PNG.');
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const safeName = ad.nomeAnuncio.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\W+/g, '-').toLowerCase();
    link.download = `anuncio-${safeName}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return imageDrawn || !ad.produto.foto;
};

const Vitrine = () => {
    const {
        produtos, itensEstoque, anuncios, vitrineConfig, criarAnuncio, atualizarAnuncio,
        desativarAnuncio, salvarConfiguracaoVitrine, alterarPublicacaoVitrine, isLoading
    } = useData();
    const { usuario } = useAuth();
    const toast = useToast();
    const confirm = useConfirm();
    const [adModal, setAdModal] = useState(null);
    const [adForm, setAdForm] = useState(emptyAdForm);
    const [contactOpen, setContactOpen] = useState(false);
    const [contact, setContact] = useState({ whatsapp: '', cidade: '', estado: '' });
    const [savingAd, setSavingAd] = useState(false);
    const [savingContact, setSavingContact] = useState(false);
    const [changingPublication, setChangingPublication] = useState(false);

    const activeAds = useMemo(() => anuncios.filter((ad) => ad.ativo), [anuncios]);
    const availableProducts = useMemo(() => {
        const withStock = new Set(itensEstoque.filter((item) => item.status === 'disponivel').map((item) => item.produtoId));
        const alreadyActive = new Set(activeAds.map((ad) => ad.produtoId));
        return produtos.filter((product) => withStock.has(product.id) && !alreadyActive.has(product.id));
    }, [activeAds, itensEstoque, produtos]);
    const publicUrl = vitrineConfig.slug ? `${window.location.origin}/${vitrineConfig.slug}` : '';

    const openCreate = () => {
        const firstProduct = availableProducts[0];
        setAdForm({ ...emptyAdForm, produtoId: firstProduct?.id || '', nomeAnuncio: firstProduct?.nome || '' });
        setAdModal({ mode: 'create' });
    };

    const openEdit = (ad) => {
        setAdForm({
            produtoId: ad.produtoId,
            nomeAnuncio: ad.nomeAnuncio,
            precoCentavos: Math.round(Number(ad.precoAnuncio) * 100),
            descricao: ad.descricao || '',
            linkOlx: ad.links?.olx || '',
            linkFacebook: ad.links?.facebook || '',
            linkMercadoLivre: ad.links?.mercadoLivre || '',
            linkOutros: ad.links?.outros || ''
        });
        setAdModal({ mode: 'edit', ad });
    };

    const submitAd = async (event) => {
        event.preventDefault();
        if (!adForm.produtoId || !adForm.nomeAnuncio.trim() || adForm.precoCentavos <= 0) {
            return toast.error('Revise os dados', 'Selecione o produto, informe o nome e um valor maior que zero.');
        }
        setSavingAd(true);
        const payload = {
            produtoId: adForm.produtoId,
            nomeAnuncio: adForm.nomeAnuncio,
            precoAnuncio: centavosParaReais(adForm.precoCentavos),
            descricao: adForm.descricao,
            linkOlx: adForm.linkOlx,
            linkFacebook: adForm.linkFacebook,
            linkMercadoLivre: adForm.linkMercadoLivre,
            linkOutros: adForm.linkOutros
        };
        const result = adModal.mode === 'edit' ? await atualizarAnuncio(adModal.ad.id, payload) : await criarAnuncio(payload);
        setSavingAd(false);
        if (!result.ok) return toast.error('Não foi possível salvar', result.message);
        toast.success(adModal.mode === 'edit' ? 'Anúncio atualizado' : 'Produto adicionado', 'As alterações já estão refletidas na Vitrine.');
        setAdModal(null);
        setAdForm(emptyAdForm);
    };

    const togglePublication = async () => {
        const nextState = !vitrineConfig.publicada;
        if (nextState && !usuario?.nomeLoja?.trim()) {
            return toast.warning('Nome da loja necessário', 'Defina o nome da loja em Minha Conta antes de publicar.');
        }
        setChangingPublication(true);
        const result = await alterarPublicacaoVitrine(nextState);
        setChangingPublication(false);
        if (!result.ok) return toast.error('Não foi possível alterar a publicação', result.message);
        toast.success(nextState ? 'Vitrine publicada' : 'Vitrine retirada do ar', nextState ? 'Seu catálogo público já pode ser compartilhado.' : 'O link público não está mais acessível.');
    };

    const copyPublicUrl = async () => {
        try {
            await navigator.clipboard.writeText(publicUrl);
            toast.success('Link copiado', 'A URL da Vitrine está na área de transferência.');
        } catch {
            toast.error('Não foi possível copiar', 'Selecione e copie o link manualmente.');
        }
    };

    const openContact = () => {
        setContact({ whatsapp: formatWhatsapp(vitrineConfig.whatsapp), cidade: vitrineConfig.cidade || '', estado: vitrineConfig.estado || '' });
        setContactOpen(true);
    };

    const submitContact = async (event) => {
        event.preventDefault();
        setSavingContact(true);
        const result = await salvarConfiguracaoVitrine(contact);
        setSavingContact(false);
        if (!result.ok) return toast.error('Não foi possível salvar', result.message);
        toast.success('Informações atualizadas', 'Localização e WhatsApp já podem aparecer na Vitrine pública.');
        setContactOpen(false);
    };

    const copyText = async (ad) => {
        const platformLinks = [ad.links?.olx, ad.links?.facebook, ad.links?.mercadoLivre, ad.links?.outros].filter(Boolean);
        const text = [ad.nomeAnuncio, [ad.produto.marca, ad.produto.tipo].filter(Boolean).join(' · '), money(ad.precoAnuncio), htmlToText(ad.descricao), ...platformLinks].filter(Boolean).join('\n');
        try {
            await navigator.clipboard.writeText(text);
            toast.success('Texto copiado', 'Cole onde quiser divulgar o produto.');
        } catch {
            toast.error('Não foi possível copiar', 'Permita o acesso à área de transferência e tente novamente.');
        }
    };

    const downloadCard = async (ad) => {
        try {
            const includedImage = await createCard(ad, usuario?.nomeLoja?.trim());
            toast.success('PNG gerado', includedImage ? 'O card foi baixado.' : 'O card foi baixado sem a foto, pois a origem não permitiu usá-la.');
        } catch (error) {
            toast.error('Não foi possível gerar o PNG', error.message || 'Tente novamente.');
        }
    };

    const removeAd = async (ad) => {
        const approved = await confirm({ title: 'Remover da Vitrine?', message: `“${ad.nomeAnuncio}” deixará de aparecer no catálogo público.`, confirmLabel: 'Remover' });
        if (!approved) return;
        const result = await desativarAnuncio(ad.id);
        result.ok ? toast.success('Anúncio removido', 'O produto não aparece mais na Vitrine.') : toast.error('Não foi possível remover', result.message);
    };

    if (isLoading) return <div className="container"><div className="page-header"><div><h1 className="page-title">Vitrine</h1><p className="page-subtitle">Carregando o catálogo...</p></div></div><div className="card h-44 animate-pulse bg-slate-100 dark:bg-slate-800" /></div>;

    return (
        <div className="container">
            <div className="page-header">
                <div><h1 className="page-title">Vitrine</h1><p className="page-subtitle">Monte seu catálogo, compartilhe o link e continue gerando cards para divulgação.</p></div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-secondary" onClick={openContact}><MessageCircle size={17} />Informações de contato</button>
                    <button type="button" className="btn btn-primary" onClick={openCreate} disabled={!availableProducts.length}><Plus size={18} />Adicionar produto</button>
                </div>
            </div>

            <section className={`mb-7 overflow-hidden rounded-2xl border ${vitrineConfig.publicada ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/20' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}>
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex min-w-0 items-start gap-4">
                        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${vitrineConfig.publicada ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}><Globe2 size={22} /></div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900 dark:text-slate-50">Catálogo público</h2><span className={vitrineConfig.publicada ? 'badge badge-green' : 'badge badge-gray'}>{vitrineConfig.publicada ? 'Publicado' : 'Privado'}</span></div>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{vitrineConfig.publicada ? 'Qualquer pessoa com o link pode ver os anúncios ativos.' : 'Ative quando o catálogo estiver pronto para compartilhar.'}</p>
                            {!usuario?.nomeLoja?.trim() && <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">Defina um nome de loja em Minha Conta para habilitar a publicação.</p>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:items-end">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Publicar Vitrine</span>
                            <button type="button" role="switch" aria-checked={vitrineConfig.publicada} aria-label="Publicar Vitrine" disabled={changingPublication} onClick={togglePublication} className={`relative h-7 w-12 shrink-0 overflow-hidden rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 dark:focus-visible:ring-offset-slate-800 ${vitrineConfig.publicada ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                <span className={`pointer-events-none absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${vitrineConfig.publicada ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        {vitrineConfig.publicada && <button type="button" className="btn btn-secondary px-4 py-2 text-xs" onClick={copyPublicUrl}><Copy size={15} />Copiar link da Vitrine</button>}
                    </div>
                </div>
                {vitrineConfig.publicada && publicUrl && <div className="border-t border-emerald-200/80 px-5 py-3 text-xs text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 sm:px-6"><span className="font-semibold">Link público:</span> <span className="break-all">{publicUrl}</span></div>}
            </section>

            {!availableProducts.length && <div className="mb-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400"><Radio size={18} className="mt-0.5 shrink-0 text-slate-400" /><p>Todos os produtos disponíveis já estão anunciados, ou não há unidades disponíveis no estoque.</p></div>}

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {activeAds.map((ad) => {
                    const linkCount = Object.values(ad.links || {}).filter(Boolean).length;
                    return (
                        <article key={ad.id} className="card group isolate flex min-w-0 flex-col overflow-hidden p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                            <div className="relative grid aspect-[4/3] min-h-0 min-w-0 shrink-0 place-items-center overflow-hidden bg-slate-100 p-4 dark:bg-slate-900">
                                {ad.produto.foto ? <img src={ad.produto.foto} alt={ad.nomeAnuncio} className="block h-auto max-h-full w-auto max-w-full min-h-0 min-w-0 object-contain" /> : <ImagePlus className="text-slate-400 dark:text-slate-600" size={42} />}
                                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">{ad.unidadesDisponiveis} {ad.unidadesDisponiveis === 1 ? 'unidade' : 'unidades'}</span>
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col bg-white p-5 dark:bg-slate-800">
                                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-lg font-bold">{ad.nomeAnuncio}</h3><p className="break-words text-sm text-slate-500">{[ad.produto.marca, ad.produto.tipo].filter(Boolean).join(' · ') || ad.produto.nome}</p></div>{linkCount > 0 && <span className="badge badge-blue shrink-0"><ExternalLink size={12} className="mr-1" />{linkCount}</span>}</div>
                                <p className="mt-4 font-mono text-2xl font-bold text-emerald-600">{money(ad.precoAnuncio)}</p>
                                {ad.descricao && <div className="rich-text mt-3 max-h-24 overflow-hidden text-sm text-slate-500 dark:text-slate-400" dangerouslySetInnerHTML={{ __html: ad.descricao }} />}
                                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                                    <button type="button" className="btn btn-secondary px-3 py-2 text-xs" onClick={() => openEdit(ad)}><Pencil size={14} />Editar</button>
                                    <button type="button" className="btn btn-secondary px-3 py-2 text-xs" onClick={() => downloadCard(ad)}><Download size={14} />PNG</button>
                                    <button type="button" className="btn btn-secondary px-3 py-2 text-xs" onClick={() => copyText(ad)} aria-label={`Copiar texto de ${ad.nomeAnuncio}`}><Copy size={14} /></button>
                                    <button type="button" className="ml-auto rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => removeAd(ad)} aria-label={`Remover ${ad.nomeAnuncio} da Vitrine`}><Trash2 size={17} /></button>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            {!activeAds.length && <div className="card empty-state"><div className="empty-state-icon"><Store size={30} /></div><p className="empty-state-title">Sua Vitrine ainda está vazia</p><p className="empty-state-subtitle">Adicione um produto disponível e personalize o anúncio.</p>{availableProducts.length > 0 && <button type="button" className="btn btn-primary mt-5" onClick={openCreate}><Plus size={17} />Adicionar primeiro produto</button>}</div>}

            <Modal isOpen={Boolean(adModal)} onClose={() => !savingAd && setAdModal(null)} title={adModal?.mode === 'edit' ? 'Editar anúncio' : 'Adicionar à Vitrine'} maxWidth="max-w-3xl">
                <form onSubmit={submitAd} className="space-y-5">
                    {adModal?.mode === 'create' && <div><label className="label" htmlFor="produto-vitrine">Produto</label><select id="produto-vitrine" className="select" required value={adForm.produtoId} onChange={(event) => { const product = produtos.find((item) => item.id === event.target.value); setAdForm((current) => ({ ...current, produtoId: event.target.value, nomeAnuncio: product?.nome || '' })); }}><option value="">Selecione...</option>{availableProducts.map((product) => <option key={product.id} value={product.id}>{product.nome}{product.marca ? ` · ${product.marca}` : ''}</option>)}</select></div>}
                    <div className="grid gap-4 sm:grid-cols-[1.5fr_.8fr]"><div><label className="label" htmlFor="nome-anuncio">Nome do anúncio</label><input id="nome-anuncio" className="input" required maxLength="255" value={adForm.nomeAnuncio} onChange={(event) => setAdForm({ ...adForm, nomeAnuncio: event.target.value })} /></div><div><label className="label" htmlFor="preco-anuncio">Valor de venda</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span><input id="preco-anuncio" className="input pl-11" required inputMode="numeric" value={formatarMoeda(adForm.precoCentavos)} onChange={(event) => setAdForm({ ...adForm, precoCentavos: parsearMoeda(event.target.value) })} placeholder="0,00" /></div></div></div>
                    <div><label className="label">Descrição personalizada <span className="font-normal text-slate-400">(opcional)</span></label><RichTextEditor value={adForm.descricao} onChange={(descricao) => setAdForm((current) => ({ ...current, descricao }))} disabled={savingAd} /><p className="mt-1.5 text-xs text-slate-500">Negrito, itálico, listas, links e emojis são aceitos. Código e conteúdo inseguro são removidos pelo servidor.</p></div>
                    <fieldset><legend className="label">Links dos anúncios <span className="font-normal text-slate-400">(opcionais)</span></legend><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-xs font-semibold text-slate-500" htmlFor="link-olx">OLX</label><input id="link-olx" type="url" maxLength="2048" className="input" value={adForm.linkOlx} onChange={(event) => setAdForm({ ...adForm, linkOlx: event.target.value })} placeholder="https://...olx.com.br/..." /></div><div><label className="mb-1 block text-xs font-semibold text-slate-500" htmlFor="link-facebook">Facebook Marketplace</label><input id="link-facebook" type="url" maxLength="2048" className="input" value={adForm.linkFacebook} onChange={(event) => setAdForm({ ...adForm, linkFacebook: event.target.value })} placeholder="https://facebook.com/..." /></div><div><label className="mb-1 block text-xs font-semibold text-slate-500" htmlFor="link-ml">Mercado Livre</label><input id="link-ml" type="url" maxLength="2048" className="input" value={adForm.linkMercadoLivre} onChange={(event) => setAdForm({ ...adForm, linkMercadoLivre: event.target.value })} placeholder="https://mercadolivre.com.br/..." /></div><div><label className="mb-1 block text-xs font-semibold text-slate-500" htmlFor="link-outros">Outros</label><input id="link-outros" type="url" maxLength="2048" className="input" value={adForm.linkOutros} onChange={(event) => setAdForm({ ...adForm, linkOutros: event.target.value })} placeholder="https://..." /></div></div></fieldset>
                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-700"><button type="button" className="btn btn-secondary" onClick={() => setAdModal(null)} disabled={savingAd}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={savingAd}>{savingAd ? 'Salvando...' : adModal?.mode === 'edit' ? 'Salvar alterações' : 'Adicionar à Vitrine'}</button></div>
                </form>
            </Modal>

            <Modal isOpen={contactOpen} onClose={() => !savingContact && setContactOpen(false)} title="Informações de contato" maxWidth="max-w-lg">
                <form onSubmit={submitContact} className="space-y-5">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"><div className="flex gap-3"><MessageCircle size={20} className="shrink-0" /><p>O WhatsApp aparecerá no cabeçalho da loja e dentro de cada anúncio, com uma mensagem de interesse já preenchida.</p></div></div>
                    <div><label className="label" htmlFor="whatsapp-vitrine">WhatsApp com DDD <span className="font-normal text-slate-400">(opcional)</span></label><input id="whatsapp-vitrine" className="input" inputMode="tel" autoComplete="tel" value={contact.whatsapp} onChange={(event) => setContact({ ...contact, whatsapp: formatWhatsapp(event.target.value) })} placeholder="(11) 99999-9999" /></div>
                    <div className="grid grid-cols-[1fr_110px] gap-4"><div><label className="label" htmlFor="cidade-vitrine">Cidade</label><div className="relative"><MapPin size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="cidade-vitrine" className="input pl-10" maxLength="100" value={contact.cidade} onChange={(event) => setContact({ ...contact, cidade: event.target.value })} placeholder="Sua cidade" /></div></div><div><label className="label" htmlFor="estado-vitrine">Estado</label><select id="estado-vitrine" className="select" value={contact.estado} onChange={(event) => setContact({ ...contact, estado: event.target.value })}><option value="">UF</option>{states.map((state) => <option key={state} value={state}>{state}</option>)}</select></div></div>
                    <p className="text-xs text-slate-500">Cidade e estado são opcionais, mas devem ser informados juntos.</p>
                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-700"><button type="button" className="btn btn-secondary" onClick={() => setContactOpen(false)} disabled={savingContact}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={savingContact}>{savingContact ? 'Salvando...' : 'Salvar informações'}</button></div>
                </form>
            </Modal>
        </div>
    );
};

export default Vitrine;
