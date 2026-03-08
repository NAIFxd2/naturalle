import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { CalendarCheck, ChevronLeft, ChevronRight, Check, X, AlertTriangle, FileText, Palmtree, Save, Power } from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_OPTIONS = [
    { value: 'presente', label: 'Presente', icon: '✅', className: 'selected-presente' },
    { value: 'faltou', label: 'Faltou', icon: '❌', className: 'selected-faltou' },
    { value: 'suspenso', label: 'Suspenso', icon: '⚠️', className: 'selected-suspenso' },
    { value: 'atestado', label: 'Atestado', icon: '🏥', className: 'selected-atestado' },
    { value: 'ferias', label: 'Férias', icon: '🏖️', className: 'selected-ferias' },
];

export default function ControlePresenca() {
    const { user } = useAuth();
    const { funcionarios, fiscais, cargos, setPresenca, getPresencaStatus, presencaConfig, setPresencaConfig } = useData();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedFiscalId, setSelectedFiscalId] = useState(user.role === 'fiscal' ? user.fiscalId : '');
    const [saved, setSaved] = useState(false);

    const isSuperAdmin = user.role === 'superadmin';
    const canSelectFiscal = user.role === 'superadmin' || user.role === 'dp';

    // Check if attendance is active for the selected date
    const isActive = presencaConfig?.active && presencaConfig?.startDate && selectedDate >= presencaConfig.startDate;

    const getEmployees = () => {
        if (canSelectFiscal && selectedFiscalId) {
            return funcionarios.filter(f => f.fiscalId === selectedFiscalId);
        }
        if (user.role === 'fiscal') {
            return funcionarios.filter(f => f.fiscalId === user.fiscalId);
        }
        return [];
    };

    const employees = getEmployees();

    const handleStatusChange = (funcId, status) => {
        if (!isActive) return; // Only allow changes when attendance is active for this date
        const current = getPresencaStatus(funcId, selectedDate);
        // If clicking 'presente', clear any saved exception (back to default presente)
        if (status === 'presente') {
            setPresenca(funcId, selectedDate, null);
        } else if (current === status) {
            // Toggle off exception → goes back to presente (null)
            setPresenca(funcId, selectedDate, null);
        } else {
            setPresenca(funcId, selectedDate, status);
        }
        setSaved(false);
    };

    const prevDay = () => setSelectedDate(subDays(parseISO(selectedDate), 1).toISOString().split('T')[0]);
    const nextDay = () => setSelectedDate(addDays(parseISO(selectedDate), 1).toISOString().split('T')[0]);

    const formattedDate = format(parseISO(selectedDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    const getStats = () => {
        const stats = { presente: 0, faltou: 0, suspenso: 0, atestado: 0, ferias: 0 };
        if (!isActive) return stats; // Before start date: all zeros
        employees.forEach(emp => {
            const s = getPresencaStatus(emp.id, selectedDate);
            if (s && stats.hasOwnProperty(s)) stats[s]++;
            else stats.presente++; // No status saved = presente by default
        });
        return stats;
    };

    const stats = getStats();

    const togglePresencaActive = () => {
        if (presencaConfig?.active) {
            // Turn off
            setPresencaConfig({ ...presencaConfig, active: false });
        } else {
            // Turn on from today
            setPresencaConfig({ active: true, startDate: new Date().toISOString().split('T')[0] });
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Controle de Presença</h1>
                    <p>Registre a presença diária dos funcionários</p>
                </div>
                {canSelectFiscal && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {presencaConfig?.active && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Ativo desde: {new Date(presencaConfig.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </span>
                        )}
                        <button
                            className="btn"
                            style={{
                                background: presencaConfig?.active ? 'var(--accent-success)' : 'var(--accent-danger)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                            onClick={togglePresencaActive}
                        >
                            <Power size={16} />
                            {presencaConfig?.active ? 'Ligado' : 'Desligado'}
                        </button>
                    </div>
                )}
            </div>

            {canSelectFiscal && (
                <div style={{ marginBottom: 20 }}>
                    <label className="form-label">Selecione o Fiscal</label>
                    <select
                        className="form-select"
                        style={{ maxWidth: 300 }}
                        value={selectedFiscalId}
                        onChange={e => setSelectedFiscalId(e.target.value)}
                    >
                        <option value="">Selecione um fiscal</option>
                        {fiscais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                </div>
            )}

            <div className="date-nav">
                <button className="btn btn-ghost btn-icon" onClick={prevDay}><ChevronLeft size={18} /></button>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                />
                <button className="btn btn-ghost btn-icon" onClick={nextDay}><ChevronRight size={18} /></button>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', textTransform: 'capitalize' }}>
                    {formattedDate}
                </span>
            </div>

            {/* Status message for inactive dates */}
            {!isActive && selectedFiscalId && employees.length > 0 && (
                <div style={{
                    padding: '12px 16px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--accent-danger)',
                    fontSize: '0.9rem',
                    marginBottom: 16,
                    textAlign: 'center'
                }}>
                    {!presencaConfig?.active
                        ? '⚠️ Controle de presença está desligado. Ligue pelo botão acima para começar a contabilizar.'
                        : `📅 Controle de presença ativo a partir de ${new Date(presencaConfig.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}. Esta data é anterior.`
                    }
                </div>
            )}

            {employees.length > 0 && (
                <div className="stats-grid" style={{ marginBottom: 20 }}>
                    <div className="stat-card">
                        <div className="stat-icon green"><Check size={18} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.presente}</div>
                            <div className="stat-label">Presentes</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon red"><X size={18} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.faltou}</div>
                            <div className="stat-label">Faltas</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon yellow"><AlertTriangle size={18} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.suspenso}</div>
                            <div className="stat-label">Suspensos</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon blue"><FileText size={18} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.atestado}</div>
                            <div className="stat-label">Atestado</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card">
                {!selectedFiscalId && canSelectFiscal ? (
                    <div className="empty-state">
                        <div className="empty-icon"><CalendarCheck size={28} /></div>
                        <h3>Selecione um fiscal</h3>
                        <p>Escolha um fiscal para ver e controlar a presença dos seus funcionários.</p>
                    </div>
                ) : employees.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><CalendarCheck size={28} /></div>
                        <h3>Nenhum funcionário vinculado</h3>
                        <p>Não há funcionários vinculados a este fiscal. Vincule funcionários na área de Equipes.</p>
                    </div>
                ) : (
                    <div className="attendance-grid">
                        {employees.map(emp => {
                            const savedStatus = getPresencaStatus(emp.id, selectedDate);
                            const currentStatus = isActive ? (savedStatus || 'presente') : savedStatus;
                            return (
                                <div className="attendance-row" key={emp.id} style={!isActive ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                                    <div className="emp-name">
                                        {emp.nome}
                                        {emp.cargoId && (() => {
                                            const cargo = cargos.find(c => c.id === emp.cargoId);
                                            return cargo ? <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 12 }}>{cargo.nome}</span> : null;
                                        })()}
                                    </div>
                                    <div className="attendance-options">
                                        {STATUS_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                className={`attendance-btn ${currentStatus === opt.value ? opt.className : ''}`}
                                                onClick={() => handleStatusChange(emp.id, opt.value)}
                                                title={opt.label}
                                                disabled={!isActive}
                                            >
                                                {opt.icon} {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
