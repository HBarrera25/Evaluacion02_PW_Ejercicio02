import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { Router } from 'express';
import { pool } from '../config/db.js';

const scrypt = promisify(scryptCallback);
const router = Router();
const cookieNombre = 'food_dei_sesion';
const cookieOpciones = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api' };
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const publico = (u) => ({ id: u.id, nombre: u.nombre, nombreUsuario: u.nombre_usuario });
const intentos = new Map();

// Las escrituras desde navegadores solo se aceptan desde el frontend configurado.
export function verificarOrigen(req, res, next) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin &&
      req.headers.origin !== (process.env.FRONTEND_URL || 'http://localhost:5173')) {
    return res.status(403).json({ mensaje: 'Origen no permitido.' });
  }
  next();
}

export async function autenticar(req, res, next) {
  try {
    const token = (req.headers.cookie || '').split(';').map((s) => s.trim()).find((s) => s.startsWith(cookieNombre + '='))?.slice(cookieNombre.length + 1);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return res.status(401).json({ mensaje: 'Inicia sesión para continuar.' });
    const { rows } = await pool.query(`SELECT u.id, u.nombre, u.nombre_usuario
      FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
      WHERE s.token_hash = $1 AND s.expira_en > clock_timestamp()`, [hashToken(token)]);
    if (!rows.length) return res.status(401).json({ mensaje: 'Tu sesión terminó. Ingresa nuevamente.' });
    req.usuario = rows[0];
    req.tokenHash = hashToken(token);
    next();
  } catch (error) { next(error); }
}

async function abrirSesion(res, usuario) {
  const token = randomBytes(32).toString('hex');
  await pool.query("INSERT INTO sesiones(token_hash, usuario_id, expira_en) VALUES ($1, $2, clock_timestamp() + interval '7 days')", [hashToken(token), usuario.id]);
  res.cookie(cookieNombre, token, { ...cookieOpciones, maxAge: 7 * 86400000 });
  return publico(usuario);
}

function limitar(req, res, next) {
  const ahora = Date.now();
  for (const [ip, dato] of intentos) if (dato.hasta <= ahora) intentos.delete(ip);
  const dato = intentos.get(req.ip) || { cantidad: 0, hasta: ahora + 15 * 60000 };
  if (dato.cantidad >= 30) return res.status(429).json({ mensaje: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' });
  dato.cantidad++;
  intentos.set(req.ip, dato);
  next();
}

router.post('/registro', limitar, async (req, res, next) => {
  try {
    const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim().replace(/\s+/g, ' ') : '';
    const nombreUsuario = typeof req.body?.nombreUsuario === 'string' ? req.body.nombreUsuario.trim().toLowerCase() : '';
    const password = req.body?.password;
    if (nombre.length < 2 || nombre.length > 100 || !/\p{L}/u.test(nombre)) return res.status(400).json({ mensaje: 'Escribe un nombre de 2 a 100 caracteres.' });
    if (!/^[a-z0-9_]{3,30}$/.test(nombreUsuario)) return res.status(400).json({ mensaje: 'El usuario debe tener de 3 a 30 letras, números o guion bajo.' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) return res.status(400).json({ mensaje: 'La contraseña debe tener entre 8 y 128 caracteres.' });
    const sal = randomBytes(16).toString('hex');
    const derivada = await scrypt(password, sal, 64);
    const { rows } = await pool.query(`INSERT INTO usuarios(nombre, nombre_usuario, password_hash, saldo_mensual, presupuesto_diario)
      VALUES ($1, $2, $3, 100, 25) RETURNING id, nombre, nombre_usuario`, [nombre, nombreUsuario, `${sal}:${derivada.toString('hex')}`]);
    res.status(201).json({ usuario: await abrirSesion(res, rows[0]) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ mensaje: 'Ese nombre de usuario ya existe. Elige otro.' });
    next(error);
  }
});

router.post('/ingresar', limitar, async (req, res, next) => {
  try {
    const nombreUsuario = typeof req.body?.nombreUsuario === 'string' ? req.body.nombreUsuario.trim().toLowerCase() : '';
    const password = req.body?.password;
    if (typeof password !== 'string' || password.length > 128 || !/^[a-z0-9_]{3,30}$/.test(nombreUsuario)) return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
    const { rows: [usuario] } = await pool.query('SELECT id, nombre, nombre_usuario, password_hash FROM usuarios WHERE nombre_usuario = $1', [nombreUsuario]);
    const [sal, guardado] = (usuario?.password_hash || '00000000000000000000000000000000:' + '00'.repeat(64)).split(':');
    const derivada = await scrypt(password, sal, 64);
    if (!usuario || !timingSafeEqual(derivada, Buffer.from(guardado, 'hex'))) return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
    res.json({ usuario: await abrirSesion(res, usuario) });
  } catch (error) { next(error); }
});
router.get('/sesion', autenticar, (req, res) => res.json({ usuario: publico(req.usuario) }));
router.post('/salir', autenticar, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM sesiones WHERE token_hash = $1', [req.tokenHash]);
    res.clearCookie(cookieNombre, cookieOpciones);
    res.json({ mensaje: 'Sesión cerrada.' });
  } catch (error) { next(error); }
});
export default router;
