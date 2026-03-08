import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Clock, Search, Download, TrendingUp, TrendingDown, Minus, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function BancoHoras() {
    const { bancoHoras, funcionarios, fiscais, cargos } = useData();
    const [search, setSearch] = useState('');
    const [filterFuncao, setFilterFuncao] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const getFiscalName = (id) => fiscais.find(f => f.id === id)?.nome || '—';
    const getCargoName = (id) => cargos.find(c => c.id === id)?.nome || '—';

    // Enrich banco de horas records with funcionario data
    const records = useMemo(() => {
        return bancoHoras.map(bh => {
            const func = funcionarios.find(f => f.matricula && f.matricula.toString() === bh.matricula.toString());
            return {
                ...bh,
                nome: bh.nome || func?.nome || '—',
                funcao: bh.funcao || (func?.cargoId ? getCargoName(func.cargoId) : '—'),
                fiscalNome: func?.fiscalId ? getFiscalName(func.fiscalId) : '—',
            };
        });
    }, [bancoHoras, funcionarios, fiscais, cargos]);

    // Filter
    const filtered = useMemo(() => {
        let list = [...records];
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(r => r.nome.toLowerCase().includes(q) || r.matricula.toString().includes(q));
        }
        if (filterFuncao) list = list.filter(r => r.funcao === filterFuncao);
        if (filterStatus === 'positivo') list = list.filter(r => r.saldo > 0);
        if (filterStatus === 'negativo') list = list.filter(r => r.saldo < 0);
        if (filterStatus === 'zero') list = list.filter(r => r.saldo === 0);
        return list.sort((a, b) => a.saldo - b.saldo);
    }, [records, search, filterFuncao, filterStatus]);

    // Stats
    const totalColaboradores = records.length;
    const positivos = records.filter(r => r.saldo > 0).length;
    const negativos = records.filter(r => r.saldo < 0).length;
    const saldoTotal = records.reduce((sum, r) => sum + (r.saldo || 0), 0);

    // Unique funcoes
    const funcoes = [...new Set(records.map(r => r.funcao).filter(f => f && f !== '—'))];

    // Export
    const exportToExcel = () => {
        const data = filtered.map(r => ({
            'Matrícula': r.matricula,
            'Colaborador': r.nome,
            'Função': r.funcao,
            'Fiscal': r.fiscalNome,
            'Saldo (horas)': r.saldo,
            'Importado em': r.importedAt ? new Date(r.importedAt).toLocaleDateString('pt-BR') : '',
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Banco de Horas');
        ws['!cols'] = Object.keys(data[0] || {}).map(key => ({
            wch: Math.max(key.length, ...data.map(r => String(r[key] || '').length)) + 2
        }));
        XLSX.writeFile(wb, `Banco_de_Horas_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const formatHours = (val) => {
        if (val === undefined || val === null) return '—';
        const sign = val >= 0 ? '+' : '';
        return `${sign}${val.toFixed(2)}h`;
    };

    return (
        <div>
            <div className="page-header">
                <div><h1>Banco de Horas</h1><p>Controle de saldo de horas dos colaboradores</p></div>
                <button className="btn btn-primary" onClick={exportToExcel} disabled={filtered.length === 0}>
                    <Download size={16} /> Exportar Excel
                </button>
            </div>

            {/* KPIs */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                    <div className="stat-icon blue"><Users size={20} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalColaboradores}</div>
                        <div className="stat-label">Colaboradores</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><TrendingUp size={20} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{positivos}</div>
                        <div className="stat-label">Saldo Positivo</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><TrendingDown size={20} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{negativos}</div>
                        <div className="stat-label">Saldo Negativo</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><Clock size={20} /></div>
                    <div className="stat-content">
                        <div className="stat-value" style={{ color: saldoTotal >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                            {formatHours(saldoTotal)}
                        </div>
                        <div className="stat-label">Saldo Total</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="toolbar" style={{ marginBottom: 16 }}>
                <div className="toolbar-left" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div className="search-bar"><Search size={16} className="search-icon" /><input type="text" placeholder="Buscar por nome ou matrícula..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="form-select" style={{ maxWidth: 180 }} value={filterFuncao} onChange={e => setFilterFuncao(e.target.value)}>
                        <option value="">Todas as Funções</option>
                        {funcoes.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select className="form-select" style={{ maxWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">Todos os Saldos</option>
                        <option value="positivo">✅ Positivo</option>
                        <option value="negativo">❌ Negativo</option>
                        <option value="zero">⚖️ Zerado</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><Clock size={28} /></div>
                        <h3>{records.length === 0 ? 'Nenhum dado importado' : 'Nenhum resultado'}</h3>
                        <p>{records.length === 0 ? 'Importe os dados do banco de horas pela área de Importações.' : 'Ajuste os filtros para ver resultados.'}</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Matrícula</th>
                                    <th>Colaborador</th>
                                    <th>Função</th>
                                    <th>Fiscal</th>
                                    <th style={{ textAlign: 'right' }}>Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r, i) => (
                                    <tr key={r.id || i}>
                                        <td><span className="badge badge-info">{r.matricula}</span></td>
                                        <td style={{ fontWeight: 600 }}>{r.nome}</td>
                                        <td><span className="badge badge-purple">{r.funcao}</span></td>
                                        <td>{r.fiscalNome}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                                            <span style={{
                                                color: r.saldo > 0 ? 'var(--accent-success)' : r.saldo < 0 ? 'var(--accent-danger)' : 'var(--text-muted)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}>
                                                {r.saldo > 0 && <TrendingUp size={14} />}
                                                {r.saldo < 0 && <TrendingDown size={14} />}
                                                {r.saldo === 0 && <Minus size={14} />}
                                                {formatHours(r.saldo)}
                                            </span>
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
