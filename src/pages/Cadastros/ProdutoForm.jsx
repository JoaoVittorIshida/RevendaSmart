import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Save, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const ProdutoForm = () => {
    const { produtos, adicionarProduto, atualizarProduto, categorias } = useData();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        nome: '',
        marca: '',
        categoria: '',
        tipo: '',
        foto: ''
    });

    useEffect(() => {
        if (isEditing) {
            const produto = produtos.find(p => p.id === id);
            if (produto) {
                setFormData(produto);
            } else {
                navigate('/cadastros/produtos'); // Redirect if not found
            }
        }
    }, [id, produtos, navigate, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isEditing) {
            await atualizarProduto(id, formData);
            alert('Produto atualizado com sucesso!');
        } else {
            await adicionarProduto(formData);
            alert('Produto cadastrado com sucesso!');
        }
        navigate('/cadastros/produtos');
    };

    // Utility: Resize Image
    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('A imagem é muito grande! tente uma menor que 5MB.');
                return;
            }

            try {
                const resizedImage = await resizeImage(file);
                setFormData({ ...formData, foto: resizedImage });
            } catch (error) {
                console.error("Erro ao redimensionar imagem", error);
                alert("Erro ao processar imagem.");
            }
        }
    };

    return (
        <div className="container max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/cadastros/produtos" className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-700 transition-colors shrink-0">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">
                        {isEditing ? 'Editar Produto' : 'Novo Produto'}
                    </h1>
                    <p className="text-secondary text-sm md:text-base">
                        {isEditing ? 'Atualize as informações do produto' : 'Preencha os dados para cadastrar um novo produto'}
                    </p>
                </div>
            </div>

            <div className="card shadow-lg border-blue-100 p-6 md:p-8">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                            <label className="label">Nome do Produto</label>
                            <input
                                required
                                type="text"
                                className="input"
                                value={formData.nome}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                placeholder="Ex: iPhone 13"
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">Marca</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.marca}
                                onChange={e => setFormData({ ...formData, marca: e.target.value })}
                                placeholder="Ex: Apple"
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">Categoria</label>
                            <select
                                required
                                className="select"
                                value={formData.categoria}
                                onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                            >
                                <option value="">Selecione uma categoria...</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="label">Tipo/Modelo</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.tipo}
                                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                placeholder="Ex: 128GB Preto"
                            />
                        </div>

                        <div className="form-group md:col-span-2">
                            <label className="label">Foto do Produto</label>
                            <div className="flex flex-col items-center">
                                {formData.foto ? (
                                    <div className="relative group w-full sm:w-64 h-64">
                                        <label className="cursor-pointer block w-full h-full" title="Clique para alterar a foto">
                                            <div className="w-full h-full rounded-lg bg-gray-100 overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors shadow-md relative">
                                                <img
                                                    src={formData.foto}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain p-2"
                                                />
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setFormData({ ...formData, foto: '' });
                                            }}
                                            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors ring-2 ring-white z-10 scale-90 hover:scale-100"
                                            title="Remover foto"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer w-full">
                                        <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors bg-gray-50 group">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                                    <ImageIcon className="w-10 h-10 text-blue-500" />
                                                </div>
                                                <p className="mb-2 text-lg text-gray-700 font-semibold">Clique para enviar uma foto</p>
                                                <p className="text-sm text-gray-400">PNG, JPG ou WEBP (Max 5MB)</p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <Link to="/cadastros/produtos" className="btn btn-secondary">
                            Cancelar
                        </Link>
                        <button type="submit" className="btn btn-primary px-8">
                            <Save size={18} />
                            {isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProdutoForm;
