import React, { useState } from 'react';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CrudBase = ({ title, items, onAdd, onRemove, backPath = '/cadastros' }) => {
    const [novoItem, setNovoItem] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (!novoItem.trim()) return;
        onAdd(novoItem);
        setNovoItem('');
    };

    return (
        <div className="container">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to={backPath} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-700 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-primary">{title}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Formulario */}
                <div className="card h-fit">
                    <h2 className="text-xl font-semibold mb-4 text-primary">Adicionar Novo</h2>
                    <form onSubmit={handleAdd}>
                        <div className="form-group">
                            <label className="label">Nome</label>
                            <input
                                type="text"
                                className="input"
                                value={novoItem}
                                onChange={(e) => setNovoItem(e.target.value)}
                                placeholder="Ex: Novo Item..."
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-full" style={{ width: '100%' }}>
                            <Plus size={18} />
                            Adicionar
                        </button>
                    </form>
                </div>

                {/* Lista */}
                <div className="card">
                    <h2 className="text-xl font-semibold mb-4 text-primary">Lista de Itens ({items.length})</h2>
                    {items.length === 0 ? (
                        <p className="text-secondary">Nenhum item cadastrado.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-md bg-gray-50 border border-gray-200 hover:border-blue-300 transition-colors group">
                                    <span className="text-primary font-medium pl-2">{item.nome}</span>
                                    <button
                                        onClick={() => onRemove(item.id)}
                                        className="p-2 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        title="Remover"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CrudBase;
