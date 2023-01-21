//Importaciones
const Follow = require("../models/follow");
const User = require("../models/user");

//Servicios
const followService = require("../services/followService");

//dependecias
const mongoosePaginate = require("mongoose-pagination");

//Acciones de prueba
const pruebaFollow = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/follow.js",
  });
};

//Acción de guardar un follow(seguir)
const save = (req, res) => {
  //Datos del usuario por body
  const params = req.body;

  //Sacar id del usuario identificado
  const identity = req.user;

  //Crear objeto con modelo follow
  let userToFollow = new Follow({
    user: identity.id,
    followed: params.followed,
  });

  //Guardar objeto en bbdd
  userToFollow.save((error, followStored) => {
    if (error || !followStored) {
      return res.status(400).send({
        status: "error",
        message: "No se ha podido seguir al usuario",
      });
    }

    return res.status(200).send({
      status: "success",
      identity: req.user,
      follow: followStored,
    });
  });
};

//Borrar follow(dejar de seguir)
const unfollow = async (req, res) => {
  //Recoger id del usuario identificado
  const identity = req.user.id;

  //Recoger id del usuario del unfollow
  const followedId = req.params.id;

  //Find de las coincidencias y hacer remove
  const result = await Follow.deleteOne({
    user: identity,
    followed: followedId,
  });

  if (result.deletedCount == 1) {
    return res.status(200).send({
      status: "success",
    });
  } else {
    return res.status(500).send({
      status: "error",
      message: "No se ha podido dejar de seguir",
    });
  }
};

//Listado de followeds que cualquier usuario está siguiendo
const following = (req, res) => {
  //Sacar id del usuario identificado
  let userId = req.user.id;

  //Comprobar si me llega el id por parametro en la url
  if (req.params.id) userId = req.params.id;

  //Comprobar si me llega la pagina, sino es pagina 1
  let page = 1;
  if (req.params.page) page = req.params.page;

  //Usuarios que quiero mostrar por pargina
  let itemsPerPage = 5;

  //Find a follow, popular datos de los usuarios y paginar con mongoose
  Follow.find({
    user: userId,
  })
    .populate("user followed", "-password -role -__v -email")
    .paginate(page, itemsPerPage, async (error, follows, total) => {
      //Listado de gente que sigue el usuario, que me sigue a mí, o seguidos en común
      //Sacar un array de los ids que me siguen y los que sigo (como yo)
      let followUserIds = await followService.followUserIds(req.user.id);

      return res.status(200).send({
        status: "success",
        message: "Listado de usuarios que estoy siguiendo",
        follows,
        total,
        pages: Math.ceil(total / itemsPerPage),
        user_following: followUserIds.following,
        user_follow_me: followService.followers,
      });
    });
};

//Listado de followers que están siguiendo a cualquier usuario
const followers = (req, res) => {
  //Sacar id del usuario identificado
  let userId = req.user.id;

  //Comprobar si me llega el id por parametro en la url
  if (req.params.id) userId = req.params.id;

  //Comprobar si me llega la pagina, sino es pagina 1
  let page = 1;
  if (req.params.page) page = req.params.page;

  //Usuarios que quiero mostrar por pargina
  let itemsPerPage = 5;

  //Find a follow, popular datos de los usuarios y paginar con mongoose
  Follow.find({
    followed: userId,
  })
    .populate("user followed", "-password -role -__v -email")
    .paginate(page, itemsPerPage, async (error, follows, total) => {
      let followUserIds = await followService.followUserIds(req.user.id);

      return res.status(200).send({
        status: "success",
        message: "Listado de usuarios que me sogiem",
        follows,
        total,
        pages: Math.ceil(total / itemsPerPage),
        user_following: followUserIds.following,
        user_follow_me: followService.followers,
      });
    });
};

//Exportar acciones
module.exports = { pruebaFollow, save, unfollow, following, followers };
