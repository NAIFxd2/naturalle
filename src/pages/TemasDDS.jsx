import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/UI/Modal';
import { BookOpen, Plus, Pencil, Trash2, Search } from 'lucide-react';

export default function TemasDDS() {
    const { temasDDS, addTemaDDS, updateTemaDDS, deleteTemaDDS, tiposServico } = useData();
    const [search, setSearch] = useState('');
    const [filterServico, setFilterServico] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ titulo: '', descricao: '', tipoServicoId: '' });

    const openAdd = () => { setEditItem(null); setForm({ titulo: '', descricao: '', tipoServicoId: '' }); setModalOpen(true); };
    const openEdit = (item) => { setEditItem(item); setForm({ titulo: item.titulo, descricao: item.descricao || '', tipoServicoId: item.tipoServicoId || '' }); setModalOpen(true); };

    const save = () => {
        if (!form.titulo.trim() || !form.tipoServicoId) return;
        editItem ? updateTemaDDS(editItem.id, form) : addTemaDDS(form);
        setModalOpen(false);
    };

    const handleDelete = (id) => { if (confirm('Excluir este tema DDS?')) deleteTemaDDS(id); };
    const getServicoName = (id) => tiposServico.find(t => t.id === id)?.nome || '—';

    let filtered = temasDDS.filter(t => t.titulo.toLowerCase().includes(search.toLowerCase()));
    if (filterServico) filtered = filtered.filter(t => t.tipoServicoId === filterServico);

    return (
        <div>
            <div className="page-header">
                <div><h1>Temas de DDS</h1><p>Cadastre temas para o Diálogo Diário de Segurança vinculados a tipos de serviço</p></div>
            </div>
            <div className="toolbar">
                <div className="toolbar-left" style={{ gap: 8, display: 'flex' }}>
                    <div className="search-bar"><Search size={16} className="search-icon" /><input type="text" placeholder="Buscar tema..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <select className="form-select" style={{ maxWidth: 200 }} value={filterServico} onChange={e => setFilterServico(e.target.value)}>
                        <option value="">Todos os serviços</option>
                        {tiposServico.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Novo Tema</button>
                </div>
            </div>
            <div className="card">
                {filtered.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon"><BookOpen size={28} /></div><h3>Nenhum tema cadastrado</h3><p>Crie temas de DDS vinculados aos tipos de serviço.</p></div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Tema</th><th>Descrição</th><th>Tipo de Serviço</th><th>Ações</th></tr></thead>
                            <tbody>
                                {filtered.map(t => (
                                    <tr key={t.id}>
                                        <td style={{ fontWeight: 600 }}>{t.titulo}</td>
                                        <td style={{ color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.descricao || '—'}</td>
                                        <td><span className="badge badge-purple">{getServicoName(t.tipoServicoId)}</span></td>
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
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Editar Tema' : 'Novo Tema DDS'}
                footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
                <div className="form-group">
                    <label className="form-label">Título do Tema *</label>
                    <input className="form-input" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Uso correto de EPI, Prevenção de acidentes" />
                </div>
                <div className="form-group">
                    <label className="form-label">Descrição</label>
                    <textarea className="form-textarea" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhes e pontos a abordar neste tema" />
                </div>
                <div className="form-group">
                    <label className="form-label">Tipo de Serviço *</label>
                    <select className="form-select" value={form.tipoServicoId} onChange={e => setForm({ ...form, tipoServicoId: e.target.value })}>
                        <option value="">Selecione</option>
                        {tiposServico.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                </div>
            </Modal>
        </div>
    );
}
