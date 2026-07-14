-- Baseline for a new, empty database only.
-- Select/create the target database before executing this file.
-- Never run it against an existing database: it drops all application tables.
-- Then run: npm --prefix backend run db:migrate

DROP TABLE IF EXISTS estoque;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS canais_venda;
DROP TABLE IF EXISTS canais_compra;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id VARCHAR(36) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  usuario VARCHAR(100) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE categorias (
  id VARCHAR(36) NOT NULL,
  usuario_id VARCHAR(36) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_categorias_usuario (usuario_id),
  CONSTRAINT fk_categorias_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE canais_venda (
  id VARCHAR(36) NOT NULL,
  usuario_id VARCHAR(36) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_canais_venda_usuario (usuario_id),
  CONSTRAINT fk_canais_venda_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE canais_compra (
  id VARCHAR(36) NOT NULL,
  usuario_id VARCHAR(36) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_canais_compra_usuario (usuario_id),
  CONSTRAINT fk_canais_compra_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE produtos (
  id VARCHAR(36) NOT NULL,
  usuario_id VARCHAR(36) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  marca VARCHAR(100) DEFAULT NULL,
  categoria VARCHAR(100) DEFAULT NULL,
  tipo VARCHAR(100) DEFAULT NULL,
  foto LONGTEXT,
  criado_em TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_produtos_usuario (usuario_id),
  CONSTRAINT fk_produtos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE estoque (
  id VARCHAR(36) NOT NULL,
  produto_id VARCHAR(36) NOT NULL,
  preco_custo DECIMAL(10,2) NOT NULL,
  canal_compra_id VARCHAR(36) DEFAULT NULL,
  origem VARCHAR(50) DEFAULT NULL,
  status ENUM('disponivel','vendido','devolvido') DEFAULT 'disponivel',
  data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
  preco_venda DECIMAL(10,2) DEFAULT NULL,
  canal_venda_id VARCHAR(36) DEFAULT NULL,
  data_venda DATETIME DEFAULT NULL,
  usuario_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_estoque_produto (produto_id),
  KEY idx_estoque_canal_compra (canal_compra_id),
  KEY idx_estoque_canal_venda (canal_venda_id),
  KEY idx_estoque_usuario (usuario_id),
  CONSTRAINT fk_estoque_produto FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE,
  CONSTRAINT fk_estoque_canal_compra FOREIGN KEY (canal_compra_id) REFERENCES canais_compra (id) ON DELETE SET NULL,
  CONSTRAINT fk_estoque_canal_venda FOREIGN KEY (canal_venda_id) REFERENCES canais_venda (id) ON DELETE SET NULL,
  CONSTRAINT fk_estoque_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
