import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { AlertTriangle, CheckCircle, BarChart3, Map as MapIcon, AlertOctagon, Clock } from 'lucide-react';
import './AdminDashboard.css';

const getHotspotColor = (criticality) => {
  if (criticality === 'high') return '#EF4444';  // Red
  if (criticality === 'medium') return '#F59E0B'; // Yellow
  return '#3B82F6'; // Blue
};

const formatTimeAgo = (isoString) => {
  if (!isoString) return 'Just now';
  const diffHours = Math.floor((new Date() - new Date(isoString)) / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
};

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('https://9y9e6wstgh.execute-api.us-east-1.amazonaws.com/reports');
        const data = await response.json();
        setReports(data.reports || []);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();
  }, []);

  // Compute analytics
  const activeReports = reports.filter(r => r.status !== 'resolved');
  const criticalReports = activeReports.filter(r => r.criticality === 'high');
  
  // Group by location to simulate "Hotspots" (rudimentary grouping by string)
  const locationGroups = {};
  activeReports.forEach(r => {
    const loc = r.location || 'Unknown Location';
    if (!locationGroups[loc]) locationGroups[loc] = { count: 0, criticality: r.criticality, oldest: r.createdAt, reports: [] };
    locationGroups[loc].count += 1;
    locationGroups[loc].reports.push(r);
    if (r.criticality === 'high') locationGroups[loc].criticality = 'high';
  });

  const hotspotsList = Object.keys(locationGroups).map(loc => ({
    location: loc,
    ...locationGroups[loc]
  })).sort((a, b) => {
    // Sort by high criticality first, then by count
    if (a.criticality === 'high' && b.criticality !== 'high') return -1;
    if (a.criticality !== 'high' && b.criticality === 'high') return 1;
    return b.count - a.count;
  });

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>Municipal Intelligence</h1>
            <p>Live Waste Activity & Priority Matrix</p>
          </div>
          <button className="export-btn">Export Report</button>
        </div>
      </header>

      {isLoading ? (
        <div className="admin-loading">Loading live intelligence...</div>
      ) : (
        <div className="admin-content">
          {/* STATS ROW */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                <BarChart3 size={24} />
              </div>
              <div className="stat-data">
                <span className="stat-value">{reports.length}</span>
                <span className="stat-label">Total Reports</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
                <MapIcon size={24} />
              </div>
              <div className="stat-data">
                <span className="stat-value">{hotspotsList.length}</span>
                <span className="stat-label">Active Hotspots</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                <AlertOctagon size={24} />
              </div>
              <div className="stat-data">
                <span className="stat-value">{criticalReports.length}</span>
                <span className="stat-label">Critical Issues</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>
                <Clock size={24} />
              </div>
              <div className="stat-data">
                <span className="stat-value">{activeReports.length}</span>
                <span className="stat-label">Unresolved</span>
              </div>
            </div>
          </div>

          <div className="admin-main-grid">
            {/* MAP SECTION */}
            <div className="admin-map-card">
              <div className="card-header">
                <h2>Live Heatmap</h2>
                <span className="live-indicator"><span className="pulse"></span> Live</span>
              </div>
              <div className="admin-map-container">
                <MapContainer 
                  center={[40.7128, -74.0060]} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                  zoomControl={true}
                >
                  <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {activeReports.map(report => (
                    <CircleMarker
                      key={report.id}
                      center={[parseFloat(report.lat), parseFloat(report.lng)]}
                      radius={10}
                      pathOptions={{ 
                        color: getHotspotColor(report.criticality),
                        fillColor: getHotspotColor(report.criticality),
                        fillOpacity: 0.7,
                        weight: 1
                      }}
                    >
                      <Popup>
                        <strong>{report.type} waste</strong><br/>
                        {report.location}
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* PRIORITY ACTIONS */}
            <div className="priority-card">
              <div className="card-header">
                <h2>Priority Actions</h2>
                <span className="action-count">{hotspotsList.length} needed</span>
              </div>
              
              <div className="priority-list">
                {hotspotsList.slice(0, 6).map((hotspot, idx) => (
                  <div key={idx} className="priority-item">
                    <div className="priority-icon" style={{ 
                      backgroundColor: hotspot.criticality === 'high' ? '#FEF2F2' : '#FFFBEB',
                      color: hotspot.criticality === 'high' ? '#EF4444' : '#F59E0B'
                    }}>
                      <AlertTriangle size={20} />
                    </div>
                    <div className="priority-info">
                      <h3>{hotspot.location}</h3>
                      <div className="priority-meta">
                        <span className="meta-badge">{hotspot.count} Reports</span>
                        <span className="meta-time">since {formatTimeAgo(hotspot.oldest)}</span>
                      </div>
                    </div>
                    <button className="dispatch-btn">Dispatch</button>
                  </div>
                ))}
                
                {hotspotsList.length === 0 && (
                  <div className="no-actions">
                    <CheckCircle size={32} color="#16A34A" />
                    <p>No active hotspots found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
