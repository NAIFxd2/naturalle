import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const DataContext = createContext(null);

// Map from old camelCase field names to snake_case DB columns
const toDb = (obj) => {
    if (!obj) return obj;
    const map = {
        fiscalId: 'fiscal_id', setorId: 'setor_id', cargoId: 'cargo_id',
        funcionarioId: 'funcionario_id', temaId: 'tema_id',
        materialId: 'material_id', operadorId: 'operador_id',
        numeroSerie: 'numero_serie', qtdContrato: 'qtd_contrato',
        tipoServicoId: 'tipo_servico_id',
        createdAt: 'created_at', importedAt: 'imported_at',
        fiscalNome: 'fiscal_nome', temaNome: 'tema_nome',
        tipoServico: 'tipo_servico', estoqueMinimo: 'estoque_minimo',
        estoqueAtual: 'estoque_atual',
        vistoriaApproval: 'vistoria_approval', vistoriaDate: 'vistoria_date',
        vistoriaObs: 'vistoria_obs', almoxApproval: 'almox_approval',
        almoxDate: 'almox_date', almoxObs: 'almox_obs', qtdLiberada: 'qtd_liberada',
    };
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
        result[map[k] || k] = v;
    }
    return result;
};

const fromDb = (obj) => {
    if (!obj) return obj;
    const map = {
        fiscal_id: 'fiscalId', setor_id: 'setorId', cargo_id: 'cargoId',
        funcionario_id: 'funcionarioId', tema_id: 'temaId',
        material_id: 'materialId', operador_id: 'operadorId',
        numero_serie: 'numeroSerie', qtd_contrato: 'qtdContrato',
        tipo_servico_id: 'tipoServicoId',
        created_at: 'createdAt', imported_at: 'importedAt',
        fiscal_nome: 'fiscalNome', tema_nome: 'temaNome',
        tipo_servico: 'tipoServico', estoque_minimo: 'estoqueMinimo',
        estoque_atual: 'estoqueAtual',
        vistoria_approval: 'vistoriaApproval', vistoria_date: 'vistoriaDate',
        vistoria_obs: 'vistoriaObs', almox_approval: 'almoxApproval',
        almox_date: 'almoxDate', almox_obs: 'almoxObs', qtd_liberada: 'qtdLiberada',
    };
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
        result[map[k] || k] = v;
    }
    return result;
};

const fromDbArray = (arr) => (arr || []).map(fromDb);

