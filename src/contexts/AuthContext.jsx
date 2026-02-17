import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // API URL base
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const API_URL = `${BASE_URL}/api/auth`;

    const [usuario, setUsuario] = useState(() => {
        try {
            const storedUser = localStorage.getItem('revenda_smart_user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            return null;
        }
    });

    const [token, setToken] = useState(() => localStorage.getItem('revenda_smart_token'));
    const [loading, setLoading] = useState(false);

    const login = async (loginUsuario, senha) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario: loginUsuario, senha })
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Erro ao entrar.' };
            }

            // Sucesso
            const { token, user } = data;

            // Persistir Token e Usuário/
            localStorage.setItem('revenda_smart_token', token);
            localStorage.setItem('revenda_smart_user', JSON.stringify(user));

            setToken(token);
            setUsuario(user);

            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, message: 'Erro de conexão com o servidor.' };
        } finally {
            setLoading(false);
        }
    };

    const registrar = async (nome, loginUsuario, senha) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, usuario: loginUsuario, senha })
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Erro ao cadastrar.' };
            }

            // Após registro, podemos fazer login automático ou pedir para usuário logar.
            // Aqui vamos pedir para logar para seguir fluxo simples.
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, message: 'Erro de conexão com o servidor.' };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('revenda_smart_token');
        localStorage.removeItem('revenda_smart_user');
        setToken(null);
        setUsuario(null);
    };

    const value = {
        usuario,
        token,
        loading,
        login,
        registrar,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
