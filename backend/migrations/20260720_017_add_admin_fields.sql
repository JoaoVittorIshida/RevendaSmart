ALTER TABLE usuarios
  ADD COLUMN email VARCHAR(255) DEFAULT NULL AFTER usuario,
  ADD COLUMN admin TINYINT(1) NOT NULL DEFAULT 0 AFTER senha,
  ADD COLUMN ultima_atividade_em DATETIME DEFAULT NULL AFTER admin,
  ADD UNIQUE KEY uq_usuarios_email (email),
  ADD KEY idx_usuarios_admin_atividade (admin, ultima_atividade_em);
