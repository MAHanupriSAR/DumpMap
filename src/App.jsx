import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Placeholder from "./pages/Placeholder";
import './App.css';

function App() {
  const auth = useAuth();

  useEffect(() => {
    // Automatically redirect to Cognito if not authenticated, not loading, and no error
    if (!auth.isAuthenticated && !auth.isLoading && !auth.error && !auth.activeNavigator) {
      auth.signinRedirect();
    }
  }, [auth]);

  if (auth.isLoading || auth.activeNavigator) {
    return (
      <div className="app-container">
        <div className="glass-card loading-card">
          <div className="spinner"></div>
          <h2>Redirecting to Login...</h2>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="app-container">
        <div className="glass-card error-card">
          <h2>Authentication Error</h2>
          <p>{auth.error.message}</p>
          <button className="btn primary-btn mt-4" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="map" element={<Placeholder title="Map" />} />
            <Route path="reports" element={<Placeholder title="My Reports" />} />
            <Route path="profile" element={<Placeholder title="Profile" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <div className="app-container">
      <div className="glass-card loading-card">
        <div className="spinner"></div>
        <h2>Redirecting to Login...</h2>
      </div>
    </div>
  );
}

export default App;
