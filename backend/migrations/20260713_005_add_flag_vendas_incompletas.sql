ALTER TABLE vendas ADD COLUMN dados_incompletos TINYINT(1) NOT NULL DEFAULT 0 AFTER cancelada_em;
