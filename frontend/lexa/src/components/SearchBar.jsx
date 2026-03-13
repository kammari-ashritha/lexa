import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const EXAMPLES = [
  'machine learning applications',
  'climate change impact',
  'financial risk management',
  'data privacy regulations',
]

function useTheme() {
  const [isLight, setIsLight] = useState(() => document.body.classList.contains('light-mode'))
  useEffect(() => {
    const obs = new MutationObserver(() => setIsLight(document.body.classList.contains('light-mode')))
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isLight
}

export default function SearchBar({ onSearch, loading }) {
  const isLight = useTheme()
  const [input,    setInput]    = useState('')
  const [suggestions, setSugs]  = useState([])
  const [showSugs, setShowSugs] = useState(false)
  const [selected, setSelected] = useState(-1)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (input.length < 2) { setSugs([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/search/suggest?q=${encodeURIComponent(input)}`)
        setSugs(res.data.suggestions || []); setShowSugs(true)
      } catch {}
    }, 300)
  }, [input])

  const submit = (val) => {
    const q = val || input
    if (!q.trim()) return
    setInput(q); setShowSugs(false); setSugs([]); setSelected(-1)
    onSearch(q)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter')     { submit(selected >= 0 ? suggestions[selected] : undefined); return }
    if (e.key === 'ArrowDown') { setSelected(s => Math.min(s+1, suggestions.length-1)); e.preventDefault() }
    if (e.key === 'ArrowUp')   { setSelected(s => Math.max(s-1, -1)); e.preventDefault() }
    if (e.key === 'Escape')    { setShowSugs(false) }
  }

  const t = {
    suggBg:      isLight ? '#FFFFFF'           : 'var(--bg-suggestion)',
    suggBdr:     isLight ? '1px solid #DDD8EF' : 'var(--border-card)',
    suggShadow:  isLight ? '0 12px 40px rgba(0,0,0,0.1)' : '0 12px 40px rgba(0,0,0,0.4)',
    suggItem:    isLight ? '#1C1530'           : 'var(--text-body)',
    suggHoverBg: isLight ? '#EDE9FF'           : 'rgba(124,58,237,0.1)',
    suggActiveBg:isLight ? '#EDE9FF'           : 'rgba(124,58,237,0.15)',
    exLabelClr:  isLight ? '#475569'           : 'var(--text-ghost)',
    exPillBg:    isLight ? '#EDE9FF'           : 'var(--bg-card)',
    exPillBdr:   isLight ? '1px solid #C4BBDF' : 'var(--border-card)',
    exPillClr:   isLight ? '#3D3658'           : 'var(--text-faint)',
  }

  return (
    <div className="search-wrapper">
      <div className="search-glow-layer" />
      <div className="search-box">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          className="search-input"
          value={input}
          onChange={e => { setInput(e.target.value); setSelected(-1) }}
          onKeyDown={handleKey}
          onFocus={() => suggestions.length > 0 && setShowSugs(true)}
          onBlur={() => setTimeout(() => setShowSugs(false), 150)}
          placeholder='Ask anything... "financial risks", "climate solutions", "ML trends"'
          autoComplete="off"
        />
        {input.trim() && (
          <button className="search-btn" onClick={() => submit()} disabled={loading}>
            {loading ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,animation:'spin 0.9s linear infinite'}}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}>
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            )}
            {loading ? 'Searching' : 'Search'}
          </button>
        )}
      </div>

      {showSugs && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, background: t.suggBg, border: t.suggBdr, borderRadius: 12, overflow: 'hidden', zIndex: 50, boxShadow: t.suggShadow }}>
          {suggestions.map((s, i) => (
            <button key={i} onMouseDown={() => submit(s)} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '10px 16px', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 13,
              background: selected === i ? t.suggActiveBg : 'transparent',
              color: t.suggItem,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = t.suggHoverBg}
            onMouseLeave={e => e.currentTarget.style.background = selected === i ? t.suggActiveBg : 'transparent'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12,flexShrink:0,opacity:0.5}}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              {s}
            </button>
          ))}
        </div>
      )}

      {!input && (
        <div className="example-row">
          <span className="example-label" style={{ color: t.exLabelClr }}>Try:</span>
          {EXAMPLES.map(q => (
            <button key={q} className="example-pill" onClick={() => { setInput(q); submit(q) }}
              style={{ background: t.exPillBg, border: t.exPillBdr, color: t.exPillClr }}
            >{q}</button>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}