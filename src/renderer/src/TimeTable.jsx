import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

const CLASSES = [
  'Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
]
const SECTIONS = ['A', 'B', 'C', 'D']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const currentSession = () => {
  const d = new Date()
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
  return `${y}-${y + 1}`
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

/* ---------- Icons ---------- */
const Svg = ({ d, className = 'h-4 w-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)
const IconPlus = (p) => <Svg {...p} d="M12 4.5v15m7.5-7.5h-15" />
const IconX = (p) => <Svg {...p} d="M6 18L18 6M6 6l12 12" />
const IconTrash = (p) => <Svg {...p} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
const IconEdit = (p) => <Svg {...p} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
const IconPrint = (p) => <Svg {...p} d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a1 1 0 011-1h16a1 1 0 011 1v6a1 1 0 01-1 1h-2M6 14h12v7H6z" />
const IconCalendar = (p) => <Svg {...p} d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V9h14v11z" />
const IconBook = (p) => <Svg {...p} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
const IconCheck = (p) => <Svg {...p} d="M4.5 12.75l6 6 9-13.5" />
const IconWhatsApp = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={p.className || 'h-4 w-4'}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

/* ---------- Subject → color ---------- */
const SUBJECT_COLORS = [
  'bg-rose-100 text-rose-700 ring-rose-200',
  'bg-amber-100 text-amber-800 ring-amber-200',
  'bg-emerald-100 text-emerald-800 ring-emerald-200',
  'bg-sky-100 text-sky-800 ring-sky-200',
  'bg-indigo-100 text-indigo-800 ring-indigo-200',
  'bg-violet-100 text-violet-800 ring-violet-200',
  'bg-fuchsia-100 text-fuchsia-800 ring-fuchsia-200',
  'bg-teal-100 text-teal-800 ring-teal-200',
  'bg-orange-100 text-orange-800 ring-orange-200',
  'bg-lime-100 text-lime-800 ring-lime-200'
]
const colorFor = (subject) => {
  let h = 0
  for (let i = 0; i < (subject || '').length; i++) h = (h * 31 + subject.charCodeAt(i)) | 0
  return SUBJECT_COLORS[Math.abs(h) % SUBJECT_COLORS.length]
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'

const filterCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'

/* ============================================================
   MAIN
   ============================================================ */
export default function TimeTable({ teachers = [] }) {
  const [tab, setTab] = useState('class')
  const cur = currentSession()

  const [session, setSession] = usePersisted('tt_session', cur)
  const [classFilter, setClassFilter] = usePersisted('tt_class', CLASSES[2])
  const [sectionFilter, setSectionFilter] = usePersisted('tt_section', '')
  const [examName, setExamName] = usePersisted('tt_exam', 'Mid Term')

  const [brand, setBrand] = useState({ name: 'School System', address: '', logo: '' })
  useEffect(() => {
    ;(async () => {
      try {
        const s = await window.api.getSettings()
        setBrand({
          name: s.schoolName || 'School System',
          address: s.schoolAddress || '',
          logo: s.logo || ''
        })
      } catch {}
    })()
  }, [])

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 p-6 text-white shadow-2xl shadow-indigo-600/20">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {brand.logo && (
              <img src={brand.logo} alt="logo" className="h-14 w-14 rounded-2xl bg-white/20 object-contain p-1 ring-2 ring-white/30" />
            )}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/70">
                <IconCalendar className="h-3.5 w-3.5" />
                Schedule manager
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Time Table</h1>
              <p className="mt-1 text-sm text-white/80">
                {brand.name || 'School System'} · Session {session}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-1.5 shadow-sm backdrop-blur">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'class', label: 'Class Time Table', icon: IconBook, grad: 'from-blue-500 to-indigo-600' },
            { id: 'exam', label: 'Exam Time Table', icon: IconCalendar, grad: 'from-violet-500 to-fuchsia-600' }
          ].map((t) => {
            const active = tab === t.id
            const IconC = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`group flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
                  active ? `bg-gradient-to-br ${t.grad} text-white shadow-lg` : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <IconC className={`h-4 w-4 ${active ? '' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <label className="block">
            <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Session</span>
            <select className={filterCls + ' w-full'} value={session} onChange={(e) => setSession(e.target.value)}>
              {Array.from({ length: 85 }, (_, i) => 2015 + i).map((y) => (
                <option key={y}>{`${y}-${y + 1}`}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Class *</span>
            <select className={filterCls + ' w-full'} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              {CLASSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Section</span>
            <select className={filterCls + ' w-full'} value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
              <option value="">All</option>
              {SECTIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          {tab === 'exam' && (
            <label className="block md:col-span-2">
              <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Exam Name</span>
              <input
                className={filterCls + ' w-full'}
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Mid Term"
              />
            </label>
          )}
        </div>
      </div>

      {tab === 'class' && (
        <ClassTimetable
          session={session}
          classFilter={classFilter}
          sectionFilter={sectionFilter}
          teachers={teachers}
          brand={brand}
        />
      )}
      {tab === 'exam' && (
        <ExamTimetable
          session={session}
          classFilter={classFilter}
          sectionFilter={sectionFilter}
          examName={examName}
          brand={brand}
        />
      )}
    </div>
  )
}

/* ============================================================
   WHATSAPP SHARE TEXT
   ============================================================ */
function buildWhatsAppText({ brand, session, className, section, rows, days }) {
  const lines = []
  lines.push(`*${brand?.name || 'School System'}*`)
  if (brand?.address) lines.push(brand.address)
  lines.push('')
  lines.push('📅 *Class Time Table*')
  lines.push(`Session: ${session}`)
  lines.push(`Class: ${className}${section ? ' - ' + section : ''}`)
  lines.push('')

  const byDay = {}
  rows.forEach((r) => {
    const d = Number(r.day)
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(r)
  })

  ;[1, 2, 3, 4, 5, 6, 0].forEach((d) => {
    const list = byDay[d]
    if (!list || list.length === 0) return
    lines.push(`*${days[d]}*`)
    list
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
      .forEach((r) => {
        lines.push(
          `• ${r.start_time}–${r.end_time} | ${r.subject} | ${r.teacher || '—'}${r.room ? ' | ' + r.room : ''}`
        )
      })
    lines.push('')
  })

  lines.push(`Total slots: ${rows.length}`)
  return lines.join('\n')
}

/* ============================================================
   CLASS TIMETABLE — Weekly grid only
   ============================================================ */
function ClassTimetable({ session, classFilter, sectionFilter, teachers, brand }) {
  const [rows, setRows] = useState([])
  const [allSlots, setAllSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [preview, setPreview] = useState(null)
  const [previewMode, setPreviewMode] = useState('single')
  const [toast, setToast] = useState(null)

  const showToast = (msg, tone = 'success') => {
    setToast({ msg, tone })
    setTimeout(() => setToast(null), 2400)
  }

  const load = async () => {
    setLoading(true)
    try {
      const data = await window.api.listClassTT({
        session,
        class_name: classFilter,
        section: sectionFilter
      })
      setRows(data || [])

      const all = []
      for (const cls of CLASSES) {
        const list = await window.api.listClassTT({
          session,
          class_name: cls,
          section: sectionFilter
        })
        if (list) all.push(...list)
      }
      setAllSlots(all)
    } catch (err) {
      showToast('Load failed: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, classFilter, sectionFilter])

  const save = async (p) => {
    try {
      if (p.id) {
        await window.api.updateClassTT(p)
        showToast('Slot updated')
      } else {
        await window.api.addClassTT({
          ...p,
          session,
          class_name: classFilter,
          section: sectionFilter
        })
        showToast('Slot added')
      }
      setEditing(null)
      await load()
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error')
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this slot?')) return
    try {
      await window.api.deleteClassTT({ id })
      showToast('Slot deleted')
      await load()
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error')
    }
  }

  const totalSlots = rows.length
  const uniqueTeachers = new Set(rows.map((r) => r.teacher).filter(Boolean)).size
  const uniqueSubjects = new Set(rows.map((r) => r.subject).filter(Boolean)).size

  const grid = useMemo(() => {
    const map = {}
    allSlots.forEach((s) => {
      const t = s.teacher || 'Unassigned'
      if (!map[t]) map[t] = {}
      if (!map[t][s.day]) map[t][s.day] = []
      map[t][s.day].push(s)
    })
    Object.values(map).forEach((days) => {
      Object.values(days).forEach((list) =>
        list.sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
      )
    })
    return map
  }, [allSlots])

  const DAY_COLS = [1, 2, 3, 4, 5, 6] // Mon..Sat
  const teacherNames = Object.keys(grid).sort((a, b) => a.localeCompare(b))

  const openPrint = (pageSize = 'A4', landscape = true) => {
    const html = buildSingleClassPrintHtml({
      brand,
      session,
      className: classFilter,
      section: sectionFilter,
      rows,
      days: DAYS,
      pageSize,
      landscape
    })
    setPreview({ html, pageSize, landscape })
    setPreviewMode('single')
  }

  const openPrintAll = async (pageSize = 'A4', landscape = true) => {
    try {
      if (allSlots.length === 0) {
        showToast('No timetable slots found for any class', 'error')
        return
      }
      const html = buildAllClassesPrintHtml({
        brand,
        session,
        teachers: teachers.map((t) => t.name),
        days: DAYS,
        slots: allSlots,
        pageSize,
        landscape
      })
      setPreview({ html, pageSize, landscape })
      setPreviewMode('all')
    } catch (err) {
      showToast('Print failed: ' + err.message, 'error')
    }
  }

  const shareWhatsApp = () => {
    if (rows.length === 0) return
    const text = buildWhatsAppText({
      brand,
      session,
      className: classFilter,
      section: sectionFilter,
      rows,
      days: DAYS
    })
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Chip label="Slots (this class)" value={totalSlots} tone="blue" />
          <Chip label="Subjects" value={uniqueSubjects} tone="emerald" />
          <Chip label="Teachers" value={uniqueTeachers} tone="violet" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              setEditing({
                id: null,
                day: 1,
                period_no: rows.length + 1,
                subject: '',
                teacher: '',
                start_time: '08:00',
                end_time: '08:45',
                room: ''
              })
            }
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5"
          >
            <IconPlus className="h-4 w-4" /> Add slot
          </button>
          <button
            onClick={() => openPrint('A4', true)}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-40"
          >
            <IconPrint className="h-4 w-4" /> This class
          </button>
          <button
            onClick={() => openPrintAll('A4', true)}
            disabled={allSlots.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:opacity-40"
          >
            <IconPrint className="h-4 w-4" /> All classes
          </button>
          <button
            onClick={shareWhatsApp}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-500/30 transition hover:-translate-y-0.5 disabled:opacity-40"
            title="Share this class's timetable on WhatsApp"
          >
            <IconWhatsApp className="h-4 w-4" /> WhatsApp
          </button>
        </div>
      </div>

      {/* Weekly grid */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Weekly Timetable</h3>
            <p className="text-[11px] text-slate-500">
              Every teacher — every class — every day. Hover any cell to edit or delete.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            {loading ? 'Loading…' : `${teacherNames.length} teachers`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="sticky left-0 z-20 min-w-[140px] border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left">
                  Teacher
                </th>
                {DAY_COLS.map((d) => (
                  <th
                    key={d}
                    className="min-w-[170px] border-b border-r border-slate-200 bg-slate-50 px-2 py-3 text-center"
                  >
                    {DAYS[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teacherNames.length === 0 && (
                <tr>
                  <td colSpan={DAY_COLS.length + 1} className="py-16 text-center text-slate-400">
                    <IconCalendar className="mx-auto mb-2 h-8 w-8" />
                    <div className="text-sm font-semibold text-slate-700">No slots yet</div>
                    <div className="text-xs">Click "Add slot" to build the weekly schedule</div>
                  </td>
                </tr>
              )}
              {teacherNames.map((tch) => (
                <tr key={tch} className="group border-b border-slate-100">
                  <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-3 align-top group-hover:bg-indigo-50/40">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white shadow-sm">
                        {tch.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-bold text-slate-800">{tch}</div>
                    </div>
                  </td>

                  {DAY_COLS.map((dayIdx) => {
                    const list = grid[tch]?.[dayIdx] || []
                    return (
                      <td
                        key={dayIdx}
                        className="border-r border-slate-100 px-2 py-2 align-top group-hover:bg-indigo-50/20"
                      >
                        {list.length === 0 ? (
                          <div className="py-2 text-center text-[10px] text-slate-300">—</div>
                        ) : (
                          <div className="space-y-1.5">
                            {list.map((s) => (
                              <div
                                key={s.id}
                                className={`group/slot relative rounded-lg p-2 ring-1 ${colorFor(s.subject)} transition hover:shadow-md`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="min-w-0">
                                    <div className="inline-block rounded-md bg-white/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-700">
                                      {s.class_name}
                                      {s.section ? `-${s.section}` : ''}
                                    </div>
                                    <div className="mt-1 truncate text-[11px] font-bold text-slate-800">
                                      {s.subject}
                                    </div>
                                    <div className="text-[10px] text-slate-600">
                                      {s.start_time}–{s.end_time}
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-500">
                                      {s.period_no && (
                                        <span className="rounded bg-white/60 px-1 py-0.5 font-bold">
                                          P{s.period_no}
                                        </span>
                                      )}
                                      {s.room && <span>Room {s.room}</span>}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-0.5 opacity-0 transition group-hover/slot:opacity-100">
                                    <button
                                      onClick={() =>
                                        setEditing({
                                          id: s.id,
                                          day: s.day,
                                          period_no: s.period_no,
                                          subject: s.subject,
                                          teacher: s.teacher,
                                          start_time: s.start_time,
                                          end_time: s.end_time,
                                          room: s.room
                                        })
                                      }
                                      className="rounded bg-white/80 p-1 text-slate-600 hover:bg-white hover:text-blue-600"
                                      title="Edit"
                                    >
                                      <IconEdit className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => remove(s.id)}
                                      className="rounded bg-white/80 p-1 text-slate-600 hover:bg-white hover:text-rose-600"
                                      title="Delete"
                                    >
                                      <IconTrash className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Portal>
          <SlotModal editing={editing} teachers={teachers} onClose={() => setEditing(null)} onSave={save} />
        </Portal>
      )}

      {preview && (
        <Portal>
          <PrintModal
            title={previewMode === 'all' ? 'Teacher-wise Weekly Timetable' : 'Class Time Table'}
            preview={preview}
            onClose={() => setPreview(null)}
            onSizeChange={(size, landscape) => {
              if (previewMode === 'all') openPrintAll(size, landscape)
              else openPrint(size, landscape)
            }}
          />
        </Portal>
      )}

      {toast && (
        <Portal>
          <Toast toast={toast} />
        </Portal>
      )}
    </div>
  )
}

/* ============================================================
   EXAM TIMETABLE
   ============================================================ */
function ExamTimetable({ session, classFilter, sectionFilter, examName, brand }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [preview, setPreview] = useState(null)
  const [previewMode, setPreviewMode] = useState('papers')
  const [toast, setToast] = useState(null)

  const showToast = (msg, tone = 'success') => {
    setToast({ msg, tone })
    setTimeout(() => setToast(null), 2400)
  }

  const load = async () => {
    setLoading(true)
    try {
      const data = await window.api.listExamTT({
        session,
        exam_name: examName || 'Exam',
        class_name: classFilter,
        section: sectionFilter
      })
      setRows(data || [])
    } catch (err) {
      showToast('Load failed: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, classFilter, sectionFilter, examName])

  const save = async (p) => {
    try {
      if (p.id) {
        await window.api.updateExamTT(p)
        showToast('Paper updated')
      } else {
        await window.api.addExamTT({ ...p, session, exam_name: examName || 'Exam', class_name: classFilter, section: sectionFilter })
        showToast('Paper added')
      }
      setEditing(null)
      await load()
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error')
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this paper?')) return
    try {
      await window.api.deleteExamTT({ id })
      showToast('Paper deleted')
      await load()
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error')
    }
  }

  const openPrint = (pageSize = 'A4', landscape = true) => {
    const html = buildExamPapersPrintHtml({
      brand,
      session,
      examName,
      className: classFilter,
      section: sectionFilter,
      rows,
      pageSize,
      landscape
    })
    setPreview({ html, pageSize, landscape })
    setPreviewMode('papers')
  }

  const openDateSheet = async (pageSize = 'A4', landscape = true) => {
    try {
      const classesWithPapers = []
      for (const cls of CLASSES) {
        const data = await window.api.listExamTT({
          session,
          exam_name: examName || 'Exam',
          class_name: cls,
          section: sectionFilter
        })
        if (data && data.length > 0) {
          classesWithPapers.push({ className: cls, section: sectionFilter, papers: data })
        }
      }
      if (classesWithPapers.length === 0) {
        showToast('No papers found for any class', 'error')
        return
      }
      const html = buildFullDateSheetHtml({ brand, session, examName, classesWithPapers, pageSize, landscape })
      setPreview({ html, pageSize, landscape })
      setPreviewMode('datesheet')
    } catch (err) {
      showToast('Print failed: ' + err.message, 'error')
    }
  }

  const totalPapers = rows.length
  const totalMarks = rows.reduce((a, r) => a + (Number(r.total_marks) || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Chip label="Papers" value={totalPapers} tone="rose" />
          <Chip label="Total marks" value={totalMarks} tone="amber" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              setEditing({
                id: null,
                subject: '',
                exam_date: new Date().toISOString().slice(0, 10),
                start_time: '09:00',
                end_time: '10:30',
                room: '',
                total_marks: 100
              })
            }
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:-translate-y-0.5"
          >
            <IconPlus className="h-4 w-4" /> Add paper
          </button>
          <button
            onClick={() => openPrint('A4', true)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
          >
            <IconPrint className="h-4 w-4" /> Print papers
          </button>
          <button
            onClick={() => openDateSheet('A4', true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:-translate-y-0.5"
          >
            <IconPrint className="h-4 w-4" /> Date sheet (all classes)
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3 text-center">Marks</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-indigo-50/40">
                <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.exam_date}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ${colorFor(r.subject)}`}>
                    {r.subject}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.start_time} – {r.end_time}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{r.room || '—'}</td>
                <td className="px-4 py-3 text-center text-xs font-bold text-indigo-600">{r.total_marks || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(r)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" title="Edit">
                      <IconEdit className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(r.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Delete">
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="border-t border-slate-100 py-3 text-center text-xs text-slate-400">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="border-t border-slate-100 py-16 text-center">
            <div className="mb-3 inline-block rounded-full bg-slate-100 p-3 text-slate-400">
              <IconCalendar className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold text-slate-700">No papers yet</div>
            <div className="text-xs text-slate-500">Click "Add paper" to build the exam schedule</div>
          </div>
        )}
      </div>

      {editing && (
        <Portal>
          <PaperModal editing={editing} onClose={() => setEditing(null)} onSave={save} />
        </Portal>
      )}

      {preview && (
        <Portal>
          <PrintModal
            title={previewMode === 'datesheet' ? 'Full Exam Date Sheet' : 'Exam Papers'}
            preview={preview}
            onClose={() => setPreview(null)}
            onSizeChange={(size, landscape) => {
              if (previewMode === 'datesheet') openDateSheet(size, landscape)
              else openPrint(size, landscape)
            }}
          />
        </Portal>
      )}

      {toast && (
        <Portal>
          <Toast toast={toast} />
        </Portal>
      )}
    </div>
  )
}

/* ============================================================
   MODALS
   ============================================================ */
function SlotModal({ editing, teachers, onClose, onSave }) {
  const [form, setForm] = useState({
    id: editing.id || null,
    day: editing.day ?? 1,
    period_no: editing.period_no || 1,
    subject: editing.subject || '',
    teacher: editing.teacher || '',
    start_time: editing.start_time || '08:00',
    end_time: editing.end_time || '08:45',
    room: editing.room || ''
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md">
      <div onClick={(e) => e.stopPropagation()} className="w-[520px] max-w-full overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-5 text-white">
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-2"><IconBook className="h-5 w-5" /></div>
              <div>
                <div className="text-lg font-extrabold">{form.id ? 'Edit slot' : 'New slot'}</div>
                <div className="text-xs text-white/70">{DAYS[form.day]} · Period {form.period_no}</div>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg bg-white/10 p-1.5 text-white/80 hover:bg-white/20">
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="space-y-3 px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Day</span>
              <select className={inputCls} value={form.day} onChange={set('day')}>
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Period</span>
              <input type="number" className={inputCls} value={form.period_no} onChange={set('period_no')} min="1" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Subject *</span>
            <input className={inputCls} value={form.subject} onChange={set('subject')} placeholder="Mathematics" autoFocus />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Teacher</span>
            {teachers.length > 0 ? (
              <select className={inputCls} value={form.teacher} onChange={set('teacher')}>
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            ) : (
              <input className={inputCls} value={form.teacher} onChange={set('teacher')} placeholder="Teacher name" />
            )}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Start</span>
              <input type="time" className={inputCls} value={form.start_time} onChange={set('start_time')} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">End</span>
              <input type="time" className={inputCls} value={form.end_time} onChange={set('end_time')} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Room</span>
            <input className={inputCls} value={form.room} onChange={set('room')} placeholder="A-12" />
          </label>
        </div>
        <div className="flex gap-2 border-t border-slate-100 px-6 py-4">
          <button onClick={() => form.subject.trim() && onSave(form)} className="flex-1 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5">
            {form.id ? 'Update slot' : 'Add slot'}
          </button>
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function PaperModal({ editing, onClose, onSave }) {
  const [form, setForm] = useState({
    id: editing.id || null,
    subject: editing.subject || '',
    exam_date: editing.exam_date || new Date().toISOString().slice(0, 10),
    start_time: editing.start_time || '09:00',
    end_time: editing.end_time || '10:30',
    room: editing.room || '',
    total_marks: editing.total_marks || 100
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md">
      <div onClick={(e) => e.stopPropagation()} className="w-[520px] max-w-full overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-fuchsia-700 px-6 py-5 text-white">
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-2"><IconCalendar className="h-5 w-5" /></div>
              <div>
                <div className="text-lg font-extrabold">{form.id ? 'Edit paper' : 'New paper'}</div>
                <div className="text-xs text-white/70">{form.exam_date}</div>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg bg-white/10 p-1.5 text-white/80 hover:bg-white/20">
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="space-y-3 px-6 py-5">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Subject *</span>
            <input className={inputCls} value={form.subject} onChange={set('subject')} placeholder="Mathematics" autoFocus />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</span>
              <input type="date" className={inputCls} value={form.exam_date} onChange={set('exam_date')} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Total marks</span>
              <input type="number" className={inputCls} value={form.total_marks} onChange={set('total_marks')} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Start</span>
              <input type="time" className={inputCls} value={form.start_time} onChange={set('start_time')} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">End</span>
              <input type="time" className={inputCls} value={form.end_time} onChange={set('end_time')} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Room</span>
            <input className={inputCls} value={form.room} onChange={set('room')} placeholder="Hall 1" />
          </label>
        </div>
        <div className="flex gap-2 border-t border-slate-100 px-6 py-4">
          <button onClick={() => form.subject.trim() && onSave(form)} className="flex-1 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:-translate-y-0.5">
            {form.id ? 'Update paper' : 'Add paper'}
          </button>
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function PrintModal({ title, preview, onClose, onSizeChange }) {
  const printNow = () => {
    const frame = document.getElementById('tt-print-frame')
    if (!frame) return
    frame.contentWindow.focus()
    frame.contentWindow.print()
  }
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70 p-4 backdrop-blur-md">
      <div className="mx-auto mb-3 flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-800/80 px-5 py-3 text-white shadow-2xl backdrop-blur-xl">
        <div>
          <div className="text-sm font-bold">{title} — Print preview</div>
          <div className="text-xs text-white/60">
            {preview.pageSize} · {preview.landscape ? 'Landscape' : 'Portrait'}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-white/60">Size</span>
            {['A4', 'A5', 'Legal'].map((sz) => (
              <button
                key={sz}
                onClick={() => onSizeChange(sz, preview.landscape)}
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
                onClick={() => onSizeChange(preview.pageSize, ls)}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  preview.landscape === ls ? 'bg-white text-blue-600 shadow' : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {ls ? 'Landscape' : 'Portrait'}
              </button>
            ))}
          </div>
          <button onClick={printNow} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/30 transition hover:-translate-y-0.5">
            <IconPrint className="h-3.5 w-3.5" /> Print
          </button>
          <button onClick={onClose} className="rounded-lg bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20">Close</button>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1240px] flex-1 overflow-hidden rounded-2xl bg-white shadow-2xl">
        <iframe id="tt-print-frame" title="Print preview" srcDoc={preview.html} className="h-full w-full border-0" />
      </div>
    </div>
  )
}

function Chip({ label, value, tone }) {
  const tones = {
    blue: 'from-blue-500 to-indigo-600 shadow-blue-500/30',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
    violet: 'from-violet-500 to-fuchsia-600 shadow-violet-500/30',
    rose: 'from-rose-500 to-pink-600 shadow-rose-500/30',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/30'
  }
  return (
    <div className={`flex items-center gap-2 rounded-xl bg-gradient-to-br ${tones[tone]} px-4 py-2.5 text-sm font-bold text-white shadow-lg`}>
      <span className="text-white/80">{label}</span>
      <span className="rounded-md bg-white/25 px-2 py-0.5 text-xs">{value}</span>
    </div>
  )
}

function Toast({ toast }) {
  return (
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
  )
}

/* ============================================================
   PRINT: SINGLE CLASS TIMETABLE (flat table)
   ============================================================ */
function buildSingleClassPrintHtml({ brand, session, className, section, rows, days, pageSize, landscape }) {
  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const body = rows
    .map(
      (r, i) => `<tr>
        <td>${i + 1}</td>
        <td>${esc(days[Number(r.day)] || '—')}</td>
        <td>${esc(r.start_time)} – ${esc(r.end_time)}</td>
        <td><b>${esc(r.subject)}</b></td>
        <td>${esc(r.teacher || '—')}</td>
        <td>${esc(r.room || '—')}</td>
        <td>${r.period_no || '—'}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Class Time Table</title>
<style>
  @page { size: ${pageSize} ${landscape ? 'landscape' : 'portrait'}; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 12px; }
  .head { text-align: center; border-bottom: 3px double #1e40af; padding-bottom: 10px; margin-bottom: 12px; }
  .head .logo { height: 56px; object-fit: contain; margin-bottom: 6px; }
  .head h1 { margin: 0; font-size: 20px; color: #1e3a8a; letter-spacing: .5px; }
  .head .addr { font-size: 10px; color: #64748b; margin-top: 2px; }
  .head .title { margin-top: 8px; font-size: 13px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; }
  .meta { display: flex; justify-content: space-between; font-size: 10px; color: #475569; margin-bottom: 10px; padding: 6px 10px; background: #f1f5f9; border-radius: 6px; }
  .meta b { color: #1e293b; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #1e40af; color: #fff; padding: 7px 6px; border: 1px solid #1e3a8a; text-align: center; font-size: 9px; text-transform: uppercase; letter-spacing: .5px; }
  td { border: 1px solid #cbd5e1; padding: 8px 6px; text-align: center; }
  tr:nth-child(even) td { background: #f8fafc; }
  td:nth-child(4) { text-align: left; }
  .foot { margin-top: 16px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; }
  .foot .sign { border-top: 1px solid #94a3b8; padding-top: 4px; width: 130px; text-align: center; }
</style></head><body>
  <div class="head">
    ${brand?.logo ? `<img src="${brand.logo}" class="logo" alt="logo" />` : ''}
    <h1>${esc(brand?.name || 'School System')}</h1>
    ${brand?.address ? `<div class="addr">${esc(brand.address)}</div>` : ''}
    <div class="title">Class Time Table</div>
  </div>
  <div class="meta">
    <div>Session: <b>${esc(session)}</b></div>
    <div>Class: <b>${esc(className)}${section ? ' - ' + esc(section) : ''}</b></div>
    <div>Slots: <b>${rows.length}</b></div>
    <div>Printed: <b>${new Date().toLocaleDateString()}</b></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Day</th>
        <th>Time</th>
        <th>Subject</th>
        <th>Teacher</th>
        <th>Room</th>
        <th>Period</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>
  <div class="foot">
    <div class="sign">Class Teacher</div>
    <div class="sign">Principal</div>
  </div>
</body></html>`
}

/* ============================================================
   PRINT: FULL SCHOOL TIMETABLE (teacher-wise table)
   ============================================================ */
function buildAllClassesPrintHtml({ brand, session, teachers, days, slots, pageSize, landscape }) {
  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const sorted = [...slots].sort((a, b) => {
    const ta = (a.teacher || 'Unassigned').localeCompare(b.teacher || 'Unassigned')
    if (ta !== 0) return ta
    const da = Number(a.day) - Number(b.day)
    if (da !== 0) return da
    return String(a.start_time).localeCompare(String(b.start_time))
  })

  const byTeacher = {}
  sorted.forEach((s) => {
    const key = s.teacher || 'Unassigned'
    if (!byTeacher[key]) byTeacher[key] = []
    byTeacher[key].push(s)
  })

  let bodyRows = ''
  Object.entries(byTeacher).forEach(([teacher, list]) => {
    list.forEach((s, idx) => {
      const firstRow = idx === 0
      const dayName = days[Number(s.day)] || '—'
      bodyRows += `<tr>
        ${firstRow ? `<td class="tch" rowspan="${list.length}">${esc(teacher)}</td>` : ''}
        <td class="day">${esc(dayName)}</td>
        <td class="time">${esc(s.start_time)}–${esc(s.end_time)}</td>
        <td class="cls">${esc(s.class_name)}${s.section ? ' - ' + esc(s.section) : ''}</td>
        <td class="subj">${esc(s.subject)}</td>
      </tr>`
    })
  })

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Full School Timetable</title>
<style>
  @page { size: ${pageSize} ${landscape ? 'landscape' : 'portrait'}; margin: 6mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 8px; }
  .head { display: flex; align-items: center; gap: 10px; border-bottom: 3px double #1e40af; padding-bottom: 6px; margin-bottom: 6px; }
  .head img { height: 40px; object-fit: contain; }
  .head .txt { flex: 1; }
  .head h1 { margin: 0; font-size: 14px; color: #1e3a8a; letter-spacing: .4px; }
  .head .addr { font-size: 8px; color: #64748b; margin-top: 1px; }
  .head .title { margin-top: 3px; font-size: 9px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; }
  .meta { display: flex; justify-content: space-between; font-size: 8px; color: #475569; padding: 4px 8px; background: #f1f5f9; border-radius: 4px; margin-bottom: 5px; }
  .meta b { color: #1e293b; }
  table { width: 100%; border-collapse: collapse; font-size: 8px; }
  th { background: #1e40af; color: #fff; padding: 5px 4px; border: 1px solid #1e3a8a; font-weight: 600; text-align: center; font-size: 8px; text-transform: uppercase; letter-spacing: .3px; }
  td { border: 1px solid #cbd5e1; padding: 3px 4px; vertical-align: middle; }
  td.tch { font-weight: 700; color: #1e3a8a; background: #eff6ff; text-align: center; border-right: 2px solid #1e40af; vertical-align: top; }
  td.day { text-align: center; font-weight: 600; color: #475569; background: #f8fafc; }
  td.time { text-align: center; font-family: 'Courier New', monospace; color: #1e293b; }
  td.cls { text-align: center; font-weight: 600; color: #7c3aed; }
  td.subj { text-align: left; font-weight: 600; color: #1e293b; }
  .foot { margin-top: 6px; display: flex; justify-content: space-between; font-size: 7px; color: #64748b; }
  .foot .sign { border-top: 1px solid #94a3b8; padding-top: 3px; width: 110px; text-align: center; }
  .empty { text-align: center; color: #94a3b8; padding: 20px; font-size: 9px; }
</style></head><body>
  <div class="head">
    ${brand?.logo ? `<img src="${brand.logo}" alt="logo" />` : ''}
    <div class="txt">
      <h1>${esc(brand?.name || 'School System')}</h1>
      ${brand?.address ? `<div class="addr">${esc(brand.address)}</div>` : ''}
      <div class="title">Teacher-wise Weekly Timetable</div>
    </div>
  </div>
  <div class="meta">
    <div>Session: <b>${esc(session)}</b></div>
    <div>Teachers: <b>${Object.keys(byTeacher).length}</b></div>
    <div>Slots: <b>${slots.length}</b></div>
    <div>Printed: <b>${new Date().toLocaleDateString()}</b></div>
  </div>
  ${
    sorted.length === 0
      ? '<div class="empty">No timetable slots found</div>'
      : `<table>
    <thead>
      <tr>
        <th>Teacher</th>
        <th>Day</th>
        <th>Time</th>
        <th>Class</th>
        <th>Subject</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>`
  }
  <div class="foot"><div class="sign">Vice Principal</div><div class="sign">Principal</div></div>
</body></html>`
}

/* ============================================================
   PRINT: EXAM PAPERS (single class)
   ============================================================ */
function buildExamPapersPrintHtml({ brand, session, examName, className, section, rows, pageSize, landscape }) {
  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const body = rows
    .map(
      (r, i) => `<tr>
        <td>${i + 1}</td>
        <td>${esc(r.exam_date)}</td>
        <td><b>${esc(r.subject)}</b></td>
        <td>${esc(r.start_time)} – ${esc(r.end_time)}</td>
        <td>${esc(r.room || '—')}</td>
        <td>${r.total_marks || '—'}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Exam Papers</title>
<style>
  @page { size: ${pageSize} ${landscape ? 'landscape' : 'portrait'}; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 12px; }
  .head { text-align: center; border-bottom: 3px double #1e40af; padding-bottom: 10px; margin-bottom: 12px; }
  .head .logo { height: 56px; object-fit: contain; margin-bottom: 6px; }
  .head h1 { margin: 0; font-size: 20px; color: #1e3a8a; letter-spacing: .5px; }
  .head .addr { font-size: 10px; color: #64748b; margin-top: 2px; }
  .head .title { margin-top: 8px; font-size: 13px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; }
  .meta { display: flex; justify-content: space-between; font-size: 10px; color: #475569; margin-bottom: 10px; padding: 6px 10px; background: #f1f5f9; border-radius: 6px; }
  .meta b { color: #1e293b; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #1e40af; color: #fff; padding: 7px 6px; border: 1px solid #1e3a8a; text-align: center; font-size: 9px; text-transform: uppercase; letter-spacing: .5px; }
  td { border: 1px solid #cbd5e1; padding: 8px 6px; text-align: center; }
  tr:nth-child(even) td { background: #f8fafc; }
  .foot { margin-top: 16px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; }
  .foot .sign { border-top: 1px solid #94a3b8; padding-top: 4px; width: 130px; text-align: center; }
</style></head><body>
  <div class="head">
    ${brand?.logo ? `<img src="${brand.logo}" class="logo" alt="logo" />` : ''}
    <h1>${esc(brand?.name || 'School System')}</h1>
    ${brand?.address ? `<div class="addr">${esc(brand.address)}</div>` : ''}
    <div class="title">Exam Papers — ${esc(examName)}</div>
  </div>
  <div class="meta">
    <div>Session: <b>${esc(session)}</b></div>
    <div>Class: <b>${esc(className)}${section ? ' - ' + esc(section) : ''}</b></div>
    <div>Papers: <b>${rows.length}</b></div>
    <div>Printed: <b>${new Date().toLocaleDateString()}</b></div>
  </div>
  <table><thead><tr><th>#</th><th>Date</th><th>Subject</th><th>Time</th><th>Room</th><th>Total Marks</th></tr></thead>
  <tbody>${body}</tbody></table>
  <div class="foot"><div class="sign">Controller of Exams</div><div class="sign">Principal</div></div>
</body></html>`
}

/* ============================================================
   PRINT: FULL EXAM DATE SHEET (all classes, one page)
   ============================================================ */
function buildFullDateSheetHtml({ brand, session, examName, classesWithPapers, pageSize, landscape }) {
  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const colMap = {}
  classesWithPapers.forEach(({ papers }) => {
    papers.forEach((p) => {
      const key = `${p.exam_date}|${p.start_time}|${p.end_time}`
      if (!colMap[key]) colMap[key] = { date: p.exam_date, start: p.start_time, end: p.end_time }
    })
  })
  const columns = Object.values(colMap).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return String(a.start).localeCompare(String(b.start))
  })

  const head = columns
    .map(
      (c) => `<th>
        <div class="h-date">${esc(c.date)}</div>
        <div class="h-time">${esc(c.start)}–${esc(c.end)}</div>
      </th>`
    )
    .join('')

  const body = classesWithPapers
    .map(({ className, section, papers }) => {
      const cells = columns
        .map((c) => {
          const paper = papers.find(
            (p) => p.exam_date === c.date && p.start_time === c.start && p.end_time === c.end
          )
          if (!paper) return '<td class="empty">—</td>'
          return `<td class="cell">
            <div class="subj">${esc(paper.subject)}</div>
            ${paper.room ? `<div class="room">${esc(paper.room)}</div>` : ''}
            ${paper.total_marks ? `<div class="mk">${paper.total_marks} marks</div>` : ''}
          </td>`
        })
        .join('')
      return `<tr>
        <td class="cls">${esc(className)}${section ? ' - ' + esc(section) : ''}</td>
        ${cells}
      </tr>`
    })
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Exam Date Sheet</title>
<style>
  @page { size: ${pageSize} ${landscape ? 'landscape' : 'portrait'}; margin: 6mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 8px; }
  .head { display: flex; align-items: center; gap: 10px; border-bottom: 3px double #1e40af; padding-bottom: 6px; margin-bottom: 6px; }
  .head img { height: 40px; object-fit: contain; }
  .head .txt { flex: 1; }
  .head h1 { margin: 0; font-size: 14px; color: #1e3a8a; letter-spacing: .4px; }
  .head .addr { font-size: 8px; color: #64748b; margin-top: 1px; }
  .head .title { margin-top: 3px; font-size: 9px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; }
  .meta { display: flex; justify-content: space-between; font-size: 8px; color: #475569; padding: 4px 8px; background: #f1f5f9; border-radius: 4px; margin-bottom: 5px; }
  .meta b { color: #1e293b; }
  table { width: 100%; border-collapse: collapse; font-size: 7px; table-layout: fixed; }
  th { background: #1e40af; color: #fff; padding: 3px 2px; border: 1px solid #1e3a8a; font-weight: 600; text-align: center; font-size: 7.5px; }
  th:first-child { width: 70px; }
  .h-date { font-size: 7.5px; }
  .h-time { font-size: 6.5px; opacity: .85; font-weight: 400; }
  td { border: 1px solid #cbd5e1; padding: 2px; vertical-align: top; text-align: center; }
  td.cls { font-weight: 700; color: #1e3a8a; background: #eff6ff; font-size: 8px; }
  td.empty { background: #fafafa; color: #cbd5e1; }
  .subj { font-size: 7.5px; font-weight: 700; color: #1e293b; line-height: 1.1; }
  .room { font-size: 6.5px; color: #475569; }
  .mk { font-size: 6px; color: #94a3b8; }
  .foot { margin-top: 6px; display: flex; justify-content: space-between; font-size: 7px; color: #64748b; }
  .foot .sign { border-top: 1px solid #94a3b8; padding-top: 3px; width: 110px; text-align: center; }
</style></head><body>
  <div class="head">
    ${brand?.logo ? `<img src="${brand.logo}" alt="logo" />` : ''}
    <div class="txt">
      <h1>${esc(brand?.name || 'School System')}</h1>
      ${brand?.address ? `<div class="addr">${esc(brand.address)}</div>` : ''}
      <div class="title">Examination Date Sheet — ${esc(examName)}</div>
    </div>
  </div>
  <div class="meta">
    <div>Session: <b>${esc(session)}</b></div>
    <div>Exam: <b>${esc(examName)}</b></div>
    <div>Classes: <b>${classesWithPapers.length}</b></div>
    <div>Papers: <b>${classesWithPapers.reduce((a, c) => a + c.papers.length, 0)}</b></div>
    <div>Printed: <b>${new Date().toLocaleDateString()}</b></div>
  </div>
  <table>
    <thead><tr><th>Class</th>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
  <div class="foot">
    <div class="sign">Controller of Exams</div>
    <div class="sign">Principal</div>
  </div>
</body></html>`
}