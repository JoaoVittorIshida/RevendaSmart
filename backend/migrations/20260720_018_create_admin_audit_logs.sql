CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id VARCHAR(36) DEFAULT NULL,
  usuario_alvo_id VARCHAR(36) DEFAULT NULL,
  acao VARCHAR(50) NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_audit_admin_data (admin_id, criado_em),
  KEY idx_admin_audit_alvo_data (usuario_alvo_id, criado_em),
  CONSTRAINT fk_admin_audit_admin FOREIGN KEY (admin_id) REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT fk_admin_audit_alvo FOREIGN KEY (usuario_alvo_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
