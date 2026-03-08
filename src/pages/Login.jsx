import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, LogIn } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(username, password);
            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Erro ao conectar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="logo-area">
                    <div className="logo-icon">
                        <ShieldCheck size={28} color="#fff" />
                    </div>
                    <h1>Controle Operacional</h1>
                    <p className="subtitle">Fiscalização Urbana — Limpeza Urbana</p>
                </div>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Usuário</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Digite seu usuário"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Senha</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Digite sua senha"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: 8, padding: '12px 20px' }}
                        disabled={loading}
                    >
                        <LogIn size={18} />
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
