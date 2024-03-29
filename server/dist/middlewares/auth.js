//Importar modulos
const jwt = require("jwt-simple");
const moment = require("moment");

//Importar clave secreta
const libjwt = require("../services/jwt");
const secret = libjwt.secret;

//Middleware de auth
exports.auth = (req, res, next) => {
  //Comprobar si me llega la cabecera de auth

  if (!req.headers.authorization) {
    return res.status(403).send({
      status: "error",
      message: "La petición no tiene la cabecera de auth"
    });
  }

  //Limpiar token
  let token = req.headers.authorization.replace(/['"']+/g, "");

  //Decodificar el token
  try {
    let payload = jwt.decode(token, secret);

    //Comprobar expiracion del token
    if (payload.exp <= moment().unix()) {
      return res.status(401).send({
        status: "error",
        message: "Token expirado"
      });
    }

    //Agregar datos de usuario a request
    req.user = payload;
  } catch (err) {
    return res.status(404).send({
      status: "error",
      message: "Token invalido",
      err
    });
  }

  //Pasar a la siguiente acción
  next();
};