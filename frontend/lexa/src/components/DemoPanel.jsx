import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const DEMOS = [
  { id:1, label:'Medical Terminology', category:'Medical',    userQuery:'heart attack symptoms',  description:'User types casual language — Lexa finds clinical documents',       highlight:'Different words, same meaning — only semantic search finds it' },
  { id:2, label:'HR Policy',           category:'HR',         userQuery:'work from home rules',   description:'Employee searches informally — Lexa finds formal policy document',  highlight:'No keyword overlap at all — pure vector similarity match' },
  { id:3, label:'Finance',             category:'Finance',    userQuery:'economic recession',     description:'Analyst searches concept — finds crisis documents automatically',    highlight:'Concept-level matching across financial terminology' },
  { id:4, label:'Technology',          category:'Technology', userQuery:'machines that learn',    description:'Non-technical user finds technical AI documents',                    highlight:'Plain English query to technical document semantic bridge' },
]

const CAT_LIGHT = { Medical:'#15803D', HR:'#6D28D9', Finance:'#92400E', Technology:'#1D4ED8' }
const CAT_DARK  = { Medical:'#00ED64', HR:'#A855F7', Finance:'#FBBF24', Technology:'#3B82F6' }
const CAT_BG_LIGHT = { Medical:'#DCFCE7', HR:'#EDE9FF', Finance:'#FEF3C7', Technology:'#DBEAFE' }
const CAT_BG_DARK  = { Medical:'rgba(0,237,100,0.12)', HR:'rgba(168,85,247,0.12)', Finance:'rgba(251,191,36,0.12)', Technology:'rgba(59,130,246,0.12)' }

