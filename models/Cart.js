import mongoose from 'mongoose';
const { Schema } = mongoose;

const CartItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true }
});

const CartSchema = new Schema({
    userId: { type: String, required: true, unique: true },
    items: [CartItemSchema],
    total: { type: Number, required: true, default: 0 }
});

const Cart = mongoose.model('Cart', CartSchema);
export default Cart;