import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
export const Logout = () => {
  const { setAuth, setCounters } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    //Vaciar localstorage
    localStorage.clear();
    //Settear estados globales a vacio
    setAuth({});
    setCounters({});
    //Redirección al login
    navigate("/login");
  }, []);

  return <h1>Cerrando sesion...</h1>;
};
