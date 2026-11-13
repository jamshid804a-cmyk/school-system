import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/* CHANGED: removed hard-coded SCHOOL_NAME — now pulled from Settings */

const CLASSES = [
  'Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
]
const SECTIONS = ['A', 'B', 'C', 'D']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const METHODS = ['Cash', 'Bank Transfer', 'Easypaisa', 'JazzCash', 'Cheque']
const QUICK_NOTES = [
  'Paid by father',
  'Paid by mother',
  'Balance next week',
  'Advance payment',
  'Late fee waived',
  'Sibling discount'
]

const pad = (n) => String(n).padStart(2, '0')
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const todayStr = () => {
  const n = new Date()
  return ymd(n.getFullYear(), n.getMonth(), n.getDate())
}
const monthKeyNow = () => {
  const n = new Date()
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}`
}

// Session now starts in MARCH (e.g. 2026-2027 = March 2026 -> February 2027)
const currentSession = () => {
  const d = new Date()
  const y = d.getMonth() >= 2 ? d.getFullYear() : d.getFullYear() - 1
  return `${y}-${y + 1}`
}
// March of the first year ... February of the next year
const sessionMonths = (session) => {
  const start = parseInt(String(session).slice(0, 4), 10) || new Date().getFullYear()
  return Array.from({ length: 12 }, (_, i) => {
    const m = (2 + i) % 12 // starts from March
    const y = i < 10 ? start : start + 1 // Mar-Dec = start year, Jan-Feb = next year
    return {
      key: `${y}-${pad(m + 1)}`,
      label: `${MONTH_NAMES[m]} ${y}`,
      short: MONTH_NAMES[m].slice(0, 3)
    }
  })
}
const rs = (n) => 'Rs. ' + Math.round(Number(n) || 0).toLocaleString('en-US')
const esc = (v) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const feeInfo = (fee, paid) => {
  const remaining = Math.max(0, fee - paid)
  let status = 'Unpaid'
  if (fee <= 0) status = 'No fee'
  else if (paid >= fee) status = 'Paid'
  else if (paid > 0) status = 'Partial'
  return { fee, paid, remaining, status }
}

const STATUS_STYLE = {
  Paid: 'bg-emerald-100 text-emerald-700',
  Partial: 'bg-amber-100 text-amber-700',
  Unpaid: 'bg-rose-100 text-rose-700',
  'No fee': 'bg-slate-100 text-slate-500'
}
const DOT_STYLE = {
  Paid: 'bg-emerald-500',
  Partial: 'bg-amber-400',
  Unpaid: 'bg-rose-400',
  'No fee': 'bg-slate-300'
}

const filterCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
const inputCls =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100'

const Portal = ({ children }) => createPortal(children, document.body)

const Svg = ({ d, className = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)
const XIcon = (p) => <Svg {...p} d="M6 18L18 6M6 6l12 12" />
const SearchIcon = (p) => <Svg {...p} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
const PrintIcon = (p) => <Svg {...p} d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a1 1 0 011-1h16a1 1 0 011 1v6a1 1 0 01-1 1h-2M6 14h12v7H6z" />
const PlusIcon = (p) => <Svg {...p} d="M12 4.5v15m7.5-7.5h-15" />
const CheckIcon = (p) => <Svg {...p} d="M4.5 12.75l6 6 9-13.5" />
const TrashIcon = (p) => (
  <Svg {...p} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
)

function Avatar({ s, size = 'h-10 w-10', text = 'text-sm' }) {
  if (s.photo) return <img src={s.photo} className={`${size} rounded-full object-cover`} />
  return (
    <div className={`${size} ${text} flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-semibold text-white`}>
      {(s.name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

function Label({ text, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-slate-500">{text}</span>
      {children}
    </label>
  )
}

/* CHANGED: new hook to load the school brand from Settings */
function useSchoolBrand() {
  const [brand, setBrand] = useState({
    name: 'School System',
    address: '',
    logo: '',
    phone: '',
    email: '',
    principal: ''
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
          principal: s.principalName || ''
        })
      } catch {
        /* ignore */
      }
    })()
  }, [])

  return brand
}

/* ---------- RECEIPT ---------- */
/* CHANGED: accepts `brand` and renders the logo + name + address */
function buildReceiptHtml({ brand, student, payment, monthLabel, fee, monthPaid }) {
  const balance = Math.max(0, fee - monthPaid)
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(payment.receipt_no)}</title>
<style>
  @page { size: A5; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Segoe UI, Arial, sans-serif; color: #1e293b; margin: 0; padding: 18px; }
  .head { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
  .head .logo { height: 56px; margin-bottom: 6px; object-fit: contain; }
  .head h1 { margin: 0; font-size: 20px; color: #1e40af; }
  .head .addr { margin: 4px 0 0; font-size: 11px; color: #64748b; }
  .head .title { margin-top: 4px; font-size: 11px; color: #64748b; letter-spacing: .12em; text-transform: uppercase; }
  .meta { display: flex; justify-content: space-between; font-size: 12px; margin: 14px 0; color: #475569; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td { padding: 7px 4px; border-bottom: 1px solid #e2e8f0; }
  td:last-child { text-align: right; font-weight: 600; }
  .amt { margin-top: 14px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 12px; text-align: center; font-size: 12px; color: #047857; }
  .amt b { display: block; font-size: 26px; margin-top: 2px; }
  .bal { color: #be123c; }
  .note { margin-top: 12px; font-size: 12px; color: #475569; }
  .sign { display: flex; justify-content: space-between; margin-top: 44px; font-size: 11px; color: #64748b; }
  .sign div { border-top: 1px solid #94a3b8; padding-top: 4px; width: 40%; text-align: center; }
</style></head><body>
<div class="head">
  ${brand?.logo ? `<img src="${brand.logo}" class="logo" alt="logo" />` : ''}
  <h1>${esc(brand?.name || 'School System')}</h1>
  ${brand?.address ? `<div class="addr">${esc(brand.address)}</div>` : ''}
  <div class="title">Fee Receipt</div>
</div>
<div class="meta"><div>Receipt No: <b>${esc(payment.receipt_no)}</b></div><div>Date: <b>${esc(payment.paid_on)}</b></div></div>
<table>
  <tr><td>Student</td><td>${esc(student.name)}</td></tr>
  <tr><td>Father</td><td>${esc(student.father_name || '-')}</td></tr>
  <tr><td>Class</td><td>${esc(student.class_name)}${student.section ? ' - ' + esc(student.section) : ''}${student.roll_no ? ' | Roll ' + esc(student.roll_no) : ''}</td></tr>
  <tr><td>Adm. No</td><td>${esc(student.admission_no || '-')}</td></tr>
  <tr><td>Fee month</td><td>${esc(monthLabel)}</td></tr>
  <tr><td>Monthly fee</td><td>${rs(fee)}</td></tr>
  <tr><td>Total paid for this month</td><td>${rs(monthPaid)}</td></tr>
  <tr><td>Balance</td><td class="bal">${rs(balance)}</td></tr>
  <tr><td>Payment method</td><td>${esc(payment.method || 'Cash')}</td></tr>
</table>
<div class="amt">Amount received<b>${rs(payment.amount)}</b></div>
${payment.note ? `<div class="note"><b>Note:</b> ${esc(payment.note)}</div>` : ''}
<div class="sign"><div>Parent / Guardian</div><div>Accountant</div></div>
</body></html>`
}

