import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { ClipboardList, Search, ChevronRight, Eye } from 'lucide-react';
import Modal from '../components/UI/Modal';

const STATUS_LABELS = {
    pendente_vistoria: 'Aguardando Vistoria',
    aprovado_vistoria: 'Aprovado Vistoria',
    rejeitado_vistoria: 'Rejeitado Vistoria',
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

export default function Solicitacoes() {
    const { solicitacoes, fiscais, funcionarios, materiais } = useData();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedSol, setSelectedSol] = useState(null);

    const getFiscalName = (id) => fiscais.find(f => f.id === id)?.nome || '—';
    const getFuncName = (id) => funcionarios.find(f => f.id === id)?.nome || '—';
    const getMaterialName = (id) => materiais.find(m => m.id === id)?.nome || '—';

    const sorted = [...solicitacoes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const filtered = sorted.filter(s => {
        const matchSearch = getFiscalName(s.fiscalId).toLowerCase().includes(search.toLowerCase()) ||
            getFuncName(s.funcionarioId).toLowerCase().includes(search.toLowerCase()) ||
            getMaterialName(s.materialId).toLowerCase().includes(search.toLowerCase());
        const matchStatus = !filterStatus || s.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const viewDetail = (sol) => {
        setSelectedSol(sol);
        setDetailOpen(true);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Solicitações de Materiais</h1>
                    <p>Acompanhe todas as solicitações do sistema</p>
                </div>
            </div>

            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-bar">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">Todos os status</option>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </div>
            </div>

            <div className="card">
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><ClipboardList size={28} /></div>
                        <h3>Nenhuma solicitação encontrada</h3>
                        <p>As solicitações dos fiscais aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Fiscal</th>
                                    <th>Funcionário</th>
                                    <th>Material</th>
                                    <th>Qtd Solic.</th>
                                    <th>Qtd Liber.</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={s.id}>
                                        <td>{new Date(s.createdAt).toLocaleDateString('pt-BR')}</td>
                                        <td style={{ fontWeight: 500 }}>{getFiscalName(s.fiscalId)}</td>
                                        <td>{getFuncName(s.funcionarioId)}</td>
                                        <td>{getMaterialName(s.materialId)}</td>
                                        <td>{s.quantidade}</td>
                                        <td>{s.qtdLiberada != null ? s.qtdLiberada : '—'}</td>
                                        <td><span className={`badge ${STATUS_BADGE[s.status]}`}>{STATUS_LABELS[s.status]}</span></td>
                                        <td>
                                            <button className="btn btn-ghost btn-icon-sm" onClick={() => viewDetail(s)}><Eye size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Detalhes da Solicitação" large>
                {selectedSol && (
                    <div>
                        <div className="detail-card">
                            <div className="detail-row"><span className="detail-label">Fiscal</span><span className="detail-value">{getFiscalName(selectedSol.fiscalId)}</span></div>
                            <div className="detail-row"><span className="detail-label">Funcionário</span><span className="detail-value">{getFuncName(selectedSol.funcionarioId)}</span></div>
                            <div className="detail-row"><span className="detail-label">Material</span><span className="detail-value">{getMaterialName(selectedSol.materialId)}</span></div>
                            <div className="detail-row"><span className="detail-label">Quantidade Solicitada</span><span className="detail-value">{selectedSol.quantidade}</span></div>
                            <div className="detail-row"><span className="detail-label">Quantidade Liberada</span><span className="detail-value">{selectedSol.qtdLiberada != null ? selectedSol.qtdLiberada : '—'}</span></div>
                            <div className="detail-row"><span className="detail-label">Data</span><span className="detail-value">{new Date(selectedSol.createdAt).toLocaleString('pt-BR')}</span></div>
                            {selectedSol.observacao && <div className="detail-row"><span className="detail-label">Observação</span><span className="detail-value">{selectedSol.observacao}</span></div>}
                        </div>

                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '16px 0 10px' }}>Fluxo de Aprovação</h3>
                        <div className="flow-status">
                            <div className={`flow-step ${selectedSol.status === 'pendente_vistoria' ? 'pending' : selectedSol.vistoriaApproval === 'aprovado' ? 'done' : selectedSol.vistoriaApproval === 'rejeitado' ? 'rejected' : 'waiting'}`}>
                                Vistoria: {selectedSol.vistoriaApproval || 'Pendente'}
                            </div>
                            <ChevronRight size={14} className="flow-arrow" />
                            <div className={`flow-step ${selectedSol.status === 'aprovado_vistoria' ? 'pending' : selectedSol.almoxApproval === 'aprovado' ? 'done' : selectedSol.almoxApproval === 'rejeitado' ? 'rejected' : 'waiting'}`}>
                                Almoxarifado: {selectedSol.almoxApproval || 'Pendente'}
                            </div>
                        </div>

                        {selectedSol.vistoriaObs && (
                            <div className="detail-card" style={{ marginTop: 12 }}>
                                <div className="detail-row"><span className="detail-label">Obs. Vistoria</span><span className="detail-value">{selectedSol.vistoriaObs}</span></div>
                                {selectedSol.vistoriaDate && <div className="detail-row"><span className="detail-label">Data Vistoria</span><span className="detail-value">{new Date(selectedSol.vistoriaDate).toLocaleString('pt-BR')}</span></div>}
                            </div>
                        )}
                        {selectedSol.almoxObs && (
                            <div className="detail-card" style={{ marginTop: 12 }}>
                                <div className="detail-row"><span className="detail-label">Obs. Almoxarifado</span><span className="detail-value">{selectedSol.almoxObs}</span></div>
                                {selectedSol.almoxDate && <div className="detail-row"><span className="detail-label">Data Almox.</span><span className="detail-value">{new Date(selectedSol.almoxDate).toLocaleString('pt-BR')}</span></div>}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
