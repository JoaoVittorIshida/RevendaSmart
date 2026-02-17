-- Script de Criação do Banco de Dados - RevendaSmart

-- 1. Tabela de Usuários
CREATE TABLE usuarios (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categorias (Por Usuário)
CREATE TABLE categorias (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3. Canais de Venda e Compra (Por Usuário)
CREATE TABLE canais_venda (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE canais_compra (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. Produtos (Por Usuário)
CREATE TABLE produtos (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    marca VARCHAR(100),
    categoria VARCHAR(100), 
    tipo VARCHAR(100),
    foto LONGTEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 5. Estoque (Itens individuais)
-- Estoque herda o usuário do produto, mas para consultas rápidas pode ser útil linkar também, 
-- porém seguindo a normalização, linkamos apenas ao produto.
CREATE TABLE estoque (
    id VARCHAR(36) PRIMARY KEY,
    produto_id VARCHAR(36) NOT NULL,
    preco_custo DECIMAL(10, 2) NOT NULL,
    canal_compra_id VARCHAR(36),
    origem VARCHAR(50), -- 'nacional' ou 'importado'
    status ENUM('disponivel', 'vendido', 'devolvido') DEFAULT 'disponivel',
    data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Campos de Venda
    preco_venda DECIMAL(10, 2),
    canal_venda_id VARCHAR(36),
    data_venda DATETIME,
    
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (canal_compra_id) REFERENCES canais_compra(id) ON DELETE SET NULL,
    FOREIGN KEY (canal_venda_id) REFERENCES canais_venda(id) ON DELETE SET NULL
);
