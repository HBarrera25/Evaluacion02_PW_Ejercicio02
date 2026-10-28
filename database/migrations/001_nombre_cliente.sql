-- Compatible con reservas anteriores: su nombre permanece NULL.
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS nombre_cliente VARCHAR(100)
  CHECK (nombre_cliente IS NULL OR LENGTH(TRIM(nombre_cliente)) >= 2);
