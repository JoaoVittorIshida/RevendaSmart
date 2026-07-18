import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ExternalLink, ImageOff, MapPin, MessageCircle, PackageSearch, ShoppingBag, Store, X } from 'lucide-react';
import { useParams } from 'react-router-dom';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const platformNames = { olx: 'OLX', facebook: 'Facebook Marketplace', mercadoLivre: 'Mercado Livre', outros: 'Ver em outro site' };

const ProductModal = ({ product, store, onClose }) => {
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [onClose]);

    const links = Object.entries(product.links || {}).filter(([, url]) => Boolean(url));
    const whatsappUrl = store.whatsappUrl ? `${store.whatsappUrl}?text=${encodeURIComponent(`Olá, tenho interesse no produto ${product.nome}`)}` : '';

    return (
        <div className="public-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <div className="public-product-modal" role="dialog" aria-modal="true" aria-labelledby="public-product-title">
                <button type="button" className="public-modal-close" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
                <div className="public-modal-image">
                    {product.foto ? <img src={product.foto} alt={product.nome} /> : <ImageOff size={44} />}
                </div>
                <div className="public-modal-content">
                    <p className="public-eyebrow">{[product.marca, product.tipo].filter(Boolean).join(' · ') || 'Produto disponível'}</p>
                    <h2 id="public-product-title">{product.nome}</h2>
                    <p className="public-modal-price">{money(product.preco)}</p>
                    {product.descricao && <div className="public-rich-text" dangerouslySetInnerHTML={{ __html: product.descricao }} />}
                    {links.length > 0 && <div className="public-links"><p>Onde encontrar este anúncio</p>{links.map(([platform, url]) => <a key={platform} href={url} target="_blank" rel="noopener noreferrer nofollow"><span>{platformNames[platform]}</span><ExternalLink size={16} /></a>)}</div>}
                    {whatsappUrl && <a className="public-whatsapp-cta" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} />Tenho interesse neste produto</a>}
                </div>
            </div>
        </div>
    );
};

const VitrinePublica = () => {
    const { slug } = useParams();
    const [result, setResult] = useState({ slug: null, catalog: null, error: '' });
    const [selected, setSelected] = useState(null);
    const loading = result.slug !== slug;
    const catalog = loading ? null : result.catalog;
    const error = loading ? '' : result.error;

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}/vitrine/${encodeURIComponent(slug || '')}`, { signal: controller.signal, credentials: 'omit' })
            .then(async (response) => {
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data.message || 'Vitrine indisponível.');
                return data;
            })
            .then((data) => setResult({ slug, catalog: data, error: '' }))
            .catch((fetchError) => { if (fetchError.name !== 'AbortError') setResult({ slug, catalog: null, error: fetchError.message }); });
        return () => controller.abort();
    }, [slug]);

    useEffect(() => {
        const previousTitle = document.title;
        if (catalog?.loja?.nome) document.title = `${catalog.loja.nome} · Catálogo`;
        return () => { document.title = previousTitle; };
    }, [catalog]);

    const location = useMemo(() => [catalog?.loja?.cidade, catalog?.loja?.estado].filter(Boolean).join(' · '), [catalog]);

    if (loading) return <div className="public-showcase public-state"><div className="public-state-mark animate-pulse"><Store size={30} /></div><p>Preparando a Vitrine...</p></div>;
    if (error || !catalog) return <div className="public-showcase public-state"><div className="public-state-mark"><PackageSearch size={30} /></div><h1>Vitrine indisponível</h1><p>{error || 'Este catálogo não foi encontrado.'}</p></div>;

    return (
        <div className="public-showcase">
            <header className="public-hero">
                <div className="public-hero-inner">
                    <div className="public-brand-mark"><ShoppingBag size={21} /></div>
                    <div className="public-hero-copy">
                        <p className="public-kicker">Catálogo digital</p>
                        <h1>{catalog.loja.nome}</h1>
                        <div className="public-store-meta">
                            {location && <span><MapPin size={16} />{location}</span>}
                            <span><Store size={16} />{catalog.anuncios.length} {catalog.anuncios.length === 1 ? 'produto anunciado' : 'produtos anunciados'}</span>
                        </div>
                    </div>
                    {catalog.loja.whatsappUrl && <a className="public-contact-link" href={catalog.loja.whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /><span>Falar no WhatsApp</span><ArrowUpRight size={16} /></a>}
                </div>
            </header>

            <main className="public-catalog">
                <div className="public-section-heading"><div><p>Seleção da loja</p><h2>Produtos em destaque</h2></div><span>Toque em um produto para ver os detalhes</span></div>
                {catalog.anuncios.length > 0 ? <div className="public-product-grid">{catalog.anuncios.map((product, index) => (
                    <article
                        key={`${product.nome}-${index}`}
                        className="public-product-card"
                        onClick={() => setSelected(product)}
                        style={{ '--card-index': index }}
                    >
                        <div className="public-card-image">{product.foto ? <img src={product.foto} alt={product.nome} loading="lazy" /> : <ImageOff size={38} />}</div>
                        <div className="public-card-copy">
                            <p className="public-card-meta">{[product.marca, product.tipo].filter(Boolean).join(' · ') || 'Disponível'}</p>
                            <h3>{product.nome}</h3>
                            <div className="public-card-footer"><strong>{money(product.preco)}</strong><button type="button" onClick={(event) => { event.stopPropagation(); setSelected(product); }}>Ver produto<ArrowUpRight size={15} /></button></div>
                        </div>
                    </article>
                ))}</div> : <div className="public-empty"><PackageSearch size={34} /><h2>Novidades em breve</h2><p>A loja ainda não publicou produtos neste catálogo.</p></div>}
            </main>

            <footer className="public-footer"><span>{catalog.loja.nome}</span><p>Catálogo atualizado pela loja · RevendaSmart</p></footer>
            {selected && <ProductModal product={selected} store={catalog.loja} onClose={() => setSelected(null)} />}
        </div>
    );
};

export default VitrinePublica;
