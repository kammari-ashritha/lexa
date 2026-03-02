import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages / Views
import SearchPage    from './pages/SearchPage'
import DocumentsPage from './pages/DocumentsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AIChatPage    from './pages/AIChatPage'
import LoginPage     from './components/LoginPage'

// ── Navbar ──────────────────────────────────────────────────────
function Navbar() {
  const { user, logout } = useAuth()

  const navStyle = {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(10,10,20,0.92)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '0 32px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    height: 64
  }

  const logoStyle = {
    display: 'flex', alignItems: 'center', gap: 12,
    textDecoration: 'none'
  }

  const activeStyle = ({ isActive }) => ({
    padding: '8px 16px',
    borderRadius: 8,
    fontWeight: isActive ? 700 : 500,
    fontSize: 14,
    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
    background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.2s'
  })

  return (
    <nav style={navStyle}>
      {/* Logo */}
      <NavLink to="/search" style={logoStyle}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #00B4A0, #00ED64)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 16, color: '#fff'
        }}>L</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '0.06em' }}>LEXA</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: '0.08em' }}>SEMANTIC INTELLIGENCE ENGINE</div>
        </div>
      </NavLink>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4 }}>
        <NavLink to="/search"    style={activeStyle}>Search</NavLink>
        <NavLink to="/ai-chat"   style={activeStyle}>AI Chat</NavLink>
        <NavLink to="/documents" style={activeStyle}>Documents</NavLink>
        <NavLink to="/analytics" style={activeStyle}>Analytics</NavLink>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            <NavLink to="/documents" style={{
              background: 'linear-gradient(135deg, #00B4A0, #00ED64)',
              color: '#001E2B', fontWeight: 700, fontSize: 13,
              padding: '8px 16px', borderRadius: 8,
              textDecoration: 'none', border: 'none'
            }}>Upload Doc</NavLink>
            <button onClick={logout} style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)', padding: '7px 14px',
              borderRadius: 8, cursor: 'pointer', fontSize: 13
            }}>
              {user.name?.split(' ')[0] || 'Logout'}
            </button>
          </>
        ) : (
          <NavLink to="/login" style={{
            background: 'linear-gradient(135deg, #00B4A0, #00ED64)',
            color: '#001E2B', fontWeight: 700, fontSize: 13,
            padding: '8px 16px', borderRadius: 8, textDecoration: 'none'
          }}>Log In</NavLink>
        )}
      </div>
    </nav>
  )
}

// ── Protected route wrapper ─────────────────────────────────────
function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

// ── App ─────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)'
            }
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Routes with navbar */}
          <Route path="/" element={<><Navbar /><SearchPage /></>} />
          <Route path="/search" element={<><Navbar /><SearchPage /></>} />
          <Route path="/ai-chat" element={<><Navbar /><AIChatPage /></>} />
          <Route path="/analytics" element={<><Navbar /><AnalyticsPage /></>} />
          <Route path="/documents" element={<><Navbar /><DocumentsPage /></>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/search" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}