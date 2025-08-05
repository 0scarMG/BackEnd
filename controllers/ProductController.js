import Product from '../models/Products.js';
import Category from '../models/Category.js';
import Artist from '../models/Artist.js';
import { v2 as cloudinary } from 'cloudinary';


export const getProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const { category, artist, price, search } = req.query;

    const filterQuery = {};

    if (category && category !== 'all') {
      const categoryDoc = await Category.findOne({ name: category });
      if (categoryDoc) {
        filterQuery.category = categoryDoc._id;
      }
    }

    if (artist && artist !== 'all') {
      const artistDoc = await Artist.findOne({ name: artist });
      if (artistDoc) {
        filterQuery.artist = artistDoc._id;
      }
    }

    if (price && price !== 'all') {
      if (price === '500') filterQuery.price = { $lte: 500 };
      if (price === '1000') filterQuery.price = { $gt: 500, $lte: 1000 };
      if (price === 'more') filterQuery.price = { $gt: 1000 };
    }

    if (search) {
      filterQuery.name = { $regex: search, $options: 'i' };
    }

    const totalProducts = await Product.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(filterQuery)
      .populate('category')
      .populate('artist')
      .limit(limit)
      .skip((page - 1) * limit);

    res.status(200).json({ products, currentPage: page, totalPages, totalProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    // 1. Verificar si Multer procesó un archivo.
    // Si no hay archivo, multer-storage-cloudinary no lo subirá y req.file no existirá.
    if (!req.file) {
      return res.status(400).json({ message: 'La imagen es un campo obligatorio.' });
    }

    // 2. La URL pública de la imagen ya está disponible aquí gracias a Cloudinary.
     const imageUrl = req.file.filename;

    // 3. Obtener el resto de los datos del cuerpo de la petición.
    const {
      name,
      originalPrice,
      description,
      stock,
      sku,
      artist,
      category,
      discountPercentage,
      price,
      prevent,
      active
    } = req.body;

    // 4. Validar que los campos de texto obligatorios no estén vacíos.
    if (!name || !price || !description || !category) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios: nombre, precio, descripción y categoría.',
      });
    }

    // 5. (Opcional pero recomendado) Verificar si el producto ya existe.
    const productExists = await Product.findOne({ name });
    if (productExists) {
      return res.status(400).json({ message: 'Un producto con este nombre ya existe.' });
    }

    // 6. Crear el producto en la base de datos con todos los datos.
    const product = await Product.create({
      name,
      originalPrice,
      description,
      stock: stock ? parseInt(stock) : 0, 
      sku,
      artist,
      category,
      price,
      discountPercentage,
      prevent,
      imageUrl: imageUrl, 
      active
    });

    res.status(201).json(product);
    
  } catch (error) {
    console.log('Error al crear el producto:', error);
    console.error('FALLO AL CREAR PRODUCTO:', error);
    res.status(500).json({ message: 'Error interno del servidor al crear el producto.' });
  }
};

// --- OBTENER UN PRODUCTO POR ID (READ) ---
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category').populate('artist');
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('FALLO AL OBTENER PRODUCTO:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// --- ACTUALIZAR UN PRODUCTO (UPDATE) ---
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Si se sube una nueva imagen...
    if (req.file) {
      // 1. Busca el producto antiguo para obtener el ID de la imagen vieja.
      const oldProduct = await Product.findById(id);
      if (oldProduct && oldProduct.imageUrl) {
        // 2. Elimina la imagen antigua de Cloudinary.
        // La imageUrl guardada es el public_id (ej: KStore-Products/id_aleatorio).
        await cloudinary.uploader.destroy(oldProduct.imageUrl);
      }
      // 3. Asigna la nueva URL/ID de la imagen.
      updateData.imageUrl = req.file.filename;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('FALLO AL ACTUALIZAR PRODUCTO:', error);
    res.status(400).json({ message: 'Error al actualizar el producto.' });
  }
};

// --- ELIMINAR UN PRODUCTO (DELETE) ---
export const deleteProduct = async (req, res) => {
  try {
    // 1. Busca el producto que se va a eliminar.
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    // 2. Si tiene una imagen, elimínala de Cloudinary.
    if (product.imageUrl) {
      await cloudinary.uploader.destroy(product.imageUrl);
    }

    // 3. Elimina el producto de la base de datos.
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Producto eliminado exitosamente.' });
  } catch (error) {
    console.error('FALLO AL ELIMINAR PRODUCTO:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};