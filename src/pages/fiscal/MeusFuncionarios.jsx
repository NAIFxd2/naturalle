import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Users, MapPin } from 'lucide-react';

export default function MeusFuncionarios() {
    const { user } = useAuth();
    const { funcionarios, fiscais, setores, presencas } = useData();

    const fiscal = fiscais.find(f => f.id === user.fiscalId);
    const meusFuncionarios = funcionarios.filter(f => f.fiscalId === user.fiscalId);
    const setor = fiscal?.setorId ? setores.find(s => s.id === fiscal.setorId) : null;

    const today = new Date().toISOString().split('T')[0];

    const getPresencaHoje = (funcId) => {
        const p = presencas.find(p => p.funcionarioId === funcId && p.date === today);
        return p?.status || null;
    };

    const statusLabel = (s) => {
        const labels = { presente: '✅ Presente', faltou: '❌ Faltou', suspenso: '⚠️ Suspenso', atestado: '🏥 Atestado', ferias: '🏖️ Férias' };
        return labels[s] || '— Sem registro';
    };

    const statusBadgeClass = (s) => {
        const map = { presente: 'badge-success', faltou: 'badge-danger', suspenso: 'badge-warning', atestado: 'badge-info', ferias: 'badge-purple' };
        return map[s] || 'badge-neutral';
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Meus Funcionários</h1>
                    <p>
                        {setor && <span className="badge badge-purple" style={{ marginRight: 8 }}><MapPin size={12} /> {setor.nome}</span>}
                        {meusFuncionarios.length} funcionário(s) vinculado(s)
                    </p>
                </div>
            </div>

            <div className="card">
                {meusFuncionarios.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><Users size={28} /></div>
                        <h3>Nenhum funcionário vinculado</h3>
                        <p>Solicite ao administrador para vincular funcionários a você.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Cargo</th>
                                    <th>Telefone</th>
                                    <th>Presença Hoje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {meusFuncionarios.map(f => {
                                    const status = getPresencaHoje(f.id);
                                    return (
                                        <tr key={f.id}>
                                            <td style={{ fontWeight: 600 }}>{f.nome}</td>
                                            <td>{f.cargo || '—'}</td>
                                            <td>{f.telefone || '—'}</td>
                                            <td><span className={`badge ${statusBadgeClass(status)}`}>{statusLabel(status)}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
