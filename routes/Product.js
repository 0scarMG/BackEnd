// routes/Product.js
import express from 'express';
import { getProducts, createProduct, getProductById, updateProduct, deleteProduct } from '../controllers/ProductController.js'; 
import { uploadCloudinary } from '../config/cloudinary.js';
import protect from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authzMiddleware.js';

const router = express.Router();



router.get('/', getProducts);
router.get('/:id', getProductById);


// POST para crear un producto (solo admins y empleados)
router.post(
  '/', 
  protect, 
  authorize('admin', 'employee'), 
  uploadCloudinary.single('image'), 
  createProduct
);

// PUT para actualizar un producto (solo admins y empleados)
router.put(
  '/:id', 
  protect, 
  authorize('admin', 'employee'), 
  uploadCloudinary.single('image'), 
  updateProduct
);

// DELETE para eliminar un producto (solo admins)
router.delete(
  '/:id', 
  protect, 
  authorize('admin'), // <-- Solo el rol 'admin' puede pasar
  deleteProduct
);
export default router;