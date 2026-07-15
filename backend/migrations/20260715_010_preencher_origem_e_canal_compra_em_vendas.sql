UPDATE vendas v
INNER JOIN estoque e ON e.id = v.estoque_id AND e.usuario_id = v.usuario_id
LEFT JOIN canais_compra cc ON cc.id = e.canal_compra_id AND cc.usuario_id = v.usuario_id
SET v.origem = e.origem,
    v.canal_compra_id = e.canal_compra_id,
    v.canal_compra_nome = COALESCE(cc.nome, 'Não informado')
WHERE v.origem IS NULL AND v.canal_compra_id IS NULL AND v.canal_compra_nome IS NULL;
