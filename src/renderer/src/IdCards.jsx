import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'

const CLASSES = [
  'Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
]
const SECTIONS = ['A', 'B', 'C', 'D']

const currentSession = () => {
  const d = new Date()
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
  return `${y}-${y + 1}`
}

const STORAGE_KEY = 'school.filters.v1'
const loadFilters = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
const saveFilters = (f) => localStorage.setItem(STORAGE_KEY, JSON.stringify(f))
function usePersisted(key, initial) {
  const [value, setValue] = useState(() => {
    const all = loadFilters()
    return all[key] !== undefined ? all[key] : initial
  })
  useEffect(() => {
    const all = loadFilters()
    all[key] = value
    saveFilters(all)
  }, [key, value])
  return [value, setValue]
}

const filterCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'

function buildQrText({ brand, student }) {
  const lines = []
  if (brand.name) lines.push(brand.name)
  if (brand.address) lines.push(brand.address)
  lines.push('')
  lines.push('STUDENT INFO')
  lines.push(`Name: ${student.name}`)
  if (student.father_name) lines.push(`Father: ${student.father_name}`)
  if (student.father_occupation) lines.push(`Occupation: ${student.father_occupation}`)
  if (student.gender) lines.push(`Gender: ${student.gender}`)
  if (student.dob) lines.push(`DOB: ${student.dob}`)
  lines.push(`Class: ${student.class_name}${student.section ? '-' + student.section : ''}`)
  lines.push(`Session: ${student.session}`)
  if (student.roll_no) lines.push(`Roll: ${student.roll_no}`)
  if (student.admission_no) lines.push(`Admission: ${student.admission_no}`)
  if (student.admission_date) lines.push(`Admission Date: ${student.admission_date}`)
  if (student.blood_group) lines.push(`Blood: ${student.blood_group}`)
  if (student.phone) lines.push(`Phone: ${student.phone}`)
  if (student.emergency_number) lines.push(`Emergency: ${student.emergency_number}`)
  if (student.address) lines.push(`Address: ${student.address}`)
  if (student.previous_school) lines.push(`Prev. School: ${student.previous_school}`)
  return lines.join('\n')
}

const DEFAULT_DESIGN = {
  frontStyle: 'gradient',
  frontBg: '#4f46e5',
  frontBg2: '#7c3aed',
  frontImage: '',
  backStyle: 'gradient',
  backBg: '#0f172a',
  backBg2: '#334155',
  backImage: '',
  accent: '#6366f1',
  // Controls whether text on top of a colored/image card is light or dark
  frontText: 'light',   // 'light' | 'dark'
  backText: 'light'
}

/* ============================================================
   MAIN
   ============================================================ */
