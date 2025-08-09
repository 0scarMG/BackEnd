import paypalClient from '../config/paypal.js';
import paypal from '@paypal/checkout-server-sdk';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Locker from '../models/Locker.js';
import { generateLockerCode } from '../utils/codeGenerator.js';

// OBTENER TODAS LAS ÓRDENES (SOLO ADMIN)
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error obteniendo las órdenes:", error);
        res.status(500).json({ message: "Error del servidor." });
    }
};

// OBTENER ÓRDENES DEL USUARIO LOGUEADO
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error obteniendo las órdenes:", error);
        res.status(500).json({ message: "Error del servidor." });
    }
};

// Endpoint para crear la orden en PayPal
export const createPaypalOrder = async (req, res) => {
    const { cartId, deliveryMethod } = req.body;
    try {
        const cart = await Cart.findById(cartId);
        if (!cart || cart.items.length === 0 || cart.total <= 0) {
            return res.status(400).json({ message: 'El carrito está vacío o el total es cero.' });
        }

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'MXN',
                    value: cart.total.toFixed(2)
                }
            }],
            application_context: {
                shipping_preference: deliveryMethod === 'TIENDA' ? 'NO_SHIPPING' : 'GET_FROM_FILE',
                brand_name: 'K-Store',
                user_action: 'PAY_NOW',
                return_url: 'https://example.com/paypal/success', // URL temporal de éxito
                cancel_url: 'https://example.com/paypal/cancel'  // URL temporal de cancelación
            }
        });
        
        const order = await paypalClient.execute(request);
        res.status(200).json({ orderID: order.result.id });

    } catch (error) {
        console.error("--- INICIO DEL ERROR DETALLADO DE PAYPAL ---");
        console.error("Mensaje:", error.message);
        
        if (error.statusCode) {
            const errorDetails = JSON.parse(error.message);
            console.error("Status Code:", error.statusCode);
            console.error("Detalles del Error de PayPal:", JSON.stringify(errorDetails, null, 2));
            console.error("--- FIN DEL ERROR DETALLADO DE PAYPAL ---");
            
            return res.status(error.statusCode).json({ 
                message: "Error de PayPal al crear la orden. Revisa la consola del servidor.",
                details: errorDetails.details || [{ issue: 'CONFIG_ERROR', description: 'Verifica las credenciales o la configuración de tu cuenta Sandbox.' }]
            });
        }
        
        console.error("--- FIN DEL ERROR (NO ERA DE PAYPAL) ---");
        res.status(500).json({ message: "Ocurrió un error inesperado en el servidor." });
    }
};

export const captureAndCreateOrder = async (req, res) => {
    const { paypalOrderId, cartId, deliveryMethod } = req.body;

    try {
        // --- ✅ PASO 1: VERIFICAR SI LA ORDEN YA EXISTE ---
        const existingOrder = await Order.findOne({ paypalOrderId: paypalOrderId });
        if (existingOrder) {
            console.log("Intento de duplicado de orden. Orden ya existe:", existingOrder._id);
            // Si ya existe, simplemente devolvemos la información sin crear una nueva.
            return res.status(200).json({
                message: 'La orden ya había sido procesada.',
                order: existingOrder,
                // Puedes decidir si necesitas devolver el lockerCode aquí también.
            });
        }

        // --- Si no existe, continuamos con el proceso normal ---
        const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
        request.requestBody({});

        const capture = await paypalClient.execute(request);
        const captureDetails = capture.result;

        if (captureDetails.status !== 'COMPLETED') {
            return res.status(400).json({ message: 'El pago no pudo ser completado.' });
        }

        const cart = await Cart.findById(cartId).populate('items.product');
        if (!cart) return res.status(404).json({ message: 'Carrito no encontrado.' });
        
        const user = await User.findById(cart.userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const newOrder = new Order({
            userId: user._id,
            customer: { name: user.name, email: user.email },
            total: cart.total,
            status: 'Procesado',
            orderDetails: cart.items.map(item => ({
                _id: item.product._id.toString(),
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity
            })),
            deliveryMethod: deliveryMethod,
            paypalOrderId: paypalOrderId
        });
        await newOrder.save();

        let lockerCode = null;
        if (deliveryMethod === 'TIENDA') {
            lockerCode = generateLockerCode();
            const newLocker = new Locker({
                orderId: newOrder._id,
                code: lockerCode,
            });
            await newLocker.save();
        }

        // Limpiamos el carrito del usuario
        cart.items = [];
        cart.total = 0;
        await cart.save();

        res.status(201).json({
            message: '¡Pago completado y pedido creado!',
            order: newOrder,
            lockerCode: lockerCode
        });

    } catch (error) {
        console.error("Error capturando la orden:", error);
        res.status(500).json({ message: 'Error del servidor al procesar el pago.' });
    }
};