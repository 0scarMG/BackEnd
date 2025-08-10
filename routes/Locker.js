import express from 'express';
import {
    createLocker,
    updateLocker,
    openLockerByCustomerCode,
    updateLockerSensors,
    getLockerStatus,
    getAllLockers,
    deleteLocker
} from '../controllers/locker.controller.js'; // Asegúrate de que la ruta a tu controlador sea correcta

// Opcional: Aquí importarías tus middlewares de seguridad si los tuvieras
// import { isAdmin, verifyToken } from '../middlewares/auth.js';

const router = express.Router();


// === RUTAS PARA ADMINISTRACIÓN (PÁGINA WEB) ===
// Idealmente, estas rutas estarían protegidas por un middleware de autenticación (ej. isAdmin)

// Obtener una lista de todos los lockers
// GET /api/lockers
router.get('/', getAllLockers);

// Crear un nuevo locker
// POST /api/lockers
router.post('/', createLocker);

// Actualizar CUALQUIER campo de un locker (función potente para admins)
// PUT /api/lockers/LOCKER_01
router.put('/:CodeLocker', updateLocker);

// Eliminar un locker del sistema
// DELETE /api/lockers/LOCKER_01
router.delete('/:CodeLocker', deleteLocker);


// === RUTAS PARA CLIENTE Y DISPOSITIVO IOT ===

// Ruta para que el cliente valide su código y abra el locker
// El ESP32 "Cerebro" llamará a este endpoint.
// POST /api/lockers/open
router.post('/open', openLockerByCustomerCode);

// Ruta para que el ESP32 "Cerebro" actualice ÚNICAMENTE los datos de los sensores
// PATCH /api/lockers/sensors/LOCKER_01
router.patch('/sensors/:CodeLocker', updateLockerSensors);

// Ruta para que el ESP32 "Cerebro" o un admin consulten el estado de un locker
// GET /api/lockers/LOCKER_01
router.get('/:CodeLocker', getLockerStatus);


export default router;