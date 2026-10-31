import "../models/producto.js";

const monstrarFormularioNuevo = (req, res) => {
  res.render("producto");
};

const crearProducto = async (req, res) => {
  try {
    const nuevoProducto = new Producto(req.boy);
    await nuevoProducto.save();

    res.send("Producto y sus variantes de procesamiento guardados con exito");
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res
        .status(400)
        .send("Error: uno de los SKUS introducidos esta duplicado");
    }
    res.status(500);
  }
};

export { monstrarFormularioNuevo, crearProducto };
