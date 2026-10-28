import { readFile } from 'node:fs/promises';
import { pool } from '../src/config/db.js';

try {
  for (const archivo of ['001_nombre_cliente.sql', '002_usuarios_sesiones.sql']) {
    const sql = await readFile(new URL('../../database/migrations/' + archivo, import.meta.url), 'utf8');
    await pool.query(sql);
  }
  console.log('Base actualizada: reservas, usuarios y sesiones.');
} catch (error) {
  console.error('No se pudo actualizar la base:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
