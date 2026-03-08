import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { BookOpen, CheckCircle, XCircle, Search, Eye, Download } from 'lucide-react';
import Modal from '../components/UI/Modal';

export default function DDSAdmin() {
    const { registrosDDS, temasDDS, fiscais, setores, tiposServico } = useData();
    const [search, setSearch] = useState('');
    const [filterSetor, setFilterSetor] = useState('');
    const [viewFotos, setViewFotos] = useState(null);

    const getFiscalName = (id) => fiscais.find(f => f.id === id)?.nome || '—';
    const getSetorName = (id) => setores.find(s => s.id === id)?.nome || '—';
    const getTemaName = (id) => temasDDS.find(t => t.id === id)?.titulo || '—';
    const getServicoName = (id) => tiposServico.find(t => t.id === id)?.nome || '—';

    // Today's info
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    const isDDS = today.getDay() === 2 || today.getDay() === 4; // Terça e Quinta

    // Stats
    const registrosHoje = registrosDDS.filter(r => r.date === todayKey);
    const totalFiscais = fiscais.length;
    const aplicadosHoje = registrosHoje.length;

    // All records sorted by date
    let records = [...registrosDDS].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt?.localeCompare(a.createdAt));
    if (search) {
        const q = search.toLowerCase();
        records = records.filter(r => getFiscalName(r.fiscalId).toLowerCase().includes(q) || getTemaName(r.temaId).toLowerCase().includes(q));
    }
    if (filterSetor) {
        records = records.filter(r => r.setorId === filterSetor);
    }

    // Download a single photo
    const downloadFoto = (dataUrl, filename) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
    };

    // Download ALL photos from all records
    const downloadAllFotos = () => {
        let count = 0;
        records.forEach(r => {
            const fotos = (r.fotos || [r.foto]).filter(Boolean);
            const fiscal = getFiscalName(r.fiscalId).replace(/\s+/g, '_');
            const date = r.date;
            fotos.forEach((f, i) => {
                count++;
                setTimeout(() => downloadFoto(f, `DDS_${date}_${fiscal}_foto${i + 1}.jpg`), count * 200);
            });
        });
        if (count === 0) alert('Nenhuma foto para baixar.');
    };

    return (
        <div>
            <div className="page-header">
                <div><h1>DDS — Painel Administrativo</h1><p>Acompanhe a aplicação do DDS por todos os fiscais</p></div>
            </div>

            {/* KPIs */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                    <div className="stat-icon blue"><BookOpen size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{temasDDS.length}</div>
                        <div className="stat-label">Temas Cadastrados</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><CheckCircle size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{registrosDDS.length}</div>
                        <div className="stat-label">Total de Registros</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className={`stat-icon ${isDDS ? 'green' : 'yellow'}`}><CheckCircle size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{aplicadosHoje}/{totalFiscais}</div>
                        <div className="stat-label">Aplicados Hoje</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className={`stat-icon ${isDDS && aplicadosHoje < totalFiscais ? 'red' : 'green'}`}><XCircle size={22} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{isDDS ? totalFiscais - aplicadosHoje : 0}</div>
                        <div className="stat-label">Pendentes Hoje</div>
                    </div>
                </div>
            </div>

            {/* Fiscais Pendentes Hoje */}
            {isDDS && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header"><h3 className="card-title">⚠️ Fiscais Pendentes Hoje</h3></div>
                    {(() => {
                        const aplicadoIds = registrosHoje.map(r => r.fiscalId);
                        const pendentes = fiscais.filter(f => !aplicadoIds.includes(f.id));
                        if (pendentes.length === 0) return <div style={{ padding: 16, color: 'var(--accent-success)', fontWeight: 600 }}>✅ Todos os fiscais aplicaram o DDS hoje!</div>;
                        return (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead><tr><th>Fiscal</th><th>Setor</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {pendentes.map(f => (
                                            <tr key={f.id}>
                                                <td style={{ fontWeight: 600 }}>{f.nome}</td>
                                                <td>{f.setorId ? getSetorName(f.setorId) : '—'}</td>
                                                <td><span className="badge badge-danger">⏳ Pendente</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Search & Filter */}
            <div className="toolbar" style={{ marginBottom: 16 }}>
                <div className="toolbar-left" style={{ display: 'flex', gap: 8 }}>
                    <div className="search-bar"><Search size={16} className="search-icon" /><input type="text" placeholder="Buscar fiscal ou tema..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="form-select" style={{ maxWidth: 180 }} value={filterSetor} onChange={e => setFilterSetor(e.target.value)}>
                        <option value="">Todos os setores</option>
                        {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={downloadAllFotos}><Download size={16} /> Baixar Todas Fotos</button>
                </div>
            </div>

            {/* History Table */}
            <div className="card">
                {records.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon"><BookOpen size={28} /></div><h3>Nenhum registro</h3><p>Os registros de DDS aparecerão aqui quando os fiscais aplicarem.</p></div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Data</th><th>Fiscal</th><th>Setor</th><th>Serviço</th><th>Tema</th><th>Fotos</th></tr></thead>
                            <tbody>
                                {records.map(r => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 600 }}>{new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                        <td>{getFiscalName(r.fiscalId)}</td>
                                        <td>{r.setorId ? getSetorName(r.setorId) : '—'}</td>
                                        <td>{r.tipoServicoId ? <span className="badge badge-purple">{getServicoName(r.tipoServicoId)}</span> : '—'}</td>
                                        <td>{getTemaName(r.temaId)}</td>
                                        <td>
                                            {r.fotosLimpas ? (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Expiradas (15d)</span>
                                            ) : (r.fotos || [r.foto]).filter(Boolean).length > 0 ? (
                                                <button className="btn btn-ghost btn-sm" onClick={() => setViewFotos(r.fotos || [r.foto])}>
                                                    <Eye size={14} /> {(r.fotos || [r.foto]).filter(Boolean).length} foto(s)
                                                </button>
                                            ) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Foto Viewer Modal */}
            <Modal isOpen={!!viewFotos} onClose={() => setViewFotos(null)} title="Evidências DDS">
                {viewFotos && (
                    <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
                            {viewFotos.filter(Boolean).map((f, i) => (
                                <div key={i} style={{ position: 'relative' }}>
                                    <img src={f} alt={`Evidência ${i + 1}`} style={{ maxWidth: 280, maxHeight: 250, borderRadius: 'var(--radius-md)', objectFit: 'contain' }} />
                                    <button className="btn btn-ghost btn-sm" onClick={() => downloadFoto(f, `evidencia_${i + 1}.jpg`)} style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: '50%', padding: 4 }}>
                                        <Download size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-primary" onClick={() => viewFotos.filter(Boolean).forEach((f, i) => downloadFoto(f, `evidencia_${i + 1}.jpg`))} style={{ width: '100%', justifyContent: 'center' }}>
                            <Download size={16} /> Baixar Todas ({viewFotos.filter(Boolean).length})
                        </button>
                    </div>
                )}
            </Modal>
        </div >
    );
}
