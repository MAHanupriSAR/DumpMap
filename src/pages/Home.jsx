import { Bell, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { useAuth } from 'react-oidc-context';

const Home = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="home-brand">
          <img src="/logo.png" alt="DumpMap Logo" className="brand-logo" />
          <h1 className="logo-text">DumpMap</h1>
        </div>
        <div className="header-actions">
          <button className="icon-btn">
            <Bell size={22} />
          </button>
        </div>
      </header>

      {/* Greeting */}
      <section className="greeting-section">
        <h2 className="greeting-title">Help keep your neighborhood clean.</h2>
      </section>

      {/* Primary Action Button */}
      <section className="action-section">
        <button className="report-btn" onClick={() => navigate('/report')}>
          <div className="btn-content">
            <div className="btn-icon">
              <MapPin size={24} />
            </div>
            <div className="btn-text">
              <span className="btn-title">REPORT WASTE</span>
              <span className="btn-subtitle">Takes less than 30 sec</span>
            </div>
          </div>
        </button>
      </section>

      {/* Nearby Hotspot */}
      <section className="info-section">
        <h3 className="section-title">Nearby</h3>
        <div className="info-card hotspot-card">
          <div className="card-icon alert">
            <AlertCircle size={24} color="#EF4444" />
          </div>
          <div className="card-details">
            <h4 className="card-title">Waste hotspot</h4>
            <p className="card-subtitle">230m away • Reported repeatedly</p>
          </div>
        </div>
      </section>

      {/* Contribution Stats */}
      <section className="info-section">
        <h3 className="section-title">Your contribution</h3>
        <div className="info-card stats-card">
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-value">7</span>
              <span className="stat-label">Reports</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value-flex">
                <CheckCircle size={18} color="#5FBD5F" />
                <span className="stat-value">3</span>
              </div>
              <span className="stat-label">Resolved</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
