import { useState } from 'react';
import WebcamCapture from '../components/WebcamCapture';
import { Fingerprint, CheckCircle, Camera, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';


export default function Register() {
  const [voterId, setVoterId] = useState('');
  const [aadharId, setAadharId] = useState('');
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error'|'loading', message: '' }
  const [isRegistered, setIsRegistered] = useState(false);
  
  const [errors, setErrors] = useState({ voterId: '', aadharId: '', name: '' });
  
  const navigate = useNavigate();

  // Validations
  const validateVoterId = (val) => {
    if (!val) return 'Voter ID is required.';
    if (!/^[a-zA-Z0-9]{10}$/.test(val)) return 'Voter ID must be a 10-character alphanumeric code.';
    return '';
  };

  const validateAadharId = (val) => {
    if (!val) return 'Aadhar Card number is required.';
    if (!/^\d{12}$/.test(val)) return 'Aadhar Card must be exactly 12 digits.';
    return '';
  };

  const validateName = (val) => {
    if (!val) return 'Full Name is required.';
    if (val.trim().length < 3) return 'Name must be at least 3 characters.';
    if (!/^[a-zA-Z\s]+$/.test(val)) return 'Name must contain only letters and spaces.';
    return '';
  };

  const handleVoterIdChange = (e) => {
    const val = e.target.value;
    setVoterId(val);
    setErrors(prev => ({ ...prev, voterId: validateVoterId(val) }));
  };

  const handleAadharIdChange = (e) => {
    const val = e.target.value;
    setAadharId(val);
    setErrors(prev => ({ ...prev, aadharId: validateAadharId(val) }));
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setErrors(prev => ({ ...prev, name: validateName(val) }));
  };

  const registerUser = async (currentImage) => {
    const vErr = validateVoterId(voterId);
    const aErr = validateAadharId(aadharId);
    const nErr = validateName(name);

    if (vErr || aErr || nErr || !currentImage) {
      setErrors({ voterId: vErr, aadharId: aErr, name: nErr });
      setStatus({ type: 'error', message: 'Please correct validation errors and capture a face photo.' });
      return;
    }
    
    setStatus({ type: 'loading', message: 'Registering biometric credentials... Please wait.' });
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          voter_id: voterId, 
          aadhar_id: aadharId,
          name: name.trim(), 
          image: currentImage 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: 'Registration successful! Redirecting...' });
        setIsRegistered(true);
      } else {
        setStatus({ type: 'error', message: data.detail || 'An error occurred during registration.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to connect to backend server. Please make sure the backend is running.' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    registerUser(image);
  };

  const handleCapture = (imgBase64) => {
    setImage(imgBase64);
    setShowCamera(false);
    
    // Clear image error if captured
    setStatus(null);
  };

  const isFormValid = voterId && aadharId && name && image && !errors.voterId && !errors.aadharId && !errors.name;

  if (isRegistered) {
    return (
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <CheckCircle size={48} color="var(--secondary)" style={{ margin: '0 auto 1.5rem auto' }} />
        <h2 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Registration Complete</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Your biometric data has been securely saved.</p>
        
        {/* Voter ID Card Display */}
        <div style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.9) 100%)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', gap: '2rem', textAlign: 'left', marginBottom: '2rem' }}>
          <div>
            <img src={image} alt="Voter" style={{ width: '120px', height: '160px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--secondary)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Elector's Photo Identity Card</h3>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}><strong>Voter ID:</strong> {voterId}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}><strong>Aadhar:</strong> **** **** {aadharId.slice(-4)}</p>
          </div>
        </div>

        <button onClick={() => navigate('/vote')} className="btn-primary" style={{ padding: '1rem 2rem' }}>
          Go to Voting Booth
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="glass-panel animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <Fingerprint className="text-gradient" size={28} /> Voter Registration
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center' }}>
        Enroll your demographic and biometric data to participate in secure elections.
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Voter ID Number</label>
            <input 
              type="text" 
              value={voterId} 
              onChange={handleVoterIdChange} 
              placeholder="e.g. ABC1234567"
              style={{ borderColor: errors.voterId ? 'var(--accent)' : voterId && !errors.voterId ? 'var(--secondary)' : 'var(--glass-border)' }}
              required
            />
            {errors.voterId && (
              <span style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.voterId}
              </span>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Aadhar Card Number</label>
            <input 
              type="text" 
              value={aadharId} 
              onChange={handleAadharIdChange} 
              placeholder="12-digit Aadhar"
              style={{ borderColor: errors.aadharId ? 'var(--accent)' : aadharId && !errors.aadharId ? 'var(--secondary)' : 'var(--glass-border)' }}
              required
            />
            {errors.aadharId && (
              <span style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.aadharId}
              </span>
            )}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={handleNameChange} 
            placeholder="As per legal documents"
            style={{ borderColor: errors.name ? 'var(--accent)' : name && !errors.name ? 'var(--secondary)' : 'var(--glass-border)' }}
            required
          />
          {errors.name && (
            <span style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
              {errors.name}
            </span>
          )}
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Face Scan</label>
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--glass-border)' }}>
            {image ? (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <img src={image} alt="Captured face" style={{ width: '100%', maxWidth: '200px', borderRadius: '12px', border: '3px solid var(--secondary)', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)' }} />
                <button type="button" onClick={() => setShowCamera(true)} className="btn-secondary">
                  <Camera size={18} /> Retake Photo
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={() => setShowCamera(true)} 
                className="btn-secondary" 
                style={{ width: '100%', padding: '2rem', borderStyle: 'dashed', borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                <Camera size={32} style={{ margin: '0 auto 0.5rem auto' }} />
                Click to Open Face Authenticate Popup
              </button>
            )}
          </div>
        </div>
        
        <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1rem', width: '100%' }} disabled={!isFormValid}>
          Complete Registration
        </button>
        
        {status && status.message && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1.25rem', 
            background: status.type === 'success' 
              ? 'rgba(16, 185, 129, 0.1)' 
              : status.type === 'error' 
              ? 'rgba(244, 63, 94, 0.1)' 
              : 'rgba(99, 102, 241, 0.1)', 
            border: status.type === 'success' 
              ? '1px solid var(--secondary)' 
              : status.type === 'error' 
              ? '1px solid var(--accent)' 
              : '1px solid var(--primary)', 
            color: 'var(--text-main)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            textAlign: 'left'
          }}>
            {status.type === 'loading' && <Loader2 className="animate-spin" size={20} color="var(--primary)" />}
            {status.type === 'success' && <CheckCircle size={20} color="var(--secondary)" />}
            {status.type === 'error' && <AlertCircle size={20} color="var(--accent)" />}
            <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{status.message}</span>
          </div>
        )}
      </form>
    </div>

    {/* Fullscreen Camera Modal */}
    {showCamera && (
      <WebcamCapture 
        onCapture={handleCapture} 
        onClose={() => setShowCamera(false)} 
      />
    )}
    </>
  );
}
