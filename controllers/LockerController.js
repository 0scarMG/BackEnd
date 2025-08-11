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
        const { sensor1, sensor2, sensor3, gate, led, state } = req.body; 

        const locker = await Locker.findOne({ CodeLocker });
        if (!locker) {
            return res.status(404).json({ message: 'Locker no encontrado.' });
        }

        
        // --- Actualización normal ---
        // Si no se cumple la condición de reseteo, simplemente actualiza los campos que llegaron en la petición.
        if (sensor1 !== undefined) locker.sensor1 = sensor1;
        if (sensor2 !== undefined) locker.sensor2 = sensor2;
        if (sensor3 !== undefined) locker.sensor3 = sensor3;
        if (gate !== undefined) locker.gate = gate;
        if (led !== undefined) locker.led = led;
        if (state !== undefined) locker.state = state;
        
        await locker.save();
        res.status(200).json({ message: 'Estado del locker actualizado.', locker });

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.', error: error.message });
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

/**
 * @description 👤 ADMIN: Elimina un locker del sistema.
 * @route DELETE /api/lockers/:CodeLocker
 */
export const deleteLocker = async (req, res) => {
  try {
    const { CodeLocker } = req.params;
    const locker = await Locker.findOneAndDelete({ CodeLocker });

    if (!locker) {
      return res.status(404).json({ message: 'Locker no encontrado.' });
    }
    res.status(200).json({ message: 'Locker eliminado exitosamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.', error: error.message });
  }
};


/**
 * @description 🤖 IOT: Valida un código de cliente y abre el locker si es correcto.
 * @route POST /api/lockers/open
 */
export const openLockerByCode = async (req, res) => {
    try {
        const { CodeLocker, code } = req.body;

        if (!CodeLocker || !code) {
            return res.status(400).json({ message: 'CodeLocker y código son requeridos.' });
        }

        const locker = await Locker.findOne({ CodeLocker });
        if (!locker) {
            return res.status(404).json({ message: 'Locker no encontrado.' });
        }

        // Lógica para cerrar el locker con el código 111111
        if (code === '111111') {
            locker.gate = 'close';
            locker.led = 'off';
            locker.state = 'free'; // Cambia el estado a libre
            locker.orderId = ''; // Limpia la referencia a la orden
            locker.code = ''; // Limpia el código del locker
            await locker.save();
            return res.status(200).json({ 
                message: 'Código de cierre validado. Puerta cerrada y LED apagado.', 
                locker 
            });
        }

        // Lógica original para abrir el locker
        if (locker.state === 'occupied' && locker.code === code) {
            locker.gate = 'open';
            locker.led = 'on';
            await locker.save();

            return res.status(200).json({ 
                message: 'Código validado. Puerta abierta y LED encendido.', 
                locker 
            });
        } else if (locker.state !== 'occupied') {
            return res.status(403).json({ message: 'El locker no está ocupado.' });
        } else {
            return res.status(401).json({ message: 'Código inválido.' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.', error: error.message });
    }
};


/**
 * @description 🤖 IOT: Actualiza los valores de los sensores del locker.
 * @route PUT /api/lockers/sensors/:CodeLocker
 */
export const updateSensors = async (req, res) => {
    try {
        const { CodeLocker } = req.params;
        const { sensor1, sensor2, sensor3 } = req.body;

        const locker = await Locker.findOne({ CodeLocker });
        if (!locker) {
            return res.status(404).json({ message: 'Locker no encontrado.' });
        }
        
        // Actualiza solo los sensores que se envíen
        if (sensor1 !== undefined) locker.sensor1 = sensor1;
        if (sensor2 !== undefined) locker.sensor2 = sensor2;
        if (sensor3 !== undefined) locker.sensor3 = sensor3;

        await locker.save();
        res.status(200).json({ message: 'Valores de sensores actualizados.', locker });

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.', error: error.message });
    }
};