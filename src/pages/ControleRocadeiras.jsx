import { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/UI/Modal';
import { Wrench, Plus, Pencil, Trash2, Search, AlertTriangle, CheckCircle, Settings, Users, Target, Package, RotateCcw, Link, Unlink, ChevronDown } from 'lucide-react';

// Searchable select dropdown component
function SearchableSelect({ options, value, onChange, placeholder = 'Selecione...' }) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    const selected = options.find(o => o.value === value);

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <div
                className="form-input"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}
                onClick={() => { setOpen(o => !o); setSearch(''); }}
            >
                <span style={{ color: selected ? 'inherit' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }} />
            </div>
            {open && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                    marginTop: 4,
                    overflow: 'hidden',
                }}>
                    <div style={{ padding: '8px 8px 4px' }}>
                        <input
                            autoFocus
                            className="form-input"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            placeholder="Digite para buscar..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Nenhum resultado
                            </div>
                        ) : filtered.map(o => (
                            <div
                                key={o.value}
                                style={{
                                    padding: '9px 12px',
                                    cursor: 'pointer',
                                    fontSize: '0.88rem',
                                    background: o.value === value ? 'var(--accent-primary-bg)' : 'transparent',
                                    color: o.value === value ? 'var(--accent-primary)' : 'inherit',
                                    transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                                onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = 'transparent'; }}
                                onMouseDown={e => {
                                    e.preventDefault();
                                    onChange(o.value);
                                    setOpen(false);
                                    setSearch('');
                                }}
                            >
                                {o.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Derive display status from the rocadeira record
const getDisplayStatus = (r) => {
    if (r.tipo === 'reserva') {
        if (r.status === 'conserto') return 'reserva_conserto';
        if (r.operadorId) return 'em_uso';
        return 'disponivel';
    }
    return r.status || 'ativa';
};

const STATUS_OPTIONS = {
    ativa:           { label: 'Ativa (Em uso)',        badge: 'badge-success', icon: '✅' },
    conserto:        { label: 'Em Conserto',            badge: 'badge-warning', icon: '🔧' },
    disponivel:      { label: 'Reserva Disponível',    badge: 'badge-info',    icon: '📦' },
    em_uso:          { label: 'Reserva em Uso',         badge: 'badge-purple',  icon: '🔄' },
    reserva_conserto:{ label: 'Reserva em Conserto',   badge: 'badge-danger',  icon: '⚠' },
};

export default function ControleRocadeiras() {
    const {
        rocadeiras, addRocadeira, updateRocadeira, deleteRocadeira,
        funcionarios, fiscais, cargos, setores,
        setMetaRocadeira, getMetaRocadeira,
    } = useData();

    const [tab, setTab] = useState('todas');
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({
        tipo: 'operador',
        numeroSerie: '',
        modelo: '',
        operadorId: '',
        status: 'ativa',
        observacao: '',
    });
    const [metaModalOpen, setMetaModalOpen] = useState(false);
    const [metaForms, setMetaForms] = useState({});

    // State for "Atribuir Reserva" mini-modal (pick operator for a reserve machine)
    const [atribuirModal, setAtribuirModal] = useState(null); // the reserve rocadeira object
    const [atribuirOperadorId, setAtribuirOperadorId] = useState('');

    // State for "Atribuir Reserva PARA Operador" (pick reserve for an operator)
    const [atribuirParaOperador, setAtribuirParaOperador] = useState(null); // { func, roc }
    const [reservaParaAtribuirId, setReservaParaAtribuirId] = useState('');

    // Expanded state for fiscal panels
    const [fiscalExpanded, setFiscalExpanded] = useState({});

    // Identify "Operador de Roçadeira" cargo
    const cargoOperador = cargos.find(c =>
        c.nome.toLowerCase().includes('operador de roçadeira') ||
        c.nome.toLowerCase().includes('operador de rocadeira')
    );
    const operadores = cargoOperador
        ? funcionarios.filter(f => f.cargoId === cargoOperador.id)
        : [];

    // Split machines by tipo (records without tipo default to 'operador')
    const rocadeirasProprias = useMemo(
        () => rocadeiras.filter(r => !r.tipo || r.tipo === 'operador'),
        [rocadeiras]
    );
    const rocadeirasReserva = useMemo(
        () => rocadeiras.filter(r => r.tipo === 'reserva'),
        [rocadeiras]
    );

    // Operators already owning a machine (to avoid double-assigning)
    const operadoresComMaquinaPropria = rocadeirasProprias
        .filter(r => r.operadorId)
        .map(r => r.operadorId);

    // Operators already receiving a reserve (to avoid assigning two reserves)
    const operadoresComReserva = rocadeirasReserva
        .filter(r => r.operadorId)
        .map(r => r.operadorId);

    // Operators whose machine is in conserto (candidates to receive a reserve)
    const operadoresEmConserto = rocadeirasProprias
        .filter(r => r.status === 'conserto' && r.operadorId)
        .map(r => r.operadorId);

    // --- Modal helpers ---
    const openAdd = (tipo = 'operador') => {
        setEditItem(null);
        setForm({
            tipo,
            numeroSerie: '',
            modelo: '',
            operadorId: '',
            status: tipo === 'reserva' ? 'disponivel' : 'ativa',
            observacao: '',
        });
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({
            tipo: item.tipo || 'operador',
            numeroSerie: item.numeroSerie || '',
            modelo: item.modelo || '',
            operadorId: item.operadorId || '',
            status: item.status || 'ativa',
            observacao: item.observacao || '',
        });
        setModalOpen(true);
    };

    const save = () => {
        if (form.tipo === 'operador') {
            if (!form.operadorId) {
                alert('Uma máquina de operador precisa ter um operador vinculado!');
                return;
            }
        } else {
            if (!form.numeroSerie.trim()) {
                alert('Informe um identificador para a máquina reserva (ex: RES-01, 373984543)');
                return;
            }
        }

        const data = { ...form };
        // Ensure reserve machines don't carry 'ativa' status
        if (data.tipo === 'reserva' && data.status === 'ativa') {
            data.status = 'disponivel';
        }
        // When editing and changing tipo to reserva, clear operadorId assignment
        if (data.tipo === 'reserva' && editItem?.tipo !== 'reserva') {
            data.operadorId = '';
            data.status = 'disponivel';
        }

        if (editItem) {
            updateRocadeira(editItem.id, data);
        } else {
            addRocadeira(data);
        }
        setModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir esta roçadeira?')) {
            deleteRocadeira(id);
        }
    };

    // Atribuir reserva a operador
    const openAtribuir = (reserva) => {
        setAtribuirModal(reserva);
        setAtribuirOperadorId('');
    };

    const handleAtribuir = () => {
        if (!atribuirOperadorId || !atribuirModal) return;
        updateRocadeira(atribuirModal.id, { operadorId: atribuirOperadorId, status: 'em_uso' });
        setAtribuirModal(null);
        setAtribuirOperadorId('');
    };

    // Liberar reserva (devolver ao pool)
    const handleLiberar = (r) => {
        const nome = getFuncName(r.operadorId);
        if (confirm(`Liberar máquina "${r.numeroSerie || 'Reserva'}" de ${nome}? Ela voltará ao pool de reservas.`)) {
            updateRocadeira(r.id, { operadorId: '', status: 'disponivel' });
        }
    };

    // Atribuir reserva PARA um operador específico (fluxo da visão por fiscal)
    const handleAtribuirParaOperador = () => {
        if (!reservaParaAtribuirId || !atribuirParaOperador) return;
        updateRocadeira(reservaParaAtribuirId, { operadorId: atribuirParaOperador.func.id, status: 'em_uso' });
        setAtribuirParaOperador(null);
        setReservaParaAtribuirId('');
    };

    const toggleFiscal = (fiscalId) =>
        setFiscalExpanded(p => ({ ...p, [fiscalId]: !p[fiscalId] }));

    // Helper lookups
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

    // --- Filtered list ---
    const filtered = useMemo(() => {
        let list;
        if (tab === 'ativas')   list = rocadeirasProprias.filter(r => r.status === 'ativa');
        else if (tab === 'conserto') list = rocadeirasProprias.filter(r => r.status === 'conserto');
        else if (tab === 'reservas') list = rocadeirasReserva;
        else list = rocadeiras;

        if (search) {
            const q = search.toLowerCase();
            list = list.filter(r =>
                (r.numeroSerie || '').toLowerCase().includes(q) ||
                (r.modelo || '').toLowerCase().includes(q) ||
                getFuncName(r.operadorId).toLowerCase().includes(q)
            );
        }
        return list;
    }, [rocadeiras, rocadeirasProprias, rocadeirasReserva, tab, search, funcionarios]);

    // --- KPIs ---
    const totalAtivas    = rocadeirasProprias.filter(r => r.status === 'ativa').length;
    const totalConserto  = rocadeirasProprias.filter(r => r.status === 'conserto').length;
    const totalDisponivel = rocadeirasReserva.filter(r => !r.operadorId && r.status !== 'conserto').length;
    const totalEmUso     = rocadeirasReserva.filter(r => r.operadorId).length;

    // Available operators for "own machine" modal (not yet assigned, or the current one)
    const availableOperadores = operadores.filter(op =>
        !operadoresComMaquinaPropria.includes(op.id) ||
        (editItem && (editItem.tipo !== 'reserva') && editItem.operadorId === op.id)
    );

    // --- Breakdown por setor (apenas máquinas de operador) ---
    const resumoPorSetor = useMemo(() => {
        return setores.map(setor => {
            const fiscaisDoSetor = fiscais.filter(f => f.setorId === setor.id);
            const fiscalIds = fiscaisDoSetor.map(f => f.id);
            const funcsDoSetor = funcionarios.filter(f => fiscalIds.includes(f.fiscalId));
            const funcIds = funcsDoSetor.map(f => f.id);
            const rocsDoSetor = rocadeirasProprias.filter(r => funcIds.includes(r.operadorId));
            return {
                setor,
                ativas:   rocsDoSetor.filter(r => r.status === 'ativa').length,
                conserto: rocsDoSetor.filter(r => r.status === 'conserto').length,
                total:    rocsDoSetor.length,
            };
        }).filter(r => r.total > 0);
    }, [setores, fiscais, funcionarios, rocadeirasProprias]);

    // --- Breakdown por fiscal (apenas máquinas de operador) ---
    const resumoPorFiscal = useMemo(() => {
        return fiscais.map(fiscal => {
            const funcsDoFiscal = funcionarios.filter(f => f.fiscalId === fiscal.id);
            const funcIds = funcsDoFiscal.map(f => f.id);
            const rocsDoFiscal = rocadeirasProprias.filter(r => funcIds.includes(r.operadorId));
            const setor = fiscal.setorId ? setores.find(s => s.id === fiscal.setorId) : null;
            return {
                fiscal, setor,
                ativas:   rocsDoFiscal.filter(r => r.status === 'ativa').length,
                conserto: rocsDoFiscal.filter(r => r.status === 'conserto').length,
                total:    rocsDoFiscal.length,
            };
        }).filter(r => r.total > 0);
    }, [fiscais, funcionarios, rocadeirasProprias, setores]);

    // Find which reserve (if any) is assigned to a given operator
    const getReservaDoOperador = (operadorId) =>
        rocadeirasReserva.find(r => r.operadorId === operadorId) || null;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Controle de Roçadeiras</h1>
                    <p>Gerencie roçadeiras dos operadores e máquinas reserva</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" onClick={() => {
                        const initial = {};
                        setores.forEach(s => { initial[s.id] = getMetaRocadeira(s.id).toString(); });
                        setMetaForms(initial);
                        setMetaModalOpen(true);
                    }}><Target size={16} /> Definir Metas</button>
                    <button className="btn btn-ghost" onClick={() => openAdd('reserva')}>
                        <Package size={16} /> Nova Reserva
                    </button>
                    <button className="btn btn-primary" onClick={() => openAdd('operador')}>
                        <Plus size={16} /> Nova Roçadeira
                    </button>
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
                    <div className="stat-icon green"><CheckCircle size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalAtivas}</div>
                        <div className="stat-label">Operadores Ativos</div>
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
                    <div className="stat-icon blue"><Package size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalDisponivel}</div>
                        <div className="stat-label">Reservas Disponíveis</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><RotateCcw size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalEmUso}</div>
                        <div className="stat-label">Reservas em Uso</div>
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
                                    const rocsDoSetor = rocadeirasProprias.filter(r => funcIds.includes(r.operadorId));
                                    const ativas = rocsDoSetor.filter(r => r.status === 'ativa').length;
                                    const conserto = rocsDoSetor.filter(r => r.status === 'conserto').length;
                                    const faltam = Math.max(0, meta - ativas);
                                    const pct = meta > 0 ? Math.min(100, Math.round((ativas / meta) * 100)) : 0;
                                    return (
                                        <tr key={setor.id}>
                                            <td style={{ fontWeight: 600 }}>{setor.nome}</td>
                                            <td><span className="badge badge-neutral">{meta}</span></td>
                                            <td><span className="badge badge-success">{ativas}</span></td>
                                            <td><span className={`badge ${conserto > 0 ? 'badge-warning' : 'badge-neutral'}`}>{conserto}</span></td>
                                            <td>
                                                {faltam > 0
                                                    ? <span className="badge badge-danger">⚠ Falta {faltam}</span>
                                                    : <span className="badge badge-success">✅ Completo</span>
                                                }
                                            </td>
                                            <td style={{ minWidth: 120 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${pct}%`, height: '100%',
                                                            background: pct >= 100 ? 'var(--accent-success)' : pct >= 70 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                                                            borderRadius: 4, transition: 'width 0.3s ease',
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
                                </tr>
                            </thead>
                            <tbody>
                                {resumoPorSetor.map(r => (
                                    <tr key={r.setor.id}>
                                        <td style={{ fontWeight: 600 }}>{r.setor.nome}</td>
                                        <td><span className="badge badge-neutral">{r.total}</span></td>
                                        <td><span className="badge badge-success">{r.ativas}</span></td>
                                        <td><span className={`badge ${r.conserto > 0 ? 'badge-warning' : 'badge-neutral'}`}>{r.conserto}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== CONTROLE POR FISCAL ===== */}
            {fiscais.some(f => operadores.some(op => op.fiscalId === f.id)) && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header">
                        <h3 className="card-title">👤 Controle por Fiscal</h3>
                        <button
                            className="btn btn-ghost"
                            style={{ fontSize: '0.8rem' }}
                            onClick={() => {
                                const allIds = fiscais.filter(f => operadores.some(op => op.fiscalId === f.id)).map(f => f.id);
                                const anyOpen = allIds.some(id => fiscalExpanded[id]);
                                const next = {};
                                allIds.forEach(id => { next[id] = !anyOpen; });
                                setFiscalExpanded(next);
                            }}
                        >
                            {fiscais.filter(f => operadores.some(op => op.fiscalId === f.id)).some(f => fiscalExpanded[f.id])
                                ? 'Recolher todos' : 'Expandir todos'}
                        </button>
                    </div>

                    {fiscais.map(fiscal => {
                        const funcsDoFiscal = operadores.filter(op => op.fiscalId === fiscal.id);
                        if (funcsDoFiscal.length === 0) return null;

                        const setor = fiscal.setorId ? setores.find(s => s.id === fiscal.setorId) : null;
                        const isExpanded = !!fiscalExpanded[fiscal.id];

                        const rows = funcsDoFiscal.map(func => ({
                            func,
                            roc: rocadeirasProprias.find(r => r.operadorId === func.id) || null,
                            reserva: rocadeirasReserva.find(r => r.operadorId === func.id) || null,
                        }));

                        const nAtivas   = rows.filter(r => r.roc?.status === 'ativa').length;
                        const nConserto = rows.filter(r => r.roc?.status === 'conserto').length;
                        const nSemMaq   = rows.filter(r => !r.roc).length;

                        return (
                            <div key={fiscal.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                                {/* Header da linha do fiscal — clicável */}
                                <div
                                    style={{
                                        padding: '11px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => toggleFiscal(fiscal.id)}
                                >
                                    <ChevronDown
                                        size={16}
                                        style={{
                                            color: 'var(--text-muted)',
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <span style={{ fontWeight: 600, flex: 1 }}>{fiscal.nome}</span>
                                    {setor && <span className="badge badge-purple">{setor.nome}</span>}
                                    <span className="badge badge-neutral">{funcsDoFiscal.length} op.</span>
                                    {nAtivas > 0 && <span className="badge badge-success">✅ {nAtivas} ativas</span>}
                                    {nConserto > 0 && <span className="badge badge-warning">🔧 {nConserto} conserto</span>}
                                    {nSemMaq > 0 && <span className="badge badge-neutral" style={{ opacity: 0.7 }}>⏳ {nSemMaq} pendente</span>}
                                </div>

                                {/* Tabela expandida de operadores */}
                                {isExpanded && (
                                    <div style={{ padding: '0 16px 16px 40px' }}>
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Operador</th>
                                                    <th>Nº Máquina</th>
                                                    <th>Modelo</th>
                                                    <th>Status</th>
                                                    <th>Máquina Reserva</th>
                                                    <th>Ações Rápidas</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map(({ func, roc, reserva }) => (
                                                    <tr key={func.id}>
                                                        <td style={{ fontWeight: 500 }}>{func.nome}</td>
                                                        <td style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}>
                                                            {roc?.numeroSerie
                                                                ? roc.numeroSerie
                                                                : <span style={{ color: 'var(--text-muted)', fontFamily: 'inherit', fontStyle: 'italic' }}>Pendente</span>
                                                            }
                                                        </td>
                                                        <td>{roc?.modelo || '—'}</td>
                                                        <td>
                                                            {!roc
                                                                ? <span className="badge badge-neutral">Sem máquina</span>
                                                                : roc.status === 'ativa'
                                                                    ? <span className="badge badge-success">✅ Ativa</span>
                                                                    : <span className="badge badge-warning">🔧 Conserto</span>
                                                            }
                                                        </td>
                                                        <td>
                                                            {reserva
                                                                ? <span className="badge badge-purple">
                                                                    {reserva.numeroSerie || 'Reserva'}
                                                                    {reserva.modelo ? ` (${reserva.modelo})` : ''}
                                                                  </span>
                                                                : roc?.status === 'conserto'
                                                                    ? <span style={{ color: 'var(--accent-warning)', fontSize: '0.8rem' }}>Sem reserva</span>
                                                                    : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                                            }
                                                        </td>
                                                        <td>
                                                            <div className="btn-group">
                                                                {/* Enviar para conserto */}
                                                                {roc && roc.status === 'ativa' && (
                                                                    <button
                                                                        className="btn btn-ghost btn-icon-sm"
                                                                        title="Enviar para conserto"
                                                                        onClick={() => updateRocadeira(roc.id, { status: 'conserto' })}
                                                                    >
                                                                        <Settings size={14} />
                                                                    </button>
                                                                )}
                                                                {/* Voltar do conserto */}
                                                                {roc && roc.status === 'conserto' && (
                                                                    <button
                                                                        className="btn btn-ghost btn-icon-sm"
                                                                        title="Máquina voltou do conserto"
                                                                        onClick={() => updateRocadeira(roc.id, { status: 'ativa' })}
                                                                    >
                                                                        <CheckCircle size={14} />
                                                                    </button>
                                                                )}
                                                                {/* Atribuir reserva ao operador */}
                                                                {roc && roc.status === 'conserto' && !reserva && totalDisponivel > 0 && (
                                                                    <button
                                                                        className="btn btn-ghost btn-icon-sm"
                                                                        title="Atribuir máquina reserva"
                                                                        onClick={() => {
                                                                            setAtribuirParaOperador({ func, roc });
                                                                            setReservaParaAtribuirId('');
                                                                        }}
                                                                    >
                                                                        <Link size={14} />
                                                                    </button>
                                                                )}
                                                                {/* Liberar reserva */}
                                                                {reserva && (
                                                                    <button
                                                                        className="btn btn-ghost btn-icon-sm"
                                                                        title="Liberar máquina reserva"
                                                                        onClick={() => handleLiberar(reserva)}
                                                                    >
                                                                        <Unlink size={14} />
                                                                    </button>
                                                                )}
                                                                {/* Editar ou adicionar máquina */}
                                                                {roc
                                                                    ? <button className="btn btn-ghost btn-icon-sm" title="Editar máquina" onClick={() => openEdit(roc)}><Pencil size={14} /></button>
                                                                    : <button
                                                                        className="btn btn-ghost btn-icon-sm"
                                                                        title="Adicionar máquina"
                                                                        onClick={() => {
                                                                            setEditItem(null);
                                                                            setForm({ tipo: 'operador', numeroSerie: '', modelo: '', operadorId: func.id, status: 'ativa', observacao: '' });
                                                                            setModalOpen(true);
                                                                        }}
                                                                      >
                                                                        <Plus size={14} />
                                                                      </button>
                                                                }
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
                <button className={`tab-btn ${tab === 'reservas' ? 'active' : ''}`} onClick={() => setTab('reservas')}>
                    Reservas ({rocadeirasReserva.length})
                </button>
            </div>

            {/* Search */}
            <div className="toolbar" style={{ marginBottom: 16 }}>
                <div className="toolbar-left">
                    <div className="search-bar">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por identificador, modelo ou operador..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* ===== ALERT: operadores em conserto sem reserva ===== */}
            {operadoresEmConserto.length > 0 && (
                <div style={{
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 16px',
                    marginBottom: 12,
                    fontSize: '0.83rem',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                }}>
                    <AlertTriangle size={15} />
                    <strong>Máquinas em conserto:</strong>
                    {operadoresEmConserto.map(opId => {
                        const temReserva = operadoresComReserva.includes(opId);
                        return (
                            <span key={opId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <span className={`badge ${temReserva ? 'badge-success' : 'badge-warning'}`}>
                                    {getFuncName(opId)} {temReserva ? '(com reserva)' : '(sem reserva)'}
                                </span>
                            </span>
                        );
                    })}
                    {totalDisponivel > 0 && operadoresEmConserto.some(id => !operadoresComReserva.includes(id)) && (
                        <span style={{ color: 'var(--text-secondary)' }}>
                            — {totalDisponivel} reserva(s) disponível(is) para atribuir
                        </span>
                    )}
                </div>
            )}

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
                                    <th>Tipo</th>
                                    <th>Identificador</th>
                                    <th>Modelo</th>
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
                                    const isReserva = r.tipo === 'reserva';
                                    const displayStatus = getDisplayStatus(r);
                                    const statusInfo = STATUS_OPTIONS[displayStatus] || STATUS_OPTIONS.ativa;
                                    const fiscal = getFiscalForFunc(r.operadorId);
                                    const setor = fiscal ? getSetorForFiscal(fiscal.id) : null;
                                    const reservaDoOp = !isReserva ? getReservaDoOperador(r.operadorId) : null;

                                    return (
                                        <tr key={r.id} style={isReserva ? { background: 'rgba(99,102,241,0.04)' } : {}}>
                                            <td>
                                                {isReserva
                                                    ? <span className="badge badge-purple">📦 Reserva</span>
                                                    : <span className="badge badge-neutral">👷 Operador</span>
                                                }
                                            </td>
                                            <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                                {r.numeroSerie || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'inherit' }}>Pendente</span>}
                                            </td>
                                            <td>{r.modelo ? <span className="badge badge-neutral">{r.modelo}</span> : '—'}</td>
                                            <td>
                                                <span className={`badge ${statusInfo.badge}`}>
                                                    {statusInfo.icon} {statusInfo.label}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 500 }}>
                                                {isReserva ? (
                                                    r.operadorId
                                                        ? <span style={{ color: 'var(--accent-warning)' }}>Emprestada a: {getFuncName(r.operadorId)}</span>
                                                        : <span style={{ color: 'var(--text-muted)' }}>Disponível</span>
                                                ) : (
                                                    r.operadorId
                                                        ? <>
                                                            {getFuncName(r.operadorId)}
                                                            {reservaDoOp && (
                                                                <span style={{ marginLeft: 6, fontSize: '0.75rem' }} className="badge badge-purple">
                                                                    reserva: {reservaDoOp.numeroSerie || 'sem ID'}
                                                                </span>
                                                            )}
                                                          </>
                                                        : <span style={{ color: 'var(--text-muted)' }}>Sem operador</span>
                                                )}
                                            </td>
                                            <td>{fiscal ? fiscal.nome : '—'}</td>
                                            <td>{setor ? <span className="badge badge-purple">{setor.nome}</span> : '—'}</td>
                                            <td style={{ color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {r.observacao || '—'}
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    {/* Reserve-specific actions */}
                                                    {isReserva && !r.operadorId && r.status !== 'conserto' && (
                                                        <button
                                                            className="btn btn-ghost btn-icon-sm"
                                                            title="Atribuir a operador"
                                                            onClick={() => openAtribuir(r)}
                                                        >
                                                            <Link size={14} />
                                                        </button>
                                                    )}
                                                    {isReserva && r.operadorId && (
                                                        <button
                                                            className="btn btn-ghost btn-icon-sm"
                                                            title="Liberar reserva"
                                                            onClick={() => handleLiberar(r)}
                                                        >
                                                            <Unlink size={14} />
                                                        </button>
                                                    )}
                                                    <button className="btn btn-ghost btn-icon-sm" title="Editar" onClick={() => openEdit(r)}>
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button className="btn btn-ghost btn-icon-sm" title="Excluir" onClick={() => handleDelete(r.id)}>
                                                        <Trash2 size={14} />
                                                    </button>
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

            {/* ===== MODAL — Adicionar / Editar Roçadeira ===== */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editItem ? 'Editar Roçadeira' : form.tipo === 'reserva' ? 'Nova Máquina Reserva' : 'Nova Roçadeira (Operador)'}
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={save}>Salvar</button>
                    </>
                }
            >
                {/* Tipo — só mostra se for cadastro novo */}
                {!editItem && (
                    <div className="form-group">
                        <label className="form-label">Tipo de Máquina</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                type="button"
                                className={`btn ${form.tipo === 'operador' ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ flex: 1 }}
                                onClick={() => setForm({ ...form, tipo: 'operador', status: 'ativa', operadorId: '' })}
                            >
                                👷 Máquina de Operador
                            </button>
                            <button
                                type="button"
                                className={`btn ${form.tipo === 'reserva' ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ flex: 1 }}
                                onClick={() => setForm({ ...form, tipo: 'reserva', status: 'disponivel', operadorId: '' })}
                            >
                                📦 Máquina Reserva
                            </button>
                        </div>
                    </div>
                )}

                {/* Campos comuns */}
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">
                            {form.tipo === 'reserva' ? 'Identificador *' : 'Nº da Máquina'}
                            {form.tipo === 'operador' && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>(opcional, preencher depois)</span>}
                        </label>
                        <input
                            className="form-input"
                            value={form.numeroSerie}
                            onChange={e => setForm({ ...form, numeroSerie: e.target.value })}
                            placeholder={form.tipo === 'reserva' ? 'Ex: RES-01, 373984543' : 'Ex: 373984543'}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Modelo</label>
                        <input
                            className="form-input"
                            value={form.modelo}
                            onChange={e => setForm({ ...form, modelo: e.target.value })}
                            placeholder="Ex: 220, 221"
                        />
                    </div>
                </div>

                {/* Campos específicos por tipo */}
                {form.tipo === 'operador' && (
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Operador *</label>
                            <SearchableSelect
                                options={availableOperadores.map(op => ({ value: op.id, label: op.nome }))}
                                value={form.operadorId}
                                onChange={val => setForm({ ...form, operadorId: val })}
                                placeholder="Buscar operador..."
                            />
                            {!cargoOperador && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                                    ⚠ Crie o cargo "Operador de Roçadeira" e atribua aos funcionários.
                                </span>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })}
                            >
                                <option value="ativa">Ativa (Em uso)</option>
                                <option value="conserto">Em Conserto</option>
                            </select>
                        </div>
                    </div>
                )}

                {form.tipo === 'reserva' && (
                    <div className="form-group">
                        <label className="form-label">Status da Reserva</label>
                        <select
                            className="form-select"
                            value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="disponivel">Disponível</option>
                            <option value="conserto">Em Conserto</option>
                        </select>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                            Para atribuir a um operador, use o botão 🔗 na tabela.
                        </span>
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Observação</label>
                    <textarea
                        className="form-textarea"
                        value={form.observacao}
                        onChange={e => setForm({ ...form, observacao: e.target.value })}
                        placeholder="Motivo do conserto, detalhes da reserva, etc."
                    />
                </div>
            </Modal>

            {/* ===== MODAL — Atribuir Reserva a Operador ===== */}
            <Modal
                isOpen={!!atribuirModal}
                onClose={() => { setAtribuirModal(null); setAtribuirOperadorId(''); }}
                title="Atribuir Máquina Reserva"
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => { setAtribuirModal(null); setAtribuirOperadorId(''); }}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleAtribuir} disabled={!atribuirOperadorId}>
                            <Link size={15} /> Atribuir
                        </button>
                    </>
                }
            >
                {atribuirModal && (
                    <>
                        <div style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 14px',
                            marginBottom: 16,
                            fontSize: '0.85rem',
                        }}>
                            <strong>Máquina:</strong> {atribuirModal.numeroSerie || 'Sem ID'}
                            {atribuirModal.modelo && <> &bull; <strong>Modelo:</strong> {atribuirModal.modelo}</>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Operador que receberá esta máquina *</label>
                            <SearchableSelect
                                options={operadores
                                    .filter(op => !operadoresComReserva.includes(op.id))
                                    .map(op => {
                                        const emConserto = operadoresEmConserto.includes(op.id);
                                        return { value: op.id, label: op.nome + (emConserto ? ' 🔧 (máquina em conserto)' : '') };
                                    })
                                }
                                value={atribuirOperadorId}
                                onChange={val => setAtribuirOperadorId(val)}
                                placeholder="Buscar operador..."
                            />
                            {operadoresEmConserto.length > 0 && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                                    🔧 = operador com máquina em conserto
                                </span>
                            )}
                        </div>
                    </>
                )}
            </Modal>

            {/* ===== MODAL — Atribuir Reserva PARA Operador (fluxo da visão por fiscal) ===== */}
            <Modal
                isOpen={!!atribuirParaOperador}
                onClose={() => { setAtribuirParaOperador(null); setReservaParaAtribuirId(''); }}
                title="Atribuir Máquina Reserva ao Operador"
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => { setAtribuirParaOperador(null); setReservaParaAtribuirId(''); }}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleAtribuirParaOperador} disabled={!reservaParaAtribuirId}>
                            <Link size={15} /> Atribuir
                        </button>
                    </>
                }
            >
                {atribuirParaOperador && (
                    <>
                        <div style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 14px',
                            marginBottom: 16,
                            fontSize: '0.85rem',
                        }}>
                            <strong>Operador:</strong> {atribuirParaOperador.func.nome}
                            {atribuirParaOperador.roc?.numeroSerie && (
                                <> &bull; <strong>Máquina em conserto:</strong> {atribuirParaOperador.roc.numeroSerie}</>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Escolher máquina reserva disponível *</label>
                            <SearchableSelect
                                options={rocadeirasReserva
                                    .filter(r => !r.operadorId && r.status !== 'conserto')
                                    .map(r => ({
                                        value: r.id,
                                        label: (r.numeroSerie || 'Sem ID') + (r.modelo ? ` — ${r.modelo}` : ''),
                                    }))
                                }
                                value={reservaParaAtribuirId}
                                onChange={val => setReservaParaAtribuirId(val)}
                                placeholder="Buscar reserva disponível..."
                            />
                            {rocadeirasReserva.filter(r => !r.operadorId && r.status !== 'conserto').length === 0 && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--accent-danger)', marginTop: 4, display: 'block' }}>
                                    Nenhuma máquina reserva disponível no momento.
                                </span>
                            )}
                        </div>
                    </>
                )}
            </Modal>

            {/* ===== MODAL — Definir Metas ===== */}
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
