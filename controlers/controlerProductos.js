import Productos from "../models/productos.js";

// Muestra el formulario leyendo la BD con soporte .lean()
const mostrarFormularioProducto = async (req, res) => {
  try {
    const productosExistentes = await Productos.find()
      .sort({ nombre: 1 })
      .lean();
    res.render("producto", { productos: productosExistentes });
  } catch (error) {
    console.error("Error al cargar el maestro:", error);
    res.render("producto", { productos: [] });
  }
};

// Guarda el producto en Atlas procesando de forma segura la ramificación del pavo
const crearProductoMaestro = async (req, res) => {
  try {
    console.log("🚀 Datos recibidos del formulario:", req.body);
    const { nombre, variantes } = req.body;

    if (!nombre) {
      throw new Error(
        "El nombre del producto y tipo de bandeja son obligatorios.",
      );
    }
    const limpiarNumero = (valor) => {
      if (valor === undefined || valor === null || valor === "") return 0;
      return parseFloat(valor.toString().replace(",", ".")) || 0;
    };

    // Dentro de controllers/controlersProductos.js en la función crearProductoMaestro:

    // Dentro de controllers/controlersProductos.js en la función crearProductoMaestro:

    const variantesFormateadas = [];

    if (variantes) {
      const llavesVariantes = Object.keys(variantes);

      for (let i = 0; i < llavesVariantes.length; i++) {
        const v = variantes[llavesVariantes[i]];

        const subVariantesFormateadas = [];

        // 🚨 CONTROL HÍBRIDO SEGURO PARA SUBVARIANTES:
        if (v.subVariantes) {
          console.log(
            "🚀 Procesando subvariantes para la variante:",
            v.nombreVariante,
            v.subVariantes,
          );
          // Si Express nos entregó las subvariantes ya convertidas en un Array nativo de JS
          if (Array.isArray(v.subVariantes)) {
            v.subVariantes.forEach((sv) => {
              if (sv) {
                // Validamos que el elemento no sea null

                subVariantesFormateadas.push({
                  presentacion: (sv.presentacion || "").trim().toLowerCase(),
                  tipoBandeja: (sv.tipoBandeja || "").trim().toLowerCase(),
                  pesoEstandarBandeja: limpiarNumero(sv.pesoEstandarBandeja),
                  mermaCorteEstimada: limpiarNumero(sv.mermaCorteEstimada),
                });
              }
            });
          }
          // Si Express nos entregó las subvariantes en formato Objeto indexado por llaves
          else {
            const llavesSub = Object.keys(v.subVariantes);
            for (let j = 0; j < llavesSub.length; j++) {
              const sv = v.subVariantes[llavesSub[j]];
              if (sv) {
                subVariantesFormateadas.push({
                  presentacion: (sv.presentacion || "").trim().toLowerCase(),
                  tipoBandeja: (sv.tipoBandeja || "").trim().toLowerCase(),
                  pesoEstandarBandeja: limpiarNumero(sv.pesoEstandarBandeja),
                  mermaCorteEstimada: limpiarNumero(sv.mermaCorteEstimada),
                });
              }
            }
          }
        }

        // Determinamos si tiene subvariantes reales tras el formateo
        const tieneSub = subVariantesFormateadas.length > 0;

        variantesFormateadas.push({
          nombreVariante: v.nombreVariante.trim().toLowerCase(),
          tipoBandeja: v.tipoBandeja.trim().toLowerCase(),
          // Si tiene subvariantes, el peso principal queda en 0 (burlamos la validación)
          pesoEstandarBandeja: tieneSub
            ? 0
            : limpiarNumero(v.pesoEstandarBandeja),
          mermaCorteEstimada: tieneSub
            ? 0
            : limpiarNumero(v.mermaCorteEstimada),
          subVariantes: subVariantesFormateadas, // 🚨 Inyectamos las subvariantes procesadas
        });
      }
    }

    // Instanciamos el modelo con la estructura ya purificada de JavaScript
    const nuevoProducto = new Productos({
      nombre: nombre.trim(),

      variantes: variantesFormateadas,
    });

    // Guardado directo y síncrono en MongoDB Atlas
    await nuevoProducto.save();

    res.send(`
            <script>
                alert("✅ Producto maestro '${nombre}' guardado exitosamente.");
                window.location.href = "/nuevo/producto";
            </script>
        `);
  } catch (error) {
    console.error("🚨 Error de validación en MongoDB:", error);
    res.status(500).send(`
            <div style="font-family: sans-serif; padding: 2rem;">
                <h1 style="color: #ef4444;">Error de Guardado de Datos</h1>
                <p><strong>Causa del Schema:</strong> ${error.message}</p>
                <br>
                <a href="/nuevo/producto" style="color: #2563eb; font-weight: bold; text-decoration: none;">← Volver al Formulario</a>
            </div>
        `);
  }
};

const eliniarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    await Productos.findByIdAndDelete(id);
    res.send(`
      <script>
          alert("✅ Producto eliminado exitosamente.");
          window.location.href = "/nuevo/producto";
      </script>
    `);
  } catch (error) {
    console.error("🚨 Error al eliminar el producto:", error);
    res.status(500).send(`
      <div style="font-family: sans-serif; padding: 2rem;">
          <h1 style="color: #ef4444;">Error al Eliminar Producto</h1>
          <p><strong>Causa:</strong> ${error.message}</p>
          <br>
          <a href="/nuevo/producto" style="color: #2563eb; font-weight: bold; text-decoration: none;">← Volver al Formulario</a>
      </div>
    `);
  }
};
const editarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const productoExistente = await Productos.findById(id).lean();

    if (!productoExistente) {
      throw new Error("Producto no encontrado.");
    }
    res.render("editar-producto", { producto: productoExistente });
  } catch (error) {
    console.error("🚨 Error al editar el producto:", error);
    res.status(500).send(`
      <div style="font-family: sans-serif; padding: 2rem;">
          <h1 style="color: #ef4444;">Error al Editar Producto</h1>
          <p><strong>Causa:</strong> ${error.message}</p>
          <br>
          <a href="/nuevo/producto" style="color: #2563eb; font-weight: bold; text-decoration: none;">← Volver al Formulario</a>
      </div>
    `);
  }
};
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, variantes } = req.body;

    if (!nombre) {
      throw new Error(
        "El nombre del producto y tipo de bandeja son obligatorios.",
      );
    }

    const limpiarNumero = (valor) => {
      if (valor === undefined || valor === null || valor === "") return 0;
      return parseFloat(valor.toString().replace(",", ".")) || 0;
    };

    const variantesFormateadas = [];

    if (variantes) {
      const llavesVariantes = Object.keys(variantes);

      for (let i = 0; i < llavesVariantes.length; i++) {
        const v = variantes[llavesVariantes[i]];

        const subVariantesFormateadas = [];

        if (v.subVariantes) {
          if (Array.isArray(v.subVariantes)) {
            v.subVariantes.forEach((sv) => {
              if (sv) {
                subVariantesFormateadas.push({
                  presentacion: (sv.presentacion || "").trim().toLowerCase(),
                  tipoBandeja: (sv.tipoBandeja || "").trim().toLowerCase(),
                  pesoEstandarBandeja: limpiarNumero(sv.pesoEstandarBandeja),
                  mermaCorteEstimada: limpiarNumero(sv.mermaCorteEstimada),
                });
              }
            });
          } else {
            const llavesSub = Object.keys(v.subVariantes);
            for (let j = 0; j < llavesSub.length; j++) {
              const sv = v.subVariantes[llavesSub[j]];
              if (sv) {
                subVariantesFormateadas.push({
                  presentacion: (sv.presentacion || "").trim().toLowerCase(),
                  tipoBandeja: (sv.tipoBandeja || "").trim().toLowerCase(),
                  pesoEstandarBandeja: limpiarNumero(sv.pesoEstandarBandeja),
                  mermaCorteEstimada: limpiarNumero(sv.mermaCorteEstimada),
                });
              }
            }
          }
        }

        const tieneSub = subVariantesFormateadas.length > 0;

        variantesFormateadas.push({
          nombreVariante: v.nombreVariante.trim().toLowerCase(),
          tipoBandeja: (v.tipoBandeja || "").trim().toLowerCase(),
          pesoEstandarBandeja: tieneSub
            ? 0
            : limpiarNumero(v.pesoEstandarBandeja),
          mermaCorteEstimada: tieneSub
            ? 0
            : limpiarNumero(v.mermaCorteEstimada),
          subVariantes: subVariantesFormateadas,
        });
      }
    }

    await Productos.findByIdAndUpdate(id, {
      nombre: nombre.trim(),
      variantes: variantesFormateadas,
    });

    res.send(`
            <script>
                alert("✅ Producto maestro '${nombre}' actualizado exitosamente.");
                window.location.href = "/nuevo/producto";
            </script>
        `);
  } catch (error) {
    console.error("🚨 Error de validación en MongoDB:", error);
    res.status(500).send(`
            <div style="font-family: sans-serif; padding: 2rem;">
                <h1 style="color: #ef4444;">Error de Actualización de Datos</h1>
                <p><strong>Causa del Schema:</strong> ${error.message}</p>
                <br>
                <a href="/nuevo/producto" style="color: #2563eb; font-weight: bold; text-decoration: none;">← Volver al Formulario</a>
            </div>
        `);
  }
};

export {
  mostrarFormularioProducto,
  crearProductoMaestro,
  eliniarProducto,
  editarProducto,
  actualizarProducto,
};
