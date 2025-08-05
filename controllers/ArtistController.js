import Artist from '../models/Artist.js';
import { v2 as cloudinary } from 'cloudinary';

// GET all artists
export const getArtists = async (req, res) => {
  try {
    const artists = await Artist.find({});
    res.status(200).json(artists);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// GET artist by ID
export const getArtistById = async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id);
        if (!artist) return res.status(404).json({ message: 'Artista no encontrado.' });
        res.status(200).json(artist);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// CREATE artist
export const createArtist = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'La imagen es obligatoria.' });
    }
    const { name } = req.body;
    const imageUrl = req.file.filename;

    const artist = await Artist.create({ name, imageUrl });
    res.status(201).json(artist);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el artista.' });
  }
};

// UPDATE artist
export const updateArtist = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updateData = { name };

    if (req.file) {
      const oldArtist = await Artist.findById(id);
      if (oldArtist?.imageUrl) {
        await cloudinary.uploader.destroy(oldArtist.imageUrl);
      }
      updateData.imageUrl = req.file.filename;
    }

    const artist = await Artist.findByIdAndUpdate(id, updateData, { new: true });
    if (!artist) return res.status(404).json({ message: 'Artista no encontrado.' });
    res.status(200).json(artist);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el artista.' });
  }
};

// DELETE artist
export const deleteArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ message: 'Artista no encontrado.' });
    }
    if (artist.imageUrl) {
      await cloudinary.uploader.destroy(artist.imageUrl);
    }
    await Artist.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Artista eliminado.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el artista.' });
  }
};