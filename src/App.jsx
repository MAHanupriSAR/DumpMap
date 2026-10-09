import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ReportWaste from "./pages/ReportWaste";
import MapView from "./pages/MapView";
import MyReports from "./pages/MyReports";
import ProfileView from "./pages/ProfileView";
import './App.css';

function App() {
  const auth = useAuth();

  useEffect(() => {
    // Automatically redirect to Cognito if not authenticated, not loading, and no error
    if (!auth.isAuthenticated && !auth.isLoading && !auth.error && !auth.activeNavigator) {
      auth.signinRedirect();
    }
  }, [auth]);

  if (auth.activeNavigator === "signinRedirect") {
    return null;
  }

  if (auth.isLoading) {
    return null;
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
            <Route path="map" element={<MapView />} />
            <Route path="reports" element={<MyReports />} />
            <Route path="profile" element={<ProfileView />} />
          </Route>
          <Route path="/report" element={<ReportWaste />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return null;
}

export default App;
