import Locker from "../models/Locker.js";
import Order from "../models/Order.js";


/**
 * @description 👤 ADMIN: Crea un nuevo locker en el sistema.
 * @route POST /api/lockers
 */
export const createLocker = async (req, res) => {
    try {
        const { CodeLocker } = req.body;
        if (!CodeLocker) {
            return res.status(400).json({ message: 'El CodeLocker es requerido.' });
        }

        const existingLocker = await Locker.findOne({ CodeLocker });
        if (existingLocker) {
            return res.status(400).json({ message: 'Ya existe un locker con ese CodeLocker.' });
        }
        
        // El cliente no necesita un código al crearse
        const locker = new Locker({ CodeLocker, code: null });
        await locker.save();
        res.status(201).json({ message: 'Locker creado exitosamente.', locker });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.', error: error.message });
    }
};

/**
 * @description 🤖 IOT / 👤 ADMIN: Actualiza los campos del locker. Es la función principal para el ESP32.
 * @route PUT /api/lockers/:CodeLocker
 */
export const updateLocker = async (req, res) => {
    try {
        const { CodeLocker } = req.params;
        // Recibe los campos que el IoT puede actualizar: sus sensores y estado de la puerta/led
        const { sensor1, sensor2, sensor3, gate, led } = req.body; 

        const locker = await Locker.findOne({ CodeLocker });
        if (!locker) {
            return res.status(404).json({ message: 'Locker no encontrado.' });
        }

        // --- Lógica de reseteo automático ---
        // Si el locker estaba ocupado y los sensores ahora marcan cero, significa que el producto fue retirado.
        const isNowEmpty = sensor1 === 0 && sensor2 === 0 && sensor3 === 0;
        if (locker.state === 'occupied' && isNowEmpty) {
            locker.state = 'free';      // Lo marca como libre
            locker.gate = 'close';      // Asegura que la puerta se cierre
            locker.led = 'off';         // Apaga el indicador
            locker.orderId = null;      // Desvincula la orden
            locker.code = null;         // Borra el código temporal del cliente

            // Actualiza los valores de los sensores a su estado actual
            locker.sensor1 = sensor1;
            locker.sensor2 = sensor2;
            locker.sensor3 = sensor3;

            await locker.save();
            // Devuelve el estado actualizado, indicando que se ha reseteado
            return res.status(200).json({ message: 'Locker vaciado y reseteado a estado libre.', locker });
        }
        
        // --- Actualización normal ---
        // Si no se cumple la condición de reseteo, simplemente actualiza los campos que llegaron en la petición.
        if (sensor1 !== undefined) locker.sensor1 = sensor1;
        if (sensor2 !== undefined) locker.sensor2 = sensor2;
        if (sensor3 !== undefined) locker.sensor3 = sensor3;
        if (gate !== undefined) locker.gate = gate;
        if (led !== undefined) locker.led = led;
        
        await locker.save();
        res.status(200).json({ message: 'Estado del locker actualizado.', locker });

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.', error: error.message });
    }
};

/**
 * @description 👤 CLIENTE: Abre el locker usando el código que se le proporcionó.
 * @route POST /api/lockers/open
 */
export const openLockerByCustomerCode = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ message: 'El código es requerido.' });
        }

        // Busca un locker que tenga ese código y esté ocupado
        const locker = await Locker.findOne({ code, state: 'occupied' });

        if (!locker) {
            return res.status(404).json({ message: 'Código inválido, expirado o el locker no está ocupado.' });
        }

        // Le "ordena" al locker que se abra. El ESP32 leerá este estado.
        locker.gate = 'open';
        locker.led = 'on';
        await locker.save();

        res.status(200).json({ 
            message: 'Comando de apertura enviado.',
            CodeLocker: locker.CodeLocker // Devuelve el ID físico del locker
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.', error: error.message });
    }
};

/**
 * @description 🤖 IOT: Actualiza únicamente los valores de los sensores de un locker.
 * @route PATCH /api/lockers/sensors/:CodeLocker
 */
export const updateLockerSensors = async (req, res) => {
    try {
        const { CodeLocker } = req.params;
        // Solo nos interesan los valores de los sensores del cuerpo de la petición
        const { sensor1, sensor2, sensor3 } = req.body;

        // Validamos que al menos un valor de sensor fue enviado
        if (sensor1 === undefined && sensor2 === undefined && sensor3 === undefined) {
            return res.status(400).json({ message: 'No se proporcionaron valores de sensores para actualizar.' });
        }

        const updateData = {};
        if (sensor1 !== undefined) updateData.sensor1 = sensor1;
        if (sensor2 !== undefined) updateData.sensor2 = sensor2;
        if (sensor3 !== undefined) updateData.sensor3 = sensor3;

        // Usamos findOneAndUpdate para encontrar el locker por su CodeLocker y actualizarlo
        const updatedLocker = await Locker.findOneAndUpdate(
            { CodeLocker: CodeLocker },
            { $set: updateData },
            { new: true } // Esta opción hace que devuelva el documento ya actualizado
        );

        if (!updatedLocker) {
            return res.status(404).json({ message: 'Locker no encontrado.' });
        }

        res.status(200).json({ message: 'Valores de sensores actualizados exitosamente.', locker: updatedLocker });

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor al actualizar sensores.', error: error.message });
    }
};

/**
 * @description 🤖 IOT / 👤 ADMIN: Obtiene el estado actual y completo de un locker específico.
 * @route GET /api/lockers/:CodeLocker
 */
export const getLockerStatus = async (req, res) => {
    try {
        const { CodeLocker } = req.params;
        const locker = await Locker.findOne({ CodeLocker });
        if (!locker) {
            return res.status(404).json({ message: 'Locker no encontrado.' });
        }
        res.status(200).json(locker);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.', error: error.message });
    }
};

/**
 * @description 👤 ADMIN: Obtiene una lista de todos los lockers del sistema.
 * @route GET /api/lockers
 */
export const getAllLockers = async (req, res) => {
    try {
        const lockers = await Locker.find();
        res.status(200).json(lockers);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.', error: error.message });
    }
};