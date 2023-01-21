//Importar dependencias
const connection = require("./database/connection");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
//Mensaje bienvenida
console.log("API NODE para RED SOCIAL arrancada");

//Conexion a bbdd
connection();

//Crear servidor node
const app = express();
const puerto = process.env.PORT || 8000;

//Configurar cors
app.use(cors());

//Convertir los datos del body a objetos js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Cargar las rutas
const userRoutes = require("./routes/user");
const publicationRoutes = require("./routes/publication");
const followRoutes = require("./routes/follow");

app.use("/api/user", userRoutes);
app.use("/api/publication", publicationRoutes);
app.use("/api/follow", followRoutes);

//ruta de prueba
app.get("/ruta-prueba", (req, res) => {
  return res.status(200).json({
    id: 1,
    nombre: "sergio",
  });
});

//Poner servidor a escuchar peticiones http
app.listen(puerto, () => {
  console.log("El servidor está escuchando ");
});
