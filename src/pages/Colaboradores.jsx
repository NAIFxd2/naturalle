import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Users, Search, Download, MapPin, Briefcase, UserCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Colaboradores() {
    const { funcionarios, fiscais, setores, cargos } = useData();
    const [search, setSearch] = useState('');
    const [filterFiscal, setFilterFiscal] = useState('');
    const [filterSetor, setFilterSetor] = useState('');
    const [filterCargo, setFilterCargo] = useState('');

    const getFiscalName = (id) => fiscais.find(f => f.id === id)?.nome || '—';
    const getSetorName = (id) => setores.find(s => s.id === id)?.nome || '—';
    const getCargoName = (id) => cargos.find(c => c.id === id)?.nome || '—';

    // Get fiscal's setor
    const getFiscalSetor = (fiscalId) => {
        const fiscal = fiscais.find(f => f.id === fiscalId);
        return fiscal?.setorId || '';
    };

    // Filter records
    const filtered = useMemo(() => {
        let list = [...funcionarios];
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(f => f.nome.toLowerCase().includes(q) || (f.matricula && f.matricula.toString().includes(q)));
        }
        if (filterFiscal) list = list.filter(f => f.fiscalId === filterFiscal);
        if (filterSetor) list = list.filter(f => getFiscalSetor(f.fiscalId) === filterSetor);
        if (filterCargo) list = list.filter(f => f.cargoId === filterCargo);
        return list;
    }, [funcionarios, search, filterFiscal, filterSetor, filterCargo, fiscais]);

    // Stats
    const totalFuncionarios = funcionarios.length;
    const totalFiscais = fiscais.length;
    const totalCargos = cargos.length;

    // Export to Excel
    const exportToExcel = () => {
        const data = filtered.map(f => ({
            'Matrícula': f.matricula || '',
            'Colaborador': f.nome,
            'Função': f.cargoId ? getCargoName(f.cargoId) : '',
            'Fiscal': f.fiscalId ? getFiscalName(f.fiscalId) : '',
            'Setor': f.fiscalId ? getSetorName(getFiscalSetor(f.fiscalId)) : '',
            'Observação': f.observacao || '',
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores');

        // Auto column widths
        const colWidths = Object.keys(data[0] || {}).map(key => ({
            wch: Math.max(key.length, ...data.map(r => String(r[key] || '').length)) + 2
        }));
        ws['!cols'] = colWidths;

        XLSX.writeFile(wb, `Colaboradores_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div>
            <div className="page-header">
                <div><h1>Colaboradores</h1><p>Lista completa de colaboradores do sistema</p></div>
                <button className="btn btn-primary" onClick={exportToExcel} disabled={filtered.length === 0}>
                    <Download size={16} /> Exportar Excel
                </button>
            </div>

            {/* KPIs */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                    <div className="stat-icon blue"><Users size={20} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalFuncionarios}</div>
                        <div className="stat-label">Colaboradores</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><UserCheck size={20} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalFiscais}</div>
                        <div className="stat-label">Fiscais</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><Briefcase size={20} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalCargos}</div>
                        <div className="stat-label">Funções</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon yellow"><MapPin size={20} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{filtered.length}</div>
                        <div className="stat-label">Filtrados</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="toolbar" style={{ marginBottom: 16 }}>
                <div className="toolbar-left" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div className="search-bar"><Search size={16} className="search-icon" /><input type="text" placeholder="Buscar por nome ou matrícula..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="form-select" style={{ maxWidth: 200 }} value={filterFiscal} onChange={e => setFilterFiscal(e.target.value)}>
                        <option value="">Todos os Fiscais</option>
                        {fiscais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                    <select className="form-select" style={{ maxWidth: 180 }} value={filterSetor} onChange={e => setFilterSetor(e.target.value)}>
                        <option value="">Todos os Setores</option>
                        {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                    <select className="form-select" style={{ maxWidth: 180 }} value={filterCargo} onChange={e => setFilterCargo(e.target.value)}>
                        <option value="">Todas as Funções</option>
                        {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                {filtered.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon"><Users size={28} /></div><h3>Nenhum colaborador encontrado</h3><p>Ajuste os filtros ou importe dados pela área de importações.</p></div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Matrícula</th>
                                    <th>Colaborador</th>
                                    <th>Função</th>
                                    <th>Fiscal</th>
                                    <th>Setor</th>
                                    <th>Observação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(f => (
                                    <tr key={f.id}>
                                        <td><span className="badge badge-info">{f.matricula || '—'}</span></td>
                                        <td style={{ fontWeight: 600 }}>{f.nome}</td>
                                        <td>{f.cargoId ? <span className="badge badge-purple">{getCargoName(f.cargoId)}</span> : '—'}</td>
                                        <td>{f.fiscalId ? getFiscalName(f.fiscalId) : '—'}</td>
                                        <td>{f.fiscalId ? getSetorName(getFiscalSetor(f.fiscalId)) : '—'}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{f.observacao || '—'}</td>
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
