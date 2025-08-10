import paypalClient from '../config/paypal.js';
import paypal from '@paypal/checkout-server-sdk';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Locker from '../models/Locker.js';
import Product from '../models/Products.js';
import { generateLockerCode } from '../utils/codeGenerator.js';

// --- ✅ OBTENER MIS PEDIDOS (VERSIÓN CORREGIDA CON AGREGACIÓN) ---
// Esta función une las órdenes con sus códigos de casillero.
export const getMyOrders = async (req, res) => {
  try {
    const ordersWithLockerCodes = await Order.aggregate([
      // 1. Encontrar todas las órdenes del usuario.
      { $match: { userId: req.user._id } },
      // 2. Ordenarlas por fecha.
      { $sort: { createdAt: -1 } },
      // 3. Unir con la colección 'lockers'.
      {
        $lookup: {
          from: 'lockers', // La colección con la que queremos unir.
          localField: '_id', // El campo de la colección 'Order'.
          foreignField: 'orderId', // El campo de la colección 'Locker'.
          as: 'lockerInfo' // Nombre del array temporal con los datos unidos.
        }
      },
      // 4. Deconstruir el array 'lockerInfo' para facilitar el acceso.
      {
        $unwind: {
          path: '$lockerInfo',
          preserveNullAndEmptyArrays: true // Mantiene las órdenes aunque no tengan locker.
        }
      },
      // 5. Darle forma al resultado final.
      {
        $project: {
          // Incluimos todos los campos originales de la orden.
          _id: 1, userId: 1, customer: 1, total: 1, status: 1,
          orderDetails: 1, deliveryMethod: 1, paypalOrderId: 1,
          createdAt: 1, updatedAt: 1,
          // Añadimos el nuevo campo 'lockerCode'.
          // Si 'lockerInfo' existe, toma su código; si no, es null.
          lockerCode: '$lockerInfo.code'
        }
      }
    ]);

    res.status(200).json(ordersWithLockerCodes);

  } catch (error) {
    console.error("Error obteniendo las órdenes del usuario:", error);
    res.status(500).json({ message: "Error del servidor." });
  }
};

// --- OTRAS FUNCIONES DEL CONTROLADOR ---

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error obteniendo las órdenes:", error);
        res.status(500).json({ message: "Error del servidor." });
    }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada.' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada.' });
    }

    order.status = status;
    await order.save();
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la orden.' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada.' });
    }

    order.status = status;
    await order.save();
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la orden.' });
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

        if (deliveryMethod === 'TIENDA') {
            const availableLocker = await Locker.findOne({ status: 'libre' });
            if (!availableLocker) {
                return res.status(400).json({ 
                    message: 'No hay lockers disponibles en este momento.' 
                });
            }
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

        if (unavailableProducts.length > 0) {
            return res.status(400).json({
                message: 'No hay suficiente stock para uno o más productos.',
                unavailableProducts
            });
        }

        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: { currency_code: 'MXN', value: cart.total.toFixed(2) }
            }],
            application_context: {
                shipping_preference: deliveryMethod === 'TIENDA' ? 'NO_SHIPPING' : 'GET_FROM_FILE',
                brand_name: 'K-Store',
                user_action: 'PAY_NOW',
            }
        });
        
        const order = await paypalClient.execute(request);
        res.status(200).json({ orderID: order.result.id });

    } catch (error) {
        console.error("Error creando orden de PayPal:", error);
        res.status(500).json({ message: "Error del servidor." });
    }
};

export const captureAndCreateOrder = async (req, res) => {
    const { paypalOrderId, cartId, deliveryMethod } = req.body;
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    try {
        const capture = await paypalClient.execute(request);
        const captureDetails = capture.result;

        if (captureDetails.status !== 'COMPLETED') {
            return res.status(400).json({ message: 'El pago no pudo ser completado.' });
        }

        const cart = await Cart.findById(cartId).populate('items.product');
        const user = await User.findById(cart.userId);

        const stockUpdatePromises = cart.items.map(item =>
            Product.updateOne(
                { _id: item.product._id },
                { $inc: { stock: -item.quantity } }
            )
        );
        await Promise.all(stockUpdatePromises);

        const newOrder = new Order({
            userId: user._id,
            customer: {
                name: user.name,
                email: user.email,
                address: user.address || 'No proporcionada',
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
        if (deliveryMethod === 'TIENDA') {
            const customerCode = generateLockerCode();
            const assignedLocker = await Locker.findOneAndUpdate(
                { status: 'libre' },
                { $set: { status: 'ocupado', orderId: newOrder._id, code: customerCode } },
                { new: true }
            );

            if (!assignedLocker) {
                // Esto es una salvaguarda por si el locker se ocupó entre el chequeo y la asignación
                throw new Error('El locker fue ocupado inesperadamente.');
            }
            lockerCode = assignedLocker.code;
        }

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