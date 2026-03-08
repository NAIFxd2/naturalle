import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/UI/Modal';
import { Wrench, Plus, Pencil, Trash2, Search, AlertTriangle, CheckCircle, Settings, Users, Target } from 'lucide-react';

// Status options for roçadeiras
const STATUS_OPTIONS = {
    ativa: { label: 'Ativa (Em uso)', badge: 'badge-success', icon: '✅' },
    conserto: { label: 'Em Conserto', badge: 'badge-warning', icon: '🔧' },
    reserva: { label: 'Reserva', badge: 'badge-info', icon: '📦' },
};

export default function ControleRocadeiras() {
    const { rocadeiras, addRocadeira, updateRocadeira, deleteRocadeira, funcionarios, fiscais, cargos, setores, setMetaRocadeira, getMetaRocadeira } = useData();
    const [tab, setTab] = useState('todas');
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ numeroSerie: '', operadorId: '', status: 'ativa', observacao: '' });
    const [metaModalOpen, setMetaModalOpen] = useState(false);
    const [metaForms, setMetaForms] = useState({});

    // Identify "Operador de Roçadeira" cargo
    const cargoOperador = cargos.find(c => c.nome.toLowerCase().includes('operador de roçadeira') || c.nome.toLowerCase().includes('operador de rocadeira'));
    const operadores = cargoOperador
        ? funcionarios.filter(f => f.cargoId === cargoOperador.id)
        : [];

    // Operadores already assigned to a roçadeira (to avoid duplicates)
    const operadoresComRocadeira = rocadeiras.filter(r => r.operadorId).map(r => r.operadorId);

    const openAdd = () => {
        setEditItem(null);
        setForm({ numeroSerie: '', operadorId: '', status: 'ativa', observacao: '' });
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({
            numeroSerie: item.numeroSerie || '',
            operadorId: item.operadorId || '',
            status: item.status || 'ativa',
            observacao: item.observacao || '',
        });
        setModalOpen(true);
    };

    const save = () => {
        if (!form.numeroSerie.trim()) return;
        if (form.status === 'ativa' && !form.operadorId) {
            alert('Uma roçadeira ativa precisa ter um operador vinculado!');
            return;
        }
        if (editItem) {
            updateRocadeira(editItem.id, form);
        } else {
            addRocadeira(form);
        }
        setModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir esta roçadeira?')) {
            deleteRocadeira(id);
        }
    };

    const getFuncName = (id) => funcionarios.find(f => f.id === id)?.nome || '—';
    const getFiscalForFunc = (funcId) => {
        const func = funcionarios.find(f => f.id === funcId);
        if (!func?.fiscalId) return null;
        return fiscais.find(f => f.id === func.fiscalId);
    };
    const getSetorForFiscal = (fiscalId) => {
        const fiscal = fiscais.find(f => f.id === fiscalId);
        if (!fiscal?.setorId) return null;
        return setores.find(s => s.id === fiscal.setorId);
    };

    // Filter
    const filtered = useMemo(() => {
        let list = rocadeiras;
        if (tab === 'ativas') list = rocadeiras.filter(r => r.status === 'ativa');
        if (tab === 'conserto') list = rocadeiras.filter(r => r.status === 'conserto');
        if (tab === 'reserva') list = rocadeiras.filter(r => r.status === 'reserva');
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(r =>
                r.numeroSerie.toLowerCase().includes(q) ||
                getFuncName(r.operadorId).toLowerCase().includes(q)
            );
        }
        return list;
    }, [rocadeiras, tab, search, funcionarios]);

    // KPIs
    const totalAtivas = rocadeiras.filter(r => r.status === 'ativa').length;
    const totalConserto = rocadeiras.filter(r => r.status === 'conserto').length;
    const totalReserva = rocadeiras.filter(r => r.status === 'reserva').length;

    // Available operators for assignment (not yet assigned, or the current one being edited)
    const availableOperadores = operadores.filter(op =>
        !operadoresComRocadeira.includes(op.id) || (editItem && editItem.operadorId === op.id)
    );

    // ===== BREAKDOWN POR SETOR =====
    const resumoPorSetor = useMemo(() => {
        return setores.map(setor => {
            const fiscaisDoSetor = fiscais.filter(f => f.setorId === setor.id);
            const fiscalIds = fiscaisDoSetor.map(f => f.id);
            const funcsDoSetor = funcionarios.filter(f => fiscalIds.includes(f.fiscalId));
            const funcIds = funcsDoSetor.map(f => f.id);
            const rocsDoSetor = rocadeiras.filter(r => funcIds.includes(r.operadorId));
            return {
                setor,
                ativas: rocsDoSetor.filter(r => r.status === 'ativa').length,
                conserto: rocsDoSetor.filter(r => r.status === 'conserto').length,
                reserva: rocsDoSetor.filter(r => r.status === 'reserva').length,
                total: rocsDoSetor.length,
            };
        }).filter(r => r.total > 0);
    }, [setores, fiscais, funcionarios, rocadeiras]);

    // ===== BREAKDOWN POR FISCAL =====
    const resumoPorFiscal = useMemo(() => {
        return fiscais.map(fiscal => {
            const funcsDoFiscal = funcionarios.filter(f => f.fiscalId === fiscal.id);
            const funcIds = funcsDoFiscal.map(f => f.id);
            const rocsDoFiscal = rocadeiras.filter(r => funcIds.includes(r.operadorId));
            const setor = fiscal.setorId ? setores.find(s => s.id === fiscal.setorId) : null;
            return {
                fiscal,
                setor,
                ativas: rocsDoFiscal.filter(r => r.status === 'ativa').length,
                conserto: rocsDoFiscal.filter(r => r.status === 'conserto').length,
                reserva: rocsDoFiscal.filter(r => r.status === 'reserva').length,
                total: rocsDoFiscal.length,
            };
        }).filter(r => r.total > 0);
    }, [fiscais, funcionarios, rocadeiras, setores]);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Controle de Roçadeiras</h1>
                    <p>Gerencie roçadeiras, operadores, consertos e reservas</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" onClick={() => {
                        const initial = {};
                        setores.forEach(s => { initial[s.id] = getMetaRocadeira(s.id).toString(); });
                        setMetaForms(initial);
                        setMetaModalOpen(true);
                    }}><Target size={16} /> Definir Metas</button>
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Nova Roçadeira</button>
                </div>
            </div>

            {!cargoOperador && (
                <div style={{
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    color: '#f59e0b',
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 16,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    <AlertTriangle size={16} />
                    <span>Para vincular operadores, crie um cargo chamado <strong>"Operador de Roçadeira"</strong> na área de <strong>Cargos / Funções</strong> e atribua esse cargo aos funcionários.</span>
                </div>
            )}

            {/* KPIs */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                    <div className="stat-icon green"><Wrench size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{rocadeiras.length}</div>
                        <div className="stat-label">Total de Roçadeiras</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><CheckCircle size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalAtivas}</div>
                        <div className="stat-label">Ativas (Em Uso)</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow"><Settings size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalConserto}</div>
                        <div className="stat-label">Em Conserto</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><Users size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalReserva}</div>
                        <div className="stat-label">Reservas</div>
                    </div>
                </div>
            </div>

            {/* ===== META POR SETOR ===== */}
            {setores.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header"><h3 className="card-title">🎯 Meta de Roçadeiras por Setor</h3></div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Setor</th>
                                    <th>Meta</th>
                                    <th>Ativas</th>
                                    <th>Conserto</th>
                                    <th>Reserva em Uso</th>
                                    <th>Faltam</th>
                                    <th>Progresso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {setores.map(setor => {
                                    const meta = getMetaRocadeira(setor.id);
                                    if (meta === 0) return null;
                                    const fiscaisDoSetor = fiscais.filter(f => f.setorId === setor.id);
                                    const fiscalIds = fiscaisDoSetor.map(f => f.id);
                                    const funcsDoSetor = funcionarios.filter(f => fiscalIds.includes(f.fiscalId));
                                    const funcIds = funcsDoSetor.map(f => f.id);
                                    const rocsDoSetor = rocadeiras.filter(r => funcIds.includes(r.operadorId));
                                    const ativas = rocsDoSetor.filter(r => r.status === 'ativa').length;
                                    const conserto = rocsDoSetor.filter(r => r.status === 'conserto').length;
                                    const reserva = rocsDoSetor.filter(r => r.status === 'reserva').length;
                                    const faltam = Math.max(0, meta - ativas);
                                    const pct = meta > 0 ? Math.min(100, Math.round((ativas / meta) * 100)) : 0;
                                    return (
                                        <tr key={setor.id}>
                                            <td style={{ fontWeight: 600 }}>{setor.nome}</td>
                                            <td><span className="badge badge-neutral">{meta}</span></td>
                                            <td><span className="badge badge-success">{ativas}</span></td>
                                            <td><span className={`badge ${conserto > 0 ? 'badge-warning' : 'badge-neutral'}`}>{conserto}</span></td>
                                            <td><span className={`badge ${reserva > 0 ? 'badge-info' : 'badge-neutral'}`}>{reserva}</span></td>
                                            <td>
                                                {faltam > 0 ? (
                                                    <span className="badge badge-danger">⚠ Falta {faltam}</span>
                                                ) : (
                                                    <span className="badge badge-success">✅ Completo</span>
                                                )}
                                            </td>
                                            <td style={{ minWidth: 120 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${pct}%`,
                                                            height: '100%',
                                                            background: pct >= 100 ? 'var(--accent-success)' : pct >= 70 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                                                            borderRadius: 4,
                                                            transition: 'width 0.3s ease',
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pct >= 100 ? 'var(--accent-success)' : 'var(--text-muted)' }}>{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== INDICADORES POR SETOR ===== */}
            {resumoPorSetor.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header"><h3 className="card-title">📍 Indicadores por Setor</h3></div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Setor</th>
                                    <th>Total</th>
                                    <th>✅ Ativas</th>
                                    <th>🔧 Conserto</th>
                                    <th>📦 Reserva</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resumoPorSetor.map(r => (
                                    <tr key={r.setor.id}>
                                        <td style={{ fontWeight: 600 }}>{r.setor.nome}</td>
                                        <td><span className="badge badge-neutral">{r.total}</span></td>
                                        <td><span className="badge badge-success">{r.ativas}</span></td>
                                        <td><span className={`badge ${r.conserto > 0 ? 'badge-warning' : 'badge-neutral'}`}>{r.conserto}</span></td>
                                        <td><span className={`badge ${r.reserva > 0 ? 'badge-info' : 'badge-neutral'}`}>{r.reserva}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== INDICADORES POR FISCAL ===== */}
            {resumoPorFiscal.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header"><h3 className="card-title">👤 Indicadores por Fiscal</h3></div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Fiscal</th>
                                    <th>Setor</th>
                                    <th>Total</th>
                                    <th>✅ Ativas</th>
                                    <th>🔧 Conserto</th>
                                    <th>📦 Reserva</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resumoPorFiscal.map(r => (
                                    <tr key={r.fiscal.id}>
                                        <td style={{ fontWeight: 600 }}>{r.fiscal.nome}</td>
                                        <td>{r.setor ? <span className="badge badge-purple">{r.setor.nome}</span> : '—'}</td>
                                        <td><span className="badge badge-neutral">{r.total}</span></td>
                                        <td><span className="badge badge-success">{r.ativas}</span></td>
                                        <td><span className={`badge ${r.conserto > 0 ? 'badge-warning' : 'badge-neutral'}`}>{r.conserto}</span></td>
                                        <td><span className={`badge ${r.reserva > 0 ? 'badge-info' : 'badge-neutral'}`}>{r.reserva}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab-btn ${tab === 'todas' ? 'active' : ''}`} onClick={() => setTab('todas')}>
                    Todas ({rocadeiras.length})
                </button>
                <button className={`tab-btn ${tab === 'ativas' ? 'active' : ''}`} onClick={() => setTab('ativas')}>
                    Ativas ({totalAtivas})
                </button>
                <button className={`tab-btn ${tab === 'conserto' ? 'active' : ''}`} onClick={() => setTab('conserto')}>
                    Em Conserto ({totalConserto})
                </button>
                <button className={`tab-btn ${tab === 'reserva' ? 'active' : ''}`} onClick={() => setTab('reserva')}>
                    Reservas ({totalReserva})
                </button>
            </div>

            {/* Search */}
            <div className="toolbar" style={{ marginBottom: 16 }}>
                <div className="toolbar-left">
                    <div className="search-bar">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder="Buscar por nº de série ou operador..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><Wrench size={28} /></div>
                        <h3>Nenhuma roçadeira encontrada</h3>
                        <p>{tab === 'todas' ? 'Cadastre uma roçadeira para começar.' : 'Nenhuma roçadeira nesta categoria.'}</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nº de Série</th>
                                    <th>Status</th>
                                    <th>Operador</th>
                                    <th>Fiscal</th>
                                    <th>Setor</th>
                                    <th>Observação</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => {
                                    const fiscal = getFiscalForFunc(r.operadorId);
                                    const setor = fiscal ? getSetorForFiscal(fiscal.id) : null;
                                    const statusInfo = STATUS_OPTIONS[r.status] || STATUS_OPTIONS.ativa;
                                    return (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.9rem' }}>{r.numeroSerie}</td>
                                            <td>
                                                <span className={`badge ${statusInfo.badge}`}>{statusInfo.icon} {statusInfo.label}</span>
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{r.operadorId ? getFuncName(r.operadorId) : <span style={{ color: 'var(--text-muted)' }}>Sem operador</span>}</td>
                                            <td>{fiscal ? fiscal.nome : '—'}</td>
                                            <td>{setor ? <span className="badge badge-purple">{setor.nome}</span> : '—'}</td>
                                            <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.observacao || '—'}</td>
                                            <td>
                                                <div className="btn-group">
                                                    <button className="btn btn-ghost btn-icon-sm" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                                                    <button className="btn btn-ghost btn-icon-sm" onClick={() => handleDelete(r.id)}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editItem ? 'Editar Roçadeira' : 'Nova Roçadeira'}
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={save}>Salvar</button>
                    </>
                }
            >
                <div className="form-group">
                    <label className="form-label">Número de Série *</label>
                    <input className="form-input" value={form.numeroSerie} onChange={e => setForm({ ...form, numeroSerie: e.target.value })} placeholder="Ex: RC-2024-001" />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                            <option value="ativa">Ativa (Em uso)</option>
                            <option value="conserto">Em Conserto</option>
                            <option value="reserva">Reserva</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Operador</label>
                        <select className="form-select" value={form.operadorId} onChange={e => setForm({ ...form, operadorId: e.target.value })}>
                            <option value="">Sem operador</option>
                            {availableOperadores.map(op => (
                                <option key={op.id} value={op.id}>{op.nome}</option>
                            ))}
                        </select>
                        {!cargoOperador && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                                ⚠ Crie o cargo "Operador de Roçadeira" e atribua aos funcionários.
                            </span>
                        )}
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Observação</label>
                    <textarea className="form-textarea" value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} placeholder="Motivo do conserto, detalhes da reserva, etc." />
                </div>
            </Modal>

            {/* Modal - Definir Metas */}
            <Modal
                isOpen={metaModalOpen}
                onClose={() => setMetaModalOpen(false)}
                title="Definir Meta de Roçadeiras por Setor"
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setMetaModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={() => {
                            Object.entries(metaForms).forEach(([setorId, val]) => {
                                setMetaRocadeira(setorId, parseInt(val) || 0);
                            });
                            setMetaModalOpen(false);
                        }}>Salvar Metas</button>
                    </>
                }
            >
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
                    Defina quantas roçadeiras ativas cada setor deve ter para cumprir a meta.
                </p>
                {setores.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Nenhum setor cadastrado.</p>
                ) : (
                    setores.map(s => (
                        <div className="form-group" key={s.id}>
                            <label className="form-label">{s.nome}</label>
                            <input
                                className="form-input"
                                type="number"
                                min="0"
                                value={metaForms[s.id] || ''}
                                onChange={e => setMetaForms({ ...metaForms, [s.id]: e.target.value })}
                                placeholder="Ex: 10"
                            />
                        </div>
                    ))
                )}
            </Modal>
        </div>
    );
}
