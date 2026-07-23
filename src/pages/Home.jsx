import { createElement } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    BarChart3,
    Box,
    Check,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    Copy,
    Download,
    Eye,
    ExternalLink,
    Globe2,
    ImagePlus,
    Layers3,
    Moon,
    PackageCheck,
    Pencil,
    Plus,
    ReceiptText,
    ShoppingBag,
    Sparkles,
    Store,
    Sun,
    TrendingUp,
    WalletCards,
    Zap
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Brand = () => (
    <Link to="/" className="landing-brand" aria-label="RevendaSmart — página inicial">
        <span className="landing-brand-mark">RS</span>
        <span>
            <strong>RevendaSmart</strong>
            <small>Gestão para revendedores</small>
        </span>
    </Link>
);

const ThemeButton = () => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            className="landing-theme-button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
};

const MiniChart = () => (
    <svg className="landing-chart" viewBox="0 0 620 210" role="img" aria-label="Gráfico crescente de receita e lucro">
        <defs>
            <linearGradient id="landingAreaBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity=".28" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="landingAreaGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity=".18" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
        </defs>
        {[34, 78, 122, 166].map((y) => <line key={y} x1="0" y1={y} x2="620" y2={y} className="landing-chart-grid" />)}
        <path d="M0 172 C45 158,66 166,103 139 C143 109,176 142,216 111 C257 79,284 102,324 78 C362 55,397 91,436 54 C474 18,506 58,545 31 C574 12,599 22,620 8 L620 210 L0 210 Z" fill="url(#landingAreaBlue)" />
        <path d="M0 188 C45 178,67 184,104 166 C142 146,177 169,216 145 C258 120,284 138,324 117 C362 98,397 124,436 93 C473 64,507 99,545 75 C575 58,599 64,620 48 L620 210 L0 210 Z" fill="url(#landingAreaGreen)" />
        <path d="M0 172 C45 158,66 166,103 139 C143 109,176 142,216 111 C257 79,284 102,324 78 C362 55,397 91,436 54 C474 18,506 58,545 31 C574 12,599 22,620 8" className="landing-chart-line landing-chart-line-blue" />
        <path d="M0 188 C45 178,67 184,104 166 C142 146,177 169,216 145 C258 120,284 138,324 117 C362 98,397 124,436 93 C473 64,507 99,545 75 C575 58,599 64,620 48" className="landing-chart-line landing-chart-line-green" />
    </svg>
);

