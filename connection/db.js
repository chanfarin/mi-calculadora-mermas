import mongoose from "mongoose";
const MONGODB_URI =
  "mongodb+srv://franciscojavier:rhCSBlwHmtK1wacl@clusterecopaquetaxi.tkgbmzw.mongodb.net/mi-calculadora-mermas?retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conexión a MongoDB exitosa");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    process.exit(1); // Salir del proceso con un código de error
  }
};
export default connectDB;
