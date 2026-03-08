import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/UI/Modal';
import { Package, Plus, Pencil, Trash2, Search } from 'lucide-react';

export default function Materiais() {
    const { materiais, addMaterial, updateMaterial, deleteMaterial } = useData();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ nome: '', descricao: '', unidade: 'un' });

    const openAdd = () => {
        setEditItem(null);
        setForm({ nome: '', descricao: '', unidade: 'un' });
        setModalOpen(true);
    };

    const openEdit = (mat) => {
        setEditItem(mat);
        setForm({ nome: mat.nome, descricao: mat.descricao || '', unidade: mat.unidade || 'un' });
        setModalOpen(true);
    };

    const save = () => {
        if (!form.nome.trim()) return;
        if (editItem) {
            updateMaterial(editItem.id, form);
        } else {
            addMaterial(form);
        }
        setModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir este material?')) {
            deleteMaterial(id);
        }
    };

    const filtered = materiais.filter(m => m.nome.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Catálogo de Materiais</h1>
                    <p>Gerencie os materiais disponíveis para solicitação</p>
                </div>
            </div>

            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-bar">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder="Buscar material..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Novo Material</button>
                </div>
            </div>

            <div className="card">
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><Package size={28} /></div>
                        <h3>Nenhum material cadastrado</h3>
                        <p>Cadastre materiais para que os fiscais possam solicitar.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Material</th>
                                    <th>Descrição</th>
                                    <th>Unidade</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(m => (
                                    <tr key={m.id}>
                                        <td style={{ fontWeight: 600 }}>{m.nome}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{m.descricao || '—'}</td>
                                        <td>{m.unidade}</td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-ghost btn-icon-sm" onClick={() => openEdit(m)}><Pencil size={14} /></button>
                                                <button className="btn btn-ghost btn-icon-sm" onClick={() => handleDelete(m.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editItem ? 'Editar Material' : 'Novo Material'}
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={save}>Salvar</button>
                    </>
                }
            >
                <div className="form-group">
                    <label className="form-label">Nome do Material *</label>
                    <input className="form-input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Vassoura, Saco de Lixo 100L" />
                </div>
                <div className="form-group">
                    <label className="form-label">Descrição</label>
                    <textarea className="form-textarea" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição detalhada do material" />
                </div>
                <div className="form-group">
                    <label className="form-label">Unidade de Medida</label>
                    <select className="form-select" value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })}>
                        <option value="un">Unidade (un)</option>
                        <option value="par">Par</option>
                        <option value="kg">Quilograma (kg)</option>
                        <option value="lt">Litro (lt)</option>
                        <option value="cx">Caixa (cx)</option>
                        <option value="pct">Pacote (pct)</option>
                        <option value="rolo">Rolo</option>
                        <option value="pç">Peça (pç)</option>
                    </select>
                </div>
            </Modal>
        </div>
    );
}
