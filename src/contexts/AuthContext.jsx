import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // API URL base
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const API_URL = `${BASE_URL}/api/auth`;

    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await fetch(`${API_URL}/verify`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsuario(data.user);
                } else {
                    setUsuario(null);
                }
            } catch (error) {
                console.error("Erro ao verificar sessão:", error);
                setUsuario(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const login = async (loginUsuario, senha) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ usuario: loginUsuario, senha })
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, message: data.message || 'Erro ao entrar.' };
            }

            // Sucesso
            const { user } = data;

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
                credentials: 'include',
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

    const logout = async () => {
        try {
            await fetch(`${API_URL}/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error("Erro no logout", error);
        } finally {
            setUsuario(null);
            // Fallback clear if moving from old version
            localStorage.removeItem('revenda_smart_token');
            localStorage.removeItem('revenda_smart_user');
        }
    };

    const value = {
        usuario,
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
