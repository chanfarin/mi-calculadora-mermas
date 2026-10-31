import express from "express";
const router = express.Router();
import {
  monstrarFormularioNuevo,
  crearProducto,
} from "../controlers/controlerProductos.js";

// Ruta para ver el formulario (GET)
router.get("/nuevo", monstrarFormularioNuevo);

// Ruta para procesar el formulario (POST)
router.post("/", crearProducto);

export default router;
