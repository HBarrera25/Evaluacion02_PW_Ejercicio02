import { Router } from 'express';
import { consultar, agregar } from '../controllers/reserva.controller.js';

const router = Router();
router.get('/', consultar);
router.post('/agregar', agregar);
export default router;