export default function IdCards({ students = [] }) {
  const cur = currentSession()
  const sessionsInData = useMemo(
    () => [...new Set(students.map((s) => s.session).filter(Boolean))].sort().reverse(),
    [students]
  )
  const [session, setSession] = usePersisted('idc_session', sessionsInData.includes(cur) ? cur : sessionsInData[0] || cur)
  const [classFilter, setClassFilter] = usePersisted('idc_class', CLASSES[2])
  const [sectionFilter, setSectionFilter] = usePersisted('idc_section', '')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [orientation, setOrientation] = usePersisted('idc_orient', 'landscape')
  const [overrides, setOverrides] = useState({})
  const [side, setSide] = useState('front')
  const [preview, setPreview] = useState(null)
  const [panel, setPanel] = useState(null) // 'edit' | 'design' | null

  const [design, setDesign] = usePersisted('idc_design', DEFAULT_DESIGN)

  const [brand, setBrand] = useState({
    name: 'School System', address: '', logo: '', phone: '', email: '', motto: ''
  })
  useEffect(() => {
    ;(async () => {
      try {
        const s = await window.api.getSettings()
        setBrand({
          name: s.schoolName || 'School System',
          address: s.schoolAddress || '',
          logo: s.logo || '',
          phone: s.schoolPhone || '',
          email: s.schoolEmail || '',
          motto: s.motto || ''
        })
      } catch {}
    })()
  }, [])

  const filtered = useMemo(() => {
    const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean)
    return students
      .filter((s) => {
        if (s.session !== session) return false
        if (classFilter && s.class_name !== classFilter) return false
        if (sectionFilter && s.section !== sectionFilter) return false
        if (words.length) {
          const text = [s.name, s.father_name, s.roll_no, s.admission_no].join(' ').toLowerCase()
          if (!words.every((w) => text.includes(w))) return false
        }
        return true
      })
      .sort((a, b) => {
        const ra = parseInt(a.roll_no, 10)
        const rb = parseInt(b.roll_no, 10)
        if (!isNaN(ra) && !isNaN(rb) && ra !== rb) return ra - rb
        return String(a.name).localeCompare(String(b.name))
      })
  }, [students, session, classFilter, sectionFilter, search])

  const baseStudent = filtered.find((s) => s.id === selectedId) || null
  const student = useMemo(() => {
    if (!baseStudent) return null
    return { ...baseStudent, ...overrides }
  }, [baseStudent, overrides])

  useEffect(() => {
    setOverrides({})
    setPanel(null)
    setSide('front')
  }, [selectedId])

  const [qrUrl, setQrUrl] = useState('')
  useEffect(() => {
    if (!student) { setQrUrl(''); return }
    let alive = true
    const text = buildQrText({ brand, student })
    QRCode.toDataURL(text, {
      width: 280, margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' }
    })
      .then((url) => { if (alive) setQrUrl(url) })
      .catch(() => { if (alive) setQrUrl('') })
    return () => { alive = false }
  }, [student, brand])

  const set = (k) => (e) => setOverrides((o) => ({ ...o, [k]: e.target.value }))

  const openPrint = (which) => {
    if (!student) return
    const html = buildPrintHtml({
      brand, student, qrUrl,
      className: student.class_name,
      section: student.section,
      orientation,
      side: which,
      design
    })
    setPreview({ html, side: which })
  }

  const cardDims = orientation === 'landscape' ? { w: 360, h: 226 } : { w: 226, h: 360 }

  const setD = (k, v) => setDesign((d) => ({ ...d, [k]: v }))

  const pickBgImage = (key) => (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 900
        const scale = Math.min(max / img.width, max / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        setD(key, canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }
  const resetDesign = () => setDesign(DEFAULT_DESIGN)

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl backdrop-blur">🪪</div>
            <div>
              <h1 className="text-xl font-extrabold">ID Cards</h1>
              <p className="text-xs text-white/70">Generate, customise and print student ID cards</p>
            </div>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            {filtered.length} students
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Session</span>
            <select className={filterCls} value={session} onChange={(e) => { setSession(e.target.value); setSelectedId(null) }}>
              {(sessionsInData.length ? sessionsInData : [cur]).map((s) => (<option key={s}>{s}</option>))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Class</span>
            <select className={filterCls} value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setSelectedId(null) }}>
              {CLASSES.map((c) => (<option key={c}>{c}</option>))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Section</span>
            <select className={filterCls} value={sectionFilter} onChange={(e) => { setSectionFilter(e.target.value); setSelectedId(null) }}>
              <option value="">All</option>
              {SECTIONS.map((c) => (<option key={c}>{c}</option>))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Search</span>
            <input className={filterCls} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, roll…" />
          </label>
          <div className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Orientation</span>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {[{ k: 'landscape', label: '▭ Landscape' }, { k: 'portrait', label: '▯ Portrait' }].map((o) => (
                <button
                  key={o.k}
                  onClick={() => setOrientation(o.k)}
                  className={`rounded-lg py-1.5 text-xs font-bold transition ${orientation === o.k ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two-panel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        {/* Student list */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Select student</div>
            <div className="text-xs font-semibold text-indigo-600">{filtered.length}</div>
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {filtered.length === 0 && (
              <div className="py-16 text-center text-xs text-slate-400">No students in this filter</div>
            )}
            {filtered.map((s) => {
              const active = selectedId === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left transition ${active ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  {s.photo ? (
                    <img src={s.photo} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-200" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm ${active ? 'font-bold text-indigo-700' : 'font-semibold text-slate-800'}`}>
                      {s.name}
                    </div>
                    <div className="truncate text-[11px] text-slate-500">
                      Roll {s.roll_no || '—'} · {s.class_name}{s.section ? `-${s.section}` : ''}
                    </div>
                  </div>
                  {active && <div className="h-2 w-2 rounded-full bg-indigo-500" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {!student ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">🪪</div>
              <div className="text-base font-bold text-slate-800">Pick a student</div>
              <div className="mt-1 text-xs text-slate-500">Select a student on the left to preview and print their ID card</div>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm font-bold text-slate-800">{student.name}</div>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {student.class_name}{student.section ? ` - ${student.section}` : ''} · Roll {student.roll_no || '—'} · {student.session}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPanel(panel === 'edit' ? null : 'edit')}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${panel === 'edit' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    ✏️ Edit fields
                  </button>
                  <button
                    onClick={() => setPanel(panel === 'design' ? null : 'design')}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${panel === 'design' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    🎨 Design
                  </button>
                </div>
              </div>

              {panel === 'edit' && (
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Override values (this print only)</div>
                    {Object.keys(overrides).length > 0 && (
                      <button onClick={() => setOverrides({})} className="text-[11px] font-bold text-rose-600 hover:underline">Reset</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {[
                      ['name', 'Name'],
                      ['father_name', 'Father'],
                      ['class_name', 'Class'],
                      ['section', 'Section'],
                      ['roll_no', 'Roll No'],
                      ['admission_no', 'Admission No'],
                      ['session', 'Session'],
                      ['blood_group', 'Blood Group'],
                      ['phone', 'Phone'],
                      ['emergency_number', 'Emergency'],
                      ['address', 'Address']
                    ].map(([k, label]) => (
                      <label key={k} className={`block ${k === 'address' ? 'md:col-span-2' : ''}`}>
                        <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          value={student[k] || ''}
                          onChange={set(k)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {panel === 'design' && (
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Card background</div>
                    <button onClick={resetDesign} className="text-[11px] font-bold text-rose-600 hover:underline">Reset design</button>
                  </div>

                  <div className="space-y-4">
                    {/* FRONT */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Front side</div>
                      <div className="flex flex-wrap items-center gap-2">
                        {['gradient', 'solid', 'image'].map((st) => (
                          <button
                            key={st}
                            onClick={() => setD('frontStyle', st)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${design.frontStyle === st ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            {st}
                          </button>
                        ))}
                        {design.frontStyle !== 'image' && (
                          <label className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Color</span>
                            <input type="color" value={design.frontBg} onChange={(e) => setD('frontBg', e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-slate-200" />
                          </label>
                        )}
                        {design.frontStyle === 'gradient' && (
                          <label className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase text-slate-500">to</span>
                            <input type="color" value={design.frontBg2} onChange={(e) => setD('frontBg2', e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-slate-200" />
                          </label>
                        )}
                        {design.frontStyle === 'image' && (
                          <>
                            <label className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700">
                              Upload
                              <input type="file" accept="image/*" onChange={pickBgImage('frontImage')} className="hidden" />
                            </label>
                            {design.frontImage && (
                              <button onClick={() => setD('frontImage', '')} className="rounded-lg bg-rose-50 px-2 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100">Remove</button>
                            )}
                          </>
                        )}
                        <div className="ml-auto flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Text</span>
                          {[{ k: 'light', label: '☀ Light' }, { k: 'dark', label: '🌙 Dark' }].map((t) => (
                            <button
                              key={t.k}
                              onClick={() => setD('frontText', t.k)}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${design.frontText === t.k ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {design.frontStyle === 'image' && design.frontImage && (
                        <img src={design.frontImage} alt="" className="mt-2 h-12 w-full rounded object-cover" />
                      )}
                    </div>

                    {/* BACK */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Back side</div>
                      <div className="flex flex-wrap items-center gap-2">
                        {['gradient', 'solid', 'image'].map((st) => (
                          <button
                            key={st}
                            onClick={() => setD('backStyle', st)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${design.backStyle === st ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            {st}
                          </button>
                        ))}
                        {design.backStyle !== 'image' && (
                          <label className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Color</span>
                            <input type="color" value={design.backBg} onChange={(e) => setD('backBg', e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-slate-200" />
                          </label>
                        )}
                        {design.backStyle === 'gradient' && (
                          <label className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase text-slate-500">to</span>
                            <input type="color" value={design.backBg2} onChange={(e) => setD('backBg2', e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-slate-200" />
                          </label>
                        )}
                        {design.backStyle === 'image' && (
                          <>
                            <label className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700">
                              Upload
                              <input type="file" accept="image/*" onChange={pickBgImage('backImage')} className="hidden" />
                            </label>
                            {design.backImage && (
                              <button onClick={() => setD('backImage', '')} className="rounded-lg bg-rose-50 px-2 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100">Remove</button>
                            )}
                          </>
                        )}
                        <div className="ml-auto flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Text</span>
                          {[{ k: 'light', label: '☀ Light' }, { k: 'dark', label: '🌙 Dark' }].map((t) => (
                            <button
                              key={t.k}
                              onClick={() => setD('backText', t.k)}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${design.backText === t.k ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {design.backStyle === 'image' && design.backImage && (
                        <img src={design.backImage} alt="" className="mt-2 h-12 w-full rounded object-cover" />
                      )}
                    </div>

                    {/* Accent */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Accent color</span>
                        <input type="color" value={design.accent} onChange={(e) => setD('accent', e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-slate-200" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    onClick={() => setSide('front')}
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${side === 'front' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Front
                  </button>
                  <button
                    onClick={() => setSide('back')}
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${side === 'back' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Back
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openPrint(side)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/30 transition hover:-translate-y-0.5"
                  >
                    🖨️ Print {side === 'front' ? 'Front' : 'Back'}
                  </button>
                  <button
                    onClick={() => openPrint('both')}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    🖨️ Print Both
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 bg-gradient-to-br from-slate-50 to-indigo-50/40 px-4 py-8">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {side === 'front' ? 'Front side' : 'Back side'}
                </div>
                <CardView
                  orientation={orientation}
                  w={cardDims.w}
                  h={cardDims.h}
                  student={student}
                  brand={brand}
                  qrUrl={qrUrl}
                  side={side}
                  design={design}
                />
                <div className="text-center text-[10px] text-slate-500">
                  {orientation === 'landscape' ? '85.6 × 54 mm' : '54 × 85.6 mm'} · CR80 card
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70 p-4 backdrop-blur-md">
          <div className="mx-auto mb-3 flex w-full max-w-[1000px] flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-5 py-3 shadow-2xl">
            <div>
              <div className="text-sm font-bold text-slate-800">
                ID Card — {preview.side === 'front' ? 'Front' : preview.side === 'back' ? 'Back' : 'Both Sides'}
              </div>
              <div className="text-xs text-slate-500">
                {orientation === 'landscape' ? '85.6 × 54 mm landscape' : '54 × 85.6 mm portrait'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const frame = document.getElementById('idcard-print-frame')
                  if (frame) { frame.contentWindow.focus(); frame.contentWindow.print() }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-blue-500/30 hover:-translate-y-0.5"
              >
                🖨️ Print
              </button>
              <button onClick={() => setPreview(null)} className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">Close</button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[1000px] flex-1 overflow-hidden rounded-2xl bg-white shadow-2xl">
            <iframe id="idcard-print-frame" title="Print preview" srcDoc={preview.html} className="h-full w-full border-0" />
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   BACKGROUND HELPER
   ============================================================ */
function bgStyle({ style, c1, c2, image }) {
  if (style === 'image' && image) {
    return {
      backgroundImage: `linear-gradient(rgba(15,23,42,.55), rgba(15,23,42,.75)), url(${image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  if (style === 'gradient') {
    return { backgroundImage: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }
  }
  return { backgroundColor: c1 }
}

/* ============================================================
   CARD VIEW
   ============================================================ */
function CardView({ orientation, w, h, student, brand, qrUrl, side, design }) {
  const isLandscape = orientation === 'landscape'

  /* ============ FRONT ============ */
  if (side === 'front') {
    const light = design.frontText !== 'dark'
    const textPrimary = light ? 'text-white' : 'text-slate-900'
    const textSecondary = light ? 'text-white/80' : 'text-slate-600'
    const headerBg = bgStyle({
      style: design.frontStyle,
      c1: design.frontBg,
      c2: design.frontBg2,
      image: design.frontImage
    })
    // When image is used, we want it to cover the whole card, with a light/dark overlay
    const isImage = design.frontStyle === 'image' && design.frontImage

    return (
      <div
        className="relative overflow-hidden rounded-[18px] shadow-2xl ring-1 ring-slate-200"
        style={{
          width: `${w}px`,
          height: `${h}px`,
          ...(isImage
            ? {
                backgroundImage: `linear-gradient(${light ? 'rgba(15,23,42,.55)' : 'rgba(255,255,255,.55)'},${light ? 'rgba(15,23,42,.75)' : 'rgba(255,255,255,.75)'}), url(${design.frontImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }
            : design.frontStyle === 'gradient'
              ? { backgroundImage: `linear-gradient(135deg, ${design.frontBg} 0%, ${design.frontBg2} 100%)` }
              : { backgroundColor: design.frontBg })
        }}
      >
        {/* Header */}
        <div
          className="relative overflow-hidden px-3 pt-3 pb-2"
          style={{
            height: isLandscape ? '80px' : '96px',
            background: isImage ? 'transparent' : 'rgba(255,255,255,.06)',
            borderBottom: `1px solid ${light ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.08)'}`
          }}
        >
          <div className="flex h-full items-center gap-2.5">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt=""
                className={`shrink-0 rounded-xl bg-white/90 object-contain p-1 ring-1 ring-white/40 shadow-md ${isLandscape ? 'h-12 w-12' : 'h-14 w-14'}`}
              />
            ) : (
              <div className={`flex shrink-0 items-center justify-center rounded-xl bg-white/90 text-slate-700 shadow-md ${isLandscape ? 'h-12 w-12 text-lg' : 'h-14 w-14 text-xl'}`}>
                🏫
              </div>
            )}
            <div className={`min-w-0 flex-1 ${isLandscape ? '' : ''}`}>
              <div className={`truncate text-[14px] font-extrabold leading-tight drop-shadow-sm ${textPrimary}`}>
                {brand.name || 'School System'}
              </div>
              {brand.address && (
                <div className={`truncate text-[8.5px] leading-tight ${textSecondary} mt-0.5`}>
                  {brand.address}
                </div>
              )}
              <div
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider shadow-sm`}
                style={{ background: design.accent, color: '#fff' }}
              >
                Student Card
              </div>
            </div>
          </div>
        </div>

        {/* Accent bar */}
        <div className="h-[3px] w-full" style={{ background: design.accent }} />

        {/* Body — semi-transparent overlay so text stays readable on image */}
        <div
          className="relative px-3 py-2"
          style={{
            height: `calc(100% - ${isLandscape ? '80px' : '96px'} - 3px)`,
            background: isImage ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.92)',
            backdropFilter: isImage ? 'blur(2px)' : 'none'
          }}
        >
          {isLandscape ? (
            <div className="flex h-full gap-2.5">
              <div className="flex shrink-0 flex-col items-center gap-0.5">
                <div
                  className="flex h-[80px] w-[62px] items-center justify-center overflow-hidden rounded-lg border-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-md"
                  style={{ borderColor: design.accent }}
                >
                  {student.photo ? <img src={student.photo} className="h-full w-full object-cover" /> : student.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-center">
                  <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-500">Roll</div>
                  <div className="text-[13px] font-extrabold leading-none" style={{ color: design.accent }}>{student.roll_no || '—'}</div>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div>
                  <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-500">Name</div>
                  <div className="truncate text-[12px] font-extrabold leading-tight text-slate-900">{student.name}</div>
                </div>
                <div>
                  <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-500">Father</div>
                  <div className="truncate text-[9.5px] font-semibold leading-tight text-slate-700">{student.father_name || '—'}</div>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0">
                  <div>
                    <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-500">Class</div>
                    <div className="truncate text-[9.5px] font-bold text-slate-800">{student.class_name}{student.section ? `-${student.section}` : ''}</div>
                  </div>
                  <div>
                    <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-500">Session</div>
                    <div className="truncate text-[9.5px] font-bold text-slate-800">{student.session}</div>
                  </div>
                  <div>
                    <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-500">Adm. No</div>
                    <div className="truncate text-[8.5px] font-mono font-semibold text-slate-700">{student.admission_no || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-500">Blood</div>
                    <div className="truncate text-[9.5px] font-bold text-rose-600">{student.blood_group || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center gap-1.5">
              <div
                className="flex h-[92px] w-[72px] items-center justify-center overflow-hidden rounded-lg border-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-md"
                style={{ borderColor: design.accent }}
              >
                {student.photo ? <img src={student.photo} className="h-full w-full object-cover" /> : student.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-center">
                <div className="max-w-[170px] truncate text-[11.5px] font-extrabold leading-tight text-slate-900">{student.name}</div>
                <div className="mt-0.5 inline-block rounded-md px-2 py-0.5 text-[8px] font-bold text-white" style={{ background: design.accent }}>
                  Roll {student.roll_no || '—'}
                </div>
              </div>
              <div className="w-full space-y-0 text-center">
                <div className="text-[7.5px] text-slate-600">{student.class_name}{student.section ? `-${student.section}` : ''} · {student.session}</div>
                <div className="text-[7.5px] font-mono text-slate-500">{student.admission_no || ''}</div>
                <div className="text-[8.5px] font-bold text-rose-600">🩸 {student.blood_group || '—'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ============ BACK ============ */
  const light = design.backText !== 'dark'
  const textPrimary = light ? 'text-white' : 'text-slate-900'
  const isImage = design.backStyle === 'image' && design.backImage

  return (
    <div
      className="relative overflow-hidden rounded-[18px] shadow-2xl ring-1 ring-slate-200"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        ...(isImage
          ? {
              backgroundImage: `linear-gradient(${light ? 'rgba(15,23,42,.6)' : 'rgba(255,255,255,.6)'},${light ? 'rgba(15,23,42,.8)' : 'rgba(255,255,255,.8)'}), url(${design.backImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }
          : design.backStyle === 'gradient'
            ? { backgroundImage: `linear-gradient(135deg, ${design.backBg} 0%, ${design.backBg2} 100%)` }
            : { backgroundColor: design.backBg })
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3"
        style={{
          height: isLandscape ? '38px' : '44px',
          background: isImage ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.1)',
          borderBottom: `1px solid ${light ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.08)'}`
        }}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {brand.logo && <img src={brand.logo} alt="" className="h-5 w-5 rounded bg-white/90 object-contain p-0.5" />}
          <div className={`truncate text-[10px] font-extrabold uppercase tracking-wider ${textPrimary}`}>
            {brand.name || 'School System'}
          </div>
        </div>
        <div className={`shrink-0 text-[8px] font-semibold ${light ? 'text-white/80' : 'text-slate-600'}`}>STUDENT ID</div>
      </div>

      {/* Body */}
      <div
        className={`flex gap-2.5 px-3 py-2.5 ${isLandscape ? '' : 'flex-col items-center text-center'}`}
        style={{
          height: isLandscape ? 'calc(100% - 38px - 16px)' : 'calc(100% - 44px - 20px)',
          background: isImage ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.9)',
          backdropFilter: isImage ? 'blur(2px)' : 'none'
        }}
      >
        <div className="flex shrink-0 flex-col items-center">
          <div
            className="flex items-center justify-center rounded-lg bg-white p-1"
            style={{
              width: isLandscape ? '98px' : '108px',
              height: isLandscape ? '98px' : '108px',
              outline: `2px solid ${design.accent}`,
              outlineOffset: 0
            }}
          >
            {qrUrl ? <img src={qrUrl} alt="QR" className="h-full w-full" /> : <div className="text-[8px] text-slate-400">…</div>}
          </div>
          <div className="mt-1 text-[7px] font-bold uppercase tracking-wider text-slate-500">Scan for info</div>
        </div>
        <div className={`flex min-w-0 flex-1 flex-col justify-between ${!isLandscape ? 'w-full' : ''}`}>
          <div className="space-y-1">
            <div>
              <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-500">Emergency</div>
              <div className="truncate text-[10.5px] font-bold text-slate-900">{student.phone || student.emergency_number || '—'}</div>
            </div>
            <div>
              <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-500">Address</div>
              <div className="line-clamp-2 text-[8px] leading-tight text-slate-600">{student.address || '—'}</div>
            </div>
          </div>
          {brand.phone && (
            <div className={`text-[7px] text-slate-600 ${isLandscape ? 'text-right' : 'text-center'}`}>📞 {brand.phone}</div>
          )}
        </div>
      </div>

      {/* Footer accent */}
      <div className="flex items-center justify-center px-3" style={{ height: isLandscape ? '16px' : '20px', background: design.accent }}>
        <div className="truncate text-[6.5px] font-semibold uppercase tracking-wider text-white">
          {brand.motto || 'Property of the school · Return if found'}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   PRINT — same design applied to the printed card
   ============================================================ */
function buildPrintHtml({ brand, student, qrUrl, className, section, orientation, side, design }) {
  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const isLandscape = orientation === 'landscape'

  const cardW = isLandscape ? '85.6mm' : '54mm'
  const cardH = isLandscape ? '54mm' : '85.6mm'

  const frontLight = design.frontText !== 'dark'
  const backLight = design.backText !== 'dark'

  const frontBgCss =
    design.frontStyle === 'image' && design.frontImage
      ? `background-image:linear-gradient(${frontLight ? 'rgba(15,23,42,.55),rgba(15,23,42,.75)' : 'rgba(255,255,255,.55),rgba(255,255,255,.75)'}),url(${design.frontImage});background-size:cover;background-position:center;`
      : design.frontStyle === 'gradient'
        ? `background-image:linear-gradient(135deg,${design.frontBg},${design.frontBg2});`
        : `background-color:${design.frontBg};`

  const backBgCss =
    design.backStyle === 'image' && design.backImage
      ? `background-image:linear-gradient(${backLight ? 'rgba(15,23,42,.6),rgba(15,23,42,.8)' : 'rgba(255,255,255,.6),rgba(255,255,255,.8)'}),url(${design.backImage});background-size:cover;background-position:center;`
      : design.backStyle === 'gradient'
        ? `background-image:linear-gradient(135deg,${design.backBg},${design.backBg2});`
        : `background-color:${design.backBg};`

  const frontText = frontLight ? '#ffffff' : '#0f172a'
  const frontSub = frontLight ? 'rgba(255,255,255,.8)' : '#475569'
  const backText = backLight ? '#ffffff' : '#0f172a'
  const backSub = backLight ? 'rgba(255,255,255,.8)' : '#475569'
  const accent = design.accent

  const frontHtml = `
    <div class="card front" style="${frontBgCss}">
      <div class="hdr">
        ${brand.logo ? `<img src="${brand.logo}" />` : `<div class="ph">🏫</div>`}
        <div class="htxt">
          <div class="name" style="color:${frontText}">${esc(brand.name || 'School System')}</div>
          <div class="addr" style="color:${frontSub}">${esc(brand.address || '')}</div>
          <div class="badge" style="background:${accent}">Student Card</div>
        </div>
      </div>
      <div class="accentbar" style="background:${accent}"></div>
      <div class="body" style="background:rgba(255,255,255,${design.frontStyle === 'image' ? '.35' : '.92'})">
        <div class="left">
          <div class="photo" style="border-color:${accent}">${student.photo ? `<img src="${student.photo}" />` : esc(student.name.charAt(0).toUpperCase())}</div>
          <div class="rolllabel">Roll No</div>
          <div class="rollno" style="color:${accent}">${esc(student.roll_no || '—')}</div>
        </div>
        <div class="info">
          <div class="row"><div class="label">Name</div><div class="value">${esc(student.name)}</div></div>
          <div class="row"><div class="label">Father</div><div class="value" style="font-size:8px">${esc(student.father_name || '—')}</div></div>
          <div class="grid2">
            <div><div class="label">Class</div><div class="value">${esc(student.class_name)}${student.section ? '-' + esc(student.section) : ''}</div></div>
            <div><div class="label">Session</div><div class="value">${esc(student.session)}</div></div>
            <div><div class="label">Adm. No</div><div class="value mono">${esc(student.admission_no || '—')}</div></div>
            <div><div class="label">Blood</div><div class="value blood">${esc(student.blood_group || '—')}</div></div>
          </div>
        </div>
      </div>
    </div>`

  const backHtml = `
    <div class="card back" style="${backBgCss}">
      <div class="hdr">
        ${brand.logo ? `<img src="${brand.logo}" class="himg" />` : ''}
        <div class="name" style="color:${backText}">${esc(brand.name || 'School System')}</div>
        <div class="tag" style="color:${backSub}">Student ID</div>
      </div>
      <div class="body" style="background:rgba(255,255,255,${design.backStyle === 'image' ? '.35' : '.9'})">
        <div class="qr-wrap">
          <div class="qr" style="outline-color:${accent}">${qrUrl ? `<img src="${qrUrl}" />` : ''}</div>
          <div class="qrhint">Scan to view</div>
        </div>
        <div class="contact">
          <div><div class="emergency-label">Emergency</div><div class="emergency-val">${esc(student.phone || student.emergency_number || '—')}</div></div>
          <div><div class="emergency-label">Address</div><div class="addr-val">${esc(student.address || '—')}</div></div>
          ${brand.phone ? `<div style="text-align:right; font-size:6.5px; color:#64748b">📞 ${esc(brand.phone)}</div>` : ''}
        </div>
      </div>
      <div class="foot" style="background:${accent}">${esc(brand.motto || 'Property of the school · Return if found')}</div>
    </div>`

  const cards = side === 'front' ? frontHtml : side === 'back' ? backHtml : frontHtml + backHtml
  const title = side === 'front' ? 'Front' : side === 'back' ? 'Back' : 'Both Sides'

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ID Card — ${esc(student.name)} (${title})</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #1e293b; }
  h1 { font-size: 14px; color: #1e3a8a; text-align: center; margin: 0 0 2px; }
  .sub { text-align: center; font-size: 9px; color: #64748b; margin-bottom: 20px; }
  .cards { display: flex; flex-direction: column; align-items: center; gap: 8mm; }
  .card { width: ${cardW}; height: ${cardH}; border-radius: 3mm; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.15); page-break-inside: avoid; position: relative; }
  .front .hdr { height: ${isLandscape ? '17mm' : '20mm'}; display: flex; align-items: center; gap: 2mm; padding: 2mm; background: rgba(255,255,255,.06); border-bottom: 0.2mm solid rgba(255,255,255,.15); }
  .front .hdr img { height: ${isLandscape ? '11mm' : '12mm'}; width: ${isLandscape ? '11mm' : '12mm'}; object-fit: contain; background: rgba(255,255,255,.9); border-radius: 1.8mm; padding: 0.8mm; }
  .front .hdr .ph { height: ${isLandscape ? '11mm' : '12mm'}; width: ${isLandscape ? '11mm' : '12mm'}; background: rgba(255,255,255,.9); border-radius: 1.8mm; display: flex; align-items: center; justify-content: center; }
  .front .hdr .htxt { flex: 1; min-width: 0; }
  .front .hdr .name { font-size: ${isLandscape ? '10px' : '9.5px'}; font-weight: 800; line-height: 1.15; margin-bottom: 0.5mm; }
  .front .hdr .addr { font-size: 7px; line-height: 1.15; margin-bottom: 0.8mm; }
  .front .hdr .badge { display: inline-block; padding: 0.3mm 1.5mm; border-radius: 999px; color: #fff; font-size: 5.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .accentbar { height: 0.8mm; }
  .front .body { height: calc(100% - ${isLandscape ? '17mm' : '20mm'} - 0.8mm); display: flex; gap: 2mm; padding: 2mm; ${isLandscape ? '' : 'flex-direction: column; align-items: center; text-align: center;'} }
  .photo { width: ${isLandscape ? '17mm' : '20mm'}; height: ${isLandscape ? '22mm' : '24mm'}; border-radius: 1.5mm; overflow: hidden; background: linear-gradient(135deg,#3b82f6,#6366f1); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; flex-shrink: 0; border: 0.5mm solid #6366f1; }
  .photo img { width: 100%; height: 100%; object-fit: cover; }
  .rolllabel { text-align: center; font-size: 6px; color: #94a3b8; text-transform: uppercase; letter-spacing: .1em; margin-top: 1mm; font-weight: 700; }
  .rollno { text-align: center; font-size: 11px; font-weight: 800; line-height: 1; }
  .info { flex: 1; min-width: 0; }
  .label { font-size: 6px; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; font-weight: 700; line-height: 1; }
  .value { font-size: 9px; font-weight: 700; color: #1e293b; line-height: 1.15; }
  .value.mono { font-family: 'Courier New', monospace; font-size: 8px; }
  .value.blood { color: #be123c; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1mm 2mm; margin-top: 1mm; }
  .row { margin-bottom: 1mm; }
  .back .hdr { height: 8mm; display: flex; align-items: center; justify-content: space-between; padding: 1mm 2.5mm; background: rgba(0,0,0,.25); }
  .back .hdr .himg { height: 5mm; width: 5mm; object-fit: contain; background: rgba(255,255,255,.9); border-radius: 1mm; padding: 0.4mm; margin-right: 1mm; }
  .back .hdr .name { font-size: 8px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; flex: 1; }
  .back .hdr .tag { font-size: 6.5px; }
  .back .body { height: calc(100% - 8mm - 5mm); display: flex; gap: 2mm; padding: 2mm; ${isLandscape ? '' : 'flex-direction: column; align-items: center; text-align: center;'} }
  .qr-wrap { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
  .qr { width: ${isLandscape ? '28mm' : '30mm'}; height: ${isLandscape ? '28mm' : '30mm'}; border-radius: 1.5mm; padding: 1mm; background: #fff; outline: 2px solid #6366f1; }
  .qr img { width: 100%; height: 100%; }
  .qrhint { text-align: center; font-size: 6px; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-top: 1mm; font-weight: 700; }
  .contact { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; }
  .emergency-label { font-size: 6px; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; font-weight: 700; }
  .emergency-val { font-size: 10px; font-weight: 800; color: #1e293b; }
  .addr-val { font-size: 7.5px; color: #475569; line-height: 1.2; }
  .foot { height: 5mm; color: #fff; font-size: 6px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; display: flex; align-items: center; justify-content: center; }
</style></head><body>
<h1>${esc(brand.name || 'Student ID Card')}</h1>
<div class="sub">${esc(student.name)} · ${esc(className)}${section ? ' - ' + esc(section) : ''} · Session ${esc(student.session)}</div>
<div class="cards">${cards}</div>
</body></html>`
}