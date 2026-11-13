import { ipcMain } from 'electron'
import { getDb } from './database'

export function registerExamHandlers() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      session TEXT NOT NULL,
      month TEXT NOT NULL,
      class_name TEXT NOT NULL,
      section TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_unique
      ON exams(session, month, class_name, IFNULL(section,''), name);

    CREATE TABLE IF NOT EXISTS exam_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      max_marks REAL NOT NULL DEFAULT 100,
      pass_marks REAL NOT NULL DEFAULT 33,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exam_marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      marks REAL,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES exam_subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_marks_unique
      ON exam_marks(exam_id, subject_id, student_id);
  `)

  // Ensure an exam exists for the given (session, month, class, section, name)
  ipcMain.handle('exams:ensure', (_, p) => {
    const { name, session, month, class_name, section } = p
    const existing = db
      .prepare(
        `SELECT * FROM exams WHERE name=? AND session=? AND month=? AND class_name=? AND IFNULL(section,'')=IFNULL(?,'')`
      )
      .get(name, session, month, class_name, section || '')
    if (existing) return existing
    const info = db
      .prepare(
        `INSERT INTO exams (name, session, month, class_name, section) VALUES (?, ?, ?, ?, ?)`
      )
      .run(name, session, month, class_name, section || '')
    return db.prepare('SELECT * FROM exams WHERE id=?').get(Number(info.lastInsertRowid))
  })

  // Get full exam bundle: exam + subjects + marks
  ipcMain.handle('exams:load', (_, { examId }) => {
    const exam = db.prepare('SELECT * FROM exams WHERE id=?').get(examId)
    if (!exam) return { exam: null, subjects: [], marks: [] }
    const subjects = db
      .prepare('SELECT * FROM exam_subjects WHERE exam_id=? ORDER BY id')
      .all(examId)
    const marks = db
      .prepare('SELECT subject_id, student_id, marks FROM exam_marks WHERE exam_id=?')
      .all(examId)
    return { exam, subjects, marks }
  })

  // Subjects
  ipcMain.handle('exams:addSubject', (_, { examId, name, max_marks, pass_marks }) => {
    const info = db
      .prepare(
        'INSERT INTO exam_subjects (exam_id, name, max_marks, pass_marks) VALUES (?, ?, ?, ?)'
      )
      .run(examId, name, Number(max_marks) || 100, Number(pass_marks) || 33)
    return db
      .prepare('SELECT * FROM exam_subjects WHERE id=?')
      .get(Number(info.lastInsertRowid))
  })

  ipcMain.handle('exams:removeSubject', (_, { id }) => {
    db.prepare('DELETE FROM exam_subjects WHERE id=?').run(id)
    return true
  })

  ipcMain.handle('exams:updateSubject', (_, { id, name, max_marks, pass_marks }) => {
    db.prepare(
      'UPDATE exam_subjects SET name=?, max_marks=?, pass_marks=? WHERE id=?'
    ).run(name, Number(max_marks) || 100, Number(pass_marks) || 33, id)
    return true
  })

  // Marks: upsert
  ipcMain.handle('exams:setMark', (_, { examId, subjectId, studentId, marks }) => {
    const val = marks === '' || marks === null || marks === undefined ? null : Number(marks)
    if (val === null) {
      db.prepare(
        'DELETE FROM exam_marks WHERE exam_id=? AND subject_id=? AND student_id=?'
      ).run(examId, subjectId, studentId)
      return true
    }
    db.prepare(
      `INSERT INTO exam_marks (exam_id, subject_id, student_id, marks)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(exam_id, subject_id, student_id) DO UPDATE SET marks=excluded.marks`
    ).run(examId, subjectId, studentId, val)
    return true
  })

  // Bulk save (used when typing fast) — array of { subjectId, studentId, marks }
  ipcMain.handle('exams:setMarksBulk', (_, { examId, rows }) => {
    const stmt = db.prepare(
      `INSERT INTO exam_marks (exam_id, subject_id, student_id, marks)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(exam_id, subject_id, student_id) DO UPDATE SET marks=excluded.marks`
    )
    const del = db.prepare(
      'DELETE FROM exam_marks WHERE exam_id=? AND subject_id=? AND student_id=?'
    )
    db.exec('BEGIN')
    try {
      for (const r of rows) {
        const v =
          r.marks === '' || r.marks === null || r.marks === undefined ? null : Number(r.marks)
        if (v === null) del.run(examId, r.subjectId, r.studentId)
        else stmt.run(examId, r.subjectId, r.studentId, v)
      }
      db.exec('COMMIT')
    } catch (e) {
      db.exec('ROLLBACK')
      throw e
    }
    return true
  })

  // Delete whole exam (all subjects + marks cascade)
  ipcMain.handle('exams:delete', (_, { examId }) => {
    db.prepare('DELETE FROM exams WHERE id=?').run(examId)
    return true
  })
}