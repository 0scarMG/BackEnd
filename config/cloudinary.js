// config/cloudinary.js
import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// --- CONFIGURACIÓN EXPLÍCITA Y MANUAL ---
// Lee las 3 variables del .env y configura la librería.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// -----------------------------------------

// El resto del código no cambia
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'KStore-Products',
    allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
  },
});

export const uploadCloudinary = multer({ storage: storage });