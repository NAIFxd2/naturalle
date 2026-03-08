import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const DEFAULT_ADMIN = {
    id: 'superadmin-001',
    username: 'admin',
    password: 'admin123',
    name: 'Administrador',
    role: 'superadmin'
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('co_auth_user');
        if (saved) {
            setUser(JSON.parse(saved));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        // Check superadmin (hardcoded)
        if (username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) {
            const u = { id: DEFAULT_ADMIN.id, username: DEFAULT_ADMIN.username, name: DEFAULT_ADMIN.name, role: DEFAULT_ADMIN.role };
            setUser(u);
            localStorage.setItem('co_auth_user', JSON.stringify(u));
            return { success: true, user: u };
        }

        // Check fiscais in Supabase
        const { data: fiscais } = await supabase
            .from('fiscais')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .limit(1);

        if (fiscais && fiscais.length > 0) {
            const fiscal = fiscais[0];
            const u = { id: fiscal.id, username: fiscal.username, name: fiscal.nome, role: 'fiscal', fiscalId: fiscal.id };
            setUser(u);
            localStorage.setItem('co_auth_user', JSON.stringify(u));
            return { success: true, user: u };
        }

        // Check system users in Supabase
        const { data: sysUsers } = await supabase
            .from('sys_users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .limit(1);

        if (sysUsers && sysUsers.length > 0) {
            const sysUser = sysUsers[0];
            const u = { id: sysUser.id, username: sysUser.username, name: sysUser.name, role: sysUser.role };
            setUser(u);
            localStorage.setItem('co_auth_user', JSON.stringify(u));
            return { success: true, user: u };
        }

        return { success: false, error: 'Usuário ou senha inválidos' };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('co_auth_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
