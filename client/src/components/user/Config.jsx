import React from "react";
import { useState } from "react";
import useAuth from "../../hooks/useAuth";
import { Global } from "../../helpers/Global";
import { SerializeForm } from "../../helpers/SerializeForm";
import avatar from "../../assets/img/user.png";
export const Config = () => {
  const { auth, setAuth } = useAuth();
  const [saved, setSaved] = useState("not_saved");

  const updateUser = async (e) => {
    e.preventDefault();

    //Token
    const token = localStorage.getItem("token");

    //Recoger datos del formulario
    const newDataUser = SerializeForm(e.target);

    //Borrar propiedad innecesaria
    delete newDataUser.file0;

    //Actualizar usuario en bbdd
    const request = await fetch(Global.url + "user/update", {
      method: "PUT",
      body: JSON.stringify(newDataUser),
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    const data = await request.json();

    if (data.status == "success" && data.user) {
      delete data.user.password;

      setAuth(data.user);
      setSaved("saved");
    } else {
      setSaved("error");
    }

    //Subida de imagenes
    const fileInput = document.querySelector("#file");

    if (data.status == "success" && fileInput.files[0]) {
      //Recoger fichero a subir
      const formData = new FormData();
      formData.append("file0", fileInput.files[0]);

      //Peticion para enviar el fichero
      const uploadRequest = await fetch(Global.url + "user/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: token,
        },
      });

      const uploadData = await uploadRequest.json();

      if (uploadData.status == "success" && uploadData.user) {
        delete uploadData.user.password;

        setAuth(uploadData.user);
        setSaved("saved");
      }
    } else {
      setSaved("error");
    }
  };

  return (
    <>
      <header className="content__header content__header--public">
        <h1 className="content__title">Ajustes</h1>
      </header>

      <div className="content__posts">
        {saved == "saved" ? (
          <strong className="alert alert-success">Usuario actualizado</strong>
        ) : (
          ""
        )}

        {saved == "error" ? (
          <strong className="alert alert-danger">
            No se ha podido actualizar
          </strong>
        ) : (
          ""
        )}

        <form className="config-form" onSubmit={updateUser}>
          <div className="form-group">
            <label htmlFor="name">Nombre</label>
            <input type="text" name="name" defaultValue={auth.name}></input>
          </div>

          <div className="form-group">
            <label htmlFor="surname">Apellidos</label>
            <input
              type="text"
              name="surname"
              defaultValue={auth.surname}
            ></input>
          </div>

          <div className="form-group">
            <label htmlFor="nick">Nick</label>
            <input type="text" name="nick" defaultValue={auth.nick}></input>
          </div>

          <div className="form-group">
            <label htmlFor="email">Biografía</label>
            <textarea className="bio" defaultValue={auth.bio} />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo</label>
            <input type="email" name="email" defaultValue={auth.email}></input>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input type="password" name="password"></input>
          </div>

          <div className="form-group">
            <label htmlFor="file0">Avatar</label>
            <div className="avatar">
              <div className="general-info__container-avatar">
                {auth.image != "default.png" && (
                  <img
                    src={Global.url + "user/avatar/" + auth.image}
                    className="container-avatar__img"
                    alt="Foto de perfil"
                  />
                )}
                {auth.image == "default.png" && (
                  <img
                    src={avatar}
                    className="container-avatar__img"
                    alt="Foto de perfil"
                  />
                )}
              </div>
            </div>
            <br />
            <input type="file" name="file0" id="file" />
          </div>
          <br />
          <input
            type="submit"
            value="Actualiza el usuario"
            className="btn btn-success"
          />
        </form>
        <br />
      </div>
    </>
  );
};
