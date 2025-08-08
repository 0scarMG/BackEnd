import express from 'express';
import { createPaypalOrder, captureAndCreateOrder, getAllOrders, getMyOrders } from '../controllers/OrderController.js';
import protect from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authzMiddleware.js';

const router = express.Router();

// protect se encargaría de verificar el token y añadir req.user
router.post('/create-paypal-order', protect, createPaypalOrder);
router.post('/capture-order', protect, captureAndCreateOrder);
router.get('/All-orders', protect, authorize('admin'), getAllOrders); // Obtener todas las órdenes (solo admin)
router.get('/my-orders', protect, getMyOrders); // Obtener órdenes del usuario logue

export default router;