import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs'
import ExcelJS from 'exceljs'
import { getDb } from './database'

const FIELDS = [
  'employee_id',
  'name',
  'father_name',
  'gender',
  'blood_group',
  'qualification',
  'designation',
  'subjects',
  'assigned_classes',
  'class_teacher_of',
  'class_teacher_section',
  'experience',
  'joining_date',
  'monthly_salary',
  'status',
  'phone',
  'email',
  'address',
  'photo'
]

const values = (t) =>
  FIELDS.map((f) => (f === 'monthly_salary' ? Number(t[f]) || 0 : (t[f] ?? '')))

const COLUMNS = [
  ['Emp. ID', 'employee_id'],
  ['Teacher Name', 'name'],
  ['Father Name', 'father_name'],
  ['Gender', 'gender'],
  ['Designation', 'designation'],
  ['Qualification', 'qualification'],
  ['Subjects', 'subjects'],
  ['Assigned Classes', 'assigned_classes'],
  ['Class Teacher Of', 'class_teacher_of'],
  ['Experience', 'experience'],
  ['Joining Date', 'joining_date'],
  ['Salary', 'monthly_salary'],
  ['Phone', 'phone'],
  ['Email', 'email'],
  ['Status', 'status'],
  ['Address', 'address']
]

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// Plain data table (used for Word)
function buildTable(title, subtitle, rows, forWord) {
  const head = ['<th>#</th>', ...COLUMNS.map(([h]) => `<th>${h}</th>`)].join('')
  const body = rows
    .map(
      (r, i) =>
        `<tr><td>${i + 1}</td>${COLUMNS.map(([, k]) => {
          const v = k === 'class_teacher_of' && r[k] ? `${r[k]}${r.class_teacher_section ? ' - ' + r.class_teacher_section : ''}` : r[k]
          return `<td>${esc(v)}</td>`
        }).join('')}</tr>`
    )
    .join('')
  const wordHead = forWord
    ? `<xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml>
       <style>@page Section1{size:841.9pt 595.3pt;mso-page-orientation:landscape;margin:0.5in}
       div.Section1{page:Section1}</style>`
    : ''
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(title)}</title>${wordHead}
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: Arial, sans-serif; color: #1e293b; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p { font-size: 11px; color: #64748b; margin: 0 0 12px; }
  table { border-collapse: collapse; width: 100%; font-size: 8px; }
  th { background: #047857; color: #fff; padding: 5px; text-align: left; border: 1px solid #065f46; }
  td { padding: 4px 5px; border: 1px solid #cbd5e1; }
  tr:nth-child(even) td { background: #f1f5f9; }
</style></head>
<body>${forWord ? '<div class="Section1">' : ''}
<h1>${esc(title)}</h1><p>${esc(subtitle)}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
${forWord ? '</div>' : ''}
</body></html>`
}

// Page style (used for preview, Print and PDF)
function buildPage(title, subtitle, rows) {
  const body = rows
    .map((r, i) => {
      const avatar = r.photo
        ? `<img src="${r.photo}" class="av">`
        : `<div class="av ph">${esc((r.name || '?').charAt(0).toUpperCase())}</div>`
      const classes = String(r.assigned_classes || '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => `<span class="badge">${esc(c)}</span>`)
        .join(' ')
      const active = r.status !== 'Left'
      return `<tr>
        <td class="c-no">${i + 1}</td>
        <td><div class="who">${avatar}<div><div class="nm">${esc(r.name)}</div><div class="fn">${esc(r.designation)}</div></div></div></td>
        <td class="mut">${esc(r.employee_id)}</td>
        <td>${esc(r.qualification)}</td>
        <td>${esc(r.subjects)}</td>
        <td>${classes}</td>
        <td>${esc(r.phone)}</td>
        <td class="fee">${Number(r.monthly_salary) || 0}</td>
        <td><span class="st" style="background:${active ? '#d1fae5' : '#ffe4e6'};color:${active ? '#047857' : '#be123c'}">${esc(r.status || 'Active')}</span></td>
      </tr>`
    })
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
  body { font-family: Segoe UI, Arial, sans-serif; color: #334155; margin: 0; padding: 14px; }
  h1 { font-size: 20px; margin: 0; color: #1e293b; }
  .sub { font-size: 11px; color: #64748b; margin: 3px 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th { background: #f8fafc; color: #64748b; text-transform: uppercase; font-size: 9px; letter-spacing: .05em; text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  tr { page-break-inside: avoid; }
  .who { display: flex; align-items: center; gap: 9px; }
  .av { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .ph { background: #059669; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
  .nm { font-weight: 700; color: #1e293b; font-size: 12px; }
  .fn { font-size: 10px; color: #64748b; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 600; background: #dbeafe; color: #1d4ed8; margin: 1px 0; }
  .st { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 600; }
  .mut { color: #64748b; }
  .fee { font-weight: 700; }
  .c-no { color: #94a3b8; width: 24px; }
</style></head><body>
<h1>${esc(title)}</h1><div class="sub">${esc(subtitle)}</div>
<table><thead><tr><th>#</th><th>Teacher</th><th>Emp. ID</th><th>Qualification</th><th>Subjects</th><th>Classes</th><th>Phone</th><th>Salary</th><th>Status</th></tr></thead>
<tbody>${body}</tbody></table>
</body></html>`
}

export function registerTeacherHandlers() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT,
      name TEXT NOT NULL,
      father_name TEXT,
      gender TEXT,
      blood_group TEXT,
      qualification TEXT,
      designation TEXT,
      subjects TEXT,
      assigned_classes TEXT,
      class_teacher_of TEXT,
      class_teacher_section TEXT,
      experience TEXT,
      joining_date TEXT,
      monthly_salary REAL DEFAULT 0,
      status TEXT DEFAULT 'Active',
      phone TEXT,
      email TEXT,
      address TEXT,
      photo TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)

  ipcMain.handle('teachers:list', () =>
    getDb().prepare('SELECT * FROM teachers ORDER BY id DESC').all()
  )

  ipcMain.handle('teachers:add', (_, t) => {
    const sql = `INSERT INTO teachers (${FIELDS.join(', ')}) VALUES (${FIELDS.map(() => '?').join(', ')})`
    const info = getDb()
      .prepare(sql)
      .run(...values(t))
    return Number(info.lastInsertRowid)
  })

  ipcMain.handle('teachers:update', (_, t) => {
    const sql = `UPDATE teachers SET ${FIELDS.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`
    getDb()
      .prepare(sql)
      .run(...values(t), t.id)
    return true
  })

  ipcMain.handle('teachers:delete', (_, id) => {
    getDb().prepare('DELETE FROM teachers WHERE id = ?').run(id)
    return true
  })

  ipcMain.handle('teachers:preview', (_, { rows, filterText }) => {
    const subtitle = `${rows.length} teachers${filterText ? ' | ' + filterText : ''} | ${new Date().toLocaleDateString()}`
    return buildPage('Teacher List', subtitle, rows)
  })

  ipcMain.handle('teachers:export', async (event, { format, rows, filterText }) => {
    const title = 'Teacher List'
    const subtitle = `${rows.length} teachers${filterText ? ' | ' + filterText : ''} | ${new Date().toLocaleDateString()}`
    const parent = BrowserWindow.fromWebContents(event.sender)
    const stamp = new Date().toISOString().slice(0, 10)

    if (format === 'print' || format === 'pdf') {
      const tmp = join(app.getPath('temp'), 'teacher-list-export.html')
      fs.writeFileSync(tmp, buildPage(title, subtitle, rows))
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
          defaultPath: `Teacher-List-${stamp}.pdf`,
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
        defaultPath: `Teacher-List-${stamp}.doc`,
        filters: [{ name: 'Word Document', extensions: ['doc'] }]
      })
      if (canceled || !filePath) return { ok: false }
      fs.writeFileSync(filePath, '\ufeff' + buildTable(title, subtitle, rows, true), 'utf8')
      return { ok: true, filePath }
    }

    if (format === 'excel') {
      const { canceled, filePath } = await dialog.showSaveDialog(parent, {
        title: 'Save Excel file',
        defaultPath: `Teacher-List-${stamp}.xlsx`,
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
      })
      if (canceled || !filePath) return { ok: false }
      const wide = { name: 24, father_name: 24, subjects: 26, assigned_classes: 30, qualification: 22, email: 26, address: 34 }
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Teachers')
      ws.columns = [
        { header: '#', key: 'no', width: 6 },
        ...COLUMNS.map(([header, key]) => ({ header, key, width: wide[key] || 16 }))
      ]
      rows.forEach((r, i) => {
        const row = { no: i + 1 }
        COLUMNS.forEach(([, k]) => {
          row[k] = k === 'monthly_salary' ? Number(r[k]) || 0 : (r[k] ?? '')
        })
        if (r.class_teacher_of && r.class_teacher_section) {
          row.class_teacher_of = `${r.class_teacher_of} - ${r.class_teacher_section}`
        }
        ws.addRow(row)
      })
      ws.getRow(1).eachCell((c) => {
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } }
        c.alignment = { vertical: 'middle' }
      })
      ws.views = [{ state: 'frozen', ySplit: 1 }]
      ws.autoFilter = { from: 'A1', to: { row: 1, column: COLUMNS.length + 1 } }
      await wb.xlsx.writeFile(filePath)
      return { ok: true, filePath }
    }

    return { ok: false }
  })
}