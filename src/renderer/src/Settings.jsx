import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const Portal = ({ children }) => createPortal(children, document.body)

/* ---------- SHA-256 ---------- */
async function sha256(text) {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/* ---------- Recovery code generator ---------- */
function generateRecoveryCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/* ---------- Password input with eye toggle ---------- */
function PasswordInput({
  value,
  onChange,
  placeholder,
  className = '',
  autoComplete = 'current-password',
  autoFocus = false
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={className}
        style={{ paddingRight: '2.75rem' }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
      >
        {visible ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.477 10.489a3.5 3.5 0 004.984 4.984M9.878 5.099A10.94 10.94 0 0112 5c5 0 9 4.5 10 7-.5 1.4-1.86 3.52-4.02 5.16M6.02 6.02C3.86 7.66 2.5 9.78 2 11.16c1 2.5 5 7 10 7 1.18 0 2.28-.24 3.27-.66" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  )
}

/* ---------- Icons ---------- */
const Svg = ({ d, className = 'h-4 w-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)
const IconSchool = (p) => <Svg {...p} d="M12 3L1 9l11 6 9-4.9V17h2V9L12 3zM5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8-7-3.8z" />
const IconLock = (p) => <Svg {...p} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
const IconMoon = (p) => <Svg {...p} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
const IconSun = (p) => (
  <Svg {...p} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
)
const IconCheck = (p) => <Svg {...p} d="M4.5 12.75l6 6 9-13.5" />
const IconX = (p) => <Svg {...p} d="M6 18L18 6M6 6l12 12" />
const IconPlus = (p) => <Svg {...p} d="M12 4.5v15m7.5-7.5h-15" />
const IconTrash = (p) => <Svg {...p} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
const IconSparkles = (p) => <Svg {...p} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
const IconShield = (p) => <Svg {...p} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
const IconImage = (p) => <Svg {...p} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
const IconSave = (p) => <Svg {...p} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
const IconUser = (p) => <Svg {...p} d="M12 12c2.7 0 8 1.3 8 4v2H4v-2c0-2.7 5.3-4 8-4zm0-2a4 4 0 100-8 4 4 0 000 8z" />
const IconKey = (p) => <Svg {...p} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
const IconDatabase = (p) => <Svg {...p} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
const IconDownload = (p) => <Svg {...p} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
const IconUpload = (p) => <Svg {...p} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />

/* ---------- Primitives ---------- */
function Field({ label, hint, children, required }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </span>
        {hint && <span className="text-[10px] text-slate-400">— {hint}</span>}
      </div>
      {children}
    </label>
  )
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'

/* ============================================================
   Main Settings component
   ============================================================ */
export default function Settings({ reloadPrintBrand }) {
  const [tab, setTab] = useState('school')
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = (msg, tone = 'success') => {
    setToast({ msg, tone })
    setTimeout(() => setToast(null), 2400)
  }

  const reload = async () => {
    try {
      const all = await window.api.getSettings()
      setSettings(all)
    } catch (err) {
      showToast('Load failed: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const saveField = async (patch, msg = 'Saved') => {
    try {
      await window.api.saveSettings(patch)
      setSettings((s) => ({ ...s, ...patch }))
      if (typeof reloadPrintBrand === 'function') reloadPrintBrand()
      window.dispatchEvent(new Event('settings-saved'))
      showToast(msg)
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error')
    }
  }

  const tabs = [
    { id: 'school', label: 'School Info', icon: IconSchool, grad: 'from-blue-500 to-indigo-600' },
    { id: 'security', label: 'Security', icon: IconLock, grad: 'from-rose-500 to-pink-600' },
    { id: 'appearance', label: 'Appearance', icon: IconSparkles, grad: 'from-violet-500 to-fuchsia-600' }
  ]

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-2xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/60">
              <IconSparkles className="h-3.5 w-3.5" />
              System configuration
            </div>
            <h1 className="mt-1 text-3xl font-extrabold">Settings</h1>
            <p className="mt-1 text-sm text-white/70">
              Customize your school identity, protect the app, and choose your style.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {settings.logo && (
              <img
                src={settings.logo}
                alt="logo"
                className="h-14 w-14 rounded-2xl bg-white/10 object-cover ring-2 ring-white/20"
              />
            )}
            <div className="text-right">
              <div className="text-sm font-bold">{settings.schoolName || 'School System'}</div>
              <div className="text-[11px] text-white/60">
                {settings.schoolAddress || 'No address set'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-1.5 shadow-sm backdrop-blur">
        <div className="grid grid-cols-3 gap-1.5">
          {tabs.map((t) => {
            const active = tab === t.id
            const IconC = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`group flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
                  active
                    ? `bg-gradient-to-br ${t.grad} text-white shadow-lg`
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <IconC className={`h-4 w-4 ${active ? '' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200/70 bg-white p-12 text-center text-slate-400">
          Loading settings…
        </div>
      ) : (
        <>
          {tab === 'school' && (
            <SchoolTab settings={settings} onSave={saveField} showToast={showToast} />
          )}
          {tab === 'security' && (
            <SecurityTab settings={settings} showToast={showToast} reload={reload} />
          )}
          {tab === 'appearance' && (
            <AppearanceTab settings={settings} onSave={saveField} />
          )}
        </>
      )}

      {toast && (
        <Portal>
          <div
            className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-2xl ${
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

/* ============================================================
   Tab 1 — School Info (with Your Profile & License)
   ============================================================ */
function SchoolTab({ settings, onSave, showToast }) {
  const [form, setForm] = useState({
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
    schoolWebsite: '',
    principalName: '',
    emergencyNumber: '',
    establishedYear: '',
    motto: '',
    logo: '',
    userName: '',
    userRole: '',
    userPhoto: '',
    company_id: 'school1'
  })
  
  const [backupBusy, setBackupBusy] = useState(false)

  useEffect(() => {
    setForm({
      schoolName: settings.schoolName || '',
      schoolAddress: settings.schoolAddress || '',
      schoolPhone: settings.schoolPhone || '',
      schoolEmail: settings.schoolEmail || '',
      schoolWebsite: settings.schoolWebsite || '',
      principalName: settings.principalName || '',
      emergencyNumber: settings.emergencyNumber || '',
      establishedYear: settings.establishedYear || '',
      motto: settings.motto || '',
      logo: settings.logo || '',
      userName: settings.userName || '',
      userRole: settings.userRole || '',
      userPhoto: settings.userPhoto || '',
      company_id: settings.company_id || 'school1'
    })
  }, [settings])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const pickLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 256
        const scale = Math.min(max / img.width, max / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/png')
        setForm((f) => ({ ...f, logo: dataUrl }))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const pickUserPhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 128
        const scale = Math.min(max / img.width, max / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/png')
        setForm((f) => ({ ...f, userPhoto: dataUrl }))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const saveAll = async () => {
    if (!form.schoolName.trim()) return showToast('School name is required', 'error')
    await onSave(form, 'School info saved')
  }

  const handleBackup = async () => {
    setBackupBusy(true)
    try {
      const res = await window.api.createBackup()
      if (res.ok) {
        showToast(`Backup saved successfully!`)
      } else if (res.reason !== 'Cancelled') {
        showToast('Backup failed: ' + res.reason, 'error')
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    } finally {
      setBackupBusy(false)
    }
  }

  const handleRestore = async () => {
    if (!confirm("WARNING: This will overwrite all current data with the backup file. The app will refresh to load the new data. Are you sure?")) return
    
    setBackupBusy(true)
    try {
      const res = await window.api.restoreBackup()
      if (!res.ok && res.reason !== 'Cancelled') {
        showToast('Restore failed: ' + res.reason, 'error')
        setBackupBusy(false)
      } else {
        showToast('Data restored successfully!')
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
      setBackupBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
              <IconSchool className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">School Information</h2>
              <p className="text-xs text-slate-500">This appears on every printed page and receipt.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="School Name" required>
                <input className={inputCls} value={form.schoolName} onChange={set('schoolName')} placeholder="e.g. Green Valley High School" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Address">
                <input className={inputCls} value={form.schoolAddress} onChange={set('schoolAddress')} placeholder="Street, City, Country" />
              </Field>
            </div>
            <Field label="Phone">
              <input className={inputCls} value={form.schoolPhone} onChange={set('schoolPhone')} placeholder="+92 300 1234567" />
            </Field>
            <Field label="Emergency Number">
              <input className={inputCls} value={form.emergencyNumber} onChange={set('emergencyNumber')} placeholder="+92 300 7654321" />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={form.schoolEmail} onChange={set('schoolEmail')} placeholder="school@example.com" />
            </Field>
            <Field label="Website">
              <input className={inputCls} value={form.schoolWebsite} onChange={set('schoolWebsite')} placeholder="https://school.com" />
            </Field>
            <Field label="Principal Name">
              <input className={inputCls} value={form.principalName} onChange={set('principalName')} placeholder="Mr. John Doe" />
            </Field>
            <Field label="Established Year">
              <input className={inputCls} value={form.establishedYear} onChange={set('establishedYear')} placeholder="1999" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Motto / Tagline" hint="Optional">
                <input className={inputCls} value={form.motto} onChange={set('motto')} placeholder="Knowledge · Character · Service" />
              </Field>
            </div>
          </div>

          {/* ============ YOUR PROFILE ============ */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <IconUser className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Your profile</div>
                <div className="text-[11px] text-slate-500">Shown in the sidebar footer</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Your name">
                <input className={inputCls} value={form.userName} onChange={set('userName')} placeholder="e.g. Ali Khan" />
              </Field>
              <Field label="Role">
                <select className={inputCls} value={form.userRole} onChange={set('userRole')}>
                  <option value="">Select role</option>
                  <option>Administrator</option>
                  <option>Principal</option>
                  <option>Vice Principal</option>
                  <option>Accountant</option>
                  <option>Clerk</option>
                  <option>Teacher</option>
                </select>
              </Field>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-white">
                {form.userPhoto ? (
                  <img src={form.userPhoto} alt="profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] text-slate-400">Photo</span>
                )}
              </div>
              <div>
                <label className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                  Upload photo
                  <input type="file" accept="image/*" onChange={pickUserPhoto} className="hidden" />
                </label>
                {form.userPhoto && (
                  <button
                    onClick={() => setForm({ ...form, userPhoto: '' })}
                    className="ml-2 text-xs text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ============ LICENSE CONTROL ============ */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
                <IconKey className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-rose-700">License Control</div>
                <div className="text-[11px] text-slate-500">Do not change unless instructed by the developer.</div>
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <Field label="School License ID" required>
                <input
                  className={`${inputCls} !border-rose-300 focus:!border-rose-500 focus:!ring-rose-100`}
                  value={form.company_id}
                  onChange={set('company_id')}
                  placeholder="e.g. school1, school2"
                />
              </Field>
              <p className="mt-2 text-xs text-rose-600">
                This ID is used to verify your subscription with the developer. If your subscription expires, the app will lock itself on the next restart.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={saveAll}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5"
            >
              <IconSave className="h-4 w-4" /> Save changes
            </button>
          </div>
        </div>

        {/* ============ BACKUP & RESTORE ============ */}
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
              <IconDatabase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Backup & Restore</h2>
              <p className="text-xs text-slate-500">Protect your data by keeping a safe copy.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 p-4 flex flex-col items-start gap-2">
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                <IconDownload className="h-4 w-4 text-teal-600" /> Create Backup
              </div>
              <p className="text-xs text-slate-500 flex-1">Save a copy of your entire database to a USB, Google Drive, or another safe place.</p>
              <button
                onClick={handleBackup}
                disabled={backupBusy}
                className="mt-2 w-full rounded-lg bg-teal-50 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 disabled:opacity-50"
              >
                {backupBusy ? 'Please wait...' : 'Backup Database'}
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 flex flex-col items-start gap-2">
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                <IconUpload className="h-4 w-4 text-rose-600" /> Restore Data
              </div>
              <p className="text-xs text-slate-500 flex-1">Restore all your data from a previous backup file. The app will refresh.</p>
              <button
                onClick={handleRestore}
                disabled={backupBusy}
                className="mt-2 w-full rounded-lg bg-rose-50 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
              >
                {backupBusy ? 'Please wait...' : 'Restore Database'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md">
            <IconImage className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Logo</h2>
            <p className="text-xs text-slate-500">PNG/JPG, square recommended.</p>
          </div>
        </div>

        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          {form.logo ? (
            <img src={form.logo} alt="logo" className="h-full w-full object-contain p-4" />
          ) : (
            <div className="text-center text-slate-400">
              <IconImage className="mx-auto mb-2 h-10 w-10" />
              <div className="text-sm font-semibold">No logo yet</div>
              <div className="text-xs">Upload below</div>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-500/30 transition hover:-translate-y-0.5">
            <IconPlus className="h-4 w-4" />
            Upload logo
            <input type="file" accept="image/*" onChange={pickLogo} className="hidden" />
          </label>
          {form.logo && (
            <button
              onClick={() => setForm({ ...form, logo: '' })}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
            >
              <IconTrash className="h-4 w-4" /> Remove logo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Tab 2 — Security
   ============================================================ */
function SecurityTab({ settings, showToast, reload }) {
  const hasPassword = !!settings.passwordHash
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [busy, setBusy] = useState(false)
  const [removeBusy, setRemoveBusy] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')

  const savePassword = async () => {
    if (next.length < 4) return showToast('Password must be at least 4 characters', 'error')
    if (next !== confirmPwd) return showToast('Passwords do not match', 'error')

    if (hasPassword) {
      const curHash = await sha256(current)
      if (curHash !== settings.passwordHash) return showToast('Current password is incorrect', 'error')
    }

    setBusy(true)
    try {
      const hash = await sha256(next)
      await window.api.setAppPassword({ hash })

      const code = generateRecoveryCode()
      const codeHash = await sha256(code)
      await window.api.setRecoveryHash({ hash: codeHash })

      showToast('Password saved')
      setCurrent('')
      setNext('')
      setConfirmPwd('')
      setRecoveryCode(code)

      await reload()
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const removePassword = async () => {
    if (!window.confirm('Remove the app password? The app will open without asking for a password.')) return
    if (hasPassword) {
      const curHash = await sha256(current)
      if (curHash !== settings.passwordHash) return showToast('Enter the current password to remove it', 'error')
    }
    setRemoveBusy(true)
    try {
      await window.api.removeAppPassword()
      await window.api.clearRecoveryHash()
      showToast('Password removed')
      setCurrent('')
      await reload()
    } catch (err) {
      showToast('Remove failed: ' + err.message, 'error')
    } finally {
      setRemoveBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
            <IconLock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">
              {hasPassword ? 'Change password' : 'Set password'}
            </h2>
            <p className="text-xs text-slate-500">
              {hasPassword
                ? 'The app locks on launch until the correct password is entered.'
                : 'Add a password to protect the app on startup.'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {hasPassword && (
            <Field label="Current password" required>
              <PasswordInput
                className={inputCls}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </Field>
          )}
          <Field label={hasPassword ? 'New password' : 'Password'} required>
            <PasswordInput
              className={inputCls}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Min 4 characters"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm password" required>
            <PasswordInput
              className={inputCls}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={savePassword}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            <IconSave className="h-4 w-4" /> {busy ? 'Saving…' : hasPassword ? 'Update password' : 'Set password'}
          </button>
          {hasPassword && (
            <button
              onClick={removePassword}
              disabled={removeBusy}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
            >
              <IconTrash className="h-4 w-4" /> {removeBusy ? 'Removing…' : 'Remove password'}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
            <IconShield className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800">How it works</h2>
        </div>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex gap-2">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            When a password is set, the app asks for it every time it opens.
          </li>
          <li className="flex gap-2">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            Passwords are stored as a <b>SHA-256 hash</b> — never in plain text.
          </li>
          <li className="flex gap-2">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            A <b>recovery code</b> is generated when you set the password. Save it somewhere safe.
          </li>
          <li className="flex gap-2">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            If you forget the password, use the recovery code on the lock screen.
          </li>
        </ul>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          <b>Tip:</b> Copy the recovery code to a notepad or password manager. If you lose both the password and the code, the only way back in is to delete the app's database (which erases all data).
        </div>
      </div>

      {recoveryCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-[440px] max-w-full rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-600">
              🔑
            </div>
            <h3 className="text-lg font-bold text-slate-800">Save this recovery code</h3>
            <p className="mt-1 text-sm text-slate-500">
              If you forget your password, you'll need this code to unlock the app.
              It won't be shown again.
            </p>
            <div className="mt-4 select-all rounded-xl bg-slate-100 px-4 py-3 font-mono text-lg font-bold tracking-widest text-slate-800">
              {recoveryCode}
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(recoveryCode)
              }}
              className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
            >
              Copy to clipboard
            </button>
            <button
              onClick={() => setRecoveryCode('')}
              className="mt-5 w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30"
            >
              I've saved it — Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Tab 3 — Appearance
   ============================================================ */
function AppearanceTab({ settings, onSave }) {
  const theme = settings.theme || 'light'

  const apply = (val) => {
    onSave({ theme: val }, 'Theme updated')
    applyTheme(val)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md">
            <IconSparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Choose your theme</h2>
            <p className="text-xs text-slate-500">Adjusts the whole app instantly.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { key: 'light', label: 'Light', icon: IconSun, gradient: 'from-amber-200 to-orange-300' },
            { key: 'dark', label: 'Dark', icon: IconMoon, gradient: 'from-slate-700 to-slate-900' },
            { key: 'system', label: 'System', icon: IconSparkles, gradient: 'from-blue-400 to-violet-500' }
          ].map((t) => {
            const active = theme === t.key
            const IconC = t.icon
            return (
              <button
                key={t.key}
                onClick={() => apply(t.key)}
                className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition ${
                  active
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`mb-3 h-20 rounded-xl bg-gradient-to-br ${t.gradient} shadow-inner`} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconC className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-bold text-slate-800">{t.label}</span>
                  </div>
                  {active && (
                    <span className="rounded-full bg-emerald-100 p-1 text-emerald-600">
                      <IconCheck className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------- Theme applier ---------- */
export function applyTheme(theme) {
  const root = document.documentElement
  const prefersDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', !!prefersDark)
}