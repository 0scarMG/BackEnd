import { Schema, model } from 'mongoose';

const artistSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Por favor agrega un nombre'],
    unique: true,
  },
  imageUrl: {
    type: String,
    required: [true, 'Por favor agrega una imagen'],
  },
}, {
  timestamps: true,
});

export default model('Artist', artistSchema);