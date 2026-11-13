import { useState } from 'react'
import { createPortal } from 'react-dom'

const CLASSES = [
  'Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
]
const SECTIONS = ['A', 'B', 'C', 'D']
const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const DESIGNATIONS = [
  'Teacher', 'Senior Teacher', 'Head Teacher', 'Vice Principal', 'Principal', 'Lab Assistant', 'Clerk'
]
const QUALIFICATIONS = [
  'Matric', 'FA / F.Sc', 'BA / B.Sc', 'BS', 'B.Ed', 'MA / M.Sc', 'M.Ed', 'MS / M.Phil', 'PhD'
]

const today = () => new Date().toISOString().slice(0, 10)
const classList = (t) =>
  String(t.assigned_classes || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

const emptyForm = () => ({
  employee_id: '',
  name: '',
  father_name: '',
  gender: '',
  blood_group: '',
  qualification: '',
  designation: 'Teacher',
  subjects: '',
  assigned_classes: '',
  class_teacher_of: '',
  class_teacher_section: '',
  experience: '',
  joining_date: today(),
  monthly_salary: '',
  status: 'Active',
  phone: '',
  email: '',
  address: '',
  photo: ''
})

const Portal = ({ children }) => createPortal(children, document.body)

/* ---------- ICONS ---------- */
const Icon = ({ d, className = 'h-5 w-5', children }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className={className}>
    {d ? <path strokeLinecap="round" strokeLinejoin="round" d={d} /> : children}
  </svg>
)
const PlusIcon = (p) => <Icon {...p} d="M12 4.5v15m7.5-7.5h-15" />
const XIcon = (p) => <Icon {...p} d="M6 18L18 6M6 6l12 12" />
const SearchIcon = (p) => (
  <Icon {...p} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
)
const PencilIcon = (p) => (
  <Icon {...p} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
)
const TrashIcon = (p) => (
  <Icon {...p} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
)
const EyeIcon = (p) => (
  <Icon {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </Icon>
)
const CheckIcon = (p) => <Icon {...p} d="M4.5 12.75l6 6 9-13.5" />
const PrintIcon = (p) => (
  <Icon {...p} d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a1 1 0 011-1h16a1 1 0 011 1v6a1 1 0 01-1 1h-2M6 14h12v7H6z" />
)
const DownloadIcon = (p) => <Icon {...p} d="M12 4v11m0 0l-4-4m4 4l4-4M4 20h16" />

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100'
const filterCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function Avatar({ t, size = 'h-10 w-10', text = 'text-sm' }) {
  if (t.photo) return <img src={t.photo} className={`${size} rounded-full object-cover`} />
  return (
    <div className={`${size} ${text} flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 font-semibold text-white`}>
      {(t.name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

const statusCls = (s) =>
  s === 'Left' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'

export default function Teachers({ teachers, reload }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState(null)

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [viewOpen, setViewOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState('')
  const [preview, setPreview] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  const nextEmployeeId = () => {
    const maxNum = teachers.reduce((m, t) => {
      const n = parseInt(String(t.employee_id || '').replace(/\D/g, ''), 10)
      return Math.max(m, isNaN(n) ? 0 : n)
    }, 0)
    return 'TCH-' + String(maxNum + 1).padStart(4, '0')
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const formClasses = classList(form)
  const toggleClass = (c) => {
    const has = formClasses.includes(c)
    const next = has ? formClasses.filter((x) => x !== c) : [...formClasses, c]
    next.sort((a, b) => CLASSES.indexOf(a) - CLASSES.indexOf(b))
    setForm({ ...form, assigned_classes: next.join(', ') })
  }

  const openAdd = () => {
    setForm(emptyForm())
    setEditingId(null)
    setDrawerOpen(true)
  }
  const openEdit = (t) => {
    const f = emptyForm()
    Object.keys(f).forEach((k) => {
      f[k] = t[k] ?? ''
    })
    setForm(f)
    setEditingId(t.id)
    setDrawerOpen(true)
  }
  const openView = (t) => {
    setViewing(t)
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

  const save = async () => {
    try {
      if (!form.name.trim()) return alert('Teacher name is required')
      if (!form.phone.trim()) return alert('Phone number is required')
      const data = { ...form, employee_id: form.employee_id || nextEmployeeId() }
      if (editingId) {
        await window.api.updateTeacher({ ...data, id: editingId })
        showToast('Teacher updated successfully')
      } else {
        await window.api.addTeacher(data)
        showToast('Teacher added successfully')
      }
      setDrawerOpen(false)
      await reload()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const confirmDelete = async () => {
    await window.api.deleteTeacher(deleting.id)
    setDeleting(null)
    showToast('Teacher deleted')
    reload()
  }

  // Filters + search in EVERY field
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const filtered = teachers.filter((t) => {
    if (classFilter && !classList(t).includes(classFilter)) return false
    if (genderFilter && t.gender !== genderFilter) return false
    if (statusFilter && (t.status || 'Active') !== statusFilter) return false
    if (words.length === 0) return true
    const text = Object.entries(t)
      .filter(([k]) => k !== 'photo')
      .map(([, v]) => String(v ?? ''))
      .join(' ')
      .toLowerCase()
    return words.every((w) => text.includes(w))
  })

  const hasFilters = search || classFilter || genderFilter || statusFilter
  const clearFilters = () => {
    setSearch('')
    setClassFilter('')
    setGenderFilter('')
    setStatusFilter('')
  }

  const activeCount = teachers.filter((t) => (t.status || 'Active') === 'Active').length

  /* ---------- EXPORT / PRINT ---------- */
  const buildExport = (format) => {
    const parts = []
    if (classFilter) parts.push(classFilter)
    if (genderFilter) parts.push(genderFilter)
    if (statusFilter) parts.push(statusFilter)
    if (search.trim()) parts.push(`Search: "${search.trim()}"`)
    const rows = filtered.map((t) => {
      const r = { ...t }
      if (format !== 'print' && format !== 'pdf') delete r.photo
      return r
    })
    return { format, rows, filterText: parts.join(' | ') }
  }

  const openPreview = async () => {
    if (filtered.length === 0) return alert('There are no teachers to print')
    try {
      const payload = buildExport('print')
      const html = await window.api.previewTeachers(payload)
      setPreview({ html, payload })
    } catch (err) {
      alert('Preview error: ' + err.message)
    }
  }

  const runExport = async (payload) => {
    setBusy(payload.format)
    try {
      const res = await window.api.exportTeachers(payload)
      if (res.ok) showToast(payload.format === 'print' ? 'Sent to printer' : 'File saved successfully')
    } catch (err) {
      alert('Export error: ' + err.message)
    } finally {
      setBusy('')
    }
  }

  const doExport = async (format) => {
    if (format === 'print') return openPreview()
    if (filtered.length === 0) return alert('There are no teachers to export')
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
          title: 'Personal information',
          items: [
            ['Teacher Name', viewing.name],
            ['Father Name', viewing.father_name],
            ['Gender', viewing.gender],
            ['Blood Group', viewing.blood_group]
          ]
        },
        {
          title: 'Professional',
          items: [
            ['Employee ID', viewing.employee_id],
            ['Designation', viewing.designation],
            ['Qualification', viewing.qualification],
            ['Experience', viewing.experience ? viewing.experience + ' years' : ''],
            ['Subjects', viewing.subjects],
            [
              'Class Teacher Of',
              viewing.class_teacher_of
                ? `${viewing.class_teacher_of}${viewing.class_teacher_section ? ' - ' + viewing.class_teacher_section : ''}`
                : ''
            ],
            ['Joining Date', viewing.joining_date],
            ['Monthly Salary', viewing.monthly_salary || 0],
            ['Status', viewing.status || 'Active']
          ]
        },
        {
          title: 'Contact',
          items: [
            ['Phone', viewing.phone],
            ['Email', viewing.email],
            ['Address', viewing.address]
          ]
        }
      ]
    : []

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Teachers</h1>
          <p className="text-sm text-slate-500">Manage teacher records, qualifications and assigned classes</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-95"
        >
          <PlusIcon className="h-5 w-5" /> Add Teacher
        </button>
      </div>

      {/* Small stats */}
      <div className="mb-4 flex gap-3">
        {[
          ['Total teachers', teachers.length, 'text-slate-800'],
          ['Active', activeCount, 'text-emerald-600'],
          ['Left', teachers.length - activeCount, 'text-rose-600']
        ].map(([label, n, c], i) => (
          <div
            key={label}
            style={{ animationDelay: `${i * 70}ms` }}
            className="anim-fade-up rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-slate-200"
          >
            <span className="text-slate-500">{label}: </span>
            <span className={`font-bold ${c}`}>{n}</span>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[260px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            placeholder="Search name, qualification, subject, phone, class, employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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
        <select className={filterCls} value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="">All genders</option>
          <option>Male</option>
          <option>Female</option>
        </select>
        <select className={filterCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          <option>Active</option>
          <option>Left</option>
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="anim-fade-in rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-300">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="anim-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filtered.length}</span> of {teachers.length} teachers
          </div>
          <div className="flex gap-2">
            {exportButtons.map((b) => (
              <button
                key={b.key}
                onClick={() => doExport(b.key)}
                disabled={!!busy}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition active:scale-95 disabled:opacity-50 ${b.cls}`}
              >
                <b.icon className="h-4 w-4" />
                {busy === b.key ? 'Please wait...' : b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Teacher</th>
                <th className="px-5 py-3">Emp. ID</th>
                <th className="px-5 py-3">Qualification</th>
                <th className="px-5 py-3">Subjects</th>
                <th className="px-5 py-3">Assigned classes</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const cl = classList(t)
                return (
                  <tr
                    key={t.id}
                    style={{ animationDelay: `${Math.min(i, 14) * 35}ms` }}
                    className="anim-fade-up border-t border-slate-100 transition hover:bg-emerald-50/40"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar t={t} />
                        <div>
                          <div className="font-semibold text-slate-800">{t.name}</div>
                          <div className="text-xs text-slate-500">{t.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{t.employee_id}</td>
                    <td className="px-5 py-3">{t.qualification || '-'}</td>
                    <td className="px-5 py-3">{t.subjects || '-'}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {cl.slice(0, 3).map((c) => (
                          <span key={c} className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            {c}
                          </span>
                        ))}
                        {cl.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            +{cl.length - 3}
                          </span>
                        )}
                        {cl.length === 0 && <span className="text-slate-400">-</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">{t.phone}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusCls(t.status)}`}>
                        {t.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openView(t)} title="View details" className={`${iconBtn} text-blue-600 hover:bg-blue-50`}>
                          <EyeIcon />
                        </button>
                        <button onClick={() => openEdit(t)} title="Edit" className={`${iconBtn} text-amber-600 hover:bg-amber-50`}>
                          <PencilIcon />
                        </button>
                        <button onClick={() => setDeleting(t)} title="Delete" className={`${iconBtn} text-rose-600 hover:bg-rose-50`}>
                          <TrashIcon />
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
            No teachers found
          </div>
        )}
      </div>

      {/* ---------- SLIDE-IN FORM ---------- */}
      <Portal>
        <div
          onClick={() => setDrawerOpen(false)}
          className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
        <div
          className={`fixed right-0 top-0 z-50 flex h-screen w-[440px] max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            drawerOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div>
              <h2 className="text-base font-bold text-slate-800">{editingId ? 'Edit Teacher' : 'New Teacher'}</h2>
              <p className="text-[11px] text-slate-500">Fields marked * are required</p>
            </div>
            <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              <XIcon />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {/* Photo */}
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-white text-[10px] text-slate-400">
                {form.photo ? <img src={form.photo} className="h-full w-full object-cover" /> : 'Photo'}
              </div>
              <div>
                <label className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                  Upload photo
                  <input type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
                </label>
                {form.photo && (
                  <button onClick={() => setForm({ ...form, photo: '' })} className="ml-2 text-xs text-rose-600 hover:underline">
                    Remove
                  </button>
                )}
                <p className="mt-1.5 text-[11px] text-slate-400">Used on the staff ID card later</p>
              </div>
            </div>

            {/* Personal */}
            <div>
              <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Personal information</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Teacher Name *">
                  <input className={inputCls} value={form.name} onChange={set('name')} placeholder="Full name" />
                </Field>
                <Field label="Father Name">
                  <input className={inputCls} value={form.father_name} onChange={set('father_name')} placeholder="Father's name" />
                </Field>
                <Field label="Gender">
                  <select className={inputCls} value={form.gender} onChange={set('gender')}>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </Field>
                <Field label="Blood Group">
                  <select className={inputCls} value={form.blood_group} onChange={set('blood_group')}>
                    <option value="">Select</option>
                    {BLOOD.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            {/* Professional */}
            <div>
              <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Professional</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Employee ID (auto)">
                  <input className={inputCls} value={form.employee_id} onChange={set('employee_id')} placeholder={nextEmployeeId()} />
                </Field>
                <Field label="Designation">
                  <select className={inputCls} value={form.designation} onChange={set('designation')}>
                    {DESIGNATIONS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Qualification">
                  <input list="qualification-list" className={inputCls} value={form.qualification} onChange={set('qualification')} placeholder="e.g. MA, B.Ed" />
                  <datalist id="qualification-list">
                    {QUALIFICATIONS.map((q) => (
                      <option key={q} value={q} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Experience (years)">
                  <input type="number" min="0" className={inputCls} value={form.experience} onChange={set('experience')} placeholder="0" />
                </Field>
                <div className="col-span-2">
                  <Field label="Subjects (separate with comma)">
                    <input className={inputCls} value={form.subjects} onChange={set('subjects')} placeholder="e.g. Math, Physics" />
                  </Field>
                </div>
              </div>
            </div>

            {/* Classes */}
            <div>
              <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Assigned classes ({formClasses.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {CLASSES.map((c) => {
                  const on = formClasses.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleClass(c)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95 ${
                        on
                          ? 'bg-emerald-600 text-white shadow shadow-emerald-600/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Class Teacher Of">
                  <select className={inputCls} value={form.class_teacher_of} onChange={set('class_teacher_of')}>
                    <option value="">None</option>
                    {CLASSES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Section">
                  <select className={inputCls} value={form.class_teacher_section} onChange={set('class_teacher_section')}>
                    <option value="">None</option>
                    {SECTIONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            {/* Job */}
            <div>
              <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Job details</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Joining Date">
                  <input type="date" className={inputCls} value={form.joining_date} onChange={set('joining_date')} />
                </Field>
                <Field label="Monthly Salary">
                  <input type="number" className={inputCls} value={form.monthly_salary} onChange={set('monthly_salary')} placeholder="0" />
                </Field>
                <Field label="Status">
                  <select className={inputCls} value={form.status} onChange={set('status')}>
                    <option>Active</option>
                    <option>Left</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Contact</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone *">
                  <input className={inputCls} value={form.phone} onChange={set('phone')} placeholder="03XX-XXXXXXX" />
                </Field>
                <Field label="Email">
                  <input type="email" className={inputCls} value={form.email} onChange={set('email')} placeholder="name@mail.com" />
                </Field>
                <div className="col-span-2">
                  <Field label="Address">
                    <input className={inputCls} value={form.address} onChange={set('address')} />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-t border-slate-100 bg-white px-5 py-3.5">
            <button
              onClick={save}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-95"
            >
              {editingId ? 'Update Teacher' : 'Save Teacher'}
            </button>
            <button onClick={() => setDrawerOpen(false)} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              Cancel
            </button>
          </div>
        </div>
      </Portal>

      {/* ---------- VIEW DETAILS ---------- */}
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
              className={`max-h-[90vh] w-[560px] max-w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 ${
                viewOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-90'
              }`}
            >
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar t={viewing} size="h-20 w-20" text="text-3xl" />
                  <div>
                    <div className="text-xl font-bold text-slate-800">{viewing.name}</div>
                    <div className="text-sm text-slate-500">{viewing.designation}</div>
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

              <div className="mb-2">
                <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned classes</h3>
                <div className="flex flex-wrap gap-2">
                  {classList(viewing).map((c) => (
                    <span key={c} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {c}
                    </span>
                  ))}
                  {classList(viewing).length === 0 && <span className="text-sm text-slate-400">No class assigned</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </Portal>

      {/* ---------- DELETE CONFIRM ---------- */}
      {deleting && (
        <Portal>
          <div className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="anim-pop w-[400px] rounded-2xl bg-white p-6 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <TrashIcon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Delete teacher?</h3>
              <p className="mt-1 text-sm text-slate-500">
                {deleting.name} will be removed permanently. This cannot be undone.
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

      {/* ---------- PRINT PREVIEW ---------- */}
      {preview && (
        <Portal>
          <div className="anim-fade-in fixed inset-0 z-50 flex flex-col bg-slate-900/60 p-5 backdrop-blur-sm">
            <div className="mx-auto mb-3 flex w-full max-w-[1150px] items-center justify-between rounded-xl bg-white px-5 py-3 shadow-xl">
              <div>
                <h2 className="font-bold text-slate-800">Print Preview</h2>
                <p className="text-xs text-slate-500">{preview.payload.rows.length} teachers</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => runExport({ ...preview.payload, format: 'print' })}
                  disabled={!!busy}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
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
                <button onClick={() => setPreview(null)} className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
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

      {/* ---------- TOAST ---------- */}
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