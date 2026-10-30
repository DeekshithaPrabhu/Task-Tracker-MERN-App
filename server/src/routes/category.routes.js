import { Router } from 'express';
import * as category from '../controllers/category.controller.js';

const r = Router();

r.get('/', category.listCategories);
r.post('/', category.createCategory);
r.patch('/:id', category.renameCategory);
r.delete('/:id', category.deleteCategory);

export default r;