const DashboardPreview = () => (
    <div className="landing-product-window">
        <div className="landing-window-bar">
            <div className="landing-window-dots"><span /><span /><span /></div>
            <span className="landing-window-address">app.revendasmart.com.br/dashboard</span>
            <span className="landing-window-status"><i /> Online</span>
        </div>

        <div className="landing-app-shell">
            <aside className="landing-app-sidebar">
                <div className="landing-app-logo"><span>RS</span><strong>RevendaSmart</strong></div>
                <div className="landing-app-nav">
                    {[
                        ['Dashboard', BarChart3],
                        ['Nova venda', ShoppingBag],
                        ['Histórico', Clock3],
                        ['Recebimentos', CircleDollarSign],
                        ['Estoque', Box],
                        ['Análises', TrendingUp],
                        ['Vitrine', Store]
                    ].map(([label, Icon], index) => (
                        <div key={label} className={index === 0 ? 'active' : ''}>
                            {createElement(Icon, { size: 14 })}<span>{label}</span>
                        </div>
                    ))}
                </div>
                <div className="landing-app-user"><span>JS</span><div><strong>João</strong><small>Minha loja</small></div></div>
            </aside>

            <div className="landing-app-content">
                <div className="landing-app-heading">
                    <div><h3>Dashboard</h3><small>Visão geral do seu negócio</small></div>
                    <div className="landing-dashboard-controls">
                        <span><i /> Incluir pendentes</span>
                        <b><em>Total</em><small>Últimos 30 dias</small></b>
                    </div>
                </div>
                <div className="landing-preview-kpis">
                    <div className="blue-card"><span className="blue"><TrendingUp size={15} /></span><small>RECEITA</small><strong>R$ 18.460</strong><em>Todo o histórico · 42 vendas</em></div>
                    <div className="green-card"><span className="green"><WalletCards size={15} /></span><small>LUCRO LÍQUIDO</small><strong>R$ 7.280</strong><em>Retorno real · Todo o histórico</em></div>
                    <div className="violet-card"><span className="violet"><BarChart3 size={15} /></span><small>MARGEM DE LUCRO</small><strong>39,4%</strong><em>Percentual sobre receita</em></div>
                    <div className="orange-card"><span className="orange"><PackageCheck size={15} /></span><small>MARKUP MÉDIO</small><strong>65,1%</strong><em>Retorno sobre custo</em></div>
                </div>
                <div className="landing-preview-main">
                    <div className="landing-preview-chart-card">
                        <div className="landing-preview-card-title">
                            <div><strong><TrendingUp size={13} /> Evolução de Receita e Lucro</strong></div>
                            <div className="landing-chart-legend"><span><i className="blue" /> Receita</span><span><i className="green" /> Lucro</span></div>
                        </div>
                        <MiniChart />
                        <div className="landing-chart-labels"><span>01 Jul</span><span>08 Jul</span><span>15 Jul</span><span>22 Jul</span></div>
                    </div>
                    <div className="landing-preview-side-card">
                        <div className="landing-preview-card-title"><div><strong><ShoppingBag size={13} /> Vendas por Canal</strong></div></div>
                        <div className="landing-donut"><span>42<small>vendas</small></span></div>
                        <div className="landing-channel-list">
                            <span><i className="blue" /> Mercado Livre <b>48%</b></span>
                            <span><i className="violet" /> Shopee <b>31%</b></span>
                            <span><i className="orange" /> Direto <b>21%</b></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const InventoryPreview = () => (
    <div className="landing-mini-screen">
        <div className="landing-mini-page-header">
            <div><strong>Estoque</strong><small>Veja o capital investido e o tempo de cada item em estoque.</small></div>
            <button><Plus size={11} /> Nova entrada</button>
        </div>
        <div className="landing-stock-stats">
            <div><small>CAPITAL IMOBILIZADO</small><strong>R$ 8.740,00</strong><span>Itens disponíveis e reservados</span></div>
            <div><small>FATURAMENTO ESTIMADO</small><strong>R$ 13.980,00</strong><span>Lucro potencial: R$ 5.240,00</span></div>
            <div><small>ITENS PARADOS HÁ 30+ DIAS</small><strong>3</strong><span>Use o filtro para revisar oportunidades</span></div>
        </div>
        <div className="landing-mini-filters"><span>Todos</span><span>Disponíveis</span><span>Reservados</span><span>30+ dias</span></div>
        {[
            ['iPhone 13 128GB', 'Apple · 2 unidades', 'R$ 4.960,00', 'blue'],
            ['Tênis Air Max 90', 'Nike · 1 unidade', 'R$ 449,90', 'violet'],
            ['Perfume importado', 'Dior · 3 unidades', 'R$ 867,00', 'orange']
        ].map((item, index) => (
            <div className="landing-mini-row" key={item[0]}>
                <span className={`landing-mini-thumb tone-${index + 1}`}><Box size={14} /></span>
                <span><strong>{item[0]}</strong><small>{item[1]}</small></span>
                <em className={item[3]}>{item[2]}</em>
                <ChevronRight size={12} />
            </div>
        ))}
    </div>
);

const ShowcasePreview = () => (
    <div className="landing-showcase-screen">
        <div className="landing-vitrine-page-header">
            <div><strong>Vitrine</strong><small>Monte seu catálogo, compartilhe o link e gere cards para divulgação.</small></div>
            <div><button><Store size={10} /> Configurações</button><button><Plus size={10} /> Adicionar produto</button></div>
        </div>
        <div className="landing-catalog-status">
            <span><Globe2 size={15} /></span>
            <div><strong>Catálogo público <em>Publicado</em></strong><small>Qualquer pessoa com o link pode ver os anúncios ativos.</small></div>
            <div><small>Publicar Vitrine</small><i><b /></i></div>
        </div>
        <div className="landing-showcase-grid landing-admin-cards">
            {[
                ['2 unidades', 'Fone Wave Pro', 'Wave · Eletrônicos', 'R$ 349,00', 'tone-blue'],
                ['1 unidade', 'Bolsa Moon', 'Moon · Acessórios', 'R$ 279,00', 'tone-violet'],
                ['3 unidades', 'Tênis Cloud', 'Cloud · Calçados', 'R$ 419,00', 'tone-orange']
            ].map(([tag, name, meta, price, tone]) => (
                <div key={name}>
                    <div className={`landing-showcase-image ${tone}`}><ImagePlus size={20} /><span>{tag}</span></div>
                    <strong>{name}</strong><small>{meta}</small><b>{price}</b>
                    <div><button><Pencil size={8} /> Editar</button><button><Download size={8} /> PNG</button><button aria-label="Copiar"><Copy size={8} /></button><ExternalLink size={9} /></div>
                </div>
            ))}
        </div>
    </div>
);

const features = [
    { icon: Box, title: 'Estoque sem desencontro', text: 'Acompanhe custo, origem, situação e tempo parado de cada item em um só lugar.' },
    { icon: ReceiptText, title: 'Venda em poucos cliques', text: 'Registre valor, canal, taxas e recebimento sem depender de planilhas paralelas.' },
    { icon: TrendingUp, title: 'Lucro de verdade', text: 'Visualize receita, custo, margem e markup com filtros que ajudam a decidir melhor.' },
    { icon: Clock3, title: 'Recebimentos sob controle', text: 'Saiba o que já entrou, o que está pendente e quando cada pagamento é esperado.' },
    { icon: Eye, title: 'Sua vitrine pronta para vender', text: 'Publique um catálogo compartilhável e apresente seus produtos com mais confiança.' },
    { icon: Layers3, title: 'Dados que acompanham você', text: 'Importe, exporte e organize seu histórico com mais segurança e liberdade.' }
];

const Home = () => (
    <div className="landing-page">
        <header className="landing-header">
            <div className="landing-header-inner">
                <div className="landing-header-left">
                    <Brand />
                    <Link to="/login" className="landing-access-button">Acessar <ArrowRight size={15} /></Link>
                </div>
                <nav className="landing-nav" aria-label="Navegação principal">
                    <a href="#recursos">Recursos</a>
                    <a href="#como-funciona">Como funciona</a>
                    <a href="#casos-de-uso">Casos de uso</a>
                    <a href="#planos">Planos</a>
                </nav>
                <div className="landing-header-actions">
                    <ThemeButton />
                    <Link to="/cadastro" className="landing-header-cta">
                        <span className="landing-cta-label-full">Começar agora</span>
                        <span className="landing-cta-label-short">Criar</span>
                        <ArrowRight size={15} />
                    </Link>
                </div>
            </div>
        </header>

        <main>
            <section className="landing-hero" id="inicio">
                <div className="landing-hero-glow landing-hero-glow-one" />
                <div className="landing-hero-glow landing-hero-glow-two" />
                <div className="landing-hero-grid" />
                <div className="landing-hero-content">
                    <div className="landing-eyebrow"><span><Zap size={13} /></span> Feito para quem compra, anuncia e revende</div>
                    <h1>Menos planilhas.<br /><span>Mais clareza para crescer.</span></h1>
                    <p>Controle estoque, vendas, lucro e recebimentos em um só lugar. O RevendaSmart transforma a rotina da sua revenda em decisões simples e seguras.</p>
                    <div className="landing-hero-actions">
                        <Link to="/cadastro" className="landing-primary-cta">Organizar minha revenda <ArrowRight size={18} /></Link>
                        <a href="#produto" className="landing-secondary-cta"><span><Eye size={17} /></span> Ver o sistema por dentro</a>
                    </div>
                    <div className="landing-hero-proof">
                        <span><Check size={14} /> Cadastro simples</span>
                        <span><Check size={14} /> Acesso pelo navegador</span>
                        <span><Check size={14} /> Dados da sua loja separados</span>
                    </div>
                </div>
                <div className="landing-preview-wrap" id="produto">
                    <div className="landing-preview-tag landing-preview-tag-left"><span><PackageCheck size={16} /></span><div><small>ESTOQUE ATUALIZADO</small><strong>84 itens disponíveis</strong></div></div>
                    <div className="landing-preview-tag landing-preview-tag-right"><span><TrendingUp size={16} /></span><div><small>MARGEM DO MÊS</small><strong>39,4% de lucro</strong></div></div>
                    <DashboardPreview />
                </div>
            </section>

            <section className="landing-trust-strip" aria-label="Principais áreas do sistema">
                <p>Uma operação inteira, conectada</p>
                <div><span><Box size={16} /> Estoque</span><i /><span><ShoppingBag size={16} /> Vendas</span><i /><span><CircleDollarSign size={16} /> Recebimentos</span><i /><span><BarChart3 size={16} /> Análises</span><i /><span><Store size={16} /> Vitrine</span></div>
            </section>

            <section className="landing-section landing-features" id="recursos">
                <div className="landing-section-intro">
                    <span className="landing-kicker">CONTROLE DE PONTA A PONTA</span>
                    <h2>Tudo o que sua revenda precisa.<br /><span>Sem complicar o que já funciona.</span></h2>
                    <p>Um sistema pensado para a operação real: da chegada do produto ao dinheiro na conta.</p>
                </div>
                <div className="landing-feature-grid">
                    {features.map(({ icon: Icon, title, text }, index) => (
                        <article key={title} className="landing-feature-card">
                            <span className="landing-feature-number">0{index + 1}</span>
                            <div className="landing-feature-icon">{createElement(Icon, { size: 20 })}</div>
                            <h3>{title}</h3>
                            <p>{text}</p>
                            <span className="landing-feature-line" />
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-section landing-inside">
                <div className="landing-section-intro landing-section-intro-left">
                    <span className="landing-kicker">POR DENTRO DO PRODUTO</span>
                    <h2>Uma visão limpa para uma rotina cheia de detalhes.</h2>
                    <p>Informação importante aparece no momento certo, sem poluir sua tela ou esconder o que merece atenção.</p>
                </div>
                <div className="landing-screen-grid">
                    <article className="landing-screen-card landing-screen-card-wide">
                        <div className="landing-screen-copy">
                            <span>01 / ESTOQUE</span>
                            <h3>Saiba exatamente o que você tem em mãos.</h3>
                            <p>Localize itens, acompanhe status e confira valores sem vasculhar várias abas.</p>
                        </div>
                        <InventoryPreview />
                    </article>
                    <article className="landing-screen-card landing-screen-card-tall">
                        <div className="landing-screen-copy">
                            <span>02 / VITRINE</span>
                            <h3>Transforme estoque em uma vitrine compartilhável.</h3>
                            <p>Apresente seus produtos com uma experiência que valoriza sua loja.</p>
                        </div>
                        <ShowcasePreview />
                    </article>
                </div>
            </section>

            <section className="landing-process" id="como-funciona">
                <div className="landing-process-inner">
                    <div className="landing-section-intro landing-section-intro-left">
                        <span className="landing-kicker landing-kicker-light">COMECE SEM ATRITO</span>
                        <h2>Do produto à decisão,<br />em três movimentos.</h2>
                    </div>
                    <div className="landing-process-list">
                        {[
                            ['01', 'Cadastre sua operação', 'Organize produtos, categorias e canais de compra e venda do seu jeito.'],
                            ['02', 'Movimente o dia a dia', 'Dê entrada no estoque, registre vendas e acompanhe cada recebimento.'],
                            ['03', 'Enxergue o próximo passo', 'Use indicadores e análises para comprar melhor, precificar e crescer.']
                        ].map(([number, title, text]) => (
                            <article key={number}>
                                <span>{number}</span>
                                <div><h3>{title}</h3><p>{text}</p></div>
                                <ArrowRight size={20} />
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="landing-section landing-use-cases" id="casos-de-uso">
                <div className="landing-section-intro">
                    <span className="landing-kicker">CABE NA SUA ROTINA</span>
                    <h2>Para quem revende de verdade.</h2>
                    <p>Não importa se você começou agora ou já vende em vários canais: o controle acompanha a sua operação.</p>
                </div>
                <div className="landing-use-grid">
                    <article className="landing-use-card landing-use-card-blue">
                        <span><ShoppingBag size={23} /></span>
                        <small>REVENDA ONLINE</small>
                        <h3>Venda em marketplaces sem perder a margem de vista.</h3>
                        <p>Centralize canais, taxas e resultados para saber quais vendas realmente valem a pena.</p>
                    </article>
                    <article className="landing-use-card landing-use-card-dark">
                        <span><Store size={23} /></span>
                        <small>LOJA INDEPENDENTE</small>
                        <h3>Organize pedidos diretos e mostre seu catálogo.</h3>
                        <p>Tenha estoque confiável e uma vitrine para compartilhar com clientes no seu próprio ritmo.</p>
                    </article>
                    <article className="landing-use-card landing-use-card-warm">
                        <span><Sparkles size={23} /></span>
                        <small>QUEM ESTÁ COMEÇANDO</small>
                        <h3>Crie bons hábitos antes que a operação cresça.</h3>
                        <p>Saia da anotação solta e construa um histórico organizado desde a primeira venda.</p>
                    </article>
                </div>
            </section>

            <section className="landing-section landing-pricing" id="planos">
                <div className="landing-pricing-card">
                    <div className="landing-pricing-orbit"><span /><span /><span /></div>
                    <div>
                        <span className="landing-kicker">PLANOS REVENDASMART</span>
                        <h2>O melhor plano é o que<br />acompanha o seu momento.</h2>
                        <p>Estamos preparando opções simples e transparentes para diferentes estágios de revenda.</p>
                    </div>
                    <div className="landing-coming-soon">
                        <span>EM BREVE</span>
                        <strong>Planos pensados para crescer com você.</strong>
                        <p>Enquanto isso, crie sua conta e conheça o sistema.</p>
                        <Link to="/cadastro">Quero conhecer <ArrowRight size={16} /></Link>
                    </div>
                </div>
            </section>

            <section className="landing-final-cta">
                <div className="landing-final-glow" />
                <div className="landing-final-content">
                    <span className="landing-kicker landing-kicker-light">SUA OPERAÇÃO, MAIS INTELIGENTE</span>
                    <h2>Troque o improviso por uma visão clara do seu negócio.</h2>
                    <p>Comece a organizar sua revenda hoje e faça cada produto, venda e decisão contar.</p>
                    <div>
                        <Link to="/cadastro" className="landing-primary-cta landing-primary-cta-light">Criar minha conta <ArrowRight size={18} /></Link>
                        <Link to="/login" className="landing-final-login">Já uso o RevendaSmart <ChevronRight size={16} /></Link>
                    </div>
                </div>
            </section>
        </main>

        <footer className="landing-footer">
            <div className="landing-footer-top">
                <div><Brand /><p>Controle simples para quem leva a revenda a sério.</p></div>
                <div><strong>Produto</strong><a href="#recursos">Recursos</a><a href="#como-funciona">Como funciona</a><a href="#planos">Planos</a></div>
                <div><strong>Acesso</strong><Link to="/login">Entrar</Link><Link to="/cadastro">Criar conta</Link></div>
            </div>
            <div className="landing-footer-bottom"><span>© {new Date().getFullYear()} RevendaSmart</span><span>Feito para transformar movimento em clareza.</span></div>
        </footer>
    </div>
);

export default Home;
