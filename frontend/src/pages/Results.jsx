import { useState, useEffect } from 'react';
import { Database, Clock, CheckCircle, Trophy, BarChart3, Users, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Results() {
  const [results, setResults] = useState({});
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({ totalVotes: 0, totalRegistered: 0, turnoutPercentage: 0 });
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch candidates
    fetch(`${API_BASE_URL}/candidates`)
      .then(res => res.json())
      .then(data => {
        setCandidates(data.candidates || []);
        setLoading(false);
      })
      .catch(err => console.error(err));

    // Fetch election settings
    fetch(`${API_BASE_URL}/election`)
      .then(res => res.json())
      .then(data => setElection(data))
      .catch(err => console.error(err));
      
    // Fetch results
    const fetchStats = () => {
      fetch(`${API_BASE_URL}/results`)

        .then(res => res.json())
        .then(data => {
          setResults(data.results || {});
          setStats({
            totalVotes: data.total_votes || 0,
            totalRegistered: data.total_registered || 0,
            turnoutPercentage: data.turnout_percentage || 0
          });
        })
        .catch(err => console.error(err));
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const getLeaderId = () => {
    let maxVotes = -1;
    let leaderId = null;
    Object.entries(results).forEach(([cid, votes]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        leaderId = cid;
      }
    });
    return maxVotes > 0 ? leaderId : null;
  };
  
  const leaderId = getLeaderId();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Live Election Standings</h2>
        <p style={{ color: 'var(--text-muted)' }}>Real-time aggregated and verified voter turnout and tallies</p>
      </div>

      {/* Election Summary Panel */}
      {election && (
        <div className="glass-panel" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          padding: '1.5rem',
          border: '1px solid var(--glass-border)',
          background: 'rgba(255, 255, 255, 0.01)'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Election Title</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>{election.title}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Status</span>
            <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: election.is_voting_open ? 'var(--secondary)' : (election.effective_status === 'scheduled' ? 'var(--primary)' : 'var(--accent)'),
                boxShadow: election.is_voting_open ? '0 0 10px var(--secondary)' : (election.effective_status === 'scheduled' ? '0 0 10px var(--primary)' : '0 0 10px var(--accent)')
              }} />
              <span style={{ fontWeight: 600, color: election.is_voting_open ? 'var(--secondary)' : (election.effective_status === 'scheduled' ? 'var(--primary)' : 'var(--accent)') }}>
                {(election.effective_status || (election.is_active ? 'ACTIVE' : 'INACTIVE')).toUpperCase()}
              </span>
            </div>
            {election.status_reason && !election.is_voting_open && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: '1.2' }}>{election.status_reason}</div>
            )}
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Scheduled Period</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '0.25rem' }}>
              {election.start_date ? new Date(election.start_date).toLocaleDateString() : 'Immediate'} 
              {' to '} 
              {election.end_date ? new Date(election.end_date).toLocaleDateString() : 'Ongoing'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Decentralized Auditing</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)' }}>
              <Database size={16} />
              <span>Blockchain Verified Ledger</span>
            </div>
          </div>
        </div>
      )}

      {/* Turnout Statistics Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
            <Users size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Registered Voters</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.totalRegistered}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)' }}>
            <CheckCircle size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Votes Cast</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.totalVotes}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)' }}>
            <BarChart3 size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Voter Turnout</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.turnoutPercentage}%</div>
          </div>
        </div>
      </div>
      
      {/* Current Standings */}
      <div className="glass-panel" style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))' }}>
        <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle className="text-gradient" /> Current Ballot Standings
        </h3>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No candidates registered in this election yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {candidates.map(c => {
              const votes = results[c.id] || 0;
              const percentage = stats.totalVotes === 0 ? 0 : Math.round((votes / stats.totalVotes) * 100);
              const isLeader = leaderId === c.id;
              const initials = c.name.split(' ').map(n => n[0]).join('');

              return (
                <div key={c.id} style={{ 
                  background: isLeader ? 'rgba(250, 204, 21, 0.03)' : 'rgba(255, 255, 255, 0.02)',
                  border: isLeader ? '1px solid rgba(250, 204, 21, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}>
                  {isLeader && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '1rem', 
                      right: '1.5rem', 
                      background: 'linear-gradient(135deg, #fef08a 0%, #eab308 100%)', 
                      color: '#000', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)'
                    }}>
                      <Trophy size={14} /> Current Leader
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '12px', 
                      background: isLeader ? 'linear-gradient(135deg, #fef08a, #eab308)' : 'linear-gradient(135deg, var(--primary), #c084fc)',
                      color: isLeader ? '#000' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.1rem'
                    }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.party}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right', paddingRight: isLeader ? '6.5rem' : '0' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{votes}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{percentage}% of votes</div>
                    </div>
                  </div>

                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${percentage}%`, 
                      background: isLeader ? 'linear-gradient(90deg, #eab308, #ca8a04)' : 'linear-gradient(90deg, var(--primary), #c084fc)',
                      transition: 'width 1s ease-in-out',
                      borderRadius: '100px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
