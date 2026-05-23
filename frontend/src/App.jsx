import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import VotingBooth from './pages/VotingBooth';
import Results from './pages/Results';
import AdminPanel from './pages/AdminPanel';
import VoterStatus from './pages/VoterStatus';
import Ledger from './pages/Ledger';
import AdminAudit from './pages/AdminAudit';

function AppLayout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="container animate-fade-in">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/vote" element={<VotingBooth />} />
          <Route path="/voter-status" element={<VoterStatus />} />
          <Route path="/results" element={<Results />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route
            path="/admin"
            element={sessionStorage.getItem('admin_session') ? <AdminPanel /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/admin/audit"
            element={sessionStorage.getItem('admin_session') ? <AdminAudit /> : <Navigate to="/login" replace />}
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </div>
  );
}


function ProtectedRoutes() {
  const isAdmin = sessionStorage.getItem('admin_session');
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <Navigate to="/admin" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoutes />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
