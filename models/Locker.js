import mongoose from 'mongoose';

const lockerSchema = new mongoose.Schema({
    // Vinculamos el locker a una orden específica
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        unique: true,
        sparse: true 
    },
    // Código único para identificar el locker
    CodeLocker: {    
        type: String,
        unique: true,
    },
    code: {
        type: String,
        unique: true,
    },
    // Estado inicial para el dispositivo IoT
    led: { type: String, enum: ['on', 'off'], default: 'off' },
    state: { type: String, enum: ['free', 'occupied'], default: 'free' }, 
    gate: { type: String, enum: ['open', 'close'], default: 'close' },
    sensor1: { type: Number, default: 0 },
    sensor2: { type: Number, default: 0 },
    sensor3: { type: Number, default: 0 },
}, {
    timestamps: true
});

const Locker = mongoose.model('Locker', lockerSchema);
export default Locker;