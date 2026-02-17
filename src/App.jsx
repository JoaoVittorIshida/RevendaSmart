import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Settings, LogOut, History } from 'lucide-react';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

const SidebarLink = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`sidebar-link ${isActive ? 'active' : ''}`}
    >
      <Icon size={20} className={isActive ? 'text-white' : 'text-blue-400'} />
      <span>{label}</span>
    </Link>
  );
};

const Layout = ({ children }) => {
  const { logout, usuario } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="flex items-center gap-3 mb-20 px-2 mt-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white sidebar-brand-icon">
            RS
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-white block">RevendaSmart</span>
            <span className="text-xs text-blue-400 uppercase tracking-widest font-semibold">
              {usuario ? usuario.nome.split(' ')[0] : 'Pro Admin'}
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink to="/vendas" icon={ShoppingCart} label="Nova Venda" />
          <SidebarLink to="/historico-vendas" icon={History} label="Histórico Vendas" />
          <SidebarLink to="/estoque" icon={Package} label="Estoque" />
          <SidebarLink to="/cadastros" icon={Settings} label="Cadastros" />
        </nav>

        <div className="p-4 border-t border-white/10 mt-4">
          <button onClick={logout} className="sidebar-logout group">
            <LogOut size={20} className="group-hover:text-red-400 transition-colors" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

const PrivateRoute = ({ children }) => {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-blue-600">Carregando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Protected Routes */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/vendas" element={<PrivateRoute><Vendas /></PrivateRoute>} />
            <Route path="/historico-vendas" element={<PrivateRoute><HistoricoVendas /></PrivateRoute>} />
            <Route path="/estoque" element={<PrivateRoute><Estoque /></PrivateRoute>} />
            <Route path="/estoque/entrada" element={<PrivateRoute><EstoqueForm /></PrivateRoute>} />

            {/* Rotas de Cadastro */}
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
    </AuthProvider>
  );
}

export default App;
