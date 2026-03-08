import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/UI/Modal';
import { MapPin, Plus, Pencil, Trash2, Search } from 'lucide-react';

export default function Setores() {
    const { setores, addSetor, updateSetor, deleteSetor, fiscais, tiposServico } = useData();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ nome: '', tipoServicoId: '' });

    const openAdd = () => { setEditItem(null); setForm({ nome: '', tipoServicoId: '' }); setModalOpen(true); };
    const openEdit = (setor) => { setEditItem(setor); setForm({ nome: setor.nome, tipoServicoId: setor.tipoServicoId || '' }); setModalOpen(true); };

    const save = () => {
        if (!form.nome.trim()) return;
        editItem ? updateSetor(editItem.id, form) : addSetor(form);
        setModalOpen(false);
    };

    const handleDelete = (id) => { if (confirm('Excluir este setor?')) deleteSetor(id); };
    const getFiscaisInSetor = (setorId) => fiscais.filter(f => f.setorId === setorId);
    const getServicoName = (id) => tiposServico.find(t => t.id === id)?.nome || null;
    const filtered = setores.filter(s => s.nome.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            <div className="page-header">
                <div><h1>Setores</h1><p>Gerencie os setores de operação</p></div>
            </div>
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-bar"><Search size={16} className="search-icon" /><input type="text" placeholder="Buscar setor..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Novo Setor</button>
                </div>
            </div>
            <div className="card">
                {filtered.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon"><MapPin size={28} /></div><h3>Nenhum setor cadastrado</h3><p>Crie setores para organizar a operação.</p></div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Nome</th><th>Tipo de Serviço</th><th>Fiscais</th><th>Ações</th></tr></thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>{s.nome}</td>
                                        <td>
                                            {getServicoName(s.tipoServicoId) ? (
                                                <span className="badge badge-purple">{getServicoName(s.tipoServicoId)}</span>
                                            ) : <span style={{ color: 'var(--text-muted)' }}>Não definido</span>}
                                        </td>
                                        <td><span className="badge badge-info">{getFiscaisInSetor(s.id).length} fiscal(is)</span></td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-ghost btn-icon-sm" onClick={() => openEdit(s)}><Pencil size={14} /></button>
                                                <button className="btn btn-ghost btn-icon-sm" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Setor' : 'Novo Setor'}
                footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
                <div className="form-group">
                    <label className="form-label">Nome do Setor *</label>
                    <input className="form-input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Setor 01 - Centro" />
                </div>
                <div className="form-group">
                    <label className="form-label">Tipo de Serviço</label>
                    <select className="form-select" value={form.tipoServicoId} onChange={e => setForm({ ...form, tipoServicoId: e.target.value })}>
                        <option value="">Selecione o tipo de serviço</option>
                        {tiposServico.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                </div>
            </Modal>
        </div>
    );
}
