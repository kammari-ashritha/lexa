import { Toaster } from 'react-hot-toast'
import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A003A',
            color: '#F0E6FF',
            border: '1px solid rgba(124,58,237,0.35)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#00ED64', secondary: '#050010' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#050010' } },
        }}
      />
      <Dashboard />
    </>
  )
}