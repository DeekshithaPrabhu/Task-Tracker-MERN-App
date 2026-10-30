import { Router } from 'express';
import { health } from '../controllers/health.controller.js';

const r = Router();
r.get('/', health);

export default r;
