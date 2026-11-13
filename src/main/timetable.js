import { ipcMain } from 'electron'
import { getDb } from './database'

export function registerTimetableHandlers() {
  const db = getDb()

  db.exec(`
    -- CLASS TIME TABLE
    CREATE TABLE IF NOT EXISTS class_timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session TEXT NOT NULL,
      class_name TEXT NOT NULL,
      section TEXT,
      day INTEGER NOT NULL,           -- 0=Sun, 1=Mon, ... 6=Sat
      period_no INTEGER NOT NULL,     -- 1,2,3...
      subject TEXT NOT NULL,
      teacher TEXT,
      start_time TEXT,                -- "08:00"
      end_time TEXT,                  -- "08:45"
      room TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ct_session_class
      ON class_timetable(session, class_name, section, day);

    -- EXAM TIME TABLE
    CREATE TABLE IF NOT EXISTS exam_timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session TEXT NOT NULL,
      exam_name TEXT NOT NULL,        -- "Mid Term", "Final"
      class_name TEXT NOT NULL,
      section TEXT,
      subject TEXT NOT NULL,
      exam_date TEXT NOT NULL,        -- "2026-05-12"
      start_time TEXT,
      end_time TEXT,
      room TEXT,
      total_marks INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_et_session
      ON exam_timetable(session, exam_name, class_name, section);
  `)

  /* ---------------- CLASS TIME TABLE ---------------- */
  ipcMain.handle('classTT:list', (_, { session, class_name, section }) => {
    return db
      .prepare(
        `SELECT * FROM class_timetable
         WHERE session = ? AND class_name = ? AND IFNULL(section,'') = IFNULL(?,'')
         ORDER BY day, period_no, start_time`
      )
      .all(session, class_name, section || '')
  })

  ipcMain.handle('classTT:add', (_, p) => {
    const info = db
      .prepare(
        `INSERT INTO class_timetable
          (session, class_name, section, day, period_no, subject, teacher, start_time, end_time, room)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        p.session,
        p.class_name,
        p.section || '',
        Number(p.day) || 0,
        Number(p.period_no) || 1,
        p.subject || '',
        p.teacher || '',
        p.start_time || '',
        p.end_time || '',
        p.room || ''
      )
    return db.prepare('SELECT * FROM class_timetable WHERE id = ?').get(Number(info.lastInsertRowid))
  })

  ipcMain.handle('classTT:update', (_, p) => {
    db.prepare(
      `UPDATE class_timetable SET
        day=?, period_no=?, subject=?, teacher=?, start_time=?, end_time=?, room=?
       WHERE id=?`
    ).run(
      Number(p.day) || 0,
      Number(p.period_no) || 1,
      p.subject || '',
      p.teacher || '',
      p.start_time || '',
      p.end_time || '',
      p.room || '',
      p.id
    )
    return true
  })

  ipcMain.handle('classTT:delete', (_, { id }) => {
    db.prepare('DELETE FROM class_timetable WHERE id=?').run(id)
    return true
  })

  /* ---------------- EXAM TIME TABLE ---------------- */
  ipcMain.handle('examTT:list', (_, { session, exam_name, class_name, section }) => {
    return db
      .prepare(
        `SELECT * FROM exam_timetable
         WHERE session = ? AND exam_name = ? AND class_name = ?
           AND IFNULL(section,'') = IFNULL(?,'')
         ORDER BY exam_date, start_time`
      )
      .all(session, exam_name, class_name, section || '')
  })

  ipcMain.handle('examTT:add', (_, p) => {
    const info = db
      .prepare(
        `INSERT INTO exam_timetable
          (session, exam_name, class_name, section, subject, exam_date, start_time, end_time, room, total_marks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        p.session,
        p.exam_name || 'Exam',
        p.class_name,
        p.section || '',
        p.subject || '',
        p.exam_date || '',
        p.start_time || '',
        p.end_time || '',
        p.room || '',
        Number(p.total_marks) || 100
      )
    return db.prepare('SELECT * FROM exam_timetable WHERE id = ?').get(Number(info.lastInsertRowid))
  })

  ipcMain.handle('examTT:update', (_, p) => {
    db.prepare(
      `UPDATE exam_timetable SET
        subject=?, exam_date=?, start_time=?, end_time=?, room=?, total_marks=?
       WHERE id=?`
    ).run(
      p.subject || '',
      p.exam_date || '',
      p.start_time || '',
      p.end_time || '',
      p.room || '',
      Number(p.total_marks) || 100,
      p.id
    )
    return true
  })

  ipcMain.handle('examTT:delete', (_, { id }) => {
    db.prepare('DELETE FROM exam_timetable WHERE id=?').run(id)
    return true
  })
}