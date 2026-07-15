ALTER TABLE vendas
  ADD COLUMN origem VARCHAR(50) DEFAULT NULL AFTER categoria_nome,
  ADD COLUMN canal_compra_id VARCHAR(36) DEFAULT NULL AFTER origem,
  ADD COLUMN canal_compra_nome VARCHAR(100) DEFAULT NULL AFTER canal_compra_id,
  ADD KEY idx_vendas_usuario_status_data (usuario_id, status, data_venda),
  ADD KEY idx_vendas_usuario_canal_venda_data (usuario_id, canal_venda_id, data_venda),
  ADD KEY idx_vendas_usuario_canal_compra_data (usuario_id, canal_compra_id, data_venda);
