import paypalClient from '../config/paypal.js';
import paypal from '@paypal/checkout-server-sdk';
import Cart from '../models/Cart.js';     
import User from '../models/User.js';     
import Order from '../models/Order.js';   
import Locker from '../models/Locker.js'; 
import Product from '../models/Products.js';
import { generateLockerCode } from '../utils/codeGenerator.js';


// OBTENER TODAS LAS ÓRDENES (SOLO ADMIN)
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }); // Ordena por fecha
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error obteniendo las órdenes:", error);
        res.status(500).json({ message: "Error del servidor." });
    }
};

// OBTENER ÓRDENES DEL USUARIO LOGUEADO
export const getMyOrders = async (req, res) => {
  try {
    // Busca las órdenes que coincidan con el ID del usuario del token
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }); // Ordena por fecha
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error obteniendo las órdenes:", error);
    res.status(500).json({ message: "Error del servidor." });
  }
};

// Endpoint para que el frontend pida a PayPal un ID de orden
export const createPaypalOrder = async (req, res) => {
    const { cartId, deliveryMethod } = req.body;
    try {
        const cart = await Cart.findById(cartId).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'El carrito está vacío.' });
        }

        const unavailableProducts = [];
        for (const item of cart.items) {
            if (item.product.stock < item.quantity) {
                unavailableProducts.push({
                    name: item.product.name,
                    requested: item.quantity,
                    available: item.product.stock
                });
            }
        }

        // Si hay productos sin stock, detenemos el proceso y notificamos al cliente.
        if (unavailableProducts.length > 0) {
            return res.status(400).json({
                message: 'No hay suficiente stock para uno o más productos de tu carrito.',
                unavailableProducts
            });
        }


        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        const requestBody = {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: { currency_code: 'MXN', value: cart.total.toFixed(2) }
            }],
            application_context: {
                // Si es para recoger, no le pedimos dirección al usuario en PayPal
                shipping_preference: deliveryMethod === 'TIENDA' ? 'NO_SHIPPING' : 'GET_FROM_FILE',
                brand_name: 'Tu Tienda Increíble',
                user_action: 'PAY_NOW',
            }
        };
        
        request.requestBody(requestBody);
        
        const order = await paypalClient.execute(request);
        res.status(200).json({ orderID: order.result.id });

    } catch (error) {
        console.error("Error creando orden de PayPal:", error);
        res.status(500).json({ message: "Error del servidor." });
    }
};

// Endpoint que se llama DESPUÉS de que el usuario aprueba el pago en PayPal
export const captureAndCreateOrder = async (req, res) => {
    const { paypalOrderId, cartId, deliveryMethod } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    try {
        const capture = await paypalClient.execute(request);
        const captureDetails = capture.result;

        // 1. Validamos que el pago se completó
        if (captureDetails.status !== 'COMPLETED') {
            return res.status(400).json({ message: 'El pago no pudo ser completado.' });
        }

        // 2. Obtenemos los datos necesarios (del carrito y del usuario)
        const cart = await Cart.findById(cartId).populate('items.product');
        const user = await User.findById(cart.userId);

        const stockUpdatePromises = cart.items.map(item =>
            Product.updateOne(
                { _id: item.product._id },
                { $inc: { stock: -item.quantity } } // $inc decrementa el valor de stock
            )
        );
        // Ejecutamos todas las actualizaciones de stock en paralelo.
        await Promise.all(stockUpdatePromises);

        // 3. Creamos la orden en nuestra base de datos
        const newOrder = new Order({
            userId: user._id,
            customer: {
                name: user.name,
                email: user.email,
            },
            total: cart.total,
            status: 'Procesado',
            orderDetails: cart.items.map(item => ({
                _id: item.product._id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity
            })),
            deliveryMethod: deliveryMethod,
            paypalOrderId: paypalOrderId
        });
        await newOrder.save();

        let lockerCode = null;
        // 4. (CONDICIONAL) Si es para recoger en tienda, creamos el locker
        if (deliveryMethod === 'TIENDA') {
            lockerCode = generateLockerCode();
            const newLocker = new Locker({
                orderId: newOrder._id, // Vinculamos el locker a la nueva orden
                code: lockerCode,
                // Los demás campos tomarán sus valores por defecto
            });
            await newLocker.save();
        }

        // 5. Limpiamos el carrito del usuario
        cart.items = [];
        cart.total = 0;
        await cart.save();

        // 6. Enviamos la respuesta final al frontend
        res.status(201).json({
            message: '¡Pago completado y pedido creado!',
            order: newOrder,
            lockerCode: lockerCode // Será null si no es para recoger en tienda
        });

    } catch (error) {
        console.error("Error capturando la orden:", error);
        res.status(500).json({ message: 'Error del servidor al procesar el pago.' });
    }
};