import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const CLASSES = [
  'Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
]
const SECTIONS = ['A', 'B', 'C', 'D']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const pad = (n) => String(n).padStart(2, '0')

// Session now starts in MARCH (e.g. 2026-2027 = March 2026 -> February 2027)
const currentSession = () => {
  const d = new Date()
  const y = d.getMonth() >= 2 ? d.getFullYear() : d.getFullYear() - 1
  return `${y}-${y + 1}`
}

// 12 months of a session: March (start year) ... February (next year)
const sessionMonths = (session) => {
  const start = parseInt(String(session).slice(0, 4), 10) || new Date().getFullYear()
  return Array.from({ length: 12 }, (_, i) => {
    const m = (2 + i) % 12 // starts from March
    const y = i < 10 ? start : start + 1 // Mar-Dec = start year, Jan-Feb = next year
    return { year: y, month: m, key: `${y}-${pad(m + 1)}`, label: `${MONTH_NAMES[m]} ${y}` }
  })
}
const defaultMonthIdx = (session) => {
  const now = new Date()
  const idx = sessionMonths(session).findIndex(
    (m) => m.year === now.getFullYear() && m.month === now.getMonth()
  )
  return idx >= 0 ? idx : 0
}

const STORAGE_KEY = 'school.filters.v1'
const loadFilters = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
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

const Portal = ({ children }) => createPortal(children, document.body)

/* ---------- Grade helpers ---------- */
const gradeOf = (pct) => {
  if (pct === null) return '-'
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  if (pct >= 40) return 'E'
  return 'F'
}
const gradeStyle = (g) => {
  if (g === 'A+') return 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/40'
  if (g === 'A') return 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/30'
  if (g === 'B') return 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md shadow-blue-500/30'
  if (g === 'C') return 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-md shadow-cyan-500/30'
  if (g === 'D') return 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30'
  if (g === 'E') return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/30'
  if (g === 'F') return 'bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-md shadow-rose-500/40'
  return 'bg-slate-100 text-slate-400'
}

