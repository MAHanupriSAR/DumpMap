import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents } from 'react-leaflet';
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

// No more MOCK_HOTSPOTS

// Helper to get color based on severity
const getHotspotColor = (criticality) => {
  if (criticality === 'high') return '#EF4444';  // Red
  if (criticality === 'medium') return '#F59E0B'; // Yellow
  return '#3B82F6'; // Blue for low
};

const formatTime = (isoString) => {
  if (!isoString) return 'Just now';
  const date = new Date(isoString);
  return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Component to track and save map pan/zoom state
const MapStateSaver = () => {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      sessionStorage.setItem('cachedMapCenter', JSON.stringify({ lat: center.lat, lng: center.lng }));
    },
    zoomend: (e) => {
      const map = e.target;
      sessionStorage.setItem('cachedMapZoom', map.getZoom());
    }
  });
  return null;
};

const MapView = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(14);
  const [locationLoading, setLocationLoading] = useState(true);
  const [hotspots, setHotspots] = useState([]);

  useEffect(() => {
    // 1. If we have a cached pan location, use it as the map center
    const savedCenter = sessionStorage.getItem('cachedMapCenter');
    const savedZoom = sessionStorage.getItem('cachedMapZoom');
    
    let initialCenter = null;
    let initialZoom = savedZoom ? parseInt(savedZoom, 10) : 14;

    if (savedCenter) {
      const parsedCenter = JSON.parse(savedCenter);
      initialCenter = [parsedCenter.lat, parsedCenter.lng];
      setMapCenter(initialCenter);
      setMapZoom(initialZoom);
    }

    // 2. Also load user GPS location for the "You are here" pin
    const cachedLoc = sessionStorage.getItem('cachedUserLocation');
    if (cachedLoc) {
      const parsedLoc = JSON.parse(cachedLoc);
      setUserLocation(parsedLoc);
      
      if (!initialCenter) {
        setMapCenter([parsedLoc.lat, parsedLoc.lng]);
      }
      setLocationLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      // No geolocation support, fall back to India center
      setMapCenter([20.5937, 78.9629]); 
      setLocationLoading(false);
      return;
    }

    const onSuccess = (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const loc = { lat, lng };
      setUserLocation(loc);
      
      if (!initialCenter) {
        setMapCenter([lat, lng]);
      }
      
      sessionStorage.setItem('cachedUserLocation', JSON.stringify(loc));
      setLocationLoading(false);
    };

    const onError = () => {
      if (!initialCenter) {
        setMapCenter([20.5937, 78.9629]);
      }
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

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('https://9y9e6wstgh.execute-api.us-east-1.amazonaws.com/reports');
        const data = await response.json();
        // Only show active hotspots, remove resolved ones
        const activeHotspots = (data.reports || []).filter(report => report.status !== 'resolved');
        setHotspots(activeHotspots);
      } catch (err) {
        console.error("Failed to fetch reports for map", err);
      }
    };
    
    fetchReports();
  }, []);

  const displayHotspots = hotspots;

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
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapStateSaver />

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {displayHotspots.map(hotspot => (
          <CircleMarker
            key={hotspot.id}
            center={[parseFloat(hotspot.lat), parseFloat(hotspot.lng)]}
            radius={12}
            pathOptions={{ 
              color: getHotspotColor(hotspot.criticality),
              fillColor: getHotspotColor(hotspot.criticality),
              fillOpacity: 0.6,
              weight: 2
            }}
          >
            <Popup className="hotspot-popup">
              <div className="popup-content">
                <h3 style={{ textTransform: 'capitalize', marginBottom: '4px' }}>{hotspot.type} Waste</h3>
                <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#64748B' }}>Reported: {formatTime(hotspot.createdAt)}</p>
                <p style={{ fontStyle: 'italic', margin: '8px 0' }}>{hotspot.description}</p>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <div className={`status-badge`} style={{ backgroundColor: getHotspotColor(hotspot.criticality), color: '#fff' }}>
                    <AlertTriangle size={14} />
                    <span style={{ textTransform: 'capitalize' }}>{hotspot.status}</span>
                  </div>
                  <div className="status-badge" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
                    <span style={{ textTransform: 'capitalize' }}>{hotspot.criticality || 'low'} Severity</span>
                  </div>
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
          <div className="legend-color" style={{ backgroundColor: '#3B82F6' }}></div>
          <span>Low</span>
        </div>
      </div>
      )}
    </div>
  );
};

export default MapView;
