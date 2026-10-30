CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  metadata JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (expires_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS capitulos_lidos (
  user_id CHAR(36) NOT NULL,
  livro VARCHAR(80) NOT NULL,
  capitulo SMALLINT UNSIGNED NOT NULL,
  lido_em TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, livro, capitulo),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (user_id, lido_em)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS metas_leitura (
  user_id CHAR(36) PRIMARY KEY,
  escopo ENUM('biblia', 'antigo', 'novo') NOT NULL,
  data_alvo DATE NOT NULL,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
