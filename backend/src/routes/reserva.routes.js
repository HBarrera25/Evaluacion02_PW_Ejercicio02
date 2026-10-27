import { Router } from 'express';
import {
  consultar,
  agregar,
} from '../controllers/reserva.controller.js';
import {
  cambiar,
  quitar,
} from '../controllers/porciones.controller.js';

const router = Router();
router.get('/', consultar);
router.post('/agregar', agregar);
router.patch('/porciones', cambiar);
router.delete('/items/:alimentoId', quitar);

export default router;