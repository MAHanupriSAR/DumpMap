import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { AlertTriangle, CheckCircle, BarChart3, Map as MapIcon, AlertOctagon, Clock, LogOut, MapPin, ExternalLink, Camera, UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { signOutCognito } from '../authConfig';
import './AdminDashboard.css';

const RecenterMap = ({ lat, lng, zoom = 16 }) => {
  const map = useMap();
  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], zoom);
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }
  }, [lat, lng, zoom, map]);
  return null;
};

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

  // Resolution proof modal state
  const [resolvingReport, setResolvingReport] = useState(null);
  const [proofPhoto, setProofPhoto] = useState(null);
  const [proofPhotoPreview, setProofPhotoPreview] = useState(null);
  const [proofDescription, setProofDescription] = useState('');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);
  const [resolutionError, setResolutionError] = useState('');
  
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

  const handleOpenResolveModal = (report) => {
    setResolvingReport(report);
    setProofPhoto(null);
    setProofPhotoPreview(null);
    setProofDescription('');
    setResolutionError('');
  };

  const handleCloseResolveModal = () => {
    if (isSubmittingResolution) return;
    setResolvingReport(null);
    setProofPhoto(null);
    setProofPhotoPreview(null);
    setProofDescription('');
    setResolutionError('');
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setResolutionError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }
    setResolutionError('');
    setProofPhoto(file);
    const reader = new FileReader();
    reader.onload = () => {
      setProofPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!proofPhoto) {
      setResolutionError('A proof photo is required to mark this task as resolved.');
      return;
    }

    setIsSubmittingResolution(true);
    setResolutionError('');
    try {
      const fileExt = proofPhoto.name ? proofPhoto.name.split('.').pop() : 'jpg';
      const fileType = proofPhoto.type || 'image/jpeg';
      const filename = `proof-${Date.now()}.${fileExt}`;

      const urlRes = await fetch(
        `https://9y9e6wstgh.execute-api.us-east-1.amazonaws.com/upload-url?filename=${encodeURIComponent(filename)}&filetype=${encodeURIComponent(fileType)}`
      );
      const urlData = await urlRes.json();

      if (!urlData.uploadUrl) {
        throw new Error('Failed to get secure upload URL');
      }

      await fetch(urlData.uploadUrl, {
        method: 'PUT',
        body: proofPhoto,
        headers: { 'Content-Type': fileType }
      });

      const proofPhotoUrl = urlData.fileUrl;

      const res = await fetch(`https://9y9e6wstgh.execute-api.us-east-1.amazonaws.com/reports/${resolvingReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          userId: userId,
          workerName: workerName,
          proofPhotoUrl: proofPhotoUrl,
          proofDescription: proofDescription.trim(),
          resolvedAt: new Date().toISOString()
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update report status on server');
      }

      handleCloseResolveModal();
      await fetchReports();
      setActiveTab('resolved');
    } catch (err) {
      console.error('Error submitting resolution proof:', err);
      setResolutionError(err.message || 'Failed to submit resolution. Please try again.');
    } finally {
      setIsSubmittingResolution(false);
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
                  center={
                    availableReports.length > 0 && !isNaN(parseFloat(availableReports[0].lat))
                      ? [parseFloat(availableReports[0].lat), parseFloat(availableReports[0].lng)]
                      : [28.6139, 77.2090]
                  } 
                  zoom={13} 
                  style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                  zoomControl={true}
                >
                  <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {availableReports.length > 0 && !isNaN(parseFloat(availableReports[0].lat)) && (
                    <RecenterMap lat={parseFloat(availableReports[0].lat)} lng={parseFloat(availableReports[0].lng)} zoom={13} />
                  )}
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
                      eventHandlers={{
                        click: () => setSelectedHotspot({ location: report.location, reports: [report] })
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
                      {activeTab === 'accepted' && <button className="dispatch-btn" style={{ backgroundColor: '#10B981' }} onClick={() => handleOpenResolveModal(report)}>Resolve</button>}
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

                    {/* ONLY THIS PARTICULAR REPORT SHOWN ON MAP */}
                    {report.lat && report.lng && !isNaN(parseFloat(report.lat)) && !isNaN(parseFloat(report.lng)) && (
                      <div className="report-detail-map-section">
                        <div className="report-detail-map-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={16} color="#16A34A" />
                            <span>Report Location</span>
                          </div>
                          <a 
                            href={`https://www.google.com/maps?q=${report.lat},${report.lng}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="maps-ext-link"
                          >
                            Open in Google Maps <ExternalLink size={12} />
                          </a>
                        </div>
                        <div className="report-detail-map-wrapper">
                          <MapContainer
                            center={[parseFloat(report.lat), parseFloat(report.lng)]}
                            zoom={16}
                            style={{ height: '220px', width: '100%', borderRadius: '0 0 10px 10px' }}
                            zoomControl={true}
                            scrollWheelZoom={false}
                          >
                            <TileLayer
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <RecenterMap lat={parseFloat(report.lat)} lng={parseFloat(report.lng)} zoom={16} />
                            <CircleMarker
                              center={[parseFloat(report.lat), parseFloat(report.lng)]}
                              radius={12}
                              pathOptions={{
                                color: getHotspotColor(report.criticality),
                                fillColor: getHotspotColor(report.criticality),
                                fillOpacity: 0.85,
                                weight: 2
                              }}
                            >
                              <Popup>
                                <strong>{report.type} waste</strong><br />
                                {report.location}
                              </Popup>
                            </CircleMarker>
                          </MapContainer>
                        </div>
                      </div>
                    )}
                    
                    {report.photoUrl && (
                      <div className="report-image-container">
                        <div className="report-image-caption">Citizen Uploaded Photo</div>
                        <img src={report.photoUrl} alt="Waste" className="report-image" />
                      </div>
                    )}

                    {/* RESOLUTION PROOF (IF RESOLVED) */}
                    {report.status === 'resolved' && (report.proofPhotoUrl || report.proofDescription) && (
                      <div className="resolution-proof-display-card">
                        <div className="resolution-proof-header">
                          <div className="proof-header-badge">
                            <CheckCircle size={15} color="#10B981" />
                            <span>Cleanup Verified & Resolved</span>
                          </div>
                          {report.resolvedAt && (
                            <span className="proof-time-ago">{formatTimeAgo(report.resolvedAt)}</span>
                          )}
                        </div>

                        {report.resolvedBy && (
                          <div className="proof-worker-attribution">
                            Worker: <strong>{report.resolvedBy}</strong>
                          </div>
                        )}

                        {report.proofDescription && (
                          <div className="proof-desc-box">
                            <span className="proof-desc-label">Worker Notes:</span>
                            <p className="proof-desc-text">"{report.proofDescription}"</p>
                          </div>
                        )}

                        {report.proofPhotoUrl && (
                          <div className="report-image-container proof-image-container">
                            <div className="report-image-caption proof-caption">Resolution Proof Photo</div>
                            <img src={report.proofPhotoUrl} alt="Cleanup Proof" className="report-image" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION PROOF MODAL FOR WORKERS */}
      {resolvingReport && (
        <div className="admin-modal-overlay" onClick={handleCloseResolveModal}>
          <div className="admin-modal-content resolve-proof-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2>Complete & Resolve Task</h2>
                <div className="resolve-location-sub">
                  <MapPin size={14} color="#64748B" />
                  <span>{resolvingReport.location}</span>
                </div>
              </div>
              <button className="close-btn" onClick={handleCloseResolveModal} disabled={isSubmittingResolution}>✕</button>
            </div>

            <form onSubmit={handleSubmitResolution} className="admin-modal-body resolve-modal-body">
              <div className="resolve-guide-banner">
                <CheckCircle size={18} color="#10B981" />
                <span>Upload or take a photo proving the waste was cleared. Citizens will see this proof on their report.</span>
              </div>

              {resolutionError && (
                <div className="resolve-error-banner">
                  <AlertTriangle size={16} />
                  <span>{resolutionError}</span>
                </div>
              )}

              {/* PHOTO UPLOAD */}
              <div className="resolve-form-group">
                <label className="resolve-form-label">
                  <Camera size={16} color="#0F172A" />
                  <span>Proof Photo <strong className="required-star">*</strong></span>
                </label>

                {!proofPhotoPreview ? (
                  <label className="proof-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      style={{ display: 'none' }}
                      disabled={isSubmittingResolution}
                    />
                    <div className="dropzone-body">
                      <div className="dropzone-icon-circle">
                        <UploadCloud size={28} color="#10B981" />
                      </div>
                      <span className="dropzone-primary-text">Click or tap to take / upload photo</span>
                      <span className="dropzone-subtext">JPG, PNG, WEBP (Required as proof of work)</span>
                    </div>
                  </label>
                ) : (
                  <div className="proof-preview-card">
                    <img src={proofPhotoPreview} alt="Proof preview" className="proof-preview-image" />
                    <div className="proof-preview-footer">
                      <span className="proof-file-name">{proofPhoto?.name || 'Photo captured'}</span>
                      <label className="proof-retake-btn">
                        Retake Photo
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoSelect}
                          style={{ display: 'none' }}
                          disabled={isSubmittingResolution}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* OPTIONAL DESCRIPTION */}
              <div className="resolve-form-group" style={{ marginTop: '18px' }}>
                <label className="resolve-form-label">
                  <span>Work Description / Remarks</span>
                  <span className="optional-tag">(optional)</span>
                </label>
                <textarea
                  className="resolve-textarea"
                  rows={3}
                  placeholder="e.g. Cleared 3 bags of plastic waste, swept the sidewalk, and sanitized the curb."
                  value={proofDescription}
                  onChange={e => setProofDescription(e.target.value)}
                  maxLength={300}
                  disabled={isSubmittingResolution}
                />
                <div className="resolve-char-counter">{proofDescription.length}/300</div>
              </div>

              {/* ACTIONS */}
              <div className="resolve-modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseResolveModal}
                  disabled={isSubmittingResolution}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="confirm-resolve-btn"
                  disabled={isSubmittingResolution || !proofPhoto}
                >
                  {isSubmittingResolution ? (
                    <>
                      <Loader2 size={16} className="spin-icon" />
                      <span>Uploading & Resolving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Submit & Mark Resolved</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
