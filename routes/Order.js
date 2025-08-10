// routes/Order.js
import express from 'express';
import { 
  createPaypalOrder, 
  captureAndCreateOrder, 
  getMyOrders, 
  getAllOrders, // <-- Importa las nuevas funciones
  getOrderById, 
  updateOrderStatus 
} from '../controllers/OrderController.js';
import protect from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authzMiddleware.js';

const router = express.Router();

// --- RUTAS DE CLIENTE ---
router.post('/create-paypal-order', protect, createPaypalOrder);
router.post('/capture-order', protect, captureAndCreateOrder);
router.get('/my-orders', protect, getMyOrders);

// --- RUTAS DE ADMINISTRACIÓN ---
router.get('/', protect, authorize('admin', 'employee'), getAllOrders);
router.get('/:id', protect, authorize('admin', 'employee'), getOrderById);
router.put('/:id/status', protect, authorize('admin', 'employee'), updateOrderStatus);

export default router;