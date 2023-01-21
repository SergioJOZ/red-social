//Importar dependencias
const jwt = require("jwt-simple");
const moment = require("moment");

//Clave secreta
const secret = "CLAVE_SECRETA_del_curso_del_proyecto_de_la_RED_SOCIAL_150219";

//Crear una funcion para generar tokens
const createToken = user => {
  const payload = {
    id: user._id,
    name: user.name,
    surname: user.surname,
    nick: user.nick,
    email: user.email,
    role: user.role,
    image: user.image,
    iat: moment().unix(),
    exp: moment().add(30, "days").unix()
  };

  //Devolver token jwt codificado
  return jwt.encode(payload, secret);
};
module.exports = {
  secret,
  createToken
};