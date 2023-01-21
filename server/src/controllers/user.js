//Importar dependencias y modulos
const bcrypt = require("bcrypt");
const mongoosePagination = require("mongoose-pagination");
const fs = require("fs");
const path = require("path");

//Importar modelos
const User = require("../models/user");

//Importar servicios
const jwt = require("../services/jwt");
const followService = require("../services/followService");
const Follow = require("../models/follow");
const Publications = require("../models/publication");
const validate = require("../helpers/validate");

//Acciones de prueba
const pruebaUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/users.js",
    user: req.user,
  });
};

//Registro de usuarios
const register = (req, res) => {
  //Recoger datos de la peticion
  let params = req.body;

  //Comprobar que llegan bien (+ validacion)
  if (!params.name || !params.email || !params.password || !params.nick) {
    return res.status(400).json({
      status: "error",
      message: "Faltan datos por enviar",
    });
  }

  //Validacion avanzada
  try {
    validate(params);
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: "Validacion no superada",
    });
  }
  //Control de usuarios duplicados
  User.find({
    $or: [
      { email: params.email.toLowerCase() },
      { nick: params.nick.toLowerCase() },
    ],
  }).exec(async (err, users) => {
    if (err)
      return res.status(500).json({
        status: "error",
        message: "Error en la consulta",
      });

    if (users && users.length >= 1) {
      return res.status(200).send({
        status: "success",
        message: "Usuario ya existe",
      });
    }
    //Cifrar la contraseña
    let hashPwd = await bcrypt.hash(params.password, 10);
    params.password = hashPwd;

    //Crear objeto de usuario
    let userToSave = new User(params);

    //Guardar usuario en la base de datos
    userToSave.save((err, userSaved) => {
      if (err || !userSaved)
        return res.status(500).send({
          status: "error",
          message: "Error al guardar usuario",
        });

      //Devolver resultado
      return res.status(200).json({
        status: "success",
        message: "Usuario registrado",
        userSaved,
      });
    });
  });
};

const login = (req, res) => {
  //Recoger parametros del body
  let params = req.body;

  if (!params.email || !params.password) {
    return res.status(400).send({
      status: "error",
      message: "Faltan datos por enviar",
    });
  }
  //Buscar usuario en la base de datos
  User.findOne({ email: params.email })
    //.select({ password: false })
    .exec((error, user) => {
      if (error || !user) {
        return res.status(404).send({
          status: "error",
          message: "Usuario no encontrado",
        });
      }

      //Comprobar contraseña
      const pwd = bcrypt.compareSync(params.password, user.password);

      if (!pwd) {
        return res.status(400).send({
          status: "error",
          message: "Contraseña incorrecta",
        });
      }

      //Devolver Token
      const token = jwt.createToken(user);

      //Devolver datos del usuario
      return res.status(200).send({
        status: "success",
        user: {
          id: user._id,
          name: user.name,
          nick: user.nick,
        },
        token,
      });
    });
};

const profile = (req, res) => {
  //Recibir el parametro del id de usuario por la url
  const id = req.params.id;
  //Consulta para sacar los datos del usuario
  User.findById(id)
    .select({ password: 0, role: 0 })
    .exec(async (error, userProfile) => {
      if (error || !userProfile) {
        return res.status(404).send({
          status: "error",
          message: "Usuario no encontrado",
        });
      }

      //Info de seguimiento
      const followInfo = await followService.followThisUser(req.user.id, id);

      //Devolver resultado
      return res.status(200).send({
        status: "success",
        userProfile,
        following: followInfo.following,
        follower: followInfo.follower,
      });
    });
};

const list = (req, res) => {
  //Controlar en qué pagina estamos
  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }

  page = parseInt(page);

  //Consulta con mongoose paginate
  let itemsPerPage = 5;

  User.find()
    .select("-password -email -role -__v")
    .sort("_id")
    .paginate(page, itemsPerPage, async (error, users, total) => {
      if (error || !users) {
        return res.status(404).send({
          status: "error",
          message: "No hay usuarios disponibles",
          error,
        });
      }

      //Follow info
      let followUserIds = await followService.followUserIds(req.user.id);

      //Devolver resultado
      return res.status(200).send({
        status: "success",
        users,
        page,
        itemsPerPage,
        total,
        pages: Math.ceil(total / itemsPerPage),
        user_following: followUserIds.following,
        user_follow_me: followService.followers,
      });
    });
};

