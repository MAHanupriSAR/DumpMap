import { useState } from 'react';
import { MapPin, Mail, User, ShieldCheck, Hash, X, LogOut, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './CrewProfileModal.css';

// Fix Leaflet default icon path
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

const CrewProfileModal = ({ profile, onClose, onSignOut }) => {
  if (!profile) return null;

  const {
    name = 'Municipal Worker',
    email = 'worker@dumpmap.gov',
    address = 'Sector 14, Rohini, North Delhi, Delhi 110085',
    latitude = 28.7041,
    longitude = 77.1025,
    zone = 'North Delhi',
    workerId = 'STAFF-001',
  } = profile;

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="crew-modal-overlay" onClick={onClose}>
      <div className="crew-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="crew-modal-header">
          <div className="crew-header-title">
            <span className="crew-gov-pill">
              <ShieldCheck size={14} color="#10B981" />
              Municipality · Sanitation Corps
            </span>
            <h2>Crew Profile</h2>
          </div>
          <button className="crew-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="crew-modal-body">
          {/* PROFILE HERO CARD */}
          <div className="crew-hero-card">
            <div className="crew-avatar-large">
              <span>{initials}</span>
              <div className="crew-status-dot" title="Active on Duty"></div>
            </div>
            <div className="crew-hero-info">
              <div className="crew-name-row">
                <h3 className="crew-name">{name}</h3>
                <span className="crew-verified-tag">
                  <CheckCircle2 size={13} /> Verified Staff
                </span>
              </div>
              <div className="crew-email-row">
                <Mail size={14} color="#64748B" />
                <span className="crew-email">{email}</span>
              </div>
              <div className="crew-badges-row">
                <span className="crew-badge id-badge">
                  <Hash size={12} /> {workerId}
                </span>
                <span className="crew-badge zone-badge">
                  <MapPin size={12} /> {zone}
                </span>
              </div>
            </div>
          </div>

          {/* DETAILS LIST */}
          <div className="crew-details-section">
            <h4 className="crew-section-heading">Assigned Municipal Station & Address</h4>

            {/* ADDRESS IN WORDS (FRONTEND DISPLAY) */}
            <div className="crew-detail-card address-card">
              <div className="crew-detail-icon-wrap address-icon-bg">
                <MapPin size={20} color="#059669" />
              </div>
              <div className="crew-detail-content">
                <span className="crew-detail-label">Address</span>
                <p className="crew-address-text">{address}</p>
                <span className="crew-delhi-tag">Delhi NCT Region Only</span>
              </div>
            </div>

            {/* MINI DELHI LEAFLET MAP PREVIEW */}
            <div className="crew-map-container">
              <div className="crew-map-header">
                <span>Station Map Verification</span>
                <span className="crew-map-coords">
                  {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}
                </span>
              </div>
              <div className="crew-mini-map-wrap">
                <MapContainer
                  center={[latitude, longitude]}
                  zoom={14}
                  scrollWheelZoom={false}
                  attributionControl={false}
                  style={{ height: '180px', width: '100%', borderRadius: '0 0 12px 12px' }}
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
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="crew-modal-footer">
          <button className="crew-btn-secondary" onClick={onClose}>
            Close
          </button>
          {onSignOut && (
            <button className="crew-btn-danger" onClick={onSignOut}>
              <LogOut size={16} /> Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrewProfileModal;
