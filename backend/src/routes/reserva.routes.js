import { Router } from 'express';
import { confirmar } from '../controllers/confirmacion.controller.js';

const router = Router();

router.post('/confirmar', confirmar);

export default router;
