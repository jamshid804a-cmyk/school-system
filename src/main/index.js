import { registerBackupHandlers, autoBackup } from './backup'
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, extname, basename } from 'path'
import fs from 'fs'
import os from 'os'
import crypto from 'crypto'
import https from 'https'
import ExcelJS from 'exceljs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, getDb, currentSession, closeDatabase } from './database'
import { initSqlite } from './sqlite-compat'
import { registerTeacherHandlers } from './teachers'
import { registerTeacherAttendanceHandlers } from './teacherAttendance'
import { registerFeeHandlers } from './fees'
import { registerExamHandlers } from './exams'
import { registerSettingsHandlers } from './settings'
import { registerTimetableHandlers } from './timetable'
import { registerPaperHandlers } from './papers'
import { registerCertificateHandlers } from './certificates'
import { createWorker } from 'tesseract.js'
import engData from '@tesseract.js-data/eng'


// old graphics drivers (and old Windows) can show a white window, so draw with the CPU instead
app.disableHardwareAcceleration()
/* ============================================================
   🔴 SECRET KEY & GIST URL
   ============================================================ */
const SECRET_KEY = 'MySchoolApp_Secret_2025_XYZ_99'
const LICENSE_URL = 'https://raw.githubusercontent.com/jamshid804a-cmyk/school-system/main/licenses.json'
/* ============================================================
   🔴 FIELDS
   ============================================================ */
const FIELDS = [
  'admission_no', 'name', 'father_name', 'father_occupation', 'gender',
  'class_name', 'section', 'session', 'roll_no', 'phone', 'address',
  'blood_group', 'previous_school', 'admission_date', 'monthly_fee', 'photo',
  'father_cnic', 'caste_tribe', 'dob', 'status', 'nationality',
  'current_address', 'permanent_address',
  'withdrawn_from_school', 'reason_for_leaving', 'slc_previous_school',
  'mobile_computer_usage', 'part_time_activity', 'favorite_subject', 'hobby',
  'form_filled_by', 'checked_by', 'office_stamp_sign'
]

const NUMERIC_FIELDS = new Set(['monthly_fee'])

const values = (s) =>
  FIELDS.map((f) => {
    const v = s[f]
    if (NUMERIC_FIELDS.has(f)) return Number(v) || 0
    return v ?? ''
  })

/* ---------- EXPORT HELPERS ---------- */
const COLUMNS = [
  ['Adm. No', 'admission_no'],
  ['Student Name', 'name'],
  ['Father Name', 'father_name'],
  ['Father CNIC', 'father_cnic'],
  ['Father Occupation', 'father_occupation'],
  ['Gender', 'gender'],
  ['D.O.B', 'dob'],
  ['Class', 'class_name'],
  ['Section', 'section'],
  ['Session', 'session'],
  ['Roll No', 'roll_no'],
  ['Phone', 'phone'],
  ['Blood Group', 'blood_group'],
  ['Caste / Tribe', 'caste_tribe'],
  ['Nationality', 'nationality'],
  ['Status', 'status'],
  ['Monthly Fee', 'monthly_fee'],
  ['Current Address', 'current_address'],
  ['Permanent Address', 'permanent_address']
]

