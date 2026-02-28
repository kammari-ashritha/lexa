import { useState } from 'react'

function WhyTooltip({ vectorScore, lexicalScore, title }) {
  const [show, setShow] = useState(false)
  const dominantMode = vectorScore > lexicalScore ? 'semantic similarity' : 'keyword match'
  const explanation = vectorScore > lexicalScore
    ? `Found because the meaning of your query closely matches this document's content (${vectorScore}% semantic similarity). Even if you used different words, the concepts aligned.`
    : `Found because your query keywords directly appear in this document (${lexicalScore}% keyword match) and it's semantically relevant.`

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={e => { e.stopPropagation(); setShow(s => !s) }}
        style={{
          background: 'rgba(124,58,237,0.15)',
          border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: '50%',
          width: 18, height: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#A78BFA', fontSize: 11, fontWeight: 700,
          flexShrink: 0
        }}
      >?</button>
      {show && (
        <div style={{
          position: 'absolute', bottom: '120%', left: '50%',
          transform: 'translateX(-50%)',
          background: '#1A003A', border: '1px solid rgba(124,58,237,0.5)',
          borderRadius: 10, padding: '10px 14px',
          width: 260, zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          fontSize: 12, lineHeight: 1.5, color: '#E2D9F3',
          pointerEvents: 'none'
        }}>
          <div style={{ color: '#00ED64', fontWeight: 700, marginBottom: 6, fontSize: 11 }}>
            ✦ WHY THIS RESULT?
          </div>
          <div style={{ marginBottom: 8 }}>{explanation}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              background: 'rgba(0,237,100,0.15)', color: '#00ED64',
              padding: '2px 8px', borderRadius: 20, fontSize: 10
            }}>
              Vector {vectorScore}%
            </span>
            <span style={{
              background: 'rgba(168,85,247,0.15)', color: '#A855F7',
              padding: '2px 8px', borderRadius: 20, fontSize: 10
            }}>
              Lexical {lexicalScore}%
            </span>
          </div>
          <div style={{
            position: 'absolute', bottom: -6, left: '50%',
            width: 10, height: 10,
            background: '#1A003A',
            border: '1px solid rgba(124,58,237,0.5)',
            borderTop: 'none', borderLeft: 'none',
            transform: 'translateX(-50%) rotate(45deg)'
          }} />
        </div>
      )}
    </div>
  )
}

export default function ResultCard({ result, index }) {
  const [expanded, setExpanded] = useState(false)

  const vectorScore  = Math.min(100, Math.round((result.vectorScore  || 0) * 100))
  const lexicalScore = Math.min(100, Math.round((result.lexicalScore || 0) * 100))
  const rrfScore     = Math.min(100, Math.round((result.score        || 0) * 6000))

  // Determine match type label
  const matchType = lexicalScore > 20
    ? { label: 'HYBRID MATCH', color: '#00ED64' }
    : { label: 'SEMANTIC MATCH', color: '#A855F7' }

  return (
    <div
      className={`result-card stagger-${Math.min(index+1,6)}`}
      onClick={() => setExpanded(e => !e)}
      style={{ cursor: 'pointer' }}
    >
      <div className="result-inner">
        <div className="result-rank">
          <div className="rank-num">{index + 1}</div>
          <div className="rank-pct" style={{ color: rrfScore > 60 ? '#00ED64' : '#A855F7' }}>
            {rrfScore}%
          </div>
          <div style={{
            fontSize: 8, color: matchType.color,
            fontWeight: 700, letterSpacing: '0.05em',
            textAlign: 'center', lineHeight: 1.2, marginTop: 2
          }}>
            {lexicalScore > 20 ? '⚡ HYBRID' : '🧠 SEMANTIC'}
          </div>
        </div>

        <div className="result-content">
          <div className="result-header">
            <div className="result-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,color:'#A78BFA',flexShrink:0}}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              {result.title}
              {result.chunk_index !== undefined && (
                <span className="chunk-label">· chunk {result.chunk_index + 1}</span>
              )}
              <WhyTooltip
                vectorScore={vectorScore}
                lexicalScore={lexicalScore}
                title={result.title}
              />
            </div>
            <div className="pills-row">
              {result.category && <span className="pill-cat">{result.category}</span>}
              {result.tags?.[0] && <span className="pill-tag">{result.tags[0]}</span>}
            </div>
          </div>

          <div className="result-text">
            {expanded
              ? result.content
              : (result.content?.slice(0, 220) + (result.content?.length > 220 ? '...' : ''))}
          </div>

          <div className="score-bars">
            <div className="score-row">
              <span className="score-label" title="How closely the meaning matches your query">
                🧠 Vector
              </span>
              <div className="score-track">
                <div className="score-fill green" style={{ width: `${vectorScore}%` }} />
              </div>
              <span className="score-val green">{vectorScore}%</span>
            </div>
            <div className="score-row">
              <span className="score-label" title="How many of your keywords appear in this document">
                🔤 Lexical
              </span>
              <div className="score-track">
                <div className="score-fill purple" style={{ width: `${lexicalScore}%` }} />
              </div>
              <span className="score-val purple">{lexicalScore > 0 ? `${lexicalScore}%` : 'semantic'}</span>
            </div>
          </div>

          {/* Explanation line */}
          <div style={{
            fontSize: 11, color: '#7C6FA0', marginTop: 6,
            fontStyle: 'italic', paddingLeft: 2
          }}>
            {lexicalScore > 20
              ? `✦ Matched via both meaning (${vectorScore}%) and keywords (${lexicalScore}%) — strongest possible match`
              : `✦ Matched via semantic meaning — found even though exact words may differ`
            }
          </div>
        </div>

        <button className="result-expand-btn" onClick={e => { e.stopPropagation(); setExpanded(x => !x) }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,transform: expanded?'rotate(180deg)':'none', transition:'transform 0.2s'}}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
    </div>
  )
}