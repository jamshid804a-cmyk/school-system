import { useEffect, useMemo, useRef, useState } from 'react'

/* ============================================================ CONSTANTS */
const CLASSES = [
  'Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
]
const SECTIONS = ['A', 'B', 'C', 'D']

const QTYPES = [
  { id: 'mcq', label: 'MCQ', icon: '🔘', marks: 1 },
  { id: 'tf', label: 'True / False', icon: '✅', marks: 1 },
  { id: 'fill', label: 'Fill blanks', icon: '▁▁', marks: 1 },
  { id: 'short', label: 'Short answer', icon: '✍️', marks: 2 },
  { id: 'long', label: 'Long answer', icon: '📝', marks: 5 },
  { id: 'match', label: 'Match columns', icon: '🔗', marks: 5 },
  { id: 'essay', label: 'Essay', icon: '📃', marks: 10 },
  { id: 'application', label: 'Application', icon: '✉️', marks: 5 },
  { id: 'story', label: 'Story', icon: '📖', marks: 5 },
  { id: 'text', label: 'Typed question', icon: '⌨️', marks: 1 },
  { id: 'image', label: 'Handwritten image', icon: '📷', marks: 1 },
  { id: 'heading', label: 'Section heading', icon: '🔖', marks: 0 }
]
const TYPE_LABEL = Object.fromEntries(QTYPES.map((t) => [t.id, t.label]))
const PAGE_PX = { A4: [794, 1123], A5: [559, 794], Legal: [816, 1344] }

const currentSession = () => {
  const d = new Date()
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
  return `${y}-${y + 1}`
}

const ALL_SESSIONS = (() => {
  const list = []
  for (let a = 2015; a <= 2099; a++) list.push(`${a}-${a + 1}`)
  return list
})()

