import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./css/base.css";

// Büyük harf dönüşümleri Türkçe kurallara uysun (i → İ).
document.documentElement.lang = "tr";
// Kategoriler arası geçişte sayfa yeniden açılır; eski kaydırma konumu taşınmasın.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
