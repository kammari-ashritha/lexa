import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import BulkUpload from './BulkUpload'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function useTheme() {
  const [isLight, setIsLight] = useState(() => document.body.classList.contains('light-mode'))
  useEffect(() => {
    const obs = new MutationObserver(() => setIsLight(document.body.classList.contains('light-mode')))
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isLight
}

export default function Admin() {
  const isLight = useTheme()
  const { user, token } = useAuth()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [tab, setTab]     = useState('upload')

  useEffect(() => { fetchStats() }, [])
  const fetchStats = async () => {
    try { const res = await axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }); setStats(res.data) } catch {}
  }
  const fetchUsers = async () => {
    try { const res = await axios.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }); setUsers(res.data.users || []) }
    catch { toast.error('Failed to load users') }
  }
  useEffect(() => { if (tab === 'users') fetchUsers() }, [tab])

  const t = {
    bg:          isLight ? '#FFFFFF'          : 'transparent',
    titleColor:  isLight ? '#0F172A'          : '#FFFFFF',
    subColor:    isLight ? '#475569'          : '#7C6FA0',
    cardBg:      isLight ? '#F7F6FB'          : 'rgba(255,255,255,0.03)',
    cardBdr:     isLight ? '1px solid #DDD8EF': '1px solid rgba(255,255,255,0.08)',
    tableBg:     isLight ? '#F7F6FB'          : 'rgba(255,255,255,0.03)',
    tableBdr:    isLight ? '1px solid #DDD8EF': '1px solid rgba(124,58,237,0.2)',
    tableHdrClr: isLight ? '#475569'          : '#7C6FA0',
    tableHdrBdr: isLight ? '1px solid #DDD8EF': '1px solid rgba(255,255,255,0.06)',
    tableRowBdr: isLight ? '1px solid #F0EDF8': '1px solid rgba(255,255,255,0.04)',
    nameColor:   isLight ? '#0F172A'          : '#FFFFFF',
    emailColor:  isLight ? '#475569'          : '#9CA3AF',
    dateColor:   isLight ? '#64748B'          : '#4B5563',
    emptyColor:  isLight ? '#64748B'          : '#4B5563',
  }

  if (user?.role !== 'admin') return (
    <main style={{ padding: 48, textAlign: 'center', color: t.subColor }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <div style={{ color: t.titleColor, fontSize: 20, fontWeight: 700 }}>Admin Access Required</div>
      <div style={{ marginTop: 8 }}>You need admin privileges to view this page.</div>
    </main>
  )

  const tabStyle = (id) => ({
    padding: '8px 20px', border: 'none', borderRadius: 8,
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
    fontFamily: 'inherit', transition: 'all 0.2s',
    background: tab === id ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : (isLight ? '#EDE9FF' : 'rgba(255,255,255,0.05)'),
    color: tab === id ? '#FFFFFF' : (isLight ? '#3D3658' : '#9CA3AF'),
    boxShadow: tab === id ? '0 2px 8px rgba(109,40,217,0.3)' : 'none',
  })

  const STAT_COLORS = ['#7C3AED', '#15803D', '#92400E']
  const statLabels  = ['Total Users', 'Documents', 'Total Searches']

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: t.titleColor, fontSize: 24, fontWeight: 800 }}>Admin Dashboard</div>
        <div style={{ color: t.subColor, fontSize: 14, marginTop: 4 }}>Manage documents, users, and system settings</div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
          {[stats.userCount, stats.docCount, stats.queryCount].map((val, i) => (
            <div key={i} style={{ background: t.cardBg, border: t.cardBdr, borderRadius: 12, padding: '20px 24px', textAlign: 'center', boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.05)' : 'none' }}>
              <div style={{ color: STAT_COLORS[i], fontSize: 28, fontWeight: 800 }}>{val ?? 0}</div>
              <div style={{ color: t.subColor, fontSize: 12, marginTop: 4 }}>{statLabels[i]}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={tabStyle('upload')} onClick={() => setTab('upload')}>Bulk Upload</button>
        <button style={tabStyle('users')}  onClick={() => setTab('users')}>Users</button>
      </div>

      {tab === 'upload' && (
        <BulkUpload onSuccess={() => { fetchStats(); toast.success('Documents indexed!') }} />
      )}

      {tab === 'users' && (
        <div style={{ background: t.tableBg, border: t.tableBdr, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px', padding: '12px 20px', borderBottom: t.tableHdrBdr, color: t.tableHdrClr, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
            <span>NAME</span><span>EMAIL</span><span>ROLE</span><span>JOINED</span>
          </div>
          {users.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: t.emptyColor }}>No users found</div>
          ) : users.map((u, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px', padding: '14px 20px', borderBottom: t.tableRowBdr, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {u.avatar
                  ? <img src={u.avatar} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
                  : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>{u.name?.[0]?.toUpperCase()}</div>
                }
                <span style={{ color: t.nameColor, fontSize: 13, fontWeight: 600 }}>{u.name}</span>
              </div>
              <span style={{ color: t.emailColor, fontSize: 13 }}>{u.email}</span>
              <span style={{ display: 'inline-block', background: u.role === 'admin' ? (isLight ? '#DCFCE7' : 'rgba(0,237,100,0.15)') : (isLight ? '#EDE9FF' : 'rgba(124,58,237,0.15)'), color: u.role === 'admin' ? (isLight ? '#15803D' : '#00ED64') : (isLight ? '#6D28D9' : '#A855F7'), padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, width: 'fit-content' }}>
                {u.role?.toUpperCase()}
              </span>
              <span style={{ color: t.dateColor, fontSize: 12 }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}