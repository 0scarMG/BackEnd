import { Schema, model } from "mongoose";

const categorySchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Por favor agrega un nombre'],
        },
        description: {
            type: String,
            required: [true, 'Por favor agrega una descripción'],
        },
        imageUrl: {
            type: String,
            required: [true, 'Por favor agrega una imagen'],
        },
    },
    {
        timestamps: true,
    }
);

export default model('Category', categorySchema);