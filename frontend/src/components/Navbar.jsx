import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Fingerprint, Vote, BarChart3, Home, LogOut, Settings, LogIn, Database, ShieldCheck } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminLoggedIn = Boolean(sessionStorage.getItem('admin_session'));
  const currentPath = location.pathname;

  // Determine active portal mode based on route
  const isAdminMode = currentPath.startsWith('/admin') || currentPath === '/login';
  const isVoterMode = currentPath === '/register' || currentPath === '/vote' || currentPath === '/voter-status';
  const isPublicMode = currentPath === '/results' || currentPath === '/ledger';

  // Contextual nav items
  let navItems = [];
  let portalTitle = "SecureCast System";

  if (isAdminMode) {
    portalTitle = "Admin Console";
    if (isAdminLoggedIn) {
      navItems = [
        { path: '/admin', name: 'Manage Settings', icon: <Settings size={20} /> },
        { path: '/admin/audit', name: 'Voter Registry & Audit', icon: <ShieldCheck size={20} /> },
      ];
    }
  } else if (isVoterMode) {
    portalTitle = "Voter Portal";
    navItems = [
      { path: '/home', name: 'Portal Home', icon: <Home size={20} /> },
      { path: '/register', name: 'Enroll Biometrics', icon: <Fingerprint size={20} /> },
      { path: '/vote', name: 'Voting Booth', icon: <Vote size={20} /> },
      { path: '/voter-status', name: 'Verify Status', icon: <BarChart3 size={20} /> },
    ];
  } else if (isPublicMode) {
    portalTitle = "Public Results Board";
    navItems = [
      { path: '/home', name: 'Portal Home', icon: <Home size={20} /> },
      { path: '/results', name: 'Live Standings', icon: <BarChart3 size={20} /> },
      { path: '/ledger', name: 'Blockchain Ledger', icon: <Database size={20} /> },
    ];
  } else {
    // General / Home
    portalTitle = "SecureCast System";
    navItems = [
      { path: '/home', name: 'Portal Home', icon: <Home size={20} /> }
    ];
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_session');
    sessionStorage.removeItem('voter_session');
    navigate('/home');
    window.location.reload();
  };

  return (
    <nav className="navbar glass-panel">
      <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/home')}>
        <div className="logo-icon"><Vote size={28} color="white" /></div>
        <span className="text-gradient" style={{ fontWeight: 800 }}>{portalTitle}</span>
      </div>
      <div className="nav-links">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`nav-link ${currentPath === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
        {isAdminMode ? (
          isAdminLoggedIn ? (
            <button 
              onClick={handleLogout} 
              className="nav-link" 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}
            >
              <LogOut size={20} />
              <span>Exit Console</span>
            </button>
          ) : (
            <Link to="/home" className="nav-link">
              <Home size={20} />
              <span>Back to Home</span>
            </Link>
          )
        ) : (
          !isVoterMode && !isPublicMode && (
            <Link to="/login" className="nav-link">
              <LogIn size={20} />
              <span>Admin Login</span>
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
