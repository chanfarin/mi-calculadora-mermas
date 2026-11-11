import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./connection/db.js";
import Planificacion from "./models/producto.js";
import rutasProducto from "./routes/rutasProducto.js";
import Productos from "./models/productos.js";

// Conectar a la base de datos MongoDB
connectDB();

const app = express();
const PORT = 3000;

// Configurar __dirname correctamente en entornos ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Historial temporal en memoria (Array global)
const historial = [];

//Configurar motor de plantillas EJS y su directorio de vistas

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Middleware para procesar datos de formularios (POST)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

//Ruta principla formulario
app.use(rutasProducto);

app.get("/", async (req, res) => {
  try {
    const productosMaestro = await Productos.find().sort({ nombre: 1 });
    res.render("index", { productosCatalogo: productosMaestro });
  } catch (error) {
    console.error("Error al cargar el maestro:", error);
    res.render("index", { productosCatalogo: [] });
  }
});

app.get("/historial", async (req, res) => {
  try {
    //Buscamos los registros en mongoDB y los ordenamos por fecha descendente
    const registrosDB = await Planificacion.find()
      .sort({ fecha: -1 })
      .limit(10);
    //Mapeamos la fecha de Mongo al formato de hora legible que usabamos antes
    const historialFormateado = registrosDB.map((item) => ({
      ...item._doc,
      fechaFormateada: new Date(item.fecha).toLocaleDateString("es-ES"),
      horaFormateada: new Date(item.fecha).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
    res.render("historial", { historial: historialFormateado });
  } catch (error) {
    console.error("Error al obtener el historial:", error);
    res.status(500).send("Error interno del servidor");
  }
});

//Ruta POST para guardar  de forma permanente en Atlas MongoDB
app.post("/calcular", async (req, res) => {
  try {
    const {
      productoId,
      formatoSeleccionado,
      numBandejasPedidas,
      bandejasPorCaja,
      pesoCajaStandard,
    } = req.body;
    console.log("🚀 Datos recibidos del formulario:", req.body);

    // 1. Buscar el producto maestro en Atlas
    const productoMaestro = await Productos.findById(productoId);
    if (!productoMaestro) {
      throw new Error(
        "El producto seleccionado no existe en el catálogo maestro.",
      );
    }

    // 2. Extraer peso y merma según el formato elegido en el desplegable
    const [tipoFormato, vIdx, svIdx] = formatoSeleccionado.split("|");
    let pesoEstandarBandeja = 0;
    let mermaCorteEstimada = 0;
    let etiquetaFormato = "";
    let bandejaUsada = "";

    if (tipoFormato === "variante_simple") {
      const varSeleccionada = productoMaestro.variantes[parseInt(vIdx, 10)];
      pesoEstandarBandeja = varSeleccionada.pesoEstandarBandeja;
      mermaCorteEstimada = varSeleccionada.mermaCorteEstimada;
      etiquetaFormato = varSeleccionada.nombreVariante;
      bandejaUsada = varSeleccionada.tipoBandeja;
    } else if (tipoFormato === "sub_variante") {
      const varPrincipal = productoMaestro.variantes[parseInt(vIdx, 10)];
      const subVarSeleccionada = varPrincipal.subVariantes[parseInt(svIdx, 10)];
      pesoEstandarBandeja = subVarSeleccionada.pesoEstandarBandeja;
      mermaCorteEstimada = subVarSeleccionada.mermaCorteEstimada;
      etiquetaFormato = `${varPrincipal.nombreVariante} (${subVarSeleccionada.presentacion})`;
      bandejaUsada = subVarSeleccionada.tipoBandeja;
    }

    // 3. Variables numéricas de entrada
    const bandejas = parseInt(numBandejasPedidas, 10) || 0;
    const capCajaTerminada = parseInt(bandejasPorCaja, 10) || 1;
    const kgBandeja = Number(pesoEstandarBandeja) || 0;
    const pesoCaja =
      parseFloat(pesoCajaStandard.toString().replace(",", ".")) || 10;

    // 4. Cálculo de cajas de producto terminado
    const cajasProductoTerminado = Math.ceil(bandejas / capCajaTerminada);

    // 5. Fórmulas en cascada para materia prima
    const mFileteo = (Number(mermaCorteEstimada) || 0) / 100;
    const mEmbandejado = 0.03; // 3% fijo
    const mInvalidez = 0.02; // 2% fijo

    const kgNetos = bandejas * kgBandeja;
    const kgPostEmbandejado = kgNetos / (1 - mInvalidez);
    const kgPostFileteo = kgPostEmbandejado / (1 - mEmbandejado);
    const kgBrutosNecesarios = kgPostFileteo / (1 - mFileteo);
    const cajasNecesarias = Math.ceil(kgBrutosNecesarios / pesoCaja);

    const perdidaInvalidez = kgPostEmbandejado - kgNetos;
    const perdidoEmbandejado = kgPostFileteo - kgPostEmbandejado;
    const perdidoFileteo = kgBrutosNecesarios - kgPostFileteo;
    const totalMateriaPerdida = kgBrutosNecesarios - kgNetos;
    const rendimientoTotal =
      kgBrutosNecesarios > 0
        ? ((kgNetos / kgBrutosNecesarios) * 100).toFixed(1)
        : 0;

    const nombreCompletoProducto = `${productoMaestro.nombre} [${etiquetaFormato.toUpperCase()} - ${bandejaUsada}]`;

    // 6. Guardar en MongoDB Atlas
    const nuevaPlanificacion = new Planificacion({
      producto: nombreCompletoProducto,
      bandejas: bandejas,
      bandejasPorCaja: capCajaTerminada,
      cajasProductoTerminado: cajasProductoTerminado,
      kgBandeja: kgBandeja,
      pesoCaja: pesoCaja,
      kgNetos: Number(kgNetos.toFixed(2)),
      kgBrutos: Number(kgBrutosNecesarios.toFixed(2)),
      cajasNecesarias: cajasNecesarias,
      perdidaFileteo: Number(perdidoFileteo.toFixed(2)),
      perdidaEmbandejado: Number(perdidoEmbandejado.toFixed(2)),
      perdidaInvalidez: Number(perdidaInvalidez.toFixed(2)),
      totalPerdido: Number(totalMateriaPerdida.toFixed(2)),
      rendimientoTotal: Number(rendimientoTotal),
    });

    const docGuardado = await nuevaPlanificacion.save();
    console.log("🚀 Registro guardado en MongoDB Atlas:", docGuardado);

    // 7. Renderizar la vista de resultados
    res.render("resultado", {
      ...docGuardado._doc,
      fecha: docGuardado.fecha.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  } catch (error) {
    console.error("Error al procesar el cálculo:", error);
    res
      .status(500)
      .send(
        `<h1>Error al calcular</h1><p>${error.message}</p><a href="/">Volver</a>`,
      );
  }
});

app.listen(PORT, () =>
  console.log(`Servidor corriendo en: http://localhost:${PORT}`),
);
