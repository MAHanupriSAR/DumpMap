import { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';
import { User, Mail, MapPin, Compass, ShieldCheck, ArrowLeft, LogOut, CheckCircle2, Hash } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { signOutCognito } from '../authConfig';
import { fetchWorkerProfile } from '../services/workerProfile';
import './ProfileView.css';
import './CrewProfileView.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const crewMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const CrewProfileView = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const user = auth.user?.profile;
  const workerEmail = user?.email || localStorage.getItem('workerEmail') || 'worker1@dumpmap.gov';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const data = await fetchWorkerProfile(workerEmail);
        if (isMounted) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to load crew profile:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, [workerEmail]);

  const handleSignOut = () => {
    signOutCognito(auth);
  };

  const name = profile?.name || user?.name || workerEmail.split('@')[0];
  const email = profile?.email || workerEmail;
  const address = profile?.address || 'Sector 14, Rohini, North Delhi, Delhi 110085';
  const latitude = profile?.latitude ?? 28.7041;
  const longitude = profile?.longitude ?? 77.1025;
  const zone = profile?.zone || 'North Delhi';
  const workerId = profile?.workerId || 'STAFF-001';

  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="crew-profile-page">
      <div className="crew-profile-container">
        {/* NAV BACK HEADER */}
        <header className="crew-profile-header">
          <button className="back-to-dash-btn" onClick={() => navigate('/admin')}>
            <ArrowLeft size={18} />
            <span>Dashboard</span>
          </button>
          <div className="crew-gov-badge">
            <ShieldCheck size={14} color="#10B981" />
            <span>Delhi Municipal Staff</span>
          </div>
        </header>

        <div className="crew-profile-content">
          {/* USER INFO CARD */}
          <div className="crew-card-primary">
            <div className="avatar-large-crew">{initials}</div>
            <div className="crew-info-main">
              <div className="crew-name-badge-line">
                <h2>{name}</h2>
                <span className="verified-pill">
                  <CheckCircle2 size={13} /> Active Duty
                </span>
              </div>
              <p className="crew-email-line">
                <Mail size={15} />
                <span>{email}</span>
              </p>
              <div className="crew-meta-pills">
                <span className="meta-pill id-pill">
                  <Hash size={13} /> {workerId}
                </span>
                <span className="meta-pill zone-pill">
                  <MapPin size={13} /> {zone}
                </span>
              </div>
            </div>
          </div>

          {/* ADDRESS & JURISDICTION CARD (FRONTEND IN WORDS) */}
          <div className="crew-section-card">
            <div className="card-section-header">
              <div className="icon-badge green-badge">
                <MapPin size={18} color="#059669" />
              </div>
              <div>
                <h3>Assigned Address (Words)</h3>
                <span className="sub-tag">Delhi NCT Territorial Jurisdiction</span>
              </div>
            </div>
            <div className="address-display-box">
              <p className="primary-address-text">{address}</p>
              <span className="region-indicator">Delhi Region Only</span>
            </div>
          </div>

          {/* BACKEND COORDINATES CARD (LATITUDE & LONGITUDE) */}
          <div className="crew-section-card">
            <div className="card-section-header">
              <div className="icon-badge blue-badge">
                <Compass size={18} color="#2563EB" />
              </div>
              <div>
                <h3>Backend Location Coordinates</h3>
                <span className="sub-tag">Stored in DynamoDB (Lat/Long)</span>
              </div>
            </div>
            <div className="coords-display-grid">
              <div className="coord-box">
                <span className="coord-label">Latitude</span>
                <span className="coord-number">{Number(latitude).toFixed(4)}° N</span>
              </div>
              <div className="coord-box">
                <span className="coord-label">Longitude</span>
                <span className="coord-number">{Number(longitude).toFixed(4)}° E</span>
              </div>
            </div>
            <p className="coords-explanation">
              Backend persists exact latitude and longitude; frontend resolves human-readable Delhi street addresses.
            </p>
          </div>

          {/* DELHI MAP CARD */}
          <div className="crew-section-card map-card-section">
            <div className="map-card-head">
              <span>Jurisdiction Map</span>
              <span className="map-coords-pill">
                {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}
              </span>
            </div>
            <div className="map-container-box">
              <MapContainer
                center={[latitude, longitude]}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '220px', width: '100%', borderRadius: '0 0 12px 12px' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[latitude, longitude]} icon={crewMarkerIcon}>
                  <Popup>
                    <strong>{name}</strong><br />
                    {address}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* SIGN OUT */}
          <div className="crew-actions-row">
            <button className="crew-signout-btn" onClick={handleSignOut}>
              <LogOut size={18} />
              <span>Sign Out from Staff Portal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrewProfileView;