// Full Urdu Alphabets
const URDU_ALPHABETS = ['ا', 'ب', 'پ', 'ت', 'ٹ', 'ث', 'ج', 'چ', 'ح', 'خ', 'د', 'ڈ', 'ذ', 'ر', 'ڑ', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن', 'و', 'ہ', 'ھ', 'ء', 'ی', 'ے']

const blankOptions = () => ['A', 'B', 'C', 'D'].map((l, i) => ({ label: l, text: '', correct: i === 0 }))
const blankSubparts = () => [{ text: '', options: blankOptions(), tfAnswer: 'True', matchLeft: '', matchRight: '' }]

const HEADER_KEY = 'school.paperHeader.v1'
const loadHeader = () => { try { return JSON.parse(localStorage.getItem(HEADER_KEY) || '{}') || {} } catch { return {} } }
const saveHeader = (h) => { try { localStorage.setItem(HEADER_KEY, JSON.stringify(h)) } catch {} }

const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100'
const label = 'mb-1 block text-xs font-semibold text-slate-600'
const btnPrimary = 'rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-40'
const btnGhost = 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'

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

const normalizeOptions = (o) => {
  try {
    if (Array.isArray(o) && o.length) return o
    if (typeof o === 'string') {
      const p = JSON.parse(o)
      if (Array.isArray(p) && p.length) return p
    }
  } catch {}
  return blankOptions()
}

const normalizeSubparts = (s) => {
  try {
    if (Array.isArray(s) && s.length) return s
    if (typeof s === 'string') {
      const p = JSON.parse(s)
      if (Array.isArray(p) && p.length) return p
    }
  } catch {}
  return blankSubparts()
}

const safeImgSrc = (s) => {
  const v = String(s || '')
  return /^data:image\//i.test(v) || /^https?:\/\//i.test(v) ? v : ''
}

const getLabel = (style, index) => {
  if (style === 'none') return ''
  if (style === 'roman') return ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'][index] || index + 1
  if (style === 'cap') return String.fromCharCode(65 + index)
  if (style === 'small') return String.fromCharCode(97 + index)
  if (style === 'urdu') return URDU_ALPHABETS[index] || ''
  if (style === 'circle') return '●'
  return index + 1
}

/* ============================================================ ROOT */
export default function Papers() {
  const [editing, setEditing] = useState(null)
  if (editing !== null) return <Editor paperId={editing === 'new' ? null : editing} onExit={() => setEditing(null)} />
  return <PaperList onNew={() => setEditing('new')} onOpen={(id) => setEditing(id)} />
}

/* ============================================================ LIST */
function PaperList({ onNew, onOpen }) {
  const session = currentSession()
  const [papers, setPapers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try { setPapers((await window.api.listPapers({ session })) || []) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [session])

  const filtered = papers.filter((p) =>
    !search.trim() || [p.title, p.subject, p.exam_name, p.class_name].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  )

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}"?`)) return
    await window.api.deletePaper({ id: p.id })
    load()
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Papers</h1>
          <p className="text-sm text-slate-500">Session {session} · {papers.length} saved</p>
        </div>
        <div className="flex gap-2">
          <input className={`${field} w-64`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, subject, class" />
          <button onClick={onNew} className={btnPrimary}>+ New paper</button>
        </div>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-14 text-center">
          <div className="text-4xl">📄</div>
          <div className="mt-2 font-semibold text-slate-800">{search ? 'No papers match your search' : 'No papers yet'}</div>
          {!search && <button onClick={onNew} className={`${btnPrimary} mt-4`}>Create your first paper</button>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <div key={p.id} onClick={() => onOpen(p.id)}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-600 hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-900">{p.title}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {p.class_name}{p.section ? ` - ${p.section}` : ''} · {p.subject}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); remove(p) }}
                className="rounded-md p-1.5 text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100" title="Delete">🗑️</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
              <span className="rounded bg-teal-50 px-2 py-0.5 text-teal-800">{p.question_count || 0} questions</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{p.total_marks || 0} marks</span>
              {p.exam_name && <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{p.exam_name}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================ EDITOR */
function Editor({ paperId: initialId, onExit }) {
  const session = currentSession()
  const [paperId, setPaperId] = useState(initialId)
  const [form, setForm] = useState({
    title: '', class_name: CLASSES[2], section: '', subject: '', exam_name: 'Mid Term',
    exam_date: '', duration: '2 hours', session: currentSession(), isUrdu: false,
    instructions: 'Attempt all questions. Neat handwriting is appreciated.',
    layout: 'portrait', style: 'normal'
  })
  const [questions, setQuestions] = useState([])
  const [tab, setTab] = useState(initialId ? 'questions' : 'details')
  const [adding, setAdding] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [school, setSchool] = useState({ name: '', address: '', logo: '' })
  const [header, setHeader] = useState(loadHeader)
  const [opts, setOpts] = useState({ pageSize: 'A4', landscape: false, rtl: false, answers: false })
  const [toast, setToast] = useState(null)
  const [saveState, setSaveState] = useState('saved')
  const loaded = useRef(!initialId)
  const toastTimer = useRef(null)

  const notify = (msg, tone = 'ok') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, tone })
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  useEffect(() => { fetchSchool().then(setSchool) }, [])
  const effectiveSchool = {
    name: header.name || school.name || '',
    address: header.address ?? school.address ?? '',
    logo: header.logo || school.logo || ''
  }
  const updateHeader = (patch) => { const h = { ...header, ...patch }; setHeader(h); saveHeader(h) }

  useEffect(() => {
    if (!initialId) return
    ;(async () => {
      try {
        const b = await window.api.getPaper({ id: initialId })
        if (b?.paper) {
          const p = b.paper
          setForm((f) => ({ ...f, ...Object.fromEntries(Object.keys(f).map((k) => [k, p[k] ?? f[k]])) }))
          setQuestions((b.questions || []).map((q) => ({
            ...q,
            options: normalizeOptions(q.options),
            subparts: normalizeSubparts(q.subparts)
          })))
          setOpts((o) => ({ ...o, landscape: p.layout === 'landscape' }))
        }
      } catch (e) { notify('Could not load paper: ' + e.message, 'error') }
      loaded.current = true
    })()
  }, [initialId])

  useEffect(() => {
    if (!paperId || !loaded.current) return
    setSaveState('saving')
    const t = setTimeout(async () => {
      try { await window.api.updatePaper({ id: paperId, ...form, session }); setSaveState('saved') }
      catch { setSaveState('error') }
    }, 700)
    return () => clearTimeout(t)
  }, [form, paperId, session])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const detailsOk = form.title.trim() && form.subject.trim()

  const ensurePaper = async () => {
    if (paperId) return paperId
    if (!detailsOk) { setTab('details'); notify('Add a title and subject first', 'error'); return null }
    const id = await window.api.addPaper({ ...form, session })
    setPaperId(id)
    loaded.current = true
    return id
  }

  const totalMarks = useMemo(
    () => questions.filter((q) => !['pagebreak', 'heading'].includes(q.type)).reduce((a, q) => a + (Number(q.marks) || 0), 0),
    [questions]
  )
  const qCount = questions.filter((q) => !['pagebreak', 'heading'].includes(q.type)).length

  const saveQuestion = async (q) => {
    try {
      const pid = await ensurePaper()
      if (!pid) return
      const clean = { ...q, marks: Number(q.marks) || 0 }
      if (q.id) {
        await window.api.updatePaperQuestion(clean)
        setQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, ...clean } : x)))
      } else {
        const id = await window.api.addPaperQuestion({ ...clean, paper_id: pid, section_id: null, order_index: questions.length })
        setQuestions((prev) => [...prev, { ...clean, id, paper_id: pid }])
      }
      setAdding(null)
      setEditingId(null)
      notify('Saved')
    } catch (e) { notify('Save failed: ' + e.message, 'error') }
  }

  const removeQuestion = async (id) => {
    if (!window.confirm('Delete this item?')) return
    try {
      await window.api.deletePaperQuestion({ id })
      setQuestions((p) => p.filter((q) => q.id !== id))
    } catch (e) { notify('Delete failed: ' + e.message, 'error') }
  }

  const addSpecial = async (type) => {
    try {
      const pid = await ensurePaper()
      if (!pid) return
      if (type === 'heading') { setAdding('heading'); return }
      const q = { paper_id: pid, section_id: null, text: 'PAGE_BREAK', type: 'pagebreak', marks: 0, order_index: questions.length }
      const id = await window.api.addPaperQuestion(q)
      setQuestions((p) => [...p, { ...q, id }])
    } catch (e) { notify('Failed: ' + e.message, 'error') }
  }

  const duplicate = async (q) => {
    try {
      const { id, ...rest } = q
      const nid = await window.api.addPaperQuestion({ ...rest, paper_id: paperId, order_index: questions.length })
      setQuestions((p) => [...p, { ...rest, id: nid }])
      notify('Duplicated')
    } catch (e) { notify('Failed: ' + e.message, 'error') }
  }

  const move = async (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= questions.length) return
    const arr = [...questions]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    const next = arr.map((q, k) => ({ ...q, order_index: k }))
    setQuestions(next)
    try {
      await Promise.all(next.map((q) => window.api.updatePaperQuestion(q)))
    } catch (e) { notify('Reorder failed: ' + e.message, 'error') }
  }

  const paperForPrint = { ...form, layout: opts.landscape ? 'landscape' : 'portrait' }
  const html = useMemo(
    () => buildPaperHtml({ paper: paperForPrint, questions, school: effectiveSchool, ...opts }),
    [form, questions, opts, header, school]
  )

  const [previewHtml, setPreviewHtml] = useState(html)
  useEffect(() => {
    const t = setTimeout(() => setPreviewHtml(html), 300)
    return () => clearTimeout(t)
  }, [html])

  const printNow = () => {
    if (!questions.length) return notify('Add at least one question', 'error')
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

  return (
    <div className="mx-auto max-w-[1400px] p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <button onClick={onExit} className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100">← Papers</button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold text-slate-900">{form.title || 'Untitled paper'}</div>
          <div className="text-xs text-slate-500">
            {qCount} questions · {totalMarks} marks · {form.isUrdu ? 'Urdu' : 'English'} ·{' '}
            <span className={saveState === 'error' ? 'text-rose-600' : ''}>
              {!paperId ? 'Not saved yet' : saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : 'All changes saved'}
            </span>
          </div>
        </div>
        <button onClick={printNow} className={btnPrimary}>🖨️ Print</button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(380px,5fr)_7fr]">
        <div className="space-y-3">
          <div className="flex rounded-lg bg-slate-200/70 p-1">
            {[['details', '1  Details'], ['questions', '2  Questions'], ['print', '3  Print options']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${tab === k ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'details' && (
            <DetailsPanel form={form} set={set} setForm={setForm} header={header} school={school}
              updateHeader={updateHeader} onNext={() => setTab('questions')} detailsOk={detailsOk} />
          )}

          {tab === 'questions' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 text-xs font-semibold text-slate-600">Add to paper</div>
                <div className="flex flex-wrap gap-1.5">
                  {QTYPES.map((t) => (
                    <button key={t.id}
                      onClick={() => (t.id === 'heading' ? addSpecial('heading') : (setEditingId(null), setAdding(t.id)))}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${adding === t.id ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-teal-600 hover:text-teal-800'}`}>
                      <span className="mr-1">{t.icon}</span>{t.label}
                    </button>
                  ))}
                  <button onClick={() => addSpecial('pagebreak')}
                    className="rounded-full border border-dashed border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100">
                    ⤓ Page break
                  </button>
                </div>
              </div>

              {adding && (
                <QuestionEditor
                  key={'new-' + adding}
                  initial={{ type: adding, marks: QTYPES.find((t) => t.id === adding)?.marks ?? 1 }}
                  landscape={opts.landscape}
                  onCancel={() => setAdding(null)}
                  onSave={saveQuestion}
                />
              )}

              {questions.length === 0 && !adding && (
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
                  <div className="text-3xl">❓</div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">No questions yet</div>
                  <div className="text-xs text-slate-500">Pick a question type above to begin</div>
                </div>
              )}

              {questions.map((q, i) => {
                if (editingId === q.id) {
                  return <QuestionEditor key={q.id} initial={q} landscape={opts.landscape} onCancel={() => setEditingId(null)} onSave={saveQuestion} />
                }
                const num = questions.slice(0, i + 1).filter((x) => !['pagebreak', 'heading'].includes(x.type)).length
                return (
                  <QuestionRow key={q.id} q={q} num={num} first={i === 0} last={i === questions.length - 1}
                    onEdit={() => { setAdding(null); setEditingId(q.id) }}
                    onDelete={() => removeQuestion(q.id)}
                    onDup={() => duplicate(q)}
                    onUp={() => move(i, -1)} onDown={() => move(i, 1)} />
                )
              })}
            </div>
          )}

          {tab === 'print' && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <Seg title="Page size" value={opts.pageSize} onChange={(v) => setOpts((o) => ({ ...o, pageSize: v }))}
                items={['A4', 'A5', 'Legal'].map((s) => [s, s])} />
              <Seg title="Orientation" value={opts.landscape} onChange={(v) => { setOpts((o) => ({ ...o, landscape: v })); setForm((f) => ({ ...f, layout: v ? 'landscape' : 'portrait' })) }}
                items={[[false, 'Portrait'], [true, 'Landscape']]} />
              <Seg title="Answer key" value={opts.answers} onChange={(v) => setOpts((o) => ({ ...o, answers: v }))}
                items={[[false, 'Student copy'], [true, 'Teacher copy with answers']]} />
              <button onClick={printNow} className={`${btnPrimary} w-full py-3`}>🖨️ Print paper</button>
            </div>
          )}
        </div>

        <Preview html={previewHtml} pageSize={opts.pageSize} landscape={opts.landscape} />
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-xl ${toast.tone === 'error' ? 'bg-rose-600' : 'bg-slate-900'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

/* ============================================================ SMALL PIECES */
function Seg({ title, value, onChange, items }) {
  return (
    <div>
      <div className={label}>{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map(([k, l]) => (
          <button key={String(k)} onClick={() => onChange(k)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${value === k ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

function DetailsPanel({ form, set, setForm, header, school, updateHeader, onNext, detailsOk }) {
  const pickLogo = async (e) => {
    const f = e.target.files[0]
    if (f) updateHeader({ logo: await resizeImage(f, 300) })
  }
  const logo = header.logo || school.logo
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex gap-3">
        <label className="flex-1 block">
          <span className={label}>Language</span>
          <div className="flex rounded-lg border border-slate-300 bg-white p-1">
            <button onClick={() => setForm(f => ({...f, isUrdu: false}))} className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition ${!form.isUrdu ? 'bg-teal-700 text-white shadow' : 'text-slate-600'}`}>English</button>
            <button onClick={() => setForm(f => ({...f, isUrdu: true}))} className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition ${form.isUrdu ? 'bg-teal-700 text-white shadow' : 'text-slate-600'}`}>Urdu</button>
          </div>
        </label>
      </div>

      <label className="block">
        <span className={label}>Paper title *</span>
        <input className={field} value={form.title} onChange={set('title')} placeholder="e.g. Mid Term Mathematics" />
      </label>
      
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={label}>Class</span>
          <select className={field} value={form.class_name} onChange={set('class_name')}>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label className="block">
          <span className={label}>Section</span>
          <select className={field} value={form.section} onChange={set('section')}>
            <option value="">None</option>{SECTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="col-span-2 block">
          <span className={label}>Subject *</span>
          <input className={field} value={form.subject} onChange={set('subject')} placeholder="e.g. Mathematics" />
        </label>
        <label className="block">
          <span className={label}>Exam name</span>
          <input className={field} value={form.exam_name} onChange={set('exam_name')} placeholder="e.g. Mid Term" />
        </label>
        <label className="block">
          <span className={label}>Session</span>
          <select className={field} value={form.session} onChange={set('session')}>{ALL_SESSIONS.map((s) => <option key={s}>{s}</option>)}</select>
        </label>
        <label className="block">
          <span className={label}>Exam date</span>
          <input type="date" className={field} value={form.exam_date} onChange={set('exam_date')} />
        </label>
        <label className="block">
          <span className={label}>Duration</span>
          <input className={field} value={form.duration} onChange={set('duration')} placeholder="e.g. 2 hours" />
        </label>
      </div>

      <label className="block">
        <span className={label}>Instructions</span>
        <textarea rows={2} className={field} value={form.instructions} onChange={set('instructions')} placeholder="Instructions to students" />
      </label>

      <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">School header on printout</summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs text-slate-500">Taken from your school profile. Fill these only if the printout shows the wrong name or logo.</p>
          <label className="block">
            <span className={label}>School name</span>
            <input className={field} value={header.name ?? ''} onChange={(e) => updateHeader({ name: e.target.value })} placeholder={school.name || 'School name'} />
          </label>
          <label className="block">
            <span className={label}>Address</span>
            <input className={field} value={header.address ?? ''} onChange={(e) => updateHeader({ address: e.target.value })} placeholder={school.address || 'Address'} />
          </label>
          <div className="flex items-center gap-3">
            {logo ? <img src={logo} alt="" className="h-12 w-12 rounded border border-slate-200 bg-white object-contain" /> : <div className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">Logo</div>}
            <label className={`${btnGhost} cursor-pointer py-1.5 text-xs`}>
              Upload logo<input type="file" accept="image/*" className="hidden" onChange={pickLogo} />
            </label>
            {header.logo && <button onClick={() => updateHeader({ logo: '' })} className="text-xs font-semibold text-rose-600 underline">Use school logo</button>}
          </div>
        </div>
      </details>

      <button disabled={!detailsOk} onClick={onNext} className={`${btnPrimary} w-full py-2.5`}>Continue to questions</button>
    </div>
  )
}

function QuestionRow({ q, num, first, last, onEdit, onDelete, onDup, onUp, onDown }) {
  const iconBtn = 'rounded p-1.5 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30'
  const actions = (
    <div className="flex shrink-0 items-center">
      <button className={iconBtn} disabled={first} onClick={onUp} title="Move up" aria-label="Move up">▲</button>
      <button className={iconBtn} disabled={last} onClick={onDown} title="Move down" aria-label="Move down">▼</button>
      {q.type !== 'pagebreak' && <button className={iconBtn} onClick={onEdit} title="Edit" aria-label="Edit">✏️</button>}
      {!['pagebreak', 'heading'].includes(q.type) && <button className={iconBtn} onClick={onDup} title="Duplicate" aria-label="Duplicate">⧉</button>}
      <button className={`${iconBtn} hover:!bg-rose-50 hover:!text-rose-600`} onClick={onDelete} title="Delete" aria-label="Delete">🗑️</button>
    </div>
  )
  if (q.type === 'pagebreak') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-3 py-1.5">
        <span className="text-xs font-semibold text-amber-800">Page break</span>
        <div className="ml-auto">{actions}</div>
      </div>
    )
  }
  if (q.type === 'heading') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-white">
        <span className="min-w-0 flex-1 truncate text-sm font-bold">{q.text}</span>
        <div className="[&_button]:!text-slate-300 [&_button:hover]:!bg-slate-700">{actions}</div>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-700 text-xs font-bold text-white">{num}</div>
        <div className="min-w-0 flex-1">
          {q.type === 'image' && q.image ? (
            <img src={q.image} alt="" className="max-h-24 rounded border border-slate-200" />
          ) : (
            <div className="line-clamp-2 text-sm font-medium text-slate-800">{q.text}</div>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-semibold">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{TYPE_LABEL[q.type] || q.type}</span>
            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">{q.marks} marks</span>
            {q.subparts?.length > 0 && ['tf', 'fill', 'match'].includes(q.type) && (
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">{q.subparts.length} subparts</span>
            )}
          </div>
        </div>
        {actions}
      </div>
    </div>
  )
}

/* ============================================================ QUESTION EDITOR */
function QuestionEditor({ initial, landscape, onCancel, onSave }) {
  const [form, setForm] = useState({
    id: initial.id || null,
    type: initial.type || 'text',
    text: initial.text || '',
    image: initial.image || '',
    answer: initial.answer || '',
    marks: initial.marks ?? 1,
    numStyle: initial.numStyle || 'num',
    tfDisplay: initial.tfDisplay || 'words',
    subparts: normalizeSubparts(initial.subparts),
    options: normalizeOptions(initial.options),
    option_cols: initial.option_cols === 1 || initial.option_cols === 4 ? initial.option_cols : 2,
    imageScale: initial.imageScale || 100
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const isImage = form.type === 'image'
  const isHeading = form.type === 'heading'
  
  const hasSubparts = ['tf', 'fill', 'match'].includes(form.type)
  const valid = isImage ? !!form.image : !!form.text.trim()

  const pick = async (e) => {
    const f = e.target.files[0]
    if (f) set('image', await resizeImage(f))
  }

  const addSubpart = () => set('subparts', [...form.subparts, blankSubparts()[0]])
  const removeSubpart = (i) => set('subparts', form.subparts.filter((_, j) => j !== i))
  const updateSubpart = (i, key, val) => {
    set('subparts', form.subparts.map((sp, j) => (i === j ? { ...sp, [key]: val } : sp)))
  }

  return (
    <div className="rounded-xl border-2 border-teal-700 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold text-teal-900">{form.id ? 'Edit' : 'New'} · {TYPE_LABEL[form.type]}</div>
        {!isHeading && (
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            Marks
            <input type="number" min="0" className={`${field} !w-20 !py-1`} value={form.marks} onChange={(e) => set('marks', e.target.value)} />
          </label>
        )}
      </div>

      <div className="space-y-4">
        {isImage ? (
          <div className="space-y-3">
            <span className={label}>Handwritten question image *</span>
            <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-5 hover:border-teal-600">
              {form.image ? <img src={form.image} alt="" className="max-h-56 rounded" /> : <span className="text-sm font-semibold text-slate-600">📷 Click to upload</span>}
              <input type="file" accept="image/*" className="hidden" onChange={pick} />
            </label>
            {form.image && (
              <>
                <button onClick={() => set('image', '')} className="text-xs font-semibold text-rose-600 underline">Remove image</button>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <label className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Image scale on print</span>
                      <span className="text-teal-700">{form.imageScale}%</span>
                    </div>
                    <input type="range" min="10" max="100" step="5" value={form.imageScale} onChange={(e) => set('imageScale', Number(e.target.value))} className="accent-teal-700" />
                  </label>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <label className="block">
              <span className={label}>{isHeading ? 'Heading text *' : hasSubparts ? 'Main Question Text *' : 'Question *'}</span>
              <textarea autoFocus rows={isHeading || hasSubparts ? 1 : 3} className={field} value={form.text}
                onChange={(e) => set('text', e.target.value)}
                placeholder={isHeading ? 'e.g. Section A: Multiple choice questions' : hasSubparts ? 'e.g. Fill in the blanks / Choose the correct option' : 'Type the question here'} />
            </label>

            {/* MCQ standard (Old style) */}
            {form.type === 'mcq' && (
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className={`${label} !mb-0`}>Options · tick the correct one</span>
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
                    {[
                      [1, '▭ 1 column'],
                      [2, '▭▭ 2 columns'],
                      [4, '▭▭▭▭ 1 row']
                    ].map(([v, txt]) => (
                      <button key={v} type="button" onClick={() => set('option_cols', v)}
                        className={`rounded-md px-2 py-1 text-[11px] font-bold transition ${form.option_cols === v ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                        {txt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`grid gap-2 ${form.option_cols === 1 ? 'grid-cols-1' : form.option_cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {form.options.map((o, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-300 px-2 py-1.5">
                      <input type="radio" name="correct" checked={!!o.correct}
                        onChange={() => set('options', form.options.map((x, j) => ({ ...x, correct: i === j })))} />
                      <b className="text-xs text-teal-800">{o.label}</b>
                      <input className="min-w-0 flex-1 bg-transparent text-sm outline-none" value={o.text} placeholder={`Option ${o.label}`}
                        onChange={(e) => set('options', form.options.map((x, j) => (i === j ? { ...x, text: e.target.value } : x)))} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subparts for TF, Fill, Match */}
            {hasSubparts && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">Subparts (Choose layout numbering)</span>
                  <select className={`${field} !w-auto !py-1 text-xs`} value={form.numStyle} onChange={(e) => set('numStyle', e.target.value)}>
                    <option value="none">None (No numbers)</option>
                    <option value="num">1, 2, 3 (Numbers)</option>
                    <option value="roman">i, ii, iii (Roman)</option>
                    <option value="cap">A, B, C (Capital)</option>
                    <option value="small">a, b, c (Small)</option>
                    <option value="urdu">ا, ب, پ (Urdu Alphabets)</option>
                    <option value="circle">●, ●, ● (Circle)</option>
                  </select>
                </div>

                {form.type === 'tf' && (
                  <div className="mb-3 rounded border border-slate-200 bg-white p-2">
                    <span className="text-xs font-semibold text-slate-700">Display style for True/False</span>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => set('tfDisplay', 'words')} className={`flex-1 rounded border px-2 py-1 text-xs font-semibold ${form.tfDisplay === 'words' ? 'bg-teal-50 border-teal-700 text-teal-900' : 'border-slate-300 text-slate-600'}`}>True / False</button>
                      <button onClick={() => set('tfDisplay', 'icons')} className={`flex-1 rounded border px-2 py-1 text-xs font-semibold ${form.tfDisplay === 'icons' ? 'bg-teal-50 border-teal-700 text-teal-900' : 'border-slate-300 text-slate-600'}`}>✓ / ✗</button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {form.subparts.map((sp, sIdx) => (
                    <div key={sIdx} className="relative rounded-lg border border-slate-300 bg-white p-3">
                      <button onClick={() => removeSubpart(sIdx)} className="absolute right-2 top-2 rounded p-1 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600">✕</button>
                      
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-teal-700">
                        {form.numStyle !== 'none' && (
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-teal-100">{getLabel(form.numStyle, sIdx)}</span>
                        )}
                        <span>Subpart {sIdx + 1}</span>
                      </div>

                      {form.type === 'tf' && (
                        <div className="space-y-2">
                          <input className={`${field} text-sm`} placeholder="Statement text" value={sp.text} onChange={(e) => updateSubpart(sIdx, 'text', e.target.value)} />
                          <div className="flex gap-2">
                            {['True', 'False'].map((v) => (
                              <button key={v} type="button" onClick={() => updateSubpart(sIdx, 'tfAnswer', v)}
                                className={`flex flex-1 items-center justify-center gap-2 rounded border px-3 py-1.5 text-xs font-semibold ${sp.tfAnswer === v ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-300 text-slate-600'}`}>
                                {v === 'True' ? '✓' : '✗'} {v}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {form.type === 'fill' && (
                        <div className="space-y-2">
                          <input className={`${field} text-sm`} placeholder="Question with blank (e.g. The sun rises in the ____)" value={sp.text} onChange={(e) => updateSubpart(sIdx, 'text', e.target.value)} />
                        </div>
                      )}

                      {form.type === 'match' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input className={`${field} text-sm`} placeholder="Column A (e.g. Apple)" value={sp.matchLeft} onChange={(e) => updateSubpart(sIdx, 'matchLeft', e.target.value)} />
                            <input className={`${field} text-sm`} placeholder="Column B (e.g. Fruit)" value={sp.matchRight} onChange={(e) => updateSubpart(sIdx, 'matchRight', e.target.value)} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addSubpart} className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-teal-400 bg-teal-50 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100">
                  + Add Subpart
                </button>
              </div>
            )}

            {!hasSubparts && !isHeading && !['short', 'long', 'essay', 'application', 'story', 'text'].includes(form.type) && (
              <div className="flex items-center gap-2">
                <label className={`${btnGhost} cursor-pointer py-1.5 text-xs`}>
                  📎 Attach image<input type="file" accept="image/*" className="hidden" onChange={pick} />
                </label>
                {form.image && (<><img src={form.image} alt="" className="h-9 w-9 rounded border border-slate-200 object-cover" />
                  <button onClick={() => set('image', '')} className="text-xs font-semibold text-rose-600 underline">Remove</button></>)}
              </div>
            )}

            {!['mcq', 'tf', 'match', 'fill', 'heading'].includes(form.type) && (
              <label className="block">
                <span className={label}>Answer for teacher copy (optional)</span>
                <input className={field} value={form.answer} onChange={(e) => set('answer', e.target.value)} />
              </label>
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button disabled={!valid} onClick={() => onSave(form)} className={`${btnPrimary} flex-1`}>{form.id ? 'Update' : 'Add to paper'}</button>
        <button onClick={onCancel} className={btnGhost}>Cancel</button>
      </div>
    </div>
  )
}

/* ============================================================ PREVIEW */
function Preview({ html, pageSize, landscape }) {
  const wrap = useRef(null)
  const frame = useRef(null)
  const [scale, setScale] = useState(0.6)
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

  const onLoad = () => {
    try { setH(Math.max(ph, frame.current.contentDocument.documentElement.scrollHeight)) } catch {}
  }

  return (
    <div className="lg:sticky lg:top-4 lg:self-start">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-200/60">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">
          <span>Live preview · {pageSize} {landscape ? 'landscape' : 'portrait'}</span>
          <span>{Math.round(scale * 100)}%</span>
        </div>
        <div ref={wrap} className="max-h-[calc(100vh-170px)] overflow-y-auto overflow-x-hidden p-3">
          <div style={{ width: pw * scale, height: h * scale, margin: '0 auto', overflow: 'hidden' }}>
            <iframe ref={frame} title="Preview" srcDoc={html} onLoad={onLoad} scrolling="no"
              style={{ width: pw, height: h, border: 0, background: '#fff', transform: `scale(${scale})`, transformOrigin: 'top left', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.18)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================ PAPER HTML */
function buildPaperHtml({ paper, questions, school, pageSize = 'A4', landscape = false, answers = false }) {
  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const nl = (v) => esc(v).replace(/\n/g, '<br/>')
  const nursery = paper?.style === 'nursery'
  const fs = nursery ? 17 : 13
  const rtl = paper?.isUrdu || false
  const dir = rtl ? 'rtl' : 'ltr'
  const side = rtl ? 'right' : 'left'
  const sname = school?.name || (rtl ? 'اسکول کا نام' : 'School Name')

  // Urdu Translations for headers
  const T = {
    class: rtl ? 'کلاس' : 'Class',
    marks: rtl ? 'نمبر' : 'Marks',
    time: rtl ? 'وقت' : 'Time',
    date: rtl ? 'تاریخ' : 'Date',
    session: rtl ? 'سیشن' : 'Session',
    name: rtl ? 'نام:' : 'Name:',
    roll: rtl ? 'رول نمبر:' : 'Roll No:',
    instr: rtl ? 'ہدایات:' : 'Instructions:',
    end: rtl ? '— پرچہ ختم ہوا —' : '— End of paper —'
  }

  let n = 0
  const totalMarks = questions.filter((q) => !['pagebreak', 'heading'].includes(q.type)).reduce((a, q) => a + (Number(q.marks) || 0), 0)

  const renderQ = (q) => {
    if (q.type === 'pagebreak') return '<div class="pb"></div>'
    if (q.type === 'heading') return `<div class="sec">${esc(q.text)}</div>`
    n++
    const marks = `<span class="qmarks">[${Number(q.marks) || 0}]</span>`
    
    const imgStyle = q.imageScale ? `style="max-width: ${q.imageScale}% !important;"` : ''

    if (q.type === 'image' && q.image) {
      return `<div class="q"><div class="qhead"><span class="qnum">${n}.</span><span class="qtext"></span>${marks}</div><div class="qimg"><img src="${safeImgSrc(q.image)}" ${imgStyle}/></div></div>`
    }

    let body = ''
    let ans = ''

    if (['tf', 'fill', 'match'].includes(q.type) && q.subparts?.length > 0) {
      
      const subpartsHtml = q.subparts.map((sp, i) => {
        const lbl = getLabel(q.numStyle, i)
        let inner = ''

        if (q.type === 'tf') {
          const tfDisplay = q.tfDisplay || 'words'
          let optionsHtml = ''
          if (tfDisplay === 'words') {
            const wTrue = rtl ? 'صحیح' : 'True'
            const wFalse = rtl ? 'غلط' : 'False'
            optionsHtml = `<span class="tf-box">${answers && sp.tfAnswer === 'True' ? `<b class="ok">${wTrue}</b>` : wTrue} / ${answers && sp.tfAnswer === 'False' ? `<b class="ok">${wFalse}</b>` : wFalse}</span>`
          } else {
            optionsHtml = `<span class="tf-box sym-box">${answers && sp.tfAnswer === 'True' ? '<b class="ok">✓</b>' : '✓'} / ${answers && sp.tfAnswer === 'False' ? '<b class="ok">✗</b>' : '✗'}</span>`
          }
          inner = `<div class="sub-tf"><span class="s-txt">${nl(sp.text)}</span> ${optionsHtml}</div>`
        } 
        else if (q.type === 'fill') {
          inner = `<div class="sub-text">${nl(sp.text)}</div>`
        } 
        else if (q.type === 'match') {
          inner = `<div class="sub-match"><span>${nl(sp.matchLeft)}</span> <span>${nl(sp.matchRight)}</span></div>`
        }

        return `<div class="subpart">
          ${lbl ? `<div class="sub-lbl">${lbl}</div>` : ''}
          <div class="sub-content">${inner}</div>
        </div>`
      }).join('')

      body = `<div class="subparts">${subpartsHtml}</div>`
    
    } else {
      if (q.type === 'mcq' && q.options?.length) {
        const cols = q.option_cols === 1 || q.option_cols === 4 ? q.option_cols : 2
        const cls = cols === 1 ? 'c1' : cols === 4 ? 'c4' : 'c2'
        
        // Use Urdu alphabets if RTL
        const mcqLabels = rtl ? URDU_ALPHABETS : ['A', 'B', 'C', 'D']
        
        body = `<div class="opts ${cls}">${q.options.map((o, i) => `<div class="opt${answers && o.correct ? ' ok' : ''}"><b>${mcqLabels[i]}.</b> ${esc(o.text)}</div>`).join('')}</div>`
      } else if (q.type === 'match' && q.matching?.length) {
        const rights = answers ? q.matching.map((m) => m.right) : [...q.matching.map((m) => m.right)].reverse()
        body = `<div class="match-list">
          <div class="match-col">${q.matching.map((m, j) => `<div class="match-item"><span>${j + 1}. ${esc(m.left)}</span> <span>${String.fromCharCode(97 + j)}.</span></div>`).join('')}</div>
          <div class="match-col">${q.matching.map((m, j) => `<div class="match-item"><span>${j + 1}. </span> <span>${String.fromCharCode(97 + j)}. ${esc(rights[j])}</span></div>`).join('')}</div>
        </div>`
      } else if (q.type === 'tf') {
        const wTrue = rtl ? 'صحیح' : 'True'
        const wFalse = rtl ? 'غلط' : 'False'
        body = `<div class="tf-container"><span class="tf-box">${wTrue} / ${wFalse}</span><span class="tf-box sym-box">✓ / ✗</span></div>`
      } else if (q.type === 'fill') {
        body = `<div class="blank"></div>`
      }
      if (answers && q.answer && !['mcq', 'tf', 'match'].includes(q.type)) ans = q.answer
    }

    return `<div class="q">
      <div class="qhead"><span class="qnum">${n}.</span><span class="qtext">${nl(q.text)}</span>${marks}</div>
      ${q.image ? `<div class="qimg"><img src="${safeImgSrc(q.image)}" ${imgStyle}/></div>` : ''}
      ${body}
      ${answers && ans ? `<div class="ans">${rtl ? 'جواب:' : 'Answer:'} ${nl(ans)}</div>` : ''}
    </div>`
  }

  const body = questions.map(renderQ).join('')

  return `<!DOCTYPE html><html dir="${dir}"><head><meta charset="utf-8"><title>${esc(paper?.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: ${pageSize} ${landscape ? 'landscape' : 'portrait'}; margin: 12mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body { 
    font-family: ${rtl ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" : "'Segoe UI', Arial, sans-serif"}; 
    color: #111827; font-size: ${fs}px; line-height: ${rtl ? 2.2 : 1.55}; text-align: ${side}; 
  }
  @media screen { body { padding: 12mm; } }
  .head { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #111827; padding-bottom: 8px; margin-bottom: 8px; }
  .logo { height: 64px; width: 64px; object-fit: contain; flex: none; }
  .logo-sp { width: 64px; flex: none; }
  .htext { flex: 1; text-align: center; }
  .htext h1 { margin: 0; font-size: ${nursery ? 26 : 22}px; line-height: 1.2; ${rtl ? 'font-family: "Noto Nastaliq Urdu", serif;' : ''} }
  .addr { font-size: ${fs - 2}px; color: #4b5563; margin-top: 2px; }
  .exam { font-size: ${fs + 1}px; font-weight: 700; margin-top: 4px; text-transform: ${rtl ? 'none' : 'uppercase'}; letter-spacing: ${rtl ? 0 : '.6px'}; }
  .session { font-size: ${fs}px; font-weight: 700; margin-top: 2px; }
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: ${fs - 1}px; border: 1px solid #9ca3af; padding: 5px 8px; margin-bottom: 8px; }
  .student { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 8px; }
  .student span { flex: 1; border-bottom: 1px solid #111827; }
  .student .r { flex: 0 0 25%; }
  .instr { font-size: ${fs - 1}px; border: 1px solid #9ca3af; border-${side}: 4px solid #111827; padding: 5px 9px; margin-bottom: 10px; }
  .sec { margin: 12px 0 6px; padding: 4px 10px; background: #e5e7eb; font-weight: 800; border-radius: 3px; break-after: avoid; }
  .q { margin-bottom: 12px; break-inside: avoid; }
  .qhead { display: flex; gap: 6px; align-items: baseline; font-weight: 600; }
  .qnum { min-width: 26px; font-weight: 800; }
  .qtext { flex: 1; }
  .qmarks { font-weight: 700; white-space: nowrap; }
  .qimg { margin-top: 6px; margin-${side}: 32px; }
  .qimg img { max-width: 100%; border: 1px solid #d1d5db; display: block; }

  /* Subparts Layout */
  .subparts { margin-${side}: 32px; margin-top: 6px; display: flex; flex-direction: column; gap: 6px; }
  .subpart { display: flex; gap: 8px; align-items: flex-start; }
  .sub-lbl { min-width: 24px; font-weight: 700; }
  .sub-content { flex: 1; }

  /* TF Subparts */
  .sub-tf { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .s-txt { font-weight: 500; }
  .tf-box { display: inline-flex; border: 1px solid #111827; border-radius: 3px; padding: 2px 8px; font-size: ${fs - 1}px; font-weight: 600; gap: 4px; }
  .sym-box { min-width: 50px; justify-content: center; font-weight: 800; }
  .tf-box b.ok { text-decoration: underline; }

  /* Fill Subparts */
  .sub-text { font-weight: 500; }
  
  /* Match Subparts (Underline removed) */
  .sub-match { display: flex; gap: 40px; font-size: ${fs - 0.5}px; margin-top: 4px; }
  .sub-match span { min-width: 120px; padding-bottom: 2px; }

  /* Standard MCQ options grid */
  .opts { margin-top: 3px; margin-${side}: 32px; display: grid; gap: 2px 18px; font-size: ${fs - 0.5}px; }
  .opts.c1 { grid-template-columns: 1fr; }
  .opts.c2 { grid-template-columns: 1fr 1fr; }
  .opts.c4 { grid-template-columns: repeat(4, 1fr); }
  .opt.ok { font-weight: 800; text-decoration: underline; }

  /* Standard TF Layout */
  .tf-container { margin-top: 4px; display: flex; gap: 16px; align-items: center; }

  /* Standard Match Layout */
  .match-list { margin-top: 4px; margin-${side}: 32px; display: flex; gap: 40px; font-size: ${fs - 0.5}px; }
  .match-col { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
  .match-item { display: flex; justify-content: space-between; border-bottom: 1px dotted #9ca3af; padding-bottom: 2px; }

  .ans { margin-top: 4px; font-size: ${fs - 1}px; font-weight: 700; color: #065f46; margin-${side}: 32px; }
  .pb { break-after: page; height: 0; }
  .foot { margin-top: 16px; text-align: center; font-weight: 700; border-top: 1px solid #9ca3af; padding-top: 6px; font-size: ${fs - 1}px; }
</style></head><body>
  <div class="head">
    ${school?.logo ? `<img class="logo" src="${safeImgSrc(school.logo)}" alt=""/>` : '<div class="logo-sp"></div>'}
    <div class="htext">
      <h1>${esc(sname)}</h1>
      ${school?.address ? `<div class="addr">${esc(school.address)}</div>` : ''}
      <div class="exam">${esc(paper?.exam_name || 'Examination')} — ${esc(paper?.subject)}</div>
      <div class="session">Session: ${esc(paper?.session || '')}</div>
    </div>
    <div class="logo-sp"></div>
  </div>
  <div class="meta">
    <div>${T.class}: <b>${esc(paper?.class_name)}${paper?.section ? ' - ' + esc(paper.section) : ''}</b></div>
    <div>${T.marks}: <b>${totalMarks}</b></div>
    <div>${T.time}: <b>${esc(paper?.duration || '-')}</b></div>
    <div>${T.date}: <b>${esc(paper?.exam_date || '-')}</b></div>
  </div>
  <div class="student"><span>${T.name}</span><span class="r">${T.roll}</span></div>
  ${paper?.instructions ? `<div class="instr"><b>${T.instr}</b> ${nl(paper.instructions)}</div>` : ''}
  ${body}
  <div class="foot">${T.end}</div>
</body></html>`
}