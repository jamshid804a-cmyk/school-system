import { ipcMain } from 'electron'
import { getDb } from './database'

export function registerTeacherAttendanceHandlers() {
  const d = () => getDb()

  // Create the table if it does not exist yet
  d().exec(`
    CREATE TABLE IF NOT EXISTS teacher_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      UNIQUE (teacher_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON teacher_attendance(date);
  `)

  ipcMain.handle('teacher-attendance:list', (_, { from, to }) => {
    return d()
      .prepare(
        'SELECT teacher_id, date, status FROM teacher_attendance WHERE date >= ? AND date <= ?'
      )
      .all(from, to)
  })

  ipcMain.handle('teacher-attendance:set', (_, { teacher_id, date, status }) => {
    if (!status) {
      d().prepare('DELETE FROM teacher_attendance WHERE teacher_id = ? AND date = ?').run(
        teacher_id,
        date
      )
    } else {
      d()
        .prepare(
          `INSERT INTO teacher_attendance (teacher_id, date, status) VALUES (?, ?, ?)
           ON CONFLICT(teacher_id, date) DO UPDATE SET status = excluded.status`
        )
        .run(teacher_id, date, status)
    }
    return true
  })

  ipcMain.handle('teacher-attendance:setMany', (_, { date, teacher_ids, status }) => {
    const db = d()
    const up = db.prepare(
      `INSERT INTO teacher_attendance (teacher_id, date, status) VALUES (?, ?, ?)
       ON CONFLICT(teacher_id, date) DO UPDATE SET status = excluded.status`
    )
    const del = db.prepare('DELETE FROM teacher_attendance WHERE teacher_id = ? AND date = ?')
    db.exec('BEGIN')
    try {
      for (const id of teacher_ids) {
        if (status) up.run(id, date, status)
        else del.run(id, date)
      }
      db.exec('COMMIT')
    } catch (e) {
      db.exec('ROLLBACK')
      throw e
    }
    return true
  })
}