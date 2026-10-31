import mongoose from "mongoose";

const varianteProcesamientoSchema = new mongoose.Schema({
  sku: { type: string, required: true, unique: true },
  procesamiento: {
    type: String,
    enum: ["filetes_embandejado", "entera_embandejada", "granel_caja"],
  },
});

const ProductosSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  tipoBandejas: { type: String, required: true },
  variantes: [varianteProcesamientoSchema],
});

const Producto = momgoose.model("Producto", productoSchema);

export default Producto;
