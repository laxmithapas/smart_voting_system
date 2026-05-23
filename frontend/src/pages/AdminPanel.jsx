import { useState, useEffect } from 'react';
import { Settings, Users, Plus, Edit2, Trash2, Check, X, ShieldAlert, Calendar, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AdminPanel() {
  // Election settings state
  const [electionTitle, setElectionTitle] = useState('');
  const [electionActive, setElectionActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsStatus, setSettingsStatus] = useState(null); // { type: 'success'|'error', message: '' }

  // Candidate state
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [newCandName, setNewCandName] = useState('');
  const [newCandParty, setNewCandParty] = useState('');
  const [candidateStatus, setCandidateStatus] = useState(null); // { type: 'success'|'error', message: '' }

  // Editing state for candidates
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editParty, setEditParty] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchElectionSettings();
    fetchCandidates();
  }, []);

  const fetchElectionSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/election`);
      if (res.ok) {
        const data = await res.json();
        setElectionTitle(data.title || '');
        setElectionActive(data.is_active ?? true);
        setStartDate(data.start_date ? data.start_date.slice(0, 16) : '');
        setEndDate(data.end_date ? data.end_date.slice(0, 16) : '');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/candidates?active_only=false`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSettingsStatus({ type: 'loading', message: 'Saving settings...' });
    try {
      const payload = {
        title: electionTitle,
        is_active: electionActive,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null
      };

      const token = sessionStorage.getItem('admin_session') || '';
      const res = await fetch(`${API_BASE_URL}/admin/election`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsStatus({ type: 'success', message: 'Election settings saved successfully!' });
        setTimeout(() => setSettingsStatus(null), 3000);
      } else {
        setSettingsStatus({ type: 'error', message: `Error: ${data.detail || 'Could not save settings'}` });
      }
    } catch {
      setSettingsStatus({ type: 'error', message: 'Connection error to the backend server.' });
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!newCandName.trim() || !newCandParty.trim()) {
      setCandidateStatus({ type: 'error', message: 'Name and Party are required.' });
      return;
    }
    setCandidateStatus({ type: 'loading', message: 'Registering candidate...' });
    try {
      const token = sessionStorage.getItem('admin_session') || '';
      const res = await fetch(`${API_BASE_URL}/admin/candidates`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCandName, party: newCandParty })
      });
      const data = await res.json();
      if (res.ok) {
        setCandidateStatus({ type: 'success', message: `Candidate registered under ID "${data.id}"` });
        setNewCandName('');
        setNewCandParty('');
        fetchCandidates();
        setTimeout(() => setCandidateStatus(null), 3000);
      } else {
        setCandidateStatus({ type: 'error', message: `Error: ${data.detail || 'Could not add candidate'}` });
      }
    } catch {
      setCandidateStatus({ type: 'error', message: 'Connection error to backend.' });
    }
  };

  const startEdit = (cand) => {
    setEditingId(cand.id);
    setEditName(cand.name);
    setEditParty(cand.party);
    setEditActive(cand.is_active);
  };

  const handleSaveEdit = async (id) => {
    try {
      const token = sessionStorage.getItem('admin_session') || '';
      const res = await fetch(`${API_BASE_URL}/admin/candidates/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName, party: editParty, is_active: editActive })
      });
      if (res.ok) {
        setEditingId(null);
        fetchCandidates();
      } else {
        const data = await res.json();
        alert(`Edit failed: ${data.detail || 'Unknown error'}`);
      }
    } catch {
      alert('Error updating candidate details.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Are you sure you want to deactivate this candidate? They will be removed from the ballot options, but their historical votes remain intact.')) return;
    try {
      const token = sessionStorage.getItem('admin_session') || '';
      const res = await fetch(`${API_BASE_URL}/admin/candidates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchCandidates();
      } else {
        const data = await res.json();
        alert(`Deactivation failed: ${data.detail || 'Unknown error'}`);
      }
    } catch {
      alert('Error deactivating candidate.');
    }
  };


  return (
    <div className="admin-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', margin: '1rem 0' }}>
      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Settings className="text-gradient animate-spin" style={{ animationDuration: '6s' }} size={32} />
          <span>Election Administration Board</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Configure election metadata, toggle active phases, and manage candidate registry.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Section 1: Election settings */}
        <div className="glass-panel" style={{ height: '100%' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
            <Settings size={22} color="var(--primary)" /> Election Parameters
          </h2>
          
          {settingsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 className="animate-spin" size={28} color="var(--primary)" />
            </div>
          ) : (
            <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Election Title</label>
                <input 
                  type="text" 
                  value={electionTitle}
                  onChange={(e) => setElectionTitle(e.target.value)}
                  placeholder="e.g. 2026 General Election"
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                <input 
                  type="checkbox" 
                  id="electionActive" 
                  checked={electionActive}
                  onChange={(e) => setElectionActive(e.target.checked)}
                  style={{ width: '22px', height: '22px', accentColor: 'var(--secondary)', cursor: 'pointer' }}
                />
                <label htmlFor="electionActive" style={{ cursor: 'pointer', fontWeight: 600, display: 'flex', flexDirection: 'column' }}>
                  <span>Election Status: {electionActive ? <span style={{ color: 'var(--secondary)' }}>Active</span> : <span style={{ color: 'var(--accent)' }}>Inactive</span>}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>Uncheck to immediately close/block all voting processes.</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                    <Calendar size={14} color="var(--primary)" /> Start Date & Time
                  </label>
                  <input 
                    type="datetime-local" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(2, 6, 23, 0.6)',
                      border: '1px solid var(--glass-border)',
                      color: 'white',
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                    <Calendar size={14} color="var(--accent)" /> End Date & Time
                  </label>
                  <input 
                    type="datetime-local" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(2, 6, 23, 0.6)',
                      border: '1px solid var(--glass-border)',
                      color: 'white',
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '0.85rem', width: '100%', marginTop: '0.5rem' }}>
                Save Settings
              </button>

              {settingsStatus && (
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  background: settingsStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : settingsStatus.type === 'error' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                  border: settingsStatus.type === 'success' ? '1px solid var(--secondary)' : settingsStatus.type === 'error' ? '1px solid var(--accent)' : '1px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {settingsStatus.type === 'loading' && <Loader2 className="animate-spin" size={16} />}
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{settingsStatus.message}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Section 2: Add Candidate form */}
        <div className="glass-panel" style={{ height: '100%' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
            <Users size={22} color="#c084fc" /> Register Candidate
          </h2>
          <form onSubmit={handleAddCandidate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Candidate Name</label>
              <input 
                type="text" 
                value={newCandName}
                onChange={(e) => setNewCandName(e.target.value)}
                placeholder="Full Name"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Political Party</label>
              <input 
                type="text" 
                value={newCandParty}
                onChange={(e) => setNewCandParty(e.target.value)}
                placeholder="Party Name/Affiliation"
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '0.85rem', width: '100%', marginTop: '0.5rem' }}>
              <Plus size={18} /> Add Candidate
            </button>

            {candidateStatus && (
              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: candidateStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : candidateStatus.type === 'error' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                border: candidateStatus.type === 'success' ? '1px solid var(--secondary)' : candidateStatus.type === 'error' ? '1px solid var(--accent)' : '1px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {candidateStatus.type === 'loading' && <Loader2 className="animate-spin" size={16} />}
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{candidateStatus.message}</span>
              </div>
            )}
          </form>
        </div>

      </div>

      {/* Section 3: Candidate Registry Table */}
      <div className="glass-panel" style={{ width: '100%' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
          <Users size={22} color="var(--primary)" /> Candidate Registry
        </h2>

        {candidatesLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 className="animate-spin" size={28} color="var(--primary)" />
          </div>
        ) : candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No candidates registered in the system database yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Ballot ID</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Candidate Name</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Party Affiliation</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Ballot Status</th>
                  <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((cand) => (
                  <tr key={cand.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                      {cand.id}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {editingId === cand.id ? (
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '8px', fontSize: '0.9rem' }}
                        />
                      ) : (
                        <span style={{ fontWeight: 500 }}>{cand.name}</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {editingId === cand.id ? (
                        <input 
                          type="text" 
                          value={editParty}
                          onChange={(e) => setEditParty(e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '8px', fontSize: '0.9rem' }}
                        />
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{cand.party}</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {editingId === cand.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input 
                            type="checkbox" 
                            id={`edit-active-${cand.id}`}
                            checked={editActive}
                            onChange={(e) => setEditActive(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--secondary)' }}
                          />
                          <label htmlFor={`edit-active-${cand.id}`} style={{ fontSize: '0.85rem' }}>Active</label>
                        </div>
                      ) : cand.is_active ? (
                        <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>Active Ballot</span>
                      ) : (
                        <span style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>Deactivated</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {editingId === cand.id ? (
                          <>
                            <button 
                              onClick={() => handleSaveEdit(cand.id)}
                              className="btn-secondary"
                              style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', color: 'var(--secondary)', border: '1px solid var(--secondary)' }}
                            >
                              <Check size={16} /> Save
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="btn-secondary"
                              style={{ padding: '0.4rem 0.75rem', borderRadius: '8px' }}
                            >
                              <X size={16} /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => startEdit(cand)}
                              className="btn-secondary"
                              style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            {cand.is_active && (
                              <button 
                                onClick={() => handleDeactivate(cand.id)}
                                className="btn-secondary"
                                style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', color: 'var(--accent)', border: '1px solid rgba(244, 63, 94, 0.2)' }}
                              >
                                <Trash2 size={14} /> Disable
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
