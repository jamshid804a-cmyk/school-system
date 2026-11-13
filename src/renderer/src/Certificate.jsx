import { useEffect, useMemo, useRef, useState } from 'react'

/* ============================================================ SHARED HELPERS */
const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100'
const label = 'mb-1 block text-xs font-semibold text-slate-600'
const btnPrimary = 'rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-40'
const btnGhost = 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'

const safeImgSrc = (s) => {
  const v = String(s || '')
  return /^data:image\//i.test(v) || /^https?:\/\//i.test(v) ? v : ''
}

const PAGE_PX = { A4: [794, 1123], A5: [559, 794], Legal: [816, 1344] }

function resizeImage(file, max = 900) {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => {
      const img = new Image()
      img.onload = () => {
        const sc = Math.min(max / img.width, max / img.height, 1)
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * sc)
        c.height = Math.round(img.height * sc)
        const ctx = c.getContext('2d')
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, c.width, c.height)
        ctx.drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.85))
      }
      img.src = r.result
    }
    r.readAsDataURL(file)
  })
}

async function fetchSchool() {
  const api = window.api || {}
  const tries = ['getSchool', 'getSchoolProfile', 'getSchoolInfo', 'getSettings', 'getSchoolSettings']
  for (const fn of tries) {
    if (typeof api[fn] !== 'function') continue
    try {
      const r = await api[fn]()
      const s = r?.school || r?.settings || r
      if (s && typeof s === 'object') {
        const out = {
          name: s.name || s.school_name || s.schoolName || '',
          address: s.address || s.school_address || s.schoolAddress || '',
          logo: s.logo || s.school_logo || s.logo_data || s.logoUrl || ''
        }
        if (out.name || out.logo) return out
      }
    } catch {}
  }
  const w = window.__SCHOOL__
  if (w) return { name: w.name || '', address: w.address || '', logo: w.logo || '' }
  return { name: '', address: '', logo: '' }
}

/* ============================================================ LOCAL QR CODE GENERATOR */
async function generateQR(text) {
  try {
    const { default: QRCode } = await import('qrcode')
    return await QRCode.toString(text, { type: 'svg', margin: 2, width: 400, color: { dark: '#000000', light: '#ffffff' } })
  } catch (err) {
    console.error('QR generation failed:', err)
    return `<div style="font-size:10px;color:#ef4444;text-align:center;padding:10px;">QR Error<br/>Install 'qrcode'</div>`
  }
}

/* ============================================================ DESIGN DATA */
const THEMES = [
  { id: 'emerald', name: 'Emerald', ink: '#0f5132', accent: '#b8892b', paper: '#fdfbf3', paper2: '#f1ead4' },
  { id: 'navy', name: 'Navy', ink: '#1b2f5b', accent: '#b08d3c', paper: '#fcfcfe', paper2: '#e8ecf5' },
  { id: 'maroon', name: 'Maroon', ink: '#6d1a2b', accent: '#b8892b', paper: '#fdf9f4', paper2: '#f2e2d3' },
  { id: 'royal', name: 'Royal purple', ink: '#43286e', accent: '#b8892b', paper: '#fcfaff', paper2: '#ece4f6' },
  { id: 'ocean', name: 'Ocean', ink: '#0b5563', accent: '#c08a2e', paper: '#fbfefe', paper2: '#dcedf0' },
  { id: 'graphite', name: 'Graphite', ink: '#1f2937', accent: '#9a7b3f', paper: '#fdfdfc', paper2: '#e9e7e1' }
]

const CERT_TYPES = ['Character Certificate', 'Leaving Certificate', 'Completion Certificate', 'Merit Certificate', 'Participation Certificate']

const DEFAULT_REMARKS = {
  'Character Certificate': 'He/She bears a good moral character and has shown excellent conduct throughout his/her stay at this school.',
  'Leaving Certificate': 'This is to certify that the student has left the school. All dues have been cleared.',
  'Completion Certificate': 'He/She has successfully completed the course of study for the class mentioned above.',
  'Merit Certificate': 'is awarded this certificate in recognition of outstanding academic performance and hard work.',
  'Participation Certificate': 'has actively participated and shown a commendable spirit in the school activity.'
}

