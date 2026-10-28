import app from './app.js';
import { pool, verificarConexion } from './config/db.js';
import { iniciarExpiracion } from './jobs/expirarReservas.js';

const puerto = Number(process.env.PORT || 3000);

try {
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    throw new Error('PORT debe ser un puerto válido');
  }

  const base = await verificarConexion();
  const detenerExpiracion = iniciarExpiracion();
  const servidor = app.listen(puerto, () => {
    console.log(`PostgreSQL conectado: ${base}`);
    console.log(`Servidor disponible en http://localhost:${puerto}`);
  });

  servidor.on('error', async (error) => {
    console.error('No se pudo iniciar el servidor:', error.message);
    await detenerExpiracion();
    await pool.end();
    process.exitCode = 1;
  });

  let cerrando = false;
  function cerrarServidor() {
    if (cerrando) return;
    cerrando = true;
    servidor.close(async () => {
      await detenerExpiracion();
      await pool.end();
    });
  }

  process.on('SIGINT', cerrarServidor);
  process.on('SIGTERM', cerrarServidor);
} catch (error) {
  console.error('No se pudo iniciar el servidor:', error.message);
  await pool.end();
  process.exitCode = 1;
}
