import React from "react";
import { Outlet } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import { Header } from "./Header";
import { Navigate } from "react-router-dom";
export const PublicLayout = () => {
  const { auth } = useAuth();

  return (
    <>
      {/*LAYOUT */}
      <Header />

      {/*CONTENIDO PRINCIPAL */}
      <section className="layout_content">
        {!auth._id ? <Outlet /> : <Navigate to="/social" />}
      </section>
    </>
  );
};
