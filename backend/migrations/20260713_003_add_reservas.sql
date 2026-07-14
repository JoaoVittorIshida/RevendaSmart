ALTER TABLE estoque
  MODIFY COLUMN status ENUM('disponivel','reservado','vendido','devolvido') DEFAULT 'disponivel',
  ADD COLUMN reservado_ate DATETIME DEFAULT NULL AFTER status,
  ADD COLUMN reserva_observacao VARCHAR(280) DEFAULT NULL AFTER reservado_ate,
  ADD KEY idx_estoque_usuario_status_entrada (usuario_id, status, data_entrada),
  ADD KEY idx_estoque_reserva_vencimento (usuario_id, reservado_ate);