const esc = (v) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function buildHtml(title, subtitle, rows, forWord = false) {
  const head = ['<th>#</th>', ...COLUMNS.map(([h]) => `<th>${h}</th>`)].join('')
  const body = rows
    .map(
      (r, i) =>
        `<tr><td>${i + 1}</td>${COLUMNS.map(([, k]) => `<td>${esc(r[k])}</td>`).join('')}</tr>`
    )
    .join('')

  const wordHead = forWord
    ? `<xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml>
       <style>@page Section1{size:841.9pt 595.3pt;mso-page-orientation:landscape;margin:0.5in}
       div.Section1{page:Section1}</style>`
    : ''

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(title)}</title>
${wordHead}
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: Arial, sans-serif; color: #1e293b; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p { font-size: 11px; color: #64748b; margin: 0 0 12px; }
  table { border-collapse: collapse; width: 100%; font-size: 9px; }
  th { background: #1e40af; color: #ffffff; padding: 6px; text-align: left; border: 1px solid #1e3a8a; }
  td { padding: 5px 6px; border: 1px solid #cbd5e1; }
  tr:nth-child(even) td { background: #f1f5f9; }
</style></head>
<body>${forWord ? '<div class="Section1">' : ''}
<h1>${esc(title)}</h1>
<p>${esc(subtitle)}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
${forWord ? '</div>' : ''}
</body></html>`
}

function buildPageHtml(title, subtitle, rows) {
  const colors = [
    '#dbeafe|#1d4ed8', '#f3e8ff|#7e22ce', '#d1fae5|#047857',
    '#fef3c7|#b45309', '#ffe4e6|#be123c', '#cffafe|#0e7490'
  ]
  const CL = ['Nursery', 'Prep', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']

  const body = rows.map((r, i) => {
    const idx = Math.max(0, CL.indexOf(r.class_name))
    const [bg, fg] = colors[idx % colors.length].split('|')
    const avatar = r.photo
      ? `<img src="${r.photo}" class="av">`
      : `<div class="av ph">${esc((r.name || '?').charAt(0).toUpperCase())}</div>`
    const status = r.status || 'Active'
    const statusCls = status === 'Active' ? 'st-active' : 'st-other'
    return `<tr>
      <td class="c-no">${i + 1}</td>
      <td><div class="who">${avatar}<div><div class="nm">${esc(r.name)}</div><div class="fn">${esc(r.father_name)}</div></div></div></td>
      <td class="mut">${esc(r.admission_no)}</td>
      <td class="mut mono">${esc(r.father_cnic || '-')}</td>
      <td><span class="badge" style="background:${bg};color:${fg}">${esc(r.class_name)}${r.section ? ' - ' + esc(r.section) : ''}</span></td>
      <td><span class="badge" style="background:#f1f5f9;color:#475569">${esc(r.session || '-')}</span></td>
      <td>${esc(r.roll_no)}</td>
      <td>${esc(r.dob || '-')}</td>
      <td>${esc(r.phone)}</td>
      <td class="fee">${Number(r.monthly_fee) || 0}</td>
      <td><span class="badge ${statusCls}">${esc(status)}</span></td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
  body { font-family: Segoe UI, Arial, sans-serif; color: #334155; margin: 0; padding: 14px; }
  h1 { font-size: 20px; margin: 0; color: #1e293b; }
  .sub { font-size: 11px; color: #64748b; margin: 3px 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead th { background: #f8fafc; color: #64748b; text-transform: uppercase; font-size: 9px; letter-spacing: .05em; text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  tr { page-break-inside: avoid; }
  .who { display: flex; align-items: center; gap: 9px; }
  .av { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .ph { background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
  .nm { font-weight: 700; color: #1e293b; font-size: 12px; }
  .fn { font-size: 10px; color: #64748b; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 600; }
  .st-active { background: #d1fae5; color: #047857; }
  .st-other { background: #e2e8f0; color: #475569; }
  .mut { color: #64748b; }
  .mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 9.5px; }
  .fee { font-weight: 700; }
  .c-no { color: #94a3b8; width: 24px; }
</style></head><body>
<h1>${esc(title)}</h1>
<div class="sub">${esc(subtitle)}</div>
<table><thead><tr>
  <th>#</th><th>Student</th><th>Adm. No</th><th>Father CNIC</th><th>Class</th>
  <th>Session</th><th>Roll</th><th>D.O.B</th><th>Phone</th><th>Fee</th><th>Status</th>
</tr></thead>
<tbody>${body}</tbody></table>
</body></html>`
}

/* ============================================================
   🔴 SMART PDF PARSER (accepts almost any PDF layout)
   ============================================================ */
const CNIC_RE = /\b\d{5}-?\d{7}-?\d\b/
const ADM_RE = /\bADM-[A-Za-z0-9-]+/i
const CLASS_RE = /\b(Class\s*\d{1,2}|Nursery|Prep|KG|Play\s*Group)\b/i
const SESSION_RE = /\b(\d{4}\s*[-–—/]\s*\d{4})\b/
const DOB_RE = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/.-]\d{1,2}[/.-]\d{4})\b/
const PHONE_RE = /\b(0\d{3}-?\d{7})\b/
const STATUS_RE = /\b(Active|Inactive|Withdrawn|Left|Passed Out|Struck Off)\b/i

const cleanName = (s) => (s || '').replace(/[^a-zA-Z0-9\s.'-]/g, ' ').replace(/\s+/g, ' ').trim()

const normClass = (c) => {
  if (!c) return ''
  const t = c.replace(/\s+/g, ' ').trim()
  const m = t.match(/^class\s*(\d+)$/i)
  if (m) return 'Class ' + m[1]
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function splitNames(words) {
  const n = words.length
  if (n === 0) return ['', '']
  if (n === 1) return [words[0], '']
  const half = Math.ceil(n / 2)
  return [words.slice(0, half).join(' '), words.slice(half).join(' ')]
}

// Extract every field it can from a piece of text
function extractFields(seg) {
  const o = {}
  o.admission_no = seg.match(ADM_RE)?.[0] || ''
  const cnic = seg.match(CNIC_RE)?.[0] || ''
  if (cnic) {
    const d = cnic.replace(/-/g, '')
    o.father_cnic = `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`
  }
  const cls = seg.match(CLASS_RE)
  if (cls) {
    o.class_name = normClass(cls[1])
    const after = seg.slice(cls.index + cls[0].length)
    const sec = after.match(/^\s*-?\s*([A-Za-z])\b/)
    if (sec) o.section = sec[1].toUpperCase()
  }
  const ses = seg.match(SESSION_RE)
  if (ses) {
    o.session = ses[1].replace(/\s+/g, '').replace(/[–—/]/g, '-')
    const after = seg.slice(ses.index + ses[0].length)
    const roll = after.match(/^\s*(\d{1,4})\b(?![-/.]\d)/)
    if (roll) o.roll_no = roll[1]
  }
  const dob = seg.match(DOB_RE)
  if (dob) o.dob = dob[1]
  const ph = seg.match(PHONE_RE)
  if (ph) {
    o.phone = ph[1]
    const fee = seg.slice(ph.index + ph[0].length).match(/^\s*(\d{2,6})\b/)
    if (fee) o.monthly_fee = Number(fee[1])
  }
  const st = seg.match(STATUS_RE)
  if (st) o.status = st[1].charAt(0).toUpperCase() + st[1].slice(1).toLowerCase()
  return o
}

// Strategy 2: table rows numbered 1,2,3... (like this app's own exported PDF)
function parseNumberedRows(flat) {
  const hdr = flat.search(/\bStatus\b/i)
  let pos = hdr >= 0 ? hdr + 6 : 0
  const starts = []
  for (let k = 1; k < 5000; k++) {
    const re = new RegExp(`(?:^|\\s)${k}\\s+(?=[A-Za-z])`, 'g')
    re.lastIndex = pos
    const m = re.exec(flat)
    if (!m) break
    starts.push({ s: m.index, b: m.index + m[0].length })
    pos = m.index + m[0].length
  }
  const out = []
  starts.forEach((st, i) => {
    const seg = flat.slice(st.b, i + 1 < starts.length ? starts[i + 1].s : flat.length)
    const idx = [seg.search(ADM_RE), seg.search(CNIC_RE), seg.search(CLASS_RE), seg.search(SESSION_RE)]
      .filter((x) => x >= 0)
    if (!idx.length) return
    const namePart = seg.slice(0, Math.min(...idx))
    const [name, father] = splitNames(cleanName(namePart).split(' ').filter(Boolean))
    if (!name) return
    out.push({ name, father_name: father, ...extractFields(seg) })
  })
  return out
}

// Strategy 3: every line (or tab-separated row) that has a CNIC / Adm No / Class
function parseAnchoredLines(rawText) {
  const out = []
  for (const line0 of rawText.split(/\r?\n/)) {
    const line = line0.replace(/\t+/g, '  ').replace(/\s{3,}/g, '  ').trim()
    if (!line) continue
    const idx = [line.search(ADM_RE), line.search(CNIC_RE), line.search(CLASS_RE), line.search(SESSION_RE)]
      .filter((x) => x >= 0)
    if (!idx.length) continue
    const namePart = line.slice(0, Math.min(...idx)).replace(/^\s*\d+\s+/, '')
    const words = cleanName(namePart).split(' ').filter(Boolean)
    if (!words.length) continue
    const [name, father] = splitNames(words)
    out.push({ name, father_name: father, ...extractFields(line) })
  }
  return out
}

// Strategy 4 (last resort): treat name-looking lines as students
function parseNameLines(rawText) {
  const skip = /^(student|name|class|father|session|roll|phone|fee|status|page|list|school|report|total|date|sr|s\.no|no)\b/i
  const out = []
  for (const line0 of rawText.split(/\r?\n/)) {
    const line = cleanName(line0.replace(/^\s*\d+[.)]?\s+/, ''))
    if (!line || skip.test(line)) continue
    const words = line.split(' ').filter(Boolean)
    if (words.length < 2 || words.length > 5) continue
    if (!/^[A-Za-z][A-Za-z .'-]+$/.test(line)) continue
    const [name, father] = splitNames(words)
    out.push({ name, father_name: father })
  }
  return out
}

// Strategy 0: exact table layout
const CNIC_X = '[\\dXx]{5}-?[\\dXx]{7}-?[\\dXx]'
const TABLE_ROW_RE = new RegExp(
  '^(.+?)\\s+(\\d{1,4})\\s+(ADM-[A-Za-z0-9-]+)\\s+(' + CNIC_X + ')\\s+(?:(.*?)\\s+)?' +
    '(Class\\s*\\d{1,2}|Nursery|Prep|KG|Play\\s*Group)\\s+([A-Za-z])\\s+(\\d{4}\\s*[-–—/]\\s*\\d{4})\\s*(.*)$',
  'i'
)

function splitStudentFather(text) {
  const words = text.split(' ').filter(Boolean)
  const nums = words.map((w, i) => (/^\d+$/.test(w) ? i : -1)).filter((i) => i >= 0)
  if (nums.length === 2 && nums[1] === words.length - 1 && nums[0] > 0 && nums[0] < words.length - 2) {
    return [words.slice(0, nums[0] + 1).join(' '), words.slice(nums[0] + 1).join(' ')]
  }
  return splitNames(words)
}

function tableChunksFromLines(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((l) => l && !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(l))
  const chunks = []
  for (const line of lines) {
    const m = line.match(/^(\d{1,4})\s+(.*)$/)
    if (m && Number(m[1]) === chunks.length + 1) chunks.push(m[2])
    else if (chunks.length) chunks[chunks.length - 1] += ' ' + line
  }
  return chunks
}

function tableChunksFromFlat(flat) {
  const starts = []
  let pos = 0
  for (let k = 1; k < 5000; k++) {
    const re = new RegExp('(?:^|\\s)' + k + '\\s+(?=(?:(?!ADM-)\\S+\\s+){1,6}\\d{1,4}\\s+ADM-)', 'g')
    re.lastIndex = pos
    const m = re.exec(flat)
    if (!m) break
    starts.push({ s: m.index, b: m.index + m[0].length })
    pos = m.index + m[0].length
  }
  return starts.map((st, i) => flat.slice(st.b, i + 1 < starts.length ? starts[i + 1].s : flat.length).trim())
}

function tableRowToStudent(chunk) {
  const m = chunk.match(TABLE_ROW_RE)
  if (!m) return null
  const [name, father] = splitStudentFather(m[1].trim())
  const d = m[4].replace(/-/g, '').toUpperCase()
  const addr = (m[5] || '').trim()
  return {
    name,
    father_name: father,
    roll_no: m[2],
    admission_no: m[3].toUpperCase(),
    father_cnic: `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`,
    permanent_address: addr,
    address: addr,
    class_name: normClass(m[6]),
    section: m[7].toUpperCase(),
    session: m[8].replace(/\s+/g, '').replace(/[–—/]/g, '-'),
    father_occupation: (m[9] || '').trim()
  }
}

function parseTableRows(rawText, flat) {
  const byLines = tableChunksFromLines(rawText).map(tableRowToStudent).filter(Boolean)
  const byFlat = tableChunksFromFlat(flat).map(tableRowToStudent).filter(Boolean)
  return byFlat.length > byLines.length ? byFlat : byLines
}

/* ============================================================
   🔴 FLEXIBLE LABEL PARSER
   ============================================================ */
const LABEL_DEFS = [
  ['father_cnic', String.raw`(?:father'?s?\s*)?(?:cnic|c\.?n\.?i\.?c\.?|nic)(?:\s*(?:no\.?|number|#))?`],
  ['father_occupation', String.raw`father'?s?\s*(?:occupation|profession|job)|occupation`],
  ['father_name', String.raw`father'?s?\s*name|name\s*of\s*(?:the\s*)?father|s\s*/\s*o|son\s*of|d\s*/\s*o|daughter\s*of|guardian'?s?\s*name`],
  ['_skip', String.raw`mother'?s?\s*name|teacher'?s?\s*name|school'?s?\s*name|institute\s*name`],
  ['previous_school', String.raw`(?:previous|last)\s*school(?:\s*name)?`],
  ['admission_date', String.raw`date\s*of\s*admission|admission\s*date`],
  ['admission_no', String.raw`(?:admission|adm\.?|registration|reg\.?|g\.?\s*r\.?)\s*(?:no\.?|number|#|num)`],
  ['permanent_address', String.raw`permanent\s*add?ress?`],
  ['current_address', String.raw`(?:current|present|residential)\s*add?ress?`],
  ['address', String.raw`(?:home\s*)?add?ress?`],
  ['name', String.raw`(?:student|pupil|child)\s*(?:no\.?|#)?\s*\d{1,4}(?=\s*[:\-.)])|(?:(?:student|child|pupil|full)'?s?\s*)?name(?:\s*of\s*(?:the\s*)?(?:student|child|pupil))?`],
  ['roll_no', String.raw`roll\s*(?:no\.?|number|#|num)?`],
  ['class_section', String.raw`(?:class|grade)\s*(?:/|&|,|and)\s*(?:section|sec)`],
  ['class_name', String.raw`class(?:\s*name)?|grade(?=\s*[:=])`],
  ['section', String.raw`section`],
  ['session', String.raw`session|academic\s*year`],
  ['phone', String.raw`(?:phone|mobile|contact|cell|whats\s*app)(?:\s*(?:no\.?|number|#))?`],
  ['dob', String.raw`date\s*of\s*b[a-z]{3,5}|birth\s*date|d\.?o\.?b\.?`],
  ['gender', String.raw`gender|sex`],
  ['blood_group', String.raw`blood\s*group`],
  ['nationality', String.raw`nationality`],
  ['caste_tribe', String.raw`(?:caste|tribe)(?:\s*/\s*(?:caste|tribe))?`],
  ['monthly_fee', String.raw`(?:monthly\s*)?fee`],
  ['status', String.raw`status`]
]

const LABEL_RE = new RegExp(
  '(?<![A-Za-z])(?:' +
    LABEL_DEFS.map(([, p], i) => `(?<l${i}>${p})`).join('|') +
    ')(?![A-Za-z])(?:\\s*[:：=|\\-–]+)?',
  'gi'
)

const titleIfPlain = (v) =>
  v === v.toLowerCase() || v === v.toUpperCase()
    ? v.toLowerCase().replace(/(^|[\s.'-])([a-z])/g, (_, a, b) => a + b.toUpperCase())
    : v

function applyField(rec, key, raw) {
  const v = String(raw ?? '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s:：\-–=|,.]+|[\s,;|]+$/g, '')
    .trim()
  if (!v || key === '_skip') return false
  switch (key) {
    case 'name':
    case 'father_name':
      rec[key] = titleIfPlain(v)
      break
    case 'father_cnic': {
      const d = v.replace(/[^\dXx]/g, '').toUpperCase()
      rec.father_cnic = d.length === 13 ? `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}` : v
      break
    }
    case 'class_name': {
      const t = v.replace(/\b(?:grade|class)\b/gi, ' ').replace(/\s+/g, ' ').trim()
      let m = t.match(/^(\d{1,2})(?:st|nd|rd|th)?(?:\s*[-–/]?\s*([A-Za-z]))?$/i)
      if (m) {
        rec.class_name = 'Class ' + m[1]
        if (m[2] && !rec.section) rec.section = m[2].toUpperCase()
      } else if ((m = t.match(/^(nursery|prep|kg|play\s*group)(?:\s*[-–/]?\s*([A-Za-z]))?$/i))) {
        rec.class_name = normClass(m[1])
        if (m[2] && !rec.section) rec.section = m[2].toUpperCase()
      } else rec.class_name = normClass(v)
      break
    }
    case 'class_section': {
      const parts = v.split(/\s*(?:[\/&,–-]|\band\b)\s*/i).filter(Boolean)
      if (parts[0]) applyField(rec, 'class_name', parts[0])
      if (parts[1]) applyField(rec, 'section', parts[1])
      break
    }
    case 'section':
      rec.section = v.length <= 2 ? v.toUpperCase() : v
      break
    case 'dob':
    case 'admission_date': {
      let x = v
      if (/^\d{5}(?:\.0+)?$/.test(x) && Number(x) > 20000 && Number(x) < 80000) {
        x = new Date(Math.round((Number(x) - 25569) * 86400000)).toISOString().slice(0, 10)
      }
      rec[key] = x
      break
    }
    case 'session':
      rec.session = v.replace(/[^\d\-–—/]/g, '').replace(/[–—/]/g, '-').replace(/^(\d{2})(\d{2})-(\d{2})$/, '$1$2-$1$3')
      break
    case 'monthly_fee':
      rec.monthly_fee = Number(v.replace(/[^\d.]/g, '')) || 0
      break
    case 'gender':
      rec.gender = /^m/i.test(v) ? 'Male' : /^f/i.test(v) ? 'Female' : v
      break
    case 'admission_no':
      rec.admission_no = /^adm-/i.test(v) ? v.toUpperCase() : v
      break
    case 'address':
      rec.address = v
      if (!rec.permanent_address) rec.permanent_address = v
      break
    case 'permanent_address':
      rec.permanent_address = v
      if (!rec.address) rec.address = v
      break
    default:
      rec[key] = v
  }
  return true
}

function parseFlexLabels(rawText) {
  const text = rawText
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
  const marks = []
  let m
  LABEL_RE.lastIndex = 0
  while ((m = LABEL_RE.exec(text))) {
    const gi = LABEL_DEFS.findIndex((_, i) => m.groups['l' + i] !== undefined)
    marks.push({ key: LABEL_DEFS[gi][0], end: m.index + m[0].length, start: m.index })
    if (m[0].length === 0) LABEL_RE.lastIndex++
  }
  if (!marks.length) return []

  const out = []
  let cur = {}
  let seen = new Set()
  const push = () => {
    if (cur.name) out.push(cur)
    cur = {}
    seen = new Set()
  }
  marks.forEach((mk, i) => {
    const val = text.slice(mk.end, i + 1 < marks.length ? marks[i + 1].start : text.length)
    if (mk.key === '_skip') return
    if (!val.replace(/[\s:：\-–=|,.]/g, '')) return
    if (seen.has(mk.key)) push()
    if (applyField(cur, mk.key, val)) seen.add(mk.key)
  })
  push()
  return out
}

function parseCards(rawText) {
  const text = rawText
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
  const heads = [
    ...text.matchAll(/STUDENT\s+(?:RECORD|CARD|PROFILE|FORM|INFO(?:RMATION)?)\s*(?:NO\.?|#)?\s*\d+/gi),
    ...text.matchAll(/STUDENT\s*(?:NO\.?|#)?\s*\d{1,4}\b/g)
  ].sort((x, y) => x.index - y.index)
  if (!heads.length) return []

  const out = []
  heads.forEach((h, i) => {
    let body = text.slice(h.index + h[0].length, i + 1 < heads.length ? heads[i + 1].index : text.length)
    body = body
      .replace(/(?:sample\s*\/\s*demo|sample|demo)\s+(?:information|data|record)[^]*$/i, ' ')
      .replace(/\b(?:admission|personal|student|family|contact|parent)\s+(?:information|details|info|data)\b/gi, ' ')

    const marks = []
    let m
    LABEL_RE.lastIndex = 0
    while ((m = LABEL_RE.exec(body))) {
      const gi = LABEL_DEFS.findIndex((_, k) => m.groups['l' + k] !== undefined)
      marks.push({ key: LABEL_DEFS[gi][0], start: m.index, end: m.index + m[0].length })
      if (m[0].length === 0) LABEL_RE.lastIndex++
    }

    const rec = {}
    const seen = new Set()
    marks.forEach((mk, k) => {
      if (mk.key === '_skip' || seen.has(mk.key)) return
      const val = body.slice(mk.end, k + 1 < marks.length ? marks[k + 1].start : body.length)
      if (applyField(rec, mk.key, val)) seen.add(mk.key)
    })

    if (!rec.name) {
      const before = body.slice(0, marks.length ? marks[0].start : body.length).trim()
      if (before) applyField(rec, 'name', before)
    }
    if (rec.name) out.push(rec)
  })
  return out
}

const APP_DATA_RE = new RegExp(
  String.raw`^(.*?)\s*\b(Class\s*\d{1,2}|Nursery|Prep|KG|Play\s*Group)\b(?:\s+-\s+(\S+))?\s+(\d{4}-\d{4}|-)\s+(.*?)\s+(\d+)\s+(Active|Inactive|Withdrawn|Left|Passed Out|Struck Off|[A-Za-z]+)$`,
  'i'
)

function parseAppExport(rawText) {
  if (!/ADM\.?\s*NO/i.test(rawText) || !/FATHER\s+CNIC/i.test(rawText) || !/\bFEE\b/i.test(rawText)) return []
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((l) => l && !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(l))

  const out = []
  let expect = 1
  let names = null

  const finish = (m) => {
    const left = m[1].trim().split(' ').filter(Boolean)
    let cnic = ''
    let adm = ''
    if (left.length && (left[left.length - 1] === '-' || /^[\dXx]{5}-?[\dXx]{7}-?[\dXx]$/.test(left[left.length - 1]))) {
      const t = left.pop()
      cnic = t === '-' ? '' : t
    }
    if (left.length && /\d/.test(left[left.length - 1])) adm = left.pop()
    const extra = left.join(' ')

    let name = names[0] || ''
    let father = names.slice(1).join(' ')
    if (extra) {
      if (!name) [name, father] = splitNames(extra.split(' '))
      else father = (father + ' ' + extra).trim()
    }

    const mid = m[5].trim().split(' ').filter(Boolean)
    let k = mid.findIndex((t) => t === '-' || /^\d{4}-\d{2}-\d{2}$/.test(t))
    if (k < 0) k = 0
    if (name) {
      out.push({
        name,
        father_name: father,
        admission_no: adm,
        father_cnic: cnic,
        class_name: normClass(m[2]),
        section: m[3] || '',
        session: m[4] === '-' ? '' : m[4],
        roll_no: k > 0 ? mid[0] : '',
        dob: mid[k] && mid[k] !== '-' ? mid[k] : '',
        phone: mid[k + 1] || '',
        monthly_fee: Number(m[6]) || 0,
        status: m[7].charAt(0).toUpperCase() + m[7].slice(1).toLowerCase()
      })
    }
    names = null
    expect++
  }

  for (const line of lines) {
    if (names) {
      const m = line.match(APP_DATA_RE)
      if (m) finish(m)
      else names.push(line)
      continue
    }
    const st = line.match(/^(\d{1,4})(?:\s+(.*))?$/)
    if (st && Number(st[1]) === expect) {
      names = []
      const rest = (st[2] || '').trim()
      if (rest) {
        const m = rest.match(APP_DATA_RE)
        if (m) finish(m)
        else names.push(rest)
      }
    }
  }
  return out
}

const HDR_WORD = String.raw`[A-Za-z][A-Za-z.'’-]*`
const HDR_DATE = String.raw`\d{4}-\d{2}-\d{2}|\d{1,2}[/.-]\d{1,2}[/.-]\d{4}`
const HDR_FRAG = {
  roll_no: String.raw`(\d{1,5})`,
  session: String.raw`(\d{4}\s*[-–—/]\s*\d{2,4})`,
  class_name: String.raw`((?:class\s*)?\d{1,2}(?:st|nd|rd|th)?|nursery|prep|kg)`,
  section: String.raw`([A-Za-z])\b`,
  class_section: String.raw`(\d{1,2}(?:st|nd|rd|th)?\s*[-–/]?\s*[A-Za-z]?)`,
  admission_no: String.raw`(\S+)`,
  phone: String.raw`(\+?\d[\d-]{6,14})`,
  dob: `(${HDR_DATE})`,
  admission_date: `(${HDR_DATE})`,
  father_cnic: String.raw`([\dXx]{5}-?[\dXx]{7}-?[\dXx])`,
  gender: String.raw`(male|female|m|f)\b`,
  monthly_fee: String.raw`(\d{1,6})`,
  status: String.raw`(active|inactive|withdrawn|left)`,
  blood_group: String.raw`((?:AB|A|B|O)[+-])`
}

function parseHeaderTable(flat) {
  const marks = []
  let m
  LABEL_RE.lastIndex = 0
  while ((m = LABEL_RE.exec(flat))) {
    const gi = LABEL_DEFS.findIndex((_, i) => m.groups['l' + i] !== undefined)
    marks.push({ key: LABEL_DEFS[gi][0], start: m.index, end: m.index + m[0].length })
    if (m[0].length === 0) LABEL_RE.lastIndex++
  }
  let run = []
  for (let i = 0; i < marks.length; i++) {
    const cur = [marks[i]]
    while (i + 1 < marks.length && /^[\s#.]*$/.test(flat.slice(marks[i].end, marks[i + 1].start))) {
      cur.push(marks[i + 1])
      i++
    }
    if (cur.length >= 3) {
      run = cur
      break
    }
  }
  if (run.length < 3) return []
  const keys = run.map((r) => r.key)
  if (!keys.includes('name') || keys.includes('_skip')) return []

  const parts = []
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]
    if (k === 'name' && keys[i + 1] === 'father_name') {
      parts.push({ k: 'names', re: `(${HDR_WORD}(?:\\s+${HDR_WORD}){1,5}?)` })
      i++
    } else if (k === 'name' || k === 'father_name') {
      parts.push({ k, re: `(${HDR_WORD}(?:\\s+${HDR_WORD}){0,4}?)` })
    } else if (HDR_FRAG[k]) {
      parts.push({ k, re: HDR_FRAG[k] })
    } else return []
  }
  let src = ''
  parts.forEach((p, i) => {
    const prev = parts[i - 1]
    src += i === 0 ? '' : prev.k === 'class_name' && p.k === 'section' ? String.raw`(?:\s*[-–/]\s*|\s+)` : String.raw`\s+`
    src += p.re
  })
  const rowRe = new RegExp(src, 'gi')

  const body = flat.slice(run[run.length - 1].end)
  const out = []
  while ((m = rowRe.exec(body))) {
    const rec = {}
    parts.forEach((p, i) => {
      const val = m[i + 1]
      if (p.k === 'names') {
        const [n, f] = splitNames(val.trim().split(/\s+/))
        applyField(rec, 'name', n)
        applyField(rec, 'father_name', f)
      } else applyField(rec, p.k, val)
    })
    if (rec.name) out.push(rec)
    if (m[0].length === 0) rowRe.lastIndex++
  }
  return out
}

function parseStudentsFromText(rawText, loose = true) {
  const clean = rawText.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, ' ')
  const flat = clean.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim()
  const run = (name, fn) => {
    try {
      const r = fn()
      if (r && r.length) {
        r.strategy = name
        return r
      }
    } catch {}
    return null
  }

  const specific = [
    ['app export', () => parseAppExport(clean)],
    ['student cards', () => parseCards(clean)],
    ['table rows', () => parseTableRows(clean, flat)],
    ['header table', () => parseHeaderTable(flat)]
  ]
  for (const [name, fn] of specific) {
    const r = run(name, fn)
    if (r) return r
  }

  const generic = [
    ['labels', () => parseFlexLabels(clean)],
    ['numbered rows', () => parseNumberedRows(flat)],
    ['lines', () => parseAnchoredLines(clean)]
  ]
  const labelWord = new RegExp('^(?:' + LABEL_DEFS.map(([, p]) => p).join('|') + ')(?![A-Za-z])', 'i')
  const plausible = (rec) =>
    /[A-Za-z]{2}/.test(rec.name || '') &&
    !labelWord.test(rec.name) &&
    !/^(?:admission|roll|contact|class|section|session|father|date|phone|student|cnic|address)\b/i.test(rec.name) &&
    (rec.name || '').length <= 60
  let best = null
  for (const [name, fn] of generic) {
    const r0 = run(name, fn)
    const r = r0 ? r0.filter(plausible) : []
    r.strategy = name
    if (r.length && (!best || r.length > best.length)) best = r
  }
  if (best) return best

  if (loose) return run('name lines', () => parseNameLines(clean)) || []
  return []
}

const HEADER_ALIASES = {
  name: ['name', 'studentname', 'fullname', 'pupilname', 'childname'],
  father_name: ['fathername', 'fathersname', 'guardianname', 'guardian', 'father', 'so', 'sonof'],
  father_occupation: ['fatheroccupation', 'occupation', 'profession', 'fatherjob'],
  father_cnic: ['fathercnic', 'cnic', 'cnicno', 'nic', 'bform', 'cnicnumber'],
  roll_no: ['rollno', 'rollnumber', 'roll', 'rollnum'],
  admission_no: ['admissionno', 'admno', 'admissionnumber', 'regno', 'registrationno', 'grno', 'admission'],
  admission_date: ['admissiondate', 'dateofadmission', 'doa'],
  class_name: ['class', 'classname', 'grade'],
  section: ['section', 'sec'],
  session: ['session', 'academicyear', 'year'],
  phone: ['phone', 'phoneno', 'mobile', 'mobileno', 'contact', 'contactno', 'contactnumber', 'cell', 'whatsapp'],
  dob: ['dob', 'dateofbirth', 'birthdate', 'birth', 'dateofbarth', 'bday', 'birthday'],
  gender: ['gender', 'sex'],
  blood_group: ['bloodgroup', 'blood'],
  nationality: ['nationality'],
  caste_tribe: ['caste', 'tribe', 'castetribe'],
  monthly_fee: ['fee', 'fees', 'monthlyfee'],
  status: ['status'],
  address: ['address', 'homeaddress', 'residence'],
  permanent_address: ['permanentaddress', 'permaddress'],
  current_address: ['currentaddress', 'presentaddress', 'residentialaddress'],
  previous_school: ['previousschool', 'lastschool', 'previousschoolname']
}

function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}

function matchHeader(raw, anchored) {
  const h = String(raw || '').replace(/[:]+$/, '').replace(/\s+/g, ' ').trim()
  if (!h) return null
  const hit = anchored.find(([, re]) => re.test(h))
  if (hit) return hit[0]
  const n = h.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!n) return null
  for (const [key, list] of Object.entries(HEADER_ALIASES)) if (list.includes(n)) return key
  const field = FIELDS.find((f) => f.replace(/_/g, '') === n)
  if (field) return field
  let best = null
  let bestD = 99
  for (const [key, list] of Object.entries(HEADER_ALIASES)) {
    for (const a of list) {
      if (a.length < 5) continue
      const dist = editDistance(n, a)
      const limit = a.length < 8 ? 1 : 2
      if (dist <= limit && dist < bestD) {
        best = key
        bestD = dist
      }
    }
  }
  return best
}

async function readSpreadsheet(fp, ext) {
  const wb = new ExcelJS.Workbook()
  if (ext === '.csv') await wb.csv.readFile(fp)
  else await wb.xlsx.readFile(fp)
  const ws = wb.worksheets[0]
  if (!ws) return []

  const anchored = LABEL_DEFS.filter(([k]) => k !== '_skip').map(([k, p]) => [
    k,
    new RegExp('^(?:' + p + ')$', 'i')
  ])
  const text = (c) => {
    if (!c) return ''
    const v = c.value
    if (v instanceof Date) return v.toISOString().slice(0, 10)
    if (v && typeof v === 'object' && v.result instanceof Date) return v.result.toISOString().slice(0, 10)
    return c.text != null ? String(c.text).trim() : ''
  }

  let headerRow = 0
  let colMap = {}
  for (let r = 1; r <= Math.min(ws.rowCount, 15) && !headerRow; r++) {
    const cols = {}
    ws.getRow(r).eachCell({ includeEmpty: false }, (cell, col) => {
      const key = matchHeader(text(cell), anchored)
      if (key && !Object.values(cols).includes(key)) cols[col] = key
    })
    if (Object.values(cols).includes('name') && Object.keys(cols).length >= 2) {
      headerRow = r
      colMap = cols
    }
  }
  if (!headerRow) return []

  const out = []
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const rec = {}
    for (const [col, key] of Object.entries(colMap)) applyField(rec, key, text(row.getCell(Number(col))))
    if (rec.name) out.push(rec)
  }
  return out
}

let ocrWorkerPromise = null

function ocrLangPath() {
  const p = engData.langPath
  const unpacked = p.replace('app.asar', 'app.asar.unpacked')
  return fs.existsSync(unpacked) ? unpacked : p
}

function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = createWorker('eng', 1, {
      langPath: ocrLangPath(),
      gzip: true,
      cacheMethod: 'none'
    })
  }
  return ocrWorkerPromise
}

async function closeOcrWorker() {
  if (!ocrWorkerPromise) return
  try {
    const w = await ocrWorkerPromise
    await w.terminate()
  } catch {}
  ocrWorkerPromise = null
}

async function ocrBuffer(buf) {
  const worker = await getOcrWorker()
  const { data } = await worker.recognize(buf)
  return (data.text || '').replace(/[|¦]/g, ' ')
}

const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.bmp', '.webp']
const hasRealText = (t) => t.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '').replace(/[^A-Za-z0-9]/g, '').length >= 15

async function readPdf(fp) {
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: fs.readFileSync(fp) })
  try {
    const text = (await parser.getText()).text || ''

    if (hasRealText(text)) {
      const found = parseStudentsFromText(text, false)
      if (found.length) return { students: found, ocr: false, text }
    }

    const shots = await parser.getScreenshot({ scale: 3, imageBuffer: true, imageDataUrl: false })
    let ocrText = ''
    for (const page of shots.pages.slice(0, 60)) {
      ocrText += (await ocrBuffer(Buffer.from(page.data))) + '\n'
    }
    const fromOcr = parseStudentsFromText(ocrText, true)
    if (fromOcr.length) return { students: fromOcr, ocr: true, text: ocrText }

    const loose = hasRealText(text) ? parseStudentsFromText(text, true) : []
    return {
      students: loose,
      ocr: false,
      text: (text + '\n' + ocrText).trim(),
      reason: 'No student records found in this PDF (text or scanned).'
    }
  } finally {
    await parser.destroy()
  }
}

async function readStudentsFromFile(fp) {
  const ext = extname(fp).toLowerCase()

  if (ext === '.xlsx' || ext === '.csv') {
    const students = await readSpreadsheet(fp, ext)
    return {
      students,
      ocr: false,
      reason: 'No student table found. Row 1 needs headings like Name, Father Name, Class.'
    }
  }
  if (IMAGE_EXT.includes(ext)) {
    const text = await ocrBuffer(fs.readFileSync(fp))
    return {
      students: parseStudentsFromText(text, true),
      ocr: true,
      text,
      reason: 'Could not read student data from this image. Use a clear, straight, well-lit photo.'
    }
  }
  if (ext === '.pdf') return readPdf(fp)
  return { students: [], ocr: false, reason: 'Unsupported file type.' }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 780,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 8000 }, (res) => {
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error('HTTP ' + res.statusCode))
      }
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (c) => (body += c))
      res.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
  })
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  const registeredChannels = new Set()
  const originalHandle = ipcMain.handle.bind(ipcMain)
  ipcMain.handle = (channel, listener) => {
    if (registeredChannels.has(channel)) {
      console.warn(`[ipc] "${channel}" was registered twice - the last one is used`)
      ipcMain.removeHandler(channel)
    }
    registeredChannels.add(channel)
    return originalHandle(channel, listener)
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await initSqlite()
  initDatabase()

  try {
    const db = getDb()
    const hasTable = (t) =>
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(t)
    const addColumn = (table, column, type) => {
      if (!hasTable(table)) return
      const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
      if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
    }
    for (const [col, type] of [
      ['leaving_date', 'TEXT'],
      ['leaving_reason', 'TEXT'],
      ['leaving_academic', 'TEXT'],
      ['leaving_character', 'TEXT'],
      ['leaving_dues', 'TEXT'],
      ['theme', 'TEXT'],
      ['relation', 'TEXT'],
      ['show_qr', 'INTEGER'],
      ['show_seal', 'INTEGER']
    ]) {
      addColumn('certificates', col, type)
    }
  } catch (e) {
    console.error('Database upgrade failed:', e)
  }

  const teacherApi = registerTeacherHandlers()
  const teacherAttApi = registerTeacherAttendanceHandlers()
  const feeApi = registerFeeHandlers()
  const examApi = registerExamHandlers()
  const settingsApi = registerSettingsHandlers()
  const timetableApi = registerTimetableHandlers()
  const paperApi = registerPaperHandlers()
  const certificateApi = registerCertificateHandlers()

  const link = (api, channel, method) => {
    if (registeredChannels.has(channel)) return
    if (api && typeof api[method] === 'function') ipcMain.handle(channel, (_, ...args) => api[method](...args))
  }
  for (const [api, list] of [
    [teacherApi, { 'teachers:list': 'list', 'teachers:add': 'add', 'teachers:update': 'update', 'teachers:delete': 'delete' }],
    [teacherAttApi, { 'teacher-attendance:list': 'list', 'teacher-attendance:set': 'set', 'teacher-attendance:setMany': 'setMany' }],
    [feeApi, { 'fees:list': 'list', 'fees:add': 'add', 'fees:delete': 'delete' }],
    [examApi, {
      'exams:ensure': 'ensure', 'exams:load': 'load', 'exams:addSubject': 'addSubject',
      'exams:removeSubject': 'removeSubject', 'exams:updateSubject': 'updateSubject',
      'exams:setMark': 'setMark', 'exams:setMarksBulk': 'setMarksBulk', 'exams:delete': 'delete'
    }],
    [settingsApi, {
      'settings:getAll': 'getAll', 'settings:set': 'set', 'settings:setPassword': 'setPassword',
      'settings:removePassword': 'removePassword', 'settings:getPasswordHash': 'getPasswordHash',
      'settings:setRecovery': 'setRecovery', 'settings:getRecoveryHash': 'getRecoveryHash',
      'settings:clearRecovery': 'clearRecovery'
    }],
    [timetableApi, {
      'classTT:list': 'listClassTT', 'classTT:add': 'addClassTT', 'classTT:update': 'updateClassTT', 'classTT:delete': 'deleteClassTT',
      'examTT:list': 'listExamTT', 'examTT:add': 'addExamTT', 'examTT:update': 'updateExamTT', 'examTT:delete': 'deleteExamTT'
    }],
    [paperApi, {
      'papers:list': 'list', 'papers:get': 'get', 'papers:add': 'add', 'papers:update': 'update',
      'papers:delete': 'delete', 'papers:duplicate': 'duplicate', 'papers:autoGenerate': 'autoGenerate',
      'sections:add': 'addSection', 'sections:update': 'updateSection', 'sections:delete': 'deleteSection',
      'paperQ:add': 'addQuestion', 'paperQ:update': 'updateQuestion', 'paperQ:delete': 'deleteQuestion'
    }],
    [certificateApi, {
      'certificates:list': 'list', 'certificates:get': 'get', 'certificates:add': 'add',
      'certificates:update': 'update', 'certificates:delete': 'delete'
    }]
  ]) {
    for (const [channel, method] of Object.entries(list)) link(api, channel, method)
  }

  registerBackupHandlers()

  ipcMain.handle('students:importPdf', async (event) => {
    const parent = BrowserWindow.fromWebContents(event.sender)

    const { canceled, filePaths } = await dialog.showOpenDialog(parent, {
      title: 'Select student data (PDF, photo, Excel or CSV)',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'All supported', extensions: ['pdf', 'jpg', 'jpeg', 'png', 'bmp', 'webp', 'xlsx', 'csv'] },
        { name: 'PDF Documents', extensions: ['pdf'] },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'webp'] },
        { name: 'Excel / CSV', extensions: ['xlsx', 'csv'] }
      ]
    })
    if (canceled || filePaths.length === 0) return { ok: false, reason: 'Cancelled' }

    try {
      const studentsToImport = []
      const problems = []
      let usedOcr = false
      const readers = []
      let debugText = ''

      for (const fp of filePaths) {
        try {
          const r = await readStudentsFromFile(fp)
          if (r.text) debugText += `===== ${basename(fp)} =====\n${r.text}\n\n`
          if (r.students.length) {
            readers.push(`${basename(fp)}: ${r.students.length} via ${r.students.strategy || (r.ocr ? 'OCR' : 'table')}`)
            studentsToImport.push(...r.students)
            if (r.ocr) usedOcr = true
          } else {
            problems.push(`${basename(fp)}: ${r.reason || 'no student records found.'}`)
          }
        } catch (e) {
          problems.push(`${basename(fp)}: ${e.message}`)
        }
      }

      const debugFile = join(app.getPath('userData'), 'last-import-text.txt')
      try {
        fs.writeFileSync(debugFile, debugText || '(no text)', 'utf8')
      } catch {}

      if (studentsToImport.length === 0) {
        return {
          ok: false,
          reason: (problems.join('\n') || 'Could not find any student records.') + `\n\nText that was read: ${debugFile}`
        }
      }

      const d = getDb()
      const insert = d.prepare(
        `INSERT INTO students (${FIELDS.join(', ')}) VALUES (${FIELDS.map(() => '?').join(', ')})`
      )
      const admExists = d.prepare('SELECT id FROM students WHERE admission_no = ?')
      const findSame = d.prepare(
        'SELECT id FROM students WHERE admission_no = ? AND session = ? AND lower(name) = lower(?)'
      )
      const findSameNoAdm = d.prepare(
        'SELECT id FROM students WHERE session = ? AND lower(name) = lower(?) AND lower(father_name) = lower(?)'
      )
      const makeAdm = () => {
        let adm
        do {
          adm = `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        } while (admExists.get(adm))
        return adm
      }
      const UPDATABLE = FIELDS.filter((f) => !['name', 'admission_no', 'session', 'photo'].includes(f))
      const updateRow = (id, s) => {
        const sets = []
        const vals = []
        for (const f of UPDATABLE) {
          const v = s[f]
          if (v === undefined || v === null || v === '') continue
          sets.push(`${f} = ?`)
          vals.push(NUMERIC_FIELDS.has(f) ? Number(v) || 0 : v)
        }
        if (!sets.length) return false
        d.prepare(`UPDATE students SET ${sets.join(', ')} WHERE id = ?`).run(...vals, id)
        return true
      }

      const batchKeys = new Set()
      const fresh = []
      const existing = []
      let batchDup = 0
      for (const s of studentsToImport) {
        const rec = {
          status: 'Active',
          monthly_fee: 0,
          gender: '',
          class_name: 'Class 1',
          section: 'A',
          ...s
        }
        if (!rec.session) rec.session = currentSession()
        if (!rec.name) rec.name = 'Student'
        const nm = String(rec.name).trim().toLowerCase()
        const fn = String(rec.father_name || '').trim().toLowerCase()
        const key = rec.admission_no ? `${rec.admission_no}|${rec.session}|${nm}` : `|${rec.session}|${nm}|${fn}`
        if (batchKeys.has(key)) {
          batchDup++
          continue
        }
        batchKeys.add(key)
        const row = rec.admission_no
          ? findSame.get(rec.admission_no, rec.session, rec.name)
          : findSameNoAdm.get(rec.session, rec.name, rec.father_name || '')
        if (row) existing.push({ id: row.id, s })
        else fresh.push(rec)
      }

      if (fresh.length === 0 && existing.length === 0) {
        return { ok: false, reason: 'No new students were found in the file(s).' }
      }

      const buttons =
        existing.length && fresh.length
          ? ['Import new + update existing', 'Import new only', 'Cancel']
          : existing.length
            ? ['Update existing', 'Cancel']
            : ['Import', 'Cancel']
      let doImport = true
      let doUpdate = false
      {
        const line = (s, i) =>
          `${i + 1}. ${s.name}${s.father_name ? '  S/O  ' + s.father_name : ''}${s.class_name ? '  (' + s.class_name + (s.section ? '-' + s.section : '') + ')' : ''}${s.roll_no ? '  Roll ' + s.roll_no : ''}`
        const sample = fresh.slice(0, 10).map(line).join('\n')
        const upd = existing.slice(0, 6).map((e, i) => line(e.s, i)).join('\n')
        const { response } = await dialog.showMessageBox(parent, {
          type: 'question',
          buttons,
          defaultId: 0,
          cancelId: buttons.length - 1,
          title: 'Check students before import',
          message:
            `Found ${studentsToImport.length - batchDup} student(s) in the file: ${fresh.length} new` +
            (existing.length ? `, ${existing.length} already in the app` : '') +
            '.',
          detail:
            (fresh.length ? `NEW:\n${sample}${fresh.length > 10 ? `\n... and ${fresh.length - 10} more` : ''}\n\n` : '') +
            (existing.length
              ? `ALREADY IN THE APP (same name, admission no and session):\n${upd}${existing.length > 6 ? `\n... and ${existing.length - 6} more` : ''}\n"Update existing" replaces their details with the details from the file.\n\n`
              : '') +
            `Read as: ${readers.join(' | ')}` +
            (usedOcr ? '\nScanned text can contain spelling mistakes, please review after importing.' : '') +
            `\n\nIf the number or details are wrong, press Cancel and send the file together with: ${debugFile}`
        })
        const choice = buttons[response]
        if (!choice || choice === 'Cancel') return { ok: false, reason: 'Cancelled' }
        doUpdate = /update/i.test(choice)
        doImport = choice !== 'Update existing'
      }

      let importedCount = 0
      let updatedCount = 0
      let renumbered = 0
      d.exec('BEGIN')
      try {
        if (doImport) {
          for (const rec of fresh) {
            if (!rec.admission_no) rec.admission_no = makeAdm()
            try {
              insert.run(...values(rec))
            } catch (e) {
              rec.admission_no = makeAdm()
              insert.run(...values(rec))
              renumbered++
            }
            importedCount++
          }
        }
        if (doUpdate) {
          for (const e of existing) if (updateRow(e.id, e.s)) updatedCount++
        }
        d.exec('COMMIT')
      } catch (e) {
        d.exec('ROLLBACK')
        throw e
      }

      return {
        ok: true,
        count: importedCount,
        updated: updatedCount,
        skipped: (doUpdate ? 0 : existing.length) + batchDup,
        renumbered
      }
    } catch (err) {
      return { ok: false, reason: err.message }
    } finally {
      await closeOcrWorker()
    }
  })

  // ---------- 🔴 LICENSE CONTROL (HARDCODED FOR THIS MACHINE) ----------
  ipcMain.handle('get-machine-id', () => {
    return '7A08FC6FC4CE'
  })

  ipcMain.handle('check-license', async () => {
    try {
      const d = getDb()
      const savedKey = d.prepare('SELECT value FROM settings WHERE key = ?').get('license_key')?.value

      const machineId = '7A08FC6FC4CE'
      const expectedKey = '329FF76B799D07D9'

      if (!savedKey) {
        return { active: false, reason: 'Not activated. Please enter your license key.' }
      }

      if (savedKey !== expectedKey) {
        return { active: false, reason: 'License key does not match this computer.' }
      }

      // Online check (kill switch) - if offline, allows the app
      try {
        const data = await fetchJson(`${LICENSE_URL}?t=${Date.now()}`)

        if (data[machineId] === 'blocked') {
          return { active: false, reason: 'Subscription expired. Please contact the developer.' }
        }

        if (!data[machineId]) {
          return { active: false, reason: 'License revoked. Please contact the developer.' }
        }

        return { active: true, reason: 'Active' }
      } catch (err) {
        return { active: true, reason: 'Active (offline)' }
      }
    } catch (err) {
      return { active: false, reason: 'Error: ' + err.message }
    }
  })

  ipcMain.handle('activate-license', (_, { machineId, key }) => {
    try {
      const expectedKey = '329FF76B799D07D9'

      if (key === expectedKey) {
        getDb()
          .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
          .run('license_key', key)
        return true
      }
      return false
    } catch {
      return false
    }
  })

  // ---------- STUDENTS ----------
  ipcMain.handle('students:list', () => {
    return getDb().prepare('SELECT * FROM students ORDER BY id DESC').all()
  })

  ipcMain.handle('students:add', (_, s) => {
    const sql = `INSERT INTO students (${FIELDS.join(', ')}) VALUES (${FIELDS.map(() => '?').join(', ')})`
    const info = getDb().prepare(sql).run(...values(s))
    return Number(info.lastInsertRowid)
  })

  ipcMain.handle('students:update', (_, s) => {
    const sql = `UPDATE students SET ${FIELDS.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`
    getDb().prepare(sql).run(...values(s), s.id)
    return true
  })

  ipcMain.handle('students:delete', (_, id) => {
    getDb().prepare('DELETE FROM students WHERE id = ?').run(id)
    return true
  })

  ipcMain.handle('students:promote', (_, items) => {
    const d = getDb()
    const getOne = d.prepare('SELECT * FROM students WHERE id = ?')
    const exists = d.prepare('SELECT id FROM students WHERE admission_no = ? AND session = ?')
    const insert = d.prepare(
      `INSERT INTO students (${FIELDS.join(', ')}) VALUES (${FIELDS.map(() => '?').join(', ')})`
    )
    let promoted = 0, skipped = 0
    d.exec('BEGIN')
    try {
      for (const it of items) {
        const old = getOne.get(it.id)
        if (!old) { skipped++; continue }
        if (old.admission_no && exists.get(old.admission_no, it.session)) { skipped++; continue }
        insert.run(...values({ ...old, class_name: it.class_name, session: it.session, roll_no: '' }))
        promoted++
      }
      d.exec('COMMIT')
    } catch (e) {
      d.exec('ROLLBACK')
      throw e
    }
    return { promoted, skipped }
  })

  ipcMain.handle('attendance:list', (_, { from, to }) => {
    return getDb()
      .prepare('SELECT student_id, date, status FROM attendance WHERE date >= ? AND date <= ?')
      .all(from, to)
  })

  ipcMain.handle('attendance:set', (_, { student_id, date, status }) => {
    const d = getDb()
    if (!status) {
      d.prepare('DELETE FROM attendance WHERE student_id = ? AND date = ?').run(student_id, date)
    } else {
      d.prepare(
        `INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?) ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status`
      ).run(student_id, date, status)
    }
    return true
  })

  ipcMain.handle('attendance:setMany', (_, { date, student_ids, status }) => {
    const d = getDb()
    const up = d.prepare(
      `INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?) ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status`
    )
    const del = d.prepare('DELETE FROM attendance WHERE student_id = ? AND date = ?')
    d.exec('BEGIN')
    try {
      for (const id of student_ids) {
        if (status) up.run(id, date, status)
        else del.run(id, date)
      }
      d.exec('COMMIT')
    } catch (e) {
      d.exec('ROLLBACK')
      throw e
    }
    return true
  })

  ipcMain.handle('students:preview', (_, { rows, filterText }) => {
    const subtitle = `${rows.length} students${filterText ? ' | ' + filterText : ''} | ${new Date().toLocaleDateString()}`
    return buildPageHtml('Student List', subtitle, rows)
  })

  ipcMain.handle('students:export', async (event, { format, rows, filterText }) => {
    const title = 'Student List'
    const subtitle = `${rows.length} students${filterText ? ' | ' + filterText : ''} | ${new Date().toLocaleDateString()}`
    const parent = BrowserWindow.fromWebContents(event.sender)
    const stamp = new Date().toISOString().slice(0, 10)

    if (format === 'print' || format === 'pdf') {
      const tmp = join(app.getPath('temp'), 'student-list-export.html')
      fs.writeFileSync(tmp, buildPageHtml(title, subtitle, rows))
      const hidden = new BrowserWindow({ show: false })
      try {
        await hidden.loadFile(tmp)

        if (format === 'print') {
          await new Promise((resolve) => {
            hidden.webContents.print(
              { silent: false, printBackground: true, landscape: true },
              () => resolve()
            )
          })
          return { ok: true }
        }

        const { canceled, filePath } = await dialog.showSaveDialog(parent, {
          title: 'Save PDF',
          defaultPath: `Student-List-${stamp}.pdf`,
          filters: [{ name: 'PDF', extensions: ['pdf'] }]
        })
        if (canceled || !filePath) return { ok: false }
        const pdf = await hidden.webContents.printToPDF({
          landscape: true,
          pageSize: 'A4',
          printBackground: true
        })
        fs.writeFileSync(filePath, pdf)
        return { ok: true, filePath }
      } finally {
        hidden.destroy()
        fs.rmSync(tmp, { force: true })
      }
    }

    if (format === 'word') {
      const { canceled, filePath } = await dialog.showSaveDialog(parent, {
        title: 'Save Word file',
        defaultPath: `Student-List-${stamp}.doc`,
        filters: [{ name: 'Word Document', extensions: ['doc'] }]
      })
      if (canceled || !filePath) return { ok: false }
      fs.writeFileSync(filePath, '\ufeff' + buildHtml(title, subtitle, rows, true), 'utf8')
      return { ok: true, filePath }
    }

    if (format === 'excel') {
      const { canceled, filePath } = await dialog.showSaveDialog(parent, {
        title: 'Save Excel file',
        defaultPath: `Student-List-${stamp}.xlsx`,
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
      })
      if (canceled || !filePath) return { ok: false }

      const wide = {
        name: 24, father_name: 24, father_occupation: 22,
        address: 34, current_address: 34, permanent_address: 34,
        father_cnic: 16, reason_for_leaving: 28
      }
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Students')
      ws.columns = [
        { header: '#', key: 'no', width: 6 },
        ...COLUMNS.map(([header, key]) => ({ header, key, width: wide[key] || 16 }))
      ]
      rows.forEach((r, i) => {
        const row = { no: i + 1 }
        COLUMNS.forEach(([, k]) => {
          row[k] = k === 'monthly_fee' ? Number(r[k]) || 0 : (r[k] ?? '')
        })
        ws.addRow(row)
      })
      ws.getRow(1).eachCell((c) => {
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }
        c.alignment = { vertical: 'middle' }
      })
      ws.views = [{ state: 'frozen', ySplit: 1 }]
      ws.autoFilter = { from: 'A1', to: { row: 1, column: COLUMNS.length + 1 } }
      await wb.xlsx.writeFile(filePath)
      return { ok: true, filePath }
    }

    return { ok: false }
  })

  createWindow()

  setTimeout(autoBackup, 10 * 1000)
  setInterval(autoBackup, 6 * 60 * 60 * 1000)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => closeDatabase())