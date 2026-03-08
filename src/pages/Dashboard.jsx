import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Users, MapPin, Package, ClipboardList, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();
    const { fiscais, funcionarios, setores, materiais, solicitacoes, presencas } = useData();

    const pendingVistoria = solicitacoes.filter(s => s.status === 'pendente_vistoria').length;
    const pendingAlmox = solicitacoes.filter(s => s.status === 'aprovado_vistoria').length;
    const finalizadas = solicitacoes.filter(s => s.status === 'finalizado').length;
    const rejeitadas = solicitacoes.filter(s => s.status === 'rejeitado_vistoria' || s.status === 'rejeitado_almox').length;

    const today = new Date().toISOString().split('T')[0];
    const presencasHoje = presencas.filter(p => p.date === today);
    const presentesToday = presencasHoje.filter(p => p.status === 'presente').length;
    const faltasToday = presencasHoje.filter(p => p.status === 'faltou').length;

    if (user.role === 'fiscal') {
        const meusFuncionarios = funcionarios.filter(f => f.fiscalId === user.fiscalId);
        const minhasSolicitacoes = solicitacoes.filter(s => s.fiscalId === user.fiscalId);
        const minhasPresencas = presencas.filter(p => p.date === today && meusFuncionarios.some(f => f.id === p.funcionarioId));

        return (
            <div>
                <div className="page-header">
                    <div>
                        <h1>Dashboard</h1>
                        <p>Bem-vindo, {user.name}</p>
                    </div>
                </div>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon blue"><Users size={22} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{meusFuncionarios.length}</div>
                            <div className="stat-label">Meus Funcionários</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green"><CheckCircle size={22} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{minhasPresencas.filter(p => p.status === 'presente').length}</div>
                            <div className="stat-label">Presentes Hoje</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon yellow"><Clock size={22} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{minhasSolicitacoes.filter(s => s.status !== 'finalizado' && s.status !== 'rejeitado_vistoria' && s.status !== 'rejeitado_almox').length}</div>
                            <div className="stat-label">Solicitações Pendentes</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon purple"><Package size={22} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{minhasSolicitacoes.filter(s => s.status === 'finalizado').length}</div>
                            <div className="stat-label">Materiais Liberados</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (user.role === 'vistoria') {
        return (
            <div>
                <div className="page-header">
                    <div>
                        <h1>Dashboard — Vistoria</h1>
                        <p>Bem-vindo, {user.name}</p>
                    </div>
                </div>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon yellow"><Clock size={22} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{pendingVistoria}</div>
                            <div className="stat-label">Aguardando Aprovação</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green"><CheckCircle size={22} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{solicitacoes.filter(s => s.vistoriaApproval === 'aprovado').length}</div>
                            <div className="stat-label">Aprovadas por Mim</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon red"><XCircle size={22} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{solicitacoes.filter(s => s.status === 'rejeitado_vistoria').length}</div>
                            <div className="stat-label">Rejeitadas</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (user.role === 'almoxarifado') {
        return (
            <div>
                <div className="page-header">
                    <div>
                        <h1>Dashboard — Almoxarifado</h1>
                        <p>Bem-vindo, {user.name}</p>
                    </div>
                </div>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon yellow"><Clock size={22} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{pendingAlmox}</div>
                            <div className="stat-label">Aguardando Liberação</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green"><CheckCircle size={22} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{finalizadas}</div>
                            <div className="stat-label">Materiais Liberados</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon red"><XCircle size={22} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{solicitacoes.filter(s => s.status === 'rejeitado_almox').length}</div>
                            <div className="stat-label">Rejeitadas</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Super Admin Dashboard
    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Visão geral do sistema de controle operacional</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue"><Users size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{fiscais.length}</div>
                        <div className="stat-label">Fiscais</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon cyan"><Users size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{funcionarios.length}</div>
                        <div className="stat-label">Funcionários</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><MapPin size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{setores.length}</div>
                        <div className="stat-label">Setores</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><CheckCircle size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{presentesToday}</div>
                        <div className="stat-label">Presentes Hoje</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><XCircle size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{faltasToday}</div>
                        <div className="stat-label">Faltas Hoje</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow"><Clock size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{pendingVistoria + pendingAlmox}</div>
                        <div className="stat-label">Solicitações Pendentes</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><TrendingUp size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{finalizadas}</div>
                        <div className="stat-label">Materiais Liberados</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><XCircle size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{rejeitadas}</div>
                        <div className="stat-label">Solicitações Rejeitadas</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
