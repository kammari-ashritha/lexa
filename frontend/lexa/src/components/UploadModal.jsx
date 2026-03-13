import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const CATEGORIES = ['General','Technology','Finance','Healthcare','Legal','Science','Business','Education']

function useTheme() {
  const [isLight, setIsLight] = useState(() => document.body.classList.contains('light-mode'))
  useEffect(() => {
    const obs = new MutationObserver(() => setIsLight(document.body.classList.contains('light-mode')))
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isLight
}

export default function UploadModal({ onClose, onSuccess }) {
  const isLight = useTheme()
  const [title,    setTitle]    = useState('')
  const [content,  setContent]  = useState('')
  const [category, setCategory] = useState('General')
  const [tags,     setTags]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const t = {
    overlayBg:   isLight ? 'rgba(10,6,20,0.5)'   : 'rgba(0,0,0,0.7)',
    boxBg:       isLight ? '#FFFFFF'              : 'var(--bg-modal)',
    boxBdr:      isLight ? '1px solid #DDD8EF'    : '1px solid rgba(124,58,237,0.3)',
    boxShadow:   isLight ? '0 24px 80px rgba(0,0,0,0.15)' : '0 24px 80px rgba(0,0,0,0.7)',
    hdrBdr:      isLight ? '1px solid #E8E4F4'    : '1px solid rgba(255,255,255,0.06)',
    ftrBdr:      isLight ? '1px solid #E8E4F4'    : '1px solid rgba(255,255,255,0.06)',
    iconBg:      isLight ? '#EDE9FF'              : 'rgba(124,58,237,0.2)',
    iconColor:   isLight ? '#6D28D9'              : '#A78BFA',
    titleColor:  isLight ? '#0F172A'              : '#FFFFFF',
    subtitleClr: isLight ? '#475569'              : '#7C6FA0',
    closeColor:  isLight ? '#475569'              : '#7C6FA0',
    closeHoverBg:isLight ? '#EDE9FF'              : 'rgba(255,255,255,0.06)',
    labelColor:  isLight ? '#374151'              : '#9CA3AF',
    inputBg:     isLight ? '#FFFFFF'              : 'rgba(255,255,255,0.05)',
    inputBdr:    isLight ? '1px solid #B8B0D8'    : '1px solid rgba(124,58,237,0.25)',
    inputColor:  isLight ? '#0F172A'              : '#E2D9F3',
    inputPH:     isLight ? '#9490A8'              : '#4B5563',
    selectOptBg: isLight ? '#FFFFFF'              : '#1A003A',
    dropBdr:     isLight ? '2px dashed #B8B0D8'   : '2px dashed rgba(124,58,237,0.4)',
    dropBg:      isLight ? '#F7F6FB'              : 'transparent',
    dropActiveBg:isLight ? '#EDE9FF'              : 'rgba(124,58,237,0.07)',
    dropText:    isLight ? '#374151'              : '#9CA3AF',
    dropHighlight:isLight ? '#6D28D9'             : '#C4B5FD',
    textareaBg:  isLight ? '#FFFFFF'              : 'rgba(255,255,255,0.04)',
    textareaBdr: isLight ? '1px solid #B8B0D8'    : '1px solid rgba(124,58,237,0.2)',
    wordCountClr:isLight ? '#475569'              : '#7C6FA0',
  }

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      setContent(e.target.result)
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
    reader.readAsText(file)
    toast.success(`"${file.name}" loaded!`)
  }

  const submit = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Title and content are required'); return }
    setLoading(true)
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      const res = await axios.post(`${API_BASE}/documents/ingest`, { title: title.trim(), content: content.trim(), category, tags: tagList }, { timeout: 120000 })
      toast.success(`"${title}" ingested! ${res.data.chunks_created} chunks created.`)
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ingestion failed. Is Python service running?')
    } finally { setLoading(false) }
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length
  const chunkEst  = Math.max(1, Math.ceil(wordCount / 350))

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: t.overlayBg, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div style={{ background: t.boxBg, border: t.boxBdr, borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: t.boxShadow }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: t.hdrBdr }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: t.iconBg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.iconColor }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            </div>
            <div>
              <div style={{ color: t.titleColor, fontWeight: 700, fontSize: 16 }}>Upload Document</div>
              <div style={{ color: t.subtitleClr, fontSize: 12, marginTop: 2 }}>Will be chunked and vectorized automatically</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.closeColor, borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = t.closeHoverBg; e.currentTarget.style.color = t.titleColor }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = t.closeColor }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ color: t.labelColor, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Document Title *</div>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Annual Financial Report 2024" style={{ width: '100%', background: t.inputBg, border: t.inputBdr, borderRadius: 8, padding: '10px 14px', color: t.inputColor, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ color: t.labelColor, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Category</div>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', background: t.inputBg, border: t.inputBdr, borderRadius: 8, padding: '10px 14px', color: t.inputColor, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ background: t.selectOptBg, color: isLight ? '#0F172A' : '#FFFFFF' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color: t.labelColor, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Tags (comma separated)</div>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="AI, finance, 2024" style={{ width: '100%', background: t.inputBg, border: t.inputBdr, borderRadius: 8, padding: '10px 14px', color: t.inputColor, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <div style={{ color: t.labelColor, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Content *</div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current.click()}
              style={{ border: t.dropBdr, borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? t.dropActiveBg : t.dropBg, marginBottom: 10, transition: 'all 0.2s' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24,color:t.dropHighlight,margin:'0 auto 8px',display:'block'}}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <div style={{ color: t.dropText, fontSize: 13 }}>
                Drop a <span style={{ color: t.dropHighlight, fontWeight: 600 }}>.txt / .md</span> file here or <span style={{ color: t.dropHighlight, fontWeight: 600 }}>click to browse</span>
              </div>
              <input ref={fileRef} type="file" accept=".txt,.md,.csv" style={{display:'none'}} onChange={e => handleFile(e.target.files[0])} />
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Or paste your document content here..." rows={6} style={{ width: '100%', background: t.textareaBg, border: t.textareaBdr, borderRadius: 8, padding: '10px 14px', color: t.inputColor, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            {content && <div style={{ color: t.wordCountClr, fontSize: 11, marginTop: 4 }}>{wordCount.toLocaleString()} words · ~{chunkEst} chunk{chunkEst !== 1 ? 's' : ''} will be created</div>}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: t.ftrBdr }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: isLight ? '#F3F0FF' : 'rgba(255,255,255,0.06)', border: isLight ? '1px solid #DDD8EF' : '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: isLight ? '#3D3658' : 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Cancel</button>
          <button onClick={submit} disabled={loading || !title.trim() || !content.trim()} style={{
            padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700, cursor: loading || !title.trim() || !content.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
            background: loading || !title.trim() || !content.trim() ? (isLight ? '#DDD8EF' : 'rgba(124,58,237,0.3)') : 'linear-gradient(135deg,#7C3AED,#6D28D9)',
            color: loading || !title.trim() || !content.trim() ? (isLight ? '#9490A8' : 'rgba(255,255,255,0.4)') : '#FFFFFF',
            boxShadow: loading || !title.trim() || !content.trim() ? 'none' : '0 4px 14px rgba(109,40,217,0.35)',
          }}>
            {loading ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,animation:'spin 0.9s linear infinite'}}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Vectorizing...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Ingest Document
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}