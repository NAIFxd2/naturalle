import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/UI/Modal';
import { Users, UserPlus, Pencil, Trash2, Search, Link, MapPin } from 'lucide-react';

export default function Equipes() {
    const { fiscais, addFiscal, updateFiscal, deleteFiscal, funcionarios, addFuncionario, updateFuncionario, deleteFuncionario, setores, presencas, solicitacoes, materiais, cargos } = useData();
    const [tab, setTab] = useState('fiscais');
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formType, setFormType] = useState('fiscal');
    const [detailFiscal, setDetailFiscal] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const [fiscalForm, setFiscalForm] = useState({ nome: '', matricula: '', telefone: '', setorId: '', username: '', password: '' });
    const [funcForm, setFuncForm] = useState({ nome: '', matricula: '', telefone: '', cargoId: '', fiscalId: '' });

    const openAddFiscal = () => {
        setEditItem(null);
        setFormType('fiscal');
        setFiscalForm({ nome: '', matricula: '', telefone: '', setorId: '', username: '', password: '' });
        setModalOpen(true);
    };

    const openEditFiscal = (fiscal) => {
        setEditItem(fiscal);
        setFormType('fiscal');
        setFiscalForm({ nome: fiscal.nome, matricula: fiscal.matricula || '', telefone: fiscal.telefone || '', setorId: fiscal.setorId || '', username: fiscal.username || '', password: fiscal.password || '' });
        setModalOpen(true);
    };

    const openAddFunc = () => {
        setEditItem(null);
        setFormType('funcionario');
        setFuncForm({ nome: '', matricula: '', telefone: '', cargoId: '', fiscalId: '' });
        setModalOpen(true);
    };

    const openEditFunc = (func) => {
        setEditItem(func);
        setFormType('funcionario');
        setFuncForm({ nome: func.nome, matricula: func.matricula || '', telefone: func.telefone || '', cargoId: func.cargoId || '', fiscalId: func.fiscalId || '' });
        setModalOpen(true);
    };

    const saveFiscal = () => {
        if (!fiscalForm.nome.trim() || !fiscalForm.username.trim() || !fiscalForm.password.trim()) return;
        if (editItem) {
            updateFiscal(editItem.id, fiscalForm);
        } else {
            addFiscal(fiscalForm);
        }
        setModalOpen(false);
    };

    const saveFunc = () => {
        if (!funcForm.nome.trim()) return;
        if (editItem) {
            updateFuncionario(editItem.id, funcForm);
        } else {
            addFuncionario(funcForm);
        }
        setModalOpen(false);
    };

    const handleDeleteFiscal = (id) => {
        if (confirm('Tem certeza que deseja excluir este fiscal?')) deleteFiscal(id);
    };

    const handleDeleteFunc = (id) => {
        if (confirm('Tem certeza que deseja excluir este funcionário?')) deleteFuncionario(id);
    };

    const getSetorName = (id) => setores.find(s => s.id === id)?.nome || '—';
    const getFiscalName = (id) => fiscais.find(f => f.id === id)?.nome || 'Não atribuído';
    const getCargoName = (id) => cargos.find(c => c.id === id)?.nome || '—';
    const getFuncCount = (fiscalId) => funcionarios.filter(f => f.fiscalId === fiscalId).length;

    const filteredFiscais = fiscais.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));
    const filteredFuncs = funcionarios.filter(f => f.nome.toLowerCase().includes(search.toLowerCase()));

    // ===== DETAIL MODAL =====
    const openFiscalDetail = (fiscal) => { setDetailFiscal(fiscal); setDetailOpen(true); };

    const getDetailData = () => {
        if (!detailFiscal) return { funcs: [], faltasTotal: 0, presentes: 0, suspensos: 0, atestados: 0, matSolicitacoes: [] };
        const funcs = funcionarios.filter(f => f.fiscalId === detailFiscal.id);
        const funcIds = funcs.map(f => f.id);
        const relPresencas = presencas.filter(p => funcIds.includes(p.funcionarioId));
        return {
            funcs,
            presentes: relPresencas.filter(p => p.status === 'presente').length,
            faltasTotal: relPresencas.filter(p => p.status === 'faltou').length,
            suspensos: relPresencas.filter(p => p.status === 'suspenso').length,
            atestados: relPresencas.filter(p => p.status === 'atestado').length,
            matSolicitacoes: solicitacoes.filter(s => s.fiscalId === detailFiscal.id),
        };
    };

    const detail = getDetailData();

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Equipes</h1>
                    <p>Gerencie fiscais e funcionários</p>
                </div>
            </div>

            <div className="tabs">
                <button className={`tab-btn ${tab === 'fiscais' ? 'active' : ''}`} onClick={() => { setTab('fiscais'); setSearch(''); }}>
                    Fiscais ({fiscais.length})
                </button>
                <button className={`tab-btn ${tab === 'funcionarios' ? 'active' : ''}`} onClick={() => { setTab('funcionarios'); setSearch(''); }}>
                    Funcionários ({funcionarios.length})
                </button>
            </div>

            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-bar">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder={`Buscar ${tab === 'fiscais' ? 'fiscal' : 'funcionário'}...`} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="toolbar-right">
                    {tab === 'fiscais' ? (
                        <button className="btn btn-primary" onClick={openAddFiscal}><UserPlus size={16} /> Novo Fiscal</button>
                    ) : (
                        <button className="btn btn-primary" onClick={openAddFunc}><UserPlus size={16} /> Novo Funcionário</button>
                    )}
                </div>
            </div>

            {tab === 'fiscais' && (
                <div className="card">
                    {filteredFiscais.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon"><Users size={28} /></div>
                            <h3>Nenhum fiscal cadastrado</h3>
                            <p>Clique em "Novo Fiscal" para começar.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr><th>Nome</th><th>Matrícula</th><th>Setor</th><th>Usuário</th><th>Funcionários</th><th>Ações</th></tr>
                                </thead>
                                <tbody>
                                    {filteredFiscais.map(f => (
                                        <tr key={f.id}>
                                            <td style={{ fontWeight: 600 }}>{f.nome}</td>
                                            <td>{f.matricula || '—'}</td>
                                            <td>{f.setorId ? <span className="badge badge-purple"><MapPin size={12} /> {getSetorName(f.setorId)}</span> : '—'}</td>
                                            <td><span className="badge badge-info">{f.username}</span></td>
                                            <td>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openFiscalDetail(f)}>
                                                    <Users size={14} /> {getFuncCount(f.id)} funcionário(s)
                                                </button>
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    <button className="btn btn-ghost btn-icon-sm" onClick={() => openEditFiscal(f)}><Pencil size={14} /></button>
                                                    <button className="btn btn-ghost btn-icon-sm" onClick={() => handleDeleteFiscal(f.id)}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === 'funcionarios' && (
                <div className="card">
                    {filteredFuncs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon"><Users size={28} /></div>
                            <h3>Nenhum funcionário cadastrado</h3>
                            <p>Clique em "Novo Funcionário" para cadastrar.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr><th>Nome</th><th>Matrícula</th><th>Cargo</th><th>Telefone</th><th>Fiscal Líder</th><th>Ações</th></tr>
                                </thead>
                                <tbody>
                                    {filteredFuncs.map(f => (
                                        <tr key={f.id}>
                                            <td style={{ fontWeight: 600 }}>{f.nome}</td>
                                            <td>{f.matricula || '—'}</td>
                                            <td>{f.cargoId ? getCargoName(f.cargoId) : (f.cargo || '—')}</td>
                                            <td>{f.telefone || '—'}</td>
                                            <td>
                                                {f.fiscalId ? (
                                                    <span className="badge badge-success"><Link size={12} /> {getFiscalName(f.fiscalId)}</span>
                                                ) : (
                                                    <span className="badge badge-neutral">Não atribuído</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    <button className="btn btn-ghost btn-icon-sm" onClick={() => openEditFunc(f)}><Pencil size={14} /></button>
                                                    <button className="btn btn-ghost btn-icon-sm" onClick={() => handleDeleteFunc(f.id)}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal - Fiscal */}
            <Modal isOpen={modalOpen && formType === 'fiscal'} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Fiscal' : 'Novo Fiscal'}
                footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveFiscal}>Salvar</button></>}>
                <div className="form-group">
                    <label className="form-label">Nome Completo *</label>
                    <input className="form-input" value={fiscalForm.nome} onChange={e => setFiscalForm({ ...fiscalForm, nome: e.target.value })} placeholder="Nome do fiscal" />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Matrícula</label>
                        <input className="form-input" value={fiscalForm.matricula} onChange={e => setFiscalForm({ ...fiscalForm, matricula: e.target.value })} placeholder="Nº da matrícula" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Telefone</label>
                        <input className="form-input" value={fiscalForm.telefone} onChange={e => setFiscalForm({ ...fiscalForm, telefone: e.target.value })} placeholder="(71) 99999-9999" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Setor</label>
                    <select className="form-select" value={fiscalForm.setorId} onChange={e => setFiscalForm({ ...fiscalForm, setorId: e.target.value })}>
                        <option value="">Selecione um setor</option>
                        {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Usuário (Login) *</label>
                        <input className="form-input" value={fiscalForm.username} onChange={e => setFiscalForm({ ...fiscalForm, username: e.target.value })} placeholder="usuario.fiscal" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Senha *</label>
                        <input className="form-input" type="password" value={fiscalForm.password} onChange={e => setFiscalForm({ ...fiscalForm, password: e.target.value })} placeholder="Senha de acesso" />
                    </div>
                </div>
            </Modal>

            {/* Modal - Funcionário */}
            <Modal isOpen={modalOpen && formType === 'funcionario'} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Funcionário' : 'Novo Funcionário'}
                footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveFunc}>Salvar</button></>}>
                <div className="form-group">
                    <label className="form-label">Nome Completo *</label>
                    <input className="form-input" value={funcForm.nome} onChange={e => setFuncForm({ ...funcForm, nome: e.target.value })} placeholder="Nome do funcionário" />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Matrícula</label>
                        <input className="form-input" value={funcForm.matricula} onChange={e => setFuncForm({ ...funcForm, matricula: e.target.value })} placeholder="Nº da matrícula" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Telefone</label>
                        <input className="form-input" value={funcForm.telefone} onChange={e => setFuncForm({ ...funcForm, telefone: e.target.value })} placeholder="(71) 99999-9999" />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Cargo / Função</label>
                        <select className="form-select" value={funcForm.cargoId} onChange={e => setFuncForm({ ...funcForm, cargoId: e.target.value })}>
                            <option value="">Selecione o cargo</option>
                            {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Fiscal Líder</label>
                        <select className="form-select" value={funcForm.fiscalId} onChange={e => setFuncForm({ ...funcForm, fiscalId: e.target.value })}>
                            <option value="">Selecione o fiscal líder</option>
                            {fiscais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                        </select>
                    </div>
                </div>
            </Modal>

            {/* Modal - Detalhes do Fiscal */}
            <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={detailFiscal ? `Equipe de ${detailFiscal.nome}` : 'Detalhes'} large>
                {detailFiscal && (
                    <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10 }}>📋 Resumo de Presença (Geral)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
                            <div className="detail-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-success)' }}>{detail.presentes}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Presenças</div>
                            </div>
                            <div className="detail-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-danger)' }}>{detail.faltasTotal}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Faltas</div>
                            </div>
                            <div className="detail-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-warning)' }}>{detail.suspensos}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Suspensos</div>
                            </div>
                            <div className="detail-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-info)' }}>{detail.atestados}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Atestados</div>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10 }}>📦 Solicitações de Materiais</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
                            <div className="detail-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{detail.matSolicitacoes.length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</div>
                            </div>
                            <div className="detail-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-success)' }}>{detail.matSolicitacoes.filter(s => s.status === 'finalizado').length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Finalizadas</div>
                            </div>
                            <div className="detail-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-warning)' }}>{detail.matSolicitacoes.filter(s => !['finalizado', 'rejeitado_vistoria', 'rejeitado_almox'].includes(s.status)).length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pendentes</div>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10 }}>👥 Funcionários ({detail.funcs.length})</h3>
                        {detail.funcs.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum funcionário vinculado.</p>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead><tr><th>Nome</th><th>Matrícula</th><th>Cargo</th><th>Telefone</th></tr></thead>
                                    <tbody>
                                        {detail.funcs.map(f => (
                                            <tr key={f.id}>
                                                <td style={{ fontWeight: 600 }}>{f.nome}</td>
                                                <td>{f.matricula || '—'}</td>
                                                <td>{f.cargoId ? getCargoName(f.cargoId) : (f.cargo || '—')}</td>
                                                <td>{f.telefone || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
