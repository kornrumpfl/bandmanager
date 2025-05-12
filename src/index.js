import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/themes/lara-dark-blue/theme.css";
import 'primeflex/primeflex.css';  
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <PrimeReactProvider>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>
);
