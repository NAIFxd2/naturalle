import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Package, Send, Plus, Trash2 } from 'lucide-react';

export default function SolicitarMaterial() {
    const { user } = useAuth();
    const { funcionarios, materiais, addSolicitacao } = useData();

    const meusFuncionarios = funcionarios.filter(f => f.fiscalId === user.fiscalId);

    const [items, setItems] = useState([{ materialId: '', quantidade: 1, funcionarioId: '' }]);
    const [observacao, setObservacao] = useState('');
    const [success, setSuccess] = useState(false);

    const addItem = () => {
        setItems([...items, { materialId: '', quantidade: 1, funcionarioId: '' }]);
    };

    const removeItem = (idx) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx, field, value) => {
        const updated = [...items];
        updated[idx] = { ...updated[idx], [field]: value };
        setItems(updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const valid = items.every(item => item.materialId && item.quantidade > 0 && item.funcionarioId);
        if (!valid) return;

        items.forEach(item => {
            addSolicitacao({
                fiscalId: user.fiscalId,
                materialId: item.materialId,
                quantidade: parseInt(item.quantidade),
                funcionarioId: item.funcionarioId,
                observacao,
            });
        });

        setItems([{ materialId: '', quantidade: 1, funcionarioId: '' }]);
        setObservacao('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Solicitar Material</h1>
                    <p>Solicite materiais para seus funcionários</p>
                </div>
            </div>

            {success && (
                <div style={{
                    background: 'var(--accent-success-bg)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: 'var(--accent-success)',
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 20,
                    fontWeight: 500,
                    fontSize: '0.88rem'
                }}>
                    ✅ Solicitação enviada com sucesso! Aguardando aprovação da Vistoria.
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header">
                        <h3 className="card-title">Itens da Solicitação</h3>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={14} /> Adicionar Item</button>
                    </div>

                    {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 36px', gap: 12, marginBottom: 12, alignItems: 'end' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Material *</label>
                                <select className="form-select" value={item.materialId} onChange={e => updateItem(idx, 'materialId', e.target.value)} required>
                                    <option value="">Selecione</option>
                                    {materiais.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Funcionário *</label>
                                <select className="form-select" value={item.funcionarioId} onChange={e => updateItem(idx, 'funcionarioId', e.target.value)} required>
                                    <option value="">Selecione</option>
                                    {meusFuncionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">Qtd *</label>
                                <input className="form-input" type="number" min="1" value={item.quantidade} onChange={e => updateItem(idx, 'quantidade', e.target.value)} required />
                            </div>
                            {items.length > 1 && (
                                <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeItem(idx)} style={{ marginBottom: 0 }}>
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Observação (opcional)</label>
                        <textarea className="form-textarea" value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Motivo da solicitação, urgência, etc." />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>
                    <Send size={16} /> Enviar Solicitação
                </button>
            </form>
        </div>
    );
}
