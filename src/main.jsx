import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_igoGrvGIP",
  client_id: "55dht6jg5ta3c3heobhneh5na8",
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "email openid phone",
};

createRoot(document.getElementById('root')).render(
  <AuthProvider {...cognitoAuthConfig}>
    <App />
  </AuthProvider>
);
