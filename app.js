import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./connection/db.js";
import Planificacion from "./models/producto.js";
import rutasProducto from "./routes/rutasProducto.js";

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
app.use("/producto", rutasProducto);

app.get("/", async (req, res) => {
  res.render("index");
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
      producto,
      numeroBandejas,
      kilosPorBandeja,
      pesoCajaStandard,
      mermaEmbandejado,
      mermaInvalidez,
      mermaFileteo,
    } = req.body;
    const limpiarNumero = (valor) => {
      if (!valor) return 0;
      return parseFloat(valor.toString().replace(",", ".")) || 0;
    };

    const bandejas = parseInt(numeroBandejas) || 0;
    const kgBandeja = limpiarNumero(kilosPorBandeja);
    const pesoCaja = limpiarNumero(pesoCajaStandard);
    const mFileteo = limpiarNumero(mermaFileteo) / 100;
    const mEmbandejado = limpiarNumero(mermaEmbandejado) / 100;
    const mInvalidez = limpiarNumero(mermaInvalidez) / 100;

    // Cálculos matemáticos en cascada
    const kgNetos = bandejas * kgBandeja;
    const kgPostEmbandejado = kgNetos / (1 - mInvalidez || 1);
    const kgPostFileteo = kgPostEmbandejado / (1 - mEmbandejado || 1);
    const kgBrutosNecesarios = kgPostFileteo / (1 - mFileteo || 1);
    const cajasNecesarias = Math.ceil(kgBrutosNecesarios / pesoCaja);

    //Desglose de mermas
    const perdidoInvalidez = kgPostEmbandejado - kgNetos;
    const perdidoEmbandejado = kgPostFileteo - kgPostEmbandejado;
    const perdidoFileteo = kgBrutosNecesarios - kgPostFileteo;
    const totalMateriaPerdida = kgBrutosNecesarios - kgNetos;
    const rendimientoTotal =
      kgBrutosNecesarios > 0
        ? ((kgNetos / kgBrutosNecesarios) * 100).toFixed(2)
        : 0;

    // CREAR el documento coincidiendo exactamente con el modelo de mongodb
    const nuevaPlanificacion = new Planificacion({
      producto,
      bandejas,
      kgBandeja,
      pesoCaja,
      kgNetos: kgNetos.toFixed(2),
      kgBrutos: kgBrutosNecesarios.toFixed(2),
      cajasNecesarias,
      perdidaFileteo: perdidoFileteo.toFixed(2),
      perdidaEmbandejado: perdidoEmbandejado.toFixed(2),
      perdidaInvalidez: perdidoInvalidez.toFixed(2),
      totalPerdido: totalMateriaPerdida.toFixed(2),
      rendimientoTotal,
    });

    // GUARDAR permanentemente  en mongoDB Atlas
    await nuevaPlanificacion.save();

    // Mandamos a la pantalla de resultados la info recién guardada
    res.render("resultado", {
      ...nuevaPlanificacion._doc,
      fecha: nuevaPlanificacion.fecha.toLocaleTimeString("es-Es", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  } catch (error) {
    console.error("Error al guardar la planificación:", error);
    res.status(500).send("Error al procesar y almacenar el cálculo.");
  }
});

app.listen(PORT, () =>
  console.log(`Servidor corriendo en: http://localhost:${PORT}`),
);
