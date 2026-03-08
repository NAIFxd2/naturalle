import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/UI/Modal';
import { ClipboardCheck, Plus, Pencil, Trash2, AlertTriangle, CheckCircle, Users } from 'lucide-react';

export default function ControleGeral() {
    const { controleContrato, addControleContrato, updateControleContrato, deleteControleContrato, setores, cargos, funcionarios, fiscais } = useData();
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ setorId: '', cargoId: '', qtdContrato: '' });

    const openAdd = () => {
        setEditItem(null);
        setForm({ setorId: '', cargoId: '', qtdContrato: '' });
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({ setorId: item.setorId, cargoId: item.cargoId, qtdContrato: item.qtdContrato.toString() });
        setModalOpen(true);
    };

    const save = () => {
        if (!form.setorId || !form.cargoId || !form.qtdContrato) return;
        const data = { ...form, qtdContrato: parseInt(form.qtdContrato) || 0 };
        if (editItem) {
            updateControleContrato(editItem.id, data);
        } else {
            addControleContrato(data);
        }
        setModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir esta linha?')) {
            deleteControleContrato(id);
        }
    };

    const getSetorName = (id) => setores.find(s => s.id === id)?.nome || '—';
    const getCargoName = (id) => cargos.find(c => c.id === id)?.nome || '—';

    // Calcular funcionários reais por setor + cargo
    const getQtdReal = (setorId, cargoId) => {
        // Encontrar fiscais vinculados ao setor
        const fiscaisDoSetor = fiscais.filter(f => f.setorId === setorId).map(f => f.id);
        // Contar funcionários vinculados a esses fiscais com o cargo específico
        return funcionarios.filter(f => fiscaisDoSetor.includes(f.fiscalId) && f.cargoId === cargoId).length;
    };

    // Resumo por setor
    const resumoPorSetor = useMemo(() => {
        const map = {};
        setores.forEach(s => {
            const items = controleContrato.filter(c => c.setorId === s.id);
            const totalContrato = items.reduce((sum, i) => sum + i.qtdContrato, 0);

            // Todos funcionários reais neste setor
            const fiscaisDoSetor = fiscais.filter(f => f.setorId === s.id).map(f => f.id);
            const totalReal = funcionarios.filter(f => fiscaisDoSetor.includes(f.fiscalId)).length;

            if (items.length > 0 || totalReal > 0) {
                map[s.id] = { setor: s, totalContrato, totalReal, items };
            }
        });
        return map;
    }, [setores, controleContrato, fiscais, funcionarios]);

    const totalGeralContrato = controleContrato.reduce((sum, c) => sum + c.qtdContrato, 0);
    const totalGeralReal = Object.values(resumoPorSetor).reduce((sum, r) => sum + r.totalReal, 0);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Controle Geral</h1>
                    <p>Quantitativo de funcionários previsto em contrato vs real por setor e função</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Nova Linha</button>
            </div>

            {/* KPIs gerais */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon blue"><ClipboardCheck size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalGeralContrato}</div>
                        <div className="stat-label">Previsto em Contrato</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><Users size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalGeralReal}</div>
                        <div className="stat-label">Funcionários Reais</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className={`stat-icon ${totalGeralReal >= totalGeralContrato ? 'green' : 'red'}`}>
                        {totalGeralReal >= totalGeralContrato ? <CheckCircle size={22} /> : <AlertTriangle size={22} />}
                    </div>
                    <div className="stat-content">
                        <div className="stat-value" style={{ color: totalGeralReal - totalGeralContrato >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                            {totalGeralReal - totalGeralContrato >= 0 ? '+' : ''}{totalGeralReal - totalGeralContrato}
                        </div>
                        <div className="stat-label">Diferença</div>
                    </div>
                </div>
            </div>

            {/* Tabela detalhada por setor */}
            {Object.values(resumoPorSetor).length === 0 && controleContrato.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon"><ClipboardCheck size={28} /></div>
                        <h3>Nenhum controle cadastrado</h3>
                        <p>Defina o quantitativo de funcionários previsto em contrato por setor e cargo.</p>
                    </div>
                </div>
            ) : (
                Object.values(resumoPorSetor).map(({ setor, totalContrato, totalReal, items }) => (
                    <div className="card" key={setor.id} style={{ marginBottom: 16 }}>
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">{setor.nome}</h3>
                                <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                                    <span className="badge badge-info">Contrato: {totalContrato}</span>
                                    <span className={`badge ${totalReal >= totalContrato ? 'badge-success' : 'badge-danger'}`}>
                                        Real: {totalReal}
                                    </span>
                                    <span className={`badge ${totalReal - totalContrato >= 0 ? 'badge-success' : 'badge-danger'}`}>
                                        {totalReal - totalContrato >= 0 ? '+' : ''}{totalReal - totalContrato}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Cargo / Função</th>
                                        <th>Previsto (Contrato)</th>
                                        <th>Real (Vinculados)</th>
                                        <th>Diferença</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => {
                                        const qtdReal = getQtdReal(item.setorId, item.cargoId);
                                        const diff = qtdReal - item.qtdContrato;
                                        return (
                                            <tr key={item.id}>
                                                <td style={{ fontWeight: 600 }}>{getCargoName(item.cargoId)}</td>
                                                <td>{item.qtdContrato}</td>
                                                <td>{qtdReal}</td>
                                                <td>
                                                    <span style={{ fontWeight: 700, color: diff >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                                        {diff >= 0 ? '+' : ''}{diff}
                                                    </span>
                                                </td>
                                                <td>
                                                    {diff >= 0 ? (
                                                        <span className="badge badge-success"><CheckCircle size={12} /> Completo</span>
                                                    ) : (
                                                        <span className="badge badge-danger"><AlertTriangle size={12} /> Falta {Math.abs(diff)}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="btn-group">
                                                        <button className="btn btn-ghost btn-icon-sm" onClick={() => openEdit(item)}><Pencil size={14} /></button>
                                                        <button className="btn btn-ghost btn-icon-sm" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}

            {/* Linhas sem setor configurado em resumoPorSetor */}
            {controleContrato.filter(c => !resumoPorSetor[c.setorId]).length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header">
                        <h3 className="card-title">Sem Setor Vinculado</h3>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Setor</th>
                                    <th>Cargo</th>
                                    <th>Previsto</th>
                                    <th>Real</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {controleContrato.filter(c => !resumoPorSetor[c.setorId]).map(item => (
                                    <tr key={item.id}>
                                        <td>{getSetorName(item.setorId)}</td>
                                        <td>{getCargoName(item.cargoId)}</td>
                                        <td>{item.qtdContrato}</td>
                                        <td>{getQtdReal(item.setorId, item.cargoId)}</td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-ghost btn-icon-sm" onClick={() => openEdit(item)}><Pencil size={14} /></button>
                                                <button className="btn btn-ghost btn-icon-sm" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editItem ? 'Editar Quantitativo' : 'Novo Quantitativo de Contrato'}
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={save}>Salvar</button>
                    </>
                }
            >
                <div className="form-group">
                    <label className="form-label">Setor *</label>
                    <select className="form-select" value={form.setorId} onChange={e => setForm({ ...form, setorId: e.target.value })}>
                        <option value="">Selecione o setor</option>
                        {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Cargo / Função *</label>
                    <select className="form-select" value={form.cargoId} onChange={e => setForm({ ...form, cargoId: e.target.value })}>
                        <option value="">Selecione o cargo</option>
                        {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Quantidade Prevista em Contrato *</label>
                    <input className="form-input" type="number" min="0" value={form.qtdContrato} onChange={e => setForm({ ...form, qtdContrato: e.target.value })} placeholder="Ex: 25" />
                </div>
            </Modal>
        </div>
    );
}
