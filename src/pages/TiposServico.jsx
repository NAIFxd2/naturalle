import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/UI/Modal';
import { Layers, Plus, Pencil, Trash2, Search } from 'lucide-react';

export default function TiposServico() {
    const { tiposServico, addTipoServico, updateTipoServico, deleteTipoServico, setores } = useData();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ nome: '' });

    const openAdd = () => { setEditItem(null); setForm({ nome: '' }); setModalOpen(true); };
    const openEdit = (item) => { setEditItem(item); setForm({ nome: item.nome }); setModalOpen(true); };

    const save = () => {
        if (!form.nome.trim()) return;
        editItem ? updateTipoServico(editItem.id, form) : addTipoServico(form);
        setModalOpen(false);
    };

    const handleDelete = (id) => { if (confirm('Excluir este tipo de serviço?')) deleteTipoServico(id); };
    const getSetoresCount = (id) => setores.filter(s => s.tipoServicoId === id).length;
    const filtered = tiposServico.filter(t => t.nome.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            <div className="page-header">
                <div><h1>Tipos de Serviço</h1><p>Gerencie os tipos de serviço para vincular aos setores e DDS</p></div>
            </div>
            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-bar"><Search size={16} className="search-icon" /><input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Novo Tipo</button>
                </div>
            </div>
            <div className="card">
                {filtered.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon"><Layers size={28} /></div><h3>Nenhum tipo de serviço</h3><p>Crie tipos como "Varrição", "Roçagem", "Coleta" etc.</p></div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Tipo de Serviço</th><th>Setores Vinculados</th><th>Ações</th></tr></thead>
                            <tbody>
                                {filtered.map(t => (
                                    <tr key={t.id}>
                                        <td style={{ fontWeight: 600 }}>{t.nome}</td>
                                        <td><span className="badge badge-info">{getSetoresCount(t.id)} setor(es)</span></td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-ghost btn-icon-sm" onClick={() => openEdit(t)}><Pencil size={14} /></button>
                                                <button className="btn btn-ghost btn-icon-sm" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Tipo' : 'Novo Tipo de Serviço'}
                footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
                <div className="form-group">
                    <label className="form-label">Nome *</label>
                    <input className="form-input" value={form.nome} onChange={e => setForm({ nome: e.target.value })} placeholder="Ex: Varrição, Roçagem, Coleta" />
                </div>
            </Modal>
        </div>
    );
}