/* CHANGED: accepts `brand` and passes it into buildReceiptHtml */
function ReceiptModal({ data, brand, onClose }) {
  const ref = useRef(null)
  const print = () => {
    const w = ref.current?.contentWindow
    if (w) {
      w.focus()
      w.print()
    }
  }
  return (
    <div onClick={onClose} className="anim-fade-in fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="anim-pop flex h-[85vh] w-[560px] max-w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="font-bold text-slate-800">Receipt {data.payment.receipt_no}</h2>
          <div className="flex gap-2">
            <button onClick={print} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95">
              <PrintIcon className="h-4 w-4" /> Print
            </button>
            <button onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              Close
            </button>
          </div>
        </div>
        <iframe ref={ref} title="Receipt" srcDoc={buildReceiptHtml({ ...data, brand })} className="flex-1 border-0" />
      </div>
    </div>
  )
}

/* ---------- COLLECT WINDOW ---------- */
function CollectModal({ student, months, monthKey, onMonth, payIndex, onClose, reload, onNext, showToast, openReceipt }) {
  const fee = Number(student.monthly_fee) || 0
  const pay = payIndex[`${student.id}|${monthKey}`] || { paid: 0, list: [] }
  const info = feeInfo(fee, pay.paid)
  const mo = months.find((m) => m.key === monthKey) || months[0]

  const [amount, setAmount] = useState(info.remaining ? String(info.remaining) : '')
  const [date, setDate] = useState(todayStr())
  const [method, setMethod] = useState('Cash')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [autoReceipt, setAutoReceipt] = useState(false)

  useEffect(() => {
    setAmount(info.remaining ? String(info.remaining) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id, monthKey])

  const save = async (goNext) => {
    const amt = Math.round(Number(amount) * 100) / 100
    if (!amt || amt <= 0) return alert('Please enter the amount')
    if (amt > info.remaining) return alert(`Amount is more than the remaining ${rs(info.remaining)}`)
    setBusy(true)
    try {
      const saved = await window.api.addFeePayment({
        student_id: student.id,
        session: student.session,
        month: monthKey,
        amount: amt,
        method,
        note: note.trim(),
        paid_on: date
      })
      await reload()
      showToast(`${rs(amt)} collected from ${student.name}`)
      setNote('')
      const newRemaining = Math.max(0, info.remaining - amt)
      setAmount(newRemaining > 0 ? String(newRemaining) : '')
      if (autoReceipt) {
        openReceipt({ student, payment: saved, monthLabel: mo.label, fee, monthPaid: saved.month_paid })
      }
      if (goNext) onNext()
    } catch (err) {
      alert('Could not save: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const removePayment = async (p) => {
    if (!confirm(`Delete payment ${p.receipt_no} of ${rs(p.amount)}? This cannot be undone.`)) return
    try {
      await window.api.deleteFeePayment(p.id)
      await reload()
      showToast('Payment deleted')
      setAmount(String(Math.max(0, info.remaining + Number(p.amount))))
    } catch (err) {
      alert('Could not delete: ' + err.message)
    }
  }

  const history = [...pay.list].sort((a, b) => b.id - a.id)
  const percent = fee > 0 ? Math.min(100, Math.round((info.paid / fee) * 100)) : 0

  return (
    <div onClick={onClose} className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="anim-pop flex max-h-[92vh] w-[760px] max-w-full flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <Avatar s={student} size="h-12 w-12" text="text-lg" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">{student.name}</h2>
              <p className="text-xs text-slate-500">
                {student.class_name}
                {student.section ? ` - ${student.section}` : ''}
                {student.roll_no ? ` | Roll ${student.roll_no}` : ''}
                {student.admission_no ? ` | ${student.admission_no}` : ''}
                {student.father_name ? ` | S/O ${student.father_name}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <XIcon />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Choose month ({student.session})
            </div>
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
              {months.map((m) => {
                const st = feeInfo(fee, (payIndex[`${student.id}|${m.key}`] || { paid: 0 }).paid).status
                const active = m.key === monthKey
                return (
                  <button
                    key={m.key}
                    onClick={() => onMonth(m.key)}
                    title={`${m.label}: ${st}`}
                    className={`flex flex-col items-center rounded-lg px-1 py-1.5 text-[10px] font-semibold transition ${
                      active ? 'bg-blue-600 text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{m.short}</span>
                    <span className={`mt-1 h-1.5 w-1.5 rounded-full ${DOT_STYLE[st]} ${active ? 'ring-2 ring-white' : ''}`} />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold text-slate-700">{mo.label}</div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[info.status]}`}>{info.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-semibold text-slate-500">Monthly fee</div>
                <div className="mt-0.5 text-lg font-bold text-slate-800">{rs(fee)}</div>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-3">
                <div className="text-[11px] font-semibold text-emerald-600">Paid so far</div>
                <div className="mt-0.5 text-lg font-bold text-emerald-700">{rs(info.paid)}</div>
              </div>
              <div className="rounded-xl bg-rose-50 px-4 py-3">
                <div className="text-[11px] font-semibold text-rose-600">Remaining</div>
                <div className="mt-0.5 text-lg font-bold text-rose-700">{rs(info.remaining)}</div>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div style={{ width: `${percent}%` }} className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" />
            </div>
            {Number(amount) > 0 && info.remaining > 0 && (
              <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Collecting <b>{rs(amount)}</b> now → Paid will be{' '}
                <b>{rs(info.paid + Number(amount))}</b>, Remaining <b>{rs(Math.max(0, info.remaining - Number(amount)))}</b>
              </div>
            )}
          </div>

          {fee <= 0 ? (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              The monthly fee of this student is 0. Edit the student and set a Monthly Fee first.
            </div>
          ) : info.remaining <= 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckIcon className="h-5 w-5" /> {mo.label} is fully paid. Choose another month above to collect more.
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
              <div className="grid grid-cols-3 gap-3">
                <Label text="Amount to collect">
                  <input type="number" min="0" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
                </Label>
                <Label text="Date">
                  <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
                </Label>
                <Label text="Method">
                  <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>
                    {METHODS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Label>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setAmount(String(info.remaining))} className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                  Full {rs(info.remaining)}
                </button>
                <button onClick={() => setAmount(String(Math.round(info.remaining / 2)))} className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                  Half {rs(Math.round(info.remaining / 2))}
                </button>
                <button onClick={() => setAmount('')} className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200">
                  Clear
                </button>
              </div>

              <Label text="Note (optional)">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Paid by father, balance next week..."
                />
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_NOTES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNote((n) => (n ? (n.includes(c) ? n : n + ', ' + c) : c))}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-blue-100 hover:text-blue-700"
                  >
                    + {c}
                  </button>
                ))}
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={autoReceipt} onChange={(e) => setAutoReceipt(e.target.checked)} className="h-4 w-4 accent-blue-600" />
                Open the receipt after saving
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => save(false)}
                  disabled={busy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                >
                  <PlusIcon className="h-4 w-4" /> {busy ? 'Saving...' : `Collect ${rs(amount)}`}
                </button>
                <button
                  onClick={() => save(true)}
                  disabled={busy}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                >
                  Collect & next student
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Payments in {mo.label} ({history.length})
            </div>
            {history.length === 0 && (
              <div className="rounded-xl bg-slate-50 px-4 py-4 text-center text-sm text-slate-400">No payment yet</div>
            )}
            <div className="space-y-2">
              {history.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">{p.receipt_no}</span>
                      <span>{p.paid_on}</span>
                      <span>| {p.method || 'Cash'}</span>
                    </div>
                    {p.note && <div className="mt-1 text-xs italic text-slate-500">"{p.note}"</div>}
                  </div>
                  <div className="font-bold text-emerald-600">{rs(p.amount)}</div>
                  <button
                    title="Print receipt"
                    onClick={() =>
                      openReceipt({
                        student,
                        payment: p,
                        monthLabel: mo.label,
                        fee,
                        monthPaid: pay.list.filter((x) => x.id <= p.id).reduce((a, x) => a + (Number(x.amount) || 0), 0)
                      })
                    }
                    className="rounded-lg p-2 text-blue-600 transition hover:scale-110 hover:bg-blue-50"
                  >
                    <PrintIcon className="h-4 w-4" />
                  </button>
                  <button
                    title="Delete payment"
                    onClick={() => removePayment(p)}
                    className="rounded-lg p-2 text-rose-600 transition hover:scale-110 hover:bg-rose-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- FEE MANAGEMENT PAGE ---------- */
export default function Fees({ students = [] }) {
  /* CHANGED: load the school brand */
  const brand = useSchoolBrand()

  const cur = currentSession()
  const nowKey = monthKeyNow()

  const sessionsInData = useMemo(
    () => [...new Set(students.map((s) => s.session).filter(Boolean))].sort().reverse(),
    [students]
  )
  const [sessionSel, setSessionSel] = useState('')
  const session = sessionSel || (sessionsInData.includes(cur) ? cur : sessionsInData[0] || cur)

  const months = useMemo(() => sessionMonths(session), [session])
  const [monthSel, setMonthSel] = useState(null)
  const defaultIdx = Math.max(0, months.findIndex((m) => m.key === nowKey))
  const monthIdx = monthSel === null ? defaultIdx : monthSel
  const month = months[monthIdx]

  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [apiMissing, setApiMissing] = useState(false)

  const [collect, setCollect] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  const loadPayments = async () => {
    if (typeof window.api?.listFeePayments !== 'function') {
      setApiMissing(true)
      setPayments([])
      return
    }
    setApiMissing(false)
    try {
      setPayments(await window.api.listFeePayments({ session }))
    } catch (err) {
      alert('Could not load fees: ' + err.message)
    }
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    loadPayments().finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const payIndex = useMemo(() => {
    const map = {}
    payments.forEach((p) => {
      const k = `${p.student_id}|${p.month}`
      if (!map[k]) map[k] = { paid: 0, list: [] }
      map[k].paid += Number(p.amount) || 0
      map[k].list.push(p)
    })
    return map
  }, [payments])

  const infoFor = (s, key) =>
    feeInfo(Number(s.monthly_fee) || 0, (payIndex[`${s.id}|${key}`] || { paid: 0 }).paid)

  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const list = students
    .filter((s) => {
      if (s.session !== session) return false
      if (classFilter && s.class_name !== classFilter) return false
      if (sectionFilter && s.section !== sectionFilter) return false
      if (words.length) {
        const text = [s.name, s.father_name, s.roll_no, s.admission_no, s.phone].join(' ').toLowerCase()
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

  const dueMonths = months.filter((m) => m.key <= nowKey)
  const rows = list.map((s) => {
    const info = infoFor(s, month.key)
    const dots = months.map((m) => infoFor(s, m.key).status)
    const unpaidDue = dueMonths.filter((m) => {
      const st = infoFor(s, m.key).status
      return st === 'Unpaid' || st === 'Partial'
    }).length
    return { s, info, dots, unpaidDue }
  })
  const shown = statusFilter === 'all' ? rows : rows.filter((r) => r.info.status === statusFilter)

  const totals = rows.reduce(
    (a, r) => {
      a.expected += r.info.fee
      a.collected += r.info.paid
      a.pending += r.info.remaining
      if (r.info.status === 'Paid') a.paid++
      if (r.info.status === 'Partial') a.partial++
      if (r.info.status === 'Unpaid') a.unpaid++
      return a
    },
    { expected: 0, collected: 0, pending: 0, paid: 0, partial: 0, unpaid: 0 }
  )
  const progress = totals.expected ? Math.min(100, Math.round((totals.collected / totals.expected) * 100)) : 0

  const hasFilters = classFilter || sectionFilter || search || statusFilter !== 'all'
  const collectStudent = collect ? students.find((s) => s.id === collect.studentId) : null

  const openNext = () => {
    if (!collect) return
    const idx = shown.findIndex((r) => r.s.id === collect.studentId)
    const after = [...shown.slice(idx + 1), ...shown.slice(0, Math.max(idx, 0))]
    const next = after.find((r) => r.info.remaining > 0)
    if (next) setCollect({ studentId: next.s.id, monthKey: collect.monthKey })
    else {
      setCollect(null)
      showToast('All done. No more unpaid students in this list')
    }
  }

  const chips = [
    ['all', 'All', rows.length],
    ['Paid', 'Paid', totals.paid],
    ['Partial', 'Partial', totals.partial],
    ['Unpaid', 'Unpaid', totals.unpaid]
  ]

  const cards = [
    { label: 'Students', value: rows.length, sub: `Expected ${rs(totals.expected)}`, color: 'from-blue-500 to-blue-600' },
    { label: 'Fully paid', value: totals.paid, sub: `${totals.partial} partial`, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Pending amount', value: rs(totals.pending), sub: `${totals.unpaid} unpaid students`, color: 'from-rose-500 to-rose-600' },
    { label: 'Collected', value: rs(totals.collected), sub: `${progress}% of expected`, color: 'from-indigo-500 to-purple-600' }
  ]

  return (
    <div>
      {/* CHANGED: header shows school logo + name */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          {brand.logo && (
            <img
              src={brand.logo}
              alt="logo"
              className="h-12 w-12 rounded-xl bg-white object-contain p-1 ring-1 ring-slate-200"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{brand.name || 'Fee Management'}</h1>
            <p className="text-sm text-slate-500">
              Fee Management{brand.address ? ` · ${brand.address}` : ''}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-slate-200">
          <span className="text-slate-500">Month: </span>
          <span className="font-bold text-slate-800">{month.label}</span>
        </div>
      </div>

      {apiMissing && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          The fee backend was not found. Add the fee handlers, then stop the app (Ctrl + C) and run npm run dev again.
        </div>
      )}

      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Label text="Session / Year">
            <select
              className={filterCls}
              value={session}
              onChange={(e) => {
                setSessionSel(e.target.value)
                setMonthSel(null)
              }}
            >
              {(sessionsInData.length ? sessionsInData : [cur]).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Label>
          <Label text="Month">
            <select className={filterCls} value={monthIdx} onChange={(e) => setMonthSel(Number(e.target.value))}>
              {months.map((m, i) => (
                <option key={m.key} value={i}>
                  {m.label}
                </option>
              ))}
            </select>
          </Label>
          <Label text="Class">
            <select className={filterCls} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="">All classes</option>
              {CLASSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Label>
          <Label text="Section">
            <select className={filterCls} value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
              <option value="">All sections</option>
              {SECTIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Label>
          <Label text="Search">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Name, roll, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </Label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map(([key, label, n]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === key ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label} <span className="opacity-70">({n})</span>
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={() => {
                setClassFilter('')
                setSectionFilter('')
                setSearch('')
                setStatusFilter('all')
              }}
              className="anim-fade-in rounded-full bg-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((c, i) => (
          <div
            key={c.label}
            style={{ animationDelay: `${i * 70}ms` }}
            className={`anim-fade-up bg-gradient-to-br ${c.color} rounded-2xl p-5 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl`}
          >
            <div className="text-sm opacity-90">{c.label}</div>
            <div className="mt-1 text-2xl font-bold">{c.value}</div>
            <div className="mt-1 text-xs opacity-80">{c.sub}</div>
            {c.label === 'Collected' && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/30">
                <div style={{ width: `${progress}%` }} className="h-full rounded-full bg-white transition-all duration-700" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="anim-fade-up overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="font-semibold text-slate-700">
            Fee details <span className="font-normal text-slate-400">| {month.label}</span>
            {classFilter && <span className="font-normal text-slate-400"> | {classFilter}</span>}
            {sectionFilter && <span className="font-normal text-slate-400"> - {sectionFilter}</span>}
          </div>
          <div className="text-xs text-slate-400">{loading ? 'Loading...' : `${shown.length} students`}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Adm. No</th>
                <th className="px-4 py-3 text-right">Monthly fee</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Session months</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ s, info, dots, unpaidDue }, i) => (
                <tr
                  key={s.id}
                  style={{ animationDelay: `${Math.min(i, 14) * 35}ms` }}
                  className="anim-fade-up border-t border-slate-100 transition hover:bg-blue-50/40"
                >
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar s={s} size="h-9 w-9" text="text-xs" />
                      <div>
                        <div className="font-semibold text-slate-800">{s.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {s.class_name}
                          {s.section ? ` - ${s.section}` : ''}
                          {s.roll_no ? ` | Roll ${s.roll_no}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.admission_no}</td>
                  <td className="px-4 py-3 text-right font-medium">{rs(info.fee)}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">{rs(info.paid)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${info.remaining > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                    {rs(info.remaining)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[info.status]}`}>{info.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-0.5">
                      {dots.map((st, j) => (
                        <span
                          key={j}
                          title={`${months[j].label}: ${st}`}
                          className={`h-2 w-2 rounded-full ${DOT_STYLE[st]} ${months[j].key > nowKey ? 'opacity-30' : ''}`}
                        />
                      ))}
                    </div>
                    <div className={`mt-1 text-center text-[10px] font-semibold ${unpaidDue > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {dueMonths.length === 0 ? '-' : `${unpaidDue}/${dueMonths.length} pending`}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setCollect({ studentId: s.id, monthKey: month.key })}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
                        info.status === 'Paid'
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-blue-600 text-white shadow shadow-blue-600/30 hover:bg-blue-700'
                      }`}
                    >
                      {info.status === 'Paid' ? (
                        'History'
                      ) : (
                        <>
                          <PlusIcon className="h-3.5 w-3.5" /> Collect
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {shown.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <SearchIcon className="mx-auto mb-3 h-10 w-10" />
            No students found for this session / class / section
          </div>
        )}
      </div>

      {collect && collectStudent && (
        <Portal>
          <CollectModal
            key={collect.studentId}
            student={collectStudent}
            months={months}
            monthKey={collect.monthKey}
            onMonth={(k) => setCollect({ ...collect, monthKey: k })}
            payIndex={payIndex}
            onClose={() => setCollect(null)}
            reload={loadPayments}
            onNext={openNext}
            showToast={showToast}
            openReceipt={setReceipt}
          />
        </Portal>
      )}

      {/* CHANGED: pass brand into ReceiptModal */}
      {receipt && (
        <Portal>
          <ReceiptModal data={receipt} brand={brand} onClose={() => setReceipt(null)} />
        </Portal>
      )}

      <Portal>
        <div
          className={`fixed bottom-6 right-6 z-[80] flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-xl transition-all duration-300 ${
            toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          <CheckIcon className="h-5 w-5" /> {toast}
        </div>
      </Portal>
    </div>
  )
}