function useTheme() {
  const [isLight, setIsLight] = useState(() => document.body.classList.contains('light-mode'))
  useEffect(() => {
    const obs = new MutationObserver(() => setIsLight(document.body.classList.contains('light-mode')))
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isLight
}

export default function DemoPanel({ onSearch }) {
  const isLight = useTheme()
  const [activeDemo, setActiveDemo] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [results, setResults]       = useState(null)

  const t = {
    panelBg:       isLight ? '#F7F6FB'                          : 'rgba(255,255,255,0.02)',
    panelBorder:   isLight ? '1px solid #DDD8EF'               : '1px solid rgba(124,58,237,0.2)',
    titleColor:    isLight ? '#0F172A'                          : '#FFFFFF',
    subColor:      isLight ? '#475569'                          : '#7C6FA0',
    btnActiveBg:   isLight ? 'linear-gradient(135deg,rgba(109,40,217,0.12),rgba(124,58,237,0.08))' : 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(168,85,247,0.2))',
    btnActiveBdr:  isLight ? '1px solid rgba(109,40,217,0.4)'  : '1px solid rgba(168,85,247,0.6)',
    btnIdleBg:     isLight ? '#FFFFFF'                          : 'rgba(255,255,255,0.03)',
    btnIdleBdr:    isLight ? '1px solid #DDD8EF'               : '1px solid rgba(255,255,255,0.08)',
    btnTitle:      isLight ? '#0F172A'                          : '#FFFFFF',
    btnDesc:       isLight ? '#475569'                          : '#7C6FA0',
    queryBg:       isLight ? '#EDE9FF'                          : 'rgba(0,237,100,0.08)',
    queryColor:    isLight ? '#4C1D95'                          : '#00ED64',
    resultsBg:     isLight ? '#FFFFFF'                          : 'rgba(0,0,0,0.2)',
    resultsBdr:    isLight ? '1px solid #DDD8EF'               : '1px solid rgba(0,237,100,0.15)',
    whatBg:        isLight ? '#F0FDF4'                          : 'rgba(0,237,100,0.08)',
    whatBdr:       isLight ? '1px solid #86EFAC'               : '1px solid rgba(0,237,100,0.2)',
    whatLabel:     isLight ? '#15803D'                          : '#00ED64',
    whatText:      isLight ? '#1C1530'                          : '#E2D9F3',
    whatQuery:     isLight ? '#15803D'                          : '#00ED64',
    whatDocs:      isLight ? '#0F172A'                          : '#FFFFFF',
    whatMs:        isLight ? '#6D28D9'                          : '#A855F7',
    whatMode:      isLight ? '#15803D'                          : '#00ED64',
    highlightClr:  isLight ? '#475569'                          : '#C4B5FD',
    kwBg:          isLight ? '#FFF1F2'                          : 'rgba(239,68,68,0.08)',
    kwBdr:         isLight ? '1px solid #FECACA'               : '1px solid rgba(239,68,68,0.2)',
    kwLabel:       isLight ? '#991B1B'                          : '#EF4444',
    kwText:        isLight ? '#374151'                          : '#9CA3AF',
    kwZero:        isLight ? '#991B1B'                          : '#EF4444',
    lxBg:          isLight ? '#F0FDF4'                          : 'rgba(0,237,100,0.08)',
    lxBdr:         isLight ? '1px solid #86EFAC'               : '1px solid rgba(0,237,100,0.2)',
    lxLabel:       isLight ? '#15803D'                          : '#00ED64',
    lxText:        isLight ? '#374151'                          : '#9CA3AF',
    lxHit:         isLight ? '#15803D'                          : '#00ED64',
    topLabel:      isLight ? '#475569'                          : '#7C6FA0',
    topCardBg:     isLight ? '#F7F6FB'                          : 'rgba(255,255,255,0.03)',
    topCardBdr:    isLight ? '1px solid #DDD8EF'               : '1px solid rgba(124,58,237,0.2)',
    topDocIcon:    isLight ? '#EDE9FF'                          : 'rgba(124,58,237,0.2)',
    topDocLetter:  isLight ? '#6D28D9'                          : '#A855F7',
    topTitle:      isLight ? '#0F172A'                          : '#FFFFFF',
    topContent:    isLight ? '#374151'                          : '#C4B5FD',
    scoreLabel:    isLight ? '#475569'                          : '#7C6FA0',
    scoreBg:       isLight ? '#E8E4F4'                          : 'rgba(255,255,255,0.08)',
    scoreGreenTxt: isLight ? '#15803D'                          : '#00ED64',
    scorePurpTxt:  isLight ? '#6D28D9'                          : '#A855F7',
    spinColor:     isLight ? '#6D28D9'                          : '#A855F7',
  }

  const runDemo = async (demo) => {
    setActiveDemo(demo.id); setLoading(true); setResults(null)
    try {
      const res = await axios.post(`${API}/search`, { query: demo.userQuery, limit: 3, useRAG: false })
      setResults({ demo, data: res.data })
    } catch { setResults({ demo, error: 'Search failed — make sure services are running' }) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ background: t.panelBg, border: t.panelBorder, borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', borderRadius: 8, padding: '6px 12px', color: '#FFFFFF', fontWeight: 800, fontSize: 13, letterSpacing: '0.04em' }}>LIVE</div>
          <div>
            <div style={{ color: t.titleColor, fontWeight: 700, fontSize: 16 }}>Live Demo: Semantic vs Keyword Search</div>
            <div style={{ color: t.subColor, fontSize: 12, marginTop: 2 }}>Click any example to see why Lexa finds what traditional search misses</div>
          </div>
        </div>
      </div>

      {/* Demo buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 24 }}>
        {DEMOS.map(demo => (
          <button key={demo.id} onClick={() => runDemo(demo)} style={{
            background: activeDemo === demo.id ? t.btnActiveBg : t.btnIdleBg,
            border:     activeDemo === demo.id ? t.btnActiveBdr : t.btnIdleBdr,
            borderRadius: 12, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
          }}>
            <div style={{
              display: 'inline-block',
              background: isLight ? CAT_BG_LIGHT[demo.category] : CAT_BG_DARK[demo.category],
              color: isLight ? CAT_LIGHT[demo.category] : CAT_DARK[demo.category],
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginBottom: 6, letterSpacing: '0.06em'
            }}>{demo.category.toUpperCase()}</div>
            <div style={{ color: t.btnTitle, fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{demo.label}</div>
            <div style={{ fontFamily: 'monospace', color: t.queryColor, fontSize: 12, background: t.queryBg, padding: '3px 8px', borderRadius: 6, display: 'inline-block', marginBottom: 6 }}>"{demo.userQuery}"</div>
            <div style={{ color: t.btnDesc, fontSize: 11, lineHeight: 1.4 }}>{demo.description}</div>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '32px', color: t.spinColor }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${isLight ? '#EDE9FF' : 'rgba(168,85,247,0.2)'}`, borderTopColor: t.spinColor, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, color: t.subColor }}>Running semantic search...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div style={{ background: t.resultsBg, borderRadius: 12, padding: 20, border: t.resultsBdr }}>
          {results.error ? (
            <div style={{ color: '#DC2626', fontSize: 13 }}>{results.error}</div>
          ) : (
            <>
              {/* What happened */}
              <div style={{ background: t.whatBg, border: t.whatBdr, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ color: t.whatLabel, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>WHAT JUST HAPPENED</div>
                <div style={{ color: t.whatText, fontSize: 13, lineHeight: 1.5 }}>
                  You searched{' '}
                  <span style={{ color: t.whatQuery, fontWeight: 600, fontFamily: 'monospace' }}>"{results.demo.userQuery}"</span>{' '}
                  — Lexa found{' '}
                  <strong style={{ color: t.whatDocs }}>{results.data.meta?.total || 0} documents</strong>{' '}
                  in{' '}
                  <strong style={{ color: t.whatMs }}>{results.data.meta?.latencyMs}ms</strong>{' '}
                  using <strong style={{ color: t.whatMode }}>hybrid search</strong>.
                </div>
                <div style={{ color: t.highlightClr, fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>{results.demo.highlight}</div>
              </div>

              {/* Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: t.kwBg, border: t.kwBdr, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ color: t.kwLabel, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Traditional Keyword Search</div>
                  <div style={{ color: t.kwText, fontSize: 12 }}>
                    Searching for exact words: "{results.demo.userQuery}"<br />
                    <strong style={{ color: t.kwZero }}>0 results found</strong> — document uses different terminology
                  </div>
                </div>
                <div style={{ background: t.lxBg, border: t.lxBdr, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ color: t.lxLabel, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Lexa Hybrid Semantic Search</div>
                  <div style={{ color: t.lxText, fontSize: 12 }}>
                    Understanding meaning + keywords<br />
                    <strong style={{ color: t.lxHit }}>{results.data.meta?.total} results found</strong> — matched by concept
                  </div>
                </div>
              </div>

              {/* Top result */}
              {results.data.results?.[0] && (
                <div>
                  <div style={{ color: t.topLabel, fontSize: 11, marginBottom: 8, fontWeight: 600 }}>TOP RESULT</div>
                  <div style={{ background: t.topCardBg, border: t.topCardBdr, borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 20, height: 20, background: t.topDocIcon, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: t.topDocLetter, fontWeight: 700 }}>D</div>
                      <div style={{ color: t.topTitle, fontWeight: 600, fontSize: 13 }}>{results.data.results[0].title}</div>
                    </div>
                    <div style={{ color: t.topContent, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
                      {results.data.results[0].content?.slice(0, 150)}...
                    </div>
                    <div>
                      {[
                        { label: 'Vector',  val: Math.round((results.data.results[0].vectorScore  || 0) * 100), color: isLight ? '#15803D' : '#00ED64', fill: isLight ? '#15803D' : '#00ED64' },
                        { label: 'Lexical', val: Math.round((results.data.results[0].lexicalScore || 0) * 100), color: isLight ? '#6D28D9' : '#A855F7', fill: isLight ? '#6D28D9' : '#A855F7' },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ color: t.scoreLabel, fontSize: 10, width: 50 }}>{row.label}</span>
                          <div style={{ flex: 1, height: 4, background: t.scoreBg, borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${row.val}%`, height: '100%', background: row.fill, borderRadius: 2 }} />
                          </div>
                          <span style={{ color: row.color, fontSize: 10, width: 30, fontWeight: 600 }}>{row.val}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button onClick={() => onSearch(results.demo.userQuery)} style={{ marginTop: 14, width: '100%', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', border: 'none', borderRadius: 10, color: '#FFFFFF', fontWeight: 600, fontSize: 13, padding: '10px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(109,40,217,0.35)' }}>
                Open Full Search Results
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}