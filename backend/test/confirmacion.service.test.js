import assert from 'node:assert/strict';
import { test } from 'node:test';
import { confirmarReserva } from '../src/services/confirmacion.service.js';

test('rechaza un usuario inválido antes de abrir una conexión', async () => {
  await assert.rejects(
    confirmarReserva(0, { reservaId: 1 }),
    (error) => error.status === 400 &&
      error.message === 'usuarioId debe ser un entero positivo válido.',
  );
});

test('rechaza una reserva inválida antes de abrir una conexión', async () => {
  await assert.rejects(
    confirmarReserva(1, { reservaId: 0 }),
    (error) => error.status === 400 &&
      error.message === 'reservaId debe ser un entero positivo válido.',
  );
});
