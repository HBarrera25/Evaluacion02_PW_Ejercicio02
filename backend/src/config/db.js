import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

dotenv.config({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
  quiet: true,
});

export function obtenerConfiguracionDB() {
  for (const variable of ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
    if (!process.env[variable]) {
      throw new Error(`Falta configurar ${variable} en backend/.env`);
    }
  }

  const port = Number(process.env.DB_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT debe ser un puerto válido');
  }

  return {
    host: process.env.DB_HOST,
    port,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 5000,
  };
}

export const pool = new pg.Pool(obtenerConfiguracionDB());

pool.on('error', (error) => {
  console.error('Error en una conexión inactiva de PostgreSQL:', error.message);
});

export async function verificarConexion() {
  const { rows } = await pool.query('SELECT CURRENT_DATABASE() AS base');
  return rows[0].base;
}
