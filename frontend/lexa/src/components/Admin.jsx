import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import BulkUpload from './BulkUpload'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Admin() {
  const { user, token } = useAuth()
  const [stats, setStats]   = useState(null)
  const [users, setUsers]   = useState([])
  const [tab, setTab]       = useState('upload')

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(res.data)
    } catch(e) {}
  }

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(res.data.users || [])
    } catch(e) {
      toast.error('Failed to load users')
    }
  }

  useEffect(() => {
    if (tab === 'users') fetchUsers()
  }, [tab])

  // Only admins see this
  if (user?.role !== 'admin') {
    return (
      <main style={{ padding: 48, textAlign: 'center', color: '#7C6FA0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>Admin Access Required</div>
        <div style={{ marginTop: 8 }}>You need admin privileges to view this page.</div>
      </main>
    )
  }

  const tabStyle = (id) => ({
    padding: '8px 20px', border: 'none', borderRadius: 8,
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
    fontFamily: 'inherit', transition: 'all 0.2s',
    background: tab === id ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : 'rgba(255,255,255,0.05)',
    color: tab === id ? '#FFFFFF' : '#9CA3AF'
  })

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 800 }}>Admin Dashboard</div>
        <div style={{ color: '#7C6FA0', fontSize: 14, marginTop: 4 }}>
          Manage documents, users, and system settings
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: 16, marginBottom: 28
        }}>
          {[
            { label: 'Total Users',     value: stats.userCount,  color: '#A855F7' },
            { label: 'Documents',       value: stats.docCount,   color: '#00ED64' },
            { label: 'Total Searches',  value: stats.queryCount, color: '#FBBF24' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '20px 24px', textAlign: 'center'
            }}>
              <div style={{ color: s.color, fontSize: 28, fontWeight: 800 }}>{s.value ?? 0}</div>
              <div style={{ color: '#7C6FA0', fontSize: 12, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={tabStyle('upload')} onClick={() => setTab('upload')}>Bulk Upload</button>
        <button style={tabStyle('users')}  onClick={() => setTab('users')}>Users</button>
      </div>

      {/* Tab content */}
      {tab === 'upload' && (
        <BulkUpload onSuccess={() => { fetchStats(); toast.success('Documents indexed!') }} />
      )}

      {tab === 'users' && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: 16, overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px',
            padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            color: '#7C6FA0', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em'
          }}>
            <span>NAME</span><span>EMAIL</span><span>ROLE</span><span>JOINED</span>
          </div>
          {users.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#4B5563' }}>
              No users found
            </div>
          ) : users.map((u, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {u.avatar
                  ? <img src={u.avatar} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
                  : <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 12, fontWeight: 700
                    }}>{u.name?.[0]?.toUpperCase()}</div>
                }
                <span style={{ color: '#FFFFFF', fontSize: 13 }}>{u.name}</span>
              </div>
              <span style={{ color: '#9CA3AF', fontSize: 13 }}>{u.email}</span>
              <span style={{
                display: 'inline-block',
                background: u.role === 'admin' ? 'rgba(0,237,100,0.15)' : 'rgba(124,58,237,0.15)',
                color: u.role === 'admin' ? '#00ED64' : '#A855F7',
                padding: '2px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 600, width: 'fit-content'
              }}>
                {u.role?.toUpperCase()}
              </span>
              <span style={{ color: '#4B5563', fontSize: 12 }}>
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}