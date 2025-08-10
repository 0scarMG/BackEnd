import express from 'express';
import {
    createLocker,
    updateLocker,
    openLockerByCustomerCode,
    getLockerStatus,
    getAllLockers
} from '../controllers/LockerController.js'; // Asegúrate que la ruta sea correcta

const router = express.Router();

// === RUTAS PARA ADMINISTRACIÓN ===

// Obtener todos los lockers del sistema
// GET /api/lockers
router.get('/', getAllLockers);

// Crear un nuevo locker en la base de datos
// POST /api/lockers
router.post('/', createLocker);


// === RUTAS PARA LA OPERACIÓN DEL CLIENTE Y EL IOT ===

// Validar un código de cliente y comandar la apertura del locker
// El ESP32 "Cerebro" llama a esta ruta.
// POST /api/lockers/open
router.post('/open', openLockerByCustomerCode);

// Obtener el estado de un locker específico
// Puede ser usado por un panel de admin o el ESP32 "Cerebro" para depuración.
// GET /api/lockers/LOCKER_01
router.get('/:CodeLocker', getLockerStatus);

// Actualizar el estado de un locker desde el IoT
// El ESP32 "Cerebro" llama a esta ruta para reenviar los datos de los sensores.
// PUT /api/lockers/LOCKER_01
router.put('/:CodeLocker', updateLocker);


export default router;