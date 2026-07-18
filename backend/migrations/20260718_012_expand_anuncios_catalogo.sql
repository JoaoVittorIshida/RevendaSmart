ALTER TABLE anuncios
  ADD COLUMN produto_id VARCHAR(36) DEFAULT NULL AFTER estoque_id,
  ADD COLUMN nome_anuncio VARCHAR(255) DEFAULT NULL AFTER produto_id,
  ADD COLUMN descricao TEXT DEFAULT NULL AFTER detalhes,
  ADD COLUMN link_olx VARCHAR(2048) DEFAULT NULL AFTER descricao,
  ADD COLUMN link_facebook VARCHAR(2048) DEFAULT NULL AFTER link_olx,
  ADD COLUMN link_mercado_livre VARCHAR(2048) DEFAULT NULL AFTER link_facebook,
  ADD COLUMN link_outros VARCHAR(2048) DEFAULT NULL AFTER link_mercado_livre;
