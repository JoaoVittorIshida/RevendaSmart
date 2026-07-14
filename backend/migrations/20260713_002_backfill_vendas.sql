INSERT INTO vendas (id, usuario_id, estoque_id, produto_id, produto_nome, categoria_nome, canal_venda_id, canal_nome, preco_custo, valor_bruto, taxa_plataforma, frete_vendedor, valor_liquido, data_venda, status)
SELECT UUID(), e.usuario_id, e.id, e.produto_id, COALESCE(p.nome, 'Produto removido'), COALESCE(p.categoria, 'Sem categoria'), e.canal_venda_id, COALESCE(cv.nome, 'Não informado'), e.preco_custo, e.preco_venda, 0.00, 0.00, e.preco_venda, e.data_venda, 'concluida'
FROM estoque e
LEFT JOIN produtos p ON p.id = e.produto_id
LEFT JOIN canais_venda cv ON cv.id = e.canal_venda_id
LEFT JOIN vendas v ON v.estoque_id = e.id AND v.status = 'concluida'
WHERE e.status = 'vendido' AND v.id IS NULL;
