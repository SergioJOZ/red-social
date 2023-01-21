const mongoose = require("mongoose");
const connection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado con exito a la base de datos: mi_redsocial");
  } catch (err) {
    console.log(err);
    throw new Error("No se ha podido conectar a la base de datos");
  }
};
module.exports = connection;