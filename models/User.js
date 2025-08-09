// models/User.js
import { Schema, model } from "mongoose";

const userSchema = new Schema( 
    {
        name: {
            type: String,
            required: [true, 'Por favor agrega un nombre'],
        },
        latestName: {
            type: String,
            required: [false],
        },
        email: {
            type: String,
            required: [true, 'Por favor agrega un email'],
            unique: true,
        },
        imageUrl: {
            type: String,
            required: [false],
        },
        address: {
            type: String,
            required: [false],
        },
        phone: {
            type: String,
            required: [false],
        },
        password: {
            type: String,
            required: [true, 'Por favor agrega una contraseña'],
        },
        status: {
            type: String,
            required: [true, 'Por favor agrega un estado'],
            enum: ['active', 'inactive'],
            default: 'active',
        },
        role: {
            type: String,
            required: true,
            enum: ['client', 'admin', 'employee'], 
            default: 'client',
         },
          passwordResetCode: String,
          passwordResetExpires: Date,
        
        }, { timestamps: true });

export default model('User', userSchema);