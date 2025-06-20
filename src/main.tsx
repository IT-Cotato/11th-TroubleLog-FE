import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import LoginButton from "./components/Login/KakaoLogin.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <LoginButton />
  </StrictMode>
);