const update = (req, res) => {
  //Recoger info del usuario a actualizar
  let userToken = req.user;
  let userToUpdate = req.body;

  //Eliminar campos sobrantes
  delete userToUpdate.iat;
  delete userToUpdate.exp;
  delete userToUpdate.role;
  delete userToUpdate.image;

  //Comprobar si el usuario ya existe
  User.find({
    $or: [
      { email: userToUpdate.email.toLowerCase() },
      { nick: userToUpdate.nick.toLowerCase() },
    ],
  }).exec(async (err, users) => {
    if (err)
      return res.status(500).json({
        status: "error",
        message: "Error en la consulta",
      });

    let userIsSet = false;
    users.forEach((user) => {
      if (user && user._id != userToken.id) userIsSet = true;
    });

    if (userIsSet) {
      return res.status(200).send({
        status: "success",
        message: "Usuario ya existe",
      });
    }

    //Cifrar la contraseña si me llega
    if (userToUpdate.password) {
      let hashPwd = await bcrypt.hash(userToUpdate.password, 10);
      userToUpdate.password = hashPwd;
    } else {
      delete userToUpdate.password;
    }

    //Buscar y actualizar usuario con la nueva informacion
    User.findByIdAndUpdate(
      { _id: userToken.id },
      userToUpdate,
      { new: true },
      (error, userUpdated) => {
        if (error || !userUpdated) {
          return res.status(500).send({
            status: "error",
            message: "Error al actualizar usuario",
            error,
          });
        }

        return res.status(200).send({
          status: "success",
          message: "Metodo de actualizar usuario",
          user: userUpdated,
        });
      }
    );
  });
};

const upload = (req, res) => {
  //Recoger el fichero de imagen y comprobar que existe
  if (!req.file) {
    return res.status(404).send({
      status: "error",
      message: "No se ha encontrado el fichero",
    });
  }

  //Conseguir el nombre del archivo
  let image = req.file.originalname;

  //Sacar la extension del archivo
  const imageSplit = image.split(".");
  const extension = imageSplit[1];

  //Si no es correcta, borrar archivo
  if (
    extension != "png" &&
    extension != "jpg" &&
    extension != "jpeg" &&
    extension != "gif"
  ) {
    const filePath = req.file.path;
    const fileDeleted = fs.unlinkSync(filePath);

    //Devolver respuesta negativa
    return res.status(400).send({
      status: "error",
      message: "Extension incorrecta del archivo",
      fileDeleted,
    });
  }

  //Si es correcta, guardar en bbdd
  User.findOneAndUpdate(
    { _id: req.user.id },
    { image: req.file.filename },
    { new: true },
    (error, userUpdated) => {
      if (error || !userUpdated) {
        return res.status(500).send({
          status: "error",
          message: "Error al actualizar usuario",
        });
      }

      //Devolver respuesta
      return res.status(200).send({
        status: "success",
        user: userUpdated,
      });
    }
  );
};

const avatar = (req, res) => {
  //Sacar parametro de la url
  const file = req.params.file;

  //Montar el path real de la imagen
  const filePath = "./src/uploads/avatars/" + file;

  //Comprobar que existe
  fs.stat(filePath, (error, exists) => {
    if (!exists) {
      return res.status(404).send({
        status: "error",
        message: "No existe la imagen",
      });
    }

    //Devolver un file
    return res.sendFile(path.resolve(filePath));
  });
};

const counters = async (req, res) => {
  let userId = req.user.id;

  if (req.params.id) {
    userId = req.params.id;
  }

  try {
    const following = await Follow.count({ user: userId });

    const followed = await Follow.count({ followed: userId });

    const publications = await Publications.count({ user: userId });

    return res.status(200).send({
      userId,
      following: following,
      followed: followed,
      publications: publications,
    });
  } catch {
    return res.status(500).send({
      status: "error",
      message: "ha ocurrido un error con los contadores",
    });
  }
};

//Exportar acciones
module.exports = {
  pruebaUser,
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
  counters,
};
