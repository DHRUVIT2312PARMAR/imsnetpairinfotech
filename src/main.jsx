import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../src/style.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeLanguageProvider } from "./context/ThemeLanguageContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* ① ThemeLanguage — OUTERMOST: theme + lang available everywhere */}
    <ThemeLanguageProvider>
      {/* ② Auth — next layer */}
      <AuthProvider>
        {/* ③ Router */}
        <BrowserRouter>
          <App />
          {/* Toast uses same dark/light via CSS variables set on <html> */}
          <ToastContainer
            position="top-right"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="colored"
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeLanguageProvider>
  </StrictMode>
);
