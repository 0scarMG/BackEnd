import Category from '../models/Category.js';
import { v2 as cloudinary } from 'cloudinary';

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const createCategory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'La imagen es obligatoria.' });
    }
    const { name, description } = req.body;
    const imageUrl = req.file.filename; // Usamos filename, no path

    const category = await Category.create({ name, description, imageUrl });
    res.status(201).json(category);
  } catch (error) {
    console.error('FALLO AL CREAR CATEGORÍA:', error);
    res.status(500).json({ message: 'Error al crear la categoría.' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updateData = { name, description };

    if (req.file) {
      const oldCategory = await Category.findById(id);
      if (oldCategory?.imageUrl) {
        await cloudinary.uploader.destroy(oldCategory.imageUrl);
      }
      updateData.imageUrl = req.file.filename;
    }

    const category = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!category) return res.status(404).json({ message: 'Categoría no encontrada.' });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la categoría.' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada.' });
    }
    if (category.imageUrl) {
      await cloudinary.uploader.destroy(category.imageUrl);
    }
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Categoría eliminada.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la categoría.' });
  }
};

// Función para obtener una categoría por ID (necesaria para el formulario de edición)
export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Categoría no encontrada.' });
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};