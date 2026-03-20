import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Equipes from './pages/Equipes';
import Setores from './pages/Setores';
import Materiais from './pages/Materiais';
import Usuarios from './pages/Usuarios';
import ControlePresenca from './pages/ControlePresenca';
import Solicitacoes from './pages/Solicitacoes';
import Relatorios from './pages/Relatorios';
import Cargos from './pages/Cargos';
import ControleGeral from './pages/ControleGeral';
import ControleRocadeiras from './pages/ControleRocadeiras';
import TiposServico from './pages/TiposServico';
import TemasDDS from './pages/TemasDDS';
import DDSAdmin from './pages/DDSAdmin';
import Importacoes from './pages/Importacoes';
import Colaboradores from './pages/Colaboradores';
import Permissoes from './pages/Permissoes';
import BancoHoras from './pages/BancoHoras';
import MeusFuncionarios from './pages/fiscal/MeusFuncionarios';
import SolicitarMaterial from './pages/fiscal/SolicitarMaterial';
import MinhasSolicitacoes from './pages/fiscal/MinhasSolicitacoes';
import DDSFiscal from './pages/fiscal/DDSFiscal';
import AprovarSolicitacoes from './pages/vistoria/AprovarSolicitacoes';
import LiberarMateriais from './pages/almoxarifado/LiberarMateriais';
import DDSSesmet from './pages/sesmet/DDSSesmet';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function AppLayout({ children, title }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Header title={title} />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const { loading: dataLoading, loadError } = useData();

  if (loadError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0d1117', padding: 24 }}>
        <div style={{ maxWidth: 600, background: '#161b22', border: '1px solid #f85149', borderRadius: 12, padding: 32, color: '#f85149' }}>
          <h2 style={{ marginBottom: 12 }}>Erro de Conexão com o Banco</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8rem', color: '#e6edf3', background: '#0d1117', padding: 16, borderRadius: 8 }}>{loadError}</pre>
          <p style={{ marginTop: 16, fontSize: '0.85rem', color: '#8b949e' }}>Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no painel da Vercel.</p>
        </div>
      </div>
    );
  }

  if (loading || dataLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          {dataLoading ? 'Carregando dados...' : 'Carregando...'}
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

      {/* Dashboard - all roles */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout title="Dashboard"><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Super Admin routes */}
      <Route path="/equipes" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Equipes"><Equipes /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/setores" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Setores"><Setores /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/materiais" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Catálogo de Materiais"><Materiais /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/usuarios" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Usuários do Sistema"><Usuarios /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/cargos" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Cargos / Funções"><Cargos /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/controle-geral" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Controle Geral"><ControleGeral /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/rocadeiras" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Controle de Roçadeiras"><ControleRocadeiras /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/solicitacoes" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Solicitações"><Solicitacoes /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/relatorios" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Relatórios & Análises"><Relatorios /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/tipos-servico" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Tipos de Serviço"><TiposServico /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/temas-dds" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Temas DDS"><TemasDDS /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/dds-admin" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Painel DDS"><DDSAdmin /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/importacoes" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Importações"><Importacoes /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Presença - superadmin + fiscal + dp */}
      <Route path="/presenca" element={
        <ProtectedRoute roles={['superadmin', 'fiscal', 'dp']}>
          <AppLayout title="Controle de Presença"><ControlePresenca /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Colaboradores - shared */}
      <Route path="/colaboradores" element={
        <ProtectedRoute roles={['superadmin', 'almoxarifado', 'sesmt', 'dp']}>
          <AppLayout title="Colaboradores"><Colaboradores /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Permissões - superadmin only */}
      <Route path="/permissoes" element={
        <ProtectedRoute roles={['superadmin']}>
          <AppLayout title="Permissões"><Permissoes /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Banco de Horas */}
      <Route path="/banco-horas" element={
        <ProtectedRoute roles={['superadmin', 'dp']}>
          <AppLayout title="Banco de Horas"><BancoHoras /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Fiscal routes */}
      <Route path="/meus-funcionarios" element={
        <ProtectedRoute roles={['fiscal']}>
          <AppLayout title="Meus Funcionários"><MeusFuncionarios /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/solicitar-material" element={
        <ProtectedRoute roles={['fiscal']}>
          <AppLayout title="Solicitar Material"><SolicitarMaterial /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/minhas-solicitacoes" element={
        <ProtectedRoute roles={['fiscal']}>
          <AppLayout title="Minhas Solicitações"><MinhasSolicitacoes /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/dds" element={
        <ProtectedRoute roles={['fiscal']}>
          <AppLayout title="DDS"><DDSFiscal /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Vistoria routes */}
      <Route path="/aprovar-solicitacoes" element={
        <ProtectedRoute roles={['vistoria']}>
          <AppLayout title="Aprovar Solicitações"><AprovarSolicitacoes /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Almoxarifado routes */}
      <Route path="/liberar-materiais" element={
        <ProtectedRoute roles={['almoxarifado']}>
          <AppLayout title="Liberar Materiais"><LiberarMateriais /></AppLayout>
        </ProtectedRoute>
      } />

      {/* SESMT routes */}
      <Route path="/dds-sesmt" element={
        <ProtectedRoute roles={['sesmt', 'superadmin']}>
          <AppLayout title="SESMT — Evidências DDS"><DDSSesmet /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
