// controllers/UserController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Generar un token JWT
const generateToken = (user) => { 
    
    if (!process.env.JWT_SECRET) {
        console.error('Error: JWT_SECRET no está definido...');
        throw new Error('Configuración de autenticación faltante.');
    }
    return jwt.sign(
        {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        },
        
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

// --- Controlador de Usuarios ---

// @desc    Obtener todos los usuarios
// @route   GET /api/users
// @access  Private (ahora protegido por middleware)
export const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Crear un nuevo usuario (Registro)
// @route   POST /api/users/register
// @access  Public
export const createUser = async (req, res) => {
    const { name, email, password } = req.body;

    const trimmedName = name ? name.trim() : '';
    const trimmedEmail = email ? email.trim() : '';
    const trimmedPassword = password ? password.trim() : '';

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
        return res.status(400).json({ message: 'Por favor, completa todos los campos (nombre, email, contraseña).' });
    }

    try {
        const userExists = await User.findOne({ email: trimmedEmail });
        if (userExists) {
            return res.status(400).json({ message: 'El usuario ya existe con este correo electrónico.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(trimmedPassword, salt);

        const user = await User.create({
            name: trimmedName,
            email: trimmedEmail,
            password: hashedPassword,
        });

        if (user) {
            return res.status(201).json({
                message: 'Usuario registrado exitosamente. Ahora puedes iniciar sesión.'
            });
        } else {
            return res.status(400).json({ message: 'Datos de usuario inválidos.' });
        }

    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            return res.status(400).json({ message: 'El email proporcionado ya está registrado.' });
        }
        console.error("Error al crear usuario:", error);
        res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
    }
};

// @desc    Autenticar un usuario (Inicio de Sesión)
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const trimmedEmail = email ? email.trim() : '';
    const trimmedPassword = password ? password.trim() : '';

    if (!trimmedEmail || !trimmedPassword) {
        return res.status(400).json({ message: 'Por favor, introduce tu correo electrónico y contraseña.' });
    }

    try {
        const user = await User.findOne({ email: trimmedEmail });

        if (user && (await bcrypt.compare(trimmedPassword, user.password))) {
            return res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

    } catch (error) {
        console.error("Error en el inicio de sesión:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


// ==================================================================
// ▼▼▼ NUEVAS FUNCIONES AÑADIDAS ▼▼▼
// ==================================================================

// @desc    Obtener el perfil del usuario logueado
// @route   GET /api/users/me
// @access  Private (requiere token)
export const getUserProfile = async (req, res) => {
    try {
        // req.user es añadido por el middleware de autenticación
        const user = await User.findById(req.user.id).select('-password');
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'Usuario no encontrado.' });
        }
    } catch (error) {
         console.error('FALLO EN getUserProfile:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// @desc    Actualizar el perfil del usuario
// @route   PUT /api/users/me
// @access  Private (requiere token)
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            // Actualizar nombre (sin verificación)
            user.name = req.body.name || user.name;

            // Actualizar email (con verificación de contraseña)
            if (req.body.newEmail) {
                const { currentPassword, newEmail } = req.body;
                if (!currentPassword || !newEmail) {
                    return res.status(400).json({ message: 'Para cambiar el email, se requiere la contraseña actual y el nuevo email.' });
                }

                const isMatch = await bcrypt.compare(currentPassword, user.password);
                if (!isMatch) {
                    return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
                }

                const emailExists = await User.findOne({ email: newEmail });
                if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                    return res.status(400).json({ message: 'El nuevo email ya está registrado.' });
                }
                
                user.email = newEmail;
            }

            const updatedUser = await user.save();

            res.status(200).json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
            });

        } else {
            res.status(404).json({ message: 'Usuario no encontrado.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// @desc    Autenticar o registrar un usuario con Google
// @route   POST /api/users/google-login
// @access  Public
export const googleLogin = async (req, res) => {
    const { idToken } = req.body;

    try {
        // 1. Verificar el idToken con los servidores de Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID, // El mismo Client ID
        });
        const { name, email } = ticket.getPayload();

        // 2. Buscar si el usuario ya existe en nuestra BD
        let user = await User.findOne({ email });

        if (user) {
            // Si el usuario existe, simplemente generamos un token para él
            const token = generateToken(user._id);
            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token,
            });
        } else {
            // 3. Si el usuario no existe, lo creamos
            // Creamos una contraseña aleatoria y la hasheamos (no se usará para login)
            const password = Math.random().toString(36).slice(-8);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = await User.create({
                name,
                email,
                password: hashedPassword,
            });

            if (newUser) {
                const token = generateToken(newUser._id);
                res.status(201).json({
                    _id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    token,
                });
            } else {
                res.status(400).json({ message: 'No se pudo crear el usuario.' });
            }
        }
    } catch (error) {
        console.error("Error en el login con Google:", error);
        res.status(401).json({ message: 'Autenticación con Google fallida.' });
    }
};

//@desc    Autenticar un usuario (Inicio de Sesión)
// @route   POST /api/users/login
// @access  Public
export const webLoginUser = async (req, res) => {
    const { email, password } = req.body;

    const trimmedEmail = email ? email.trim() : '';
    const trimmedPassword = password ? password.trim() : '';

    if (!trimmedEmail || !trimmedPassword) {
        return res.status(400).json({ message: 'Por favor, introduce tu correo electrónico y contraseña.' });
    }

    try {
        const user = await User.findOne({ email: trimmedEmail });

        if (user && (await bcrypt.compare(trimmedPassword, user.password))) {
            const token = generateToken(user);

            // Guardamos el token en una cookie segura
            res.cookie('authToken', token, {
            httpOnly: true, // El frontend no puede leer/modificar esta cookie con JS
            secure: process.env.NODE_ENV === 'production', // Solo enviar en HTTPS en producción
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000 // 1 hora, igual que el token
            });

            return res.status(200).json({
            user: { _id: user._id, name: user.name, email: user.email, role: user.role },
            token: token,
            });
        } else {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

    } catch (error) {
        console.error("Error en el inicio de sesión:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};