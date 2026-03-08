import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/UI/Modal';
import { Briefcase, Plus, Pencil, Trash2, Search } from 'lucide-react';

export default function Cargos() {
    const { cargos, addCargo, updateCargo, deleteCargo, funcionarios } = useData();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ nome: '' });

    const openAdd = () => {
        setEditItem(null);
        setForm({ nome: '' });
        setModalOpen(true);
    };

    const openEdit = (cargo) => {
        setEditItem(cargo);
        setForm({ nome: cargo.nome });
        setModalOpen(true);
    };

    const save = () => {
        if (!form.nome.trim()) return;
        if (editItem) {
            updateCargo(editItem.id, form);
        } else {
            addCargo(form);
        }
        setModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir este cargo?')) {
            deleteCargo(id);
        }
    };

    const getFuncsWithCargo = (cargoId) => funcionarios.filter(f => f.cargoId === cargoId).length;
    const filtered = cargos.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Cargos / Funções</h1>
                    <p>Gerencie os cargos disponíveis para os funcionários</p>
                </div>
            </div>

            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-bar">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder="Buscar cargo..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Novo Cargo</button>
                </div>
            </div>

            <div className="card">
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><Briefcase size={28} /></div>
                        <h3>Nenhum cargo cadastrado</h3>
                        <p>Crie cargos para facilitar o cadastro de funcionários.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Cargo</th>
                                    <th>Funcionários Vinculados</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.nome}</td>
                                        <td>
                                            <span className="badge badge-info">{getFuncsWithCargo(c.id)} funcionário(s)</span>
                                        </td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-ghost btn-icon-sm" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                                                <button className="btn btn-ghost btn-icon-sm" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
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
                title={editItem ? 'Editar Cargo' : 'Novo Cargo'}
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={save}>Salvar</button>
                    </>
                }
            >
                <div className="form-group">
                    <label className="form-label">Nome do Cargo *</label>
                    <input className="form-input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Gari, Varredor, Motorista" />
                </div>
            </Modal>
        </div>
    );
}
