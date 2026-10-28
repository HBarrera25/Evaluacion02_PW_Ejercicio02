ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nombre_usuario VARCHAR(30);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_nombre_usuario_unico ON usuarios (nombre_usuario);
CREATE TABLE IF NOT EXISTS sesiones (
  token_hash CHAR(64) PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_en TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sesiones_expiracion ON sesiones(expira_en);
