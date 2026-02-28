export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 16
    }}>
      <div style={{
        maxWidth: '78%',
        background: isUser
          ? 'linear-gradient(135deg,#7C3AED,#A855F7)'
          : 'rgba(255,255,255,0.04)',
        border: isUser ? 'none' : '1px solid rgba(124,58,237,0.2)',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '14px 18px',
        color: '#FFFFFF',
        fontSize: 14,
        lineHeight: 1.7
      }}>
        {/* AI label */}
        {!isUser && (
          <div style={{
            color: '#00ED64', fontSize: 10,
            fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8
          }}>
            LEXA AI
          </div>
        )}

        {/* Message text */}
        <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>

        {/* Sources */}
        {message.sources?.length > 0 && (
          <div style={{
            marginTop: 10, paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ color: '#7C6FA0', fontSize: 11, marginBottom: 6 }}>
              Sources used:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {message.sources.map((s, i) => (
                <span key={i} style={{
                  background: 'rgba(0,237,100,0.1)',
                  border: '1px solid rgba(0,237,100,0.25)',
                  borderRadius: 6, padding: '2px 10px',
                  fontSize: 11, color: '#00ED64'
                }}>
                  [{i + 1}] {s.title} {s.score ? `(${s.score}%)` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Latency */}
        {message.latencyMs && (
          <div style={{ color: '#4B5563', fontSize: 10, marginTop: 6 }}>
            {message.latencyMs}ms
          </div>
        )}
      </div>
    </div>
  )
}