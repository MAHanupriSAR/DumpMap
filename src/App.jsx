import { useAuth } from "react-oidc-context";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ReportWaste from "./pages/ReportWaste";
import MapView from "./pages/MapView";
import MyReports from "./pages/MyReports";
import ProfileView from "./pages/ProfileView";
import AdminDashboard from "./pages/AdminDashboard";
import Landing from "./pages/Landing";
import './App.css';

function App() {
  const auth = useAuth();
  const authPool = localStorage.getItem('auth_pool');
  const isStaff = authPool === 'worker' || localStorage.getItem('userRole') === 'staff';

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
          <button
            className="btn primary-btn mt-4"
            onClick={() => {
              localStorage.removeItem('auth_pool');
              localStorage.removeItem('userRole');
              window.location.href = '/';
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    // ── STAFF ROUTE (Authenticated via Worker Cognito User Pool) ────────────
    if (isStaff) {
      return (
        <BrowserRouter>
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </BrowserRouter>
      );
    }

    // ── CITIZEN ROUTES (Authenticated via Citizen Cognito User Pool) ─────────
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

  // Not authenticated → show Landing page (Citizen vs Staff selection)
  return <Landing />;
}

export default App;
