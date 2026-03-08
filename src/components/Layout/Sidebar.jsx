import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
    LayoutDashboard, Users, CalendarCheck, Package, ClipboardList,
    BarChart3, Settings, MapPin, ShieldCheck, Warehouse, LogOut, Menu, Briefcase, ClipboardCheck, Wrench, Layers, BookOpen, Upload, Shield, UserCheck, Clock
} from 'lucide-react';

// Full page registry — maps page IDs to their sidebar config
const PAGE_REGISTRY = {
    'dashboard': { path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'Principal' },
    'equipes': { path: '/equipes', label: 'Equipes', icon: Users, section: 'Gestão' },
    'setores': { path: '/setores', label: 'Setores', icon: MapPin, section: 'Gestão' },
    'cargos': { path: '/cargos', label: 'Cargos / Funções', icon: Briefcase, section: 'Gestão' },
    'controle-geral': { path: '/controle-geral', label: 'Controle Geral', icon: ClipboardCheck, section: 'Gestão' },
    'colaboradores': { path: '/colaboradores', label: 'Colaboradores', icon: UserCheck, section: 'Gestão' },
    'presenca': { path: '/presenca', label: 'Controle de Presença', icon: CalendarCheck, section: 'Gestão' },
    'rocadeiras': { path: '/rocadeiras', label: 'Controle de Roçadeiras', icon: Wrench, section: 'Roçadeiras' },
    'materiais': { path: '/materiais', label: 'Catálogo de Materiais', icon: Package, section: 'Materiais' },
    'solicitacoes': { path: '/solicitacoes', label: 'Solicitações', icon: ClipboardList, section: 'Materiais', badge: true },
    'tipos-servico': { path: '/tipos-servico', label: 'Tipos de Serviço', icon: Layers, section: 'DDS' },
    'temas-dds': { path: '/temas-dds', label: 'Temas DDS', icon: BookOpen, section: 'DDS' },
    'dds-admin': { path: '/dds-admin', label: 'Painel DDS', icon: CalendarCheck, section: 'DDS' },
    'dds-sesmt': { path: '/dds-sesmt', label: 'Evidências DDS', icon: BookOpen, section: 'DDS' },
    'meus-funcionarios': { path: '/meus-funcionarios', label: 'Meus Funcionários', icon: Users, section: 'Minha Equipe' },
    'solicitar-material': { path: '/solicitar-material', label: 'Solicitar Material', icon: Package, section: 'Materiais' },
    'minhas-solicitacoes': { path: '/minhas-solicitacoes', label: 'Minhas Solicitações', icon: ClipboardList, section: 'Materiais' },
    'dds': { path: '/dds', label: 'DDS', icon: BookOpen, section: 'DDS', ddsBadge: true },
    'aprovar-solicitacoes': { path: '/aprovar-solicitacoes', label: 'Aprovar Solicitações', icon: ShieldCheck, section: 'Aprovações', badge: true },
    'liberar-materiais': { path: '/liberar-materiais', label: 'Liberar Materiais', icon: Warehouse, section: 'Liberação', badge: true },
    'importacoes': { path: '/importacoes', label: 'Importações', icon: Upload, section: 'Sistema' },
    'relatorios': { path: '/relatorios', label: 'Relatórios', icon: BarChart3, section: 'Sistema' },
    'usuarios': { path: '/usuarios', label: 'Usuários do Sistema', icon: Settings, section: 'Sistema' },
    'permissoes': { path: '/permissoes', label: 'Permissões', icon: Shield, section: 'Sistema' },
    'banco-horas': { path: '/banco-horas', label: 'Banco de Horas', icon: Clock, section: 'RH' },
};

// Default superadmin pages (always has full access)
const SUPERADMIN_PAGES = [
    'dashboard', 'equipes', 'setores', 'cargos', 'controle-geral', 'colaboradores', 'presenca',
    'rocadeiras', 'materiais', 'solicitacoes',
    'tipos-servico', 'temas-dds', 'dds-admin',
    'importacoes', 'relatorios', 'usuarios', 'permissoes',
    'banco-horas',
];

// Default permissions (used when no config saved)
const DEFAULT_PERMISSIONS = {
    fiscal: ['dashboard', 'meus-funcionarios', 'presenca', 'solicitar-material', 'minhas-solicitacoes', 'dds'],
    vistoria: ['dashboard', 'aprovar-solicitacoes'],
    almoxarifado: ['dashboard', 'liberar-materiais', 'colaboradores'],
    sesmt: ['dashboard', 'dds-sesmt', 'colaboradores'],
    dp: ['dashboard', 'colaboradores', 'presenca', 'banco-horas'],
};

function buildMenuFromPages(pageIds) {
    const items = [];
    let lastSection = null;
    for (const id of pageIds) {
        const page = PAGE_REGISTRY[id];
        if (!page) continue;
        if (page.section !== lastSection) {
            items.push({ section: page.section });
            lastSection = page.section;
        }
        items.push({ path: page.path, label: page.label, icon: page.icon, badge: page.badge, ddsBadge: page.ddsBadge });
    }
    return items;
}

export default function Sidebar() {
    const { user, logout } = useAuth();
    const { solicitacoes, registrosDDS, permissionsConfig } = useData();
    const location = useLocation();

    if (!user) return null;

    // Build menu dynamically based on role
    let menuItems;
    if (user.role === 'superadmin') {
        menuItems = buildMenuFromPages(SUPERADMIN_PAGES);
    } else {
        const permissions = permissionsConfig || DEFAULT_PERMISSIONS;
        const pages = permissions[user.role] || DEFAULT_PERMISSIONS[user.role] || ['dashboard'];
        menuItems = buildMenuFromPages(pages);
    }

    const getBadgeCount = (item) => {
        if (item.ddsBadge) return getDDSPending();
        if (!item.badge) return 0;
        if (item.path === '/solicitacoes' || item.path === '/aprovar-solicitacoes') {
            return solicitacoes.filter(s => s.status === 'pendente').length;
        }
        if (item.path === '/liberar-materiais') {
            return solicitacoes.filter(s => s.status === 'aprovada').length;
        }
        return 0;
    };

    const getDDSPending = () => {
        if (user.role !== 'fiscal') return 0;
        const today = new Date();
        const day = today.getDay();
        const isDDS = day === 2 || day === 4; // Terça e Quinta
        if (!isDDS) return 0;
        const todayKey = today.toISOString().split('T')[0];
        const applied = registrosDDS.some(r => r.fiscalId === user.fiscalId && r.date === todayKey);
        return applied ? 0 : 1;
    };

    const roleLabels = {
        superadmin: 'Super Admin',
        fiscal: 'Fiscal',
        vistoria: 'Vistoria',
        almoxarifado: 'Almoxarifado',
        sesmt: 'SESMT',
        dp: 'Depto. Pessoal',
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-mark">CO</div>
                <span>Controle Op.</span>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item, idx) => {
                    if (item.section) {
                        return <div key={`section-${idx}`} className="sidebar-section-title">{item.section}</div>;
                    }
                    const Icon = item.icon;
                    const badge = getBadgeCount(item);
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                            {badge > 0 && <span className="badge">{badge}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="avatar">
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                        <div className="user-name">{user.name}</div>
                        <div className="user-role">{roleLabels[user.role] || user.role}</div>
                    </div>
                </div>
                <button className="btn btn-ghost btn-icon logout-btn" onClick={logout} title="Sair" style={{ marginTop: 8, width: '100%' }}>
                    <LogOut size={18} /> <span style={{ fontSize: '0.8rem' }}>Sair</span>
                </button>
            </div>
        </aside>
    );
}
