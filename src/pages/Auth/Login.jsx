import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        usuario: '',
        senha: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const result = await login(formData.usuario, formData.senha);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Ocorreu um erro ao fazer login.');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-brand-icon">
                        <span>RS</span>
                    </div>
                    <h1 className="auth-title">RevendaSmart</h1>
                    <p className="auth-subtitle">Entre para acessar o sistema</p>
                </div>

                <div className="auth-content">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="auth-input-group">
                            <label className="auth-input-label">Usuário</label>
                            <div className="relative">
                                <div className="auth-input-icon">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="auth-input"
                                    placeholder="Seu usuário"
                                    value={formData.usuario}
                                    onChange={e => setFormData({ ...formData, usuario: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-input-label">Senha</label>
                            <div className="relative">
                                <div className="auth-input-icon">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="auth-input"
                                    placeholder="Sua senha"
                                    value={formData.senha}
                                    onChange={e => setFormData({ ...formData, senha: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="auth-button"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Não tem conta?{' '}
                        <Link to="/cadastro" className="auth-link">
                            Criar conta
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
