import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, CheckCircle, Leaf, Construction } from 'lucide-react';
import './MapView.css';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom icon for the user's current location
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="user-location-dot"></div><div class="user-location-pulse"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Mock hotspots data
const MOCK_HOTSPOTS = [
  { id: 1, lat: 40.7135, lng: -74.0045, severity: 'high', type: 'mixed', description: 'Blocking sidewalk', status: 'reported' },
  { id: 2, lat: 40.7112, lng: -74.0080, severity: 'medium', type: 'plastic', description: 'Overflowing bin', status: 'verified' },
  { id: 3, lat: 40.7150, lng: -74.0020, severity: 'low', type: 'organic', description: 'Cleared yard waste', status: 'cleaned' },
  { id: 4, lat: 40.7142, lng: -74.0105, severity: 'high', type: 'construction', description: 'Debris on road', status: 'reported' }
];

// Helper to get color based on severity
const getHotspotColor = (severity, status) => {
  if (status === 'cleaned') return '#5FBD5F'; // Green
  if (severity === 'high') return '#EF4444';  // Red
  if (severity === 'medium') return '#F59E0B'; // Yellow
  return '#3B82F6'; // Blue for low
};

// Component to dynamically pan to user location once found
const LocationPanner = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { animate: true });
    }
  }, [center, map]);
  return null;
};

const MapView = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null); // null = not ready yet
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      // No geolocation support, fall back to NYC
      setMapCenter([20.5937, 78.9629]); // Fall back to India center
      setLocationLoading(false);
      return;
    }

    const onSuccess = (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setUserLocation({ lat, lng });
      setMapCenter([lat, lng]);
      setLocationLoading(false);
    };

    const onError = () => {
      // Fall back to a generic center if location is denied/unavailable
      setMapCenter([20.5937, 78.9629]);
      setLocationLoading(false);
    };

    // Try high accuracy first (GPS on mobile), fall back to low accuracy on desktop
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => {
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 10000,
        });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  // Generate localized mock hotspots if user location is available
  const displayHotspots = userLocation 
    ? MOCK_HOTSPOTS.map((hs, i) => {
        // Create offsets to place them somewhat near the user
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lngOffset = (Math.random() - 0.5) * 0.01;
        return {
          ...hs,
          lat: userLocation.lat + latOffset,
          lng: userLocation.lng + lngOffset
        };
      })
    : MOCK_HOTSPOTS;

  return (
    <div className="map-view-container">
      <div className="map-header-overlay">
        <h2>Waste Hotspots</h2>
      </div>

      {locationLoading ? (
        <div className="map-loading">
          <div className="map-loading-dot"></div>
          <p>Finding your location…</p>
        </div>
      ) : (
      <MapContainer 
        center={mapCenter} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {userLocation && <LocationPanner center={userLocation} />}

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* Hotspots */}
        {displayHotspots.map(hotspot => (
          <CircleMarker
            key={hotspot.id}
            center={[hotspot.lat, hotspot.lng]}
            radius={12}
            pathOptions={{ 
              color: getHotspotColor(hotspot.severity, hotspot.status),
              fillColor: getHotspotColor(hotspot.severity, hotspot.status),
              fillOpacity: hotspot.status === 'cleaned' ? 0.3 : 0.6,
              weight: 2
            }}
          >
            <Popup className="hotspot-popup">
              <div className="popup-content">
                <h3>{hotspot.type.charAt(0).toUpperCase() + hotspot.type.slice(1)} Waste</h3>
                <p>{hotspot.description}</p>
                <div className={`status-badge ${hotspot.status}`}>
                  {hotspot.status === 'cleaned' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  <span>{hotspot.status}</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      )}

      {!locationLoading && (
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#EF4444' }}></div>
          <span>Severe</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#F59E0B' }}></div>
          <span>Moderate</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#5FBD5F' }}></div>
          <span>Cleaned</span>
        </div>
      </div>
      )}
    </div>
  );
};

export default MapView;
