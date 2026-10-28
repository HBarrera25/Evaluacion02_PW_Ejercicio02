import { pool } from '../config/db.js';

export async function crearUsuario({ nombre, nombreUsuario, passwordHash }) {
  const { rows } = await pool.query(`
    INSERT INTO usuarios(nombre, nombre_usuario, password_hash, saldo_mensual, presupuesto_diario)
    VALUES ($1, $2, $3, 100, 25)
    RETURNING id, nombre, nombre_usuario
  `, [nombre, nombreUsuario, passwordHash]);
  return rows[0];
}

export async function buscarPorNombreUsuario(nombreUsuario) {
  const { rows } = await pool.query(`
    SELECT id, nombre, nombre_usuario, password_hash
    FROM usuarios WHERE nombre_usuario = $1
  `, [nombreUsuario]);
  return rows[0] ?? null;
}

export async function buscarPorSesion(tokenHash) {
  const { rows } = await pool.query(`
    SELECT u.id, u.nombre, u.nombre_usuario
    FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token_hash = $1 AND s.expira_en > clock_timestamp()
  `, [tokenHash]);
  return rows[0] ?? null;
}

export async function crearSesion(tokenHash, usuarioId) {
  await pool.query(`
    INSERT INTO sesiones(token_hash, usuario_id, expira_en)
    VALUES ($1, $2, clock_timestamp() + interval '7 days')
  `, [tokenHash, usuarioId]);
}

export async function eliminarSesion(tokenHash) {
  await pool.query('DELETE FROM sesiones WHERE token_hash = $1', [tokenHash]);
}
