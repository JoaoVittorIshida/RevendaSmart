import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Settings, LogOut, History, Menu, X, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import Login from './pages/Auth/Login';
import Cadastro from './pages/Auth/Cadastro';

// Pages
import Dashboard from './pages/Dashboard';
import Vendas from './pages/Vendas';
import HistoricoVendas from './pages/HistoricoVendas';
import Estoque from './pages/Estoque';
import EstoqueForm from './pages/EstoqueForm';
import CentralCadastros from './pages/Cadastros/CentralCadastros';
import Categorias from './pages/Cadastros/Categorias';
import CanaisVenda from './pages/Cadastros/CanaisVenda';
import CanaisCompra from './pages/Cadastros/CanaisCompra';
import Produtos from './pages/Cadastros/Produtos';
import ProdutoForm from './pages/Cadastros/ProdutoForm';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vendas', icon: ShoppingCart, label: 'Nova Venda' },
  { to: '/historico-vendas', icon: History, label: 'Histórico' },
  { to: '/estoque', icon: Package, label: 'Estoque' },
  { to: '/cadastros', icon: Settings, label: 'Cadastros' },
];

const SidebarLink = ({ to, icon: Icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link to={to} onClick={onClick} className={`sidebar-link ${isActive ? 'active' : ''}`}>
      <Icon size={20} className={isActive ? 'text-white' : 'text-blue-400'} />
      <span>{label}</span>
    </Link>
  );
};

/* ── Theme Toggle Button (reused in sidebar + topbar) ── */
const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl transition-colors duration-200 border-none cursor-pointer ${className}`}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      aria-label="Alternar tema"
    >
      {isDark
        ? <Sun size={18} className="text-yellow-400" />
        : <Moon size={18} className="text-slate-400" />
      }
    </button>
  );
};

const Layout = ({ children }) => {
  const { logout, usuario } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const firstName = usuario ? usuario.nome.split(' ')[0] : 'Admin';

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar fixed lg:sticky top-0 z-40 h-screen transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm sidebar-brand-icon shrink-0">RS</div>
            <div className="min-w-0">
              <span className="font-bold text-base tracking-tight text-white block leading-tight">RevendaSmart</span>
              <span className="text-xs text-blue-400 font-medium truncate block">{firstName}</span>
            </div>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0" aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-1 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <SidebarLink key={item.to} {...item} onClick={closeSidebar} />
          ))}
        </nav>

        {/* Footer — theme toggle + logout */}
        <div className="pt-4 border-t border-white/10 flex items-center gap-2">
          <ThemeToggle className="hover:bg-white/10 flex-shrink-0" />
          <button onClick={logout} className="sidebar-logout flex-1">
            <LogOut size={18} />
            <span className="font-medium text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Right side */}
      <div className="flex flex-col flex-1 min-w-0 min-h-screen">

        {/* Mobile topbar */}
        <header className="topbar lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" aria-label="Abrir menu">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs sidebar-brand-icon">RS</div>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">RevendaSmart</span>
          </div>
          <ThemeToggle className="hover:bg-slate-100 dark:hover:bg-slate-700" />
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

const PrivateRoute = ({ children }) => {
  const { usuario, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse" />
          <p className="text-sm font-medium text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }
  if (!usuario) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <DataProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/cadastro" element={<Cadastro />} />
                  <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/vendas" element={<PrivateRoute><Vendas /></PrivateRoute>} />
                  <Route path="/historico-vendas" element={<PrivateRoute><HistoricoVendas /></PrivateRoute>} />
                  <Route path="/estoque" element={<PrivateRoute><Estoque /></PrivateRoute>} />
                  <Route path="/estoque/entrada" element={<PrivateRoute><EstoqueForm /></PrivateRoute>} />
                  <Route path="/cadastros" element={<PrivateRoute><CentralCadastros /></PrivateRoute>} />
                  <Route path="/cadastros/categorias" element={<PrivateRoute><Categorias /></PrivateRoute>} />
                  <Route path="/cadastros/canais-venda" element={<PrivateRoute><CanaisVenda /></PrivateRoute>} />
                  <Route path="/cadastros/canais-compra" element={<PrivateRoute><CanaisCompra /></PrivateRoute>} />
                  <Route path="/cadastros/produtos" element={<PrivateRoute><Produtos /></PrivateRoute>} />
                  <Route path="/cadastros/produtos/novo" element={<PrivateRoute><ProdutoForm /></PrivateRoute>} />
                  <Route path="/cadastros/produtos/editar/:id" element={<PrivateRoute><ProdutoForm /></PrivateRoute>} />
                </Routes>
              </Router>
            </DataProvider>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
