import { useState, useCallback, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, XCircle, Download, Loader, Trash2, Clock, Wrench } from 'lucide-react';
import * as XLSX from 'xlsx';

// Robust column finder: handles encoding differences and accents
const findCol = (headers, ...names) => {
    const norm = s => String(s).trim().toUpperCase().normalize('NFC');
    const strip = s => norm(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const name of names) {
        let idx = headers.findIndex(h => norm(h) === norm(name));
        if (idx !== -1) return idx;
        idx = headers.findIndex(h => strip(h) === strip(name));
        if (idx !== -1) return idx;
    }
    return -1;
};

export default function Importacoes() {
    const {
        funcionarios, addFuncionario,
        fiscais, addFiscal,
        cargos, addCargo,
        clearAllImportedData,
        bancoHoras, setBancoHoras,
        rocadeiras, addRocadeira, updateRocadeira,
    } = useData();

    const [activeTab, setActiveTab] = useState('colaboradores');
    const fileInputRef = useRef(null);
    const bhFileInputRef = useRef(null);
    const rocFileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [bhFile, setBhFile] = useState(null);
    const [rocFile, setRocFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [bhPreview, setBhPreview] = useState(null);
    const [rocPreview, setRocPreview] = useState(null);
    const [importing, setImporting] = useState(false);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);

    const addLog = (type, message) => {
        setLogs(prev => [...prev, { type, message, time: new Date().toLocaleTimeString('pt-BR') }]);
    };

    // =================== COLABORADORES IMPORT ===================
    const handleFile = useCallback((e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setLogs([]);
        setStats(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                const headers = data[0]?.map(h => String(h).trim().toUpperCase()) || [];
                const rows = data.slice(1).filter(r => r.length > 0 && r.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''));

                const colFiscaisPreview = findCol(headers, 'FISCAIS', 'FISCAL');
                const colFuncaoPreview = findCol(headers, 'FUNÇÃO', 'FUNCAO', 'FUNÇÃO', 'CARGO');
                setPreview({
                    sheetName: wb.SheetNames[0],
                    headers,
                    rows,
                    totalRows: rows.length,
                    sampleRows: rows.slice(0, 8),
                    uniqueFiscais: [...new Set(rows.map(r => colFiscaisPreview !== -1 ? r[colFiscaisPreview] : undefined).filter(Boolean))],
                    uniqueFuncoes: [...new Set(rows.map(r => colFuncaoPreview !== -1 ? r[colFuncaoPreview] : undefined).filter(Boolean))],
                });


                setLogs([{ type: 'info', message: `Planilha "${wb.SheetNames[0]}" carregada: ${rows.length} registros encontrados`, time: new Date().toLocaleTimeString('pt-BR') }]);
            } catch (err) {
                setLogs([{ type: 'error', message: `Erro ao ler planilha: ${err.message}`, time: new Date().toLocaleTimeString('pt-BR') }]);
            }
        };
        reader.readAsArrayBuffer(f);
    }, []);

    const runImport = useCallback(async () => {
        if (!preview) return;
        setImporting(true);
        setLogs([]);

        const { headers, rows } = preview;
        const colMatricula = findCol(headers, 'CHAPA', 'MATRICULA', 'MAT.', 'MAT');
        const colNome = findCol(headers, 'NOME', 'COLABORADOR');
        const colFuncao = findCol(headers, 'FUNÇÃO', 'FUNCAO', 'FUNÇÃO', 'CARGO');
        const colFiscal = findCol(headers, 'FISCAIS', 'FISCAL');
        const colObs = -1;

        addLog('info', `Colunas detectadas — CHAPA:${colMatricula} NOME:${colNome} FUNÇÃO:${colFuncao} FISCAIS:${colFiscal}`);

        if (colMatricula === -1 || colNome === -1) {
            addLog('error', 'Colunas obrigatórias não encontradas: CHAPA/MATRICULA, NOME');
            setImporting(false);
            return;
        }

        let created = { funcionarios: 0, fiscais: 0, cargos: 0, updated: 0, skipped: 0 };
        const currentFuncionarios = [...funcionarios];
        const currentFiscais = [...fiscais];
        const currentCargos = [...cargos];

        addLog('info', `Iniciando importação de ${rows.length} registros...`);

        // Phase 1: Create missing cargos
        const funcoes = [...new Set(rows.map(r => r[colFuncao]).filter(Boolean).map(f => String(f).trim()))];
        addLog('info', `${funcoes.length} funções encontradas na planilha`);

        for (const funcao of funcoes) {
            const exists = currentCargos.find(c => c.nome.toLowerCase().trim() === funcao.toLowerCase().trim());
            if (!exists) {
                const newCargo = addCargo({ nome: funcao });
                currentCargos.push(newCargo);
                created.cargos++;
                addLog('success', `Cargo criado: "${funcao}"`);
            }
        }

        // Phase 2: Create missing fiscais
        const fiscaisNames = [...new Set(rows.map(r => r[colFiscal]).filter(Boolean).map(f => String(f).trim()))];
        addLog('info', `${fiscaisNames.length} fiscais encontrados na planilha`);

        const fiscalMap = {};
        for (const nome of fiscaisNames) {
            let existing = currentFiscais.find(f => f.nome.toLowerCase().trim() === nome.toLowerCase().trim());
            if (!existing) {
                const username = nome.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 20);
                const newFiscal = addFiscal({ nome, matricula: '', username, password: '123456' });
                currentFiscais.push(newFiscal);
                created.fiscais++;
                addLog('success', `Fiscal criado: "${nome}" (login: ${username} / senha: 123456)`);
                fiscalMap[nome.toLowerCase().trim()] = newFiscal;
            } else {
                fiscalMap[nome.toLowerCase().trim()] = existing;
            }
        }

        // Phase 3: Import funcionarios
        addLog('info', 'Importando funcionários...');

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const matricula = String(row[colMatricula] || '').trim();
            const nome = String(row[colNome] || '').trim();
            const funcao = colFuncao !== -1 ? String(row[colFuncao] || '').trim() : '';
            const fiscalNome = colFiscal !== -1 ? String(row[colFiscal] || '').trim() : '';
            const observacao = colObs !== -1 ? String(row[colObs] || '').trim() : '';

            if (!nome) { created.skipped++; continue; }

            const existing = currentFuncionarios.find(f => f.matricula && f.matricula.toString() === matricula.toString());
            if (existing) { created.skipped++; continue; }

            const cargo = currentCargos.find(c => c.nome.toLowerCase().trim() === funcao.toLowerCase().trim());
            const fiscal = fiscalNome ? fiscalMap[fiscalNome.toLowerCase().trim()] : null;

            const newFunc = addFuncionario({ nome, matricula, cargoId: cargo?.id || '', fiscalId: fiscal?.id || '', observacao });
            currentFuncionarios.push(newFunc);
            created.funcionarios++;

            if ((i + 1) % 50 === 0 || i === rows.length - 1) {
                addLog('info', `Processados ${i + 1}/${rows.length} registros...`);
            }
        }

        addLog('success', '✅ Importação finalizada!');
        setStats(created);
        setImporting(false);
    }, [preview, funcionarios, fiscais, cargos, addFuncionario, addFiscal, addCargo]);

    // =================== BANCO DE HORAS IMPORT ===================
    const handleBhFile = useCallback((e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setBhFile(f);
        setLogs([]);
        setStats(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: true });
                const rows = data.slice(1).filter(r => r.length > 0 && r.some(c => c !== undefined && c !== null && String(c).trim() !== ''));

                setBhPreview({
                    sheetName: wb.SheetNames[0],
                    totalRows: rows.length,
                    sampleRows: rows.slice(0, 8),
                    rows,
                    positivos: rows.filter(r => (r[3] || 0) > 0).length,
                    negativos: rows.filter(r => (r[3] || 0) < 0).length,
                });

                setLogs([{ type: 'info', message: `Banco de Horas "${wb.SheetNames[0]}" carregado: ${rows.length} registros`, time: new Date().toLocaleTimeString('pt-BR') }]);
            } catch (err) {
                setLogs([{ type: 'error', message: `Erro ao ler planilha: ${err.message}`, time: new Date().toLocaleTimeString('pt-BR') }]);
            }
        };
        reader.readAsArrayBuffer(f);
    }, []);

    const runBhImport = useCallback(() => {
        if (!bhPreview) return;
        setImporting(true);
        setLogs([]);

        const { rows } = bhPreview;
        addLog('info', `Importando ${rows.length} registros de banco de horas...`);

        const bhRecords = rows.map((row, i) => ({
            id: `bh-${Date.now()}-${i}`,
            matricula: String(row[0] || '').trim(),
            nome: String(row[1] || '').trim(),
            funcao: String(row[2] || '').trim(),
            saldo: typeof row[3] === 'number' ? row[3] : parseFloat(row[3]) || 0,
            importedAt: new Date().toISOString(),
        }));

        setBancoHoras(bhRecords);

        addLog('success', `✅ ${bhRecords.length} registros de banco de horas importados!`);
        addLog('info', `Positivos: ${bhRecords.filter(r => r.saldo > 0).length} | Negativos: ${bhRecords.filter(r => r.saldo < 0).length}`);
        setStats({ bancoHoras: bhRecords.length });
        setImporting(false);
    }, [bhPreview, setBancoHoras]);

    // =================== ROÇADEIRAS IMPORT ===================
    const handleRocFile = useCallback((e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setRocFile(f);
        setLogs([]);
        setStats(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                const headers = data[0]?.map(h => String(h).trim().toUpperCase()) || [];
                const rows = data.slice(1).filter(r => r.length > 0 && r.some(c => c !== undefined && c !== null && String(c).trim() !== ''));

                // Detect columns: MAT.(0) NOME(1) FUNÇÃO(2) FISCAL(3) N.MÁQUINA(4) MODELO(5)
                const colNome = findCol(headers, 'NOME', 'COLABORADOR');
                const colMaquina = findCol(headers, 'N. MÁQUINA', 'N.MAQUINA', 'MAQUINA', 'N. MAQUINA', 'NUMERO MAQUINA');
                const colModelo = findCol(headers, 'MODELO');

                const comMaquina = rows.filter(r => {
                    const val = colMaquina !== -1 ? r[colMaquina] : undefined;
                    if (!val) return false;
                    const s = String(val).trim().toLowerCase();
                    return s !== '' && !s.startsWith('não') && !isNaN(Number(val)) && Number(val) > 0;
                }).length;

                setRocPreview({
                    sheetName: wb.SheetNames[0],
                    headers,
                    rows,
                    totalRows: rows.length,
                    sampleRows: rows.slice(0, 8),
                    colNome,
                    colMaquina,
                    colModelo,
                    comMaquina,
                });

                setLogs([{
                    type: 'info',
                    message: `Planilha "${wb.SheetNames[0]}" carregada: ${rows.length} operadores, ${comMaquina} com máquina válida`,
                    time: new Date().toLocaleTimeString('pt-BR'),
                }]);
            } catch (err) {
                setLogs([{ type: 'error', message: `Erro ao ler planilha: ${err.message}`, time: new Date().toLocaleTimeString('pt-BR') }]);
            }
        };
        reader.readAsArrayBuffer(f);
    }, []);

    const normName = (s) => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const runRocImport = useCallback(async () => {
        if (!rocPreview) return;
        setImporting(true);
        setLogs([]);

        const { rows, colNome, colMaquina, colModelo } = rocPreview;

        if (colMaquina === -1) {
            addLog('error', 'Coluna "N. MÁQUINA" não encontrada na planilha');
            setImporting(false);
            return;
        }

        addLog('info', `Iniciando importação de roçadeiras (${rows.length} linhas)...`);

        let created = 0, updated = 0, skipped = 0, notFound = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const nome = colNome !== -1 ? String(row[colNome] || '').trim() : '';
            const maquinaRaw = colMaquina !== -1 ? row[colMaquina] : undefined;
            const modeloRaw = colModelo !== -1 ? row[colModelo] : undefined;

            // Validate machine number (must be numeric and > 0)
            const maquinaValida = maquinaRaw !== undefined &&
                maquinaRaw !== null &&
                !isNaN(Number(maquinaRaw)) &&
                Number(maquinaRaw) > 0;

            if (!maquinaValida) {
                const motivo = maquinaRaw ? `"${maquinaRaw}"` : 'vazio';
                addLog('warning', `${nome || `Linha ${i + 1}`}: N. Máquina inválido (${motivo}) — ignorado`);
                skipped++;
                continue;
            }

            const numeroSerie = String(maquinaRaw).trim();
            const modelo = modeloRaw !== undefined && modeloRaw !== null ? String(modeloRaw).trim() : '';

            // Find funcionário by name (normalized)
            if (!nome) {
                addLog('warning', `Linha ${i + 1}: nome vazio, não é possível vincular operador`);
                skipped++;
                continue;
            }

            const funcNorm = normName(nome);
            const func = funcionarios.find(f => normName(f.nome) === funcNorm);

            if (!func) {
                addLog('warning', `Funcionário não encontrado: "${nome}" — máq. ${numeroSerie} não importada`);
                notFound++;
                continue;
            }

            // Check if rocadeira already exists for this operador
            const existing = rocadeiras.find(r => r.operadorId === func.id);
            if (existing) {
                updateRocadeira(existing.id, { numeroSerie, modelo });
                addLog('info', `Atualizado: ${func.nome} → Máq. ${numeroSerie}${modelo ? ` / Mod. ${modelo}` : ''}`);
                updated++;
            } else {
                addRocadeira({ operadorId: func.id, numeroSerie, modelo, status: 'ativa', observacao: '' });
                addLog('success', `Criado: ${func.nome} → Máq. ${numeroSerie}${modelo ? ` / Mod. ${modelo}` : ''}`);
                created++;
            }
        }

        addLog('success', `✅ Importação finalizada! Criadas: ${created} | Atualizadas: ${updated} | Sem máquina: ${skipped} | Não encontrados: ${notFound}`);
        setStats({ rocCreated: created, rocUpdated: updated, rocSkipped: skipped, rocNotFound: notFound });
        setImporting(false);
    }, [rocPreview, funcionarios, rocadeiras, addRocadeira, updateRocadeira]);

    const logColors = { info: 'var(--accent-primary)', success: 'var(--accent-success)', error: 'var(--accent-danger)', warning: '#f59e0b' };
    const logIcons = { info: '📋', success: '✅', error: '❌', warning: '⚠️' };

    return (
        <div>
            <div className="page-header">
                <div><h1>Importações</h1><p>Importe dados de planilhas para o sistema</p></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div>{funcionarios.length} funcionários • {fiscais.length} fiscais • {cargos.length} cargos • {bancoHoras.length} BH</div>
                    </div>
                    {(funcionarios.length > 0 || fiscais.length > 0 || cargos.length > 0) && (
                        <button className="btn" style={{ background: 'var(--accent-danger)', color: '#fff' }} onClick={() => {
                            if (confirm('⚠️ ATENÇÃO: Isso vai apagar TODOS os funcionários, fiscais e cargos do sistema. Tem certeza?')) {
                                if (confirm('Confirmação final: Esta ação é irreversível. Prosseguir?')) {
                                    clearAllImportedData();
                                    setStats(null);
                                    setLogs([{ type: 'warning', message: 'Todos os dados importados foram apagados!', time: new Date().toLocaleTimeString('pt-BR') }]);
                                }
                            }
                        }}><Trash2 size={16} /> Apagar Colab.</button>
                    )}
                    {bancoHoras.length > 0 && (
                        <button className="btn" style={{ background: 'var(--accent-danger)', color: '#fff' }} onClick={() => {
                            if (confirm('Apagar todos os dados de banco de horas?')) {
                                setBancoHoras([]);
                                setLogs([{ type: 'warning', message: 'Banco de horas apagado!', time: new Date().toLocaleTimeString('pt-BR') }]);
                            }
                        }}><Trash2 size={16} /> Apagar BH</button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab-btn ${activeTab === 'colaboradores' ? 'active' : ''}`} onClick={() => { setActiveTab('colaboradores'); setLogs([]); setStats(null); }}>
                    <FileSpreadsheet size={16} style={{ marginRight: 6 }} /> Colaboradores
                </button>
                <button className={`tab-btn ${activeTab === 'banco-horas' ? 'active' : ''}`} onClick={() => { setActiveTab('banco-horas'); setLogs([]); setStats(null); }}>
                    <Clock size={16} style={{ marginRight: 6 }} /> Banco de Horas
                </button>
                <button className={`tab-btn ${activeTab === 'rocadeiras' ? 'active' : ''}`} onClick={() => { setActiveTab('rocadeiras'); setLogs([]); setStats(null); }}>
                    <Wrench size={16} style={{ marginRight: 6 }} /> Roçadeiras
                </button>
            </div>

            {/* ============ COLABORADORES TAB ============ */}
            {activeTab === 'colaboradores' && (
                <>
                    <div className="card" style={{ marginBottom: 16 }}>
                        <div className="card-header"><h3 className="card-title"><Upload size={18} /> Upload — Controle de Equipes Sistema</h3></div>
                        <div style={{ padding: 20 }}>
                            <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s', background: 'var(--bg-secondary)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                                <FileSpreadsheet size={48} style={{ color: 'var(--accent-primary)', marginBottom: 12 }} />
                                <p style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 4px' }}>{file ? file.name : 'Clique para selecionar — Controle de Equipes Sistema.xlsx'}</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Colunas: CHAPA, NOME, FUNÇÃO, FISCAIS</p>
                            </div>
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: 'none' }} />
                        </div>
                    </div>

                    {preview && (
                        <div className="card" style={{ marginBottom: 16 }}>
                            <div className="card-header">
                                <h3 className="card-title"><FileSpreadsheet size={18} /> Pré-visualização</h3>
                                <button className="btn btn-primary" onClick={runImport} disabled={importing}>
                                    {importing ? <><Loader size={16} className="spin" /> Importando...</> : <><Upload size={16} /> Iniciar Importação</>}
                                </button>
                            </div>
                            <div style={{ padding: 16 }}>
                                <div className="stats-grid" style={{ marginBottom: 16 }}>
                                    <div className="stat-card"><div className="stat-icon blue"><FileSpreadsheet size={20} /></div><div className="stat-content"><div className="stat-value">{preview.totalRows}</div><div className="stat-label">Registros</div></div></div>
                                    <div className="stat-card"><div className="stat-icon green"><CheckCircle size={20} /></div><div className="stat-content"><div className="stat-value">{preview.uniqueFiscais.length}</div><div className="stat-label">Fiscais</div></div></div>
                                    <div className="stat-card"><div className="stat-icon purple"><CheckCircle size={20} /></div><div className="stat-content"><div className="stat-value">{preview.uniqueFuncoes.length}</div><div className="stat-label">Funções</div></div></div>
                                </div>
                                <div className="table-container" style={{ maxHeight: 300, overflow: 'auto' }}>
                                    <table className="data-table">
                                        <thead><tr>{preview.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
                                        <tbody>{preview.sampleRows.map((row, i) => (<tr key={i}>{preview.headers.map((_, j) => <td key={j}>{row[j] || ''}</td>)}</tr>))}</tbody>
                                    </table>
                                </div>
                                {preview.totalRows > 8 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>Mostrando 8 de {preview.totalRows} registros</p>}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ============ BANCO DE HORAS TAB ============ */}
            {activeTab === 'banco-horas' && (
                <>
                    <div className="card" style={{ marginBottom: 16 }}>
                        <div className="card-header"><h3 className="card-title"><Clock size={18} /> Upload — Banco de Horas</h3></div>
                        <div style={{ padding: 20 }}>
                            <div onClick={() => bhFileInputRef.current?.click()} style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s', background: 'var(--bg-secondary)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-warning)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                                <Clock size={48} style={{ color: 'var(--accent-warning)', marginBottom: 12 }} />
                                <p style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 4px' }}>{bhFile ? bhFile.name : 'Clique para selecionar — Banco de Horas.xlsx'}</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Colunas: MATRÍCULA, COLABORADOR, FUNÇÃO, SALDO (horas)</p>
                            </div>
                            <input ref={bhFileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleBhFile} style={{ display: 'none' }} />
                        </div>
                    </div>

                    {bhPreview && (
                        <div className="card" style={{ marginBottom: 16 }}>
                            <div className="card-header">
                                <h3 className="card-title"><Clock size={18} /> Pré-visualização — Banco de Horas</h3>
                                <button className="btn btn-primary" onClick={runBhImport} disabled={importing}>
                                    {importing ? <><Loader size={16} className="spin" /> Importando...</> : <><Upload size={16} /> Importar Banco de Horas</>}
                                </button>
                            </div>
                            <div style={{ padding: 16 }}>
                                <div className="stats-grid" style={{ marginBottom: 16 }}>
                                    <div className="stat-card"><div className="stat-icon blue"><FileSpreadsheet size={20} /></div><div className="stat-content"><div className="stat-value">{bhPreview.totalRows}</div><div className="stat-label">Registros</div></div></div>
                                    <div className="stat-card"><div className="stat-icon green"><CheckCircle size={20} /></div><div className="stat-content"><div className="stat-value">{bhPreview.positivos}</div><div className="stat-label">Saldo Positivo</div></div></div>
                                    <div className="stat-card"><div className="stat-icon red"><AlertTriangle size={20} /></div><div className="stat-content"><div className="stat-value">{bhPreview.negativos}</div><div className="stat-label">Saldo Negativo</div></div></div>
                                </div>
                                <div className="table-container" style={{ maxHeight: 300, overflow: 'auto' }}>
                                    <table className="data-table">
                                        <thead><tr><th>Matrícula</th><th>Colaborador</th><th>Função</th><th style={{ textAlign: 'right' }}>Saldo (h)</th></tr></thead>
                                        <tbody>
                                            {bhPreview.sampleRows.map((row, i) => (
                                                <tr key={i}>
                                                    <td>{row[0]}</td>
                                                    <td style={{ fontWeight: 600 }}>{row[1]}</td>
                                                    <td>{row[2]}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 700, color: (row[3] || 0) >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                                        {typeof row[3] === 'number' ? `${row[3] >= 0 ? '+' : ''}${row[3].toFixed(2)}h` : row[3]}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ============ ROÇADEIRAS TAB ============ */}
            {activeTab === 'rocadeiras' && (
                <>
                    <div className="card" style={{ marginBottom: 16 }}>
                        <div className="card-header"><h3 className="card-title"><Wrench size={18} /> Upload — Controle de Roçadeiras Sistema</h3></div>
                        <div style={{ padding: 20 }}>
                            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: 16, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                <strong>Regras de importação:</strong> Colunas usadas: <code>NOME</code> (vincula ao funcionário), <code>N. MÁQUINA</code> (número da máquina) e <code>MODELO</code>. Linhas sem número de máquina válido (ex: "Não tem", vazio) são ignoradas. FUNÇÃO e FISCAL são ignorados.
                            </div>
                            <div onClick={() => rocFileInputRef.current?.click()} style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s', background: 'var(--bg-secondary)' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                                <Wrench size={48} style={{ color: '#8b5cf6', marginBottom: 12 }} />
                                <p style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 4px' }}>{rocFile ? rocFile.name : 'Clique para selecionar — Controle de Roçadeiras Sistema.xlsx'}</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Colunas: MAT. | NOME | FUNÇÃO | FISCAL | N. MÁQUINA | MODELO</p>
                            </div>
                            <input ref={rocFileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleRocFile} style={{ display: 'none' }} />
                        </div>
                    </div>

                    {rocPreview && (
                        <div className="card" style={{ marginBottom: 16 }}>
                            <div className="card-header">
                                <h3 className="card-title"><Wrench size={18} /> Pré-visualização — Roçadeiras</h3>
                                <button className="btn btn-primary" onClick={runRocImport} disabled={importing}>
                                    {importing ? <><Loader size={16} className="spin" /> Importando...</> : <><Upload size={16} /> Importar Roçadeiras</>}
                                </button>
                            </div>
                            <div style={{ padding: 16 }}>
                                <div className="stats-grid" style={{ marginBottom: 16 }}>
                                    <div className="stat-card"><div className="stat-icon blue"><FileSpreadsheet size={20} /></div><div className="stat-content"><div className="stat-value">{rocPreview.totalRows}</div><div className="stat-label">Operadores na Planilha</div></div></div>
                                    <div className="stat-card"><div className="stat-icon green"><Wrench size={20} /></div><div className="stat-content"><div className="stat-value">{rocPreview.comMaquina}</div><div className="stat-label">Com Máquina Válida</div></div></div>
                                    <div className="stat-card"><div className="stat-icon blue"><CheckCircle size={20} /></div><div className="stat-content"><div className="stat-value">{rocadeiras.length}</div><div className="stat-label">Roçadeiras no Sistema</div></div></div>
                                    <div className="stat-card"><div className="stat-icon purple"><CheckCircle size={20} /></div><div className="stat-content"><div className="stat-value">{funcionarios.length}</div><div className="stat-label">Funcionários Cadastrados</div></div></div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                                    Colunas detectadas — NOME: col {rocPreview.colNome !== -1 ? rocPreview.colNome + 1 : '❌ NÃO ENCONTRADA'} | N. MÁQUINA: col {rocPreview.colMaquina !== -1 ? rocPreview.colMaquina + 1 : '❌ NÃO ENCONTRADA'} | MODELO: col {rocPreview.colModelo !== -1 ? rocPreview.colModelo + 1 : '—'}
                                </div>
                                <div className="table-container" style={{ maxHeight: 300, overflow: 'auto' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Nome</th>
                                                <th>N. Máquina</th>
                                                <th>Modelo</th>
                                                <th>Funcionário?</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rocPreview.sampleRows.map((row, i) => {
                                                const nome = rocPreview.colNome !== -1 ? String(row[rocPreview.colNome] || '').trim() : '';
                                                const maq = rocPreview.colMaquina !== -1 ? row[rocPreview.colMaquina] : undefined;
                                                const mod = rocPreview.colModelo !== -1 ? row[rocPreview.colModelo] : undefined;
                                                const maqValida = maq !== undefined && maq !== null && !isNaN(Number(maq)) && Number(maq) > 0;
                                                const funcNorm = nome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                                                const found = funcionarios.find(f => f.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === funcNorm);
                                                return (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: 500 }}>{nome || '—'}</td>
                                                        <td style={{ fontFamily: 'monospace' }}>
                                                            {maqValida
                                                                ? <span className="badge badge-success">{String(maq)}</span>
                                                                : <span className="badge badge-warning">{maq ? String(maq) : 'vazio'}</span>}
                                                        </td>
                                                        <td>{mod !== undefined && mod !== null ? <span className="badge badge-neutral">{String(mod)}</span> : '—'}</td>
                                                        <td>
                                                            {found
                                                                ? <span className="badge badge-success">✓ {found.nome}</span>
                                                                : <span className="badge badge-danger">✗ Não encontrado</span>}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {rocPreview.totalRows > 8 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>Mostrando 8 de {rocPreview.totalRows} registros</p>}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Import Results */}
            {stats && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header"><h3 className="card-title">📊 Resultado da Importação</h3></div>
                    <div style={{ padding: 16 }}>
                        <div className="stats-grid">
                            {stats.funcionarios !== undefined && (
                                <><div className="stat-card"><div className="stat-icon green"><CheckCircle size={20} /></div><div className="stat-content"><div className="stat-value">{stats.funcionarios}</div><div className="stat-label">Funcionários Criados</div></div></div>
                                    <div className="stat-card"><div className="stat-icon blue"><CheckCircle size={20} /></div><div className="stat-content"><div className="stat-value">{stats.fiscais}</div><div className="stat-label">Fiscais Criados</div></div></div>
                                    <div className="stat-card"><div className="stat-icon purple"><CheckCircle size={20} /></div><div className="stat-content"><div className="stat-value">{stats.cargos}</div><div className="stat-label">Cargos Criados</div></div></div>
                                    <div className="stat-card"><div className="stat-icon yellow"><AlertTriangle size={20} /></div><div className="stat-content"><div className="stat-value">{stats.skipped}</div><div className="stat-label">Já Existentes</div></div></div></>
                            )}
                            {stats.bancoHoras !== undefined && (
                                <div className="stat-card"><div className="stat-icon green"><CheckCircle size={20} /></div><div className="stat-content"><div className="stat-value">{stats.bancoHoras}</div><div className="stat-label">Registros BH Importados</div></div></div>
                            )}
                            {stats.rocCreated !== undefined && (
                                <><div className="stat-card"><div className="stat-icon green"><CheckCircle size={20} /></div><div className="stat-content"><div className="stat-value">{stats.rocCreated}</div><div className="stat-label">Roçadeiras Criadas</div></div></div>
                                    <div className="stat-card"><div className="stat-icon blue"><CheckCircle size={20} /></div><div className="stat-content"><div className="stat-value">{stats.rocUpdated}</div><div className="stat-label">Roçadeiras Atualizadas</div></div></div>
                                    <div className="stat-card"><div className="stat-icon yellow"><AlertTriangle size={20} /></div><div className="stat-content"><div className="stat-value">{stats.rocSkipped}</div><div className="stat-label">Sem Máquina Válida</div></div></div>
                                    <div className="stat-card"><div className="stat-icon red"><AlertTriangle size={20} /></div><div className="stat-content"><div className="stat-value">{stats.rocNotFound}</div><div className="stat-label">Funcionário Não Encontrado</div></div></div></>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Logs */}
            {logs.length > 0 && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">📋 Log de Importação</h3></div>
                    <div style={{ padding: 16, maxHeight: 400, overflow: 'auto', background: 'var(--bg-tertiary, #0d1117)', borderRadius: 'var(--radius-md)', margin: 16, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ padding: '4px 0', color: logColors[log.type], borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ opacity: 0.5, marginRight: 8 }}>[{log.time}]</span>
                                <span style={{ marginRight: 6 }}>{logIcons[log.type]}</span>
                                {log.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
