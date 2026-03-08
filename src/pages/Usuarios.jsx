import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import Modal from '../components/UI/Modal';
import { Settings, Plus, Pencil, Trash2, Search } from 'lucide-react';

export default function Usuarios() {
    const { sysUsers, addSysUser, updateSysUser, deleteSysUser } = useData();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', username: '', password: '', role: 'vistoria' });

    const openAdd = () => {
        setEditItem(null);
        setForm({ name: '', username: '', password: '', role: 'vistoria' });
        setModalOpen(true);
    };

    const openEdit = (u) => {
        setEditItem(u);
        setForm({ name: u.name, username: u.username, password: u.password, role: u.role });
        setModalOpen(true);
    };

    const save = () => {
        if (!form.name.trim() || !form.username.trim() || !form.password.trim()) return;
        if (editItem) {
            updateSysUser(editItem.id, form);
        } else {
            addSysUser(form);
        }
        setModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza?')) deleteSysUser(id);
    };

    const roleLabels = { vistoria: 'Vistoria', almoxarifado: 'Almoxarifado', sesmt: 'SESMT', dp: 'Depto. Pessoal' };
    const roleBadge = { vistoria: 'badge-info', almoxarifado: 'badge-purple', sesmt: 'badge-success', dp: 'badge-info' };

    const filtered = sysUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Usuários do Sistema</h1>
                    <p>Gerencie os acessos de Vistoria, Almoxarifado, SESMT e Depto. Pessoal</p>
                </div>
            </div>

            <div className="toolbar">
                <div className="toolbar-left">
                    <div className="search-bar">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="toolbar-right">
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Novo Usuário</button>
                </div>
            </div>

            <div className="card">
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><Settings size={28} /></div>
                        <h3>Nenhum usuário cadastrado</h3>
                        <p>Crie usuários para os setores de Vistoria e Almoxarifado.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Usuário</th>
                                    <th>Senha</th>
                                    <th>Perfil</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                                        <td>{u.username}</td>
                                        <td><code style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4, fontSize: '0.82rem' }}>{u.password}</code></td>
                                        <td><span className={`badge ${roleBadge[u.role] || 'badge-neutral'}`}>{roleLabels[u.role] || u.role}</span></td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-ghost btn-icon-sm" onClick={() => openEdit(u)}><Pencil size={14} /></button>
                                                <button className="btn btn-ghost btn-icon-sm" onClick={() => handleDelete(u.id)}><Trash2 size={14} /></button>
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
                title={editItem ? 'Editar Usuário' : 'Novo Usuário'}
                footer={
                    <>
                        <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={save}>Salvar</button>
                    </>
                }
            >
                <div className="form-group">
                    <label className="form-label">Nome Completo *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do usuário" />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Usuário (Login) *</label>
                        <input className="form-input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="usuario.login" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Senha *</label>
                        <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Senha" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Perfil de Acesso *</label>
                    <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                        <option value="vistoria">Vistoria</option>
                        <option value="almoxarifado">Almoxarifado</option>
                        <option value="sesmt">SESMT</option>
                        <option value="dp">Departamento Pessoal</option>
                    </select>
                </div>
            </Modal>
        </div>
    );
}
