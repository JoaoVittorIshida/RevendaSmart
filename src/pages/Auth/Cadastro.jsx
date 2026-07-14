import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Store, User, Lock, Type, ArrowLeft } from 'lucide-react';
import ApiHealthIndicator from '../../components/ApiHealthIndicator';
import { useApiHealth } from '../../hooks/useApiHealth';

const Cadastro = () => {
    const { registrar, loading } = useAuth();
    const navigate = useNavigate();
    const apiHealth = useApiHealth();

    const [formData, setFormData] = useState({
        nome: '',
        usuario: '',
        senha: '',
        nomeLoja: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!apiHealth.isOnline) {
            setError('Servidor iniciando. Aguarde alguns segundos e tente novamente.');
            return;
        }

        if (formData.senha.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres.');
            return;
        }

        try {
            const result = await registrar(formData.nome, formData.usuario, formData.senha, formData.nomeLoja);
            if (result.success) {
                navigate('/login');
            } else {
                setError(result.message);
            }
        } catch {
            setError('Ocorreu um erro ao criar a conta.');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <ApiHealthIndicator isOnline={apiHealth.isOnline} status={apiHealth.status} />
                <div className="auth-header">
                    <Link to="/login" className="auth-back-link">
                        <ArrowLeft size={16} /> Voltar
                    </Link>
                    <h1 className="auth-title">Criar Conta</h1>
                    <p className="auth-subtitle">Preencha os dados abaixo</p>
                </div>

                <div className="auth-content">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="auth-input-group">
                            <label className="auth-input-label">Nome Completo</label>
                            <div className="relative">
                                <div className="auth-input-icon">
                                    <Type size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="auth-input"
                                    placeholder="Ex: João da Silva"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-input-label">Nome da Loja <span className="font-normal opacity-70">(opcional)</span></label>
                            <div className="relative">
                                <div className="auth-input-icon">
                                    <Store size={18} />
                                </div>
                                <input
                                    type="text"
                                    maxLength="100"
                                    className="auth-input"
                                    placeholder="Ex: Tech do João"
                                    value={formData.nomeLoja}
                                    onChange={e => setFormData({ ...formData, nomeLoja: e.target.value })}
                                />
                            </div>
                        </div>

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
                                    placeholder="Ex: joaosilva"
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
                                    minLength="8"
                                    className="auth-input"
                                    placeholder="Mínimo 4 caracteres"
                                    value={formData.senha}
                                    onChange={e => setFormData({ ...formData, senha: e.target.value })}
                                />
                            </div>
                        </div>

                        {!apiHealth.isOnline && (
                            <div className="auth-server-warning">
                                Servidor iniciando. O cadastro será liberado quando API e banco estiverem online.
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !apiHealth.isOnline}
                            className="auth-button"
                        >
                            {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Cadastro;
