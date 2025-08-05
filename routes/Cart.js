import express from 'express';
import { getCart, addItemToCart, removeItemFromCart, updateItemQuantity  } from '../controllers/CartController.js';

const router = express.Router();


// GET /api/cart/someUserId123
router.get('/:userId', getCart);

// POST /api/cart/someUserId123
router.post('/:userId', addItemToCart);

// PUT /api/cart/someUserId123/item/someItemId456
router.put('/:userId/item/:itemId', updateItemQuantity);

// DELETE /api/cart/someUserId123/item/someItemId456
router.delete('/:userId/item/:itemId', removeItemFromCart);

export default router;