export function DataProvider({ children }) {
    const [fiscais, setFiscais] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [setores, setSetores] = useState([]);
    const [materiais, setMateriais] = useState([]);
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [presencas, setPresencas] = useState([]);
    const [sysUsers, setSysUsers] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [controleContrato, setControleContrato] = useState([]);
    const [rocadeiras, setRocadeiras] = useState([]);
    const [metasRocadeiras, setMetasRocadeiras] = useState([]);
    const [tiposServico, setTiposServico] = useState([]);
    const [temasDDS, setTemasDDS] = useState([]);
    const [registrosDDS, setRegistrosDDS] = useState([]);
    const [presencaConfig, setPresencaConfigState] = useState(null);
    const [permissionsConfig, setPermissionsConfigState] = useState(null);
    const [bancoHoras, setBancoHorasState] = useState([]);
    const [loading, setLoading] = useState(true);

    // ===== LOAD ALL DATA ON MOUNT =====
    useEffect(() => {
        async function loadAll() {
            try {
                const [
                    { data: d1 }, { data: d2 }, { data: d3 }, { data: d4 },
                    { data: d5 }, { data: d6 }, { data: d7 }, { data: d8 },
                    { data: d9 }, { data: d10 }, { data: d11 }, { data: d12 },
                    { data: d13 }, { data: d14 }, { data: d15 }, { data: d16 },
                ] = await Promise.all([
                    supabase.from('setores').select('*').order('created_at'),
                    supabase.from('cargos').select('*').order('created_at'),
                    supabase.from('fiscais').select('*').order('created_at'),
                    supabase.from('funcionarios').select('*').order('nome'),
                    supabase.from('sys_users').select('*').order('created_at'),
                    supabase.from('materiais').select('*').order('nome'),
                    supabase.from('solicitacoes').select('*').order('created_at', { ascending: false }),
                    supabase.from('presencas').select('*'),
                    supabase.from('controle_contrato').select('*').order('created_at'),
                    supabase.from('rocadeiras').select('*').order('created_at'),
                    supabase.from('metas_rocadeiras').select('*'),
                    supabase.from('tipos_servico').select('*').order('nome'),
                    supabase.from('temas_dds').select('*').order('created_at'),
                    supabase.from('registros_dds').select('*').order('created_at', { ascending: false }),
                    supabase.from('banco_horas').select('*').order('nome'),
                    supabase.from('app_config').select('*'),
                ]);

                setSetores(fromDbArray(d1));
                setCargos(fromDbArray(d2));
                setFiscais(fromDbArray(d3));
                setFuncionarios(fromDbArray(d4));
                setSysUsers(fromDbArray(d5));
                setMateriais(fromDbArray(d6));
                setSolicitacoes(fromDbArray(d7));
                setPresencas(fromDbArray(d8));
                setControleContrato(fromDbArray(d9));
                setRocadeiras(fromDbArray(d10));
                setMetasRocadeiras(fromDbArray(d11));
                setTiposServico(fromDbArray(d12));
                setTemasDDS(fromDbArray(d13));
                setRegistrosDDS(fromDbArray(d14));
                setBancoHorasState(fromDbArray(d15));

                // Load configs
                const configs = d16 || [];
                const pc = configs.find(c => c.key === 'presenca_config');
                const pm = configs.find(c => c.key === 'permissions_config');
                setPresencaConfigState(pc?.value || null);
                setPermissionsConfigState(pm?.value || null);
            } catch (err) {
                console.error('Error loading data:', err);
            } finally {
                setLoading(false);
            }
        }
        loadAll();
    }, []);

    // ===== GENERIC CRUD HELPERS =====
    const dbInsert = async (table, data) => {
        const dbData = toDb(data);
        const { data: result, error } = await supabase.from(table).insert(dbData).select().single();
        if (error) { console.error(`Insert ${table}:`, error); return null; }
        return fromDb(result);
    };

    const dbUpdate = async (table, id, data) => {
        const dbData = toDb(data);
        delete dbData.id; // Don't update the id
        const { error } = await supabase.from(table).update(dbData).eq('id', id);
        if (error) console.error(`Update ${table}:`, error);
    };

    const dbDelete = async (table, id) => {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) console.error(`Delete ${table}:`, error);
    };

    // ===== SETORES =====
    const addSetor = useCallback((data) => {
        const temp = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
        setSetores(p => [...p, temp]);
        dbInsert('setores', { nome: data.nome }).then(r => {
            if (r) setSetores(p => p.map(s => s.id === temp.id ? r : s));
        });
        return temp;
    }, []);
    const updateSetor = useCallback((id, data) => {
        setSetores(p => p.map(s => s.id === id ? { ...s, ...data } : s));
        dbUpdate('setores', id, data);
    }, []);
    const deleteSetor = useCallback((id) => {
        setSetores(p => p.filter(s => s.id !== id));
        dbDelete('setores', id);
    }, []);

    // ===== FISCAIS =====
    const addFiscal = useCallback((data) => {
        const temp = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
        setFiscais(p => [...p, temp]);
        dbInsert('fiscais', data).then(r => {
            if (r) setFiscais(p => p.map(f => f.id === temp.id ? r : f));
        });
        return temp;
    }, []);
    const updateFiscal = useCallback((id, data) => {
        setFiscais(p => p.map(f => f.id === id ? { ...f, ...data } : f));
        dbUpdate('fiscais', id, data);
    }, []);
    const deleteFiscal = useCallback((id) => {
        setFiscais(p => p.filter(f => f.id !== id));
        setFuncionarios(p => p.map(f => f.fiscalId === id ? { ...f, fiscalId: null } : f));
        dbDelete('fiscais', id);
    }, []);

    // ===== FUNCIONÁRIOS =====
    const addFuncionario = useCallback((data) => {
        const temp = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
        setFuncionarios(p => [...p, temp]);
        dbInsert('funcionarios', data).then(r => {
            if (r) setFuncionarios(p => p.map(f => f.id === temp.id ? r : f));
        });
        return temp;
    }, []);
    const updateFuncionario = useCallback((id, data) => {
        setFuncionarios(p => p.map(f => f.id === id ? { ...f, ...data } : f));
        dbUpdate('funcionarios', id, data);
    }, []);
    const deleteFuncionario = useCallback((id) => {
        setFuncionarios(p => p.filter(f => f.id !== id));
        dbDelete('funcionarios', id);
    }, []);
    const getFuncionariosByFiscal = useCallback((fiscalId) => funcionarios.filter(f => f.fiscalId === fiscalId), [funcionarios]);

    // ===== CARGOS =====
    const addCargo = useCallback((data) => {
        const temp = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
        setCargos(p => [...p, temp]);
        dbInsert('cargos', data).then(r => {
            if (r) setCargos(p => p.map(c => c.id === temp.id ? r : c));
        });
        return temp;
    }, []);
    const updateCargo = useCallback((id, data) => {
        setCargos(p => p.map(c => c.id === id ? { ...c, ...data } : c));
        dbUpdate('cargos', id, data);
    }, []);
    const deleteCargo = useCallback((id) => {
        setCargos(p => p.filter(c => c.id !== id));
        dbDelete('cargos', id);
    }, []);

    // ===== CONTROLE DE CONTRATO =====
    const addControleContrato = useCallback((data) => {
        const temp = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
        setControleContrato(p => [...p, temp]);
        dbInsert('controle_contrato', data).then(r => {
            if (r) setControleContrato(p => p.map(c => c.id === temp.id ? r : c));
        });
        return temp;
    }, []);
    const updateControleContrato = useCallback((id, data) => {
        setControleContrato(p => p.map(c => c.id === id ? { ...c, ...data } : c));
        dbUpdate('controle_contrato', id, data);
    }, []);
    const deleteControleContrato = useCallback((id) => {
        setControleContrato(p => p.filter(c => c.id !== id));
        dbDelete('controle_contrato', id);
    }, []);

    // ===== MATERIAIS =====
    const addMaterial = useCallback((data) => {
        const temp = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
        setMateriais(p => [...p, temp]);
        dbInsert('materiais', data).then(r => {
            if (r) setMateriais(p => p.map(m => m.id === temp.id ? r : m));
        });
        return temp;
    }, []);
    const updateMaterial = useCallback((id, data) => {
        setMateriais(p => p.map(m => m.id === id ? { ...m, ...data } : m));
        dbUpdate('materiais', id, data);
    }, []);
    const deleteMaterial = useCallback((id) => {
        setMateriais(p => p.filter(m => m.id !== id));
        dbDelete('materiais', id);
    }, []);

    // ===== SOLICITAÇÕES =====
    const addSolicitacao = useCallback((data) => {
        const temp = {
            id: crypto.randomUUID(), ...data, status: 'pendente_vistoria',
            createdAt: new Date().toISOString(),
            vistoriaApproval: null, vistoriaDate: null, vistoriaObs: null,
            almoxApproval: null, almoxDate: null, almoxObs: null, qtdLiberada: null
        };
        setSolicitacoes(p => [temp, ...p]);
        dbInsert('solicitacoes', { ...data, status: 'pendente_vistoria' }).then(r => {
            if (r) setSolicitacoes(p => p.map(s => s.id === temp.id ? r : s));
        });
        return temp;
    }, []);
    const updateSolicitacao = useCallback((id, data) => {
        setSolicitacoes(p => p.map(s => s.id === id ? { ...s, ...data } : s));
        dbUpdate('solicitacoes', id, data);
    }, []);

    // ===== PRESENÇAS =====
    const setPresenca = useCallback((funcionarioId, date, status) => {
        setPresencas(prev => {
            const existing = prev.findIndex(p => p.funcionarioId === funcionarioId && p.date === date);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = { ...updated[existing], status };
                // Update in DB
                dbUpdate('presencas', updated[existing].id, { status });
                return updated;
            }
            const newP = { id: crypto.randomUUID(), funcionarioId, date, status };
            // Insert in DB
            dbInsert('presencas', { funcionario_id: funcionarioId, date, status }).then(r => {
                if (r) setPresencas(p => p.map(pp => pp.id === newP.id ? r : pp));
            });
            return [...prev, newP];
        });
    }, []);
    const getPresencasByDate = useCallback((date, fiscalId) => {
        const funcs = fiscalId ? funcionarios.filter(f => f.fiscalId === fiscalId) : funcionarios;
        return presencas.filter(p => p.date === date && funcs.some(f => f.id === p.funcionarioId));
    }, [funcionarios, presencas]);
    const getPresencaStatus = useCallback((funcionarioId, date) => {
        const p = presencas.find(p => p.funcionarioId === funcionarioId && p.date === date);
        return p ? p.status : null;
    }, [presencas]);

    // ===== SYSTEM USERS =====
    const addSysUser = useCallback((data) => {
        const temp = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
        setSysUsers(p => [...p, temp]);
        dbInsert('sys_users', data).then(r => {
            if (r) setSysUsers(p => p.map(u => u.id === temp.id ? r : u));
        });
        return temp;
    }, []);
    const updateSysUser = useCallback((id, data) => {
        setSysUsers(p => p.map(u => u.id === id ? { ...u, ...data } : u));
        dbUpdate('sys_users', id, data);
    }, []);
    const deleteSysUser = useCallback((id) => {
        setSysUsers(p => p.filter(u => u.id !== id));
        dbDelete('sys_users', id);
    }, []);

    // ===== ROÇADEIRAS =====
    const addRocadeira = useCallback((data) => {
        const temp = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
        setRocadeiras(p => [...p, temp]);
        dbInsert('rocadeiras', data).then(r => {
            if (r) setRocadeiras(p => p.map(x => x.id === temp.id ? r : x));
        });
        return temp;
    }, []);
    const updateRocadeira = useCallback((id, data) => {
        setRocadeiras(p => p.map(r => r.id === id ? { ...r, ...data } : r));
        dbUpdate('rocadeiras', id, data);
    }, []);
    const deleteRocadeira = useCallback((id) => {
        setRocadeiras(p => p.filter(r => r.id !== id));
        dbDelete('rocadeiras', id);
    }, []);

    // ===== METAS ROÇADEIRAS =====
    const setMetaRocadeira = useCallback((setorId, meta) => {
        setMetasRocadeiras(prev => {
            const existing = prev.findIndex(m => m.setorId === setorId);
            if (existing >= 0) {
                const u = [...prev]; u[existing] = { ...u[existing], meta };
                dbUpdate('metas_rocadeiras', u[existing].id, { meta });
                return u;
            }
            const newM = { id: crypto.randomUUID(), setorId, meta };
            dbInsert('metas_rocadeiras', { setor_id: setorId, meta }).then(r => {
                if (r) setMetasRocadeiras(p => p.map(m => m.id === newM.id ? r : m));
            });
            return [...prev, newM];
        });
    }, []);
    const getMetaRocadeira = useCallback((setorId) => metasRocadeiras.find(m => m.setorId === setorId)?.meta || 0, [metasRocadeiras]);

    // ===== TIPOS DE SERVIÇO =====
    const addTipoServico = useCallback((data) => {
        const temp = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
        setTiposServico(p => [...p, temp]);
        dbInsert('tipos_servico', data).then(r => {
            if (r) setTiposServico(p => p.map(t => t.id === temp.id ? r : t));
        });
        return temp;
    }, []);
    const updateTipoServico = useCallback((id, data) => {
        setTiposServico(p => p.map(t => t.id === id ? { ...t, ...data } : t));
        dbUpdate('tipos_servico', id, data);
    }, []);
    const deleteTipoServico = useCallback((id) => {
        setTiposServico(p => p.filter(t => t.id !== id));
        dbDelete('tipos_servico', id);
    }, []);

    // ===== TEMAS DDS =====
    const addTemaDDS = useCallback((data) => {
        const temp = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
        setTemasDDS(p => [...p, temp]);
        dbInsert('temas_dds', data).then(r => {
            if (r) setTemasDDS(p => p.map(t => t.id === temp.id ? r : t));
        });
        return temp;
    }, []);
    const updateTemaDDS = useCallback((id, data) => {
        setTemasDDS(p => p.map(t => t.id === id ? { ...t, ...data } : t));
        dbUpdate('temas_dds', id, data);
    }, []);
    const deleteTemaDDS = useCallback((id) => {
        setTemasDDS(p => p.filter(t => t.id !== id));
        dbDelete('temas_dds', id);
    }, []);

    // ===== REGISTROS DDS =====
    const addRegistroDDS = useCallback((data) => {
        const temp = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
        setRegistrosDDS(p => [temp, ...p]);
        dbInsert('registros_dds', data).then(r => {
            if (r) setRegistrosDDS(p => p.map(x => x.id === temp.id ? r : x));
        });
        return temp;
    }, []);
    const updateRegistroDDS = useCallback((id, data) => {
        setRegistrosDDS(p => p.map(r => r.id === id ? { ...r, ...data } : r));
        dbUpdate('registros_dds', id, data);
    }, []);

    // ===== BULK CLEAR (for import reset) =====
    const clearAllImportedData = useCallback(async () => {
        setFuncionarios([]);
        setFiscais([]);
        setCargos([]);
        // Clear in DB
        await supabase.from('funcionarios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('fiscais').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('cargos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }, []);

    // ===== CONFIG: PRESENÇA =====
    const setPresencaConfig = useCallback(async (value) => {
        setPresencaConfigState(value);
        await supabase.from('app_config').upsert({ key: 'presenca_config', value }, { onConflict: 'key' });
    }, []);

    // ===== CONFIG: PERMISSIONS =====
    const setPermissionsConfig = useCallback(async (value) => {
        setPermissionsConfigState(value);
        await supabase.from('app_config').upsert({ key: 'permissions_config', value }, { onConflict: 'key' });
    }, []);

    // ===== BANCO DE HORAS =====
    const setBancoHoras = useCallback(async (records) => {
        setBancoHorasState(records);
        // Clear existing and insert new
        await supabase.from('banco_horas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (records.length > 0) {
            // Insert in batches of 500
            for (let i = 0; i < records.length; i += 500) {
                const batch = records.slice(i, i + 500).map(r => ({
                    matricula: r.matricula,
                    nome: r.nome,
                    funcao: r.funcao,
                    saldo: r.saldo,
                    imported_at: r.importedAt || new Date().toISOString(),
                }));
                await supabase.from('banco_horas').insert(batch);
            }
        }
    }, []);

    const value = {
        loading,
        fiscais, addFiscal, updateFiscal, deleteFiscal,
        funcionarios, addFuncionario, updateFuncionario, deleteFuncionario, getFuncionariosByFiscal,
        setores, addSetor, updateSetor, deleteSetor,
        materiais, addMaterial, updateMaterial, deleteMaterial,
        solicitacoes, addSolicitacao, updateSolicitacao,
        presencas, setPresenca, getPresencasByDate, getPresencaStatus,
        sysUsers, addSysUser, updateSysUser, deleteSysUser,
        cargos, addCargo, updateCargo, deleteCargo,
        controleContrato, addControleContrato, updateControleContrato, deleteControleContrato,
        rocadeiras, addRocadeira, updateRocadeira, deleteRocadeira,
        metasRocadeiras, setMetaRocadeira, getMetaRocadeira,
        tiposServico, addTipoServico, updateTipoServico, deleteTipoServico,
        temasDDS, addTemaDDS, updateTemaDDS, deleteTemaDDS,
        registrosDDS, addRegistroDDS, updateRegistroDDS,
        clearAllImportedData,
        presencaConfig, setPresencaConfig,
        permissionsConfig, setPermissionsConfig,
        bancoHoras, setBancoHoras,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => useContext(DataContext);
