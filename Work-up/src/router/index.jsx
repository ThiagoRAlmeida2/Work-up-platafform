import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "../pages/App.jsx";
import Home from "../pages/Home.jsx";

import ProjetosList from "../pages/projeto.jsx"; 
import Eventos from "../pages/eventos.jsx";
import Evolucao from "../pages/evolucao.jsx";
import Perfil from "../pages/perfil.jsx";
import EmpresaDashboard from "../pages/deashboardEmpresa.jsx"; 


export default createBrowserRouter([
  {
    element: <App />, 
    children: [
      { index: true, element: <Home /> },                  // "/"
      { path: "projetos", element: <ProjetosList /> },      // "/projetos"
      { path: "eventos", element: <Eventos /> },           // "/eventos"
      { path: "evolucao", element: <Evolucao /> },        // "/evolucao"
      { path: "perfil", element: <Perfil /> },             // "/perfil"
      { path: "dashboard", element: <EmpresaDashboard /> }, // "/dashboard"
      { path: "*", element: <Home /> }                     // Fallback para home
    ],
  },
]);