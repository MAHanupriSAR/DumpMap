import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { AlertTriangle, CheckCircle, BarChart3, Map as MapIcon, AlertOctagon, Clock, LogOut } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { signOutCognito } from '../authConfig';
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
  const auth = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [activeTab, setActiveTab] = useState('available');
  
  // Staff identity comes from Cognito user profile or fallback
  const user = auth.user?.profile;
  const workerEmail = user?.email || localStorage.getItem('workerEmail') || 'staff@dumpmap.gov';
  const workerName = user?.name || localStorage.getItem('workerName') || workerEmail.split('@')[0];
  const userId = workerEmail;
  const workerZone = localStorage.getItem('workerZone') || 'Municipal Zone';

  const handleLogout = () => {
    signOutCognito(auth);
  };

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch('https://9y9e6wstgh.execute-api.us-east-1.amazonaws.com/reports');
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async (reportId, action) => {
    try {
      const res = await fetch(`https://9y9e6wstgh.execute-api.us-east-1.amazonaws.com/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId })
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (err) {
      console.error(`Failed to ${action} report`, err);
    }
  };

  // Compute analytics and lists
  const validReports = reports.filter(r => r.status !== 'rejected');
  
  const availableReports = validReports.filter(r => r.status === 'active');
  const acceptedReports = validReports.filter(r => r.status === 'accepted' && r.assignedTo === userId);
  const resolvedReports = validReports.filter(r => r.status === 'resolved' && r.assignedTo === userId);
  
  const currentList = activeTab === 'available' ? availableReports : activeTab === 'accepted' ? acceptedReports : resolvedReports;
  const criticalReports = availableReports.filter(r => r.criticality === 'high');

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>Staff Dashboard</h1>
            <p>Task Assignment & Resolution Matrix {workerZone ? `· ${workerZone}` : ''}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>👋 {workerName}</span>
            <button className="export-btn" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', borderColor: '#FECACA' }}>
              <LogOut size={15} /> Logout
            </button>
          </div>
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
                <span className="stat-value">{reports.filter(r => r.status !== 'rejected').length}</span>
                <span className="stat-label">Total Reports</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
                <MapIcon size={24} />
              </div>
              <div className="stat-data">
                <span className="stat-value">{availableReports.length}</span>
                <span className="stat-label">Available Hotspots</span>
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
                <span className="stat-value">{acceptedReports.length}</span>
                <span className="stat-label">My Active Tasks</span>
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
                  {availableReports.map(report => (
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

            {/* STAFF TASK MANAGER */}
            <div className="priority-card">
              <div className="card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                <h2>Staff Task Manager</h2>
                <div className="staff-tabs" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`} onClick={() => setActiveTab('available')}>Available ({availableReports.length})</button>
                  <button className={`tab-btn ${activeTab === 'accepted' ? 'active' : ''}`} onClick={() => setActiveTab('accepted')}>My Accepted ({acceptedReports.length})</button>
                  <button className={`tab-btn ${activeTab === 'resolved' ? 'active' : ''}`} onClick={() => setActiveTab('resolved')}>My Resolved ({resolvedReports.length})</button>
                </div>
              </div>
              
              <div className="priority-list">
                {currentList.map(report => (
                  <div key={report.id} className="priority-item">
                    <div className="priority-icon" style={{ 
                      backgroundColor: report.criticality === 'high' ? '#FEF2F2' : '#FFFBEB',
                      color: report.criticality === 'high' ? '#EF4444' : '#F59E0B'
                    }}>
                      <AlertTriangle size={20} />
                    </div>
                    <div className="priority-info">
                      <h3>{report.location}</h3>
                      <div className="priority-meta">
                        <span className="meta-badge">{report.type} waste</span>
                        <span className="meta-time">since {formatTimeAgo(report.createdAt)}</span>
                      </div>
                    </div>
                    <div className="priority-actions-group">
                      <button className="view-details-btn" onClick={() => setSelectedHotspot({ location: report.location, reports: [report] })}>Details</button>
                      {activeTab === 'available' && <button className="dispatch-btn" onClick={() => handleAction(report.id, 'accept')}>Accept</button>}
                      {activeTab === 'accepted' && <button className="dispatch-btn" style={{ backgroundColor: '#10B981' }} onClick={() => handleAction(report.id, 'resolve')}>Resolve</button>}
                      {activeTab === 'resolved' && <button className="dispatch-btn" style={{ backgroundColor: '#94A3B8', cursor: 'default' }} disabled>Resolved</button>}
                    </div>
                  </div>
                ))}
                
                {currentList.length === 0 && (
                  <div className="no-actions">
                    <CheckCircle size={32} color="#16A34A" />
                    <p>No reports in this category.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOTSPOT DETAILS MODAL */}
      {selectedHotspot && (
        <div className="admin-modal-overlay" onClick={() => setSelectedHotspot(null)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{selectedHotspot.location}</h2>
              <button className="close-btn" onClick={() => setSelectedHotspot(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <p className="modal-subtitle">{selectedHotspot.reports.length} reports logged here</p>
              
              <div className="modal-reports-list">
                {selectedHotspot.reports.map(report => (
                  <div key={report.id} className="modal-report-card">
                    <div className="report-card-header">
                      <span className={`criticality-badge ${report.criticality || 'low'}`}>
                        {(report.criticality || 'low').toUpperCase()}
                      </span>
                      <span className="report-time">{formatTimeAgo(report.createdAt)}</span>
                    </div>
                    
                    <div className="report-card-details">
                      <p><strong>Type:</strong> {report.type || 'General'} Waste</p>
                      <p><strong>Amount:</strong> {report.amount || 'Unknown'}</p>
                      
                      {report.severity && report.severity.length > 0 && (
                        <div className="report-issues">
                          <strong>Issues:</strong>
                          <div className="issue-tags">
                            {report.severity.map(issue => <span key={issue} className="issue-tag">{issue}</span>)}
                          </div>
                        </div>
                      )}
                      
                      {report.description && (
                        <p className="report-desc">"{report.description}"</p>
                      )}
                    </div>
                    
                    {report.photoUrl && (
                      <div className="report-image-container">
                        <img src={report.photoUrl} alt="Waste" className="report-image" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