const PREAMBLE = {
  'Merit Certificate': 'This certificate is proudly presented to',
  'Participation Certificate': 'This certificate is proudly presented to'
}

const EMPTY_CERT = {
  type: 'Character Certificate',
  theme: 'emerald',
  bgType: 'color',
  bgImage: '',
  bgOpacity: 0.15,
  showQr: true,
  showSeal: true,
  schoolName: 'Green Valley High School',
  schoolAddress: '123 Education Lane, Knowledge City',
  schoolLogo: '',
  studentName: '',
  relation: 'Son of',
  fatherName: '',
  className: 'Class 10',
  section: 'A',
  rollNo: '',
  dob: '',
  date: new Date().toISOString().split('T')[0],
  remarks: DEFAULT_REMARKS['Character Certificate'],
  principalName: 'Dr. Jane Smith',
  principalSign: '',
  leavingDate: new Date().toISOString().split('T')[0],
  leavingReason: 'Completed Studies',
  leavingAcademic: 'Excellent',
  leavingCharacter: 'Good',
  leavingDues: 'Cleared'
}

/* ============================================================ MAIN EXPORT */
export default function Certificate() {
  return (
    <div className="p-4 bg-slate-50 min-h-screen">
      <CertificateEditor />
    </div>
  )
}

/* ============================================================ SMALL UI PIECES */
function Seg({ title, value, onChange, items }) {
  return (
    <div>
      <div className={label}>{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map(([k, l]) => (
          <button key={String(k)} type="button" onClick={() => onChange(k)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${value === k ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

function Toggle({ text, checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
      <span>{text}</span>
      <span className={`h-5 w-9 rounded-full p-0.5 transition ${checked ? 'bg-teal-600' : 'bg-slate-300'}`}>
        <span className={`block h-4 w-4 rounded-full bg-white shadow transition ${checked ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  )
}

function Section({ title, hint, children }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <div className="text-sm font-bold text-slate-900">{title}</div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </div>
      {children}
    </div>
  )
}

/* ============================================================ CERTIFICATE EDITOR */
function CertificateEditor() {
  const [cert, setCert] = useState(EMPTY_CERT)
  const [showEditor, setShowEditor] = useState(false)
  const [tab, setTab] = useState('student')
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)
  const toastTimer = useRef(null)

  const notify = (msg, tone = 'ok') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, tone })
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  useEffect(() => {
    fetchSchool().then((s) => {
      setCert((prev) => ({
        ...prev,
        schoolName: s.name || prev.schoolName,
        schoolAddress: s.address || prev.schoolAddress,
        schoolLogo: s.logo || prev.schoolLogo
      }))
    })
  }, [])

  const set = (k, v) => setCert((prev) => ({ ...prev, [k]: v }))
  const bind = (k) => ({ value: cert[k], onChange: (e) => set(k, e.target.value) })

  const changeType = (type) => {
    setCert((prev) => ({ ...prev, type, remarks: DEFAULT_REMARKS[type] || prev.remarks }))
  }

  const pickLogo = async (e) => { const f = e.target.files[0]; if (f) set('schoolLogo', await resizeImage(f, 300)) }
  const pickBg = async (e) => { const f = e.target.files[0]; if (f) set('bgImage', await resizeImage(f, 1400)) }
  const pickSign = async (e) => { const f = e.target.files[0]; if (f) set('principalSign', await resizeImage(f, 400)) }

  const qrText = useMemo(() => {
    const parts = [
      `School: ${cert.schoolName || '-'}`,
      `Student: ${cert.studentName || '-'}`,
      `Father: ${cert.fatherName || '-'}`,
      `Class: ${cert.className || '-'} ${cert.section ? '- ' + cert.section : ''}`,
      `Roll No: ${cert.rollNo || '-'}`,
      `Type: ${cert.type}`,
      `Date: ${cert.type === 'Leaving Certificate' ? cert.leavingDate : cert.date}`
    ]
    if (cert.type === 'Leaving Certificate') {
      parts.push(`Reason: ${cert.leavingReason}`)
    }
    return parts.join('\n')
  }, [cert])

  const [qrSvg, setQrSvg] = useState('')
  
  useEffect(() => {
    let active = true
    generateQR(qrText).then(svg => {
      if (active) setQrSvg(svg)
    })
    return () => { active = false }
  }, [qrText])

  const html = useMemo(() => buildCertificateHtml(cert, qrSvg), [cert, qrSvg])
  const [previewHtml, setPreviewHtml] = useState(html)
  useEffect(() => {
    const t = setTimeout(() => setPreviewHtml(html), 300)
    return () => clearTimeout(t)
  }, [html])

  const printNow = () => {
    if (!cert.studentName.trim()) return notify('Enter the student name first', 'error')
    const f = document.createElement('iframe')
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
    f.srcdoc = html
    f.onload = async () => {
      const win = f.contentWindow
      try { await win.document.fonts?.ready } catch {}
      const imgs = Array.from(win.document.images || [])
      await Promise.all(imgs.map((img) => img.complete ? 0 : new Promise((r) => { img.onload = img.onerror = r })))
      try {
        win.focus(); win.print()
        win.addEventListener('afterprint', () => f.remove(), { once: true })
      } catch {
        notify('Print failed', 'error')
        f.remove()
      }
    }
    document.body.appendChild(f)
  }

  const saveCertificate = async () => {
    if (!cert.studentName.trim()) return notify('Enter the student name first', 'error')
    setBusy(true)
    try {
      const api = window.api
      if (!api?.addCertificate) throw new Error('API not ready')
      
      await api.addCertificate(cert)
      notify('Certificate saved successfully!')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold text-slate-900 text-lg">Certificates</div>
          <div className="text-xs text-slate-500">{cert.type} · {cert.studentName || 'No student name'}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowEditor(!showEditor)} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${showEditor ? 'bg-slate-200 text-slate-700' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}>
            {showEditor ? '✕ Close Editor' : '✏️ Edit Details'}
          </button>
          <button onClick={saveCertificate} disabled={busy} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50">
            💾 {busy ? 'Saving...' : 'Save'}
          </button>
          <button onClick={printNow} className={btnPrimary}>🖨️ Print certificate</button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 transition-all duration-300 ${showEditor ? 'lg:grid-cols-[minmax(380px,4fr)_8fr]' : 'grid-cols-1'}`}>
        
        {/* LEFT: EDITOR PANEL */}
        {showEditor && (
          <div className="space-y-3">
            <div className="flex rounded-lg bg-slate-200/70 p-1 mb-2">
              {[['student', '1. Student'], ['school', '2. School & sign'], ['design', '3. Design']].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${tab === k ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                  {l}
                </button>
              ))}
            </div>

            {tab === 'student' && (
              <>
                <Section title="Certificate Type">
                  <label className="block">
                    <span className={label}>Type</span>
                    <select className={field} value={cert.type} onChange={(e) => changeType(e.target.value)}>
                      {CERT_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                </Section>

                <Section title="Student Information">
                  <label className="block">
                    <span className={label}>Student name *</span>
                    <input className={field} {...bind('studentName')} placeholder="Full name" />
                  </label>
                  <div className="grid grid-cols-[130px_1fr] gap-3">
                    <label className="block">
                      <span className={label}>Relation</span>
                      <select className={field} {...bind('relation')}>
                        <option>Son of</option>
                        <option>Daughter of</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={label}>Father name</span>
                      <input className={field} {...bind('fatherName')} />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="block">
                      <span className={label}>Class</span>
                      <input className={field} {...bind('className')} />
                    </label>
                    <label className="block">
                      <span className={label}>Section</span>
                      <input className={field} {...bind('section')} />
                    </label>
                    <label className="block">
                      <span className={label}>Roll no</span>
                      <input className={field} {...bind('rollNo')} />
                    </label>
                  </div>
                  <label className="block">
                    <span className={label}>Date of birth (leave empty to hide)</span>
                    <input type="date" className={field} {...bind('dob')} />
                  </label>
                </Section>

                {cert.type === 'Leaving Certificate' && (
                  <Section title="Leaving Details" hint="Specific details required for School Leaving Certificate">
                    <label className="block">
                      <span className={label}>Date of Leaving</span>
                      <input type="date" className={field} {...bind('leavingDate')} />
                    </label>
                    <label className="block">
                      <span className={label}>Reason for Leaving</span>
                      <select className={field} {...bind('leavingReason')}>
                        <option>Completed Studies</option>
                        <option>Transfer to another school</option>
                        <option>Relocation / Family moved</option>
                        <option>Health Issues</option>
                        <option>Financial Constraints</option>
                        <option>Other</option>
                      </select>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className={label}>Academic Performance</span>
                        <select className={field} {...bind('leavingAcademic')}>
                          <option>Excellent</option>
                          <option>Very Good</option>
                          <option>Good</option>
                          <option>Average</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className={label}>Character / Conduct</span>
                        <select className={field} {...bind('leavingCharacter')}>
                          <option>Excellent</option>
                          <option>Good</option>
                          <option>Fair</option>
                        </select>
                      </label>
                    </div>
                    <label className="block">
                      <span className={label}>School Dues</span>
                      <select className={field} {...bind('leavingDues')}>
                        <option>Cleared</option>
                        <option>Outstanding</option>
                      </select>
                    </label>
                  </Section>
                )}

                <Section title="Remarks">
                  <label className="block">
                    <span className={label}>Closing text / remarks</span>
                    <textarea rows={3} className={field} {...bind('remarks')} />
                  </label>
                </Section>
              </>
            )}

            {tab === 'school' && (
              <>
                <Section title="School Information" hint="Loaded from your school profile.">
                  <label className="block">
                    <span className={label}>School name</span>
                    <input className={field} {...bind('schoolName')} />
                  </label>
                  <label className="block">
                    <span className={label}>Address</span>
                    <input className={field} {...bind('schoolAddress')} />
                  </label>
                  <div className="flex items-center gap-3">
                    {cert.schoolLogo
                      ? <img src={cert.schoolLogo} alt="" className="h-14 w-14 rounded border border-slate-200 bg-white object-contain" />
                      : <div className="flex h-14 w-14 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">Logo</div>}
                    <label className={`${btnGhost} cursor-pointer py-1.5 text-xs`}>
                      Upload logo<input type="file" accept="image/*" className="hidden" onChange={pickLogo} />
                    </label>
                    {cert.schoolLogo && <button onClick={() => set('schoolLogo', '')} className="text-xs font-semibold text-rose-600 underline">Remove</button>}
                  </div>
                </Section>

                <Section title="Principal Signature">
                  <label className="block">
                    <span className={label}>Principal name</span>
                    <input className={field} {...bind('principalName')} />
                  </label>
                  <div className="flex items-center gap-3">
                    {cert.principalSign
                      ? <img src={cert.principalSign} alt="" className="h-14 w-28 rounded border border-slate-200 bg-white object-contain" />
                      : <div className="flex h-14 w-28 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">Signature</div>}
                    <label className={`${btnGhost} cursor-pointer py-1.5 text-xs`}>
                      Upload signature<input type="file" accept="image/*" className="hidden" onChange={pickSign} />
                    </label>
                    {cert.principalSign && <button onClick={() => set('principalSign', '')} className="text-xs font-semibold text-rose-600 underline">Remove</button>}
                  </div>
                </Section>
              </>
            )}

            {tab === 'design' && (
              <>
                <Section title="Colour Theme">
                  <div className="grid grid-cols-3 gap-2">
                    {THEMES.map((t) => (
                      <button key={t.id} type="button" onClick={() => set('theme', t.id)}
                        className={`rounded-lg border-2 p-2 text-left transition ${cert.theme === t.id ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className="h-11 rounded-sm"
                          style={{
                            background: `linear-gradient(135deg, ${t.paper}, ${t.paper2})`,
                            border: `2px solid ${t.ink}`,
                            boxShadow: `inset 0 0 0 3px ${t.paper}, inset 0 0 0 4px ${t.accent}`
                          }} />
                        <div className="mt-1.5 text-xs font-semibold text-slate-700">{t.name}</div>
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Background">
                  <Seg title="Page" value={cert.bgType} onChange={(v) => set('bgType', v)}
                    items={[['color', 'Plain paper'], ['image', 'Custom image']]} />
                  {cert.bgType === 'image' && (
                    <div className="space-y-2">
                      <label className={`${btnGhost} flex cursor-pointer items-center justify-center py-2 text-xs`}>
                        {cert.bgImage ? 'Change background image' : 'Upload background image'}
                        <input type="file" accept="image/*" className="hidden" onChange={pickBg} />
                      </label>
                      <label className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                        Strength
                        <input type="range" min="0.05" max="1" step="0.05" value={cert.bgOpacity}
                          onChange={(e) => set('bgOpacity', Number(e.target.value))} className="flex-1 accent-teal-700" />
                        <span className="w-9 text-right">{Math.round(cert.bgOpacity * 100)}%</span>
                      </label>
                    </div>
                  )}
                </Section>

                <Section title="Extras">
                  <Toggle text="Official seal" checked={cert.showSeal} onChange={(v) => set('showSeal', v)} />
                  <Toggle text="Verification QR code" checked={cert.showQr} onChange={(v) => set('showQr', v)} />
                  <p className="text-xs text-slate-500">The QR code is generated instantly.</p>
                </Section>
              </>
            )}
          </div>
        )}

        {/* RIGHT: LIVE PREVIEW */}
        <Preview html={previewHtml} pageSize="A4" landscape />
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-xl ${toast.tone === 'error' ? 'bg-rose-600' : 'bg-slate-900'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

/* ============================================================ PREVIEW */
function Preview({ html, pageSize, landscape }) {
  const wrap = useRef(null)
  const frame = useRef(null)
  const roRef = useRef(null)
  const [scale, setScale] = useState(0.95)
  const [h, setH] = useState(800)
  const [pw, ph] = landscape ? [...PAGE_PX[pageSize]].reverse() : PAGE_PX[pageSize]

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const calc = () => setScale(Math.min(1, (el.clientWidth - 24) / pw))
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [pw])

  useEffect(() => () => roRef.current?.disconnect(), [])

  const onLoad = () => {
    try {
      const doc = frame.current.contentDocument
      const measure = () => setH(Math.max(ph, doc.body.offsetHeight))
      measure()
      roRef.current?.disconnect()
      roRef.current = new ResizeObserver(measure)
      roRef.current.observe(doc.body)
    } catch {}
  }

  return (
    <div className="lg:sticky lg:top-4 lg:self-start w-full overflow-hidden">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-200/60 shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">
          <span>Live preview · {pageSize} {landscape ? 'landscape' : 'portrait'}</span>
          <span>{Math.round(scale * 100)}%</span>
        </div>
        <div ref={wrap} className="max-h-[calc(100vh-170px)] overflow-y-auto overflow-x-hidden p-3 flex justify-center">
          <div style={{ width: pw * scale, height: h * scale, margin: '0 auto', overflow: 'hidden' }}>
            <iframe ref={frame} title="Preview" srcDoc={html} onLoad={onLoad} scrolling="no"
              style={{ width: pw, height: h, border: 0, display: 'block', overflow: 'hidden', background: '#fff', transform: `scale(${scale})`, transformOrigin: 'top left', boxShadow: '0 4px 24px rgba(0,0,0,.18)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================ CERTIFICATE HTML */
function buildCertificateHtml(cert, qrSvg) {
  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const T = THEMES.find((t) => t.id === cert.theme) || THEMES[0]

  const fmtDate = (s, long = true) => {
    if (!s) return ''
    const [y, m, d] = String(s).split('-').map(Number)
    if (!y || !m || !d) return ''
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', long ? { day: 'numeric', month: 'long', year: 'numeric' } : undefined)
  }

  const words = String(cert.type || 'Certificate').trim().split(/\s+/)
  const kind = words.length > 1 ? words.slice(0, -1).join(' ') : ''
  const main = words[words.length - 1] || 'Certificate'

  const initials = (String(cert.schoolName || '').match(/\b[A-Za-z]/g) || ['S']).slice(0, 2).join('').toUpperCase()
  const preamble = PREAMBLE[cert.type] || 'This is to certify that'
  const nameSize = String(cert.studentName || '').length > 28 ? 38 : String(cert.studentName || '').length > 20 ? 46 : 56

  const classLabel = `${esc(cert.className)}${cert.section ? ' – ' + esc(cert.section) : ''}`
  const detailParts = []
  if (cert.fatherName) detailParts.push(`${esc(cert.relation || 'Son of')} <b>${esc(cert.fatherName)}</b>`)
  if (cert.className) detailParts.push(`a student of <b>${classLabel}</b>`)
  if (cert.rollNo) detailParts.push(`Roll No. <b>${esc(cert.rollNo)}</b>`)
  if (cert.dob) detailParts.push(`born on <b>${fmtDate(cert.dob)}</b>`)
  const detailLine = detailParts.length ? detailParts.join(', ') + '.' : ''

  const isLeaving = cert.type === 'Leaving Certificate'

  let bodyContent = ''
  if (isLeaving) {
    bodyContent = `
      <div class="pre">${esc(preamble)}</div>
      <div class="name" style="margin-bottom: 20px;">${esc(cert.studentName) || '—'}</div>
      ${detailLine ? `<div class="detail" style="margin-bottom: 20px; font-family:'Figtree','Segoe UI',Arial,sans-serif">${detailLine}</div>` : ''}
      
      <table class="slc-table">
        <tr>
          <td class="slc-label">Date of Leaving</td>
          <td class="slc-val"><b>${fmtDate(cert.leavingDate || cert.date) || '—'}</b></td>
          <td class="slc-label">Reason for Leaving</td>
          <td class="slc-val"><b>${esc(cert.leavingReason) || '—'}</b></td>
        </tr>
        <tr>
          <td class="slc-label">Academic Performance</td>
          <td class="slc-val"><b>${esc(cert.leavingAcademic) || '—'}</b></td>
          <td class="slc-label">Character / Conduct</td>
          <td class="slc-val"><b>${esc(cert.leavingCharacter) || '—'}</b></td>
        </tr>
        <tr>
          <td class="slc-label">School Dues</td>
          <td class="slc-val" colspan="3"><b style="color: ${cert.leavingDues === 'Cleared' ? '#059669' : '#e11d48'}">${esc(cert.leavingDues) || '—'}</b></td>
        </tr>
      </table>

      ${cert.remarks ? `<div class="remarks" style="margin-top: 20px;">${esc(cert.remarks).replace(/\n/g, '<br/>')}</div>` : ''}
    `
  } else {
    bodyContent = `
      <div class="pre">${esc(preamble)}</div>
      <div class="name">${esc(cert.studentName) || '—'}</div>
      ${detailLine ? `<div class="detail" style="font-family:'Figtree','Segoe UI',Arial,sans-serif">${detailLine}</div>` : ''}
      ${cert.remarks ? `<div class="remarks">${esc(cert.remarks).replace(/\n/g, '<br/>')}</div>` : ''}
    `
  }

  const sealSvg = () => {
    const pts = []
    const N = 36
    for (let i = 0; i < N * 2; i++) {
      const a = (Math.PI * i) / N
      const r = i % 2 ? 41 : 48
      pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`)
    }
    return `<svg viewBox="0 0 100 100" width="92" height="92" xmlns="http://www.w3.org/2000/svg">
      <polygon points="${pts.join(' ')}" fill="${T.accent}"/>
      <circle cx="50" cy="50" r="37" fill="none" stroke="#fff" stroke-width="1.4" opacity=".8"/>
      <circle cx="50" cy="50" r="32" fill="${T.ink}"/>
      <circle cx="50" cy="50" r="28" fill="none" stroke="${T.accent}" stroke-width=".9"/>
      <text x="50" y="59" text-anchor="middle" font-family="'Cormorant Garamond', Georgia, serif" font-size="26" font-weight="700" fill="#fff">${esc(initials)}</text>
    </svg>`
  }

  const cornerSvg = (pos) => `<svg class="corner ${pos}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 58 V16 Q2 2 16 2 H58" fill="none" stroke="${T.accent}" stroke-width="2.4"/>
      <path d="M9 58 V21 Q9 9 21 9 H58" fill="none" stroke="${T.accent}" stroke-width=".9"/>
      <circle cx="17" cy="17" r="3" fill="${T.accent}"/>
    </svg>`

  const hasBgImage = cert.bgType === 'image' && cert.bgImage
  const logoSrc = safeImgSrc(cert.schoolLogo)

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(cert.type)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500;1,600&family=Figtree:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  @media screen { html { overflow: hidden; } }
  body { width: 297mm; height: 210mm; font-family: 'Figtree', 'Segoe UI', Arial, sans-serif; color: #2b2f36; }
  .serif { font-family: 'Cormorant Garamond', 'Palatino Linotype', 'Book Antiqua', Georgia, serif; }

  .sheet {
    position: relative; width: 297mm; height: 210mm; overflow: hidden;
    background: radial-gradient(ellipse at 50% 42%, ${T.paper} 0%, ${T.paper} 45%, ${T.paper2} 100%);
  }
  .bg-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: ${Number(cert.bgOpacity) || 0.15}; z-index: 0; }
  .watermark { position: absolute; left: 50%; top: 50%; width: 100mm; height: 100mm; object-fit: contain; transform: translate(-50%, -50%); opacity: .055; filter: grayscale(1); z-index: 0; }

  .frame-outer { position: absolute; inset: 7mm; border: 2.6px solid ${T.ink}; z-index: 1; }
  .frame-inner { position: absolute; inset: 10.5mm; border: 1px solid ${T.accent}; z-index: 1; }
  .corner { position: absolute; width: 21mm; height: 21mm; z-index: 2; }
  .corner.tl { top: 7mm; left: 7mm; }
  .corner.tr { top: 7mm; right: 7mm; transform: scaleX(-1); }
  .corner.bl { bottom: 7mm; left: 7mm; transform: scaleY(-1); }
  .corner.br { bottom: 7mm; right: 7mm; transform: scale(-1, -1); }

  .content {
    position: absolute; inset: 15mm 26mm 14mm; z-index: 3;
    display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center;
  }

  .school { display: flex; flex-direction: column; align-items: center; }
  .school img { height: 52px; max-width: 160px; object-fit: contain; margin-bottom: 6px; }
  .school h1 { margin: 0; font-size: 27px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: ${T.ink}; line-height: 1.15; }
  .school p { margin: 4px 0 0; font-size: 11.5px; letter-spacing: .06em; color: #5b616b; }

  .title { display: flex; flex-direction: column; align-items: center; }
  .kind { font-size: 13px; font-weight: 700; letter-spacing: .5em; text-transform: uppercase; color: ${T.accent}; margin-bottom: 2px; padding-left: .5em; }
  .main { font-size: 62px; font-weight: 700; line-height: 1; color: ${T.ink}; letter-spacing: .01em; }
  .divider { display: flex; align-items: center; gap: 10px; width: 300px; margin-top: 10px; }
  .divider i { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, ${T.accent}); }
  .divider i:last-child { background: linear-gradient(270deg, transparent, ${T.accent}); }
  .divider b { width: 7px; height: 7px; background: ${T.accent}; transform: rotate(45deg); }

  .body { display: flex; flex-direction: column; align-items: center; width: 100%; flex: 1; justify-content: center; }
  .pre { font-size: 20px; font-style: italic; color: #5b616b; }
  .name { margin-top: 4px; font-size: ${nameSize}px; font-weight: 600; font-style: italic; line-height: 1.12; color: ${T.ink}; padding: 0 28px 2px; border-bottom: 1px solid ${T.accent}; min-width: 55%; }
  .detail { margin-top: 12px; max-width: 86%; font-size: 15.5px; line-height: 1.7; color: #3a3f47; }
  .detail b { color: #111827; font-weight: 700; }
  .remarks { margin-top: 8px; max-width: 80%; font-size: 21px; line-height: 1.4; font-style: italic; color: #2f343c; }

  /* SLC Table */
  .slc-table { width: 85%; margin: 10px auto; border-collapse: collapse; text-align: left; font-family: 'Figtree','Segoe UI',Arial,sans-serif; }
  .slc-table td { border: 1px solid ${T.accent}55; padding: 8px 12px; font-size: 14px; }
  .slc-label { font-weight: 600; color: #6b7280; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; width: 22%; background: rgba(0,0,0,0.02); }
  .slc-val { color: #111827; width: 28%; font-size: 15px; }

  .footer { display: grid; grid-template-columns: 1fr auto 1fr; align-items: end; width: 100%; }
  .f-left { display: flex; align-items: flex-end; gap: 12px; justify-self: start; text-align: left; }
  .qr-svg { width: 110px; height: 110px; display: block; padding: 4px; background: #fff; border: 1px solid ${T.accent}; border-radius: 4px; }
  .qr-svg svg { width: 100%; height: 100%; }
  .lbl { font-size: 9.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #6b7280; }
  .dateval { font-size: 15px; font-weight: 700; color: #111827; margin: 2px 0 6px; }
  .f-mid { justify-self: center; }
  .f-right { justify-self: end; width: 210px; text-align: center; }
  .f-right img { display: block; margin: 0 auto 2px; height: 40px; max-width: 160px; object-fit: contain; }
  .sline { border-top: 1px solid ${T.ink}; margin-top: 4px; padding-top: 5px; }
  .sname { font-size: 14px; font-weight: 700; color: #111827; }
  .stitle { font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #6b7280; }
</style></head><body>
<div class="sheet">
  ${hasBgImage ? `<img class="bg-image" src="${safeImgSrc(cert.bgImage)}" alt=""/>` : ''}
  ${!hasBgImage && logoSrc ? `<img class="watermark" src="${logoSrc}" alt=""/>` : ''}
  <div class="frame-outer"></div>
  <div class="frame-inner"></div>
  ${cornerSvg('tl')}${cornerSvg('tr')}${cornerSvg('bl')}${cornerSvg('br')}

  <div class="content serif">
    <div class="school">
      ${logoSrc ? `<img src="${logoSrc}" alt=""/>` : ''}
      <h1>${esc(cert.schoolName) || 'School name'}</h1>
      ${cert.schoolAddress ? `<p style="font-family:'Figtree','Segoe UI',Arial,sans-serif">${esc(cert.schoolAddress)}</p>` : ''}
    </div>

    <div class="title">
      ${kind ? `<div class="kind" style="font-family:'Figtree','Segoe UI',Arial,sans-serif">${esc(kind)}</div>` : ''}
      <div class="main">${esc(main)}</div>
      <div class="divider"><i></i><b></b><i></i></div>
    </div>

    <div class="body">
      ${bodyContent}
    </div>

    <div class="footer" style="font-family:'Figtree','Segoe UI',Arial,sans-serif">
      <div class="f-left">
        ${cert.showQr && qrSvg ? `<div class="qr-svg">${qrSvg}</div>` : ''}
        <div>
          <div class="lbl">Date of issue</div>
          <div class="dateval">${esc(fmtDate(cert.date)) || '—'}</div>
          ${cert.showQr ? '<div class="lbl">Scan to verify</div>' : ''}
        </div>
      </div>
      <div class="f-mid">${cert.showSeal ? sealSvg() : ''}</div>
      <div class="f-right">
        ${cert.principalSign ? `<img src="${safeImgSrc(cert.principalSign)}" alt=""/>` : '<div style="height:42px"></div>'}
        <div class="sline">
          <div class="sname">${esc(cert.principalName)}</div>
          <div class="stitle">Principal</div>
        </div>
      </div>
    </div>
  </div>
</div>
</body></html>`
}