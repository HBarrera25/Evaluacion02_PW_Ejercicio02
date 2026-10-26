import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { obtenerConfiguracionDB, pool } from '../src/config/db.js';

const config = obtenerConfiguracionDB();
const admin = new pg.Client({ ...config, database: 'postgres' });
const destino = new pg.Client(config);

try {
  await admin.connect();
  const existente = await admin.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [config.database],
  );

  if (existente.rowCount === 0) {
    // Los identificadores no admiten parámetros $1: se escapan como identificadores SQL.
    const nombreSeguro = '"' + config.database.replaceAll('"', '""') + '"';
    await admin.query(`CREATE DATABASE ${nombreSeguro}`);
    console.log(`Base creada: ${config.database}`);
  }

  await destino.connect();
  const tablas = await destino.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `);

  if (tablas.rowCount > 0) {
    throw new Error('La base ya contiene tablas. Se detuvo la inicialización para conservar los datos.');
  }

  const schema = await readFile(new URL('../../database/schema.sql', import.meta.url), 'utf8');
  const seed = await readFile(new URL('../../database/seed.sql', import.meta.url), 'utf8');
  await destino.query(schema);
  await destino.query(seed);
  console.log('Tablas y datos iniciales creados correctamente.');
} catch (error) {
  console.error('No se pudo inicializar la base:', error.message);
  process.exitCode = 1;
} finally {
  await destino.end();
  await admin.end();
  await pool.end();
}
