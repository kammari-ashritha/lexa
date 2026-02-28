import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './context/AuthContext'
import Dashboard from './components/Dashboard'
import LoginPage from './components/LoginPage'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function AppContent() {
  const { isLoggedIn, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#050010',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#A855F7', fontSize: 18, fontFamily: "'DM Sans', sans-serif"
      }}>
        Loading...
      </div>
    )
  }

  return isLoggedIn ? <Dashboard /> : <LoginPage />
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1A003A', color: '#F0E6FF',
              border: '1px solid rgba(124,58,237,0.35)',
              fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
            },
            success: { iconTheme: { primary: '#00ED64', secondary: '#050010' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#050010' } },
          }}
        />
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}