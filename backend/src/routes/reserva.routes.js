import { Router } from 'express';
import {
  consultar,
  agregar,
  iniciar,
  expirar,
} from '../controllers/reserva.controller.js';
import {
  cambiar,
  quitar,
} from '../controllers/porciones.controller.js';
import { confirmar } from '../controllers/confirmacion.controller.js';

const router = Router();

router.get('/', consultar);
router.post('/iniciar', iniciar);
router.post('/expirar', expirar);
router.post('/agregar', agregar);
router.patch('/porciones', cambiar);
router.delete('/items/:alimentoId', quitar);
router.post('/confirmar', confirmar);

export default router;
