import mongoose from "mongoose";

const PlanificacionSchema = new mongoose.Schema(
  {
    producto: { type: String, required: true, trim: true },
    bandejas: { type: Number, required: true },
    kgBandeja: { type: Number, required: true },
    pesoCaja: { type: Number, required: true },
    kgNetos: { type: Number, required: true },
    kgBrutos: { type: Number, required: true },
    cajasNecesarias: { type: Number, required: true },
    perdidaFileteo: { type: Number, required: true },
    perdidaEmbandejado: { type: Number, required: true },
    perdidaInvalidez: { type: Number, required: true },
    totalPerdido: { type: Number, required: true },
    rendimientoTotal: { type: Number, required: true },
    bandejasPorCaja: { type: Number, required: true },
    cajasProductoTerminado: { type: Number, required: true },
    fecha: { type: Date, default: Date.now },
  },
  {
    // 🚨 Aquí se abre la configuración de opciones
    collection: "productos",
  }, // 🚨 Aquí se cierra la configuración de opciones
); // 🚨 Aquí se cierra el constructor de mongoose.Schema

const Planificacion = mongoose.model("Planificacion", PlanificacionSchema);
export default Planificacion;
