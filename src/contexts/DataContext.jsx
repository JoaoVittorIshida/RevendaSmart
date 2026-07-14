import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { usuario } = useAuth();
    const currentUserId = useRef(usuario?.id || null);
    const requestGeneration = useRef(0);
    currentUserId.current = usuario?.id || null;

    const [produtos, setProdutos] = useState([]);
    const [itensEstoque, setItensEstoque] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [canaisVenda, setCanaisVenda] = useState([]);
    const [canaisCompra, setCanaisCompra] = useState([]);
    const [vendas, setVendas] = useState([]);
    const [anuncios, setAnuncios] = useState([]);
    const [analises, setAnalises] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const authFetch = useCallback(async (endpoint, options = {}) => {
        if (!usuario) return null;
        return fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers },
            credentials: 'include'
        });
    }, [usuario]);

    const fetchData = useCallback(async () => {
        if (!usuario) return;
        const userId = usuario.id;
        const generation = ++requestGeneration.current;
        setIsLoading(true);
        try {
            const responses = await Promise.all([
                authFetch('/produtos'), authFetch('/estoque'), authFetch('/dados/categorias'),
                authFetch('/dados/canais-venda'), authFetch('/dados/canais-compra'), authFetch('/vendas'), authFetch('/anuncios'), authFetch('/analises')
            ]);
            const [resProd, resStock, resCat, resSalesChannels, resBuyChannels, resSales, resAds, resAnalytics] = responses;
            const payloads = await Promise.all(responses.map((response) => response?.ok ? response.json() : Promise.resolve(null)));
            if (generation !== requestGeneration.current || currentUserId.current !== userId) return;
            const [products, stock, categories, salesChannels, buyChannels, sales, ads, analytics] = payloads;
            if (resProd?.ok) setProdutos(products);
            if (resStock?.ok) setItensEstoque(stock);
            if (resCat?.ok) setCategorias(categories);
            if (resSalesChannels?.ok) setCanaisVenda(salesChannels);
            if (resBuyChannels?.ok) setCanaisCompra(buyChannels);
            if (resSales?.ok) setVendas(sales);
            if (resAds?.ok) setAnuncios(ads);
            if (resAnalytics?.ok) setAnalises(analytics);
        } catch (error) {
            if (generation === requestGeneration.current && currentUserId.current === userId) console.error('Erro ao carregar dados:', error);
        } finally {
            if (generation === requestGeneration.current && currentUserId.current === userId) setIsLoading(false);
        }
    }, [authFetch, usuario]);

    useEffect(() => {
        requestGeneration.current += 1;
        if (usuario) {
            fetchData();
            return;
        }
        setProdutos([]); setItensEstoque([]); setCategorias([]); setCanaisVenda([]); setCanaisCompra([]); setVendas([]); setAnuncios([]); setAnalises(null); setIsLoading(false);
    }, [fetchData, usuario]);

    const request = async (endpoint, options, success) => {
        try {
            const res = await authFetch(endpoint, options);
            const data = await res?.json().catch(() => ({}));
            if (res?.ok) {
                if (success) await success(data);
                return { ok: true, ...data };
            }
            return { ok: false, message: data.message || 'Nao foi possivel concluir a operacao.' };
        } catch (error) {
            console.error(error);
            return { ok: false, message: 'Erro de conexao com o servidor.' };
        }
    };

    const adicionarProduto = (produto) => request('/produtos', { method: 'POST', body: JSON.stringify(produto) }, async (novo) => setProdutos((items) => [...items, novo]));
    const atualizarProduto = (id, dados) => request(`/produtos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }, fetchData);
    const removerProduto = (id) => request(`/produtos/${id}`, { method: 'DELETE' }, fetchData);
    const adicionarEstoqueEmLote = (dados) => request('/estoque/entrada', { method: 'POST', body: JSON.stringify(dados) }, fetchData);
    const venderItem = (id, dados) => request(`/estoque/${id}/venda`, { method: 'POST', body: JSON.stringify(dados) }, fetchData);
    const cancelarVenda = (id) => request(`/estoque/${id}/venda`, { method: 'DELETE' }, fetchData);
    const reservarItem = (id, dados) => request(`/estoque/${id}/reserva`, { method: 'POST', body: JSON.stringify(dados) }, fetchData);
    const liberarReserva = (id) => request(`/estoque/${id}/reserva`, { method: 'DELETE' }, fetchData);
    const removerItemEstoque = (id) => request(`/estoque/${id}`, { method: 'DELETE' }, fetchData);
    const criarAnuncio = (dados) => request('/anuncios', { method: 'POST', body: JSON.stringify(dados) }, fetchData);
    const atualizarAnuncio = (id, dados) => request(`/anuncios/${id}`, { method: 'PUT', body: JSON.stringify(dados) }, fetchData);
    const desativarAnuncio = (id) => request(`/anuncios/${id}`, { method: 'DELETE' }, fetchData);

    const createAux = (endpoint, nome, setState) => request(endpoint, { method: 'POST', body: JSON.stringify({ nome }) }, async (novo) => setState((items) => [...items, novo]));
    const deleteAux = (endpoint, id, setState) => request(`${endpoint}/${id}`, { method: 'DELETE' }, async () => setState((items) => items.filter((item) => item.id !== id)));
    const adicionarCategoria = (nome) => createAux('/dados/categorias', nome, setCategorias);
    const removerCategoria = (id) => deleteAux('/dados/categorias', id, setCategorias);
    const adicionarCanalVenda = (nome) => createAux('/dados/canais-venda', nome, setCanaisVenda);
    const removerCanalVenda = (id) => deleteAux('/dados/canais-venda', id, setCanaisVenda);
    const adicionarCanalCompra = (nome) => createAux('/dados/canais-compra', nome, setCanaisCompra);
    const removerCanalCompra = (id) => deleteAux('/dados/canais-compra', id, setCanaisCompra);

    const formatDate = (dateString) => {
        if (!dateString) return 'Nao informada';
        const safe = dateString.includes('T') ? dateString : `${dateString}T12:00:00`;
        return new Date(safe).toLocaleDateString('pt-BR');
    };

    return <DataContext.Provider value={{
        produtos, itensEstoque, categorias, canaisVenda, canaisCompra, vendas, anuncios, analises, isLoading,
        adicionarProduto, atualizarProduto, removerProduto, adicionarEstoqueEmLote, venderItem, cancelarVenda,
        reservarItem, liberarReserva, removerItemEstoque, adicionarCategoria, removerCategoria,
        criarAnuncio, atualizarAnuncio, desativarAnuncio, adicionarCanalVenda, removerCanalVenda, adicionarCanalCompra, removerCanalCompra, fetchData, formatDate
    }}>{children}</DataContext.Provider>;
};
