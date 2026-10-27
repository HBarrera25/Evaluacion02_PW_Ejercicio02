export async function consultarReserva(db, usuarioId) {
  const { rows } = await db.query(
    `
    SELECT
      u.saldo_mensual AS saldo,
      r.id,
      CASE
        WHEN r.id IS NULL THEN 'sin_reserva'
        WHEN r.estado = 'activa' AND r.expira_en <= clock_timestamp()
          THEN 'expirada'
        ELSE r.estado
      END AS estado,
      r.expira_en,
      COALESCE((
        SELECT SUM(i.cantidad * i.precio_unitario)
        FROM reserva_items i WHERE i.reserva_id = r.id
      ), 0) AS total,
      COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'alimentoId', a.id,
            'nombre', a.nombre,
            'cantidad', i.cantidad,
            'precioUnitario', i.precio_unitario,
            'subtotal', i.cantidad * i.precio_unitario
          ) ORDER BY a.id
        )
        FROM reserva_items i
        JOIN alimentos a ON a.id = i.alimento_id
        WHERE i.reserva_id = r.id
      ), '[]'::jsonb) AS items
    FROM usuarios u
    LEFT JOIN LATERAL (
      SELECT * FROM reservas
      WHERE usuario_id = u.id
      ORDER BY (estado = 'activa') DESC, creada_en DESC, id DESC
      LIMIT 1
    ) r ON TRUE
    WHERE u.id = $1
    `,
    [usuarioId],
  );
  const fila = rows[0];
  if (!fila) return null;

  return {
    id: fila.id,
    estado: fila.estado,
    expiraEn: fila.expira_en,
    saldo: Number(fila.saldo),
    total: Number(fila.total),
    itemsReservados: fila.items.map((item) => ({
      ...item,
      precioUnitario: Number(item.precioUnitario),
      subtotal: Number(item.subtotal),
    })),
  };
}