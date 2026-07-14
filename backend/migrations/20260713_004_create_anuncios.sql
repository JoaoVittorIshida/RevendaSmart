CREATE TABLE IF NOT EXISTS anuncios (
  id VARCHAR(36) NOT NULL,
  usuario_id VARCHAR(36) NOT NULL,
  estoque_id VARCHAR(36) NOT NULL,
  preco_anuncio DECIMAL(10,2) NOT NULL,
  detalhes VARCHAR(500) DEFAULT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_anuncios_usuario_ativo (usuario_id, ativo),
  KEY idx_anuncios_estoque (estoque_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
