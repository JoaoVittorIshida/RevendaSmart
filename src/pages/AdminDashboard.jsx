import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Activity,
    Boxes,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    KeyRound,
    LogOut,
    Moon,
    PackageCheck,
    RefreshCw,
    Search,
    ShieldCheck,
    ShoppingBag,
    Sun,
    UserRound,
    UsersRound
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin`;
const EMPTY_SUMMARY = {
    usuarios: 0,
    novos30Dias: 0,
    ativos30Dias: 0,
    produtos: 0,
    vendas: 0,
    estoqueAtivo: 0,
    receitaLiquida: 0
};

const numberFormatter = new Intl.NumberFormat('pt-BR');
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const formatDate = (value) => value ? dateFormatter.format(new Date(value)) : 'Sem atividade';

const formatRelativeTime = (value) => {
    if (!value) return 'Sem atividade';
    const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `Há ${diffMinutes} min`;
    const hours = Math.floor(diffMinutes / 60);
    if (hours < 24) return `Há ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `Há ${days}d`;
    return formatDate(value);
};

const MetricCard = ({ icon: Icon, label, value, detail, tone }) => (
    <article className="admin-metric" data-tone={tone}>
        <div className="admin-metric-top">
            <span>{label}</span>
            <span className="admin-metric-icon">{React.createElement(Icon, { size: 18 })}</span>
        </div>
        <strong>{value}</strong>
        <p>{detail}</p>
    </article>
);

