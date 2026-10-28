import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import app from '../src/app.js';
import { pool, obtenerConfiguracionDB } from '../src/config/db.js';
import { iniciarExpiracion } from '../src/jobs/expirarReservas.js';

// El esquema exclusivo evita modificar las tablas y reservas reales.
test('flujo HTTP completo en PostgreSQL aislado', async (t) => {
  const esquema = `test_food_${process.pid}_${Date.now()}`;
  const admin = new pg.Client(obtenerConfiguracionDB());
  let servidor;
  let detener;
  try {
    await admin.connect();
    await admin.query(`CREATE SCHEMA "${esquema}"`);
    await admin.query(`SET search_path TO "${esquema}"`);
    await admin.query(await readFile(new URL('../../database/schema.sql', import.meta.url), 'utf8'));
    await admin.query(await readFile(new URL('../../database/seed.sql', import.meta.url), 'utf8'));
    pool.options.options = `-c search_path=${esquema}`;
    servidor = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => { servidor.once('listening', resolve); servidor.once('error', reject); });
    const base = `http://127.0.0.1:${servidor.address().port}/api`;
    let cookie = '';
    let usuarioId;
    async function api(ruta, method = 'GET', datos, status = 200) {
      const response = await fetch(base + ruta, { method, headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: datos === undefined ? undefined : JSON.stringify(datos) });
      const nuevaCookie = response.headers.get('set-cookie');
      if (nuevaCookie) cookie = nuevaCookie.split(';')[0];
      const body = await response.json();
      assert.equal(response.status, status, JSON.stringify(body));
      return body;
    }
    const stock = async () => (await api('/menu')).find((a) => a.id === 1).stock;
    let reserva;
    await t.test('registro y acceso protegido', async () => {
      await api('/reserva', 'GET', undefined, 401);
      await api('/reserva/iniciar', 'POST', {}, 401);
      const registro = await api('/auth/registro', 'POST', { nombre: 'María López', nombreUsuario: 'maria', password: 'ClavePrueba123', saldo: 9999 }, 201);
      usuarioId = registro.usuario.id;
      assert.equal((await api('/auth/sesion')).usuario.nombre, 'María López');
      const { rows: [fila] } = await admin.query('SELECT password_hash, saldo_mensual, presupuesto_diario FROM usuarios WHERE id = $1', [usuarioId]);
      assert.notEqual(fila.password_hash, 'ClavePrueba123');
      assert.equal(Number(fila.saldo_mensual), 100);
      assert.equal(Number(fila.presupuesto_diario), 25);
      await api('/auth/registro', 'POST', { nombre: 'Otra María', nombreUsuario: 'MARIA', password: 'ClavePrueba123' }, 409);
      await api('/auth/ingresar', 'POST', { nombreUsuario: 'maria', password: 'incorrecta' }, 401);
    });

    await t.test('inicia, añade, cambia cantidad absoluta y devuelve stock al quitar', async () => {
      assert.equal((await api('/reserva')).estado, 'sin_reserva');
      reserva = await api('/reserva/iniciar', 'POST');
      const repetida = await api('/reserva/iniciar', 'POST');
      assert.equal(repetida.id, reserva.id);
      let actual = await api('/reserva/agregar', 'POST', { alimentoId: 1, cantidad: 2 });
      assert.equal(actual.total, 11);
      assert.equal(actual.saldo, 89);
      assert.equal(actual.presupuestoDisponible, 14);
      assert.equal(actual.itemsReservados[0].id, 1);
      assert.equal(await stock(), 10);
      actual = await api('/reserva/actualizar-porciones/1', 'PUT', { cantidad: 3 });
      assert.equal(actual.total, 16.5);
      assert.equal(await stock(), 9);
      await api('/reserva/actualizar-porciones/1', 'PUT', { cantidad: 1 });
      assert.equal(await stock(), 11);
      actual = await api('/reserva/eliminar/1', 'DELETE');
      assert.equal(actual.total, 0);
      assert.equal(actual.saldo, 100);
      assert.equal(await stock(), 12);
    });

    await t.test('rechaza stock, saldo, presupuesto y cuerpos inválidos sin cambios parciales', async () => {
      assert.equal((await api('/reserva/agregar', 'POST', { alimentoId: 8, cantidad: 1 }, 400)).mensaje, 'Stock insuficiente');
      await api('/reserva/agregar', 'POST', { alimentoId: 1, cantidad: 1 });
      await api('/reserva/actualizar-porciones/1', 'PUT', { cantidad: 13 }, 400);
      await api('/reserva/actualizar-porciones/1', 'PUT', { cantidad: 5 }, 400);
      await admin.query('UPDATE usuarios SET saldo_mensual = 6 WHERE id = $1', [usuarioId]);
      assert.equal((await api('/reserva/actualizar-porciones/1', 'PUT', { cantidad: 2 }, 400)).mensaje, 'Saldo insuficiente para esta cantidad');
      for (const cantidad of [-1, 1.5, '2', null]) await api('/reserva/actualizar-porciones/1', 'PUT', { cantidad }, 400);
      await api('/reserva/actualizar-porciones/abc', 'PUT', { cantidad: 1 }, 400);
      await api('/reserva/actualizar-porciones/1', 'PUT', {}, 400);
      assert.equal(await stock(), 11);
      assert.equal((await api('/reserva')).total, 5.5);
      await admin.query('UPDATE usuarios SET saldo_mensual = 100 WHERE id = $1', [usuarioId]);
    });

    await t.test('PUT concurrentes mantienen cantidad y stock consistentes; cero elimina', async () => {
      await Promise.all([api('/reserva/actualizar-porciones/1', 'PUT', { cantidad: 3 }), api('/reserva/actualizar-porciones/1', 'PUT', { cantidad: 2 })]);
      const actual = await api('/reserva');
      assert.equal(await stock() + actual.itemsReservados[0].cantidad, 12);
      await api('/reserva/actualizar-porciones/1', 'PUT', { cantidad: 0 });
      assert.equal(await stock(), 12);
    });

    await t.test('confirmación concurrente cobra una vez y no descuenta stock dos veces', async () => {
      await api('/reserva/confirmar', 'POST', { reservaId: reserva.id, nombreCliente: 'Nombre falso enviado por cliente' }, 409);
      await api('/reserva/agregar', 'POST', { alimentoId: 1, cantidad: 2 });
      const respuestas = await Promise.all([api('/reserva/confirmar', 'POST', { reservaId: reserva.id, nombreCliente: 'Nombre falso enviado por cliente' }), api('/reserva/confirmar', 'POST', { reservaId: reserva.id, nombreCliente: 'Nombre falso enviado por cliente' })]);
      assert.equal(respuestas.filter((r) => r.yaConfirmada).length, 1);
      const actual = await api('/reserva');
      assert.equal(actual.estado, 'confirmada');
      assert.equal(actual.nombreCliente, 'María López');
      const repetida = await api('/reserva/confirmar', 'POST', { reservaId: reserva.id, nombreCliente: 'Otra persona' });
      assert.equal(repetida.nombreCliente, 'María López');
      assert.equal((await api('/reserva')).nombreCliente, 'María López');
      assert.equal(actual.saldo, 89);
      assert.equal(actual.saldoMensual, 89);
      assert.equal(await stock(), 10);
      await api('/reserva/actualizar-porciones/1', 'PUT', { cantidad: 1 }, 409);
    });

    await t.test('presupuesto diario incluye reservas previas confirmadas', async () => {
      reserva = await api('/reserva/iniciar', 'POST');
      await api('/reserva/agregar', 'POST', { alimentoId: 1, cantidad: 3 }, 400);
      await api('/reserva/agregar', 'POST', { alimentoId: 1, cantidad: 1 });
      assert.equal((await api('/reserva')).presupuestoDisponible, 8.5);
    });

    await t.test('servidor libera stock vencido sin navegador y permite reiniciar', async () => {
      await admin.query("UPDATE reservas SET creada_en = clock_timestamp() - interval '2 minutes', expira_en = clock_timestamp() - interval '1 minute' WHERE id = $1", [reserva.id]);
      await api('/reserva/confirmar', 'POST', { reservaId: reserva.id, nombreCliente: 'Nombre falso enviado por cliente' }, 409);
      await api('/reserva/agregar', 'POST', { alimentoId: 1, cantidad: 1 }, 409);
      detener = iniciarExpiracion(20);
      let estado;
      for (let i = 0; i < 100; i++) {
        estado = (await admin.query('SELECT estado FROM reservas WHERE id = $1', [reserva.id])).rows[0].estado;
        if (estado === 'expirada') break;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      assert.equal(estado, 'expirada');
      await detener();
      detener = null;
      assert.equal(await stock(), 10);
      await api('/reserva/expirar', 'POST');
      await api('/reserva/expirar', 'POST');
      assert.equal(await stock(), 10);
      const nueva = await api('/reserva/iniciar', 'POST');
      assert.notEqual(nueva.id, reserva.id);
      assert.equal(nueva.nombreCliente, null);
      assert.equal(nueva.estado, 'activa');
      assert.equal(nueva.total, 0);
      assert.equal(nueva.saldo, 89);
    });
    await t.test('cuentas independientes, propiedad de reservas y cierre de sesión', async () => {
      const reservaMaria = await api('/reserva');
      const cookieMaria = cookie;
      const alta = await api('/auth/registro', 'POST', { nombre: 'Pedro Pérez', nombreUsuario: 'pedro', password: 'OtraClave123' }, 201);
      assert.notEqual(alta.usuario.id, usuarioId);
      const inicial = await api('/reserva');
      assert.equal(inicial.estado, 'sin_reserva');
      assert.equal(inicial.saldo, 100);
      assert.equal(inicial.presupuestoDisponible, 25);
      await api('/reserva/confirmar', 'POST', { reservaId: reservaMaria.id, usuarioId }, 404);
      const pedro = await api('/reserva/iniciar', 'POST', { usuarioId });
      assert.notEqual(pedro.id, reservaMaria.id);
      await api('/reserva/agregar', 'POST', { alimentoId: 1, cantidad: 1, usuarioId });
      const compra = await api('/reserva/confirmar', 'POST', { reservaId: pedro.id, nombreCliente: 'María López' });
      assert.equal(compra.nombreCliente, 'Pedro Pérez');
      assert.equal(compra.saldo, 94.5);
      const cookiePedro = cookie;
      cookie = cookieMaria;
      const maria = await api('/reserva');
      assert.equal(maria.saldo, 89);
      assert.equal(maria.presupuestoDisponible, 14);
      assert.equal(maria.itemsReservados.length, 0);
      cookie = cookiePedro;
      const origenAjeno = await fetch(base + '/auth/salir', { method: 'POST', headers: { Cookie: cookie, Origin: 'https://otro-sitio.example' } });
      assert.equal(origenAjeno.status, 403);
      await api('/auth/salir', 'POST');
      cookie = cookiePedro;
      await api('/reserva', 'GET', undefined, 401);
      await api('/auth/ingresar', 'POST', { nombreUsuario: 'PEDRO', password: 'OtraClave123' });
      assert.equal((await api('/reserva')).saldo, 94.5);
      assert.equal((await api('/reserva')).nombreCliente, 'Pedro Pérez');
    });
  } finally {
    if (detener) await detener();
    if (servidor) await new Promise((resolve) => servidor.close(resolve));
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${esquema}" CASCADE`);
    await admin.end();
  }
});
