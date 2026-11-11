import mongoose from "mongoose";

// 1. Esquema de las variantes con el ENUM que manejas
const VarianteSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: [true, "El SKU es obligatorio"],
    enum: {
      values: ["pechuga_fileteada", "pechuga_entera", "pechuga_granel"],
      message: "{VALUE} no es un SKU válido para este producto",
    },
  },
  pesoEstandarBandeja: {
    type: Number,
    required: [
      true,
      "Debes definir el peso neto por bandeja para este formato (kg)",
    ],
  },
  // Opcional: Puedes guardar aquí las mermas base estimadas de este corte
  mermaCorteEstimada: { type: Number, default: 0 },
});

// 2. Esquema principal del Producto
const ProductoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [
        true,
        "El nombre del producto es obligatorio (Ej. Pollo Amarillo)",
      ],
      trim: true,
    },
    tipoBandeja: {
      type: String,
      required: [
        true,
        "El tipo de bandeja es obligatorio (Ej. B1-Mesa, Gran Formato)",
      ],
      trim: true,
    },
    // Array que contendrá tus 3 tipos de variantes fijas
    variantes: [VarianteSchema],
  },
  {
    collection: "maestro_productos", // Nombre limpio para la colección en Atlas
  },
);

const Producto = mongoose.model("Producto", ProductoSchema);
export default Producto;
