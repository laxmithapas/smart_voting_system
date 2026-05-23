import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Fingerprint, BarChart3, Settings, Database } from 'lucide-react';
import { API_BASE_URL } from '../config';
import './Home.css';

export default function Home() {
  const [election, setElection] = useState({
    title: 'Smart Voting System',
    is_active: true,
    start_date: null,
    end_date: null
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/election`)

      .then(res => res.json())
      .then(data => setElection(data))
      .catch(err => console.error("Error loading election settings:", err));
  }, []);

  const getStatusDisplay = () => {
    if (!election.is_active) {
      return { label: 'Voting Closed (Election Inactive)', color: 'var(--accent)' };
    }
    const now = new Date();
    if (election.start_date) {
      const start = new Date(election.start_date);
      if (now < start) {
        return { label: `Scheduled: Starts ${start.toLocaleString()}`, color: 'var(--primary)' };
      }
    }
    if (election.end_date) {
      const end = new Date(election.end_date);
      if (now > end) {
        return { label: 'Voting Closed (Ended)', color: 'var(--accent)' };
      }
    }
    return { label: 'Election Active', color: 'var(--secondary)' };
  };

  const status = getStatusDisplay();
  const isVotingOpen = status.label === 'Election Active';

  return (
    <div className="home-container animate-fade-in" style={{ gap: '2.5rem' }}>
      <div className="hero-section" style={{ padding: '2.5rem 1rem' }}>
        
        {/* Dynamic Status Badge */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.6rem', 
          background: 'rgba(15, 23, 42, 0.6)', 
          border: '1px solid var(--glass-border)', 
          padding: '0.6rem 1.2rem', 
          borderRadius: '30px', 
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <span className={isVotingOpen ? "animate-pulse" : ""} style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            backgroundColor: status.color, 
            display: 'inline-block' 
          }}></span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.03em' }}>{status.label}</span>
        </div>

        <h1 className="hero-title" style={{ fontSize: '3rem', lineHeight: '1.2', marginBottom: '1rem' }}>
          Welcome to <span className="text-gradient">{election.title}</span>
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.15rem', marginBottom: '1.5rem', maxWidth: '650px', margin: '0 auto 2rem auto' }}>
          Experience a secure, decentralized election platform powered by Blockchain cryptography and Biometric Face Authentication. Select a portal below to begin.
        </p>
      </div>

      <div className="features-grid">
        {/* Card 1: Voter Portal */}
        <div className="feature-card glass-panel" style={{ height: '100%', justifyContent: 'space-between', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="feature-icon" style={{ boxShadow: '0 0 20px rgba(192, 132, 252, 0.15)' }}><Fingerprint size={32} color="#c084fc" /></div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Voter Portal</h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              Enroll your biometric credentials, check your registration, authenticate, and securely cast your vote in the voting booth.
            </p>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
            <Link to="/register" className="btn-secondary" style={{ width: '100%', textAlign: 'center', padding: '0.75rem' }}>
              Enroll Biometrics
            </Link>
            <Link 
              to="/vote" 
              className={isVotingOpen ? "btn-primary" : "btn-primary disabled-link"} 
              style={{ 
                width: '100%', 
                textAlign: 'center', 
                padding: '0.75rem', 
                opacity: isVotingOpen ? 1 : 0.5,
                pointerEvents: isVotingOpen ? 'auto' : 'none',
                background: isVotingOpen ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'rgba(255,255,255,0.05)',
                color: isVotingOpen ? 'white' : 'var(--text-muted)',
                borderColor: isVotingOpen ? 'transparent' : 'var(--glass-border)'
              }}
            >
              {isVotingOpen ? "Enter Voting Booth" : "Voting Booth (Closed)"}
            </Link>
            <Link to="/voter-status" className="btn-secondary" style={{ width: '100%', textAlign: 'center', padding: '0.75rem', border: 'none', background: 'transparent', color: 'var(--primary)' }}>
              Verify Registration & Receipt
            </Link>
          </div>
        </div>

        {/* Card 2: Public Standings */}
        <div className="feature-card glass-panel" style={{ height: '100%', justifyContent: 'space-between', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="feature-icon" style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)' }}><BarChart3 size={32} color="#60a5fa" /></div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Results & Ledger</h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              Inspect active election standings, view turnout analytics, and audit transaction records on the public decentralized blockchain ledger.
            </p>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
            <Link to="/results" className="btn-primary" style={{ width: '100%', textAlign: 'center', padding: '0.75rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              View Live Standings
            </Link>
            <Link to="/ledger" className="btn-secondary" style={{ width: '100%', textAlign: 'center', padding: '0.75rem' }}>
              Explore Blockchain Ledger
            </Link>
          </div>
        </div>

        {/* Card 3: Admin Console */}
        <div className="feature-card glass-panel" style={{ height: '100%', justifyContent: 'space-between', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="feature-icon" style={{ boxShadow: '0 0 20px rgba(245, 158, 11, 0.15)' }}><Settings size={32} color="#fbbf24" /></div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Admin Console</h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              Authorized management board to configure start/end times, manage candidates registry, and perform secure cryptographic audit tracing.
            </p>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
            <Link to="/admin" className="btn-primary" style={{ width: '100%', textAlign: 'center', padding: '0.75rem', background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
              Login to Admin Console
            </Link>
            <div style={{ height: '42px' }}></div> {/* Spacer to align buttons perfectly across cards */}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulseDot {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .animate-pulse {
          animation: pulseDot 2s infinite;
        }
      `}</style>
    </div>
  );
}
