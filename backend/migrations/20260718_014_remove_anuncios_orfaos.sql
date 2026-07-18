DELETE a FROM anuncios a LEFT JOIN produtos p ON p.id = a.produto_id AND p.usuario_id = a.usuario_id WHERE p.id IS NULL;
