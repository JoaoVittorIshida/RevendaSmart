import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { token, usuario } = useAuth();
    // Usa a variável de ambiente se existir, senão usa localhost
    const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api';

    const [produtos, setProdutos] = useState([]);
    const [itensEstoque, setItensEstoque] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [canaisVenda, setCanaisVenda] = useState([]);
    const [canaisCompra, setCanaisCompra] = useState([]);

    // Helper para requisições com Auth
    const authFetch = useCallback(async (endpoint, options = {}) => {
        if (!token) return null;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Token expirado ou inválido
            // Poderia chamar um logout aqui se tivesse acesso à função
        }

        return response;
    }, [token]);

    const fetchData = useCallback(async () => {
        if (!token) return;

        try {
            const [resProd, resEstoque, resCat, resCanalV, resCanalC] = await Promise.all([
                authFetch('/produtos'),
                authFetch('/estoque'),
                authFetch('/dados/categorias'),
                authFetch('/dados/canais-venda'),
                authFetch('/dados/canais-compra')
            ]);

            if (resProd?.ok) setProdutos(await resProd.json());
            if (resEstoque?.ok) setItensEstoque(await resEstoque.json());
            if (resCat?.ok) setCategorias(await resCat.json());
            if (resCanalV?.ok) setCanaisVenda(await resCanalV.json());
            if (resCanalC?.ok) setCanaisCompra(await resCanalC.json());

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    }, [authFetch, token]);

    // Carregar dados ao entrar ou mudar usuário
    useEffect(() => {
        if (usuario && token) {
            fetchData();
        } else {
            setProdutos([]);
            setItensEstoque([]);
            setCategorias([]);
            setCanaisVenda([]);
            setCanaisCompra([]);
        }
    }, [usuario, token, fetchData]);


    // --- Actions: Produtos ---
    const adicionarProduto = async (produto) => {
        try {
            const res = await authFetch('/produtos', {
                method: 'POST',
                body: JSON.stringify(produto)
            });
            if (res.ok) {
                const novo = await res.json();
                setProdutos(prev => [...prev, novo]);
                return novo;
            }
        } catch (error) { console.error(error); }
    };

    const atualizarProduto = async (id, dadosAtualizados) => {
        try {
            const res = await authFetch(`/produtos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(dadosAtualizados)
            });
            if (res.ok) {
                setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...dadosAtualizados } : p));
            }
        } catch (error) { console.error(error); }
    };

    const removerProduto = async (id) => {
        try {
            const res = await authFetch(`/produtos/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setProdutos(prev => prev.filter(p => p.id !== id));
            }
        } catch (error) { console.error(error); }
    };

    // --- Actions: Estoque ---
    const adicionarEstoqueEmLote = async (dadosLote) => {
        try {
            const res = await authFetch('/estoque/entrada', {
                method: 'POST',
                body: JSON.stringify(dadosLote)
            });
            if (res.ok) {
                // Como gera muitos IDs, recarregamos o estoque para simplificar
                const resEstoque = await authFetch('/estoque');
                if (resEstoque.ok) setItensEstoque(await resEstoque.json());
            }
        } catch (error) { console.error(error); }
    };

    const venderItem = async (id, dadosVenda) => {
        try {
            const res = await authFetch(`/estoque/${id}/venda`, {
                method: 'POST',
                body: JSON.stringify(dadosVenda)
            });
            if (res.ok) {
                setItensEstoque(prev => prev.map(item =>
                    item.id === id
                        ? { ...item, ...dadosVenda, status: 'vendido', dataVenda: dadosVenda.dataVenda }
                        : item
                ));
            }
        } catch (error) { console.error(error); }
    };

    const atualizarItemEstoque = async (id, dados) => {
        // Not implemented in backend yet
        console.warn("Update Stock not fully implemented via API yet");
    };

    const removerItemEstoque = async (id) => {
        try {
            const res = await authFetch(`/estoque/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setItensEstoque(prev => prev.filter(item => item.id !== id));
            }
        } catch (error) { console.error(error); }
    };

    // --- Actions: Auxiliares ---
    // Helpers genéricos para evitar repetição
    const createAux = async (endpoint, nome, setState) => {
        try {
            const res = await authFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ nome })
            });
            if (res.ok) {
                const novo = await res.json();
                setState(prev => [...prev, novo]);
            }
        } catch (error) { console.error(error); }
    };

    const deleteAux = async (endpoint, id, setState) => {
        try {
            const res = await authFetch(`${endpoint}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setState(prev => prev.filter(item => item.id !== id));
            }
        } catch (error) { console.error(error); }
    };

    const adicionarCategoria = (nome) => createAux('/dados/categorias', nome, setCategorias);
    const removerCategoria = (id) => deleteAux('/dados/categorias', id, setCategorias);

    const adicionarCanalVenda = (nome) => createAux('/dados/canais-venda', nome, setCanaisVenda);
    const removerCanalVenda = (id) => deleteAux('/dados/canais-venda', id, setCanaisVenda);

    const adicionarCanalCompra = (nome) => createAux('/dados/canais-compra', nome, setCanaisCompra);
    const removerCanalCompra = (id) => deleteAux('/dados/canais-compra', id, setCanaisCompra);

    // --- Derived State: Vendas (Histórico) ---
    // Mantém a mesma lógica de filtro do lado do cliente para performance imediata
    const vendas = itensEstoque
        .filter(item => item.status === 'vendido')
        .map(item => {
            const produto = produtos.find(p => p.id === item.produtoId);
            const canal = canaisVenda.find(c => c.id === item.canalVendaId);
            return {
                id: item.id,
                data: item.dataVenda,
                produto: produto ? produto.nome : 'Produto excluído',
                categoria: produto ? produto.categoria : 'Sem categoria',
                canal: canal ? canal.nome : 'Não informado',
                custo: Number(item.precoCusto),
                valor: Number(item.precoVenda)
            };
        })
        .sort((a, b) => new Date(b.data) - new Date(a.data));

    const value = {
        produtos,
        itensEstoque,
        vendas,
        categorias,
        canaisVenda,
        canaisCompra,
        adicionarProduto,
        atualizarProduto,
        removerProduto,
        adicionarEstoqueEmLote,
        venderItem,
        atualizarItemEstoque,
        removerItemEstoque,
        adicionarCategoria,
        removerCategoria,
        adicionarCanalVenda,
        removerCanalVenda,
        adicionarCanalCompra,
        removerCanalCompra
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
