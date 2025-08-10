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
    webLoginUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
} from '../controllers/UserController.js';

import protect from '../middleware/authMiddleware.js'
import { authorize } from '../middleware/authzMiddleware.js';

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

router.route('/all')
  .get(protect, authorize('admin'), getAllUsers);

router.route('/:id')
  .get(protect, authorize('admin'), getUserById)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

router.post('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
});
// ... tus importaciones y rutas existentes ...

import { forgotPassword, resetPassword } from '../controllers/UserController.js';

// ...
router.post('/login', loginUser);
router.post('/register', createUser);

// --- ✅ NUEVAS RUTAS ---
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


router.post('/google-login', googleLogin);


export default router;
