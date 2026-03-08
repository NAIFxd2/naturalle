import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Shield, Save, Check, RotateCcw } from 'lucide-react';

// All available pages/routes in the system
const ALL_PAGES = [
    { section: 'Principal' },
    { id: 'dashboard', path: '/', label: 'Dashboard' },
    { section: 'Gestão' },
    { id: 'equipes', path: '/equipes', label: 'Equipes' },
    { id: 'setores', path: '/setores', label: 'Setores' },
    { id: 'cargos', path: '/cargos', label: 'Cargos / Funções' },
    { id: 'controle-geral', path: '/controle-geral', label: 'Controle Geral' },
    { id: 'colaboradores', path: '/colaboradores', label: 'Colaboradores' },
    { id: 'presenca', path: '/presenca', label: 'Controle de Presença' },
    { section: 'Roçadeiras' },
    { id: 'rocadeiras', path: '/rocadeiras', label: 'Controle de Roçadeiras' },
    { section: 'Materiais' },
    { id: 'materiais', path: '/materiais', label: 'Catálogo de Materiais' },
    { id: 'solicitacoes', path: '/solicitacoes', label: 'Solicitações' },
    { section: 'DDS' },
    { id: 'tipos-servico', path: '/tipos-servico', label: 'Tipos de Serviço' },
    { id: 'temas-dds', path: '/temas-dds', label: 'Temas DDS' },
    { id: 'dds-admin', path: '/dds-admin', label: 'Painel DDS' },
    { id: 'dds-sesmt', path: '/dds-sesmt', label: 'Evidências DDS (SESMT)' },
    { section: 'Fiscal' },
    { id: 'meus-funcionarios', path: '/meus-funcionarios', label: 'Meus Funcionários' },
    { id: 'solicitar-material', path: '/solicitar-material', label: 'Solicitar Material' },
    { id: 'minhas-solicitacoes', path: '/minhas-solicitacoes', label: 'Minhas Solicitações' },
    { id: 'dds', path: '/dds', label: 'DDS' },
    { section: 'Aprovações' },
    { id: 'aprovar-solicitacoes', path: '/aprovar-solicitacoes', label: 'Aprovar Solicitações' },
    { id: 'liberar-materiais', path: '/liberar-materiais', label: 'Liberar Materiais' },
    { section: 'Sistema' },
    { id: 'importacoes', path: '/importacoes', label: 'Importações' },
    { id: 'relatorios', path: '/relatorios', label: 'Relatórios' },
    { id: 'usuarios', path: '/usuarios', label: 'Usuários do Sistema' },
    { id: 'permissoes', path: '/permissoes', label: 'Permissões' },
    { section: 'RH' },
    { id: 'banco-horas', path: '/banco-horas', label: 'Banco de Horas' },
];

const ROLES = [
    { id: 'fiscal', label: 'Fiscal' },
    { id: 'vistoria', label: 'Vistoria' },
    { id: 'almoxarifado', label: 'Almoxarifado' },
    { id: 'sesmt', label: 'SESMT' },
    { id: 'dp', label: 'Depto. Pessoal' },
];

// Default permissions per role
const DEFAULT_PERMISSIONS = {
    fiscal: ['dashboard', 'meus-funcionarios', 'presenca', 'solicitar-material', 'minhas-solicitacoes', 'dds'],
    vistoria: ['dashboard', 'aprovar-solicitacoes'],
    almoxarifado: ['dashboard', 'liberar-materiais'],
    sesmt: ['dashboard', 'dds-sesmt', 'colaboradores'],
    dp: ['dashboard', 'colaboradores', 'presenca', 'banco-horas'],
};

export default function Permissoes() {
    const { permissionsConfig, setPermissionsConfig } = useData();
    const [config, setConfig] = useState(() => permissionsConfig || DEFAULT_PERMISSIONS);
    const [saved, setSaved] = useState(true);

    useEffect(() => {
        if (permissionsConfig) setConfig(permissionsConfig);
    }, [permissionsConfig]);

    const pages = ALL_PAGES.filter(p => p.id); // Only actual pages, not sections

    const togglePermission = (role, pageId) => {
        setConfig(prev => {
            const current = prev[role] || [];
            const updated = current.includes(pageId)
                ? current.filter(p => p !== pageId)
                : [...current, pageId];
            return { ...prev, [role]: updated };
        });
        setSaved(false);
    };

    const savePermissions = () => {
        setPermissionsConfig(config);
        setSaved(true);
    };

    const resetDefaults = () => {
        setConfig(DEFAULT_PERMISSIONS);
        setSaved(false);
    };

    const selectAll = (role) => {
        setConfig(prev => ({ ...prev, [role]: pages.map(p => p.id) }));
        setSaved(false);
    };

    const deselectAll = (role) => {
        setConfig(prev => ({ ...prev, [role]: ['dashboard'] }));
        setSaved(false);
    };

    return (
        <div>
            <div className="page-header">
                <div><h1>Permissões</h1><p>Configure quais áreas do sistema cada perfil pode acessar</p></div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" onClick={resetDefaults}><RotateCcw size={16} /> Padrão</button>
                    <button className="btn btn-primary" onClick={savePermissions} disabled={saved}>
                        {saved ? <><Check size={16} /> Salvo</> : <><Save size={16} /> Salvar</>}
                    </button>
                </div>
            </div>

            <div className="card">
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ minWidth: 700 }}>
                        <thead>
                            <tr>
                                <th style={{ minWidth: 200, position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 2 }}>Página</th>
                                {ROLES.map(r => (
                                    <th key={r.id} style={{ textAlign: 'center', minWidth: 100 }}>
                                        <div>{r.label}</div>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
                                            <button className="btn btn-ghost" style={{ fontSize: '0.65rem', padding: '2px 6px' }} onClick={() => selectAll(r.id)}>Todos</button>
                                            <button className="btn btn-ghost" style={{ fontSize: '0.65rem', padding: '2px 6px' }} onClick={() => deselectAll(r.id)}>Nenhum</button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ALL_PAGES.map((page, i) => {
                                if (page.section) {
                                    return (
                                        <tr key={`section-${i}`}>
                                            <td colSpan={ROLES.length + 1} style={{
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: 1,
                                                color: 'var(--accent-primary)',
                                                background: 'var(--bg-secondary)',
                                                padding: '8px 12px',
                                            }}>{page.section}</td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={page.id}>
                                        <td style={{ fontWeight: 500, position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1 }}>{page.label}</td>
                                        {ROLES.map(r => {
                                            const hasAccess = (config[r.id] || []).includes(page.id);
                                            return (
                                                <td key={r.id} style={{ textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => togglePermission(r.id, page.id)}
                                                        style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: 'var(--radius-md)',
                                                            border: hasAccess ? '2px solid var(--accent-success)' : '2px solid var(--border-color)',
                                                            background: hasAccess ? 'rgba(34,197,94,0.15)' : 'transparent',
                                                            color: hasAccess ? 'var(--accent-success)' : 'var(--text-muted)',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.15s',
                                                        }}
                                                    >
                                                        {hasAccess ? <Check size={18} /> : ''}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
