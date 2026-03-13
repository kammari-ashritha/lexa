import { useState, useEffect } from 'react'

function useTheme() {
  const [isLight, setIsLight] = useState(() => document.body.classList.contains('light-mode'))
  useEffect(() => {
    const obs = new MutationObserver(() => setIsLight(document.body.classList.contains('light-mode')))
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isLight
}

export default function ChatMessage({ message }) {
  const isLight = useTheme()
  const isUser = message.role === 'user'

  const aiBubbleBg     = isLight ? '#F7F6FB'                        : 'rgba(255,255,255,0.04)'
  const aiBubbleBorder = isLight ? '1px solid #DDD8EF'              : '1px solid rgba(124,58,237,0.2)'
  const aiTextColor    = isLight ? '#0F172A'                        : '#FFFFFF'
  const aiLabelColor   = isLight ? '#7C3AED'                        : '#00ED64'
  const sourceDivider  = isLight ? '1px solid #E8E4F4'             : '1px solid rgba(255,255,255,0.1)'
  const sourceLabelClr = isLight ? '#475569'                        : '#7C6FA0'
  const sourceBg       = isLight ? '#EDE9FF'                        : 'rgba(0,237,100,0.1)'
  const sourceBorder   = isLight ? '1px solid #C4BBDF'             : '1px solid rgba(0,237,100,0.25)'
  const sourceColor    = isLight ? '#4C1D95'                        : '#00ED64'
  const latencyColor   = isLight ? '#64748B'                        : '#4B5563'

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      <div style={{
        maxWidth: '78%',
        background: isUser ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : aiBubbleBg,
        border: isUser ? 'none' : aiBubbleBorder,
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '14px 18px',
        color: isUser ? '#FFFFFF' : aiTextColor,
        fontSize: 14,
        lineHeight: 1.7,
        boxShadow: isLight && !isUser ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
      }}>

        {!isUser && (
          <div style={{ color: aiLabelColor, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>
            LEXA AI
          </div>
        )}

        <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>

        {message.sources?.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: sourceDivider }}>
            <div style={{ color: sourceLabelClr, fontSize: 11, marginBottom: 6, fontWeight: 500 }}>
              Sources used:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {message.sources.map((s, i) => (
                <span key={i} style={{
                  background: sourceBg,
                  border: sourceBorder,
                  borderRadius: 6, padding: '2px 10px',
                  fontSize: 11, color: sourceColor, fontWeight: 600
                }}>
                  [{i + 1}] {s.title} {s.score ? `(${s.score}%)` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {message.latencyMs && (
          <div style={{ color: latencyColor, fontSize: 10, marginTop: 6 }}>
            {message.latencyMs}ms
          </div>
        )}
      </div>
    </div>
  )
}