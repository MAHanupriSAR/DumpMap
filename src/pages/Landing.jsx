import { 
  ShieldCheck, 
  User, 
  ArrowRight, 
  ArrowDown, 
  Sparkles, 
  MapPin, 
  CheckCircle, 
  Camera, 
  BarChart3, 
  Layers, 
  Clock, 
  ExternalLink,
  AlertTriangle,
  Award,
  Zap
} from 'lucide-react';
import { citizenUserManager, workerUserManager } from '../authConfig';
import './Landing.css';

const Landing = () => {
  const handleCitizenLogin = () => {
    localStorage.setItem('auth_pool', 'citizen');
    localStorage.setItem('userRole', 'citizen');
    citizenUserManager.signinRedirect();
  };

  const handleStaffLogin = () => {
    localStorage.setItem('auth_pool', 'worker');
    localStorage.setItem('userRole', 'staff');
    workerUserManager.signinRedirect();
  };

  return (
    <div className="landing-page">
      {/* ── TOP ANNOUNCEMENT BAR ─────────────────────────────────── */}
      <div className="landing-topbar">
        <div className="topbar-container">
          <span className="topbar-badge">Live System</span>
          <span className="topbar-text">AI-Verified Municipal Waste Tracking & Resolution Platform</span>
          <span className="topbar-pill">AWS Serverless Cloud</span>
        </div>
      </div>

      {/* ── NAVIGATION HEADER ────────────────────────────────────── */}
      <header className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <img src="/logo.png" alt="DumpMap Logo" className="nav-logo" />
            <div className="brand-text">
              <span className="brand-title">DumpMap</span>
              <span className="brand-tag">Civic Intelligence</span>
            </div>
          </div>

          <nav className="nav-links">
            <a href="#pipeline" className="nav-link">How It Works</a>
            <a href="#features" className="nav-link">Capabilities</a>
            <a href="#portals" className="nav-link">Portals</a>
          </nav>

          <div className="nav-actions">
            <button className="nav-btn staff-btn" onClick={handleStaffLogin}>
              <ShieldCheck size={16} />
              <span>Staff Portal</span>
            </button>
            <button className="nav-btn citizen-btn" onClick={handleCitizenLogin}>
              <User size={16} />
              <span>Citizen Sign In</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-glow hero-glow-1"></div>
        <div className="hero-glow hero-glow-2"></div>
        
        <div className="hero-container">
          <div className="hero-badge">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Automated AI Triage & Real-Time Municipal Dispatch</span>
          </div>

          <h1 className="hero-heading">
            Spot Waste. Report in Seconds. <br />
            <span className="gradient-text">Verified by AI. Cleaned by City Crews.</span>
          </h1>

          <p className="hero-description">
            DumpMap empowers citizens to report illegal dumping in 30 seconds while equipping municipal sanitation crews with real-time geospatial intelligence, automated computer vision verification, and photographic proof-of-resolution.
          </p>

          {/* TRUST PILLS */}
          <div className="hero-trust-bar">
            <div className="trust-item">
              <Zap size={16} color="#10B981" />
              <span>30-Second Reporting</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <Sparkles size={16} color="#3B82F6" />
              <span>AWS Rekognition AI Verification</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <CheckCircle size={16} color="#10B981" />
              <span>Photo Proof of Work</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <MapPin size={16} color="#F59E0B" />
              <span>Precision Geotagging</span>
            </div>
          </div>
        </div>

        {/* ── INTERACTIVE PIPELINE SHOWCASE ───────────────────────── */}
        <div id="pipeline" className="pipeline-showcase-container">
          <div className="showcase-header">
            <span className="section-eyebrow">End-to-End Transparency</span>
            <h2>The Intelligent Waste Remediation Pipeline</h2>
            <p>From the moment a photo is captured to verified municipal resolution on the ground.</p>
          </div>

          <div className="pipeline-grid">
            {/* STEP 1: CITIZEN REPORT */}
            <div className="pipeline-card">
              <div className="pipeline-step-badge">01. Citizen Report</div>
              <div className="mock-card-header">
                <div className="mock-meta">
                  <span className="mock-crit high">HIGH PRIORITY</span>
                  <span className="mock-time">Just reported</span>
                </div>
                <span className="mock-type">Plastic & Debris</span>
              </div>

              <div className="mock-location">
                <MapPin size={15} color="#64748B" />
                <span>Connaught Place, Block B, New Delhi</span>
              </div>

              <div className="mock-photo-box report-box">
                <span className="photo-label">Reported Waste Photo</span>
                <div className="mock-photo-visual report-visual">
                  <div className="waste-tag-pill">Pile of 40+ plastic bottles</div>
                </div>
              </div>

              <div className="mock-footer-status">
                <span className="status-dot green"></span>
                <span>Geotagged & Presigned S3 Upload</span>
              </div>
            </div>

            {/* CONNECTOR ARROW 1 */}
            <div className="pipeline-connector">
              <div className="connector-line connector-line-start"></div>
              <div className="connector-badge">
                <Sparkles size={13} color="#3B82F6" />
                <span>AI Stream</span>
              </div>
              <div className="connector-line connector-line-end"></div>
              <ArrowRight size={14} className="connector-arrow-desktop" />
              <ArrowDown size={14} className="connector-arrow-mobile" />
            </div>

            {/* STEP 2: AI REKOGNITION */}
            <div className="pipeline-card highlight-card">
              <div className="pipeline-step-badge ai-badge">02. AWS Rekognition AI</div>
              <div className="ai-status-header">
                <div className="ai-model-tag">
                  <Sparkles size={14} />
                  <span>Deep Learning Vision</span>
                </div>
                <span className="ai-confidence">98.4% Confidence</span>
              </div>

              <div className="ai-labels-list">
                <div className="ai-label-pill matched">
                  <CheckCircle size={13} />
                  <span>Garbage (98.4%)</span>
                </div>
                <div className="ai-label-pill matched">
                  <CheckCircle size={13} />
                  <span>Plastic Waste (95.1%)</span>
                </div>
                <div className="ai-label-pill matched">
                  <CheckCircle size={13} />
                  <span>Litter & Rubble (91.8%)</span>
                </div>
              </div>

              <div className="ai-verdict-box">
                <div className="verdict-title">Anti-Spam Triage Passed</div>
                <p>DynamoDB Stream confirmed actionable civic waste. Report routed to North Delhi dispatch matrix.</p>
              </div>

              <div className="mock-footer-status">
                <span className="status-dot blue"></span>
                <span>Queued for Municipal Crew</span>
              </div>
            </div>

            {/* CONNECTOR ARROW 2 */}
            <div className="pipeline-connector">
              <div className="connector-line connector-line-start"></div>
              <div className="connector-badge">
                <ShieldCheck size={13} color="#10B981" />
                <span>Dispatch</span>
              </div>
              <div className="connector-line connector-line-end"></div>
              <ArrowRight size={14} className="connector-arrow-desktop" />
              <ArrowDown size={14} className="connector-arrow-mobile" />
            </div>

            {/* STEP 3: WORKER RESOLUTION */}
            <div className="pipeline-card">
              <div className="pipeline-step-badge resolved-badge">03. Verified Resolution</div>
              <div className="mock-card-header">
                <div className="mock-meta">
                  <span className="mock-crit resolved">RESOLVED & VERIFIED</span>
                  <span className="mock-time">Completed</span>
                </div>
                <span className="mock-worker">Ramesh Kumar · North Delhi</span>
              </div>

              <div className="mock-notes-box">
                <span className="notes-label">Worker Remarks:</span>
                <p className="notes-text">"Cleared 4 bags of plastic waste, swept pathway, and disinfected drainage curb."</p>
              </div>

              <div className="mock-photo-box proof-box">
                <span className="photo-label proof-label">Official Cleanup Proof Photo</span>
                <div className="mock-photo-visual proof-visual">
                  <div className="clean-tag-pill">Pristine Curb & Sidewalk</div>
                </div>
              </div>

              <div className="mock-footer-status">
                <span className="status-dot emerald"></span>
                <span>Visible in Citizen My Reports</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KEY PLATFORM CAPABILITIES ────────────────────────────── */}
      <section id="features" className="features-section">
        <div className="features-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">Enterprise Civic Technology</span>
            <h2>Architected for Real Municipal Operations</h2>
            <p>Every feature is designed to reduce response times, prevent fraudulent reports, and establish civic trust.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <Sparkles size={24} />
              </div>
              <h3>Computer Vision Anti-Spam</h3>
              <p>AWS Rekognition analyzes every uploaded photo in milliseconds via DynamoDB Streams. Selfies and scenery are automatically rejected before reaching dispatch queues.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <MapPin size={24} />
              </div>
              <h3>Live Interactive Hotspot Map</h3>
              <p>Interactive OpenStreetMap interface visualizes city-wide waste clusters with color-coded criticality markers (Red for High, Yellow for Moderate, Blue for Low).</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #E2E8F0' }}>
                <ShieldCheck size={24} />
              </div>
              <h3>Dual Hardened Authentication</h3>
              <p>Separate AWS Cognito User Pools for citizens and municipal crew. Staff accounts have self-registration disabled, restricting dispatch access to provisioned personnel only.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <Clock size={24} />
              </div>
              <h3>Real-Time Incident Timelines</h3>
              <p>Citizens track their report through four milestone states: Reported, AI-Verified, Crew Accepted, and Cleaned. Total transparency eliminates duplicate 311 calls.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
                <Camera size={24} />
              </div>
              <h3>Mandatory Proof-of-Work</h3>
              <p>When marking a task as resolved, sanitation crews must capture and upload on-site photographic evidence and optional field notes before the status closes.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box" style={{ background: '#F1F5F9', color: '#475569' }}>
                <Layers size={24} />
              </div>
              <h3>100% Serverless Architecture</h3>
              <p>Powered by AWS Lambda, API Gateway v2, DynamoDB, S3, and AWS Amplify. Auto-scales from zero to millions of reports with zero server management overhead.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DUAL PORTAL ACCESS SECTION ───────────────────────────── */}
      <section id="portals" className="portals-section">
        <div className="portals-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">Role-Based Access</span>
            <h2>Select Your Portal to Get Started</h2>
            <p>Choose between the citizen public reporting portal and the municipal operations command center.</p>
          </div>

          <div className="portals-grid">
            {/* CITIZEN PORTAL CARD */}
            <div className="portal-action-card citizen-card">
              <div className="portal-badge-row">
                <span className="portal-type-badge citizen-badge">For Residents & Citizens</span>
                <span className="portal-free-badge">Open Access</span>
              </div>
              
              <div className="portal-content">
                <div className="portal-icon-wrapper citizen-glow">
                  <User size={32} color="#3B82F6" />
                </div>
                <h3>Citizen Reporting Hub</h3>
                <p>Spot an overflowing dumpster, hazardous debris, or illegal dumping? Report it in seconds, view surrounding incident hotspots, and track resolution progress.</p>
                
                <ul className="portal-features-list">
                  <li><CheckCircle size={16} color="#10B981" /> 5-step quick incident logger with map pinning</li>
                  <li><CheckCircle size={16} color="#10B981" /> View city-wide interactive public waste map</li>
                  <li><CheckCircle size={16} color="#10B981" /> Inspect official cleanup proof photos upon resolution</li>
                  <li><CheckCircle size={16} color="#10B981" /> Sign in with email or create a new account in 1 click</li>
                </ul>

                <button className="portal-submit-btn citizen-submit" onClick={handleCitizenLogin}>
                  <span>Continue as Citizen</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* MUNICIPAL STAFF PORTAL CARD */}
            <div className="portal-action-card staff-card">
              <div className="portal-badge-row">
                <span className="portal-type-badge staff-badge">For Sanitation & Field Crews</span>
                <span className="portal-restricted-badge">Authorized Staff Only</span>
              </div>

              <div className="portal-content">
                <div className="portal-icon-wrapper staff-glow">
                  <ShieldCheck size={32} color="#10B981" />
                </div>
                <h3>Municipal Operations Console</h3>
                <p>Authorized access for municipal workers and dispatch supervisors. Claim tasks in your assigned municipal zone, open navigation coordinates, and upload resolution proof.</p>

                <ul className="portal-features-list">
                  <li><CheckCircle size={16} color="#10B981" /> Task Assignment Matrix (Available, Accepted, Resolved)</li>
                  <li><CheckCircle size={16} color="#10B981" /> Isolated report location maps with Google Maps routing</li>
                  <li><CheckCircle size={16} color="#10B981" /> Mandatory on-site cleanup photo and remarks upload</li>
                  <li><CheckCircle size={16} color="#10B981" /> Hardened Cognito credentials (no self-signup)</li>
                </ul>

                <button className="portal-submit-btn staff-submit" onClick={handleStaffLogin}>
                  <span>Municipal Staff Login</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="brand-header">
                <img src="/logo.png" alt="DumpMap Logo" className="footer-logo" />
                <span className="footer-title">DumpMap</span>
              </div>
              <p className="footer-tagline">
                The next-generation municipal waste intelligence and resolution platform. Connecting active citizens with accountable civic operations.
              </p>
            </div>

            <div className="footer-links-group">
              <div className="footer-column">
                <h4>Platform</h4>
                <a href="#pipeline">Incident Pipeline</a>
                <a href="#features">Key Capabilities</a>
                <a href="#portals">Portal Directory</a>
              </div>
              <div className="footer-column">
                <h4>Architecture</h4>
                <span>AWS Serverless</span>
                <span>AWS Rekognition AI</span>
                <span>Amazon DynamoDB</span>
                <span>AWS Cognito Managed Login</span>
              </div>
              <div className="footer-column">
                <h4>Operations</h4>
                <span>North Delhi Sanitation Zone</span>
                <span>South Delhi Sanitation Zone</span>
                <span>East Delhi Sanitation Zone</span>
                <span>Municipal Field Matrix</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} DumpMap. All rights reserved. Built for municipal excellence.</p>
            <div className="footer-badges">
              <span className="tech-badge">AWS Amplify Hosted</span>
              <span className="tech-badge">Serverless v3</span>
              <span className="tech-badge">OpenStreetMap</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