const UserIdentity = ({ user }) => {
    const initials = user.nome.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    return (
        <div className="admin-user-identity">
            <span className="admin-avatar">{initials || 'U'}</span>
            <div>
                <strong>{user.nome}</strong>
                <span>@{user.usuario}{user.nomeLoja ? ` · ${user.nomeLoja}` : ''}</span>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { usuario, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const toast = useToast();
    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ pagina: 1, total: 0, totalPaginas: 1 });
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [passwordTarget, setPasswordTarget] = useState(null);
    const [passwordForm, setPasswordForm] = useState({ senhaAdmin: '', novaSenha: '', confirmarNovaSenha: '' });
    const [passwordError, setPasswordError] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

    const handleExpiredSession = useCallback(async () => {
        await logout();
        navigate('/login', { replace: true });
    }, [logout, navigate]);

    useEffect(() => {
        const controller = new AbortController();
        const loadSummary = async () => {
            setLoadingSummary(true);
            try {
                const response = await fetch(`${API_URL}/resumo`, { credentials: 'include', signal: controller.signal });
                if ([401, 403].includes(response.status)) return handleExpiredSession();
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Falha ao carregar métricas.');
                setSummary(data);
                setLastUpdated(new Date());
                setError('');
            } catch (requestError) {
                if (requestError.name !== 'AbortError') setError(requestError.message || 'Não foi possível conectar ao servidor.');
            } finally {
                if (!controller.signal.aborted) setLoadingSummary(false);
            }
        };
        loadSummary();
        return () => controller.abort();
    }, [handleExpiredSession, refreshKey]);

    useEffect(() => {
        const controller = new AbortController();
        const loadUsers = async () => {
            setLoadingUsers(true);
            try {
                const params = new URLSearchParams({ page: String(page), limit: '20' });
                if (search) params.set('busca', search);
                const response = await fetch(`${API_URL}/usuarios?${params}`, { credentials: 'include', signal: controller.signal });
                if ([401, 403].includes(response.status)) return handleExpiredSession();
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Falha ao carregar usuários.');
                setUsers(data.usuarios);
                setPagination(data.paginacao);
                setLastUpdated(new Date());
                setError('');
            } catch (requestError) {
                if (requestError.name !== 'AbortError') setError(requestError.message || 'Não foi possível conectar ao servidor.');
            } finally {
                if (!controller.signal.aborted) setLoadingUsers(false);
            }
        };
        loadUsers();
        return () => controller.abort();
    }, [handleExpiredSession, page, search, refreshKey]);

    const metrics = useMemo(() => [
        { icon: UsersRound, label: 'Clientes', value: numberFormatter.format(summary.usuarios), detail: `${numberFormatter.format(summary.novos30Dias)} novos em 30 dias`, tone: 'blue' },
        { icon: Activity, label: 'Ativos', value: numberFormatter.format(summary.ativos30Dias), detail: 'com atividade nos últimos 30 dias', tone: 'green' },
        { icon: Boxes, label: 'Produtos', value: numberFormatter.format(summary.produtos), detail: 'cadastros em todas as contas', tone: 'amber' },
        { icon: ShoppingBag, label: 'Vendas', value: numberFormatter.format(summary.vendas), detail: 'vendas concluídas registradas', tone: 'violet' },
        { icon: PackageCheck, label: 'Estoque ativo', value: numberFormatter.format(summary.estoqueAtivo), detail: 'unidades disponíveis ou reservadas', tone: 'cyan' },
        { icon: CircleDollarSign, label: 'Receita líquida', value: currencyFormatter.format(summary.receitaLiquida), detail: 'somatório das vendas concluídas', tone: 'emerald' }
    ], [summary]);

    const submitSearch = (event) => {
        event.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    };

    const openPasswordReset = (user) => {
        setPasswordTarget(user);
        setPasswordForm({ senhaAdmin: '', novaSenha: '', confirmarNovaSenha: '' });
        setPasswordError('');
    };

    const closePasswordReset = () => {
        if (savingPassword) return;
        setPasswordTarget(null);
        setPasswordForm({ senhaAdmin: '', novaSenha: '', confirmarNovaSenha: '' });
        setPasswordError('');
    };

    const submitPasswordReset = async (event) => {
        event.preventDefault();
        setPasswordError('');
        if (passwordForm.novaSenha.length < 8) {
            setPasswordError('A nova senha deve ter pelo menos 8 caracteres.');
            return;
        }
        if (passwordForm.novaSenha !== passwordForm.confirmarNovaSenha) {
            setPasswordError('A confirmação da nova senha não confere.');
            return;
        }

        setSavingPassword(true);
        try {
            const response = await fetch(`${API_URL}/usuarios/${passwordTarget.id}/senha`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(passwordForm)
            });
            if ([401, 403].includes(response.status)) return handleExpiredSession();
            const data = await response.json();
            if (!response.ok) {
                setPasswordError(data.message || 'Não foi possível redefinir a senha.');
                return;
            }
            toast.success('Senha redefinida', data.message);
            setPasswordTarget(null);
            setPasswordForm({ senhaAdmin: '', novaSenha: '', confirmarNovaSenha: '' });
            setPasswordError('');
        } catch {
            setPasswordError('Erro de conexão com o servidor.');
        } finally {
            setSavingPassword(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="admin-shell">
            <header className="admin-topbar">
                <div className="admin-brand">
                    <span className="admin-brand-mark"><ShieldCheck size={21} /></span>
                    <div>
                        <strong>RevendaSmart</strong>
                        <span>Control room</span>
                    </div>
                </div>
                <div className="admin-topbar-actions">
                    <span className="admin-restricted"><span /> Ambiente restrito</span>
                    <button type="button" className="admin-icon-button" onClick={toggleTheme} aria-label="Alternar tema" title={isDark ? 'Modo claro' : 'Modo escuro'}>
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <div className="admin-profile">
                        <span><UserRound size={16} /></span>
                        <div><strong>{usuario?.nome}</strong><small>Administrador</small></div>
                    </div>
                    <button type="button" className="admin-logout" onClick={handleLogout}><LogOut size={17} /><span>Sair</span></button>
                </div>
            </header>

            <main className="admin-content">
                <section className="admin-heading">
                    <div>
                        <p className="admin-eyebrow">Visão geral · operação SaaS</p>
                        <h1>Painel administrativo</h1>
                        <p>Acompanhe adoção, volume operacional e o acesso de cada cliente.</p>
                    </div>
                    <button type="button" className="admin-refresh" onClick={() => setRefreshKey((key) => key + 1)} disabled={loadingSummary || loadingUsers}>
                        <RefreshCw size={17} className={loadingSummary || loadingUsers ? 'animate-spin' : ''} />
                        Atualizar dados
                    </button>
                </section>

                {error && (
                    <div className="admin-error" role="alert">
                        <span>{error}</span>
                        <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>Tentar novamente</button>
                    </div>
                )}

                <section className="admin-metrics" aria-label="Métricas gerais">
                    {metrics.map((metric) => <MetricCard key={metric.label} {...metric} value={loadingSummary ? '—' : metric.value} />)}
                </section>

                <section className="admin-users-panel">
                    <div className="admin-users-header">
                        <div>
                            <p className="admin-section-index">01 / CONTAS</p>
                            <h2>Usuários da plataforma</h2>
                            <span>{numberFormatter.format(pagination.total)} contas de clientes</span>
                        </div>
                        <form className="admin-search" onSubmit={submitSearch} role="search">
                            <Search size={17} />
                            <label className="sr-only" htmlFor="admin-user-search">Buscar usuários</label>
                            <input id="admin-user-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} maxLength="100" placeholder="Nome, e-mail, usuário ou loja" />
                            <button type="submit">Buscar</button>
                        </form>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Contato</th>
                                    <th>Atividade</th>
                                    <th className="admin-number-cell">Produtos</th>
                                    <th className="admin-number-cell">Estoque</th>
                                    <th className="admin-number-cell">Vendas</th>
                                    <th className="admin-number-cell">Receita</th>
                                    <th><span className="sr-only">Ações</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loadingUsers && users.map((user) => (
                                    <tr key={user.id}>
                                        <td><UserIdentity user={user} /></td>
                                        <td><span className="admin-email">{user.email || 'E-mail não informado'}</span><small>Desde {formatDate(user.criadoEm)}</small></td>
                                        <td><strong className="admin-activity"><span />{formatRelativeTime(user.ultimaAtividadeEm)}</strong><small title={formatDate(user.ultimaAtividadeEm)}>{formatDate(user.ultimaAtividadeEm)}</small></td>
                                        <td className="admin-number-cell">{numberFormatter.format(user.produtos)}</td>
                                        <td className="admin-number-cell">{numberFormatter.format(user.estoqueAtivo)}</td>
                                        <td className="admin-number-cell">{numberFormatter.format(user.vendas)}</td>
                                        <td className="admin-number-cell admin-money">{currencyFormatter.format(user.receitaLiquida)}</td>
                                        <td><button type="button" className="admin-key-button" onClick={() => openPasswordReset(user)} title={`Redefinir senha de ${user.nome}`}><KeyRound size={17} /><span>Senha</span></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {loadingUsers && <div className="admin-table-state"><RefreshCw size={20} className="animate-spin" /> Carregando usuários...</div>}
                        {!loadingUsers && users.length === 0 && <div className="admin-table-state">Nenhum usuário encontrado.</div>}
                    </div>

                    <div className="admin-pagination">
                        <span>{lastUpdated ? `Atualizado às ${lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Aguardando atualização'}</span>
                        <div>
                            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loadingUsers} aria-label="Página anterior"><ChevronLeft size={17} /></button>
                            <span>Página <strong>{pagination.pagina}</strong> de {pagination.totalPaginas}</span>
                            <button type="button" onClick={() => setPage((current) => Math.min(pagination.totalPaginas, current + 1))} disabled={page >= pagination.totalPaginas || loadingUsers} aria-label="Próxima página"><ChevronRight size={17} /></button>
                        </div>
                    </div>
                </section>
            </main>

            <Modal isOpen={Boolean(passwordTarget)} onClose={closePasswordReset} title="Redefinir senha do cliente" maxWidth="max-w-lg">
                {passwordTarget && (
                    <form onSubmit={submitPasswordReset} className="admin-password-form">
                        <div className="admin-password-user"><UserIdentity user={passwordTarget} /></div>
                        <p className="admin-security-note"><ShieldCheck size={18} /> Esta ação encerra todas as sessões atuais do cliente e fica registrada no log de auditoria.</p>
                        {passwordError && <div className="admin-password-error" role="alert">{passwordError}</div>}
                        <label htmlFor="admin-current-password">Sua senha de administrador</label>
                        <input id="admin-current-password" type="password" required autoComplete="current-password" value={passwordForm.senhaAdmin} onChange={(event) => setPasswordForm({ ...passwordForm, senhaAdmin: event.target.value })} />
                        <label htmlFor="admin-new-password">Nova senha do cliente</label>
                        <input id="admin-new-password" type="password" required minLength="8" maxLength="72" autoComplete="new-password" value={passwordForm.novaSenha} onChange={(event) => setPasswordForm({ ...passwordForm, novaSenha: event.target.value })} />
                        <label htmlFor="admin-confirm-password">Confirmar nova senha</label>
                        <input id="admin-confirm-password" type="password" required minLength="8" maxLength="72" autoComplete="new-password" value={passwordForm.confirmarNovaSenha} onChange={(event) => setPasswordForm({ ...passwordForm, confirmarNovaSenha: event.target.value })} />
                        <div className="admin-password-actions">
                            <button type="button" onClick={closePasswordReset} disabled={savingPassword}>Cancelar</button>
                            <button type="submit" disabled={savingPassword}><KeyRound size={17} />{savingPassword ? 'Redefinindo...' : 'Redefinir senha'}</button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default AdminDashboard;
