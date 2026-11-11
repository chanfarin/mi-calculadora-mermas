import express from "express";
const router = express.Router();
import {
  mostrarFormularioProducto,
  crearProductoMaestro,
  eliniarProducto,
  editarProducto,
  actualizarProducto,
} from "../controlers/controlerProductos.js";

// Ruta para ver el formulario (GET)
router.get("/nuevo/producto", mostrarFormularioProducto);

// Ruta para procesar el formulario (POST)
router.post("/nuevo/producto", crearProductoMaestro);

// Ruta para eliminar un producto (DELETE)
router.get("/producto/eliminar/:id", eliniarProducto);

// Ruta para editar un producto (PUT)
router.get("/producto/editar/:id", editarProducto);
// Ruta para actualizar un producto (POST)
router.post("/producto/actualizar/:id", actualizarProducto);

export default router;
