export async function consultarReserva(db, usuarioId) {
  const { rows } = await db.query(
    `
    SELECT
      u.saldo_mensual AS saldo,
      u.presupuesto_diario,
      COALESCE((SELECT SUM(i.cantidad * i.precio_unitario)
        FROM reservas c JOIN reserva_items i ON i.reserva_id = c.id
        WHERE c.usuario_id = u.id AND c.estado = 'confirmada'
          AND (c.confirmada_en AT TIME ZONE 'America/El_Salvador')::date
            = (clock_timestamp() AT TIME ZONE 'America/El_Salvador')::date
      ), 0) AS gastado_hoy,
      r.id,
      r.nombre_cliente,
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
    nombreCliente: fila.nombre_cliente,
    estado: fila.estado,
    expiraEn: fila.expira_en,
    saldoMensual: Number(fila.saldo),
    saldo: Number((Number(fila.saldo) - (fila.estado === 'activa' ? Number(fila.total) : 0)).toFixed(2)),
    presupuestoDisponible: Number((Number(fila.presupuesto_diario) - Number(fila.gastado_hoy) - (fila.estado === 'activa' ? Number(fila.total) : 0)).toFixed(2)),
    total: Number(fila.total),
    itemsReservados: fila.items.map((item) => ({
      ...item,
      id: item.alimentoId,
      precioUnitario: Number(item.precioUnitario),
      subtotal: Number(item.subtotal),
    })),
  };
}
