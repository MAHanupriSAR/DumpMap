import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Search, Camera, Image as ImageIcon, CheckCircle, Map as MapIcon, Leaf, Recycle, Home as Construction, FileText, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import './ReportWaste.css';

const ReportWaste = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 5; // Location, Photo, Type, Severity, Description
  
  const [formData, setFormData] = useState({
    location: null,
    photo: null,
    type: null,
    amount: null,
    severity: [],
    description: ''
  });

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => {
    if (step === 1 || step === 6) navigate('/');
    else setStep(prev => prev - 1);
  };

  const toggleSeverity = (issue) => {
    setFormData(prev => ({
      ...prev,
      severity: prev.severity.includes(issue) 
        ? prev.severity.filter(i => i !== issue)
        : [...prev.severity, issue]
    }));
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    
    setIsLocating(true);
    setLocationError('');
    
    const successCallback = async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        let addressText = data.display_name;
        
        // Nominatim display_names can be very long. Let's truncate to the first 3 or 4 meaningful parts.
        if (addressText) {
          const parts = addressText.split(', ');
          addressText = parts.slice(0, Math.min(4, parts.length)).join(', ');
        } else {
          addressText = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }

        setIsLocating(false);
        setFormData(prev => ({
          ...prev, 
          location: {
            type: 'current',
            lat,
            lng,
            address: addressText
          }
        }));
      } catch (err) {
        console.warn("Reverse geocoding failed, falling back to coordinates", err);
        setIsLocating(false);
        setFormData(prev => ({
          ...prev, 
          location: {
            type: 'current',
            lat,
            lng,
            address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          }
        }));
      }
    };

    const fallbackToLowAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        successCallback,
        (error) => {
          setIsLocating(false);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError('Permission denied. Please allow location in your browser.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setLocationError('Location unavailable. Ensure your device OS location services are ON.');
          } else if (error.code === error.TIMEOUT) {
            setLocationError('Location request timed out. Please try again.');
          } else {
            setLocationError('An unknown error occurred.');
          }
          console.error("Geolocation fallback error:", error);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 10000 }
      );
    };

    // Try high accuracy first (critical for mobile devices to use GPS)
    navigator.geolocation.getCurrentPosition(
      successCallback,
      (error) => {
        // If high accuracy fails (common on desktops), immediately fallback to low accuracy
        if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
          console.warn("High accuracy failed, falling back to low accuracy...");
          fallbackToLowAccuracy();
        } else {
          // If permission denied, no need to fallback
          setIsLocating(false);
          setLocationError('Permission denied. Please allow location in your browser.');
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const submitReport = () => {
    // In a real app, send formData to backend here
    setStep(6); // Success step
  };

  return (
    <div className="report-container">
      {/* Header */}
      {step < 6 && (
        <header className="report-header">
          <button className="icon-btn" onClick={handleBack}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title">
            <h2>Report Waste</h2>
            <span className="step-indicator">{step} / {totalSteps}</span>
          </div>
          <div className="placeholder-btn"></div>
        </header>
      )}

      <main className="report-content">
        {/* Step 1: Location */}
        {step === 1 && (
          <div className="step-wrapper">
            <h2 className="step-title">Where is the waste?</h2>
            
            <button 
              className={`option-btn primary-option ${isLocating ? 'locating' : ''} ${formData.location?.type === 'current' ? 'selected-option' : ''}`} 
              onClick={handleCurrentLocation}
              disabled={isLocating}
            >
              <div className="option-icon">
                {isLocating ? (
                  <Loader2 size={24} color="#5FBD5F" className="spin-icon" />
                ) : formData.location?.type === 'current' ? (
                  <CheckCircle size={24} color="#5FBD5F" />
                ) : (
                  <MapPin size={24} color="#5FBD5F" />
                )}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                <span>{isLocating ? 'Acquiring location...' : 'Use my current location'}</span>
                {formData.location?.type === 'current' && (
                  <span style={{fontSize: '0.8rem', color: '#64748B', marginTop: '4px', lineHeight: '1.4', textAlign: 'left'}}>
                    {formData.location.address}
                  </span>
                )}
              </div>
            </button>
            {locationError && <p className="error-text">{locationError}</p>}
            
            <div className="divider">
              <span>OR</span>
            </div>
            
            <button 
              className={`option-btn ${formData.location?.type === 'manual' ? 'selected-option' : ''}`} 
              onClick={() => setFormData({...formData, location: { type: 'manual' }})}
            >
              <div className="option-icon">
                {formData.location?.type === 'manual' ? <CheckCircle size={24} color="#5FBD5F" /> : <Search size={24} />}
              </div>
              <span>Enter location manually</span>
            </button>

            <div className="map-placeholder">
              <MapIcon size={48} color="#94A3B8" />
              <p>Map view preview</p>
            </div>
          </div>
        )}

        {/* Step 2: Photo */}
        {step === 2 && (
          <div className="step-wrapper">
            <h2 className="step-title">Add a photo</h2>
            <p className="step-subtitle">Photo helps verify the report.</p>
            
            <div className="photo-actions">
              <button className="take-photo-btn" onClick={() => { setFormData({...formData, photo: 'camera'}); handleNext(); }}>
                <Camera size={48} color="#5FBD5F" />
                <span>Take a photo</span>
              </button>
              
              <button className="gallery-btn" onClick={() => { setFormData({...formData, photo: 'gallery'}); handleNext(); }}>
                <ImageIcon size={20} />
                <span>Choose from gallery</span>
              </button>
            </div>
            
            <button className="btn secondary-btn skip-btn" onClick={handleNext}>Skip for now</button>
          </div>
        )}

        {/* Step 3: Type & Amount */}
        {step === 3 && (
          <div className="step-wrapper">
            <h2 className="step-title">What type of waste?</h2>
            
            <div className="grid-options">
              {[
                { id: 'mixed', label: 'Mixed', icon: <AlertTriangle size={20} /> },
                { id: 'organic', label: 'Organic', icon: <Leaf size={20} /> },
                { id: 'plastic', label: 'Plastic', icon: <Recycle size={20} /> },
                { id: 'construction', label: 'Construction', icon: <Construction size={20} /> },
                { id: 'paper', label: 'Paper', icon: <FileText size={20} /> },
                { id: 'hazardous', label: 'Hazardous', icon: <AlertTriangle size={20} /> },
                { id: 'notsure', label: 'Not sure', icon: <HelpCircle size={20} /> }
              ].map(type => (
                <button 
                  key={type.id} 
                  className={`grid-item ${formData.type === type.id ? 'selected' : ''}`}
                  onClick={() => setFormData({...formData, type: type.id})}
                >
                  {type.icon}
                  <span>{type.label}</span>
                </button>
              ))}
            </div>

            <h3 className="sub-title">How much?</h3>
            <div className="pill-options">
              {['Small', 'Medium', 'Large'].map(amt => (
                <button 
                  key={amt} 
                  className={`pill-btn ${formData.amount === amt ? 'selected' : ''}`}
                  onClick={() => setFormData({...formData, amount: amt})}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Severity */}
        {step === 4 && (
          <div className="step-wrapper">
            <h2 className="step-title">Is it causing an immediate problem?</h2>
            
            <div className="list-options">
              {['Blocking road/path', 'Blocking drain', 'Bad smell', 'Attracting animals', 'Burning/smoke', 'None'].map(issue => (
                <label key={issue} className="checkbox-option">
                  <input 
                    type="checkbox" 
                    checked={formData.severity.includes(issue)}
                    onChange={() => toggleSeverity(issue)}
                  />
                  <div className="checkbox-custom">
                    {formData.severity.includes(issue) && <CheckCircle size={16} color="#FFF" />}
                  </div>
                  <span>{issue}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Description */}
        {step === 5 && (
          <div className="step-wrapper">
            <h2 className="step-title">Anything else? (Optional)</h2>
            <textarea 
              className="text-input" 
              placeholder='"Garbage has been here for around 3 days..."'
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={5}
            ></textarea>
          </div>
        )}

        {/* Step 6: Success */}
        {step === 6 && (
          <div className="step-wrapper success-step">
            <div className="success-icon">
              <CheckCircle size={64} color="#5FBD5F" />
            </div>
            <h2>Report submitted</h2>
            <p className="ticket-id">#WS-18427</p>
            
            <div className="location-summary">
              <MapPin size={20} color="#64748B" />
              <span>Sector 12, Main Road</span>
            </div>
            
            <p className="success-msg">Your report has been added to the local waste map.</p>
            
            <div className="status-timeline">
              <div className="timeline-item active">
                <div className="timeline-dot"></div>
                <span>Reported</span>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <span>Verified</span>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <span>Cleanup assigned</span>
              </div>
            </div>
            
            <button className="btn primary-btn block-btn" onClick={() => navigate('/map')}>View on Map</button>
            <button className="btn secondary-btn block-btn mt-3" onClick={() => navigate('/')}>Done</button>
          </div>
        )}
      </main>

      {/* Footer Navigation (Next Button) */}
      {(step === 1 || (step > 2 && step < 6)) && (
        <footer className="report-footer">
          <button 
            className="btn primary-btn block-btn" 
            onClick={step === 5 ? submitReport : handleNext}
            disabled={
              (step === 1 && !formData.location) ||
              (step === 3 && (!formData.type || !formData.amount))
            }
          >
            {step === 5 ? 'Submit Report' : 'Continue'}
          </button>
        </footer>
      )}
    </div>
  );
};

export default ReportWaste;
