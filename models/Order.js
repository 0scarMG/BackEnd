import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    customer: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        address: { type: String, required: false }, 
    },
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['Procesado', 'Enviado','En Tienda', 'Entregado', 'Cancelado'],
        default: 'Procesado',
    },
    orderDetails: [{
        _id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
    }],
    deliveryMethod: {
        type: String,
        required: true,
        enum: ['DOMICILIO', 'TIENDA'],
    },
    paypalOrderId: { 
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;