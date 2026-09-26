import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./css/base.css";

// Büyük harf dönüşümleri Türkçe kurallara uysun (i → İ).
document.documentElement.lang = "tr";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