function esc(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/* ---------- Print HTML builder ---------- */
function buildPrintHtml({
  brand,
  session,
  monthLabel,
  examName,
  className,
  section,
  students,
  subjects,
  marksMap,
  classAvg,
  positionMap,
  pageSize = 'A4',
  landscape = true
}) {
  const totalMax = subjects.reduce((a, s) => a + Number(s.max_marks || 0), 0)
  const head = subjects.map((s) => `<th>${esc(s.name)}<div class="sub">/${s.max_marks}</div></th>`).join('')
  const body = students.map((st) => {
    let total = 0
    let fail = false
    const marksCells = subjects.map((s) => {
      const v = marksMap[`${st.id}|${s.id}`]
      const has = v !== undefined && v !== null && v !== ''
      if (has) {
        total += Number(v)
        if (Number(v) < Number(s.pass_marks || 0)) fail = true
      }
      return `<td class="${has ? '' : 'empty'}">${has ? v : '-'}</td>`
    }).join('')
    const pct = totalMax > 0 ? Math.round((total / totalMax) * 100) : null
    const grade = fail ? 'F' : gradeOf(pct)
    const pos = positionMap[st.id] || '-'
    return `<tr>
      <td class="pos">${pos}</td>
      <td class="who">
        <div class="nm">${esc(st.name)}</div>
        <div class="fn">${esc(st.father_name || '')}${st.roll_no ? ' · Roll ' + esc(st.roll_no) : ''}</div>
      </td>
      ${marksCells}
      <td class="tot">${total} / ${totalMax}</td>
      <td class="pct">${pct === null ? '-' : pct + '%'}</td>
      <td class="gr gr-${grade.replace('+', 'p')}">${grade}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Result - ${esc(examName)}</title>
<style>
  @page { size: ${pageSize} ${landscape ? 'landscape' : 'portrait'}; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 12px; }
  .head { text-align: center; border-bottom: 3px double #1e40af; padding-bottom: 10px; margin-bottom: 12px; }
  .head .logo { height: 56px; object-fit: contain; margin-bottom: 6px; }
  .head h1 { margin: 0; font-size: 20px; color: #1e3a8a; letter-spacing: .5px; }
  .head .addr { font-size: 10px; color: #64748b; margin-top: 2px; }
  .head .title { margin-top: 8px; font-size: 13px; font-weight: 700; color: #1e40af; letter-spacing: 1px; text-transform: uppercase; }
  .meta { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; font-size: 10px; color: #475569; margin-bottom: 10px; padding: 6px 10px; background: #f1f5f9; border-radius: 6px; }
  .meta b { color: #1e293b; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  th { background: #1e40af; color: #fff; padding: 5px 4px; border: 1px solid #1e3a8a; text-align: center; font-size: 8.5px; }
  th .sub { font-size: 7.5px; opacity: .85; font-weight: 400; }
  td { padding: 4px 5px; border: 1px solid #cbd5e1; text-align: center; }
  tr:nth-child(even) td { background: #f8fafc; }
  .who { text-align: left; }
  .nm { font-weight: 700; color: #1e293b; font-size: 9.5px; }
  .fn { font-size: 7.5px; color: #64748b; }
  .pos { font-weight: 700; color: #1e40af; width: 26px; }
  .tot { font-weight: 700; }
  .pct { font-weight: 700; color: #1e40af; }
  .gr { font-weight: 700; }
  .gr-Ap, .gr-A { color: #047857; }
  .gr-B { color: #1d4ed8; }
  .gr-C { color: #0891b2; }
  .gr-D { color: #b45309; }
  .gr-E { color: #c2410c; }
  .gr-F { color: #be123c; }
  .empty { color: #cbd5e1; }
  .foot { margin-top: 16px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; }
  .foot .sign { border-top: 1px solid #94a3b8; padding-top: 4px; width: 130px; text-align: center; }
</style></head><body>
  <div class="head">
    ${brand?.logo ? `<img src="${brand.logo}" class="logo" alt="logo" />` : ''}
    <h1>${esc(brand?.name || 'School System')}</h1>
    ${brand?.address ? `<div class="addr">${esc(brand.address)}</div>` : ''}
    <div class="title">Result Sheet — ${esc(examName)}</div>
  </div>
  <div class="meta">
    <div>Session: <b>${esc(session)}</b></div>
    <div>Month: <b>${esc(monthLabel)}</b></div>
    <div>Class: <b>${esc(className)}${section ? ' - ' + esc(section) : ''}</b></div>
    <div>Total marks: <b>${totalMax}</b></div>
    <div>Students: <b>${students.length}</b></div>
    <div>Class Avg: <b>${classAvg === null ? '-' : classAvg + '%'}</b></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Student</th>${head}<th>Total</th><th>%</th><th>Grade</th></tr></thead>
    <tbody>${body}</tbody>
  </table>
  <div class="foot">
    <div class="sign">Class Teacher</div>
    <div class="sign">Principal</div>
  </div>
</body></html>`
}

/* ---------- Icons ---------- */
const Svg = ({ d, className = 'h-4 w-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)
const IconSearch = (p) => <Svg {...p} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
const IconPlus = (p) => <Svg {...p} d="M12 4.5v15m7.5-7.5h-15" />
const IconX = (p) => <Svg {...p} d="M6 18L18 6M6 6l12 12" />
const IconPrint = (p) => <Svg {...p} d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a1 1 0 011-1h16a1 1 0 011 1v6a1 1 0 01-1 1h-2M6 14h12v7H6z" />
const IconTrash = (p) => <Svg {...p} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
const IconEdit = (p) => <Svg {...p} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
const IconCheck = (p) => <Svg {...p} d="M4.5 12.75l6 6 9-13.5" />
const IconUsers = (p) => <Svg {...p} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
const IconBook = (p) => <Svg {...p} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
const IconTrend = (p) => <Svg {...p} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
const IconTrophy = (p) => <Svg {...p} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
const IconSparkles = (p) => <Svg {...p} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
const IconSpinner = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={p.className || 'h-4 w-4 animate-spin'}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity=".25" />
    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

/* ---------- Small UI primitives ---------- */
function Select({ label, icon, children, ...props }) {
  return (
    <label className="group relative block">
      <span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </span>
      <div className="relative">
        <select
          {...props}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 pr-9 text-sm font-medium text-slate-700 outline-none backdrop-blur transition hover:border-blue-300 hover:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          {children}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Svg d="M19 9l-7 7-7-7" />
        </span>
      </div>
    </label>
  )
}

function Input({ label, icon, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none backdrop-blur transition placeholder:font-normal placeholder:text-slate-400 hover:border-blue-300 hover:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  )
}

function StatCard({ label, value, sub, icon: IconC, tone }) {
  const tones = {
    blue: 'from-blue-500/10 to-indigo-500/10 ring-blue-200/60 text-blue-700',
    emerald: 'from-emerald-500/10 to-teal-500/10 ring-emerald-200/60 text-emerald-700',
    amber: 'from-amber-500/10 to-orange-500/10 ring-amber-200/60 text-amber-700',
    rose: 'from-rose-500/10 to-pink-500/10 ring-rose-200/60 text-rose-700'
  }
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${tones[tone]} p-4 ring-1 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg`}>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/40 blur-2xl transition-transform group-hover:scale-150" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</div>
          <div className="mt-1 text-2xl font-extrabold tabular-nums">{value}</div>
          {sub && <div className="mt-0.5 text-[11px] opacity-70">{sub}</div>}
        </div>
        {IconC && (
          <div className="rounded-lg bg-white/60 p-1.5 shadow-sm">
            <IconC className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- MAIN ---------- */
export default function Exams({ students = [] }) {
  const cur = currentSession()
  const sessionsInData = useMemo(
    () => [...new Set(students.map((s) => s.session).filter(Boolean))].sort().reverse(),
    [students]
  )

  const [session, setSession] = usePersisted('session', sessionsInData.includes(cur) ? cur : sessionsInData[0] || cur)
  const months = useMemo(() => sessionMonths(session), [session])
  const [monthKey, setMonthKey] = usePersisted('monthKey', '')
  const mo = months.find((m) => m.key === monthKey) || months[defaultMonthIdx(session)]
  const monthIdx = months.findIndex((m) => m.key === mo.key)

  const [classFilter, setClassFilter] = usePersisted('classFilter', '')
  const [sectionFilter, setSectionFilter] = usePersisted('sectionFilter', '')
  const [examName, setExamName] = usePersisted('examName', 'Mid Term')
  const [search, setSearch] = useState('')

  const [examId, setExamId] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [marks, setMarks] = useState({})
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [subjectsOpen, setSubjectsOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const [toast, setToast] = useState(null)

  /* Brand (school info from Settings) */
  const [brand, setBrand] = useState({ name: 'School System', address: '', logo: '' })

  const loadBrand = async () => {
    try {
      const s = await window.api.getSettings()
      setBrand({
        name: s.schoolName || 'School System',
        address: s.schoolAddress || '',
        logo: s.logo || ''
      })
    } catch {}
  }

  useEffect(() => {
    loadBrand()
    const onSaved = () => loadBrand()
    window.addEventListener('settings-saved', onSaved)
    return () => window.removeEventListener('settings-saved', onSaved)
  }, [])

  const saveTimer = useRef(null)
  const pendingRef = useRef([])

  const showToast = (msg, tone = 'success') => {
    setToast({ msg, tone })
    setTimeout(() => setToast(null), 2400)
  }

  /* ---- Load or create exam ---- */
  useEffect(() => {
    if (!classFilter) {
      setExamId(null)
      setSubjects([])
      setMarks({})
      return
    }
    let alive = true
    setLoading(true)
    setSaveStatus('')
    ;(async () => {
      try {
        const exam = await window.api.ensureExam({
          name: examName || 'Exam',
          session,
          month: mo.key,
          class_name: classFilter,
          section: sectionFilter || ''
        })
        if (!alive) return
        setExamId(exam.id)
        const bundle = await window.api.loadExam({ examId: exam.id })
        if (!alive) return
        setSubjects(bundle.subjects || [])
        const m = {}
        ;(bundle.marks || []).forEach((r) => {
          m[`${r.student_id}|${r.subject_id}`] = r.marks
        })
        setMarks(m)
        setLoading(false)
      } catch (err) {
        if (alive) {
          setLoading(false)
          showToast('Could not load exam: ' + err.message, 'error')
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [session, mo.key, classFilter, sectionFilter, examName])

  /* ---- Filter students ---- */
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const filteredStudents = useMemo(() => {
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

  /* ---- Derived ---- */
  const totalMax = subjects.reduce((a, s) => a + Number(s.max_marks || 0), 0)
  const rows = filteredStudents.map((st) => {
    let total = 0
    let hasAny = false
    let fail = false
    subjects.forEach((s) => {
      const v = marks[`${st.id}|${s.id}`]
      if (v !== undefined && v !== null && v !== '') {
        hasAny = true
        total += Number(v)
        if (Number(v) < Number(s.pass_marks || 0)) fail = true
      }
    })
    const pct = totalMax > 0 && hasAny ? Math.round((total / totalMax) * 100) : null
    const grade = fail ? 'F' : gradeOf(pct)
    return { st, total, hasAny, pct, grade, fail }
  })

  const sorted = [...rows].filter((r) => r.hasAny).sort((a, b) => b.total - a.total)
  const positionMap = {}
  let lastTotal = null
  let lastPos = 0
  sorted.forEach((r, i) => {
    const p = r.total === lastTotal ? lastPos : i + 1
    positionMap[r.st.id] = p
    lastTotal = r.total
    lastPos = p
  })

  const withPct = rows.filter((r) => r.pct !== null)
  const classAvg = withPct.length
    ? Math.round(withPct.reduce((a, r) => a + r.pct, 0) / withPct.length)
    : null
  const passCount = withPct.filter((r) => !r.fail).length
  const passRate = withPct.length ? Math.round((passCount / withPct.length) * 100) : null
  const topper = sorted[0]
  const completedCount = rows.filter((r) => r.hasAny).length

  /* ---- Debounced save ---- */
  const queueSave = (subjectId, studentId, value) => {
    pendingRef.current.push({ subjectId, studentId, marks: value })
    setSaveStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const batch = pendingRef.current
      pendingRef.current = []
      if (!batch.length || !examId) return
      try {
        await window.api.setExamMarksBulk({ examId, rows: batch })
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(''), 1200)
      } catch (err) {
        setSaveStatus('error')
        showToast('Save failed: ' + err.message, 'error')
      }
    }, 400)
  }

  const setMark = (subjectId, studentId, value) => {
    setMarks((prev) => {
      const k = `${studentId}|${subjectId}`
      if (value === '' || value === null) {
        const n = { ...prev }
        delete n[k]
        return n
      }
      return { ...prev, [k]: value }
    })
    queueSave(subjectId, studentId, value)
  }

  /* ---- Subject CRUD ---- */
  const addSubject = async ({ name, max_marks, pass_marks }) => {
    if (!examId) return
    try {
      const sub = await window.api.addExamSubject({ examId, name, max_marks, pass_marks })
      setSubjects((s) => [...s, sub])
      showToast(`Subject "${name}" added`)
    } catch (err) {
      showToast('Could not add subject: ' + err.message, 'error')
    }
  }
  const removeSubject = async (id) => {
    if (!window.confirm('Remove this subject and all its marks?')) return
    try {
      await window.api.removeExamSubject({ id })
      setSubjects((s) => s.filter((x) => x.id !== id))
      setMarks((m) => {
        const n = { ...m }
        Object.keys(n).forEach((k) => {
          if (k.endsWith(`|${id}`)) delete n[k]
        })
        return n
      })
      showToast('Subject removed')
    } catch (err) {
      showToast('Could not remove: ' + err.message, 'error')
    }
  }
  const updateSubject = async (id, patch) => {
    try {
      await window.api.updateExamSubject({ id, ...patch })
      setSubjects((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)))
      showToast('Subject updated')
    } catch (err) {
      showToast('Could not update: ' + err.message, 'error')
    }
  }

  /* ---- Print ---- */
  const openPrint = (pageSize = 'A4', landscape = true) => {
    if (!classFilter) return showToast('Please select a class first', 'error')
    if (subjects.length === 0) return showToast('Please add at least one subject', 'error')
    if (filteredStudents.length === 0) return showToast('No students in this filter', 'error')
    const html = buildPrintHtml({
      brand,
      session,
      monthLabel: mo.label,
      examName: examName || 'Exam',
      className: classFilter,
      section: sectionFilter,
      students: filteredStudents,
      subjects,
      marksMap: marks,
      classAvg,
      positionMap,
      pageSize,
      landscape
    })
    setPreview({ html, pageSize, landscape })
  }

  const printNow = () => {
    const frame = document.getElementById('exam-print-frame')
    if (!frame) return
    frame.contentWindow.focus()
    frame.contentWindow.print()
  }

  /* ---- Keyboard nav for marks cells ---- */
  const onCellKeyDown = (e, rowIdx, colIdx) => {
    const move = (dr, dc) => {
      const nextRow = rowIdx + dr
      const nextCol = colIdx + dc
      if (nextRow < 0 || nextRow >= rows.length) return
      if (nextCol < 0 || nextCol >= subjects.length) return
      const target = document.querySelector(`input[data-cell="${nextRow}-${nextCol}"]`)
      if (target) target.focus()
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      move(1, 0)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      move(1, 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1, 0)
    } else if (e.key === 'ArrowRight' && e.currentTarget.selectionStart === e.currentTarget.value.length) {
      e.preventDefault()
      move(0, 1)
    } else if (e.key === 'ArrowLeft' && e.currentTarget.selectionStart === 0) {
      e.preventDefault()
      move(0, -1)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 p-6 text-white shadow-2xl shadow-indigo-600/20">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {brand.logo && (
              <img src={brand.logo} alt="logo" className="h-14 w-14 rounded-2xl bg-white/20 object-contain p-1 ring-2 ring-white/30" />
            )}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/70">
                <IconSparkles className="h-3.5 w-3.5" />
                {brand.name || 'Examination Hub'}
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Exams & Results</h1>
              <p className="mt-1 text-sm text-white/80">
                {examName || 'Untitled exam'} · {mo.label} · Session {session}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
                <IconSpinner className="h-3 w-3 animate-spin" /> Saving…
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-100 backdrop-blur">
                <IconCheck className="h-3 w-3" /> Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="rounded-full bg-rose-400/20 px-3 py-1 text-xs text-rose-100 backdrop-blur">
                Save failed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Select label="Session" value={session} onChange={(e) => { setSession(e.target.value); setMonthKey('') }}>
            {(sessionsInData.length ? sessionsInData : [cur]).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Select label="Month" value={monthIdx} onChange={(e) => setMonthKey(months[Number(e.target.value)].key)}>
            {months.map((m, i) => (
              <option key={m.label} value={i}>{m.label}</option>
            ))}
          </Select>
          <Input label="Exam name" value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="Mid Term" />
          <Select label="Class *" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">Select class</option>
            {CLASSES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select label="Section" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="">All sections</option>
            {SECTIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <IconSearch className="h-3 w-3" /> Search
            </span>
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, roll no…"
                className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-3 pr-9 text-sm font-medium outline-none backdrop-blur transition placeholder:font-normal placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <IconSearch className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubjectsOpen(true)}
            disabled={!classFilter}
            className="group flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconPlus className="h-3.5 w-3.5" /> Manage subjects
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{subjects.length}</span>
          </button>

          {/* Page size + orientation pickers */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Size</span>
            {['A4', 'A5', 'Legal'].map((sz) => (
              <button
                key={sz}
                onClick={() => openPrint(sz, true)}
                disabled={!classFilter || subjects.length === 0}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-blue-600 disabled:opacity-40"
              >
                {sz}
              </button>
            ))}
          </div>

          <button
            onClick={() => openPrint(preview?.pageSize || 'A4', true)}
            disabled={!classFilter || subjects.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/30 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconPrint className="h-3.5 w-3.5" /> Print Landscape
          </button>
          <button
            onClick={() => openPrint(preview?.pageSize || 'A4', false)}
            disabled={!classFilter || subjects.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-500/30 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconPrint className="h-3.5 w-3.5" /> Print Portrait
          </button>
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <IconSpinner className="h-3.5 w-3.5 animate-spin" /> Loading exam…
            </span>
          )}
        </div>
      </div>

      {/* Live stats */}
      {classFilter && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard tone="blue" label="Students" value={filteredStudents.length} sub={`${completedCount} with marks`} icon={IconUsers} />
          <StatCard tone="emerald" label="Class average" value={classAvg === null ? '—' : `${classAvg}%`} sub={subjects.length + ' subjects'} icon={IconTrend} />
          <StatCard tone="amber" label="Pass rate" value={passRate === null ? '—' : `${passRate}%`} sub={`${passCount}/${withPct.length || 0} passed`} icon={IconCheck} />
          <StatCard tone="rose" label="Topper" value={topper ? topper.st.name.split(' ')[0] : '—'} sub={topper ? `${topper.total}/${totalMax} · ${topper.pct}%` : 'No marks yet'} icon={IconTrophy} />
        </div>
      )}

      {/* Banners */}
      {!classFilter && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 text-sm text-blue-700">
          <IconSparkles className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-bold">Let's get started</div>
            <div className="text-blue-600/80">Pick a class above to load the exam. Subjects, marks, positions, and grades will appear automatically.</div>
          </div>
        </div>
      )}
      {classFilter && subjects.length === 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 text-sm text-amber-700">
          <IconBook className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-bold">No subjects yet</div>
            <div className="text-amber-600/80">Click <b>Manage subjects</b> above to add papers (name, max marks, pass marks).</div>
          </div>
        </div>
      )}

      {/* Marks table */}
      {classFilter && subjects.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
                <IconBook className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">
                  {classFilter}
                  {sectionFilter ? ` — ${sectionFilter}` : ''}
                </div>
                <div className="text-[11px] text-slate-500">
                  {examName} · {mo.label}
                </div>
              </div>
            </div>
            <div className="hidden items-center gap-1.5 text-[11px] text-slate-400 md:flex">
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">Tab</kbd>
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">Enter</kbd>
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">↑↓</kbd>
              <span>to navigate</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-b from-slate-50 to-slate-100/70">
                  <th className="sticky left-0 z-20 bg-slate-100 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">#</th>
                  <th className="sticky left-10 z-20 bg-slate-100 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Student</th>
                  {subjects.map((s) => (
                    <th key={s.id} className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <div className="text-slate-700">{s.name}</div>
                      <div className="text-[9px] font-normal text-slate-400">/{s.max_marks}</div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">%</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Grade</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Position</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ st, total, pct, grade, hasAny }, i) => (
                  <tr key={st.id} className="group border-t border-slate-100 transition hover:bg-indigo-50/40">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 text-xs text-slate-400 group-hover:bg-indigo-50/40">{i + 1}</td>
                    <td className="sticky left-10 z-10 bg-white px-4 py-2 group-hover:bg-indigo-50/40">
                      <div className="font-bold text-slate-800">{st.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {st.roll_no ? `Roll ${st.roll_no}` : st.father_name || ''}
                      </div>
                    </td>
                    {subjects.map((s, colIdx) => {
                      const v = marks[`${st.id}|${s.id}`]
                      const failed = v !== undefined && v !== '' && Number(v) < Number(s.pass_marks || 0)
                      return (
                        <td key={s.id} className="px-1 py-1 text-center">
                          <input
                            type="number"
                            min="0"
                            max={s.max_marks}
                            value={v ?? ''}
                            onChange={(e) => setMark(s.id, st.id, e.target.value)}
                            onKeyDown={(e) => onCellKeyDown(e, i, colIdx)}
                            data-cell={`${i}-${colIdx}`}
                            placeholder="·"
                            className={`w-16 rounded-lg border px-2 py-1.5 text-center text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-300 ${
                              failed
                                ? 'border-rose-300 bg-rose-50 text-rose-700 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                            }`}
                          />
                        </td>
                      )
                    })}
                    <td className="px-3 py-2 text-center font-bold text-slate-700">
                      {hasAny ? (
                        <>
                          {total}<span className="text-slate-400">/{totalMax}</span>
                        </>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className={`px-3 py-2 text-center font-bold ${pct === null ? 'text-slate-300' : 'text-indigo-600'}`}>
                      {pct === null ? '—' : `${pct}%`}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block min-w-[36px] rounded-full px-2 py-0.5 text-[11px] font-bold ${gradeStyle(grade)}`}>
                        {grade}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {positionMap[st.id] ? (
                        <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                          positionMap[st.id] === 1
                            ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-md shadow-amber-500/40'
                            : positionMap[st.id] === 2
                              ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md shadow-slate-400/30'
                              : positionMap[st.id] === 3
                                ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-md shadow-rose-500/30'
                                : 'bg-slate-100 text-slate-600'
                        }`}>
                          {positionMap[st.id]}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-400">
                <IconUsers className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold text-slate-700">No students match this filter</div>
              <div className="text-xs text-slate-500">Try clearing search or choosing another class</div>
            </div>
          )}
        </div>
      )}

      {/* Subjects modal */}
      {subjectsOpen && (
        <Portal>
          <SubjectsModal
            subjects={subjects}
            onClose={() => setSubjectsOpen(false)}
            onAdd={addSubject}
            onRemove={removeSubject}
            onUpdate={updateSubject}
          />
        </Portal>
      )}

      {/* Print preview */}
      {preview && (
        <Portal>
          <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70 p-4 backdrop-blur-md">
            <div className="mx-auto mb-3 flex flex-wrap w-full max-w-[1240px] items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-800/80 px-5 py-3 text-white shadow-2xl backdrop-blur-xl">
              <div>
                <div className="text-sm font-bold">Print preview</div>
                <div className="text-xs text-white/60">
                  {preview.pageSize} · {preview.landscape ? 'Landscape' : 'Portrait'} · {filteredStudents.length} students · {subjects.length} subjects
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1">
                  <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-white/60">Size</span>
                  {['A4', 'A5', 'Legal'].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => openPrint(sz, preview.landscape)}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                        preview.pageSize === sz ? 'bg-white text-blue-600 shadow' : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1">
                  <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-white/60">Layout</span>
                  {[true, false].map((ls) => (
                    <button
                      key={String(ls)}
                      onClick={() => openPrint(preview.pageSize, ls)}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                        preview.landscape === ls ? 'bg-white text-blue-600 shadow' : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {ls ? 'Landscape' : 'Portrait'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={printNow}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/30 transition hover:-translate-y-0.5"
                >
                  <IconPrint className="h-3.5 w-3.5" /> Print
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="rounded-lg bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[1240px] flex-1 overflow-hidden rounded-2xl bg-white shadow-2xl">
              <iframe
                id="exam-print-frame"
                title="Print preview"
                srcDoc={preview.html}
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </Portal>
      )}

      {/* Toast */}
      {toast && (
        <Portal>
          <div
            className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-2xl ${
              toast.tone === 'error'
                ? 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/30'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
            }`}
          >
            {toast.tone === 'error' ? <IconX className="h-4 w-4" /> : <IconCheck className="h-4 w-4" />}
            {toast.msg}
          </div>
        </Portal>
      )}
    </div>
  )
}

/* ---------- Subjects Modal ---------- */
function SubjectsModal({ subjects, onClose, onAdd, onRemove, onUpdate }) {
  const [name, setName] = useState('')
  const [maxMarks, setMaxMarks] = useState('100')
  const [passMarks, setPassMarks] = useState('33')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editMax, setEditMax] = useState('')
  const [editPass, setEditPass] = useState('')
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    await onAdd({ name: name.trim(), max_marks: maxMarks, pass_marks: passMarks })
    setName('')
    setMaxMarks('100')
    setPassMarks('33')
    nameRef.current?.focus()
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-[560px] max-w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 px-6 py-5 text-white">
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-2 backdrop-blur">
                <IconBook className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold">Subjects</div>
                <div className="text-xs text-white/70">{subjects.length} papers added</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg bg-white/10 p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <form onSubmit={submit} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_80px_80px_auto]">
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Subject name (e.g., Mathematics)"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
            <input
              type="number"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              placeholder="Max"
              title="Max marks"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
            <input
              type="number"
              value={passMarks}
              onChange={(e) => setPassMarks(e.target.value)}
              placeholder="Pass"
              title="Pass marks"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/30 transition hover:-translate-y-0.5"
            >
              <IconPlus className="h-4 w-4" /> Add
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-400">
                <IconBook className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold text-slate-700">No subjects yet</div>
              <div className="text-xs text-slate-500">Add the first paper above to get started</div>
            </div>
          ) : (
            <div className="space-y-2">
              {subjects.map((s, idx) => (
                <div
                  key={s.id}
                  className="group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-600">
                    {idx + 1}
                  </div>
                  {editingId === s.id ? (
                    <>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                      <input
                        type="number"
                        value={editMax}
                        onChange={(e) => setEditMax(e.target.value)}
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                      <input
                        type="number"
                        value={editPass}
                        onChange={(e) => setEditPass(e.target.value)}
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                      <button
                        onClick={async () => {
                          await onUpdate(s.id, { name: editName, max_marks: editMax, pass_marks: editPass })
                          setEditingId(null)
                        }}
                        className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-1 text-xs font-bold text-white shadow-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-slate-800">{s.name}</div>
                        <div className="flex gap-2 text-[11px] text-slate-500">
                          <span>Max: <b className="text-slate-700">{s.max_marks}</b></span>
                          <span>·</span>
                          <span>Pass: <b className="text-slate-700">{s.pass_marks}</b></span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingId(s.id)
                          setEditName(s.name)
                          setEditMax(String(s.max_marks))
                          setEditPass(String(s.pass_marks))
                        }}
                        className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-blue-50 hover:text-blue-600 group-hover:opacity-100"
                        title="Edit"
                      >
                        <IconEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onRemove(s.id)}
                        className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                        title="Remove"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}