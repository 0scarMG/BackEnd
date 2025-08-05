// config/db.js
import mongoose from 'mongoose';


const connectDB = async () => {

    const MONGO_URI_ATLAS = process.env.MONGO_URI_ATLAS;
    const MONGO_URI_LOCAL = process.env.MONGO_URI_LOCAL;
    
    // Intenta conectar a MongoDB Atlas primero
    try {
        console.log('Intentando conectar a MongoDB Atlas...');
        const conn = await mongoose.connect(MONGO_URI_ATLAS, {

        });
        console.log(`MongoDB Atlas Conectado: ${conn.connection.host}`);
        return; // Si la conexión a Atlas es exitosa, no es necesario intentar conectar a local
    } catch (error) {
        console.error(`Error al conectar a MongoDB Atlas: ${error.message}`);
        console.log('Intentando conectar a MongoDB local (Compass)...');
    }

    // Si la conexión a Atlas falla, intenta conectar a MongoDB local
    try {
        const conn = await mongoose.connect(MONGO_URI_LOCAL, {
            // Opciones de conexión adicionales si son necesarias para local
        });
        console.log(`MongoDB Local Conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error al conectar a MongoDB Local: ${error.message}`);
        console.error('No se pudo conectar a ninguna base de datos MongoDB.');
        process.exit(1);
    }
};

export default connectDB; // Exportación por defecto