import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import WebcamCapture from '../components/WebcamCapture';
import { ShieldCheck, Vote, LogOut, Camera, Loader2, AlertCircle, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';


export default function VotingBooth() {
  const [voterId, setVoterId] = useState('');
  const [aadharId, setAadharId] = useState('');
  const [image, setImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  
  const [authStatus, setAuthStatus] = useState(null); // { type: 'loading'|'error', message: '' }
  const [sessionData, setSessionData] = useState(null); // Holds voter data after auth
  
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [voteStatus, setVoteStatus] = useState(null); // { type: 'loading'|'success'|'error', message: '' }
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [errors, setErrors] = useState({ voterId: '', aadharId: '' });
  const [electionSettings, setElectionSettings] = useState(null);
  const [electionLoading, setElectionLoading] = useState(true);
  
  const [voterStatus, setVoterStatus] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch election settings
    fetch(`${API_BASE_URL}/election`)
      .then(res => res.json())
      .then(data => {
        setElectionSettings(data);
        setElectionLoading(false);
      })
      .catch(err => {
        console.error("Error fetching election settings:", err);
        setElectionLoading(false);
      });

    // Fetch active candidates only
    fetch(`${API_BASE_URL}/candidates?active_only=true`)
      .then(res => res.json())
      .then(data => setCandidates(data.candidates || []))
      .catch(err => console.error("Error fetching candidates:", err));
  }, []);

  // Removing auto-fetch voter status useEffect on ID change for privacy and security.
  // Voter status check is now deferred until authentication form submission.

  const renderProgressPipeline = () => {
    const isRegistered = voterStatus?.registered === true;
    const isNotRegistered = voterStatus?.registered === false;
    const isVerified = !!sessionData;
    const isVoted = sessionData?.hasVoted || !!receiptData || voterStatus?.has_voted;

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        padding: '1rem',
        marginBottom: '2rem',
        border: '1px solid var(--glass-border)',
        position: 'relative'
      }}>
        {/* Step 1: Registered */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 2 }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isRegistered ? 'var(--secondary)' : isNotRegistered ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
            color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.3s'
          }}>
            {isRegistered ? '✓' : isNotRegistered ? '✗' : '1'}
          </div>
          <span style={{ fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 600, color: isRegistered ? 'var(--secondary)' : isNotRegistered ? 'var(--accent)' : 'var(--text-muted)' }}>
            {isRegistered ? 'Registered' : isNotRegistered ? 'Not Registered' : '1. Check ID'}
          </span>
        </div>

        <div style={{ height: '2px', background: isRegistered ? 'var(--secondary)' : 'rgba(255,255,255,0.1)', flex: 1, margin: '0 -10px 15px -10px', zIndex: 1 }}></div>

        {/* Step 2: Face Verified */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 2 }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isVerified ? 'var(--secondary)' : 'rgba(255,255,255,0.1)',
            color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.3s'
          }}>
            {isVerified ? '✓' : '2'}
          </div>
          <span style={{ fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 600, color: isVerified ? 'var(--secondary)' : 'var(--text-muted)' }}>
            2. Face Verify
          </span>
        </div>

        <div style={{ height: '2px', background: isVerified ? 'var(--secondary)' : 'rgba(255,255,255,0.1)', flex: 1, margin: '0 -10px 15px -10px', zIndex: 1 }}></div>

        {/* Step 3: Ballot Cast */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 2 }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isVoted ? 'var(--secondary)' : voterStatus?.has_voted ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
            color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.3s'
          }}>
            {isVoted ? '✓' : '3'}
          </div>
          <span style={{ fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 600, color: isVoted ? 'var(--secondary)' : voterStatus?.has_voted ? 'var(--accent)' : 'var(--text-muted)' }}>
            {isVoted ? 'Ballot Cast' : voterStatus?.has_voted ? 'Already Voted' : '3. Cast Vote'}
          </span>
        </div>
      </div>
    );
  };

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

  const handleVoterIdChange = (e) => {
    const val = e.target.value;
    setVoterId(val);
    setErrors(prev => ({ ...prev, voterId: validateVoterId(val) }));
    setVoterStatus(null);
    setAuthStatus(null);
  };

  const handleAadharIdChange = (e) => {
    const val = e.target.value;
    setAadharId(val);
    setErrors(prev => ({ ...prev, aadharId: validateAadharId(val) }));
    setVoterStatus(null);
    setAuthStatus(null);
  };

  const authenticateUser = async (currentImage) => {
    const vErr = validateVoterId(voterId);
    const aErr = validateAadharId(aadharId);

    if (vErr || aErr || !currentImage) {
      setErrors({ voterId: vErr, aadharId: aErr });
      setAuthStatus({ type: 'error', message: "Please provide valid Voter ID, Aadhar Number, and Face Scan" });
      return;
    }
    
    setAuthStatus({ type: 'loading', message: "Authenticating ID and Face Data..." });
    try {
      const res = await fetch(`${API_BASE_URL}/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_id: voterId, aadhar_id: aadharId, image: currentImage })
      });
      const data = await res.json();
      
      if (res.ok && data.authenticated) {
        if (data.has_voted) {
          setAuthStatus({ type: 'error', message: "Error: You have already cast your vote!" });
          setVoterStatus({ registered: true, has_voted: true });
        } else {
          setSessionData({
            voterId,
            voterName: data.voter_name,
            hasVoted: data.has_voted,
            faceImage: currentImage
          });
          setVoterStatus({ registered: true, has_voted: false });
          setAuthStatus(null);
        }
      } else {
        setAuthStatus({ type: 'error', message: `Authentication Failed: ${data.detail || "Credentials did not match"}` });
        if (res.status === 404) {
          setVoterStatus({ registered: false, has_voted: false });
        } else {
          setVoterStatus(null);
        }
      }
    } catch {
      setAuthStatus({ type: 'error', message: "Error connecting to auth server. Is the backend running?" });
      setVoterStatus(null);
    }
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    authenticateUser(image);
  };

  const handleVoteSubmit = (e) => {
    e.preventDefault();
    if (!selectedCandidate || !sessionData) return;
    setShowConfirmModal(true);
  };

  const confirmAndCastVote = async () => {
    setShowConfirmModal(false);
    setVoteStatus({ type: 'loading', message: "Casting encrypted vote to blockchain..." });
    try {
      const res = await fetch(`${API_BASE_URL}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_id: sessionData.voterId, candidate_id: selectedCandidate })
      });
      const data = await res.json();
      if (res.ok) {
        setVoteStatus({ type: 'success', message: "Vote Successfully Cast & Recorded on Blockchain!" });
        setReceiptData(data);
        const updatedSession = { ...sessionData, hasVoted: true };
        setSessionData(updatedSession);
      } else {
        setVoteStatus({ type: 'error', message: `Failed to cast vote: ${data.detail}` });
      }
    } catch {
      setVoteStatus({ type: 'error', message: "Error connecting to server. Is the backend running?" });
    }
  };

  const handleLogoutVoter = () => {
    setSessionData(null);
    setVoterId(''); setAadharId(''); setImage(null);
    setAuthStatus(null);
    setVoterStatus(null);
    setReceiptData(null);
    setErrors({ voterId: '', aadharId: '' });
  };

  const handleCapture = (imgBase64) => {
    setImage(imgBase64);
    setShowCamera(false);
    setAuthStatus(null);
  };

  const getElectionValidationError = () => {
    if (!electionSettings) return null;
    if (!electionSettings.is_voting_open) {
      return electionSettings.status_reason || "Voting is currently closed.";
    }
    return null;
  };

  const validationError = getElectionValidationError();

  if (electionLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Checking election status...</p>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', border: '1px solid var(--accent)' }}>
        <ShieldAlert size={48} color="var(--accent)" style={{ margin: '0 auto 1.5rem auto' }} />
        <h2 style={{ marginBottom: '1rem' }}>Voting Booth Closed</h2>
        <p style={{ color: 'var(--text-main)', background: 'rgba(244, 63, 94, 0.08)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '1rem', fontWeight: 500 }}>
          {validationError}
        </p>
        <p style={{ color: 'var(--text-muted)', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Please contact the election administration board if you believe this is an error.
        </p>
        <div style={{ marginTop: '2rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/home')}>
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (receiptData) {
    return (
      <div className="glass-panel animate-fade-in printable-receipt" style={{ maxWidth: '600px', margin: '2rem auto', border: '1px solid var(--secondary)', position: 'relative' }}>
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-receipt, .printable-receipt * {
              visibility: visible;
            }
            .printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              color: #000 !important;
              background: #fff !important;
              box-shadow: none !important;
              border: 1px solid #000 !important;
              padding: 2rem !important;
            }
            .no-print {
              display: none !important;
            }
            .text-gradient {
              background: none !important;
              -webkit-text-fill-color: initial !important;
              color: #000 !important;
            }
          }
        `}</style>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto'
          }}>
            <ShieldCheck size={40} />
          </div>
          <h2 style={{ margin: 0 }} className="text-gradient">Official Ballot Receipt</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Decentralized & Cryptographically Secured</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)', marginBottom: '2rem' }} className="receipt-details">
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Voter ID (Masked)</span>
            <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{voterId.substring(0, 3)}****{voterId.substring(7)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Block Number</span>
            <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>#{receiptData.block_index}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Block Hash</span>
            <span style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--text-main)' }}>{receiptData.block_hash}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Transaction Hash (Reference)</span>
            <span style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--primary)' }}>{receiptData.tx_hash}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Timestamp</span>
            <span style={{ fontWeight: 600 }}>{new Date(receiptData.timestamp).toLocaleString()}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="no-print">
          <div className="grid-responsive-2col" style={{ gap: '1rem' }}>
            <button className="btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              Print Receipt
            </button>
            <button className="btn-secondary" onClick={() => {
              const text = `OFFICIAL BALLOT RECEIPT\n\nVoter ID: ${voterId.substring(0, 3)}****${voterId.substring(7)}\nBlock Number: #${receiptData.block_index}\nBlock Hash: ${receiptData.block_hash}\nTransaction Hash: ${receiptData.tx_hash}\nTimestamp: ${new Date(receiptData.timestamp).toLocaleString()}\nStatus: Verified on Blockchain\n`;
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ballot-receipt-${receiptData.block_index}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              Download TXT
            </button>
          </div>
          
          <button className="btn-primary" onClick={() => {
            setReceiptData(null);
            setSessionData(null);
            setVoterId('');
            setAadharId('');
            setImage(null);
            setSelectedCandidate('');
            setVoterStatus(null);
            navigate('/results');
          }} style={{ width: '100%', padding: '1rem' }}>
            Done & View Results
          </button>
        </div>
      </div>
    );
  }

  if (sessionData) {
    return (
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Welcome, {sessionData.voterName}
          </h2>
          <button className="btn-secondary" onClick={handleLogoutVoter} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Exit Booth
          </button>
        </div>

        {renderProgressPipeline()}

        <div className="booth-layout" style={{ gap: '2rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-muted)' }}>Voter Profile</h3>
            {sessionData.faceImage ? (
              <img src={sessionData.faceImage} alt="Voter face" style={{ width: '100%', maxWidth: '200px', borderRadius: '12px', border: '2px solid var(--secondary)', marginBottom: '1rem' }} />
            ) : (
              <div style={{ width: '100%', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '1rem' }}></div>
            )}
            <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
              <strong>ID:</strong> {sessionData.voterId}
              <br />
              <strong>Status:</strong> {sessionData.hasVoted ? (
                <span style={{ color: 'var(--accent)' }}>Voted ✓</span>
              ) : (
                <span style={{ color: 'var(--secondary)' }}>Eligible</span>
              )}
            </div>
          </div>

          <div>
            {sessionData.hasVoted ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--secondary)', borderRadius: '16px' }}>
                <ShieldCheck size={48} color="var(--secondary)" style={{ margin: '0 auto 1rem auto' }} />
                <h3>You have already cast your vote!</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Your vote is securely recorded on the blockchain.</p>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                  <ShieldCheck size={20} /> Authentication active. You may now cast your secure vote.
                </p>
                <form onSubmit={handleVoteSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {candidates.map(c => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', cursor: 'pointer', border: selectedCandidate === c.id ? '2px solid var(--primary)' : '2px solid transparent', transition: 'all 0.2s' }}>
                        <input 
                          type="radio" 
                          name="candidate" 
                          value={c.id} 
                          onChange={(e) => setSelectedCandidate(e.target.value)}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{c.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{c.party}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={!selectedCandidate}>
                    Submit Secure Vote <Vote size={20} />
                  </button>
                  {voteStatus && voteStatus.message && (
                    <div style={{ 
                      marginTop: '1.5rem', 
                      padding: '1.25rem', 
                      background: voteStatus.type === 'success' 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : voteStatus.type === 'error' 
                        ? 'rgba(244, 63, 94, 0.1)' 
                        : 'rgba(99, 102, 241, 0.1)', 
                      border: voteStatus.type === 'success' 
                        ? '1px solid var(--secondary)' 
                        : voteStatus.type === 'error' 
                        ? '1px solid var(--accent)' 
                        : '1px solid var(--primary)', 
                      color: 'var(--text-main)', 
                      borderRadius: '16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      textAlign: 'left'
                    }}>
                      {voteStatus.type === 'loading' && <Loader2 className="animate-spin" size={20} color="var(--primary)" />}
                      {voteStatus.type === 'success' && <CheckCircle size={20} color="var(--secondary)" />}
                      {voteStatus.type === 'error' && <AlertCircle size={20} color="var(--accent)" />}
                      <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{voteStatus.message}</span>
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </div>

        {/* Vote confirmation Modal */}
        {showConfirmModal && createPortal(
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            backgroundColor: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
            padding: '1rem', overflowY: 'auto'
          }}>
            <div className="glass-panel animate-fade-in" style={{ 
              width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', 
              gap: '1.5rem', textAlign: 'center', position: 'relative', margin: 'auto' 
            }}>
              <h3 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Vote size={24} className="text-gradient" /> Confirm Your Ballot
              </h3>
              
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                You are about to cast your vote. This action is **final** and will be recorded permanently on the decentralized blockchain.
              </p>

              <div style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '16px', 
                padding: '1.5rem', 
                border: '1px solid var(--glass-border)',
                textAlign: 'left' 
              }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Selected Candidate</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{candidates.find(c => c.id === selectedCandidate)?.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{candidates.find(c => c.id === selectedCandidate)?.party}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={confirmAndCastVote}>
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <>
    <div className="glass-panel animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <ShieldCheck className="text-gradient" size={28} /> Secure Voting Booth
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center' }}>
        Please verify your Voter ID, Aadhar, and provide a Live Face Scan to access your ballot.
      </p>

      {renderProgressPipeline()}
      
      <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="grid-responsive-2col" style={{ gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Voter ID Number</label>
            <input 
              type="text" 
              value={voterId} 
              onChange={handleVoterIdChange} 
              placeholder="Your Voter ID"
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Aadhar Number</label>
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
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Live Face Authentication</label>
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--glass-border)' }}>
            {image ? (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <img src={image} alt="Auth face" style={{ width: '100%', maxWidth: '200px', borderRadius: '12px', border: '3px solid var(--secondary)', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)' }} />
                <button type="button" onClick={() => setShowCamera(true)} className="btn-secondary">
                  <Camera size={18} /> Retake Scan
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
        
        <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1rem', width: '100%' }} disabled={!voterId || !aadharId || !image || errors.voterId || errors.aadharId}>
          Authenticate Identity
        </button>
        
        {authStatus && authStatus.message && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1.25rem', 
            background: authStatus.type === 'loading' 
              ? 'rgba(99, 102, 241, 0.1)' 
              : 'rgba(244, 63, 94, 0.1)', 
            border: authStatus.type === 'loading' 
              ? '1px solid var(--primary)' 
              : '1px solid var(--accent)', 
            color: 'var(--text-main)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            textAlign: 'left'
          }}>
            {authStatus.type === 'loading' && <Loader2 className="animate-spin" size={20} color="var(--primary)" />}
            {authStatus.type === 'error' && <AlertCircle size={20} color="var(--accent)" />}
            <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{authStatus.message}</span>
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
