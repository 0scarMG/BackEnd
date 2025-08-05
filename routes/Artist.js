import { Router } from 'express';
import { getArtists, createArtist, updateArtist, deleteArtist, getArtistById } from '../controllers/ArtistController.js';
import protect from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authzMiddleware.js';
import { uploadCloudinary } from '../config/cloudinary.js';

const router = Router();

router.route('/')
  .get(getArtists)
  .post(protect, authorize('admin', 'employee'), uploadCloudinary.single('image'), createArtist);

router.route('/:id')
  .get(getArtistById)
  .put(protect, authorize('admin', 'employee'), uploadCloudinary.single('image'), updateArtist)
  .delete(protect, authorize('admin'), deleteArtist);

export default router;