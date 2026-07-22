import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const AuthContext = createContext();
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth`;

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const sessionGeneration = useRef(0);

    useEffect(() => {
        let active = true;
        const generation = ++sessionGeneration.current;
        const checkSession = async () => {
            try {
                const response = await fetch(`${API_URL}/verify`, { credentials: 'include' });
                const data = response.ok ? await response.json() : null;
                if (active && generation === sessionGeneration.current) setUsuario(data?.user || null);
            } catch (error) {
                console.error('Erro ao verificar sessao:', error);
                if (active && generation === sessionGeneration.current) setUsuario(null);
            } finally {
                if (active && generation === sessionGeneration.current) setLoading(false);
            }
        };
        checkSession();
        return () => { active = false; };
    }, []);

    const login = async (loginUsuario, senha) => {
        sessionGeneration.current += 1;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ usuario: loginUsuario, senha }) });
            const data = await response.json();
            if (!response.ok) return { success: false, message: data.message || 'Erro ao entrar.' };
            setUsuario(data.user);
            return { success: true, user: data.user };
        } catch (error) {
            console.error(error);
            return { success: false, message: 'Erro de conexao com o servidor.' };
        } finally {
            setLoading(false);
        }
    };

    const registrar = async (nome, loginUsuario, email, senha, nomeLoja = '') => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ nome, usuario: loginUsuario, email, senha, nomeLoja }) });
            const data = await response.json();
            return response.ok ? { success: true } : { success: false, message: data.message || 'Erro ao cadastrar.' };
        } catch (error) {
            console.error(error);
            return { success: false, message: 'Erro de conexao com o servidor.' };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        sessionGeneration.current += 1;
        try {
            await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
        } catch (error) {
            console.error('Erro no logout', error);
        } finally {
            setUsuario(null);
            localStorage.removeItem('revenda_smart_token');
            localStorage.removeItem('revenda_smart_user');
        }
    };

    const atualizarConta = async ({ nome, nomeLoja, fotoPerfil }) => {
        try {
            const response = await fetch(`${API_URL}/conta`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ nome, nomeLoja, fotoPerfil }) });
            const data = await response.json();
            if (!response.ok) return { success: false, message: data.message || 'Nao foi possivel atualizar a conta.' };
            setUsuario(data.user);
            return { success: true };
        } catch {
            return { success: false, message: 'Erro de conexao com o servidor.' };
        }
    };

    const alterarSenha = async ({ senhaAtual, novaSenha, confirmarNovaSenha }) => {
        try {
            const response = await fetch(`${API_URL}/senha`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ senhaAtual, novaSenha, confirmarNovaSenha }) });
            const data = await response.json();
            if (!response.ok) return { success: false, message: data.message || 'Nao foi possivel atualizar a senha.' };
            sessionGeneration.current += 1;
            setUsuario(null);
            return { success: true, message: data.message };
        } catch {
            return { success: false, message: 'Erro de conexao com o servidor.' };
        }
    };

    return <AuthContext.Provider value={{ usuario, loading, login, registrar, logout, atualizarConta, alterarSenha }}>{children}</AuthContext.Provider>;
};
