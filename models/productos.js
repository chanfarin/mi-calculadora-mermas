import mongoose from "mongoose";

// Esquema para el nivel más bajo(subvariantes)

const SubVarianteSchema = new mongoose.Schema({
  presentacion: { type: String, required: true },
  tipoBandeja: { type: String, required: true },
  pesoEstandarBandeja: { type: Number, required: true },
  mermaCorteEstimada: { type: Number, default: 0 },
});

//Esquema para las variantes principales
const VarianteSchema = new mongoose.Schema({
  nombreVariante: { type: String, required: true },
  tipoBandeja: {
    type: String,
    required: function () {
      return !this.subvariantes || this.subvariantes.length === 0;
    },
  },
  // Si la varante es simple
  pesoEstandarBandeja: {
    type: Number,
    required: function () {
      return !this.subvariantes || this.subvariantes.length === 0;
    },
  },
  mermaCorteEstimada: { type: Number, default: 0 },
  // Si la variante tiene subvariantes
  subVariantes: [SubVarianteSchema],
});

//Esquema principal del producto
const ProductoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },

    variantes: [VarianteSchema],
  },
  { collection: "maestro_universal" }, // Nombre limpio para la colección en Atlas
);

const Productos = mongoose.model("Producto", ProductoSchema);
export default Productos;
