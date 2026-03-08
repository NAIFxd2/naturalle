import { useAuth } from '../../contexts/AuthContext';
import { Bell, LogOut } from 'lucide-react';

export default function Header({ title }) {
    const { user, logout } = useAuth();

    return (
        <header className="header">
            <h1 className="header-title">{title}</h1>
            <div className="header-actions">
                <button className="header-btn" onClick={logout}>
                    <LogOut size={16} />
                    Sair
                </button>
            </div>
        </header>
    );
}
