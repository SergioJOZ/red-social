import React from "react";
import { useState } from "react";
import { Global } from "../../helpers/global";
import useAuth from "../../hooks/useAuth";
import { useForm } from "../../hooks/useForm";

export const Login = () => {
  const { form, changed } = useForm({});
  const [saved, setSaved] = useState("not_sended");
  const { auth, setAuth } = useAuth();
  const logUser = async (e) => {
    e.preventDefault();

    //Datos del formulario
    let userToLogin = form;

    //Peticion al backend
    const request = await fetch(Global.url + "user/login", {
      method: "POST",
      body: JSON.stringify(userToLogin),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await request.json();

    if (data.status == "success") {
      //Persistir los datos en el navegador
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSaved("login");

      //Set datos en el auth
      setAuth(data.user);

      //Redireccion
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setSaved("error");
    }
  };

  return (
    <>
      <header className="content__header content__header--public">
        <h1 className="content__title">Login</h1>
      </header>

      <div className="content__posts">
        {saved == "login" ? (
          <strong className="alert alert-success">Usuario correcto</strong>
        ) : (
          ""
        )}

        {saved == "error" ? (
          <strong className="alert alert-danger">Error en los datos</strong>
        ) : (
          ""
        )}

        <form className="form-login" onSubmit={logUser}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" name="email" onChange={changed} />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input type="password" name="password" onChange={changed} />
          </div>

          <input
            type="submit"
            value="Identificate"
            className="btn btn-success"
          />
        </form>
      </div>
    </>
  );
};
