// config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
    // Obtenemos todas las URIs de las variables de entorno
    const MONGO_URI_RAILWAY = process.env.MONGO_URI_RAILWAY;
    const MONGO_URI_ATLAS = process.env.MONGO_URI_ATLAS;
    const MONGO_URI_LOCAL = process.env.MONGO_URI_LOCAL;

    // --- Intento 1: Conectar a Railway (Máxima Prioridad) ---
    if (MONGO_URI_RAILWAY) {
        try {
            console.log('🔌 Intentando conectar a Railway...');
            const conn = await mongoose.connect(MONGO_URI_RAILWAY);
            console.log(`✅ MongoDB Conectado en Railway: ${conn.connection.host}`);
            return; // Conexión exitosa, salimos de la función
        } catch (error) {
            console.warn(`⚠️  Error al conectar a Railway: ${error.message}`);
            // Si falla, no hacemos nada y dejamos que continúe al siguiente bloque
        }
    }

    // --- Intento 2: Conectar a MongoDB Atlas (Si Railway falla) ---
    if (MONGO_URI_ATLAS) {
        try {
            console.log('🔌 Intentando conectar a MongoDB Atlas...');
            const conn = await mongoose.connect(MONGO_URI_ATLAS);
            console.log(`✅ MongoDB Conectado en Atlas: ${conn.connection.host}`);
            return; // Conexión exitosa, salimos
        } catch (error) {
            console.warn(`⚠️  Error al conectar a MongoDB Atlas: ${error.message}`);
             // Si falla, dejamos que continúe
        }
    }

    // --- Intento 3: Conectar a MongoDB Local (Último recurso) ---
    if (MONGO_URI_LOCAL) {
        try {
            console.log('🔌 Intentando conectar a MongoDB Local...');
            const conn = await mongoose.connect(MONGO_URI_LOCAL);
            console.log(`✅ MongoDB Conectado Localmente: ${conn.connection.host}`);
            return; // Conexión exitosa, salimos
        } catch (error) {
            console.warn(`⚠️  Error al conectar a MongoDB Local: ${error.message}`);
             // Si falla, se ejecutará la lógica de reintento de abajo
        }
    }

    // --- Si todas las conexiones fallan ---
    console.error('🔴 No se pudo conectar a ninguna base de datos.');
    console.log('🔄 Reintentando conexión en 10 segundos...');

    // Espera 10 segundos y vuelve a llamar a esta misma función para reintentar todo el proceso.
    setTimeout(connectDB, 10000);
};

export default connectDB;