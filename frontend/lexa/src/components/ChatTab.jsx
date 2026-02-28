import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const SESSION_ID = `session_${Date.now()}`

export default function ChatTab() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I am Lexa AI. Ask me anything about your uploaded documents and I will find and synthesize answers from them.'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    const currentInput = input
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(`${API}/chat`, {
        query: currentInput,
        sessionId: SESSION_ID,
        history: messages.slice(-10)
      })
      setMessages(m => [...m, {
        role: 'assistant',
        content: res.data.answer,
        sources: res.data.sources || [],
        latencyMs: res.data.latencyMs
      }])
    } catch(e) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Make sure both services are running and Gemini key is valid.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared! Ask me anything about your documents.'
    }])
  }

  return (
    <main style={{
      maxWidth: 800, margin: '0 auto', padding: '24px',
      height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, paddingBottom: 16,
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div>
          <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 18 }}>
            Lexa AI Chat
          </div>
          <div style={{ color: '#7C6FA0', fontSize: 12, marginTop: 2 }}>
            Conversational RAG powered by MongoDB Atlas + Gemini
          </div>
        </div>
        <button onClick={clearChat} style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '6px 14px',
          color: '#9CA3AF', fontSize: 12, cursor: 'pointer'
        }}>
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '78%',
              background: m.role === 'user'
                ? 'linear-gradient(135deg,#7C3AED,#A855F7)'
                : 'rgba(255,255,255,0.04)',
              border: m.role === 'assistant'
                ? '1px solid rgba(124,58,237,0.2)' : 'none',
              borderRadius: m.role === 'user'
                ? '18px 18px 4px 18px'
                : '18px 18px 18px 4px',
              padding: '14px 18px',
              color: '#FFFFFF', fontSize: 14, lineHeight: 1.7
            }}>
              {m.role === 'assistant' && (
                <div style={{
                  color: '#00ED64', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', marginBottom: 8
                }}>
                  LEXA AI
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>

              {m.sources?.length > 0 && (
                <div style={{
                  marginTop: 10, paddingTop: 10,
                  borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ color: '#7C6FA0', fontSize: 11, marginBottom: 6 }}>
                    Sources used:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {m.sources.map((s, j) => (
                      <span key={j} style={{
                        background: 'rgba(0,237,100,0.1)',
                        border: '1px solid rgba(0,237,100,0.25)',
                        borderRadius: 6, padding: '2px 10px',
                        fontSize: 11, color: '#00ED64'
                      }}>
                        [{j+1}] {s.title} ({s.score}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {m.latencyMs && (
                <div style={{ color: '#4B5563', fontSize: 10, marginTop: 6 }}>
                  {m.latencyMs}ms
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: '18px 18px 18px 4px',
              padding: '14px 20px'
            }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#A855F7',
                    animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite`
                  }} />
                ))}
                <span style={{ color: '#7C6FA0', fontSize: 12, marginLeft: 8 }}>
                  Searching documents...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 12, paddingTop: 16,
        borderTop: '1px solid rgba(255,255,255,0.08)'
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask anything about your uploaded documents..."
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 12, padding: '13px 18px',
            color: '#FFFFFF', fontSize: 14, outline: 'none',
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim()
              ? 'rgba(124,58,237,0.3)'
              : 'linear-gradient(135deg,#7C3AED,#A855F7)',
            border: 'none', borderRadius: 12,
            padding: '13px 22px', color: '#FFFFFF',
            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 14, transition: 'all 0.2s'
          }}
        >
          Send
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </main>
  )
}