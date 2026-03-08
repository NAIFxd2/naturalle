import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
    ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { BarChart3, Printer, Filter } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const chartColors = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#8b5cf6'];

export default function Relatorios() {
    const { solicitacoes, fiscais, funcionarios, materiais, presencas, setores } = useData();
    const [tab, setTab] = useState('materiais');
    const [filterFiscal, setFilterFiscal] = useState('');
    const [filterSetor, setFilterSetor] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const finalizadas = useMemo(() => {
        let filtered = solicitacoes.filter(s => s.status === 'finalizado');
        if (filterFiscal) filtered = filtered.filter(s => s.fiscalId === filterFiscal);
        if (dateFrom) filtered = filtered.filter(s => s.createdAt >= dateFrom);
        if (dateTo) filtered = filtered.filter(s => s.createdAt <= dateTo + 'T23:59:59');
        if (filterSetor) {
            const fiscaisDoSetor = fiscais.filter(f => f.setorId === filterSetor).map(f => f.id);
            filtered = filtered.filter(s => fiscaisDoSetor.includes(s.fiscalId));
        }
        return filtered;
    }, [solicitacoes, filterFiscal, filterSetor, dateFrom, dateTo, fiscais]);

    const getFiscalName = (id) => fiscais.find(f => f.id === id)?.nome || 'Desconhecido';
    const getFuncName = (id) => funcionarios.find(f => f.id === id)?.nome || 'Desconhecido';
    const getMaterialName = (id) => materiais.find(m => m.id === id)?.nome || 'Desconhecido';

    // ===== KPIs =====
    const totalLiberado = finalizadas.reduce((sum, s) => sum + (s.qtdLiberada || 0), 0);
    const totalSolicitado = finalizadas.reduce((sum, s) => sum + s.quantidade, 0);
    const taxaAprovacao = solicitacoes.length > 0
        ? ((solicitacoes.filter(s => s.status === 'finalizado').length / solicitacoes.length) * 100).toFixed(1)
        : 0;
    const totalRejeitada = solicitacoes.filter(s => s.status === 'rejeitado_vistoria' || s.status === 'rejeitado_almox').length;

    // ===== Chart: Materiais por Tipo =====
    const materiaisPorTipo = useMemo(() => {
        const map = {};
        finalizadas.forEach(s => {
            const name = getMaterialName(s.materialId);
            map[name] = (map[name] || 0) + (s.qtdLiberada || 0);
        });
        return map;
    }, [finalizadas, materiais]);

    const pieData = {
        labels: Object.keys(materiaisPorTipo),
        datasets: [{
            data: Object.values(materiaisPorTipo),
            backgroundColor: chartColors.slice(0, Object.keys(materiaisPorTipo).length),
            borderWidth: 0,
        }],
    };

    // ===== Chart: Materiais por Fiscal =====
    const materiaisPorFiscal = useMemo(() => {
        const map = {};
        finalizadas.forEach(s => {
            const name = getFiscalName(s.fiscalId);
            map[name] = (map[name] || 0) + (s.qtdLiberada || 0);
        });
        return map;
    }, [finalizadas, fiscais]);

    const barFiscalData = {
        labels: Object.keys(materiaisPorFiscal),
        datasets: [{
            label: 'Materiais Liberados',
            data: Object.values(materiaisPorFiscal),
            backgroundColor: '#6366f1',
            borderRadius: 6,
        }],
    };

    // ===== Chart: Materiais por Funcionário =====
    const materiaisPorFunc = useMemo(() => {
        const map = {};
        finalizadas.forEach(s => {
            const name = getFuncName(s.funcionarioId);
            map[name] = (map[name] || 0) + (s.qtdLiberada || 0);
        });
        const sorted = Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 15);
        return Object.fromEntries(sorted);
    }, [finalizadas, funcionarios]);

    const barFuncData = {
        labels: Object.keys(materiaisPorFunc),
        datasets: [{
            label: 'Materiais Recebidos',
            data: Object.values(materiaisPorFunc),
            backgroundColor: '#a855f7',
            borderRadius: 6,
        }],
    };

    // ===== Chart: Solicitações por status =====
    const solPorStatus = useMemo(() => {
        const map = { 'Finalizado': 0, 'Aguardando': 0, 'Rejeitado': 0 };
        solicitacoes.forEach(s => {
            if (s.status === 'finalizado') map['Finalizado']++;
            else if (s.status === 'rejeitado_vistoria' || s.status === 'rejeitado_almox') map['Rejeitado']++;
            else map['Aguardando']++;
        });
        return map;
    }, [solicitacoes]);

    const doughnutData = {
        labels: Object.keys(solPorStatus),
        datasets: [{
            data: Object.values(solPorStatus),
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0,
        }],
    };

    // ===== Presença Chart =====
    const presencaStats = useMemo(() => {
        const map = { presente: 0, faltou: 0, suspenso: 0, atestado: 0, ferias: 0 };
        let filteredPresencas = presencas;
        if (filterFiscal) {
            const funcIds = funcionarios.filter(f => f.fiscalId === filterFiscal).map(f => f.id);
            filteredPresencas = presencas.filter(p => funcIds.includes(p.funcionarioId));
        }
        filteredPresencas.forEach(p => {
            if (p.status && map.hasOwnProperty(p.status)) map[p.status]++;
        });
        return map;
    }, [presencas, filterFiscal, funcionarios]);

    const presencaData = {
        labels: ['Presentes', 'Faltas', 'Suspensos', 'Atestado', 'Férias'],
        datasets: [{
            data: Object.values(presencaStats),
            backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#a855f7'],
            borderWidth: 0,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#9ca3b4', font: { family: 'Inter' } } },
        },
        scales: {
            x: { ticks: { color: '#6b7280', font: { family: 'Inter', size: 11 } }, grid: { color: '#2a2f40' } },
            y: { ticks: { color: '#6b7280', font: { family: 'Inter', size: 11 } }, grid: { color: '#2a2f40' } },
        },
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#9ca3b4', font: { family: 'Inter' }, padding: 16 } },
        },
    };

    // ===== Table: detail by employee =====
    const detailRows = useMemo(() => {
        const map = {};
        finalizadas.forEach(s => {
            const key = `${s.funcionarioId}-${s.materialId}`;
            const funcName = getFuncName(s.funcionarioId);
            const matName = getMaterialName(s.materialId);
            const fiscalName = getFiscalName(s.fiscalId);
            if (!map[key]) {
                map[key] = { funcName, matName, fiscalName, qtdSolicitada: 0, qtdLiberada: 0, count: 0 };
            }
            map[key].qtdSolicitada += s.quantidade;
            map[key].qtdLiberada += (s.qtdLiberada || 0);
            map[key].count++;
        });
        return Object.values(map).sort((a, b) => b.qtdLiberada - a.qtdLiberada);
    }, [finalizadas, funcionarios, materiais, fiscais]);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Relatórios & Análises</h1>
                    <p>Indicadores, gráficos e relatórios detalhados</p>
                </div>
                <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={16} /> Imprimir</button>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <Filter size={16} style={{ color: 'var(--text-muted)' }} />
                <select className="filter-select" value={filterFiscal} onChange={e => setFilterFiscal(e.target.value)}>
                    <option value="">Todos os Fiscais</option>
                    {fiscais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
                <select className="filter-select" value={filterSetor} onChange={e => setFilterSetor(e.target.value)}>
                    <option value="">Todos os Setores</option>
                    {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
                <input type="date" className="filter-select" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Data início" />
                <input type="date" className="filter-select" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Data fim" />
            </div>

            {/* KPIs */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon green"><BarChart3 size={20} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalLiberado}</div>
                        <div className="stat-label">Total Materiais Liberados</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><BarChart3 size={20} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalSolicitado}</div>
                        <div className="stat-label">Total Solicitado</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><BarChart3 size={20} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{taxaAprovacao}%</div>
                        <div className="stat-label">Taxa de Aprovação</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><BarChart3 size={20} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalRejeitada}</div>
                        <div className="stat-label">Solicitações Rejeitadas</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab-btn ${tab === 'materiais' ? 'active' : ''}`} onClick={() => setTab('materiais')}>Materiais</button>
                <button className={`tab-btn ${tab === 'presenca' ? 'active' : ''}`} onClick={() => setTab('presenca')}>Presença</button>
                <button className={`tab-btn ${tab === 'detalhado' ? 'active' : ''}`} onClick={() => setTab('detalhado')}>Relatório Detalhado</button>
            </div>

            {tab === 'materiais' && (
                <>
                    <div className="charts-grid">
                        <div className="chart-card">
                            <h3>Materiais por Tipo</h3>
                            <div style={{ height: 300 }}>
                                {Object.keys(materiaisPorTipo).length > 0 ? (
                                    <Pie data={pieData} options={pieOptions} />
                                ) : (
                                    <div className="empty-state"><p>Sem dados para exibir</p></div>
                                )}
                            </div>
                        </div>
                        <div className="chart-card">
                            <h3>Status das Solicitações</h3>
                            <div style={{ height: 300 }}>
                                <Doughnut data={doughnutData} options={pieOptions} />
                            </div>
                        </div>
                    </div>

                    <div className="charts-grid">
                        <div className="chart-card">
                            <h3>Materiais Liberados por Fiscal</h3>
                            <div style={{ height: 300 }}>
                                {Object.keys(materiaisPorFiscal).length > 0 ? (
                                    <Bar data={barFiscalData} options={chartOptions} />
                                ) : (
                                    <div className="empty-state"><p>Sem dados para exibir</p></div>
                                )}
                            </div>
                        </div>
                        <div className="chart-card">
                            <h3>Top 15 — Materiais por Funcionário</h3>
                            <div style={{ height: 300 }}>
                                {Object.keys(materiaisPorFunc).length > 0 ? (
                                    <Bar data={barFuncData} options={{ ...chartOptions, indexAxis: 'y' }} />
                                ) : (
                                    <div className="empty-state"><p>Sem dados para exibir</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {tab === 'presenca' && (
                <div className="charts-grid">
                    <div className="chart-card">
                        <h3>Distribuição de Presença (Geral)</h3>
                        <div style={{ height: 300 }}>
                            <Doughnut data={presencaData} options={pieOptions} />
                        </div>
                    </div>
                    <div className="chart-card">
                        <h3>Resumo Numérico</h3>
                        <div style={{ padding: '20px 0' }}>
                            {Object.entries(presencaStats).map(([key, val]) => (
                                <div key={key} className="detail-card" style={{ marginBottom: 8 }}>
                                    <div className="detail-row">
                                        <span className="detail-label" style={{ textTransform: 'capitalize' }}>{key}</span>
                                        <span className="detail-value">{val} registro(s)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'detalhado' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Relatório Detalhado de Materiais por Colaborador</h3>
                    </div>
                    {detailRows.length === 0 ? (
                        <div className="empty-state">
                            <p>Sem dados para o período selecionado</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Funcionário</th>
                                        <th>Material</th>
                                        <th>Fiscal</th>
                                        <th>Nº Solicitações</th>
                                        <th>Qtd Solicitada</th>
                                        <th>Qtd Liberada</th>
                                        <th>Diferença</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailRows.map((row, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: 600 }}>{row.funcName}</td>
                                            <td>{row.matName}</td>
                                            <td>{row.fiscalName}</td>
                                            <td>{row.count}</td>
                                            <td>{row.qtdSolicitada}</td>
                                            <td>{row.qtdLiberada}</td>
                                            <td>
                                                <span className={`badge ${row.qtdLiberada >= row.qtdSolicitada ? 'badge-success' : 'badge-warning'}`}>
                                                    {row.qtdLiberada - row.qtdSolicitada}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
