import { useState, useEffect } from 'react';
import { Database, Link2, Clock, CheckCircle, Search, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Ledger() {
  const [candidates, setCandidates] = useState([]);
  const [chain, setChain] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    // Fetch candidates for name lookup
    fetch(`${API_BASE_URL}/candidates`)
      .then(res => res.json())
      .then(data => setCandidates(data.candidates || []))
      .catch(err => console.error(err));

    const fetchData = () => {
      fetch(`${API_BASE_URL}/chain`)
        .then(res => res.json())
        .then(data => setChain(data.chain || []))
        .catch(err => console.error(err));

      fetch(`${API_BASE_URL}/audit/summary`)

        .then(res => res.json())
        .then(data => setAuditSummary(data))
        .catch(err => console.error(err));
    };

    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchTx = (e) => {
    e.preventDefault();
    setSearchError(null);
    setSearchResult(null);

    const query = searchQuery.trim();
    if (!query) {
      setSearchError("Please enter a transaction hash.");
      return;
    }

    setSearchLoading(true);

    if (auditSummary?.voted_records) {
      const txRecord = auditSummary.voted_records.find(
        record => record.tx_hash.toLowerCase() === query.toLowerCase()
      );

      if (txRecord) {
        setSearchResult({
          found: true,
          blockIndex: txRecord.block_index,
          timestamp: txRecord.timestamp,
          txHash: txRecord.tx_hash,
          voterIdHash: txRecord.voter_id_hash,
          chainValid: auditSummary.is_chain_valid
        });
      } else {
        setSearchResult({
          found: false,
          statusText: "Transaction not found on the blockchain ledger."
        });
      }
    } else {
      setSearchError("Blockchain audit ledger is loading, please try again.");
    }
    setSearchLoading(false);
  };

  return (
    <div className="ledger-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '1rem 0' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.3rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <Database className="text-gradient animate-pulse" size={32} /> Blockchain Ledger Explorer
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Decentralized, mathematical, public auditing of cast votes</p>
      </div>

      {/* Transaction Tracer Widget */}
      <div className="glass-panel" style={{ border: '1px solid var(--glass-border)', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
          <Search size={20} color="var(--primary)" /> Cryptographic Transaction Trace
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          Input any SHA-256 transaction hash printed on a ballot receipt to verify its presence in a blockchain block and audit its mathematical validation.
        </p>

        <form onSubmit={handleSearchTx} className="responsive-search-form">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter SHA-256 transaction hash"
            style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '12px' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0 2rem' }} disabled={searchLoading}>
            {searchLoading ? <Loader2 className="animate-spin" size={18} /> : 'Trace'}
          </button>
        </form>

        {searchError && (
          <div style={{ marginTop: '1.25rem', color: 'var(--accent)', fontSize: '0.9rem' }}>
            ⚠️ {searchError}
          </div>
        )}

        {searchResult && (
          <div className="animate-fade-in" style={{ marginTop: '1.5rem', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '1.25rem' }}>
            {searchResult.found ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ color: 'var(--secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle size={16} /> Block Membership Confirmed
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Block Index:</span>
                  <span style={{ fontWeight: 600 }}>Block #{searchResult.blockIndex}</span>
                  
                  <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                  <span>{new Date(searchResult.timestamp).toLocaleString()}</span>
                  
                  <span style={{ color: 'var(--text-muted)' }}>Chain Validation:</span>
                  <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Secured & Intact</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '0.5rem' }}>
                  <div><strong>Transaction ID:</strong> {searchResult.txHash}</div>
                  <div style={{ marginTop: '0.25rem' }}><strong>Anonymous Voter Hash:</strong> {searchResult.voterIdHash}</div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <AlertCircle size={16} /> {searchResult.statusText}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chain Visualizer */}
      <div className="glass-panel" style={{ border: '1px solid var(--glass-border)' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database className="text-gradient" /> Cryptographic Block Ledger
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {chain.slice().reverse().map((block, idx) => {
            const isGenesis = block.index === 0;
            const hashValid = block.hash.startsWith('000');
            
            return (
              <div key={block.index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ 
                  background: isGenesis ? 'rgba(16, 185, 129, 0.03)' : 'rgba(15, 23, 42, 0.6)', 
                  border: isGenesis ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--glass-border)', 
                  padding: '1.5rem', 
                  borderRadius: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
                }}>
                  {/* Block Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="text-gradient" style={{ fontWeight: 800, fontSize: '1.15rem' }}>Block #{block.index}</span>
                      {isGenesis && (
                        <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', border: '1px solid var(--secondary)', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '100px', fontWeight: 600, textTransform: 'uppercase' }}>
                          Genesis Block
                        </span>
                      )}
                      {!isGenesis && hashValid && (
                        <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '100px', fontWeight: 600 }}>
                          Verified ✓
                        </span>
                      )}
                    </div>
                    
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={12} /> {new Date(block.timestamp * 1000).toLocaleString()}
                    </span>
                  </div>

                  {/* Hash Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                        <Link2 size={12} color="var(--primary)" /> 
                        <strong style={{ minWidth: '80px' }}>Block Hash:</strong> 
                        <span style={{ color: 'var(--text-muted)', wordBreak: 'break-all' }}>{block.hash}</span>
                      </div>
                    </div>
                    
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                        <Link2 size={12} color="var(--text-muted)" /> 
                        <strong style={{ minWidth: '80px' }}>Prev Hash:</strong> 
                        <span style={{ color: 'var(--text-muted)', wordBreak: 'break-all' }}>{block.previous_hash}</span>
                      </div>
                    </div>
                  </div>

                  {/* Proof of Work Info */}
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', padding: '0.4rem 0.8rem', borderRadius: '100px', width: 'fit-content' }}>
                    <div><strong>Difficulty:</strong> {isGenesis ? 'N/A' : '3 (000 prefix)'}</div>
                    <div><strong>Nonce:</strong> {block.nonce}</div>
                  </div>

                  {/* Transactions list */}
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                      📝 Transactions ({block.transactions.length})
                    </div>
                    {block.transactions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {block.transactions.map((tx, txIdx) => {
                          const candidate = candidates.find(cand => cand.id === tx.candidate_id);
                          const obfuscatedHash = tx.voter_id_hash.substring(0, 8) + '...' + tx.voter_id_hash.substring(tx.voter_id_hash.length - 8);
                          return (
                            <div key={txIdx} style={{ 
                              background: 'rgba(255,255,255,0.02)', 
                              border: '1px solid rgba(255,255,255,0.05)', 
                              borderRadius: '12px', 
                              padding: '0.6rem 0.85rem', 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.8rem' 
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>VOTER HASH</span>
                                <span style={{ fontFamily: 'monospace' }}>{obfuscatedHash}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{candidate ? candidate.name : `Candidate ${tx.candidate_id}`}</span>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{candidate ? candidate.party : ''}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic', paddingLeft: '0.5rem', margin: 0 }}>No vote transactions inside genesis block.</p>
                    )}
                  </div>
                </div>
                
                {/* Visual Connector between blocks */}
                {idx < chain.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
                    <div style={{ width: '2px', height: '20px', background: 'linear-gradient(180deg, var(--primary), var(--secondary))', opacity: 0.4 }}></div>
                  </div>
                )}
              </div>
            );
          })}
          {chain.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading blockchain data...</p>}
        </div>
      </div>
    </div>
  );
}
