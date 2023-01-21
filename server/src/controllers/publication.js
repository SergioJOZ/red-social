//Modelos
const Publication = require("../models/publication");

//Modulos
const fs = require("fs");
const path = require("path");

//Servicios
const followService = require("../services/followService");

//Acciones de prueba
const pruebaPubli = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/publication.js",
  });
};

//Guardar publicaciones
const save = (req, res) => {
  //Recoger datos del body
  let params = req.body;

  //Si no me llegan, return negativo
  if (!params.text)
    return res.status(400).send({
      status: "error",
      message: "No hay contenido",
    });

  //Crear y rellenar el objeto del modelo
  let newPublication = new Publication(params);
  newPublication.user = req.user.id;

  //Guardar en bbdd
  newPublication.save((error, publicationStored) => {
    if (error || !publicationStored) {
      res.status(500).send({
        status: "error",
        message: "No se ha guardado la publicación",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Publicacion guardada",
      publicationStored,
    });
  });
};

//Sacar 1 publicacion
const detail = (req, res) => {
  //Sacar id de publicacion de la url
  let publicacionId = req.params.id;

  //Find con la condición del id
  Publication.findById(publicacionId, (error, publicationStored) => {
    if (error || !publicationStored) {
      return res.status(404).send({
        status: "success",
        message: "No encontrada",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Mostrar publicacion",
      publicationStored,
    });
  });
};

//Eliminar publicaciones
const remove = (req, res) => {
  //Sacar id de la publicacion a eliminar
  let publicationId = req.params.id;

  //Find and remove
  Publication.find({ user: req.user.id, _id: publicationId }).remove(
    (error) => {
      if (error) {
        return res.status(404).send({
          status: "success",
          message: "No encontrada",
        });
      }

      return res.status(200).send({
        status: "success",
        message: "Eliminar publicacion",
        publication: publicationId,
      });
    }
  );
};

//Listar publicaciones
const user = (req, res) => {
  //Sacar id usuario
  let id = req.params.id;
  if (!req.params.id) id = req.user.id;

  //Controlar la pagina
  let page = 1;

  if (req.params.page) page = req.params.page;

  const itemsPerPage = 5;
  //Find, populate, ordenar, paginar
  Publication.find({ user: id })
    .sort("-created_at")
    .populate("user", "-password -__v -role -email")
    .paginate(page, itemsPerPage, (error, publications, total) => {
      if (error || !publications || publications.length <= 0) {
        return res.status(404).send({
          status: "error",
          message: "Publicaciones no encontradas",
        });
      }

      return res.status(200).send({
        status: "success",
        message: "Listar publicaciones del perfil de un usuario",
        publications,
        page,
        pages: Math.ceil(total / itemsPerPage),
        total,
      });
    });
};

//Subir ficheros
const upload = (req, res) => {
  //Sacar id publicacion
  let publicationId = req.params.id;

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
  Publication.findOneAndUpdate(
    { user: req.user.id, _id: publicationId },
    { file: req.file.filename },
    { new: true },
    (error, publicationUpdated) => {
      if (error || !publicationUpdated) {
        return res.status(500).send({
          status: "error",
          message: "Error al actualizar usuario",
        });
      }

      //Devolver respuesta
      return res.status(200).send({
        status: "success",
        publication: publicationUpdated,
        file: req.file,
      });
    }
  );
};

//Devolver archivos multimedia
const media = (req, res) => {
  //Sacar parametro de la url
  const file = req.params.file;

  //Montar el path real de la imagen
  const filePath = "./src/uploads/publications/" + file;

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

//Listar FEED
const feed = async (req, res) => {
  //Sacar la pagina actual
  let page = 1;

  if (req.params.page) page = req.params.page;

  //Establecer numero de elementos por pagina
  let itemsPerPage = 5;

  //Ids limpios de usuarios que sigue el usuario identificado
  try {
    let myFollows = await followService.followUserIds(req.user.id);

    //Find de publicaciones in (de los usuarios que sigue el usuario identificado)
    const publications = Publication.find({
      user: myFollows.following,
    })
      .populate("user", "-password -role -__v -email")
      .sort("-created_at")
      .paginate(page, itemsPerPage, (error, publications, total) => {
        if (error || !publications || publications.length <= 1) {
          return res.status(500).send({
            status: "error",
            message: "No hay publicaciones para mostrar",
          });
        }

        return res.status(200).send({
          status: "success",
          message: "feed",
          following: myFollows.following,
          total,
          page,
          itemsPerPage,
          pages: Math.ceil(total / itemsPerPage),
          publications,
        });
      });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "no se han listado las publicaciones del feed",
    });
  }
};

//Exportar acciones
module.exports = {
  pruebaPubli,
  save,
  detail,
  remove,
  user,
  upload,
  media,
  feed,
};
