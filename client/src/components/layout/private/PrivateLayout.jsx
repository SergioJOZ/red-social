import React from "react";
import { Sidebar } from "./Sidebar";
import { Outlet, Navigate } from "react-router-dom";
import { Header } from "./Header";
import useAuth from "../../../hooks/useAuth";

export const PrivateLayout = () => {
  const { auth, loading } = useAuth();

  if (loading) {
    return <h1>Cargando...</h1>;
  } else {
    return (
      <>
        {/*LAYOUT */}

        {/*Cabecera */}
        <Header />

        {/*CONTENIDO PRINCIPAL */}
        <section className="layout_content">
          {auth._id ? <Outlet /> : <Navigate to="/login" />}
        </section>

        {/*Barra lateral */}
        <Sidebar />
      </>
    );
  }
};
