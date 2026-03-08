import { useState, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { BookOpen, Camera, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

// Deterministic seeded random for consistent daily theme assignment
function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getDDSDateKey(date) {
    return date.toISOString().split('T')[0];
}

function isDDSDay(date) {
    const day = date.getDay();
    return day === 2 || day === 4; // Terça e Quinta
}

// Compress image to reduce storage size
function compressImage(dataUrl, maxWidth = 800, quality = 0.4) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > maxWidth) { h = h * (maxWidth / w); w = maxWidth; }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = dataUrl;
    });
}

export default function DDSFiscal() {
    const { user } = useAuth();
    const { fiscais, setores, tiposServico, temasDDS, registrosDDS, addRegistroDDS } = useData();
    const fileInputRef = useRef(null);
    const [fotos, setFotos] = useState([]);
    const [uploading, setUploading] = useState(false);

    const today = new Date();
    const todayKey = getDDSDateKey(today);
    const isDDS = isDDSDay(today);

    // Find fiscal data
    const fiscal = fiscais.find(f => f.id === user.fiscalId);
    const setor = fiscal?.setorId ? setores.find(s => s.id === fiscal.setorId) : null;
    const tipoServico = setor?.tipoServicoId ? tiposServico.find(t => t.id === setor.tipoServicoId) : null;

    // Get available themes for this fiscal's service type
    const temasDisponiveis = tipoServico ? temasDDS.filter(t => t.tipoServicoId === tipoServico.id) : [];

    // Deterministic theme selection: date + service type = same theme for all fiscais with same service
    const temaSorteado = useMemo(() => {
        if (!isDDS || temasDisponiveis.length === 0 || !fiscal || !tipoServico) return null;
        const dateNum = parseInt(todayKey.replace(/-/g, ''), 10);
        const servicoHash = tipoServico.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const seed = dateNum + servicoHash;
        const idx = Math.floor(seededRandom(seed) * temasDisponiveis.length);
        return temasDisponiveis[idx];
    }, [isDDS, temasDisponiveis, fiscal, todayKey, tipoServico]);

    // Check if DDS already evidenced today
    const registroHoje = registrosDDS.find(r => r.fiscalId === user.fiscalId && r.date === todayKey);

    // Handle photo capture/upload (up to 5) with compression
    const handleFileChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (fotos.length >= 5) { alert('Máximo de 5 fotos!'); return; }
        const reader = new FileReader();
        reader.onloadend = async () => {
            const compressed = await compressImage(reader.result);
            setFotos(prev => [...prev, compressed]);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }, [fotos]);

    const removeFoto = useCallback((index) => {
        setFotos(prev => prev.filter((_, i) => i !== index));
    }, []);

    const submitDDS = useCallback(() => {
        if (!temaSorteado || fotos.length === 0) return;
        setUploading(true);
        addRegistroDDS({
            fiscalId: user.fiscalId,
            temaId: temaSorteado.id,
            date: todayKey,
            fotos: fotos,
            foto: fotos[0],
            setorId: setor?.id || null,
            tipoServicoId: tipoServico?.id || null,
        });
        setUploading(false);
        setFotos([]);
    }, [temaSorteado, fotos, user.fiscalId, todayKey, setor, tipoServico, addRegistroDDS]);

    // Last 10 DDS records
    const historico = registrosDDS
        .filter(r => r.fiscalId === user.fiscalId)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10);

    const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][today.getDay()];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>DDS — Diálogo Diário de Segurança</h1>
                    <p>{dayName}, {today.toLocaleDateString('pt-BR')}</p>
                </div>
            </div>

            {/* Alert for DDS days */}
            {isDDS && !registroHoje && temaSorteado && (
                <div style={{
                    background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)',
                    color: '#f59e0b', padding: '14px 20px', borderRadius: 'var(--radius-md)', marginBottom: 16,
                    fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600,
                }}>
                    <AlertTriangle size={20} />
                    <span>⚠️ HOJE É DIA DE DDS! Aplique o tema abaixo e envie a foto como evidência.</span>
                </div>
            )}

            {/* Today's DDS Card */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <h3 className="card-title">📋 DDS de Hoje</h3>
                </div>

                {!isDDS ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Clock size={32} style={{ marginBottom: 8 }} />
                        <h3 style={{ margin: '8px 0 4px', color: 'var(--text-secondary)' }}>Sem DDS hoje</h3>
                        <p>O DDS é aplicado às <strong>terças</strong> e <strong>quintas-feiras</strong>.</p>
                    </div>
                ) : !tipoServico ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <AlertTriangle size={32} style={{ marginBottom: 8, color: '#f59e0b' }} />
                        <p>Seu setor não tem um <strong>tipo de serviço</strong> vinculado. Contate o administrador.</p>
                    </div>
                ) : temasDisponiveis.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <BookOpen size={32} style={{ marginBottom: 8 }} />
                        <p>Nenhum tema DDS cadastrado para o serviço <strong>{tipoServico.nome}</strong>.</p>
                    </div>
                ) : registroHoje ? (
                    <div style={{ padding: 20, textAlign: 'center' }}>
                        <CheckCircle size={40} style={{ color: 'var(--accent-success)', marginBottom: 10 }} />
                        <h3 style={{ color: 'var(--accent-success)', margin: '0 0 8px' }}>✅ DDS Aplicado!</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Tema: <strong>{temasDDS.find(t => t.id === registroHoje.temaId)?.titulo || '—'}</strong></p>
                        {(registroHoje.fotos || [registroHoje.foto].filter(Boolean)).length > 0 && (
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                                {(registroHoje.fotos || [registroHoje.foto]).filter(Boolean).map((f, i) => (
                                    <img key={i} src={f} alt={`Evidência ${i + 1}`} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-color)' }} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ padding: 20 }}>
                        {/* Theme info */}
                        <div style={{
                            background: 'var(--bg-secondary)', padding: 20, borderRadius: 'var(--radius-md)', marginBottom: 16,
                            border: '1px solid var(--border-color)',
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: 4 }}>
                                TEMA SORTEADO — {tipoServico.nome}
                            </div>
                            <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem' }}>{temaSorteado?.titulo}</h2>
                            {temaSorteado?.descricao && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{temaSorteado.descricao}</p>
                            )}
                        </div>

                        {/* Multi-photo upload (up to 5) */}
                        <div style={{ marginBottom: 16 }}>
                            <label className="form-label">📸 Fotos de Evidência * ({fotos.length}/5)</label>
                            {fotos.length < 5 && (
                                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange}
                                    style={{ display: 'block', marginTop: 6, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: '100%' }} />
                            )}
                            {fotos.length >= 5 && (
                                <p style={{ color: 'var(--accent-success)', fontSize: '0.8rem', marginTop: 6 }}>✅ Limite de 5 fotos atingido</p>
                            )}
                        </div>

                        {fotos.length > 0 && (
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                                {fotos.map((foto, i) => (
                                    <div key={i} style={{ position: 'relative' }}>
                                        <img src={foto} alt={`Foto ${i + 1}`} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid var(--accent-primary)' }} />
                                        <button onClick={() => removeFoto(i)} style={{
                                            position: 'absolute', top: -6, right: -6, width: 22, height: 22,
                                            background: 'var(--accent-danger)', color: '#fff', border: 'none',
                                            borderRadius: '50%', cursor: 'pointer', fontSize: '0.7rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button className="btn btn-primary" onClick={submitDDS} disabled={fotos.length === 0 || uploading} style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: '1rem' }}>
                            <Camera size={18} /> Enviar Evidência do DDS ({fotos.length} foto{fotos.length !== 1 ? 's' : ''})
                        </button>
                    </div>
                )}
            </div>

            {/* History */}
            {historico.length > 0 && (
                <div className="card">
                    <div className="card-header"><h3 className="card-title">📅 Histórico de DDS</h3></div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Data</th><th>Tema</th><th>Evidência</th></tr></thead>
                            <tbody>
                                {historico.map(r => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 600 }}>{new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                        <td>{temasDDS.find(t => t.id === r.temaId)?.titulo || '—'}</td>
                                        <td>
                                            {r.foto ? (
                                                <img src={r.foto} alt="DDS" style={{ width: 50, height: 50, borderRadius: 6, objectFit: 'cover', cursor: 'pointer' }}
                                                    onClick={() => window.open(r.foto, '_blank')} />
                                            ) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
