import { pool } from '../config/db.js';

export async function obtenerMenu() {
  const { rows } = await pool.query(`
    SELECT id, nombre, precio, stock, categoria
    FROM alimentos
    ORDER BY id ASC
  `);

  // pg devuelve NUMERIC como texto; la API entrega el precio como número.
  return rows.map((alimento) => ({
    id: alimento.id,
    nombre: alimento.nombre,
    precio: Number(alimento.precio),
    stock: alimento.stock,
    categoria: alimento.categoria,
  }));
}
