import React, { useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import useLocalStorage from '../../hooks/useLocalStorage';
import { ArrowLeft, Edit2, Grid2X2, Image as ImageIcon, List, Plus, Search, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const normalize = (value) => String(value ?? '').trim();

const Produtos = () => {
    const { produtos, categorias, removerProduto } = useData();
    const navigate = useNavigate();
    const toast = useToast();
    const confirm = useConfirm();
    const [termoBusca, setTermoBusca] = useState('');
    const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
    const [visualizacao, setVisualizacao] = useLocalStorage('produtos-visualizacao', 'cards');

    const opcoesCategoria = useMemo(() => {
        const nomes = [
            ...(categorias || []).map((categoria) => categoria.nome),
            ...(produtos || []).map((produto) => produto.categoria),
        ].map(normalize).filter(Boolean);
        return [...new Set(nomes)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [categorias, produtos]);

    const produtosFiltrados = useMemo(() => {
        const busca = termoBusca.trim().toLocaleLowerCase('pt-BR');
        return (produtos || []).filter((produto) => {
            const correspondeBusca = !busca || [produto.nome, produto.marca, produto.tipo, produto.categoria]
                .some((value) => normalize(value).toLocaleLowerCase('pt-BR').includes(busca));
            const correspondeCategoria = !categoriaSelecionada || normalize(produto.categoria) === categoriaSelecionada;
            return correspondeBusca && correspondeCategoria;
        });
    }, [categoriaSelecionada, produtos, termoBusca]);

    const handleDelete = async (id, nome) => {
        const ok = await confirm({
            title: 'Excluir produto',
            message: `Tem certeza que deseja excluir "${nome}"? Esta ação não pode ser desfeita.`,
            confirmLabel: 'Excluir',
            variant: 'danger',
        });
        if (!ok) return;

        const result = await removerProduto(id);
        if (!result.ok) {
            toast.error('Não foi possível excluir', result.message || 'Tente novamente.');
            return;
        }
        toast.success('Produto excluído', `"${nome}" foi removido com sucesso.`);
    };

    const actions = (produto) => (
        <div className="flex items-center justify-end gap-1">
            <button
                type="button"
                onClick={() => navigate(`/cadastros/produtos/editar/${produto.id}`)}
                    className="grid min-h-10 min-w-10 place-items-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                title={`Editar ${produto.nome}`}
                aria-label={`Editar ${produto.nome}`}
            >
                <Edit2 size={18} />
            </button>
            <button
                type="button"
                onClick={() => handleDelete(produto.id, produto.nome)}
                    className="grid min-h-10 min-w-10 place-items-center rounded-lg text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                title={`Excluir ${produto.nome}`}
                aria-label={`Excluir ${produto.nome}`}
            >
                <Trash2 size={18} />
            </button>
        </div>
    );

    return (
        <div className="container">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/cadastros" className="btn-back" aria-label="Voltar para cadastros">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="page-title">Produtos</h1>
                        <p className="page-subtitle">Gerencie seu catálogo de produtos</p>
                    </div>
                </div>
                <Link to="/cadastros/produtos/novo" className="btn btn-primary w-full md:w-auto">
                    <Plus size={20} />
                    Novo produto
                </Link>
            </div>

            <div className="card p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                        <input
                            type="search"
                            placeholder="Buscar por nome, marca, tipo ou categoria..."
                            className="input pl-10"
                            value={termoBusca}
                            onChange={(event) => setTermoBusca(event.target.value)}
                        />
                    </div>
                    <select
                        className="select lg:w-64"
                        value={categoriaSelecionada}
                        onChange={(event) => setCategoriaSelecionada(event.target.value)}
                        aria-label="Filtrar por categoria"
                    >
                        <option value="">Todas as categorias</option>
                        {opcoesCategoria.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
                    </select>
                    <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-600 dark:bg-slate-900" role="group" aria-label="Modo de visualização">
                        <button
                            type="button"
                            onClick={() => setVisualizacao('cards')}
                            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors lg:flex-none ${visualizacao === 'cards' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-300' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            aria-pressed={visualizacao === 'cards'}
                        >
                            <Grid2X2 size={17} /> Cards
                        </button>
                        <button
                            type="button"
                            onClick={() => setVisualizacao('lista')}
                            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors lg:flex-none ${visualizacao === 'lista' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-300' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            aria-pressed={visualizacao === 'lista'}
                        >
                            <List size={18} /> Lista
                        </button>
                    </div>
                </div>
                <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {produtosFiltrados.length} {produtosFiltrados.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                </p>
            </div>

            {!produtosFiltrados.length ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon"><ImageIcon size={28} /></div>
                        <p className="empty-state-title">Nenhum produto encontrado.</p>
                        <p className="empty-state-subtitle">Ajuste a busca ou o filtro de categoria.</p>
                    </div>
                </div>
            ) : visualizacao === 'lista' ? (
                <div className="card overflow-hidden p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-700 sm:hidden">
                        {produtosFiltrados.map((produto) => (
                            <article key={produto.id} className="flex items-center gap-3 p-4">
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-700">
                                    {produto.foto ? <img src={produto.foto} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><ImageIcon size={21} /></div>}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate font-semibold text-slate-900 dark:text-slate-100">{produto.nome}</h2>
                                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{[produto.marca, produto.tipo].filter(Boolean).join(' • ') || 'Sem marca ou tipo'}</p>
                                    <span className="badge badge-blue mt-2">{produto.categoria || 'Sem categoria'}</span>
                                </div>
                                {actions(produto)}
                            </article>
                        ))}
                    </div>
                    <div className="table-container hidden sm:block">
                        <table className="min-w-[720px]">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Categoria</th>
                                    <th>Marca</th>
                                    <th>Tipo</th>
                                    <th className="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {produtosFiltrados.map((produto) => (
                                    <tr key={produto.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-700">
                                                    {produto.foto ? <img src={produto.foto} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><ImageIcon size={20} /></div>}
                                                </div>
                                                <span className="font-semibold text-slate-900 dark:text-slate-100">{produto.nome}</span>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-blue">{produto.categoria || 'Sem categoria'}</span></td>
                                        <td>{produto.marca || '—'}</td>
                                        <td>{produto.tipo || '—'}</td>
                                        <td>{actions(produto)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {produtosFiltrados.map((produto) => (
                        <article key={produto.id} className="card group flex flex-col overflow-hidden p-0 hover:shadow-lg transition-all duration-200">
                            <div className="h-56 w-full bg-slate-100 dark:bg-slate-700 relative shrink-0 overflow-hidden border-b border-slate-100 dark:border-slate-700">
                                {produto.foto ? (
                                    <img src={produto.foto} alt={produto.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><ImageIcon size={48} /></div>
                                )}
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">{produto.categoria || 'Sem categoria'}</span>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 line-clamp-1" title={produto.nome}>{produto.nome}</h2>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                                        <span className="font-medium">{produto.marca || 'Sem marca'}</span>
                                        {produto.tipo && <><span className="text-slate-300 dark:text-slate-600">•</span><span className="line-clamp-1">{produto.tipo}</span></>}
                                    </div>
                                </div>
                                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">{actions(produto)}</div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Produtos;
