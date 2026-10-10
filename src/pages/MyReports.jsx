import { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { Clock, CheckCircle, MapPin, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import './MyReports.css';

const MyReports = () => {
  const auth = useAuth();
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const userId = auth.user?.profile?.sub || 'anonymous';
        const response = await fetch(`https://9y9e6wstgh.execute-api.us-east-1.amazonaws.com/reports?userId=${userId}`);
        const data = await response.json();
        // Sort newest first
        const sorted = (data.reports || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReports(sorted);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleReport = (id) => {
    setExpandedReportId(expandedReportId === id ? null : id);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#EF4444'; // Red
      case 'medium': return '#F59E0B'; // Yellow
      case 'low': return '#5FBD5F'; // Green
      default: return '#94A3B8';
    }
  };

  return (
    <div className="reports-container">
      <header className="reports-header">
        <h2>My Reports</h2>
      </header>

      <div className="reports-list">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 size={32} color="#5FBD5F" className="spin-icon" />
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
            <p>You haven't submitted any reports yet.</p>
          </div>
        ) : (
          reports.map(report => (
            <div 
            key={report.id} 
            className={`report-card ${expandedReportId === report.id ? 'expanded' : ''}`}
            onClick={() => toggleReport(report.id)}
          >
            <div className="report-card-header">
              <div className="report-main-info">
                <div className="report-location">
                  <h3>{report.location}</h3>
                </div>
                <span className="report-time">Reported {formatTime(report.createdAt)}</span>
              </div>
              
              <div className="report-status-badge">
                {report.status === 'rejected' ? (
                  <div className="status rejected">
                    <AlertTriangle size={16} />
                    <span>Rejected</span>
                  </div>
                ) : report.status === 'resolved' ? (
                  <div className="status resolved">
                    <CheckCircle size={16} />
                    <span>Resolved</span>
                  </div>
                ) : (
                  <div className="status pending">
                    <Clock size={16} />
                    <span>{report.status === 'pending' ? 'Verifying...' : 'Cleanup pending'}</span>
                  </div>
                )}
              </div>
              
              <div className={`expand-icon ${expandedReportId === report.id ? 'rotated' : ''}`}>
                <ChevronRight size={20} color="#94A3B8" />
              </div>
            </div>

            {/* Expanded Content (Timeline) */}
            <div className="report-details" style={{
              maxHeight: expandedReportId === report.id ? '500px' : '0',
              opacity: expandedReportId === report.id ? 1 : 0
            }}>
              <div className="report-details-content">
                <div className="report-meta">
                  <span className="report-id" style={{ marginTop: '4px' }}>{report.id}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <span className="report-type" style={{ backgroundColor: getSeverityColor(report.criticality || 'low'), color: '#fff', border: 'none' }}>
                      {report.criticality === 'high' ? 'High' : report.criticality === 'medium' ? 'Mod' : 'Low'} Severity
                    </span>
                    <span className="report-type">{report.type} waste</span>
                  </div>
                </div>
                
                <p className="report-desc">"{report.description}"</p>

                <div className="status-timeline">
                  {report.timeline.map((step, index) => (
                    <div key={index} className={`timeline-item ${step.completed ? 'active' : ''} ${step.failed ? 'failed' : ''}`}>
                      <div className="timeline-dot">
                        {step.failed && <span className="failed-x">×</span>}
                      </div>
                      <span>{step.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyReports;
