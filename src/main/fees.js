import { ipcMain } from 'electron'
import { getDb } from './database'

export function registerFeeHandlers() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS fee_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT,
      student_id INTEGER NOT NULL,
      session TEXT NOT NULL,
      month TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT DEFAULT 'Cash',
      note TEXT,
      paid_on TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_fee_session ON fee_payments(session, month);
    CREATE INDEX IF NOT EXISTS idx_fee_student ON fee_payments(student_id);
  `)

  ipcMain.handle('fees:list', (_, { session }) => {
    return db.prepare('SELECT * FROM fee_payments WHERE session = ? ORDER BY id').all(session)
  })

  ipcMain.handle('fees:add', (_, p) => {
    const amount = Number(p.amount)
    if (!(amount > 0)) throw new Error('Amount must be greater than 0')

    const student = db.prepare('SELECT monthly_fee FROM students WHERE id = ?').get(p.student_id)
    if (!student) throw new Error('Student not found')

    const fee = Number(student.monthly_fee) || 0
    const already = db
      .prepare('SELECT COALESCE(SUM(amount), 0) AS t FROM fee_payments WHERE student_id = ? AND month = ?')
      .get(p.student_id, p.month).t
    if (amount > fee - already + 0.001) throw new Error('Amount is more than the remaining fee')

    const info = db
      .prepare(
        `INSERT INTO fee_payments (student_id, session, month, amount, method, note, paid_on)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(p.student_id, p.session, p.month, amount, p.method || 'Cash', p.note || '', p.paid_on)

    const id = Number(info.lastInsertRowid)
    const receipt_no = 'RCP-' + String(id).padStart(5, '0')
    db.prepare('UPDATE fee_payments SET receipt_no = ? WHERE id = ?').run(receipt_no, id)

    return {
      id,
      receipt_no,
      student_id: p.student_id,
      session: p.session,
      month: p.month,
      amount,
      method: p.method || 'Cash',
      note: p.note || '',
      paid_on: p.paid_on,
      month_paid: already + amount
    }
  })

  ipcMain.handle('fees:delete', (_, id) => {
    db.prepare('DELETE FROM fee_payments WHERE id = ?').run(id)
    return true
  })
}