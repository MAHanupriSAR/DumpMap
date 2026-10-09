import { useState } from 'react';
import { Clock, CheckCircle, MapPin, ChevronRight, AlertTriangle } from 'lucide-react';
import './MyReports.css';

const MOCK_REPORTS = [
  {
    id: 'WS-18427',
    location: 'Sector 12, Main Road',
    time: '2 hours ago',
    severity: 'high',
    status: 'pending',
    type: 'mixed',
    description: 'Blocking the sidewalk completely.',
    timeline: [
      { status: 'Reported', completed: true },
      { status: 'Verified', completed: false },
      { status: 'Cleanup assigned', completed: false },
      { status: 'Resolved', completed: false }
    ]
  },
  {
    id: 'WS-18290',
    location: 'Market Road, Near Square',
    time: '5 days ago',
    severity: 'medium',
    status: 'resolved',
    type: 'plastic',
    description: 'Overflowing bins.',
    timeline: [
      { status: 'Reported', completed: true },
      { status: 'Verified', completed: true },
      { status: 'Cleanup assigned', completed: true },
      { status: 'Resolved', completed: true }
    ]
  },
  {
    id: 'WS-17902',
    location: 'School Road, East Gate',
    time: '2 weeks ago',
    severity: 'low',
    status: 'resolved',
    type: 'paper',
    description: 'Litter on the street.',
    timeline: [
      { status: 'Reported', completed: true },
      { status: 'Verified', completed: true },
      { status: 'Cleanup assigned', completed: true },
      { status: 'Resolved', completed: true }
    ]
  }
];

const MyReports = () => {
  const [expandedReportId, setExpandedReportId] = useState(null);

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
        {MOCK_REPORTS.map((report) => (
          <div 
            key={report.id} 
            className={`report-card ${expandedReportId === report.id ? 'expanded' : ''}`}
            onClick={() => toggleReport(report.id)}
          >
            <div className="report-card-header">
              <div className="report-main-info">
                <div className="report-location">
                  <div 
                    className="severity-dot" 
                    style={{ backgroundColor: getSeverityColor(report.severity) }}
                  />
                  <h3>{report.location}</h3>
                </div>
                <span className="report-time">Reported {report.time}</span>
              </div>
              
              <div className="report-status-badge">
                {report.status === 'pending' ? (
                  <div className="status pending">
                    <Clock size={16} />
                    <span>Cleanup pending</span>
                  </div>
                ) : (
                  <div className="status resolved">
                    <CheckCircle size={16} />
                    <span>Resolved</span>
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
                  <span className="report-id">{report.id}</span>
                  <span className="report-type">{report.type} waste</span>
                </div>
                
                <p className="report-desc">"{report.description}"</p>

                <div className="status-timeline">
                  {report.timeline.map((step, index) => (
                    <div key={index} className={`timeline-item ${step.completed ? 'active' : ''}`}>
                      <div className="timeline-dot"></div>
                      <span>{step.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyReports;
