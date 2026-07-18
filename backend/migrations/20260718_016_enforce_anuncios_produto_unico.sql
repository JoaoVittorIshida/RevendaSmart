ALTER TABLE anuncios
  MODIFY COLUMN produto_id VARCHAR(36) NOT NULL,
  MODIFY COLUMN nome_anuncio VARCHAR(255) NOT NULL,
  ADD UNIQUE KEY uq_anuncios_usuario_produto (usuario_id, produto_id),
  ADD KEY idx_anuncios_produto (produto_id),
  ADD CONSTRAINT fk_anuncios_produto FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE;
