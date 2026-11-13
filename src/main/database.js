import { DatabaseSync } from './sqlite-compat'
import { app } from 'electron'
import path from 'path'

let db

// Academic year starts in April: Apr 2026 - Mar 2027 = 2026-2027
export function currentSession() {
  const d = new Date()
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
  return `${y}-${y + 1}`
}

export function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'school.db')
  
  // If a database is already open (e.g. on reload/restore), close it first
  if (db) {
    try {
      db.close()
    } catch {
      /* ignore */
    }
  }

  db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA foreign_keys = ON;')

  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      father_name TEXT,
      class_name TEXT,
      roll_no TEXT,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Add new columns if they are missing
  const newColumns = {
    // Original columns
    admission_no: 'TEXT',
    gender: 'TEXT',
    section: 'TEXT',
    session: 'TEXT',
    address: 'TEXT',
    blood_group: 'TEXT',
    previous_school: 'TEXT',
    admission_date: 'TEXT',
    monthly_fee: 'REAL DEFAULT 0',
    photo: 'TEXT',
    father_occupation: 'TEXT',
    
    // NEW columns for the updated Admission Form
    father_cnic: 'TEXT',
    caste_tribe: 'TEXT',
    dob: 'TEXT',
    status: "TEXT DEFAULT 'Active'",
    nationality: 'TEXT',
    current_address: 'TEXT',
    permanent_address: 'TEXT',
    withdrawn_from_school: 'TEXT',
    reason_for_leaving: 'TEXT',
    slc_previous_school: 'TEXT',
    mobile_computer_usage: 'TEXT',
    part_time_activity: 'TEXT',
    favorite_subject: 'TEXT',
    hobby: 'TEXT',
    form_filled_by: 'TEXT',
    checked_by: 'TEXT',
    office_stamp_sign: 'TEXT'
  }
  
  const existing = db
    .prepare('PRAGMA table_info(students)')
    .all()
    .map((c) => c.name)
    
  for (const [col, type] of Object.entries(newColumns)) {
    if (!existing.includes(col)) {
      db.exec(`ALTER TABLE students ADD COLUMN ${col} ${type}`)
    }
  }

  // Old students without a session get the current session
  db.prepare("UPDATE students SET session = ? WHERE session IS NULL OR session = ''").run(
    currentSession()
  )

  // Student attendance: one row per student per day. status: P, A or L
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      UNIQUE (student_id, date),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
  `)

  return db
}

export const getDb = () => db

export function closeDatabase() {
  if (db) {
    try {
      db.close()
    } catch (e) {
      console.error('Error closing database:', e)
    }
  }
}