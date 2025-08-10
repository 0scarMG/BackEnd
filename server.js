// server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import cookieParser from 'cookie-parser';
import UserRouter from './routes/User.js';
import CategoryRouter from './routes/Category.js';
import CartRouter from './routes/Cart.js';
import ProductRouter from './routes/Product.js';
import ArtistRouter from './routes/Artist.js';
import OrderRouter from './routes/Order.js';
import LockerRouter from './routes/Locker.js';

import './models/Products.js'; // Importar el modelo de productos
import './models/Category.js'; // Importar el modelo de categorías


// Conectar a la base de datos
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor corriendo en el puerto ${PORT}`));

const corsOptions = {
  origins: ['http://localhost:4200', 'http://localhost:8081', 'exp://192.168.22.34:8081'],
};
// Middlewares
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/users', UserRouter);
app.use('/api/categories', CategoryRouter);
app.use('/api/products', ProductRouter);
app.use('/api/cart', CartRouter); 
app.use('/api/artists', ArtistRouter);
app.use('/api/orders', OrderRouter);
app.use('/api/lockers', LockerRouter);
