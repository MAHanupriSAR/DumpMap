import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "react-oidc-context";
import { getActiveAuthConfig } from "./authConfig";

const activeConfig = {
  ...getActiveAuthConfig(),
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

createRoot(document.getElementById('root')).render(
  <AuthProvider {...activeConfig}>
    <App />
  </AuthProvider>
);
