import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { ArrowLeft, MapPin, Search, Camera, Image as ImageIcon, CheckCircle, Map as MapIcon, Leaf, Recycle, Home as Construction, FileText, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './ReportWaste.css';

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 16, { animate: true, duration: 0.5 });
    }
  }, [center, map]);
  return null;
}

function MapEvents({ onMoveEnd }) {
  const map = useMapEvents({
    dragend: () => {
      onMoveEnd(map.getCenter());
    },
    zoomend: () => {
      onMoveEnd(map.getCenter());
    }
  });
  return null;
}

const ReportWaste = () => {
  const navigate = useNavigate();
  const auth = useAuth();
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
  
  // Manual Location State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default
  const [isMapGeocoding, setIsMapGeocoding] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState('');

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => {
    if (step === 1 || step === 6) navigate('/');
    else setStep(prev => prev - 1);
  };

  const toggleSeverity = (issue) => {
    setFormData(prev => {
      const isSelected = prev.severity.includes(issue);
      
      if (issue === 'None') {
        // If checking 'None', clear everything else
        return { ...prev, severity: isSelected ? [] : ['None'] };
      } else {
        // If checking anything else, remove 'None' if it was selected
        if (!isSelected) {
          return { ...prev, severity: [...prev.severity.filter(i => i !== 'None'), issue] };
        } else {
          return { ...prev, severity: prev.severity.filter(i => i !== issue) };
        }
      }
    });
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      setFormData(prev => ({ ...prev, photo: file }));
    }
    // Clear the input so selecting the same file again triggers onChange
    event.target.value = null;
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

  const handleSearchInput = async (value) => {
    setSearchQuery(value);
    if (value.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`);
      const data = await response.json();
      setSearchResults(data);
    } catch (e) {
      console.error('Search failed', e);
    }
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    let addressText = result.display_name;
    if (addressText) {
      const parts = addressText.split(', ');
      addressText = parts.slice(0, Math.min(4, parts.length)).join(', ');
    }
    
    setMapCenter({ lat, lng });
    setSearchQuery('');
    setSearchResults([]);
    
    setFormData(prev => ({
      ...prev,
      location: {
        type: 'manual',
        lat,
        lng,
        address: addressText
      }
    }));
  };

  const handleMapMoveEnd = async (center) => {
    setIsMapGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}&zoom=18&addressdetails=1`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      
      let addressText = data.display_name;
      if (addressText) {
        const parts = addressText.split(', ');
        addressText = parts.slice(0, Math.min(4, parts.length)).join(', ');
      } else {
        addressText = `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`;
      }

      setSearchQuery(addressText);
      setSearchResults([]);

      setFormData(prev => ({
        ...prev, 
        location: {
          type: 'manual',
          lat: center.lat,
          lng: center.lng,
          address: addressText
        }
      }));
    } catch (err) {
      console.warn('Reverse geocode failed', err);
      const fallbackText = `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`;
      setSearchQuery(fallbackText);
      
      setFormData(prev => ({
        ...prev, 
        location: {
          type: 'manual',
          lat: center.lat,
          lng: center.lng,
          address: fallbackText
        }
      }));
    }
    setIsMapGeocoding(false);
  };

  const calculateCriticality = (data) => {
    let score = 0;
    
    // 1. Base score on waste type
    const typePoints = { hazardous: 3, construction: 2, mixed: 1, plastic: 1, notsure: 1 };
    score += typePoints[data.type] || 0;
    
    // 2. Add points based on amount
    const amountPoints = { Large: 3, Medium: 2, Small: 1 };
    score += amountPoints[data.amount] || 0;
    
    // 3. Add points based on specific issues (severity array)
    const severityPoints = { 
      'Blocking drain': 3, 
      'Burning/smoke': 3, 
      'Blocking road/path': 2, 
      'Attracting animals': 2, 
      'Bad smell': 1 
    };
    if (data.severity && Array.isArray(data.severity)) {
      data.severity.forEach(issue => {
        score += severityPoints[issue] || 0;
      });
    }

    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  };

  const submitReport = async () => {
    setIsSubmitting(true);
    try {
      let photoUrl = null;

      if (formData.photo) {
        const fileExt = formData.photo.name ? formData.photo.name.split('.').pop() : 'jpg';
        const fileType = formData.photo.type || 'image/jpeg';
        
        const urlRes = await fetch(`https://9y9e6wstgh.execute-api.us-east-1.amazonaws.com/upload-url?filename=photo.${fileExt}&filetype=${fileType}`);
        const urlData = await urlRes.json();

        if (urlData.uploadUrl) {
          await fetch(urlData.uploadUrl, {
            method: 'PUT',
            body: formData.photo,
            headers: { 'Content-Type': fileType }
          });
          photoUrl = urlData.fileUrl;
        }
      }

      const reportPayload = {
        location: formData.location.address,
        lat: formData.location.lat,
        lng: formData.location.lng,
        type: formData.type,
        amount: formData.amount,
        severity: formData.severity,
        criticality: calculateCriticality(formData),
        description: formData.description,
        photoUrl: photoUrl,
        userId: auth.user?.profile?.sub || 'anonymous'
      };

      const res = await fetch('https://9y9e6wstgh.execute-api.us-east-1.amazonaws.com/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportPayload)
      });

      if (res.ok) {
        const responseData = await res.json();
        setSubmittedId(responseData.report?.id || 'UNKNOWN-ID');
        setStep(6);
      } else {
        console.error('Failed to submit report');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
    } finally {
      setIsSubmitting(false);
    }
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
              onClick={() => {
                // If they have a current location, use it to center map, else default
                if (formData.location?.type === 'current') {
                  setMapCenter({ lat: formData.location.lat, lng: formData.location.lng });
                  setSearchQuery(formData.location.address);
                }
                setFormData({...formData, location: { type: 'manual' }});
              }}
            >
              <div className="option-icon">
                {formData.location?.type === 'manual' ? <CheckCircle size={24} color="#5FBD5F" /> : <Search size={24} />}
              </div>
              <span>Enter location manually</span>
            </button>

            {formData.location?.type === 'manual' && (
              <div className="manual-location-container">
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Search size={20} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search for a place or address"
                    value={isMapGeocoding ? 'Fetching address...' : searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    disabled={isMapGeocoding}
                  />
                  {searchResults.length > 0 && (
                    <ul className="search-results-dropdown">
                      {searchResults.map(result => (
                        <li key={result.place_id} onClick={() => selectSearchResult(result)}>
                          {result.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div style={{ position: 'relative', height: '240px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                  <MapContainer 
                    center={[mapCenter.lat, mapCenter.lng]} 
                    zoom={15} 
                    style={{ height: '100%', width: '100%', zIndex: 1 }}
                    zoomControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapController center={mapCenter} />
                    <MapEvents onMoveEnd={handleMapMoveEnd} />
                  </MapContainer>
                  
                  {/* Fixed Center Pin - Pinned on top of map UI */}
                  <div style={{ 
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)', 
                    zIndex: 2, pointerEvents: 'none' 
                  }}>
                    <MapPin size={36} color="#EF4444" fill="#EF4444" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Photo */}
        {step === 2 && (
          <div className="step-wrapper">
            <h2 className="step-title">Add a photo</h2>
            <p className="step-subtitle">Photo helps verify the report.</p>
            
            {!photoPreview ? (
              <div className="photo-actions">
                <label className="take-photo-btn" style={{ cursor: 'pointer' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    style={{ display: 'none' }} 
                    onChange={handlePhotoUpload}
                  />
                  <Camera size={48} color="#5FBD5F" />
                  <span>Take a photo</span>
                </label>
                
                <label className="gallery-btn" style={{ cursor: 'pointer' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handlePhotoUpload}
                  />
                  <ImageIcon size={20} />
                  <span>Choose from gallery</span>
                </label>
              </div>
            ) : (
              <div className="photo-preview-container">
                <img src={photoPreview} alt="Waste preview" className="photo-preview-img" />
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <label className="btn secondary-btn" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      style={{ display: 'none' }} 
                      onChange={handlePhotoUpload}
                    />
                    <Camera size={18} />
                    Retake
                  </label>
                  
                  <label className="btn secondary-btn" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handlePhotoUpload}
                    />
                    <ImageIcon size={18} />
                    Gallery
                  </label>
                </div>
                
                <button 
                  className="btn danger-btn" 
                  style={{ width: '100%', marginTop: '12px' }}
                  onClick={() => {
                    setPhotoPreview(null);
                    setFormData(prev => ({ ...prev, photo: null }));
                  }}
                >
                  Remove Photo
                </button>
              </div>
            )}
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
            <p className="ticket-id">#{submittedId}</p>

            <div style={{ marginTop: '8px', marginBottom: '16px' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#FFF',
                backgroundColor: calculateCriticality(formData) === 'high' ? '#EF4444' : calculateCriticality(formData) === 'medium' ? '#F59E0B' : '#5FBD5F'
              }}>
                {calculateCriticality(formData) === 'high' ? 'High Severity' : calculateCriticality(formData) === 'medium' ? 'Moderate Severity' : 'Low Severity'}
              </span>
            </div>
            
            <div className="location-summary">
              <MapPin size={20} color="#64748B" style={{ flexShrink: 0 }} />
              <span style={{ textAlign: 'center', wordBreak: 'break-word', padding: '0 8px' }}>
                {formData.location?.address || 'Location saved'}
              </span>
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
                <span>Resolved</span>
              </div>
            </div>
            
            <button className="btn primary-btn block-btn" onClick={() => navigate('/map')}>View on Map</button>
            <button className="btn secondary-btn block-btn mt-3" onClick={() => navigate('/')}>Done</button>
          </div>
        )}
      </main>

      {/* Footer Navigation (Next Button) */}
      {step < 6 && (
        <footer className="report-footer">
          <button 
            className="btn block-btn primary-btn"
            onClick={step === 5 ? submitReport : handleNext}
            disabled={
              (step === 1 && !formData.location) ||
              (step === 2 && !photoPreview) ||
              (step === 3 && (!formData.type || !formData.amount)) ||
              isSubmitting
            }
          >
            {step === 5 ? (isSubmitting ? 'Submitting...' : 'Submit Report') : 
             step === 2 && !photoPreview ? 'Photo Required' : 
             'Continue'}
          </button>
        </footer>
      )}
    </div>
  );
};

export default ReportWaste;
