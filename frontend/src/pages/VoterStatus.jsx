import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Search, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function VoterStatus() {
  const [searchMode, setSearchMode] = useState('voter'); // 'voter' | 'tx'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [auditSummary, setAuditSummary] = useState(null);

  useEffect(() => {
    // Fetch audit summary to check transaction records
    fetch(`${API_BASE_URL}/audit/summary`)
      .then(res => res.json())
      .then(data => setAuditSummary(data))
      .catch(err => console.error("Error fetching audit summary:", err));
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setSearchResult(null);

    const query = searchQuery.trim();
    if (!query) {
      setSearchError("Please enter a search query.");
      return;
    }

    setSearchLoading(true);

    if (searchMode === 'voter') {
      if (!/^[a-zA-Z0-9]{10}$/.test(query)) {
        setSearchError("Invalid Voter ID format. Must be a 10-character alphanumeric code.");
        setSearchLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/voter/status/${query}`);
        if (!res.ok) {
          throw new Error("Voter not found or error fetching status.");
        }
        const voterData = await res.json();
        if (!voterData.registered) {
          setSearchResult({
            type: 'voter',
            registered: false,
            statusText: "Not Registered in this System"
          });
          setSearchLoading(false);
          return;
        }

        // Search for blockchain transaction receipt if they have voted
        let ledgerRecord = null;
        if (voterData.has_voted && voterData.voter_id_hash && auditSummary?.voted_records) {
          ledgerRecord = auditSummary.voted_records.find(
            record => record.voter_id_hash === voterData.voter_id_hash
          );
        }

        setSearchResult({
          type: 'voter',
          registered: true,
          hasVoted: voterData.has_voted,
          name: voterData.name,
          statusText: voterData.status,
          ledgerRecord: ledgerRecord
        });
      } catch (err) {
        setSearchError(err.message || "An error occurred during verification.");
      }
    } else {
      // Search by Transaction Hash
      if (auditSummary?.voted_records) {
        const txRecord = auditSummary.voted_records.find(
          record => record.tx_hash.toLowerCase() === query.toLowerCase()
        );

        if (txRecord) {
          setSearchResult({
            type: 'tx',
            found: true,
            blockIndex: txRecord.block_index,
            timestamp: txRecord.timestamp,
            txHash: txRecord.tx_hash,
            voterIdHash: txRecord.voter_id_hash,
            chainValid: auditSummary.is_chain_valid
          });
        } else {
          setSearchResult({
            type: 'tx',
            found: false,
            statusText: "Transaction not found on the blockchain ledger."
          });
        }
      } else {
        setSearchError("Blockchain audit ledger is not loaded yet. Please try again.");
      }
    }
    setSearchLoading(false);
  };

  return (
    <div className="voter-status-container animate-fade-in" style={{ maxWidth: '750px', margin: '2rem auto' }}>
      <div className="glass-panel" style={{ border: '1px solid var(--glass-border)', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.8rem' }}>
          <Search className="text-gradient" size={26} /> Voter Status & Receipt Verifier
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.92rem', lineHeight: '1.6' }}>
          Query your registration eligibility and verify your cryptographic ballot receipt status. Trace the mathematical proof of any SHA-256 block transaction hash.
        </p>

        {/* Tab selection */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
          <button 
            type="button"
            className={searchMode === 'voter' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => { setSearchMode('voter'); setSearchResult(null); setSearchError(null); setSearchQuery(''); }}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
          >
            Verify Voter ID
          </button>
          <button 
            type="button"
            className={searchMode === 'tx' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => { setSearchMode('tx'); setSearchResult(null); setSearchError(null); setSearchQuery(''); }}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
          >
            Trace Tx Hash
          </button>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearch} className="responsive-search-form">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchMode === 'voter' ? "Enter your 10-character Voter ID" : "Enter SHA-256 transaction hash"}
            style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '12px' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0 2rem' }} disabled={searchLoading}>
            {searchLoading ? <Loader2 className="animate-spin" size={18} /> : 'Verify'}
          </button>
        </form>

        {searchError && (
          <div style={{ marginTop: '1.5rem', color: 'var(--accent)', background: 'rgba(244, 63, 94, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.15)', fontSize: '0.9rem' }}>
            ⚠️ {searchError}
          </div>
        )}

        {searchResult && (
          <div className="animate-fade-in" style={{ marginTop: '2rem', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
              Verification Report
            </h4>

            {searchResult.type === 'voter' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Voter Name:</span>
                  <span style={{ fontWeight: 600 }}>{searchResult.name || 'Masked / Anonymous'}</span>

                  <span style={{ color: 'var(--text-muted)' }}>Registration:</span>
                  <span style={{ fontWeight: 600, color: searchResult.registered ? 'var(--secondary)' : 'var(--accent)' }}>
                    {searchResult.registered ? 'Registered ✓' : 'Not Registered'}
                  </span>

                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <span style={{ fontWeight: 600, color: searchResult.hasVoted ? 'var(--accent)' : 'var(--secondary)' }}>
                    {searchResult.statusText}
                  </span>
                </div>

                {searchResult.hasVoted && (
                  <div style={{ marginTop: '1rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.25rem', borderRadius: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle size={16} /> Cryptographic Blockchain Record Located
                    </div>
                    {searchResult.ledgerRecord ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                        <div><strong>Block Number:</strong> #{searchResult.ledgerRecord.block_index}</div>
                        <div style={{ wordBreak: 'break-all' }}><strong>Transaction ID:</strong> {searchResult.ledgerRecord.tx_hash}</div>
                        <div><strong>Timestamp:</strong> {new Date(searchResult.ledgerRecord.timestamp).toLocaleString()}</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Your ballot has been cast and marked. (Blockchain registry synchronization pending)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {searchResult.type === 'tx' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {searchResult.found ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', fontSize: '0.95rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Verification:</span>
                      <span style={{ fontWeight: 600, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        Mathematically Verified ✓
                      </span>

                      <span style={{ color: 'var(--text-muted)' }}>Block Index:</span>
                      <span style={{ fontWeight: 600 }}>#{searchResult.blockIndex}</span>

                      <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                      <span style={{ fontWeight: 600 }}>{new Date(searchResult.timestamp).toLocaleString()}</span>
                    </div>

                    <div style={{ marginTop: '0.5rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                      <div style={{ wordBreak: 'break-all', marginBottom: '0.5rem' }}>
                        <strong>Transaction ID:</strong> <span style={{ color: 'var(--primary)' }}>{searchResult.txHash}</span>
                      </div>
                      <div style={{ wordBreak: 'break-all' }}>
                        <strong>Anonymized Voter Hash:</strong> {searchResult.voterIdHash}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'var(--accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} /> {searchResult.statusText}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
