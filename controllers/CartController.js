import Cart from '../models/Cart.js';
import Product from '../models/Products.js';

// @desc Recualcular el total del carrito
// @ route POST /api/cart/recalculate
// @access Private

// Función helper para recalcular el total
async function recalculateCartTotal(cart) {
    cart.total = 0;
    if (cart.items.length > 0) {
        cart.total = cart.items.map(item => item.price * item.quantity).reduce((acc, current) => acc + current, 0);
    }
    await cart.save();
}

// @desc    Obtener el carrito de un usuario
// @route   GET /api/cart/:userId
// @access  Public

// Obtener el carrito de un usuario
export const getCart = async (req, res) => {
    try {
        const userId = req.params.userId;
        let cart = await Cart.findOne({ userId }).populate('items.product');

        if (!cart) {
            cart = new Cart({ userId, items: [], total: 0 });
            await cart.save();
        }
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el carrito', error: error.message });
    }
};

// @desc    Añadir un ítem al carrito
// @route   POST /api/cart/:userId
// @access  Public

// Añadir o actualizar un ítem en el carrito
export const addItemToCart = async (req, res) => {
    const { userId } = req.params;
    const { productId, quantity } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [], total: 0 });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ product: productId, quantity, price: product.price });
        }
        
        await recalculateCartTotal(cart);
        await cart.populate('items.product');
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error al añadir el ítem', error: error.message });
    }
};

// @desc    Eliminar un ítem del carrito
// @route   DELETE /api/cart/:userId/item/:itemId
// @access  Public

// Eliminar un ítem del carrito
export const removeItemFromCart = async (req, res) => {
    const { userId, itemId } = req.params;

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1);
            await recalculateCartTotal(cart);
            await cart.populate('items.product');
            res.status(200).json(cart);
        } else {
            res.status(404).json({ message: 'Ítem no encontrado en el carrito' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el ítem', error: error.message });
    }
};


export const updateItemQuantity = async (req, res) => {
    const { userId, itemId } = req.params;
    const { quantity } = req.body;

    // Validar que la cantidad sea un número válido y mayor que 0
    if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: 'La cantidad debe ser al menos 1.' });
    }

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);

        if (itemIndex > -1) {
            // Actualiza la cantidad del ítem encontrado
            cart.items[itemIndex].quantity = quantity;

            await recalculateCartTotal(cart);
            await cart.populate('items.product');
            res.status(200).json(cart);
        } else {
            res.status(404).json({ message: 'Ítem no encontrado en el carrito' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar la cantidad', error: error.message });
    }
};