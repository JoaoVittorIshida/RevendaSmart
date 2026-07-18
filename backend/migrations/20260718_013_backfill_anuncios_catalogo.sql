UPDATE anuncios a
INNER JOIN estoque e ON e.id = a.estoque_id AND e.usuario_id = a.usuario_id
INNER JOIN produtos p ON p.id = e.produto_id AND p.usuario_id = a.usuario_id
SET a.produto_id = e.produto_id,
    a.nome_anuncio = p.nome,
    a.descricao = CASE
      WHEN a.detalhes IS NULL OR TRIM(a.detalhes) = '' THEN NULL
      ELSE REPLACE(REPLACE(REPLACE(a.detalhes, '&', CONCAT('&', 'amp', CHAR(59))), '<', CONCAT('&', 'lt', CHAR(59))), '>', CONCAT('&', 'gt', CHAR(59)))
    END;
