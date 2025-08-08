import express from 'express';
import { googleLogin } from '../controllers/UserController.js';
const router = express.Router();

// 1. Importa TODOS los controladores que necesitas
import { 
    getUsers, 
    createUser, 
    loginUser,
    getUserProfile,
    updateUserProfile,
    webLoginUser
} from '../controllers/UserController.js';

// 2. Importa el middleware de protección
import protect from '../middleware/authMiddleware.js';

// --- Rutas Públicas (Cualquiera puede acceder) ---
router.post('/register', createUser);
router.post('/login', loginUser);
router.post('/wlogin', webLoginUser);



// --- Rutas Privadas (Solo usuarios con un token válido pueden acceder) ---

// Ruta para obtener el perfil del usuario logueado y para actualizarlo
router.route('/me')
  .get(protect, getUserProfile)   // GET /api/users/me
  .put(protect, updateUserProfile);  // PUT /api/users/me

// Ruta para obtener la lista de todos los usuarios (también protegida)
router.get('/', protect, getUsers); // GET /api/users

router.post('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
});



router.post('/google-login', googleLogin);


export default router;
