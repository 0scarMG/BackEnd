import mongoose from 'mongoose';

const lockerSchema = new mongoose.Schema({
    // Vinculamos el locker a una orden específica
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true,
    },
    code: {
        type: String,
        required: true,
        unique: true, // Cada código debe ser único
    },
    // Estado inicial para el dispositivo IoT
    led: { type: String, enum: ['on', 'off'], default: 'off' },
    state: { type: String, enum: ['free', 'occupied'], default: 'free' }, 
    gate: { type: String, enum: ['open', 'close'], default: 'close' },
    // Puedes inicializar los sensores como prefieras
    sensor1: { type: Boolean, default: false },
    sensor2: { type: Boolean, default: false },
    sensor3: { type: Boolean, default: false },
}, {
    timestamps: true
});

const Locker = mongoose.model('Locker', lockerSchema);
export default Locker;