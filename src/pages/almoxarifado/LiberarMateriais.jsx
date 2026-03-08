import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import Modal from '../../components/UI/Modal';
import { Warehouse, Check, X, Eye } from 'lucide-react';

export default function LiberarMateriais() {
    const { solicitacoes, updateSolicitacao, fiscais, funcionarios, materiais } = useData();
    const [tab, setTab] = useState('pendentes');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSol, setSelectedSol] = useState(null);
    const [obs, setObs] = useState('');
    const [qtdLiberada, setQtdLiberada] = useState('');

    const pendentes = solicitacoes.filter(s => s.status === 'aprovado_vistoria').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const historico = solicitacoes.filter(s => s.almoxApproval != null).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const getFiscalName = (id) => fiscais.find(f => f.id === id)?.nome || '—';
    const getFuncName = (id) => funcionarios.find(f => f.id === id)?.nome || '—';
    const getMaterialName = (id) => materiais.find(m => m.id === id)?.nome || '—';

    const openAction = (sol) => {
        setSelectedSol(sol);
        setObs('');
        setQtdLiberada(sol.quantidade.toString());
        setModalOpen(true);
    };

    const approve = () => {
        updateSolicitacao(selectedSol.id, {
            status: 'finalizado',
            almoxApproval: 'aprovado',
            almoxDate: new Date().toISOString(),
            almoxObs: obs,
            qtdLiberada: parseInt(qtdLiberada) || selectedSol.quantidade,
        });
        setModalOpen(false);
    };

    const reject = () => {
        updateSolicitacao(selectedSol.id, {
            status: 'rejeitado_almox',
            almoxApproval: 'rejeitado',
            almoxDate: new Date().toISOString(),
            almoxObs: obs,
            qtdLiberada: 0,
        });
        setModalOpen(false);
    };

    const currentList = tab === 'pendentes' ? pendentes : historico;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Liberar Materiais</h1>
                    <p>Libere os materiais aprovados pela vistoria</p>
                </div>
            </div>

            <div className="tabs">
                <button className={`tab-btn ${tab === 'pendentes' ? 'active' : ''}`} onClick={() => setTab('pendentes')}>
                    Aguardando Liberação ({pendentes.length})
                </button>
                <button className={`tab-btn ${tab === 'historico' ? 'active' : ''}`} onClick={() => setTab('historico')}>
                    Histórico ({historico.length})
                </button>
            </div>

            <div className="card">
                {currentList.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><Warehouse size={28} /></div>
                        <h3>{tab === 'pendentes' ? 'Nenhum material aguardando liberação' : 'Nenhum histórico'}</h3>
                        <p>{tab === 'pendentes' ? 'Os materiais aprovados pela vistoria aparecerão aqui.' : 'O histórico aparecerá aqui.'}</p>
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
                                    {tab === 'historico' && <th>Qtd Liber.</th>}
                                    {tab === 'historico' && <th>Decisão</th>}
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentList.map(s => (
                                    <tr key={s.id}>
                                        <td>{new Date(s.createdAt).toLocaleDateString('pt-BR')}</td>
                                        <td style={{ fontWeight: 500 }}>{getFiscalName(s.fiscalId)}</td>
                                        <td>{getFuncName(s.funcionarioId)}</td>
                                        <td>{getMaterialName(s.materialId)}</td>
                                        <td>{s.quantidade}</td>
                                        {tab === 'historico' && <td>{s.qtdLiberada != null ? s.qtdLiberada : '—'}</td>}
                                        {tab === 'historico' && (
                                            <td>
                                                <span className={`badge ${s.almoxApproval === 'aprovado' ? 'badge-success' : 'badge-danger'}`}>
                                                    {s.almoxApproval === 'aprovado' ? 'Liberado' : 'Rejeitado'}
                                                </span>
                                            </td>
                                        )}
                                        <td>
                                            {tab === 'pendentes' ? (
                                                <button className="btn btn-success btn-sm" onClick={() => openAction(s)}><Eye size={14} /> Analisar</button>
                                            ) : (
                                                <button className="btn btn-ghost btn-icon-sm" onClick={() => openAction(s)}><Eye size={14} /></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Liberação de Material" large
                footer={selectedSol?.status === 'aprovado_vistoria' ? (
                    <>
                        <button className="btn btn-danger" onClick={reject}><X size={14} /> Rejeitar</button>
                        <button className="btn btn-success" onClick={approve}><Check size={14} /> Liberar</button>
                    </>
                ) : null}
            >
                {selectedSol && (
                    <div>
                        <div className="detail-card">
                            <div className="detail-row"><span className="detail-label">Fiscal</span><span className="detail-value">{getFiscalName(selectedSol.fiscalId)}</span></div>
                            <div className="detail-row"><span className="detail-label">Funcionário</span><span className="detail-value">{getFuncName(selectedSol.funcionarioId)}</span></div>
                            <div className="detail-row"><span className="detail-label">Material</span><span className="detail-value">{getMaterialName(selectedSol.materialId)}</span></div>
                            <div className="detail-row"><span className="detail-label">Quantidade Solicitada</span><span className="detail-value">{selectedSol.quantidade}</span></div>
                            <div className="detail-row"><span className="detail-label">Data Solicitação</span><span className="detail-value">{new Date(selectedSol.createdAt).toLocaleString('pt-BR')}</span></div>
                            {selectedSol.observacao && <div className="detail-row"><span className="detail-label">Observação Fiscal</span><span className="detail-value">{selectedSol.observacao}</span></div>}
                            {selectedSol.vistoriaObs && <div className="detail-row"><span className="detail-label">Obs. Vistoria</span><span className="detail-value">{selectedSol.vistoriaObs}</span></div>}
                        </div>

                        {selectedSol.status === 'aprovado_vistoria' && (
                            <>
                                <div className="form-group" style={{ marginTop: 16 }}>
                                    <label className="form-label">Quantidade a Liberar</label>
                                    <div className="qty-edit">
                                        <input
                                            type="number"
                                            min="1"
                                            value={qtdLiberada}
                                            onChange={e => setQtdLiberada(e.target.value)}
                                        />
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                            (Solicitado: {selectedSol.quantidade})
                                        </span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Observação (opcional)</label>
                                    <textarea className="form-textarea" value={obs} onChange={e => setObs(e.target.value)} placeholder="Justificativa ou observação..." />
                                </div>
                            </>
                        )}

                        {selectedSol.almoxObs && selectedSol.status !== 'aprovado_vistoria' && (
                            <div className="detail-card" style={{ marginTop: 12 }}>
                                <div className="detail-row"><span className="detail-label">Obs. Almoxarifado</span><span className="detail-value">{selectedSol.almoxObs}</span></div>
                                <div className="detail-row"><span className="detail-label">Qtd Liberada</span><span className="detail-value">{selectedSol.qtdLiberada}</span></div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
