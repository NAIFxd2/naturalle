import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { ClipboardList, ChevronRight } from 'lucide-react';

const STATUS_LABELS = {
    pendente_vistoria: 'Aguardando Vistoria',
    aprovado_vistoria: 'Aguardando Almoxarifado',
    rejeitado_vistoria: 'Rejeitado pela Vistoria',
    aprovado_almox: 'Aprovado Almoxarifado',
    rejeitado_almox: 'Rejeitado Almoxarifado',
    finalizado: 'Finalizado',
};

const STATUS_BADGE = {
    pendente_vistoria: 'badge-warning',
    aprovado_vistoria: 'badge-info',
    rejeitado_vistoria: 'badge-danger',
    aprovado_almox: 'badge-success',
    rejeitado_almox: 'badge-danger',
    finalizado: 'badge-success',
};

export default function MinhasSolicitacoes() {
    const { user } = useAuth();
    const { solicitacoes, funcionarios, materiais } = useData();

    const minhas = solicitacoes
        .filter(s => s.fiscalId === user.fiscalId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const getFuncName = (id) => funcionarios.find(f => f.id === id)?.nome || '—';
    const getMaterialName = (id) => materiais.find(m => m.id === id)?.nome || '—';

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Minhas Solicitações</h1>
                    <p>Acompanhe o status das suas solicitações de materiais</p>
                </div>
            </div>

            <div className="card">
                {minhas.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><ClipboardList size={28} /></div>
                        <h3>Nenhuma solicitação</h3>
                        <p>Você ainda não fez nenhuma solicitação de material.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Material</th>
                                    <th>Funcionário</th>
                                    <th>Qtd Solic.</th>
                                    <th>Qtd Liber.</th>
                                    <th>Status</th>
                                    <th>Fluxo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {minhas.map(s => (
                                    <tr key={s.id}>
                                        <td>{new Date(s.createdAt).toLocaleDateString('pt-BR')}</td>
                                        <td style={{ fontWeight: 500 }}>{getMaterialName(s.materialId)}</td>
                                        <td>{getFuncName(s.funcionarioId)}</td>
                                        <td>{s.quantidade}</td>
                                        <td>{s.qtdLiberada != null ? s.qtdLiberada : '—'}</td>
                                        <td><span className={`badge ${STATUS_BADGE[s.status]}`}>{STATUS_LABELS[s.status]}</span></td>
                                        <td>
                                            <div className="flow-status">
                                                <div className={`flow-step ${s.vistoriaApproval === 'aprovado' ? 'done' : s.vistoriaApproval === 'rejeitado' ? 'rejected' : s.status === 'pendente_vistoria' ? 'pending' : 'waiting'}`}>
                                                    V
                                                </div>
                                                <ChevronRight size={12} className="flow-arrow" />
                                                <div className={`flow-step ${s.almoxApproval === 'aprovado' ? 'done' : s.almoxApproval === 'rejeitado' ? 'rejected' : s.status === 'aprovado_vistoria' ? 'pending' : 'waiting'}`}>
                                                    A
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
