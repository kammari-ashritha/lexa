import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

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

export default function BulkUpload({ onSuccess }) {
  const isLight = useTheme()
  const [files,    setFiles]    = useState([])
  const [category, setCategory] = useState('General')
  const [loading,  setLoading]  = useState(false)
  const [jobId,    setJobId]    = useState(null)
  const [progress, setProgress] = useState(null)
  const fileRef = useRef()

  const t = {
    bg:          isLight ? '#F7F6FB'           : 'rgba(255,255,255,0.03)',
    border:      isLight ? '1px solid #DDD8EF' : '1px solid rgba(124,58,237,0.2)',
    titleColor:  isLight ? '#0F172A'           : '#FFFFFF',
    subColor:    isLight ? '#475569'           : '#7C6FA0',
    dropBorder:  isLight ? '2px dashed #B8B0D8': '2px dashed rgba(124,58,237,0.4)',
    dropBg:      isLight ? '#FFFFFF'           : 'transparent',
    dropBgFill:  isLight ? '#EDE9FF'           : 'rgba(124,58,237,0.05)',
    dropTitle:   isLight ? '#0F172A'           : '#C4B5FD',
    dropSub:     isLight ? '#64748B'           : '#4B5563',
    fileRowBg:   isLight ? '#FFFFFF'           : 'rgba(255,255,255,0.03)',
    fileRowBdr:  isLight ? '1px solid #E8E4F4' : 'none',
    fileNameClr: isLight ? '#0F172A'           : '#E2D9F3',
    fileSizeClr: isLight ? '#64748B'           : '#4B5563',
    labelColor:  isLight ? '#374151'           : '#9CA3AF',
    selectBg:    isLight ? '#FFFFFF'           : 'rgba(255,255,255,0.05)',
    selectBdr:   isLight ? '1px solid #B8B0D8' : '1px solid rgba(124,58,237,0.3)',
    selectColor: isLight ? '#0F172A'           : '#FFFFFF',
    progressBg:  isLight ? '#E8E4F4'           : 'rgba(255,255,255,0.08)',
    progLabel:   isLight ? '#374151'           : '#9CA3AF',
  }

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).filter(f =>
      ['pdf','docx','txt'].includes(f.name.split('.').pop().toLowerCase())
    )
    if (selected.length !== e.target.files.length) toast.error('Only PDF, DOCX, TXT files allowed')
    setFiles(selected)
  }

  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })

  const handleUpload = async () => {
    if (files.length === 0) { toast.error('Select files first'); return }
    setLoading(true)
    try {
      const fileData = await Promise.all(files.map(async (f) => ({
        filename: f.name, title: f.name.replace(/\.[^/.]+$/, ''),
        content_b64: await toBase64(f), category, tags: [category.toLowerCase()]
      })))
      const res = await axios.post(`${API}/documents/bulk`, { files: fileData })
      pollJob(res.data.jobId)
    } catch(e) {
      toast.error('Upload failed: ' + (e.response?.data?.error || e.message))
      setLoading(false)
    }
  }

  const pollJob = (jid) => {
    setJobId(jid)
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/documents/job/${jid}`)
        const job = res.data
        setProgress(job)
        if (job.status === 'done' || job.status === 'failed') {
          clearInterval(interval); setLoading(false)
          if (job.status === 'done') {
            toast.success(`Uploaded ${job.processed} files successfully!`)
            onSuccess?.(); setFiles([]); setProgress(null); setJobId(null)
          } else { toast.error('Some files failed.') }
        }
      } catch { clearInterval(interval); setLoading(false) }
    }, 2000)
  }

  const percent = progress ? Math.round((progress.processed / progress.total) * 100) : 0

  return (
    <div style={{ background: t.bg, border: t.border, borderRadius: 16, padding: 28, boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.05)' : 'none' }}>
      <div style={{ color: t.titleColor, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Bulk Upload</div>
      <div style={{ color: t.subColor, fontSize: 13, marginBottom: 24 }}>
        Upload multiple PDF, DOCX, or TXT files at once. Each file will be chunked and embedded automatically.
      </div>

      <div onClick={() => fileRef.current?.click()} style={{
        border: t.dropBorder, borderRadius: 12, padding: '32px 24px',
        textAlign: 'center', cursor: 'pointer', marginBottom: 20,
        background: files.length > 0 ? t.dropBgFill : t.dropBg, transition: 'all 0.2s'
      }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>📁</div>
        <div style={{ color: t.dropTitle, fontSize: 14, fontWeight: 600 }}>
          {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Click to select files'}
        </div>
        <div style={{ color: t.dropSub, fontSize: 12, marginTop: 4 }}>PDF, DOCX, TXT supported</div>
        <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt" onChange={handleFiles} style={{ display: 'none' }} />
      </div>

      {files.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.fileRowBg, border: t.fileRowBdr, borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
              <span style={{ color: t.fileNameClr, fontSize: 13 }}>📄 {f.name}</span>
              <span style={{ color: t.fileSizeClr, fontSize: 11 }}>{(f.size / 1024).toFixed(1)} KB</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={{ color: t.labelColor, fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', background: t.selectBg, border: t.selectBdr, borderRadius: 8, padding: '10px 14px', color: t.selectColor, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}>
          {['General','HR','Finance','Technology','Medical','Legal','Research'].map(c => (
            <option key={c} value={c} style={{ background: isLight ? '#FFFFFF' : '#1A003A', color: isLight ? '#0F172A' : '#FFFFFF' }}>{c}</option>
          ))}
        </select>
      </div>

      {progress && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: t.progLabel, fontSize: 12, marginBottom: 6 }}>
            <span>Processing {progress.processed} / {progress.total} files...</span>
            <span style={{ fontWeight: 600 }}>{percent}%</span>
          </div>
          <div style={{ height: 8, background: t.progressBg, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg,#7C3AED,#00ED64)', borderRadius: 4, transition: 'width 0.4s ease' }} />
          </div>
          {progress.errors?.length > 0 && progress.errors.map((e, i) => (
            <div key={i} style={{ color: '#DC2626', fontSize: 11, marginTop: 6 }}>⚠ {e}</div>
          ))}
        </div>
      )}

      <button onClick={handleUpload} disabled={loading || files.length === 0} style={{
        width: '100%', padding: '13px',
        background: loading || files.length === 0
          ? (isLight ? '#DDD8EF' : 'rgba(124,58,237,0.3)')
          : 'linear-gradient(135deg,#7C3AED,#6D28D9)',
        border: 'none', borderRadius: 10,
        color: loading || files.length === 0 ? (isLight ? '#9490A8' : 'rgba(255,255,255,0.4)') : '#FFFFFF',
        fontSize: 15, fontWeight: 700,
        cursor: loading || files.length === 0 ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', transition: 'all 0.2s',
        boxShadow: loading || files.length === 0 ? 'none' : '0 4px 14px rgba(109,40,217,0.35)'
      }}>
        {loading ? `Processing... ${percent}%` : `Upload ${files.length > 0 ? files.length + ' ' : ''}File${files.length !== 1 ? 's' : ''}`}
      </button>
    </div>
  )
}