import { Schema, model } from "mongoose";

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Por favor agrega un nombre de producto'],
        },
        imageUrl: {
            type: String,
            required: [true, 'Por favor agrega una imagen de producto'],
        },
        originalPrice: {
            type: Number,
            required: [true, 'Por favor agrega un precio de producto'],
        },
        description: {
            type: String,
            required: [true, 'Por favor agrega una descripción de producto'],
        },
        sku: {
            type: String,
            required: false,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category'
        },
        artist: {
            type: Schema.Types.ObjectId,
            ref: 'Artist',
        },
        stock: {
            type: Number,
            required: false,
            default: 0,
        },
        discountPercentage: {
            type: Number,
            required: false,
        },
        price: {
            type: Number,
            required: false,
            default: 0,
        },
        prevent: {
            type: Boolean,
            required: false,
            default: false,
        },
        active: {
            type: Boolean,
            required: false,
            default: true,
        },
    },
    {
        timestamps: true,
    }    
);
export default model('Product', productSchema);