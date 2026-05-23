import { useState, useEffect } from 'react';
import { Users, CheckCircle, Database, ShieldAlert, Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AdminAudit() {
  const [voters, setVoters] = useState([]);
  const [votersLoading, setVotersLoading] = useState(true);
  const [votersError, setVotersError] = useState(null);
  
  const [auditSummary, setAuditSummary] = useState(null);
  const [auditLoading, setAuditLoading] = useState(true);

  useEffect(() => {
    fetchVoters();
    fetchAuditSummary();
  }, []);

  const fetchVoters = async () => {
    setVotersLoading(true);
    setVotersError(null);
    try {
      const token = sessionStorage.getItem('admin_session') || '';
      const res = await fetch(`${API_BASE_URL}/admin/voters`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setVoters(data.voters || []);
      } else {
        const data = await res.json();
        setVotersError(data.detail || 'Could not fetch registered voters.');
      }
    } catch {
      setVotersError('Connection error to database server.');
    } finally {
      setVotersLoading(false);
    }
  };

  const fetchAuditSummary = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/audit/summary`);

      if (res.ok) {
        const data = await res.json();
        setAuditSummary(data);
      }
    } catch (err) {
      console.error('Error fetching audit log:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const totalRegistered = voters.length;
  const totalVotesCast = voters.filter(v => v.has_voted).length;
  const turnoutPercentage = totalRegistered === 0 ? 0 : Math.round((totalVotesCast / totalRegistered) * 10000) / 100;

  return (
    <div className="admin-audit-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', margin: '1rem 0' }}>
      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert className="text-gradient" size={32} />
          <span>Voter Registry & Audit Board</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Securely audit registered electors and mathematically verify blockchain transactions.
        </p>
      </div>

      {/* Audit Stats Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
            <Users size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Enrolled Voters</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalRegistered}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)' }}>
            <CheckCircle size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Ballots Cast</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalVotesCast}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)' }}>
            <BarChart3 size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Voter Turnout</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{turnoutPercentage}%</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(250, 204, 21, 0.1)', color: '#fbbf24' }}>
            <Database size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Ledger Status</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', color: auditSummary?.is_chain_valid ? 'var(--secondary)' : 'var(--accent)' }}>
              {auditLoading ? 'Checking...' : auditSummary?.is_chain_valid ? 'Ledger Intact ✓' : 'Ledger Invalidation ⚠️'}
            </div>
          </div>
        </div>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Section: Voters Table */}
        <div className="glass-panel" style={{ height: '100%' }}>
          <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
            <Users size={20} color="var(--primary)" /> Enrolled Electors
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.82rem', lineHeight: '1.4' }}>
            List of electors who have registered in the database. Out of privacy compliance, candidate selections are excluded.
          </p>

          {votersLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 className="animate-spin" size={24} color="var(--primary)" />
            </div>
          ) : votersError ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', padding: '1rem' }}>
              <AlertCircle size={20} />
              <span>{votersError}</span>
            </div>
          ) : voters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No voters registered in the system database yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem', fontWeight: 600 }}>Voter ID</th>
                    <th style={{ padding: '0.75rem', fontWeight: 600 }}>Full Name</th>
                    <th style={{ padding: '0.75rem', fontWeight: 600, textAlign: 'right' }}>Voted Status</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((voter) => (
                    <tr key={voter.voter_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>{voter.voter_id}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 500 }}>{voter.name}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {voter.has_voted ? (
                          <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Voted</span>
                        ) : (
                          <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Section: Blockchain Cryptographic Transactions */}
        <div className="glass-panel" style={{ height: '100%' }}>
          <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
            <Database size={20} color="var(--secondary)" /> Cryptographic Audit Ledger
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.82rem', lineHeight: '1.4' }}>
            Decentralized transaction blocks stored on the blockchain. Voter ID is anonymized as a secure SHA-256 hash.
          </p>

          {auditLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 className="animate-spin" size={24} color="var(--primary)" />
            </div>
          ) : !auditSummary || !auditSummary.voted_records || auditSummary.voted_records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No transactions mined in the blockchain ledger yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem', fontWeight: 600 }}>Block</th>
                    <th style={{ padding: '0.75rem', fontWeight: 600 }}>Voter ID Hash</th>
                    <th style={{ padding: '0.75rem', fontWeight: 600, textAlign: 'right' }}>Tx Receipt Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {auditSummary.voted_records.map((record, index) => {
                    const shortVoterHash = record.voter_id_hash.substring(0, 6) + '...' + record.voter_id_hash.substring(record.voter_id_hash.length - 6);
                    const shortTxHash = record.tx_hash.substring(0, 8) + '...';
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>#{record.block_index}</td>
                        <td style={{ padding: '0.75rem', fontFamily: 'monospace' }} title={record.voter_id_hash}>{shortVoterHash}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }} title={record.tx_hash}>
                          <span style={{ color: 'var(--secondary)' }}>{shortTxHash}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
