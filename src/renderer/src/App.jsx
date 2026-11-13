import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Teachers from './Teachers'
import Fees from './Fees'
import Exams from './Exams'
import Settings from './Settings'
import { applyTheme } from './Settings'
import TimeTable from './TimeTable'
import IdCards from './IdCards'
import Papers from './Papers'
import Certificate from './Certificate'

const CLASSES = [
  'Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
]
const SECTIONS = ['A', 'B', 'C', 'D']
const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const built = ['dashboard', 'students', 'attendance', 'teachers', 'teacher_attendance', 'fees', 'exams', 'timetable', 'idcards', 'papers', 'certificates', 'settings']

/* ---------- PERSISTENT FILTERS ---------- */
const STORAGE_KEY = 'school.filters.v1'
const loadFilters = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
const saveFilters = (f) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(f))
  } catch {
    /* ignore */
  }
}
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

/* ---------- SESSIONS ---------- */
const ALL_SESSIONS = (() => {
  const list = []
  for (let a = 2015; a <= 2099; a++) list.push(`${a}-${a + 1}`)
  return list
})()

// Session now starts in MARCH (e.g. 2026-2027 = March 2026 -> February 2027)
const currentSession = () => {
  const d = new Date()
  const y = d.getMonth() >= 2 ? d.getFullYear() : d.getFullYear() - 1
  return `${y}-${y + 1}`
}
const nextSession = (s) => {
  const m = /^(\d{4})-(\d{4})$/.exec(s || '')
  return m ? `${+m[1] + 1}-${+m[2] + 1}` : currentSession()
}
const nextClass = (c) => {
  const i = CLASSES.indexOf(c)
  return i >= 0 && i < CLASSES.length - 1 ? CLASSES[i + 1] : null
}
const today = () => new Date().toISOString().slice(0, 10)
const pad = (n) => String(n).padStart(2, '0')
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const localToday = () => {
  const n = new Date()
  return ymd(n.getFullYear(), n.getMonth(), n.getDate())
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

// Date range of a session (March 1 -> end of February)
const sessionRange = (session) => {
  const y = parseInt(String(session).slice(0, 4), 10) || new Date().getFullYear()
  return { from: `${y}-03-01`, to: `${y + 1}-02-29` }
}

const defaultMonthIdx = (session) => {
  const now = new Date()
  const idx = sessionMonths(session).findIndex(
    (m) => m.year === now.getFullYear() && m.month === now.getMonth()
  )
  return idx >= 0 ? idx : 0
}

const emptyForm = () => ({
  admission_no: '',
  name: '',
  father_name: '',
  father_occupation: '',
  father_cnic: '',
  gender: '',
  class_name: '',
  section: '',
  session: currentSession(),
  roll_no: '',
  phone: '',
  address: '',
  current_address: '',
  permanent_address: '',
  blood_group: '',
  previous_school: '',
  admission_date: today(),
  monthly_fee: '',
  photo: '',
  caste_tribe: '',
  dob: '',
  status: 'Active',
  nationality: '',
  withdrawn_from_school: '',
  reason_for_leaving: '',
  slc_previous_school: '',
  mobile_computer_usage: '',
  part_time_activity: '',
  favorite_subject: '',
  hobby: '',
  form_filled_by: '',
  checked_by: '',
  office_stamp_sign: ''
})

const menu = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'students', label: 'Students', icon: '🎓' },
  { id: 'attendance', label: 'Student Attendance', icon: '✅' },
  { id: 'teachers', label: 'Teachers', icon: '👨‍🏫' },
  { id: 'teacher_attendance', label: 'Teacher Attendance', icon: '🗒️' },
  { id: 'fees', label: 'Fee Management', icon: '💰' },
  { id: 'exams', label: 'Exams & Results', icon: '📝' },
  { id: 'timetable', label: 'Time Table', icon: '🗓️' },
  { id: 'idcards', label: 'ID Cards', icon: '🪪' },
  { id: 'papers', label: 'Paper Maker', icon: '📄' },
  { id: 'certificates', label: 'Certificates', icon: '🏅' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
]

const Portal = ({ children }) => createPortal(children, document.body)

/* ---------- SIDEBAR ICONS ---------- */
const SB = {
  dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  students: 'M12 12c2.7 0 8 1.3 8 4v2H4v-2c0-2.7 5.3-4 8-4zm0-2a4 4 0 100-8 4 4 0 000 8z',
  attendance: 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z',
  teachers: 'M12 3L1 9l11 6 9-4.9V17h2V9L12 3zM5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8-7-3.8z',
  teacher_attendance: 'M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z',
  fees: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1H6.73c.12 2.19 1.76 3.42 3.27 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z',
  exams: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  timetable: 'M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V9h14v11z',
  idcards: 'M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM9 6.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM6 18c0-1.7 1.8-3 3-3s3 1.3 3 3H6zm12-2h-5v-1h5v1zm0-3h-5v-1h5v1zm0-3h-5V9h5v1z',
  papers: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
  certificates: 'M12 2l2.5 5.3L20 8.3l-4 3.9.9 5.5-4.9-2.6L7.1 17.7 8 12.2 4 8.3l5.5-1L12 2z',
  settings: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87a.48.48 0 00.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.48.48 0 00-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z'
}

function SidebarIcon({ id, className = 'h-5 w-5' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d={SB[id] || SB.dashboard} />
    </svg>
  )
}

/* ---------- ICONS ---------- */
const Icon = ({ d, className = 'h-5 w-5', children }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.8"
    stroke="currentColor"
    className={className}
  >
    {d ? <path strokeLinecap="round" strokeLinejoin="round" d={d} /> : children}
  </svg>
)

const PlusIcon = (p) => <Icon {...p} d="M12 4.5v15m7.5-7.5h-15" />
const XIcon = (p) => <Icon {...p} d="M6 18L18 6M6 6l12 12" />
const SearchIcon = (p) => (
  <Icon {...p} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
)
const PencilIcon = (p) => (
  <Icon
    {...p}
    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
  />
)
const TrashIcon = (p) => (
  <Icon
    {...p}
    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
  />
)
const EyeIcon = (p) => (
  <Icon {...p}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </Icon>
)
const CheckIcon = (p) => <Icon {...p} d="M4.5 12.75l6 6 9-13.5" />
const PrintIcon = (p) => (
  <Icon {...p} d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a1 1 0 011-1h16a1 1 0 011 1v6a1 1 0 01-1 1h-2M6 14h12v7H6z" />
)
const DownloadIcon = (p) => <Icon {...p} d="M12 4v11m0 0l-4-4m4 4l4-4M4 20h16" />
const PromoteIcon = (p) => <Icon {...p} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
const ArrowRightIcon = (p) => <Icon {...p} d="M5 12h14m0 0l-5-5m5 5l-5 5" />
const LockIcon = (p) => <Icon {...p} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />

/* ---------- HELPERS ---------- */
const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100'

const filterCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function FormSection({ title, hint, accent = 'bg-blue-600', children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <span className={`h-4 w-1.5 rounded-full ${accent}`} />
        <div>
          <h3 className="text-[13px] font-bold leading-tight text-slate-800 uppercase tracking-wide">{title}</h3>
          {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

const badgeColors = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700'
]
const badgeFor = (name) => {
  const i = CLASSES.indexOf(name)
  return badgeColors[(i < 0 ? 0 : i) % badgeColors.length]
}

function Avatar({ s, size = 'h-10 w-10', text = 'text-sm' }) {
  if (s.photo) return <img src={s.photo} className={`${size} rounded-full object-cover`} />
  return (
    <div
      className={`${size} ${text} flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-semibold text-white`}
    >
      {(s.name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

function CountUp({ value, duration = 700 }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let start = null
    let raf
    const step = (t) => {
      if (start === null) start = t
      const p = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <>{n.toLocaleString('en-US')}</>
}

const pctColor = (p) =>
  p === null
    ? 'bg-slate-100 text-slate-400'
    : p >= 85
      ? 'bg-emerald-100 text-emerald-700'
      : p >= 75
        ? 'bg-amber-100 text-amber-700'
        : 'bg-rose-100 text-rose-700'
const percentOf = (c) => {
  const total = c.P + c.A + c.L
  return total === 0 ? null : Math.round((c.P / total) * 100)
}

/* ---------- SPARKLINE ---------- */
function Sparkline({ values, color = '#6366f1' }) {
  const W = 120
  const H = 36
  const max = Math.max(1, ...values)
  const step = W / Math.max(1, values.length - 1)
  const points = values.map((v, i) => `${i * step},${H - (v / max) * H}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-9 w-full">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ---------- LINE CHART ---------- */
function LineChart({ data, series, maxVal, showAmount, currency }) {
  const W = 1000
  const H = 280
  const PAD_L = 48
  const PAD_R = 20
  const PAD_T = 24
  const PAD_B = 34
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  const N = data.length
  const stepX = innerW / Math.max(1, N - 1)

  const [hover, setHover] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(false)
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [N])

  const x = (i) => PAD_L + i * stepX
  const y = (v) => PAD_T + innerH - (v / maxVal) * innerH

  const paths = series.map((s) => {
    const vals = data.map((d) => (s.key === 'amount' ? d.amount : d[s.key]))
    const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(' L ')
    return { ...s, pts, values: vals }
  })

  const grid = [0, 0.25, 0.5, 0.75, 1]

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * W
    const rel = (mouseX - PAD_L) / stepX
    const idx = Math.max(0, Math.min(N - 1, Math.round(rel)))
    setHover(idx)
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>

        {grid.map((f, i) => {
          const yy = PAD_T + innerH * (1 - f)
          return (
            <g key={i}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={yy}
                y2={yy}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x={PAD_L - 8} y={yy + 3} fontSize="10" fill="#94a3b8" textAnchor="end">
                {showAmount
                  ? Math.round(maxVal * f).toLocaleString('en-US')
                  : Math.round(maxVal * f)}
              </text>
            </g>
          )
        })}

        {data.map((d, i) =>
          d.dow === 0 ? (
            <rect
              key={`w${i}`}
              x={PAD_L + i * stepX - stepX / 2}
              y={PAD_T}
              width={stepX}
              height={innerH}
              fill="#f8fafc"
              opacity="0.7"
            />
          ) : null
        )}

        {paths.map((p) => (
          <path
            key={`area-${p.key}`}
            d={`M ${PAD_L},${PAD_T + innerH} L ${p.pts} L ${PAD_L + innerW},${PAD_T + innerH} Z`}
            fill={`url(#grad-${p.key})`}
            style={{ opacity: mounted ? 1 : 0, transition: 'opacity 600ms ease' }}
          />
        ))}

        {paths.map((p) => (
          <path
            key={`line-${p.key}`}
            d={`M ${p.pts}`}
            fill="none"
            stroke={p.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 4000,
              strokeDashoffset: mounted ? 0 : 4000,
              transition: 'stroke-dashoffset 1400ms ease-out'
            }}
          />
        ))}

        {paths.map((p) =>
          p.values.map((v, i) => {
            if (v === 0) return null
            const isHover = hover === i
            return (
              <circle
                key={`dot-${p.key}-${i}`}
                cx={x(i)}
                cy={y(v)}
                r={isHover ? 5 : 2.8}
                fill="#fff"
                stroke={p.color}
                strokeWidth="2"
                style={{
                  opacity: mounted ? 1 : 0,
                  transition: 'opacity 600ms ease, r 120ms ease'
                }}
              />
            )
          })
        )}

        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD_T}
            y2={PAD_T + innerH}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="3 3"
            pointerEvents="none"
          />
        )}

        {data.map((d, i) => {
          if (d.d % 3 !== 0 && d.d !== 1) return null
          return (
            <text
              key={i}
              x={x(i)}
              y={H - 10}
              fontSize="10"
              fill="#94a3b8"
              textAnchor="middle"
            >
              {d.d}
            </text>
          )
        })}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute z-20 min-w-[150px] rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-xl"
          style={{
            left: `${((x(hover) / W) * 100).toFixed(2)}%`,
            top: '6px',
            transform:
              hover > N * 0.7
                ? 'translateX(-100%)'
                : hover < N * 0.3
                  ? 'translateX(0)'
                  : 'translateX(-50%)'
          }}
        >
          <div className="mb-1 font-semibold">{data[hover].date}</div>
          {series.map((s) => {
            const v = s.key === 'amount' ? data[hover].amount : data[hover][s.key]
            return (
              <div key={s.key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="font-semibold">
                  {showAmount ? `${currency || 'Rs.'} ` : ''}
                  {Number(v).toLocaleString('en-US')}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ---------- DASHBOARD ---------- */
function Dashboard({ students, teachers }) {
  const cur = currentSession()
  const sessionsInData = [...new Set(students.map((s) => s.session).filter(Boolean))].sort().reverse()
  const [session, setSession] = usePersisted(
    'session',
    sessionsInData.includes(cur) ? cur : sessionsInData[0] || cur
  )

  useEffect(() => {
    if (sessionsInData.length && !sessionsInData.includes(session)) {
      setSession(sessionsInData.includes(cur) ? cur : sessionsInData[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionsInData.join(',')])

  const months = sessionMonths(session)
  const [monthKey, setMonthKey] = usePersisted('monthKey', '')
  const mo = months.find((m) => m.key === monthKey) || months[defaultMonthIdx(session)]
  const monthIdx = months.findIndex((m) => m.key === mo.key)

  const [classFilter, setClassFilter] = usePersisted('classFilter', '')
  const [sectionFilter, setSectionFilter] = usePersisted('sectionFilter', '')
  const [search, setSearch] = useState('')

  const [att, setAtt] = useState({})
  const [teacherAtt, setTeacherAtt] = useState({})
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      window.api.listAttendance(sessionRange(session)),
      typeof window.api.listTeacherAttendance === 'function'
        ? window.api.listTeacherAttendance(sessionRange(session))
        : Promise.resolve([]),
      typeof window.api.listFeePayments === 'function'
        ? window.api.listFeePayments({ session })
        : Promise.resolve([])
    ])
      .then(([rows, trows, pays]) => {
        if (!alive) return
        const map = {}
        ;(rows || []).forEach((r) => {
          if (!map[r.student_id]) map[r.student_id] = {}
          map[r.student_id][r.date] = r.status
        })
        setAtt(map)

        const tmap = {}
        ;(trows || []).forEach((r) => {
          if (!tmap[r.teacher_id]) tmap[r.teacher_id] = {}
          tmap[r.teacher_id][r.date] = r.status
        })
        setTeacherAtt(tmap)

        setPayments(pays || [])
        setLoading(false)
      })
      .catch((err) => {
        if (alive) {
          setLoading(false)
          alert('Could not load dashboard data: ' + err.message)
        }
      })
    return () => {
      alive = false
    }
  }, [session])

  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const filteredStudents = students.filter((s) => {
    if (s.session !== session) return false
    if (classFilter && s.class_name !== classFilter) return false
    if (sectionFilter && s.section !== sectionFilter) return false
    if (words.length) {
      const text = [s.name, s.father_name, s.roll_no, s.admission_no].join(' ').toLowerCase()
      if (!words.every((w) => text.includes(w))) return false
    }
    return true
  })
  const filteredTeachers = teachers.filter((t) => (t.status || 'Active') === 'Active')

  const daysInMonth = new Date(mo.year, mo.month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1
    const date = ymd(mo.year, mo.month, d)
    return { d, date, dow: new Date(mo.year, mo.month, d).getDay() }
  })
  const todayStr = localToday()
  const monthPrefix = `${mo.year}-${pad(mo.month + 1)}-`

  const countStudent = (id, inMonth) => {
    const c = { P: 0, A: 0, L: 0 }
    const row = att[id] || {}
    for (const [date, st] of Object.entries(row)) {
      if (inMonth && !date.startsWith(monthPrefix)) continue
      if (c[st] !== undefined) c[st]++
    }
    return c
  }
  const countTeacher = (id, inMonth) => {
    const c = { P: 0, A: 0, L: 0 }
    const row = teacherAtt[id] || {}
    for (const [date, st] of Object.entries(row)) {
      if (inMonth && !date.startsWith(monthPrefix)) continue
      if (c[st] !== undefined) c[st]++
    }
    return c
  }

  const todayStudents = { P: 0, A: 0, L: 0, total: filteredStudents.length }
  filteredStudents.forEach((s) => {
    const st = att[s.id]?.[todayStr]
    if (st && todayStudents[st] !== undefined) todayStudents[st]++
  })
  const todayTeachers = { P: 0, A: 0, L: 0, total: filteredTeachers.length }
  filteredTeachers.forEach((t) => {
    const st = teacherAtt[t.id]?.[todayStr]
    if (st && todayTeachers[st] !== undefined) todayTeachers[st]++
  })

  const monthStudents = { P: 0, A: 0, L: 0 }
  filteredStudents.forEach((s) => {
    const c = countStudent(s.id, true)
    monthStudents.P += c.P
    monthStudents.A += c.A
    monthStudents.L += c.L
  })
  const monthStudentPct = percentOf(monthStudents)

  const monthTeachers = { P: 0, A: 0, L: 0 }
  filteredTeachers.forEach((t) => {
    const c = countTeacher(t.id, true)
    monthTeachers.P += c.P
    monthTeachers.A += c.A
    monthTeachers.L += c.L
  })
  const monthTeacherPct = percentOf(monthTeachers)

  const dailyStudents = days.map((x) => {
    const c = { P: 0, A: 0, L: 0, date: x.date, d: x.d, dow: x.dow }
    filteredStudents.forEach((s) => {
      const st = att[s.id]?.[x.date]
      if (st && c[st] !== undefined) c[st]++
    })
    return c
  })
  const dailyTeachers = days.map((x) => {
    const c = { P: 0, A: 0, L: 0, date: x.date, d: x.d, dow: x.dow }
    filteredTeachers.forEach((t) => {
      const st = teacherAtt[t.id]?.[x.date]
      if (st && c[st] !== undefined) c[st]++
    })
    return c
  })

  const payIndex = {}
  payments.forEach((p) => {
    const k = `${p.student_id}|${p.month}`
    if (!payIndex[k]) payIndex[k] = { paid: 0, list: [] }
    payIndex[k].paid += Number(p.amount) || 0
    payIndex[k].list.push(p)
  })

  const feeRows = filteredStudents.map((s) => {
    const fee = Number(s.monthly_fee) || 0
    const paid = (payIndex[`${s.id}|${mo.key}`] || { paid: 0 }).paid
    const remaining = Math.max(0, fee - paid)
    let status = 'Unpaid'
    if (fee <= 0) status = 'No fee'
    else if (paid >= fee) status = 'Paid'
    else if (paid > 0) status = 'Partial'
    return { s, fee, paid, remaining, status }
  })
  const feeCounts = feeRows.reduce(
    (a, r) => {
      a[r.status] = (a[r.status] || 0) + 1
      a.expected += r.fee
      a.collected += r.paid
      a.pending += r.remaining
      return a
    },
    { Paid: 0, Partial: 0, Unpaid: 0, 'No fee': 0, expected: 0, collected: 0, pending: 0 }
  )
  const feeProgress = feeCounts.expected
    ? Math.min(100, Math.round((feeCounts.collected / feeCounts.expected) * 100))
    : 0

  const dailyFees = days.map((x) => {
    let amount = 0
    filteredStudents.forEach((s) => {
      const k = `${s.id}|${mo.key}`
      ;(payIndex[k]?.list || []).forEach((p) => {
        if (p.paid_on === x.date) amount += Number(p.amount) || 0
      })
    })
    return { d: x.d, date: x.date, dow: x.dow, amount }
  })
  const maxDailyFee = Math.max(1, ...dailyFees.map((d) => d.amount))
  const maxStudents = Math.max(1, ...dailyStudents.map((d) => Math.max(d.P, d.A, d.L)))
  const maxTeachers = Math.max(1, ...dailyTeachers.map((d) => Math.max(d.P, d.A, d.L)))

  const perClassFee = CLASSES.map((c) => {
    const list = feeRows.filter((r) => r.s.class_name === c)
    if (list.length === 0) return null
    return {
      name: c,
      total: list.length,
      paid: list.filter((r) => r.status === 'Paid').length,
      partial: list.filter((r) => r.status === 'Partial').length,
      unpaid: list.filter((r) => r.status === 'Unpaid').length
    }
  }).filter(Boolean)

  const perClassAtt = CLASSES.map((c) => {
    const list = filteredStudents.filter((s) => s.class_name === c)
    if (list.length === 0) return null
    const p = list.filter((s) => att[s.id]?.[todayStr] === 'P').length
    const a = list.filter((s) => att[s.id]?.[todayStr] === 'A').length
    const l = list.filter((s) => att[s.id]?.[todayStr] === 'L').length
    return { name: c, total: list.length, p, a, l }
  }).filter(Boolean)

  const clearFilters = () => {
    setClassFilter('')
    setSectionFilter('')
    setSearch('')
  }
  const hasFilters = classFilter || sectionFilter || search

  const studentDailyTotals = dailyStudents.map((d) => d.P)
  const feeDailyTotals = dailyFees.map((d) => d.amount)

  const seriesStudents = [
    { key: 'P', color: '#10b981', label: 'Present' },
    { key: 'A', color: '#f43f5e', label: 'Absent' },
    { key: 'L', color: '#f59e0b', label: 'Leave' }
  ]
  const seriesTeachers = [
    { key: 'P', color: '#10b981', label: 'Present' },
    { key: 'A', color: '#f43f5e', label: 'Absent' },
    { key: 'L', color: '#f59e0b', label: 'Leave' }
  ]
  const seriesFee = [{ key: 'amount', color: '#6366f1', label: 'Collected' }]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Session {session} | {mo.label} | {filteredStudents.length} students,{' '}
            {filteredTeachers.length} teachers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
              Loading…
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select className={filterCls} value={session} onChange={(e) => { setSession(e.target.value); setMonthKey('') }}>
          {(sessionsInData.length ? sessionsInData : [cur]).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          className={filterCls}
          value={monthIdx}
          onChange={(e) => setMonthKey(months[Number(e.target.value)].key)}
        >
          {months.map((m, i) => (
            <option key={m.label} value={i}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          className={filterCls}
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="">All classes</option>
          {CLASSES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          className={filterCls}
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
        >
          <option value="">All sections</option>
          {SECTIONS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <div className="relative min-w-[200px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="anim-fade-up group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
          <div className="relative text-sm opacity-90">Students (this session)</div>
          <div className="relative mt-2 text-3xl font-bold">
            <CountUp value={filteredStudents.length} />
          </div>
          <div className="relative mt-1 text-xs opacity-80">{perClassAtt.length} classes in use</div>
          <div className="relative mt-2 opacity-70">
            <Sparkline values={studentDailyTotals} color="#ffffff" />
          </div>
        </div>

        <div className="anim-fade-up group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
          <div className="relative text-sm opacity-90">Today Present (students)</div>
          <div className="relative mt-2 text-3xl font-bold">
            <CountUp value={todayStudents.P} />
          </div>
          <div className="relative mt-1 text-xs opacity-80">of {todayStudents.total} students</div>
          <div className="relative mt-2 flex gap-3 text-xs opacity-90">
            <span>P {todayStudents.P}</span>
            <span>A {todayStudents.A}</span>
            <span>L {todayStudents.L}</span>
          </div>
        </div>

        <div className="anim-fade-up group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
          <div className="relative text-sm opacity-90">Today Absent / Leave</div>
          <div className="relative mt-2 text-3xl font-bold">
            <CountUp value={todayStudents.A} />
            <span className="ml-1 text-lg opacity-80">/ {todayStudents.L}</span>
          </div>
          <div className="relative mt-1 text-xs opacity-80">A / L today</div>
          <div className="relative mt-2 text-xs opacity-80">
            Month avg: {monthStudentPct === null ? '-' : monthStudentPct + '%'}
          </div>
        </div>

        <div className="anim-fade-up group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
          <div className="relative text-sm opacity-90">Fee Collected ({mo.label})</div>
          <div className="relative mt-2 text-3xl font-bold">
            <CountUp value={feeProgress} />%
          </div>
          <div className="relative mt-1 text-xs opacity-80">
            Rs. {feeCounts.collected.toLocaleString('en-US')} of Rs.{' '}
            {feeCounts.expected.toLocaleString('en-US')}
          </div>
          <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full rounded-full bg-white transition-all duration-1000"
              style={{ width: `${feeProgress}%` }}
            />
          </div>
          <div className="relative mt-1 opacity-70">
            <Sparkline values={feeDailyTotals} color="#ffffff" />
          </div>
        </div>
      </div>

      <div className="anim-fade-up mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-slate-700">Student Attendance — {mo.label}</h2>
            <p className="text-xs text-slate-500">
              Today: {todayStudents.P} P · {todayStudents.A} A · {todayStudents.L} L{' · '}Month:{' '}
              {monthStudentPct === null ? '-' : monthStudentPct + '%'} avg
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" /> Present
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500" /> Absent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500" /> Leave
            </span>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-emerald-50 px-4 py-3 transition hover:bg-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-600">Present (month)</div>
            <div className="text-xl font-bold text-emerald-700">
              <CountUp value={monthStudents.P} />
            </div>
          </div>
          <div className="rounded-xl bg-rose-50 px-4 py-3 transition hover:bg-rose-100">
            <div className="text-[11px] font-semibold text-rose-600">Absent (month)</div>
            <div className="text-xl font-bold text-rose-700">
              <CountUp value={monthStudents.A} />
            </div>
          </div>
          <div className="rounded-xl bg-amber-50 px-4 py-3 transition hover:bg-amber-100">
            <div className="text-[11px] font-semibold text-amber-600">Leave (month)</div>
            <div className="text-xl font-bold text-amber-700">
              <CountUp value={monthStudents.L} />
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
            <div className="text-[11px] font-semibold text-slate-600">Average %</div>
            <div
              className={`text-xl font-bold ${
                monthStudentPct === null ? 'text-slate-400' : 'text-slate-800'
              }`}
            >
              {monthStudentPct === null ? '-' : monthStudentPct + '%'}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl bg-slate-50/40 p-2">
          <LineChart data={dailyStudents} series={seriesStudents} maxVal={maxStudents} />
        </div>

        {perClassAtt.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Per class (today)
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {perClassAtt.map((c) => {
                const pct = c.total ? Math.round((c.p / c.total) * 100) : 0
                return (
                  <div
                    key={c.name}
                    className="rounded-lg border border-slate-100 px-3 py-2 transition hover:border-blue-200 hover:bg-blue-50/40"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{c.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pctColor(pct)}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-1 flex gap-2 text-[11px] text-slate-500">
                      <span className="text-emerald-600">P {c.p}</span>
                      <span className="text-rose-600">A {c.a}</span>
                      <span className="text-amber-500">L {c.l}</span>
                      <span className="ml-auto text-slate-400">/{c.total}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="anim-fade-up mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-slate-700">Teacher Attendance — {mo.label}</h2>
            <p className="text-xs text-slate-500">
              {filteredTeachers.length} active teachers in this session
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" /> Present
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500" /> Absent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500" /> Leave
            </span>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="group rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-[11px] font-semibold text-slate-600">Total teachers</div>
            <div className="text-2xl font-bold text-slate-800">
              <CountUp value={filteredTeachers.length} />
            </div>
            <div className="mt-0.5 text-[10px] text-slate-500">active in session</div>
          </div>
          <div className="group rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-[11px] font-semibold text-emerald-600">Today present</div>
            <div className="text-2xl font-bold text-emerald-700">
              <CountUp value={todayTeachers.P} />
            </div>
            <div className="mt-0.5 text-[10px] text-emerald-600">
              {todayTeachers.total
                ? Math.round((todayTeachers.P / todayTeachers.total) * 100)
                : 0}
              % of teachers
            </div>
          </div>
          <div className="group rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-[11px] font-semibold text-rose-600">Today absent</div>
            <div className="text-2xl font-bold text-rose-700">
              <CountUp value={todayTeachers.A} />
            </div>
            <div className="mt-0.5 text-[10px] text-rose-600">teachers absent</div>
          </div>
          <div className="group rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-[11px] font-semibold text-amber-600">Today leave</div>
            <div className="text-2xl font-bold text-amber-700">
              <CountUp value={todayTeachers.L} />
            </div>
            <div className="mt-0.5 text-[10px] text-amber-600">teachers on leave</div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-emerald-50 px-4 py-3 transition hover:bg-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-600">Present (month)</div>
            <div className="text-xl font-bold text-emerald-700">
              <CountUp value={monthTeachers.P} />
            </div>
          </div>
          <div className="rounded-xl bg-rose-50 px-4 py-3 transition hover:bg-rose-100">
            <div className="text-[11px] font-semibold text-rose-600">Absent (month)</div>
            <div className="text-xl font-bold text-rose-700">
              <CountUp value={monthTeachers.A} />
            </div>
          </div>
          <div className="rounded-xl bg-amber-50 px-4 py-3 transition hover:bg-amber-100">
            <div className="text-[11px] font-semibold text-amber-600">Leave (month)</div>
            <div className="text-xl font-bold text-amber-700">
              <CountUp value={monthTeachers.L} />
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
            <div className="text-[11px] font-semibold text-slate-600">Average %</div>
            <div
              className={`text-xl font-bold ${
                monthTeacherPct === null ? 'text-slate-400' : 'text-slate-800'
              }`}
            >
              {monthTeacherPct === null ? '-' : monthTeacherPct + '%'}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl bg-slate-50/40 p-2">
          <LineChart data={dailyTeachers} series={seriesTeachers} maxVal={maxTeachers} />
        </div>
      </div>

      <div className="anim-fade-up mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-slate-700">Fee Collection — {mo.label}</h2>
            <p className="text-xs text-slate-500">
              {feeCounts.Paid} Paid · {feeCounts.Partial} Partial · {feeCounts.Unpaid} Unpaid
              {feeCounts['No fee'] > 0 ? ` · ${feeCounts['No fee']} No fee` : ''}
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-indigo-500" /> Collected
            </span>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-emerald-50 px-4 py-3 transition hover:bg-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-600">Paid</div>
            <div className="text-xl font-bold text-emerald-700">
              <CountUp value={feeCounts.Paid} />
            </div>
          </div>
          <div className="rounded-xl bg-amber-50 px-4 py-3 transition hover:bg-amber-100">
            <div className="text-[11px] font-semibold text-amber-600">Partial</div>
            <div className="text-xl font-bold text-amber-700">
              <CountUp value={feeCounts.Partial} />
            </div>
          </div>
          <div className="rounded-xl bg-rose-50 px-4 py-3 transition hover:bg-rose-100">
            <div className="text-[11px] font-semibold text-rose-600">Unpaid</div>
            <div className="text-xl font-bold text-rose-700">
              <CountUp value={feeCounts.Unpaid} />
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
            <div className="text-[11px] font-semibold text-slate-600">Pending amount</div>
            <div className="text-xl font-bold text-slate-800">
              Rs. {feeCounts.pending.toLocaleString('en-US')}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl bg-slate-50/40 p-2">
          <LineChart
            data={dailyFees}
            series={seriesFee}
            maxVal={maxDailyFee}
            showAmount
            currency="Rs."
          />
        </div>
        <div className="mt-1 text-center text-[11px] text-slate-400">
          Daily fee collected in {mo.label} (line chart)
        </div>

        {perClassFee.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Per class (this month)
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {perClassFee.map((c) => {
                const pct = c.total ? Math.round((c.paid / c.total) * 100) : 0
                return (
                  <div
                    key={c.name}
                    className="rounded-lg border border-slate-100 px-3 py-2 transition hover:border-indigo-200 hover:bg-indigo-50/40"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{c.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pctColor(pct)}`}>
                        {pct}% paid
                      </span>
                    </div>
                    <div className="mt-1 flex gap-2 text-[11px] text-slate-500">
                      <span className="text-emerald-600">Paid {c.paid}</span>
                      <span className="text-amber-600">Partial {c.partial}</span>
                      <span className="text-rose-600">Unpaid {c.unpaid}</span>
                      <span className="ml-auto text-slate-400">/{c.total}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- STUDENT ATTENDANCE ---------- */
const NEXT_STATUS = { '': 'P', P: 'A', A: 'L', L: '' }
const CELL_STYLE = {
  '': 'border border-slate-200 bg-white text-transparent hover:border-blue-400',
  P: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30',
  A: 'bg-rose-500 text-white shadow-sm shadow-rose-500/30',
  L: 'bg-amber-400 text-white shadow-sm shadow-amber-400/30'
}
const barColor = (p) =>
  p === null ? 'bg-slate-200' : p >= 85 ? 'bg-emerald-500' : p >= 75 ? 'bg-amber-400' : 'bg-rose-500'

const percent = (c) => {
  const total = c.P + c.A + c.L
  return total === 0 ? null : Math.round((c.P / total) * 100)
}

function buildAttendancePrintHtml({ brand, students, days, att, monthLabel, session, classFilter, sectionFilter, pageSize = 'A4', landscape = true }) {
  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const headDays = days.map((x) => {
    const weekend = x.dow === 0 ? ' weekend' : ''
    return `<th class="day${weekend}"><div class="dw">${['S','M','T','W','T','F','S'][x.dow]}</div><div class="dn">${x.d}</div></th>`
  }).join('')
  const bodyRows = students.map((s, idx) => {
    const cells = days.map((x) => {
      const st = att[s.id]?.[x.date] || ''
      const cls = x.dow === 0 ? 'weekend' : st ? `mark-${st}` : 'empty'
      return `<td class="cell ${cls}">${st || ''}</td>`
    }).join('')
    const row = att[s.id] || {}
    let P = 0, A = 0, L = 0
    days.forEach((x) => {
      const st = row[x.date]
      if (st === 'P') P++
      else if (st === 'A') A++
      else if (st === 'L') L++
    })
    const total = P + A + L
    const pct = total ? Math.round((P / total) * 100) : ''
    return `<tr>
      <td class="idx">${idx + 1}</td>
      <td class="who">
        <div class="nm">${esc(s.name)}</div>
        <div class="fn">${esc(s.class_name || '')}${s.section ? ' - ' + esc(s.section) : ''}${s.roll_no ? ' · Roll ' + esc(s.roll_no) : ''}</div>
      </td>
      ${cells}
      <td class="tot p">${P}</td>
      <td class="tot a">${A}</td>
      <td class="tot l">${L}</td>
      <td class="tot pct">${pct === '' ? '-' : pct + '%'}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Attendance — ${esc(monthLabel)}</title>
<style>
  @page { size: ${pageSize} ${landscape ? 'landscape' : 'portrait'}; margin: 8mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 10px; }
  .head { display: flex; align-items: center; gap: 12px; border-bottom: 3px double #1e40af; padding-bottom: 8px; margin-bottom: 8px; }
  .head img { height: 46px; object-fit: contain; }
  .head .txt { flex: 1; }
  .head h1 { margin: 0; font-size: 16px; color: #1e3a8a; letter-spacing: .5px; }
  .head .addr { font-size: 9px; color: #64748b; margin-top: 2px; }
  .head .title { margin-top: 4px; font-size: 10px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; }
  .meta { display: flex; justify-content: space-between; font-size: 9px; color: #475569; padding: 5px 8px; background: #f1f5f9; border-radius: 5px; margin-bottom: 6px; }
  .meta b { color: #1e293b; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5px; table-layout: fixed; }
  th { background: #1e40af; color: #fff; padding: 3px 1px; border: 1px solid #1e3a8a; font-weight: 600; }
  th.day { width: 18px; text-align: center; }
  th.day .dw { font-size: 7px; opacity: .85; line-height: 1; }
  th.day .dn { font-size: 9px; line-height: 1.1; }
  th:first-child { width: 22px; }
  th:nth-child(2) { width: 120px; }
  .day.weekend { background: #475569; }
  td { border: 1px solid #cbd5e1; padding: 2px 1px; text-align: center; }
  .idx { color: #94a3b8; font-size: 8px; }
  .who { text-align: left; padding: 2px 4px; }
  .nm { font-weight: 700; color: #1e293b; font-size: 9px; line-height: 1.1; }
  .fn { font-size: 7px; color: #64748b; line-height: 1.1; }
  .cell { font-weight: 700; font-size: 8px; }
  .mark-P { background: #10b981; color: #fff; }
  .mark-A { background: #f43f5e; color: #fff; }
  .mark-L { background: #fbbf24; color: #fff; }
  .weekend { background: #f1f5f9; }
  .empty { background: #fff; }
  .tot { font-weight: 700; font-size: 8.5px; }
  .tot.p { color: #047857; }
  .tot.a { color: #be123c; }
  .tot.l { color: #b45309; }
  .tot.pct { color: #1e40af; }
  .legend { margin-top: 6px; font-size: 9px; color: #64748b; display: flex; gap: 14px; justify-content: center; }
  .legend b { color: #1e293b; }
  tr:nth-child(even) td:not(.mark-P):not(.mark-A):not(.mark-L) { background: #f8fafc; }
  .sign { margin-top: 14px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; }
  .sign .line { border-top: 1px solid #94a3b8; padding-top: 3px; width: 130px; text-align: center; }
</style></head><body>
<div class="head">
  ${brand?.logo ? `<img src="${brand.logo}" alt="logo" />` : ''}
  <div class="txt">
    <h1>${esc(brand?.name || 'School System')}</h1>
    ${brand?.address ? `<div class="addr">${esc(brand.address)}</div>` : ''}
    <div class="title">Student Attendance</div>
  </div>
</div>
<div class="meta">
  <div>Session: <b>${esc(session)}</b></div>
  <div>Month: <b>${esc(monthLabel)}</b></div>
  <div>Class: <b>${esc(classFilter || 'All')}${sectionFilter ? ' - ' + esc(sectionFilter) : ''}</b></div>
  <div>Students: <b>${students.length}</b></div>
  <div>Printed: <b>${new Date().toLocaleDateString()}</b></div>
</div>
<table>
  <thead><tr>
    <th>#</th>
    <th>Student</th>
    ${headDays}
    <th>P</th><th>A</th><th>L</th><th>%</th>
  </tr></thead>
  <tbody>${bodyRows}</tbody>
</table>
<div class="legend">
  <span><b>P</b> Present</span>
  <span><b>A</b> Absent</span>
  <span><b>L</b> Leave</span>
  <span style="color:#94a3b8">— Weekend / blank</span>
</div>
<div class="sign">
  <div class="line">Class Teacher</div>
  <div class="line">Principal</div>
</div>
</body></html>`
}

function Attendance({ students }) {
  const cur = currentSession()
  const sessionsInData = [...new Set(students.map((s) => s.session).filter(Boolean))].sort().reverse()
  const [session, setSession] = usePersisted(
    'session',
    sessionsInData.includes(cur) ? cur : sessionsInData[0] || cur
  )
  const [classFilter, setClassFilter] = usePersisted('classFilter', '')
  const [sectionFilter, setSectionFilter] = usePersisted('sectionFilter', '')

  const months = sessionMonths(session)
  const [monthKey, setMonthKey] = usePersisted('monthKey', '')
  const mo = months.find((m) => m.key === monthKey) || months[defaultMonthIdx(session)]
  const monthIdx = months.findIndex((m) => m.key === mo.key)

  const [search, setSearch] = useState('')
  const [att, setAtt] = useState({})
  const [loading, setLoading] = useState(false)
  const [brand, setBrand] = useState({ name: 'School System', address: '', logo: '' })
  const [printPreview, setPrintPreview] = useState(null)

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

  const daysInMonth = new Date(mo.year, mo.month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1
    const date = ymd(mo.year, mo.month, d)
    return { d, date, dow: new Date(mo.year, mo.month, d).getDay() }
  })
  const todayStr = localToday()

  useEffect(() => {
    let alive = true
    setLoading(true)
    window.api
      .listAttendance(sessionRange(session))
      .then((rows) => {
        if (!alive) return
        const map = {}
        rows.forEach((r) => {
          if (!map[r.student_id]) map[r.student_id] = {}
          map[r.student_id][r.date] = r.status
        })
        setAtt(map)
        setLoading(false)
      })
      .catch((err) => {
        if (alive) {
          setLoading(false)
          alert('Could not load attendance: ' + err.message)
        }
      })
    return () => {
      alive = false
    }
  }, [session])

  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const list = students
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
      const ca = CLASSES.indexOf(a.class_name)
      const cb = CLASSES.indexOf(b.class_name)
      if (ca !== cb) return ca - cb
      const ra = parseInt(a.roll_no, 10)
      const rb = parseInt(b.roll_no, 10)
      if (!isNaN(ra) && !isNaN(rb) && ra !== rb) return ra - rb
      return String(a.name).localeCompare(String(b.name))
    })

  const putCell = (id, date, status) =>
    setAtt((prev) => {
      const row = { ...(prev[id] || {}) }
      if (status) row[date] = status
      else delete row[date]
      return { ...prev, [id]: row }
    })

  const cycle = async (s, date) => {
    const old = att[s.id]?.[date] || ''
    const next = NEXT_STATUS[old]
    putCell(s.id, date, next)
    try {
      await window.api.setAttendance({ student_id: s.id, date, status: next })
    } catch (err) {
      putCell(s.id, date, old)
      alert('Could not save: ' + err.message)
    }
  }

  const markAll = async (date) => {
    if (list.length === 0) return
    if (!confirm(`Mark all ${list.length} students PRESENT on ${date}?`)) return
    try {
      await window.api.setAttendanceMany({
        date,
        student_ids: list.map((s) => s.id),
        status: 'P'
      })
      list.forEach((s) => putCell(s.id, date, 'P'))
    } catch (err) {
      alert('Could not save: ' + err.message)
    }
  }

  const count = (id, inMonth) => {
    const c = { P: 0, A: 0, L: 0 }
    const row = att[id] || {}
    const prefix = `${mo.year}-${pad(mo.month + 1)}-`
    for (const [date, st] of Object.entries(row)) {
      if (inMonth && !date.startsWith(prefix)) continue
      if (c[st] !== undefined) c[st]++
    }
    return c
  }

  const rows = list.map((s) => {
    const m = count(s.id, true)
    const y = count(s.id, false)
    return { s, m, y, mp: percent(m), yp: percent(y) }
  })
  const withData = rows.filter((r) => r.mp !== null)
  const avg = withData.length
    ? Math.round(withData.reduce((a, r) => a + r.mp, 0) / withData.length)
    : null
  const todayCounts = { P: 0, A: 0, L: 0 }
  list.forEach((s) => {
    const st = att[s.id]?.[todayStr]
    if (st) todayCounts[st]++
  })

  const hasFilters = classFilter || sectionFilter || search
  const LEFT_W = 250

  const openPrint = (pageSize = 'A4', landscape = true) => {
    if (list.length === 0) return alert('No students to print')
    const html = buildAttendancePrintHtml({
      brand,
      students: list,
      days,
      att,
      monthLabel: mo.label,
      session,
      classFilter,
      sectionFilter,
      pageSize,
      landscape
    })
    setPrintPreview({ html, pageSize, landscape })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Attendance</h1>
          <p className="text-sm text-slate-500">
            Click a box: 1st = Present, 2nd = Absent, 3rd = Leave, 4th = empty
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openPrint('A4', true)}
            disabled={list.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PrintIcon className="h-4 w-4" /> Print A4
          </button>
          <button
            onClick={() => openPrint('A5', true)}
            disabled={list.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PrintIcon className="h-4 w-4" /> Print A5
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          className={filterCls}
          value={session}
          onChange={(e) => {
            setSession(e.target.value)
            setMonthKey('')
          }}
        >
          {(sessionsInData.length ? sessionsInData : ALL_SESSIONS.filter((s) => s === cur)).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          className={filterCls}
          value={monthIdx}
          onChange={(e) => setMonthKey(months[Number(e.target.value)].key)}
        >
          {months.map((m, i) => (
            <option key={m.label} value={i}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          className={filterCls}
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="">All classes</option>
          {CLASSES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          className={filterCls}
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
        >
          <option value="">All sections</option>
          {SECTIONS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <div className="relative min-w-[200px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Search student, roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              setClassFilter('')
              setSectionFilter('')
              setSearch('')
            }}
            className="anim-fade-in rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="anim-fade-up rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-slate-200">
          <span className="font-bold text-slate-800">{list.length}</span>{' '}
          <span className="text-slate-500">students</span>
        </div>
        <div className="anim-fade-up rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-slate-200">
          <span className="text-slate-500">Month average </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${pctColor(avg)}`}>
            {avg === null ? '-' : avg + '%'}
          </span>
        </div>
        <div className="anim-fade-up rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-slate-200">
          <span className="text-slate-500">Today: </span>
          <span className="font-bold text-emerald-600">{todayCounts.P} P</span>
          <span className="mx-1.5 text-slate-300">|</span>
          <span className="font-bold text-rose-600">{todayCounts.A} A</span>
          <span className="mx-1.5 text-slate-300">|</span>
          <span className="font-bold text-amber-500">{todayCounts.L} L</span>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500 font-bold text-white">P</span>
            Present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-500 font-bold text-white">A</span>
            Absent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-400 font-bold text-white">L</span>
            Leave
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-5 w-5 rounded bg-slate-100 ring-1 ring-slate-200" />
            Sunday / future
          </span>
        </div>
      </div>

      <div className="anim-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="font-semibold text-slate-700">
            {mo.label} <span className="font-normal text-slate-400">| Session {session}</span>
          </div>
          <div className="text-xs text-slate-400">
            {loading ? 'Loading...' : 'Tip: click a day number to mark everyone Present'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th
                  style={{ left: 0, minWidth: LEFT_W, width: LEFT_W }}
                  className="sticky z-20 border-b border-slate-100 bg-slate-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Student
                </th>
                <th
                  style={{ left: LEFT_W, minWidth: 110, width: 110 }}
                  className="sticky z-20 border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Attendance %
                </th>
                {days.map((x) => {
                  const off = x.dow === 0
                  const future = x.date > todayStr
                  const isToday = x.date === todayStr
                  return (
                    <th
                      key={x.d}
                      className={`border-b border-slate-100 px-0.5 py-1.5 text-center ${
                        off ? 'bg-slate-100' : 'bg-slate-50'
                      }`}
                    >
                      <button
                        disabled={off || future}
                        onClick={() => markAll(x.date)}
                        title={off || future ? '' : 'Mark all Present'}
                        className={`mx-auto flex w-8 flex-col items-center rounded-md py-0.5 text-[10px] leading-tight transition ${
                          isToday
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : off || future
                              ? 'text-slate-300'
                              : 'text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'
                        }`}
                      >
                        <span className="font-medium">{WEEKDAYS[x.dow]}</span>
                        <span className="text-xs font-bold">{x.d}</span>
                      </button>
                    </th>
                  )
                })}
                <th className="border-b border-slate-100 bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold uppercase text-emerald-600">P</th>
                <th className="border-b border-slate-100 bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold uppercase text-rose-600">A</th>
                <th className="border-b border-slate-100 bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold uppercase text-amber-500">L</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, m, mp, yp }, i) => (
                <tr
                  key={s.id}
                  style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                  className="anim-fade-up group"
                >
                  <td
                    style={{ left: 0, minWidth: LEFT_W, width: LEFT_W }}
                    className="sticky z-10 border-b border-slate-100 bg-white px-4 py-2 transition group-hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar s={s} size="h-9 w-9" text="text-xs" />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-800">{s.name}</div>
                        <div className="truncate text-[11px] text-slate-500">
                          {s.class_name}
                          {s.section ? `-${s.section}` : ''}
                          {s.roll_no ? ` | Roll ${s.roll_no}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td
                    style={{ left: LEFT_W, minWidth: 110, width: 110 }}
                    className="sticky z-10 border-b border-r border-slate-200 bg-white px-3 py-2 text-center transition group-hover:bg-blue-50"
                  >
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${pctColor(mp)}`}>
                      {mp === null ? '-' : mp + '%'}
                    </span>
                    <div className="mx-auto mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div
                        style={{ width: `${mp || 0}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${barColor(mp)}`}
                      />
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      Session {yp === null ? '-' : yp + '%'}
                    </div>
                  </td>

                  {days.map((x) => {
                    const off = x.dow === 0
                    const future = x.date > todayStr
                    const st = att[s.id]?.[x.date] || ''
                    if (off || future) {
                      return (
                        <td key={x.d} className="border-b border-slate-100 bg-slate-50/70 px-0.5 py-2 text-center">
                          <div className="mx-auto h-7 w-7 rounded-md bg-slate-100" />
                        </td>
                      )
                    }
                    return (
                      <td key={x.d} className="border-b border-slate-100 px-0.5 py-2 text-center">
                        <button
                          onClick={() => cycle(s, x.date)}
                          className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold transition hover:scale-110 active:scale-90 ${CELL_STYLE[st]}`}
                        >
                          {st || '.'}
                        </button>
                      </td>
                    )
                  })}

                  <td className="border-b border-slate-100 px-2 text-center text-xs font-bold text-emerald-600">{m.P}</td>
                  <td className="border-b border-slate-100 px-2 text-center text-xs font-bold text-rose-600">{m.A}</td>
                  <td className="border-b border-slate-100 px-2 text-center text-xs font-bold text-amber-500">{m.L}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <SearchIcon className="mx-auto mb-3 h-10 w-10" />
            No students found for this session / class / section
          </div>
        )}
      </div>

      {printPreview && (
        <Portal>
          <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 p-5 backdrop-blur-sm">
            <div className="mx-auto mb-3 flex w-full max-w-[1200px] items-center justify-between rounded-xl bg-white px-5 py-3 shadow-xl">
              <div>
                <h2 className="font-bold text-slate-800">Attendance — Print Preview</h2>
                <p className="text-xs text-slate-500">
                  {printPreview.pageSize} {printPreview.landscape ? 'Landscape' : 'Portrait'} · {list.length} students · {mo.label}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openPrint('A4', true)}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  A4
                </button>
                <button
                  onClick={() => openPrint('A5', true)}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  A5
                </button>
                <button
                  onClick={() => openPrint(printPreview.pageSize, !printPreview.landscape)}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  {printPreview.landscape ? 'Portrait' : 'Landscape'}
                </button>
                <button
                  onClick={() => {
                    const frame = document.getElementById('attendance-print-frame')
                    if (frame) {
                      frame.contentWindow.focus()
                      frame.contentWindow.print()
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95"
                >
                  <PrintIcon className="h-4 w-4" /> Print
                </button>
                <button
                  onClick={() => setPrintPreview(null)}
                  className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[1200px] flex-1 overflow-hidden rounded-xl bg-white shadow-2xl">
              <iframe
                id="attendance-print-frame"
                title="Attendance Print"
                srcDoc={printPreview.html}
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}

/* ---------- TEACHER ATTENDANCE ---------- */
function TeacherAttendance({ teachers }) {
  const cur = currentSession()
  const [session, setSession] = usePersisted('session', cur)
  const months = sessionMonths(session)
  const [monthKey, setMonthKey] = usePersisted('monthKey', '')
  const mo = months.find((m) => m.key === monthKey) || months[defaultMonthIdx(session)]
  const monthIdx = months.findIndex((m) => m.key === mo.key)

  const [att, setAtt] = useState({})
  const [loading, setLoading] = useState(false)

  const daysInMonth = new Date(mo.year, mo.month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1
    const date = ymd(mo.year, mo.month, d)
    return { d, date, dow: new Date(mo.year, mo.month, d).getDay() }
  })
  const todayStr = localToday()

  useEffect(() => {
    let alive = true

    if (typeof window.api?.listTeacherAttendance !== 'function') {
      setAtt({})
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.resolve(window.api.listTeacherAttendance(sessionRange(session)))
      .then((rows) => {
        if (!alive) return
        const map = {}
        ;(rows || []).forEach((r) => {
          if (!map[r.teacher_id]) map[r.teacher_id] = {}
          map[r.teacher_id][r.date] = r.status
        })
        setAtt(map)
        setLoading(false)
      })
      .catch((err) => {
        if (alive) {
          setLoading(false)
          alert('Could not load teacher attendance: ' + err.message)
        }
      })
    return () => {
      alive = false
    }
  }, [session])

  const list = teachers
    .filter((t) => (t.status || 'Active') === 'Active')
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))

  const putCell = (id, date, status) =>
    setAtt((prev) => {
      const row = { ...(prev[id] || {}) }
      if (status) row[date] = status
      else delete row[date]
      return { ...prev, [id]: row }
    })

  const cycle = async (t, date) => {
    const old = att[t.id]?.[date] || ''
    const next = NEXT_STATUS[old]
    putCell(t.id, date, next)
    try {
      await window.api.setTeacherAttendance({ teacher_id: t.id, date, status: next })
    } catch (err) {
      putCell(t.id, date, old)
      alert('Could not save: ' + err.message)
    }
  }

  const markAll = async (date) => {
    if (list.length === 0) return
    if (!confirm(`Mark all ${list.length} teachers PRESENT on ${date}?`)) return
    try {
      await window.api.setTeacherAttendanceMany({
        date,
        teacher_ids: list.map((t) => t.id),
        status: 'P'
      })
      list.forEach((t) => putCell(t.id, date, 'P'))
    } catch (err) {
      alert('Could not save: ' + err.message)
    }
  }

  const count = (id, inMonth) => {
    const c = { P: 0, A: 0, L: 0 }
    const row = att[id] || {}
    const prefix = `${mo.year}-${pad(mo.month + 1)}-`
    for (const [date, st] of Object.entries(row)) {
      if (inMonth && !date.startsWith(prefix)) continue
      if (c[st] !== undefined) c[st]++
    }
    return c
  }

  const rows = list.map((t) => {
    const m = count(t.id, true)
    const y = count(t.id, false)
    return { t, m, y, mp: percent(m), yp: percent(y) }
  })
  const withData = rows.filter((r) => r.mp !== null)
  const avg = withData.length
    ? Math.round(withData.reduce((a, r) => a + r.mp, 0) / withData.length)
    : null
  const todayCounts = { P: 0, A: 0, L: 0 }
  list.forEach((t) => {
    const st = att[t.id]?.[todayStr]
    if (st) todayCounts[st]++
  })

  const LEFT_W = 250

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Teacher Attendance</h1>
        <p className="text-sm text-slate-500">
          Click a box: 1st = Present, 2nd = Absent, 3rd = Leave, 4th = empty
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          className={filterCls}
          value={session}
          onChange={(e) => {
            setSession(e.target.value)
            setMonthKey('')
          }}
        >
          {ALL_SESSIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          className={filterCls}
          value={monthIdx}
          onChange={(e) => setMonthKey(months[Number(e.target.value)].key)}
        >
          {months.map((m, i) => (
            <option key={m.label} value={i}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="anim-fade-up rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-slate-200">
          <span className="font-bold text-slate-800">{list.length}</span>{' '}
          <span className="text-slate-500">teachers</span>
        </div>
        <div className="anim-fade-up rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-slate-200">
          <span className="text-slate-500">Month average </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${pctColor(avg)}`}>
            {avg === null ? '-' : avg + '%'}
          </span>
        </div>
        <div className="anim-fade-up rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-slate-200">
          <span className="text-slate-500">Today: </span>
          <span className="font-bold text-emerald-600">{todayCounts.P} P</span>
          <span className="mx-1.5 text-slate-300">|</span>
          <span className="font-bold text-rose-600">{todayCounts.A} A</span>
          <span className="mx-1.5 text-slate-300">|</span>
          <span className="font-bold text-amber-500">{todayCounts.L} L</span>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500 font-bold text-white">P</span>
            Present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-500 font-bold text-white">A</span>
            Absent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-400 font-bold text-white">L</span>
            Leave
          </span>
        </div>
      </div>

      <div className="anim-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="font-semibold text-slate-700">
            {mo.label} <span className="font-normal text-slate-400">| Session {session}</span>
          </div>
          <div className="text-xs text-slate-400">
            {loading ? 'Loading...' : 'Tip: click a day number to mark everyone Present'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th
                  style={{ left: 0, minWidth: LEFT_W, width: LEFT_W }}
                  className="sticky z-20 border-b border-slate-100 bg-slate-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Teacher
                </th>
                <th
                  style={{ left: LEFT_W, minWidth: 110, width: 110 }}
                  className="sticky z-20 border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Attendance %
                </th>
                {days.map((x) => {
                  const off = x.dow === 0
                  const future = x.date > todayStr
                  const isToday = x.date === todayStr
                  return (
                    <th
                      key={x.d}
                      className={`border-b border-slate-100 px-0.5 py-1.5 text-center ${
                        off ? 'bg-slate-100' : 'bg-slate-50'
                      }`}
                    >
                      <button
                        disabled={off || future}
                        onClick={() => markAll(x.date)}
                        title={off || future ? '' : 'Mark all Present'}
                        className={`mx-auto flex w-8 flex-col items-center rounded-md py-0.5 text-[10px] leading-tight transition ${
                          isToday
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : off || future
                              ? 'text-slate-300'
                              : 'text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'
                        }`}
                      >
                        <span className="font-medium">{WEEKDAYS[x.dow]}</span>
                        <span className="text-xs font-bold">{x.d}</span>
                      </button>
                    </th>
                  )
                })}
                <th className="border-b border-slate-100 bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold uppercase text-emerald-600">P</th>
                <th className="border-b border-slate-100 bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold uppercase text-rose-600">A</th>
                <th className="border-b border-slate-100 bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold uppercase text-amber-500">L</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ t, m, mp, yp }, i) => (
                <tr
                  key={t.id}
                  style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                  className="anim-fade-up group"
                >
                  <td
                    style={{ left: 0, minWidth: LEFT_W, width: LEFT_W }}
                    className="sticky z-10 border-b border-slate-100 bg-white px-4 py-2 transition group-hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar s={t} size="h-9 w-9" text="text-xs" />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-800">{t.name}</div>
                        <div className="truncate text-[11px] text-slate-500">
                          {t.designation || t.subject || t.qualification || ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td
                    style={{ left: LEFT_W, minWidth: 110, width: 110 }}
                    className="sticky z-10 border-b border-r border-slate-200 bg-white px-3 py-2 text-center transition group-hover:bg-blue-50"
                  >
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${pctColor(mp)}`}>
                      {mp === null ? '-' : mp + '%'}
                    </span>
                    <div className="mx-auto mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div
                        style={{ width: `${mp || 0}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${barColor(mp)}`}
                      />
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      Session {yp === null ? '-' : yp + '%'}
                    </div>
                  </td>

                  {days.map((x) => {
                    const off = x.dow === 0
                    const future = x.date > todayStr
                    const st = att[t.id]?.[x.date] || ''
                    if (off || future) {
                      return (
                        <td key={x.d} className="border-b border-slate-100 bg-slate-50/70 px-0.5 py-2 text-center">
                          <div className="mx-auto h-7 w-7 rounded-md bg-slate-100" />
                        </td>
                      )
                    }
                    return (
                      <td key={x.d} className="border-b border-slate-100 px-0.5 py-2 text-center">
                        <button
                          onClick={() => cycle(t, x.date)}
                          className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold transition hover:scale-110 active:scale-90 ${CELL_STYLE[st]}`}
                        >
                          {st || '.'}
                        </button>
                      </td>
                    )
                  })}

                  <td className="border-b border-slate-100 px-2 text-center text-xs font-bold text-emerald-600">{m.P}</td>
                  <td className="border-b border-slate-100 px-2 text-center text-xs font-bold text-rose-600">{m.A}</td>
                  <td className="border-b border-slate-100 px-2 text-center text-xs font-bold text-amber-500">{m.L}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <SearchIcon className="mx-auto mb-3 h-10 w-10" />
            No active teachers found. Add teachers first.
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- PROMOTE WINDOW ---------- */
function PromoteModal({ students, onClose, onDone }) {
  const sessionsInData = [...new Set(students.map((s) => s.session).filter(Boolean))].sort().reverse()
  const firstSession = sessionsInData[0] || currentSession()

  const [fromSession, setFromSession] = useState(firstSession)
  const [fromClass, setFromClass] = useState('')
  const [toSession, setToSession] = useState(nextSession(firstSession))
  const [mode, setMode] = useState('auto')
  const [toClass, setToClass] = useState('Class 1')
  const [selected, setSelected] = useState(new Set())
  const [busy, setBusy] = useState(false)

  const list = students.filter(
    (s) => s.session === fromSession && (!fromClass || s.class_name === fromClass)
  )
  const listKey = list.map((s) => s.id).join(',') + '|' + toSession

  const alreadyThere = (s) =>
    !!s.admission_no &&
    students.some((x) => x.admission_no === s.admission_no && x.session === toSession)

  useEffect(() => {
    setSelected(new Set(list.filter((s) => !alreadyThere(s)).map((s) => s.id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey])

  const target = (s) =>
    mode === 'auto' ? nextClass(s.class_name) : mode === 'same' ? s.class_name : toClass

  const chosen = list.filter((s) => selected.has(s.id) && !alreadyThere(s))
  const movable = chosen.filter((s) => target(s))
  const skipped = chosen.length - movable.length
  const selectable = list.filter((s) => !alreadyThere(s))

  const toggle = (id) => {
    const n = new Set(selected)
    n.has(id) ? n.delete(id) : n.add(id)
    setSelected(n)
  }
  const allSelected = selectable.length > 0 && selectable.every((s) => selected.has(s.id))

  const changeFromSession = (v) => {
    setFromSession(v)
    setToSession(nextSession(v))
  }

  const go = async () => {
    if (movable.length === 0) return alert('No students to promote')
    setBusy(true)
    try {
      const res = await window.api.promoteStudents(
        movable.map((s) => ({ id: s.id, class_name: target(s), session: toSession }))
      )
      onDone(res.promoted, toSession)
    } catch (err) {
      alert('Error: ' + err.message)
      setBusy(false)
    }
  }

  const modes = [
    { id: 'auto', label: 'Next class' },
    { id: 'same', label: 'Same class' },
    { id: 'fixed', label: 'Choose class' }
  ]

  return (
    <div
      onClick={onClose}
      className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-pop flex max-h-[90vh] w-[720px] max-w-full flex-col rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <PromoteIcon />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Promote Students</h2>
              <p className="text-xs text-slate-500">
                The old record stays in the old session. A new record is created in the new session.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <XIcon />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="From session">
              <select className={inputCls} value={fromSession} onChange={(e) => changeFromSession(e.target.value)}>
                {(sessionsInData.length ? sessionsInData : [fromSession]).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="From class">
              <select className={inputCls} value={fromClass} onChange={(e) => setFromClass(e.target.value)}>
                <option value="">All classes</option>
                {CLASSES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="To session">
              <select className={inputCls} value={toSession} onChange={(e) => setToSession(e.target.value)}>
                {ALL_SESSIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Promote to">
              <div className="flex rounded-lg bg-slate-100 p-1">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                      mode === m.id ? 'bg-white text-indigo-600 shadow' : 'text-slate-500'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </Field>
            {mode === 'fixed' && (
              <div className="anim-fade-up col-span-2">
                <Field label="Move all selected students to class">
                  <select className={inputCls} value={toClass} onChange={(e) => setToClass(e.target.value)}>
                    {CLASSES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 text-sm">
              <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() =>
                    setSelected(allSelected ? new Set() : new Set(selectable.map((s) => s.id)))
                  }
                  className="h-4 w-4 accent-indigo-600"
                />
                Select all ({selectable.length})
              </label>
              <span className="text-slate-500">{chosen.length} selected</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {list.length === 0 && (
                <div className="py-10 text-center text-sm text-slate-400">
                  No students in this session / class
                </div>
              )}
              {list.map((s) => {
                const t = target(s)
                const done = alreadyThere(s)
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 border-t border-slate-100 px-4 py-2 text-sm transition ${
                      done ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={done}
                      checked={selected.has(s.id) && !done}
                      onChange={() => toggle(s.id)}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <Avatar s={s} size="h-8 w-8" text="text-xs" />
                    <div className="flex-1 font-medium text-slate-800">{s.name}</div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${badgeFor(s.class_name)}`}>
                      {s.class_name}
                    </span>
                    <ArrowRightIcon className="h-4 w-4 text-slate-400" />
                    {done ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-700">
                        Already in {toSession}
                      </span>
                    ) : t ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs ${badgeFor(t)}`}>{t}</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                        No next class
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>

          {skipped > 0 && (
            <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
              {skipped} selected student(s) are in the last class and will be skipped.
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={go}
            disabled={busy || movable.length === 0}
            className="flex-1 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Promoting...' : `Promote ${movable.length} student(s) to ${toSession}`}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- STUDENTS ---------- */
function Students({ students, reload }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState(null)

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = usePersisted('classFilter', '')
  const [sectionFilter, setSectionFilter] = usePersisted('sectionFilter', '')
  const [sessionFilter, setSessionFilter] = useState('')

  const [viewOpen, setViewOpen] = useState(false)
  const [viewing, setViewing] = useState(null)

  const [deleting, setDeleting] = useState(null)
  const [promoteOpen, setPromoteOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState('')
  const [preview, setPreview] = useState(null)
  const [pageSize, setPageSize] = useState('A4')
  const [orientation, setOrientation] = useState('landscape')

  const [brand, setBrand] = useState({ name: 'School System', address: '', logo: '' })
  const [formPreview, setFormPreview] = useState(null)

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

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  const nextAdmissionNo = () => {
    const maxNum = students.reduce((m, s) => {
      const n = parseInt(String(s.admission_no || '').replace(/\D/g, ''), 10)
      return Math.max(m, isNaN(n) ? 0 : n)
    }, 0)
    return 'ADM-' + String(maxNum + 1).padStart(4, '0')
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  /* Short helpers for the form fields */
  const txt = (key, label, props = {}) => (
    <Field label={label}>
      <input className={inputCls} value={form[key]} onChange={set(key)} {...props} />
    </Field>
  )
  const sel = (key, label, options, placeholder = 'Select') => (
    <Field label={label}>
      <select className={inputCls} value={form[key]} onChange={set(key)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </Field>
  )

  const openAdd = () => {
    setForm(emptyForm())
    setEditingId(null)
    setDrawerOpen(true)
  }

  const openEdit = (s) => {
    const f = emptyForm()
    Object.keys(f).forEach((k) => {
      f[k] = s[k] ?? ''
    })
    if (!f.session) f.session = currentSession()
    setForm(f)
    setEditingId(s.id)
    setDrawerOpen(true)
  }

  const openView = (s) => {
    setViewing(s)
    setViewOpen(true)
  }

  const pickPhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 300
        const scale = Math.min(max / img.width, max / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        setForm((f) => ({ ...f, photo: canvas.toDataURL('image/jpeg', 0.8) }))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const validateCnic = (v) => {
    if (!v) return true
    return /^\d{13}$/.test(String(v).replace(/\D/g, ''))
  }

  const save = async () => {
    try {
      if (!form.name.trim()) return alert('Student name is required')
      if (!form.class_name) return alert('Please select a class')
      if (!form.session) return alert('Please select a session')
      if (form.father_cnic && !validateCnic(form.father_cnic)) {
        return alert('Father CNIC must be exactly 13 digits (numbers only)')
      }
      const data = { ...form, admission_no: form.admission_no || nextAdmissionNo() }
      if (editingId) {
        await window.api.updateStudent({ ...data, id: editingId })
        showToast('Student updated successfully')
      } else {
        await window.api.addStudent(data)
        showToast('Student added successfully')
      }
      setDrawerOpen(false)
      await reload()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const confirmDelete = async () => {
    await window.api.deleteStudent(deleting.id)
    setDeleting(null)
    showToast('Student deleted')
    reload()
  }

  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const filtered = students.filter((s) => {
    if (classFilter && s.class_name !== classFilter) return false
    if (sectionFilter && s.section !== sectionFilter) return false
    if (sessionFilter && s.session !== sessionFilter) return false
    if (words.length === 0) return true
    const text = Object.entries(s)
      .filter(([k]) => k !== 'photo')
      .map(([, v]) => String(v ?? ''))
      .join(' ')
      .toLowerCase()
    return words.every((w) => text.includes(w))
  })

  const sessionsInData = [...new Set(students.map((s) => s.session).filter(Boolean))].sort().reverse()
  const hasFilters = search || classFilter || sectionFilter || sessionFilter
  const clearFilters = () => {
    setSearch('')
    setClassFilter('')
    setSectionFilter('')
    setSessionFilter('')
  }

  /* ---------- ADMISSION FORM PRINT (A4) ---------- */
  const buildAdmissionFormHtml = (s) => {
    const esc = (v) =>
      String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    const blank = (v) => (v ? esc(v) : '<span class="blank"></span>')

    // Helpers for the new structured design
    const box = (label, value, opts = {}) => {
      const cls = opts.full ? 'field full' : 'field'
      return `<div class="${cls}">
        <div class="lbl">${esc(label)}</div>
        <div class="val">${blank(value)}</div>
      </div>`
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Admission Form — ${esc(s.name)}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 6px; font-size: 10px; }

  /* Header */
  .head { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #1e40af; padding-bottom: 12px; margin-bottom: 16px; }
  .head img { height: 64px; width: 64px; object-fit: contain; border-radius: 8px; background: #f8fafc; padding: 4px; border: 1px solid #e2e8f0; }
  .head .txt { flex: 1; }
  .head h1 { margin: 0; font-size: 22px; color: #1e3a8a; letter-spacing: 1px; font-weight: 800; text-transform: uppercase; }
  .head .addr { font-size: 11px; color: #475569; margin-top: 4px; }
  .head .title { margin-top: 6px; font-size: 13px; font-weight: 700; color: #ffffff; background: #1e40af; display: inline-block; padding: 2px 10px; border-radius: 4px; letter-spacing: 1px; }
  .photo-box { width: 90px; height: 110px; border: 2px dashed #94a3b8; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #94a3b8; overflow: hidden; background: #f8fafc; }
  .photo-box img { width: 100%; height: 100%; object-fit: cover; }

  /* Sections */
  .section { margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
  .section-h { background: #f1f5f9; color: #1e40af; padding: 6px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #cbd5e1; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
  .field { padding: 8px 12px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
  .field.full { grid-column: 1 / -1; }
  .field:last-child { border-right: none; }
  .lbl { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .val { font-size: 12px; font-weight: 600; color: #1e293b; min-height: 16px; }
  .blank { display: inline-block; width: 100%; border-bottom: 1px dotted #cbd5e1; min-height: 14px; }

  /* Office Use */
  .office { margin-top: 16px; border: 2px solid #1e40af; border-radius: 8px; overflow: hidden; }
  .office-h { background: #1e40af; color: #fff; padding: 6px 12px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
  .office-body { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
  .office-body .field { border-bottom: none; border-right: 1px solid #e2e8f0; padding: 12px; min-height: 60px; }
  .office-body .field:last-child { border-right: none; }
  .sign-line { border-bottom: 1px solid #94a3b8; height: 30px; margin-top: 12px; }

  /* Declaration */
  .decl { margin-top: 14px; padding: 10px 14px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 10px; color: #475569; line-height: 1.5; text-align: justify; }

  /* Footer */
  .footer { margin-top: 16px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
</style></head><body>

<div class="head">
  ${brand.logo ? `<img src="${brand.logo}" alt="logo" />` : ''}
  <div class="txt">
    <h1>${esc(brand.name)}</h1>
    ${brand.address ? `<div class="addr">${esc(brand.address)}</div>` : ''}
    <div class="title">Student Admission Form</div>
  </div>
  <div class="photo-box">${s.photo ? `<img src="${s.photo}" alt="photo" />` : 'PHOTO'}</div>
</div>

<div class="section">
  <div class="section-h">1. Basic Information</div>
  <div class="grid">
    ${box('Admission No', s.admission_no)}
    ${box('Admission Date', s.admission_date)}
    ${box('Session', s.session)}
    ${box('Class', s.class_name)}

    ${box('Section', s.section)}
    ${box('Roll No', s.roll_no)}
    ${box('Date of Birth', s.dob)}
    ${box('Gender', s.gender)}

    ${box('Blood Group', s.blood_group)}
    ${box('Caste / Tribe', s.caste_tribe)}
    ${box('Nationality', s.nationality)}
    ${box('Status', s.status)}
  </div>
</div>

<div class="section">
  <div class="section-h">2. Father / Guardian Information</div>
  <div class="grid">
    ${box('Father Name', s.father_name)}
    ${box('Father CNIC', s.father_cnic)}
    ${box('Occupation', s.father_occupation)}
    ${box('Phone / Mobile', s.phone)}
  </div>
</div>

<div class="section">
  <div class="section-h">3. Address Information</div>
  <div class="grid">
    ${box('Current Address', s.current_address || s.address, { full: true })}
    ${box('Permanent Address', s.permanent_address, { full: true })}
  </div>
</div>

<div class="section">
  <div class="section-h">4. Previous School / Academic Background</div>
  <div class="grid">
    ${box('Previous School', s.previous_school, { full: true })}
    ${box('SLC of Previous School', s.slc_previous_school)}
    ${box('Withdrawn From School', s.withdrawn_from_school)}
    ${box('Reason for Leaving', s.reason_for_leaving, { full: true })}
  </div>
</div>

<div class="section">
  <div class="section-h">5. Additional Information</div>
  <div class="grid">
    ${box('Mobile / Computer Usage', s.mobile_computer_usage)}
    ${box('Part-time Activity', s.part_time_activity)}
    ${box('Favorite Subject', s.favorite_subject)}
    ${box('Hobby', s.hobby)}
    ${box('Monthly Fee', s.monthly_fee)}
  </div>
</div>

<div class="decl">
  <b>Declaration:</b> I hereby declare that the information provided above is true and correct to the best of my knowledge. I understand that any false statement or omission may result in the cancellation of admission.
</div>

<div class="office">
  <div class="office-h">For Office Use Only</div>
  <div class="office-body">
    <div class="field">
      <div class="lbl">Form Filled By</div>
      <div class="val">${blank(s.form_filled_by)}</div>
      <div class="sign-line"></div>
    </div>
    <div class="field">
      <div class="lbl">Checked By</div>
      <div class="val">${blank(s.checked_by)}</div>
      <div class="sign-line"></div>
    </div>
    <div class="field">
      <div class="lbl">Office Stamp / Sign</div>
      <div class="val">${blank(s.office_stamp_sign)}</div>
      <div class="sign-line"></div>
    </div>
  </div>
</div>

<div class="footer">
  <span>Printed on: ${new Date().toLocaleString()}</span>
  <span>${esc(brand.name)} · Official Admission Record</span>
</div>
</body></html>`
  }

  const openFormPreview = () => {
    if (!form.name.trim()) return alert('Please fill the student name before printing')
    const html = buildAdmissionFormHtml({ ...form, admission_no: form.admission_no || nextAdmissionNo() })
    setFormPreview({ html })
  }

  const buildExport = (format) => {
    const parts = []
    if (classFilter) parts.push(classFilter)
    if (sectionFilter) parts.push('Section ' + sectionFilter)
    if (sessionFilter) parts.push('Session ' + sessionFilter)
    if (search.trim()) parts.push(`Search: "${search.trim()}"`)
    const rows = filtered.map((s) => {
      const r = { ...s }
      if (format !== 'print' && format !== 'pdf') delete r.photo
      return r
    })
    return { format, rows, filterText: parts.join(' | '), pageSize, orientation }
  }

  const openPreview = async () => {
    if (filtered.length === 0) return alert('There are no students to print')
    try {
      const payload = buildExport('print')
      const html = await window.api.previewStudents(payload)
      setPreview({ html, payload })
    } catch (err) {
      alert('Preview error: ' + err.message)
    }
  }

  const runExport = async (payload) => {
    setBusy(payload.format)
    try {
      const res = await window.api.exportStudents(payload)
      if (res.ok) showToast(payload.format === 'print' ? 'Sent to printer' : 'File saved successfully')
    } catch (err) {
      alert('Export error: ' + err.message)
    } finally {
      setBusy('')
    }
  }

  const doExport = async (format) => {
    if (format === 'print') return openPreview()
    if (filtered.length === 0) return alert('There are no students to export')
    await runExport(buildExport(format))
  }

  const exportButtons = [
    { key: 'print', label: 'Print', cls: 'bg-slate-100 text-slate-700 hover:bg-slate-200', icon: PrintIcon },
    { key: 'pdf', label: 'PDF', cls: 'bg-rose-50 text-rose-700 hover:bg-rose-100', icon: DownloadIcon },
    { key: 'word', label: 'Word', cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100', icon: DownloadIcon },
    { key: 'excel', label: 'Excel', cls: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', icon: DownloadIcon }
  ]

  const iconBtn = 'rounded-lg p-2 transition hover:scale-110'

  const viewSections = viewing
    ? [
        {
          title: 'Basic information',
          items: [
            ['Student Name', viewing.name],
            ['Father Name', viewing.father_name],
            ['Father CNIC', viewing.father_cnic],
            ['Father Occupation', viewing.father_occupation],
            ['Gender', viewing.gender],
            ['Date of Birth', viewing.dob],
            ['Blood Group', viewing.blood_group],
            ['Caste / Tribe', viewing.caste_tribe],
            ['Nationality', viewing.nationality],
            ['Status', viewing.status]
          ]
        },
        {
          title: 'Academic and fee',
          items: [
            ['Class', viewing.class_name],
            ['Section', viewing.section],
            ['Session', viewing.session],
            ['Admission No', viewing.admission_no],
            ['Roll No', viewing.roll_no],
            ['Admission Date', viewing.admission_date],
            ['Monthly Fee', viewing.monthly_fee || 0],
            ['Previous School', viewing.previous_school],
            ['SLC of Previous School', viewing.slc_previous_school],
            ['Withdrawn From School', viewing.withdrawn_from_school],
            ['Reason for Leaving', viewing.reason_for_leaving]
          ]
        },
        {
          title: 'Contact',
          items: [
            ['Phone', viewing.phone],
            ['Current Address', viewing.current_address || viewing.address],
            ['Permanent Address', viewing.permanent_address]
          ]
        },
        {
          title: 'Additional information',
          items: [
            ['Mobile / Computer Usage', viewing.mobile_computer_usage],
            ['Part-time Activity', viewing.part_time_activity],
            ['Favorite Subject', viewing.favorite_subject],
            ['Hobby', viewing.hobby]
          ]
        },
        {
          title: 'For office use only',
          items: [
            ['Form Filled By', viewing.form_filled_by],
            ['Checked By', viewing.checked_by],
            ['Office Stamp / Sign', viewing.office_stamp_sign]
          ]
        }
      ]
    : []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students</h1>
          <p className="text-sm text-slate-500">Manage admissions and student records</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              const confirmImport = confirm("Make sure your PDF has fields like:\nName: \nFather Name: \nClass: \n\nDo you want to select the PDF now?");
              if (!confirmImport) return;

              setBusy('import');
              try {
                const res = await window.api.importPdfStudents();
                if (res.ok) {
                  showToast(`Successfully imported ${res.count} students!`);
                  await reload(); // Refresh the student list
                } else if (res.reason !== 'Cancelled') {
                  alert('Import Failed: ' + res.reason);
                }
              } catch (err) {
                alert('Error: ' + err.message);
              } finally {
                setBusy('');
              }
            }}
            disabled={busy === 'import'}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-emerald-600/30 transition hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
          >
            <DownloadIcon className="h-5 w-5" />
            {busy === 'import' ? 'Importing...' : 'Import PDF'}
          </button>
          <button
            onClick={() => setPromoteOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:bg-indigo-700 active:scale-95"
          >
            <PromoteIcon className="h-5 w-5" /> Promote
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-700 active:scale-95"
          >
            <PlusIcon className="h-5 w-5" /> Add Student
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[260px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Search name, father, CNIC, phone, admission no, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <XIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <select className={filterCls} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All classes</option>
          {CLASSES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className={filterCls} value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
          <option value="">All sections</option>
          {SECTIONS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className={filterCls} value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}>
          <option value="">All sessions</option>
          {sessionsInData.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="anim-fade-in rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
          >
            Clear
          </button>
        )}
      </div>

      <div className="anim-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
          <div className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filtered.length}</span> of{' '}
            {students.length} records
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <span className="px-2 text-[11px] font-semibold text-slate-500">Size:</span>
              {['A4', 'A5'].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setPageSize(sz)}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                    pageSize === sz ? 'bg-white text-blue-600 shadow' : 'text-slate-500'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <span className="px-2 text-[11px] font-semibold text-slate-500">Layout:</span>
              {['portrait', 'landscape'].map((o) => (
                <button
                  key={o}
                  onClick={() => setOrientation(o)}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold capitalize transition ${
                    orientation === o ? 'bg-white text-blue-600 shadow' : 'text-slate-500'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
            {exportButtons.map((b) => (
              <button
                key={b.key}
                onClick={() => doExport(b.key)}
                disabled={!!busy}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 ${b.cls}`}
              >
                <b.icon className="h-4 w-4" />
                {busy === b.key ? 'Please wait...' : b.label}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- STUDENT TABLE ---------- */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-4 py-3">Admission</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Monthly fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => {
                const active = (s.status || 'Active') === 'Active'
                return (
                  <tr key={s.id} className="group transition-colors hover:bg-blue-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar s={s} size="h-11 w-11" />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-800">{s.name}</div>
                          <div className="truncate text-xs text-slate-500">
                            {s.father_name ? `S/O ${s.father_name}` : 'Father name not added'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700">{s.admission_no || '-'}</div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {s.father_cnic || 'No CNIC'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeFor(
                          s.class_name
                        )}`}
                      >
                        {s.class_name}
                        {s.section ? ` - ${s.section}` : ''}
                      </span>
                      <div className="mt-1 text-[11px] text-slate-400">
                        Session {s.session || '-'}
                        {s.roll_no ? ` | Roll ${s.roll_no}` : ''}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700">{s.phone || '-'}</div>
                      <div className="text-[11px] text-slate-400">
                        {s.dob ? `Born ${s.dob}` : 'No date of birth'}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-800">
                      Rs. {Number(s.monthly_fee || 0).toLocaleString('en-US')}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`}
                        />
                        {s.status || 'Active'}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1 opacity-70 transition group-hover:opacity-100">
                        <button onClick={() => openView(s)} title="View details" className={`${iconBtn} text-blue-600 hover:bg-blue-100`}>
                          <EyeIcon className="h-[18px] w-[18px]" />
                        </button>
                        <button onClick={() => openEdit(s)} title="Edit" className={`${iconBtn} text-amber-600 hover:bg-amber-100`}>
                          <PencilIcon className="h-[18px] w-[18px]" />
                        </button>
                        <button onClick={() => setDeleting(s)} title="Delete" className={`${iconBtn} text-rose-600 hover:bg-rose-100`}>
                          <TrashIcon className="h-[18px] w-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <SearchIcon className="mx-auto mb-3 h-10 w-10" />
            No students found
          </div>
        )}
      </div>

      {/* ==================== DRAWER ==================== */}
      <Portal>
        <div
          onClick={() => setDrawerOpen(false)}
          className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
        <div
          className={`fixed right-0 top-0 z-50 flex h-screen w-[700px] max-w-full flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ease-out ${
            drawerOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt="logo"
                  className="h-11 w-11 rounded-xl bg-white object-contain p-1 ring-1 ring-slate-200"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
                  {(brand.name || 'S').charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-base font-bold text-slate-800">
                  {editingId ? 'Edit student' : 'New admission'}
                </div>
                <div className="truncate text-xs text-slate-500">{brand.name}</div>
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            >
              <XIcon />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {/* Photo */}
            <section className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                {form.photo ? (
                  <img src={form.photo} className="h-full w-full object-cover" />
                ) : (
                  'No photo'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-800">Student photo</div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Shown on the admission form and the ID card.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
                    {form.photo ? 'Change photo' : 'Upload photo'}
                    <input type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
                  </label>
                  {form.photo && (
                    <button
                      onClick={() => setForm({ ...form, photo: '' })}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Student */}
            <FormSection title="Student details" hint="Fields with * are required">
              <div className="grid grid-cols-2 gap-3">
                {txt('name', 'Student name *', { placeholder: 'Full name' })}
                <Field label="Date of birth">
                  <input type="date" className={inputCls} value={form.dob} onChange={set('dob')} />
                </Field>
                {sel('gender', 'Gender', ['Male', 'Female'])}
                {sel('blood_group', 'Blood group', BLOOD)}
                {txt('caste_tribe', 'Caste / tribe', { placeholder: 'e.g. Yousafzai' })}
                {txt('nationality', 'Nationality', { placeholder: 'e.g. Pakistani' })}
              </div>
            </FormSection>

            {/* Father */}
            <FormSection title="Father / guardian" accent="bg-indigo-600">
              <div className="grid grid-cols-2 gap-3">
                {txt('father_name', 'Father name', { placeholder: "Father's full name" })}
                <Field label="Father CNIC (13 digits)">
                  <input
                    className={inputCls}
                    value={form.father_cnic}
                    onChange={(e) =>
                      setForm({ ...form, father_cnic: e.target.value.replace(/\D/g, '').slice(0, 13) })
                    }
                    placeholder="1234512345671"
                    maxLength={13}
                    inputMode="numeric"
                  />
                </Field>
                {txt('father_occupation', 'Occupation', { placeholder: 'e.g. Teacher, Farmer' })}
                {txt('phone', 'Phone', { placeholder: '03XX-XXXXXXX' })}
              </div>
            </FormSection>

            {/* Academic */}
            <FormSection title="Class and fee" accent="bg-emerald-600">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Session *">
                  <select className={inputCls} value={form.session} onChange={set('session')}>
                    {ALL_SESSIONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                {sel('class_name', 'Class *', CLASSES, 'Select class')}
                {sel('section', 'Section', SECTIONS, 'None')}
                {txt('roll_no', 'Roll no')}
                {txt('admission_no', 'Admission no', { placeholder: nextAdmissionNo() })}
                <Field label="Admission date">
                  <input
                    type="date"
                    className={inputCls}
                    value={form.admission_date}
                    onChange={set('admission_date')}
                  />
                </Field>
                <Field label="Monthly fee (Rs.)">
                  <input
                    type="number"
                    className={inputCls}
                    value={form.monthly_fee}
                    onChange={set('monthly_fee')}
                    placeholder="0"
                  />
                </Field>
                <Field label="Status">
                  <select className={inputCls} value={form.status} onChange={set('status')}>
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Left</option>
                    <option>Graduated</option>
                  </select>
                </Field>
              </div>
            </FormSection>

            {/* Address */}
            <FormSection title="Address" accent="bg-amber-500">
              <div className="grid grid-cols-1 gap-3">
                {txt('current_address', 'Current address', { placeholder: 'House no, street, area, city' })}
                {txt('permanent_address', 'Permanent address', { placeholder: 'House no, street, area, city' })}
              </div>
            </FormSection>

            {/* Previous school */}
            <FormSection title="Previous school" accent="bg-cyan-600">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">{txt('previous_school', 'School name')}</div>
                {txt('slc_previous_school', 'School leaving certificate', { placeholder: 'Yes / No / Number' })}
                {txt('withdrawn_from_school', 'Withdrawn from school', { placeholder: 'Date or reason' })}
                <div className="col-span-2">{txt('reason_for_leaving', 'Reason for leaving')}</div>
              </div>
            </FormSection>

            {/* Additional */}
            <FormSection title="Additional information" accent="bg-rose-500">
              <div className="grid grid-cols-2 gap-3">
                {txt('mobile_computer_usage', 'Mobile / computer use', { placeholder: 'Yes / Sometimes / No' })}
                {txt('part_time_activity', 'Part-time activity', { placeholder: 'Madrassa, tuition ...' })}
                {txt('favorite_subject', 'Favorite subject')}
                {txt('hobby', 'Hobby', { placeholder: 'Cricket, reading ...' })}
              </div>
            </FormSection>

            {/* Office */}
            <section className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <LockIcon className="h-4 w-4 text-blue-600" />
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-blue-800">For office use only</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {txt('form_filled_by', 'Form filled by')}
                {txt('checked_by', 'Checked by')}
                {txt('office_stamp_sign', 'Stamp / sign')}
              </div>
            </section>
          </div>

          {/* Footer (always visible) */}
          <div className="flex gap-3 border-t border-slate-200 bg-white px-6 py-4">
            <button
              onClick={save}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-95"
            >
              {editingId ? 'Update student' : 'Save student'}
            </button>
            <button
              onClick={openFormPreview}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95"
            >
              <PrintIcon className="h-4 w-4" /> Print A4
            </button>
            <button
              onClick={() => setDrawerOpen(false)}
              className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </Portal>

      {/* ==================== FORM PRINT PREVIEW ==================== */}
      {formPreview && (
        <Portal>
          <div className="anim-fade-in fixed inset-0 z-50 flex flex-col bg-slate-900/60 p-5 backdrop-blur-sm">
            <div className="mx-auto mb-3 flex w-full max-w-[900px] items-center justify-between rounded-xl bg-white px-5 py-3 shadow-xl">
              <div>
                <h2 className="font-bold text-slate-800">Admission Form — Print Preview</h2>
                <p className="text-xs text-slate-500">A4 Portrait · {form.name || 'Student'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const frame = document.getElementById('form-print-frame')
                    if (frame) {
                      frame.contentWindow.focus()
                      frame.contentWindow.print()
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95"
                >
                  <PrintIcon className="h-4 w-4" /> Print
                </button>
                <button
                  onClick={() => setFormPreview(null)}
                  className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="anim-pop mx-auto w-full max-w-[900px] flex-1 overflow-hidden rounded-xl bg-white shadow-2xl">
              <iframe
                id="form-print-frame"
                title="Admission Form"
                srcDoc={formPreview.html}
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </Portal>
      )}

      {/* ==================== VIEW MODAL ==================== */}
      <Portal>
        <div
          onClick={() => setViewOpen(false)}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity duration-300 ${
            viewOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          {viewing && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`max-h-[90vh] w-[600px] max-w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 ${
                viewOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-90'
              }`}
            >
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar s={viewing} size="h-20 w-20" text="text-3xl" />
                  <div>
                    <div className="text-xl font-bold text-slate-800">{viewing.name}</div>
                    <div className="text-sm text-slate-500">
                      {viewing.class_name}
                      {viewing.section ? ` - ${viewing.section}` : ''} · {viewing.session}
                    </div>
                  </div>
                </div>
                <button onClick={() => setViewOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                  <XIcon />
                </button>
              </div>

              {viewSections.map((sec) => (
                <div key={sec.title} className="mb-5">
                  <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{sec.title}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {sec.items.map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-slate-50 px-4 py-2.5">
                        <div className="text-[11px] font-semibold text-slate-500">{k}</div>
                        <div className="mt-0.5 font-medium text-slate-800">{v || '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Portal>

      {/* ==================== PROMOTE ==================== */}
      {promoteOpen && (
        <Portal>
          <PromoteModal
            students={students}
            onClose={() => setPromoteOpen(false)}
            onDone={async (count, session) => {
              setPromoteOpen(false)
              await reload()
              showToast(`${count} student(s) promoted to ${session}`)
            }}
          />
        </Portal>
      )}

      {/* ==================== DELETE ==================== */}
      {deleting && (
        <Portal>
          <div className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="anim-pop w-[400px] rounded-2xl bg-white p-6 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <TrashIcon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Delete student?</h3>
              <p className="mt-1 text-sm text-slate-500">
                {deleting.name} ({deleting.session}) and the attendance of this student will be removed
                permanently. This cannot be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setDeleting(null)} className="flex-1 rounded-xl bg-slate-100 py-2.5 font-semibold text-slate-700 hover:bg-slate-200">
                  Cancel
                </button>
                <button onClick={confirmDelete} className="flex-1 rounded-xl bg-rose-600 py-2.5 font-semibold text-white hover:bg-rose-700">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ==================== STUDENTS LIST PREVIEW ==================== */}
      {preview && (
        <Portal>
          <div className="anim-fade-in fixed inset-0 z-50 flex flex-col bg-slate-900/60 p-5 backdrop-blur-sm">
            <div className="mx-auto mb-3 flex w-full max-w-[1150px] items-center justify-between rounded-xl bg-white px-5 py-3 shadow-xl">
              <div>
                <h2 className="font-bold text-slate-800">Print Preview</h2>
                <p className="text-xs text-slate-500">
                  {preview.payload.rows.length} students · {pageSize} · {orientation}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                  {['A4', 'A5'].map((sz) => (
                    <button
                      key={sz}
                      onClick={async () => {
                        setPageSize(sz)
                        await openPreview()
                      }}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                        pageSize === sz ? 'bg-white text-blue-600 shadow' : 'text-slate-500'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                  {['portrait', 'landscape'].map((o) => (
                    <button
                      key={o}
                      onClick={async () => {
                        setOrientation(o)
                        await openPreview()
                      }}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold capitalize transition ${
                        orientation === o ? 'bg-white text-blue-600 shadow' : 'text-slate-500'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => runExport({ ...preview.payload, format: 'print' })}
                  disabled={!!busy}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                >
                  <PrintIcon className="h-4 w-4" /> Print
                </button>
                <button
                  onClick={() => runExport({ ...preview.payload, format: 'pdf' })}
                  disabled={!!busy}
                  className="flex items-center gap-2 rounded-lg bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 active:scale-95 disabled:opacity-50"
                >
                  <DownloadIcon className="h-4 w-4" /> Save PDF
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="anim-pop mx-auto w-full max-w-[1150px] flex-1 overflow-hidden rounded-xl bg-white shadow-2xl">
              <iframe title="Print preview" srcDoc={preview.html} className="h-full w-full border-0" />
            </div>
          </div>
        </Portal>
      )}

      {/* ==================== TOAST ==================== */}
      <Portal>
        <div
          className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-xl transition-all duration-300 ${
            toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          <CheckIcon className="h-5 w-5" /> {toast}
        </div>
      </Portal>
    </div>
  )
}

function ComingSoon({ title }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">{title}</h1>
      <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
        This section will be built in the next steps.
      </div>
    </div>
  )
}

/* ============================================================
   🔴 LICENSE SCREEN
   ============================================================ */
function LicenseScreen({ onActivated }) {
  const [machineId, setMachineId] = useState('')
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (window.api?.getMachineId) {
      window.api.getMachineId().then(setMachineId).catch(() => setMachineId('ERROR'))
    } else {
      setMachineId('API NOT FOUND')
    }
  }, [])

  const copyId = () => {
    if (!machineId) return
    navigator.clipboard?.writeText(machineId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const activate = async () => {
    setBusy(true)
    setError('')
    try {
      const ok = await window.api.activateLicense({ machineId, key: key.trim().toUpperCase() })
      if (ok) onActivated()
      else setError('Invalid license key for this computer.')
    } catch (err) {
      setError('Error: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-[480px] max-w-full rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
            <LockIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Software Activation</h1>
            <p className="text-xs text-slate-500">School Management System</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-slate-600">
          This software is locked to your computer. Send the <b>Machine ID</b> below to the
          developer, then paste the license key you receive.
        </p>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Your Machine ID
            </div>
            <button
              onClick={copyId}
              className="text-[10px] font-bold uppercase tracking-wider text-teal-700 hover:underline"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="mt-1 select-all break-all font-mono text-2xl font-bold tracking-widest text-teal-700">
            {machineId || 'Generating...'}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            License Key
          </span>
          <input
            className="w-full rounded-xl border-2 border-slate-300 px-3 py-3 text-center font-mono text-lg font-bold tracking-widest text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="XXXXXXXXXXXXXXXX"
            maxLength={16}
          />
        </label>

        {error && (
          <div className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <button
          onClick={activate}
          disabled={!machineId || key.length < 16 || busy}
          className="mt-5 w-full rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Activating...' : 'Activate Software'}
        </button>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          © {new Date().getFullYear()} School Management System · All rights reserved
        </p>
      </div>
    </div>
  )
}

/* ============================================================
   🔴 APP
   ============================================================ */
export default function App() {
  const [page, setPage] = useState('dashboard')
  const [collapsed, setCollapsed] = usePersisted('sidebarCollapsed', false)
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [settings, setSettings] = useState({})

  const [licenseChecked, setLicenseChecked] = useState(false)
  const [licenseStatus, setLicenseStatus] = useState({ active: false, reason: 'Not checked' })

  const loadStudents = async () => setStudents(await window.api.listStudents())
  const loadTeachers = async () => setTeachers(await window.api.listTeachers())

  const loadSettings = async () => {
    try {
      const s = await window.api.getSettings()
      setSettings(s || {})
      applyTheme((s && s.theme) || 'light')
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        if (window.api?.checkLicense) {
          const result = await window.api.checkLicense()
          console.log('[APP] License result:', result)
          if (typeof result === 'boolean') {
            setLicenseStatus(
              result
                ? { active: true, reason: 'Active' }
                : { active: false, reason: 'Not activated' }
            )
          } else if (result && typeof result === 'object') {
            setLicenseStatus(result)
          } else {
            setLicenseStatus({ active: false, reason: 'Not activated' })
          }
        } else {
          setLicenseStatus({ active: false, reason: 'License API not found' })
        }
      } catch (err) {
        console.error('[APP] License error:', err)
        setLicenseStatus({ active: false, reason: 'Error: ' + err.message })
      } finally {
        setLicenseChecked(true)
      }
    })()
  }, [])

  useEffect(() => {
    if (!licenseStatus.active) return
    loadStudents()
    loadTeachers()
    loadSettings()
    const onSaved = () => loadSettings()
    window.addEventListener('settings-saved', onSaved)
    return () => window.removeEventListener('settings-saved', onSaved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseStatus.active])

  if (!licenseChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-teal-600" />
          <div className="text-sm text-slate-500">Verifying license...</div>
        </div>
      </div>
    )
  }

  if (!licenseStatus.active) {
    const reason = String(licenseStatus.reason || '').toLowerCase()
    if (reason.includes('not activated')) {
      return <LicenseScreen onActivated={() => setLicenseStatus({ active: true, reason: 'Active' })} />
    }
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-rose-50 text-center p-8">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold text-rose-700">Access Blocked</h1>
        <p className="mt-2 text-slate-600 max-w-md">{licenseStatus.reason}</p>
        <p className="mt-4 text-xs text-slate-400">Contact: jamshid804a-cmyk (Developer)</p>
      </div>
    )
  }

  const current = menu.find((m) => m.id === page)

  return (
    <div className="flex h-screen bg-slate-100">
      <aside
        className={`relative flex shrink-0 flex-col overflow-hidden bg-slate-900 text-slate-200 shadow-2xl transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div
          className={`relative flex items-center border-b border-slate-800/80 py-4 ${
            collapsed ? 'justify-center px-3' : 'justify-between px-3'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3 overflow-hidden">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt="logo"
                className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain p-1 shadow-lg ring-1 ring-white/20"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-600/40">
                <SidebarIcon id="dashboard" className="h-5 w-5" />
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-bold leading-tight text-white">
                  {settings.schoolName || 'School System'}
                </div>
                <div className="truncate text-xs leading-tight text-slate-400">
                  {settings.schoolAddress || 'Management'}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white ${
              collapsed ? 'absolute -right-3 top-4 bg-slate-800 shadow-lg' : ''
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {menu.map((m, i) => {
            const active = page === m.id
            return (
              <div key={m.id} style={{ animationDelay: `${i * 25}ms` }} className="anim-fade-up">
                <button
                  onClick={() => setPage(m.id)}
                  title={collapsed ? m.label : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  {active && !collapsed && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white/90" />
                  )}
                  <SidebarIcon
                    id={m.id}
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                      active ? 'scale-110' : 'group-hover:scale-110'
                    }`}
                  />
                  {!collapsed && <span className="truncate font-medium">{m.label}</span>}
                  {collapsed && (
                    <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl ring-1 ring-slate-700 transition-all duration-150 group-hover:ml-4 group-hover:opacity-100">
                      {m.label}
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </nav>

        <div
          className={`relative border-t border-slate-800/80 px-3 py-3 ${
            collapsed ? 'flex justify-center' : ''
          }`}
        >
          {collapsed ? (
            settings.userPhoto ? (
              <img
                src={settings.userPhoto}
                alt="you"
                className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-400/50"
                title={`${settings.userName || 'Admin'} · ${settings.userRole || 'Administrator'}`}
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-lg"
                title={`${settings.userName || 'Admin'} · ${settings.userRole || 'Administrator'}`}
              >
                {(settings.userName || 'A').charAt(0).toUpperCase()}
              </div>
            )
          ) : (
            <div className="flex items-center gap-3">
              {settings.userPhoto ? (
                <img
                  src={settings.userPhoto}
                  alt="you"
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-emerald-400/50 shadow-lg"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-lg">
                  {(settings.userName || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">
                  {settings.userName || 'Admin'}
                </div>
                <div className="truncate text-xs text-slate-400">
                  {settings.userRole || 'Administrator'}
                </div>
              </div>
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60" />
            </div>
          )}
        </div>
      </aside>

      <main className="relative min-w-0 flex-1 overflow-y-auto p-8">
        <div key={page} className="anim-fade-up">
          {page === 'dashboard' && <Dashboard students={students} teachers={teachers} />}
          {page === 'students' && <Students students={students} reload={loadStudents} />}
          {page === 'attendance' && <Attendance students={students} />}
          {page === 'teachers' && <Teachers teachers={teachers} reload={loadTeachers} />}
          {page === 'teacher_attendance' && <TeacherAttendance teachers={teachers} />}
          {page === 'fees' && <Fees students={students} />}
          {page === 'exams' && <Exams students={students} />}
          {page === 'timetable' && <TimeTable teachers={teachers} />}
          {page === 'settings' && <Settings reloadPrintBrand={loadSettings} />}
          {!built.includes(page) && <ComingSoon title={current.label} />}
          {page === 'idcards' && <IdCards students={students} />}
          {page === 'papers' && <Papers />}
          {page === 'certificates' && <Certificate />}
        </div>
      </main>
    </div>
  )
}