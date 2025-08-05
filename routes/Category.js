import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory, getCategoryById } from '../controllers/CategoriesController.js';
import protect from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authzMiddleware.js';
import { uploadCloudinary } from '../config/cloudinary.js';

const router = Router();

router.route('/')
  .get(getCategories)
  .post(protect, authorize('admin', 'employee'), uploadCloudinary.single('image'), createCategory);

router.route('/:id')
  .get(getCategoryById) // Ruta pública para obtener una categoría por ID
  .put(protect, authorize('admin', 'employee'), uploadCloudinary.single('image'), updateCategory)
  .delete(protect, authorize('admin'), deleteCategory);

export default router;