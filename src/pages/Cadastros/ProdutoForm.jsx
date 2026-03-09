import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../components/Toast';
import InlineCreate from '../../components/InlineCreate';
import { Save, ArrowLeft, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const ProdutoForm = () => {
    const { produtos, adicionarProduto, atualizarProduto, categorias, adicionarCategoria } = useData();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({ nome: '', marca: '', categoria: '', tipo: '', foto: '', cor: 'Preto' });

    useEffect(() => {
        if (isEditing) {
            const produto = produtos.find(p => p.id === id);
            if (produto) setFormData(produto);
            else navigate('/cadastros/produtos');
        }
    }, [id, produtos, navigate, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing) {
                await atualizarProduto(id, formData);
                toast.success('Produto atualizado!', `"${formData.nome}" foi atualizado com sucesso.`);
            } else {
                await adicionarProduto(formData);
                toast.success('Produto cadastrado!', `"${formData.nome}" foi adicionado ao sistema.`);
            }
            navigate('/cadastros/produtos');
        } finally {
            setLoading(false);
        }
    };

    const resizeImage = (file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                const MAX = 800;
                if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } }
                else { if (height > MAX) { width *= MAX / height; height = MAX; } }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande', 'Escolha uma imagem menor que 5 MB.'); return; }
        try {
            const resized = await resizeImage(file);
            setFormData({ ...formData, foto: resized });
        } catch {
            toast.error('Erro ao processar imagem', 'Tente novamente com outro arquivo.');
        }
    };

    return (
        <div className="container max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link to="/cadastros/produtos" className="btn-back shrink-0">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="page-title">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h1>
                    <p className="page-subtitle">
                        {isEditing ? 'Atualize as informações do produto' : 'Preencha os dados para cadastrar um novo produto'}
                    </p>
                </div>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="form-group">
                            <label className="label">Nome do Produto</label>
                            <input required type="text" className="input"
                                value={formData.nome} placeholder="Ex: iPhone 13"
                                onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                        </div>

                        <div className="form-group">
                            <label className="label">Marca</label>
                            <input type="text" className="input"
                                value={formData.marca} placeholder="Ex: Apple"
                                onChange={e => setFormData({ ...formData, marca: e.target.value })} />
                        </div>

                        <div className="form-group">
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="label mb-0">Categoria</label>
                                <InlineCreate
                                    label="Categoria"
                                    onSave={adicionarCategoria}
                                    onCreated={(item) => setFormData(prev => ({ ...prev, categoria: item.nome }))}
                                />
                            </div>
                            <select required className="select"
                                value={formData.categoria}
                                onChange={e => setFormData({ ...formData, categoria: e.target.value })}>
                                <option value="">Selecione uma categoria...</option>
                                {categorias.map(cat => <option key={cat.id} value={cat.nome}>{cat.nome}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="label">Tipo/Modelo</label>
                            <input type="text" className="input"
                                value={formData.tipo} placeholder="Ex: 128GB Preto"
                                onChange={e => setFormData({ ...formData, tipo: e.target.value })} />
                        </div>

                        {/* Photo upload */}
                        <div className="form-group md:col-span-2">
                            <label className="label">Foto do Produto</label>
                            <div className="flex flex-col items-center">
                                {formData.foto ? (
                                    <div className="relative group w-full sm:w-64 h-64">
                                        <label className="cursor-pointer block w-full h-full" title="Clique para alterar a foto">
                                            <div className="w-full h-full rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors shadow-md">
                                                <img src={formData.foto} alt="Preview" className="w-full h-full object-contain p-2" />
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, foto: '' })}
                                            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors ring-2 ring-white dark:ring-slate-800 z-10 scale-90 hover:scale-100"
                                            title="Remover foto"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer w-full">
                                        <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors bg-slate-50 dark:bg-slate-800/50 group">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <div className="p-4 bg-white dark:bg-slate-700 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                                    <ImageIcon className="w-10 h-10 text-blue-500" />
                                                </div>
                                                <p className="mb-2 text-lg text-slate-700 dark:text-slate-300 font-semibold">Clique para enviar uma foto</p>
                                                <p className="text-sm text-slate-400 dark:text-slate-500">PNG, JPG ou WEBP (Max 5MB)</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </div>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
                        <Link to="/cadastros/produtos" className="btn btn-secondary">Cancelar</Link>
                        <button type="submit" className="btn btn-primary px-8" disabled={loading}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProdutoForm;
