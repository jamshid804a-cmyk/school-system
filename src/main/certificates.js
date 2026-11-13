import { getDb } from './database'

export function registerCertificateHandlers() {
  // Create the table if it doesn't exist
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT,
      father_name TEXT,
      class_name TEXT,
      section TEXT,
      roll_no TEXT,
      dob TEXT,
      issue_date TEXT,
      type TEXT,
      remarks TEXT,
      principal_name TEXT,
      bg_type TEXT,
      bg_color TEXT,
      bg_image TEXT,
      bg_opacity REAL,
      school_name TEXT,
      school_address TEXT,
      school_logo TEXT,
      principal_sign TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Get all certificates
  const list = getDb().prepare('SELECT * FROM certificates ORDER BY id DESC')
  const insert = getDb().prepare(`
    INSERT INTO certificates (
      student_name, father_name, class_name, section, roll_no, dob, issue_date, type, remarks, principal_name,
      bg_type, bg_color, bg_image, bg_opacity, school_name, school_address, school_logo, principal_sign
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const update = getDb().prepare(`
    UPDATE certificates SET
      student_name = ?, father_name = ?, class_name = ?, section = ?, roll_no = ?, dob = ?, issue_date = ?, type = ?, remarks = ?, principal_name = ?,
      bg_type = ?, bg_color = ?, bg_image = ?, bg_opacity = ?, school_name = ?, school_address = ?, school_logo = ?, principal_sign = ?
    WHERE id = ?
  `)
  const del = getDb().prepare('DELETE FROM certificates WHERE id = ?')
  const getOne = getDb().prepare('SELECT * FROM certificates WHERE id = ?')

  const toValues = (c) => [
    c.studentName, c.fatherName, c.className, c.section, c.rollNo, c.dob, c.date, c.type, c.remarks, c.principalName,
    c.bgType, c.bgColor, c.bgImage, c.bgOpacity, c.schoolName, c.schoolAddress, c.schoolLogo, c.principalSign
  ]

  return {
    list: () => list.all(),
    add: (c) => {
      const info = insert.run(...toValues(c))
      return Number(info.lastInsertRowid)
    },
    update: (c) => {
      update.run(...toValues(c), c.id)
      return true
    },
    get: (id) => getOne.get(id),
    delete: (id) => {
      del.run(id)
      return true
    }
  }
}