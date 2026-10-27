import { Router } from 'express';
import { listarMenu } from '../controllers/menu.controller.js';

const router = Router();

router.get('/', listarMenu);

export default router;
