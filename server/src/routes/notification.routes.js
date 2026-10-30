import { Router } from 'express';
import { getNotifications } from '../controllers/notification.controller.js';

const r = Router();
r.get('/', getNotifications);

export default r;
