import { ipcMain } from 'electron'
import { getDb } from './database'

export function registerPaperHandlers() {
  const db = getDb()

  /* ============================================================
     SCHEMA
     ============================================================ */
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session TEXT,
      class_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      chapter TEXT,
      difficulty TEXT DEFAULT 'medium',
      type TEXT NOT NULL,
      text TEXT NOT NULL,
      image TEXT,
      options TEXT,
      matching TEXT,
      answer TEXT,
      marks REAL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_q_class ON questions(class_name, subject);

    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      session TEXT NOT NULL,
      class_name TEXT NOT NULL,
      section TEXT,
      subject TEXT NOT NULL,
      exam_name TEXT,
      exam_date TEXT,
      total_marks REAL DEFAULT 0,
      duration TEXT,
      instructions TEXT,
      style TEXT DEFAULT 'normal',
      layout TEXT DEFAULT 'portrait',
      question_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS paper_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paper_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      instructions TEXT,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS paper_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paper_id INTEGER NOT NULL,
      section_id INTEGER,
      question_id INTEGER,
      text TEXT NOT NULL,
      image TEXT,
      type TEXT NOT NULL,
      options TEXT,
      matching TEXT,
      answer TEXT,
      marks REAL DEFAULT 1,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES paper_sections(id) ON DELETE CASCADE
    );
  `)

  /* ------------------------------------------------------------
     MIGRATION: old DBs may have paper_questions.section_id NOT NULL.
     Detect by reading sqlite_master and rebuild if needed.
     ------------------------------------------------------------ */
  try {
    const schema = db
      .prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='paper_questions'`)
      .get()
    const sql = schema?.sql || ''
    // If the schema still contains "section_id INTEGER NOT NULL" — rebuild
    if (/section_id\s+INTEGER\s+NOT\s+NULL/i.test(sql)) {
      db.exec(`
        ALTER TABLE paper_questions RENAME TO paper_questions_old;
        CREATE TABLE paper_questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          paper_id INTEGER NOT NULL,
          section_id INTEGER,
          question_id INTEGER,
          text TEXT NOT NULL,
          image TEXT,
          type TEXT NOT NULL,
          options TEXT,
          matching TEXT,
          answer TEXT,
          marks REAL DEFAULT 1,
          order_index INTEGER DEFAULT 0,
          FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
          FOREIGN KEY (section_id) REFERENCES paper_sections(id) ON DELETE CASCADE
        );
        INSERT INTO paper_questions
          (id, paper_id, section_id, question_id, text, image, type, options, matching, answer, marks, order_index)
        SELECT id, paper_id, section_id, question_id, text, image, type, options, matching, answer, marks, order_index
        FROM paper_questions_old;
        DROP TABLE paper_questions_old;
      `)
    }
  } catch (err) {
    console.warn('paper_questions migration skipped:', err.message)
  }

  // Add layout / question_count columns if missing
  try { db.exec(`ALTER TABLE papers ADD COLUMN layout TEXT DEFAULT 'portrait'`) } catch {}
  try { db.exec(`ALTER TABLE papers ADD COLUMN question_count INTEGER DEFAULT 0`) } catch {}

  /* ------------------------------------------------------------
     Helper: refresh question_count + total_marks for a paper
     ------------------------------------------------------------ */
  const refreshPaperStats = (paperId) => {
    const stats = db
      .prepare(
        `SELECT COUNT(*) as cnt, COALESCE(SUM(marks), 0) as total
         FROM paper_questions WHERE paper_id = ? AND type != 'pagebreak'`
      )
      .get(paperId)
    db.prepare('UPDATE papers SET question_count = ?, total_marks = ? WHERE id = ?').run(
      stats.cnt,
      stats.total,
      paperId
    )
  }

  /* ============================================================
     QUESTION BANK
     ============================================================ */
  ipcMain.handle('questions:list', (_, { session, class_name, subject, type, search }) => {
    let sql = 'SELECT * FROM questions WHERE 1=1'
    const params = []
    if (session) { sql += ' AND session = ?'; params.push(session) }
    if (class_name) { sql += ' AND class_name = ?'; params.push(class_name) }
    if (subject) { sql += ' AND subject = ?'; params.push(subject) }
    if (type) { sql += ' AND type = ?'; params.push(type) }
    if (search) { sql += ' AND text LIKE ?'; params.push('%' + search + '%') }
    sql += ' ORDER BY id DESC'
    const rows = db.prepare(sql).all(...params)
    return rows.map((r) => ({
      ...r,
      options: r.options ? JSON.parse(r.options) : [],
      matching: r.matching ? JSON.parse(r.matching) : []
    }))
  })

  ipcMain.handle('questions:add', (_, p) => {
    const info = db
      .prepare(
        `INSERT INTO questions
          (session, class_name, subject, chapter, difficulty, type, text, image, options, matching, answer, marks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        p.session || '',
        p.class_name || '',
        p.subject || '',
        p.chapter || '',
        p.difficulty || 'medium',
        p.type || 'short',
        p.text || '',
        p.image || '',
        p.options ? JSON.stringify(p.options) : null,
        p.matching ? JSON.stringify(p.matching) : null,
        p.answer || '',
        Number(p.marks) || 1
      )
    return Number(info.lastInsertRowid)
  })

  ipcMain.handle('questions:update', (_, p) => {
    db.prepare(
      `UPDATE questions SET
        session=?, class_name=?, subject=?, chapter=?, difficulty=?, type=?,
        text=?, image=?, options=?, matching=?, answer=?, marks=?
       WHERE id=?`
    ).run(
      p.session || '',
      p.class_name || '',
      p.subject || '',
      p.chapter || '',
      p.difficulty || 'medium',
      p.type || 'short',
      p.text || '',
      p.image || '',
      p.options ? JSON.stringify(p.options) : null,
      p.matching ? JSON.stringify(p.matching) : null,
      p.answer || '',
      Number(p.marks) || 1,
      p.id
    )
    return true
  })

  ipcMain.handle('questions:delete', (_, { id }) => {
    db.prepare('DELETE FROM questions WHERE id=?').run(id)
    return true
  })

  /* ============================================================
     PAPERS
     ============================================================ */
  ipcMain.handle('papers:list', (_, { session }) => {
    let sql = 'SELECT * FROM papers'
    const params = []
    if (session) { sql += ' WHERE session = ?'; params.push(session) }
    sql += ' ORDER BY id DESC'
    return db.prepare(sql).all(...params)
  })

  ipcMain.handle('papers:get', (_, { id }) => {
    const paper = db.prepare('SELECT * FROM papers WHERE id=?').get(id)
    if (!paper) return null
    const sections = db
      .prepare('SELECT * FROM paper_sections WHERE paper_id=? ORDER BY order_index, id')
      .all(id)
    const questions = db
      .prepare('SELECT * FROM paper_questions WHERE paper_id=? ORDER BY order_index, id')
      .all(id)
    return {
      paper,
      sections,
      questions: questions.map((q) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : [],
        matching: q.matching ? JSON.parse(q.matching) : []
      }))
    }
  })

  ipcMain.handle('papers:add', (_, p) => {
    const info = db
      .prepare(
        `INSERT INTO papers
          (title, session, class_name, section, subject, exam_name, exam_date,
           total_marks, duration, instructions, style, layout)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        p.title || 'Untitled Paper',
        p.session || '',
        p.class_name || '',
        p.section || '',
        p.subject || '',
        p.exam_name || '',
        p.exam_date || '',
        Number(p.total_marks) || 0,
        p.duration || '',
        p.instructions || '',
        p.style || 'normal',
        p.layout || 'portrait'
      )
    return Number(info.lastInsertRowid)
  })

  ipcMain.handle('papers:update', (_, p) => {
    db.prepare(
      `UPDATE papers SET
        title=?, session=?, class_name=?, section=?, subject=?, exam_name=?, exam_date=?,
        total_marks=?, duration=?, instructions=?, style=?, layout=?
       WHERE id=?`
    ).run(
      p.title || '',
      p.session || '',
      p.class_name || '',
      p.section || '',
      p.subject || '',
      p.exam_name || '',
      p.exam_date || '',
      Number(p.total_marks) || 0,
      p.duration || '',
      p.instructions || '',
      p.style || 'normal',
      p.layout || 'portrait',
      p.id
    )
    return true
  })

  ipcMain.handle('papers:delete', (_, { id }) => {
    db.prepare('DELETE FROM papers WHERE id=?').run(id)
    return true
  })

  ipcMain.handle('papers:duplicate', (_, { id }) => {
    const src = db.prepare('SELECT * FROM papers WHERE id=?').get(id)
    if (!src) throw new Error('Not found')
    const info = db
      .prepare(
        `INSERT INTO papers
          (title, session, class_name, section, subject, exam_name, exam_date,
           total_marks, duration, instructions, style, layout)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        src.title + ' (copy)',
        src.session,
        src.class_name,
        src.section,
        src.subject,
        src.exam_name,
        src.exam_date,
        src.total_marks,
        src.duration,
        src.instructions,
        src.style,
        src.layout || 'portrait'
      )
    const newId = Number(info.lastInsertRowid)
    const sections = db.prepare('SELECT * FROM paper_sections WHERE paper_id=?').all(id)
    for (const s of sections) {
      const sInfo = db
        .prepare('INSERT INTO paper_sections (paper_id, title, instructions, order_index) VALUES (?, ?, ?, ?)')
        .run(newId, s.title, s.instructions, s.order_index)
      const newSectionId = Number(sInfo.lastInsertRowid)
      const questions = db.prepare('SELECT * FROM paper_questions WHERE section_id=?').all(s.id)
      for (const q of questions) {
        db.prepare(
          `INSERT INTO paper_questions
            (paper_id, section_id, question_id, text, image, type, options, matching, answer, marks, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          newId, newSectionId, q.question_id, q.text, q.image, q.type,
          q.options, q.matching, q.answer, q.marks, q.order_index
        )
      }
    }
    refreshPaperStats(newId)
    return newId
  })

  /* ============================================================
     SECTIONS
     ============================================================ */
  ipcMain.handle('sections:add', (_, p) => {
    const info = db
      .prepare('INSERT INTO paper_sections (paper_id, title, instructions, order_index) VALUES (?, ?, ?, ?)')
      .run(p.paper_id, p.title || 'Section', p.instructions || '', Number(p.order_index) || 0)
    return db.prepare('SELECT * FROM paper_sections WHERE id=?').get(Number(info.lastInsertRowid))
  })

  ipcMain.handle('sections:update', (_, p) => {
    db.prepare('UPDATE paper_sections SET title=?, instructions=?, order_index=? WHERE id=?')
      .run(p.title || '', p.instructions || '', Number(p.order_index) || 0, p.id)
    return true
  })

  ipcMain.handle('sections:delete', (_, { id }) => {
    const section = db.prepare('SELECT paper_id FROM paper_sections WHERE id=?').get(id)
    db.prepare('DELETE FROM paper_sections WHERE id=?').run(id)
    if (section) refreshPaperStats(section.paper_id)
    return true
  })

  /* ============================================================
     PAPER QUESTIONS — page breaks + custom questions allowed
     (section_id may be null for page breaks)
     ============================================================ */
  ipcMain.handle('paperQ:add', (_, p) => {
    const info = db
      .prepare(
        `INSERT INTO paper_questions
          (paper_id, section_id, question_id, text, image, type, options, matching, answer, marks, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        p.paper_id,
        p.section_id ?? null,
        p.question_id ?? null,
        p.text || '',
        p.image || '',
        p.type || 'text',
        p.options ? JSON.stringify(p.options) : null,
        p.matching ? JSON.stringify(p.matching) : null,
        p.answer || '',
        Number(p.marks) || 0,
        Number(p.order_index) || 0
      )
    refreshPaperStats(p.paper_id)
    return Number(info.lastInsertRowid)
  })

  ipcMain.handle('paperQ:update', (_, p) => {
    db.prepare(
      `UPDATE paper_questions SET
        text=?, image=?, type=?, options=?, matching=?, answer=?, marks=?, order_index=?
       WHERE id=?`
    ).run(
      p.text || '',
      p.image || '',
      p.type || 'text',
      p.options ? JSON.stringify(p.options) : null,
      p.matching ? JSON.stringify(p.matching) : null,
      p.answer || '',
      Number(p.marks) || 0,
      Number(p.order_index) || 0,
      p.id
    )
    const row = db.prepare('SELECT paper_id FROM paper_questions WHERE id=?').get(p.id)
    if (row) refreshPaperStats(row.paper_id)
    return true
  })

  ipcMain.handle('paperQ:delete', (_, { id }) => {
    const row = db.prepare('SELECT paper_id FROM paper_questions WHERE id=?').get(id)
    db.prepare('DELETE FROM paper_questions WHERE id=?').run(id)
    if (row) refreshPaperStats(row.paper_id)
    return true
  })

  /* ============================================================
     AUTO-GENERATE
     ============================================================ */
  ipcMain.handle('papers:autoGenerate', (_, config) => {
    const {
      title, session, class_name, section, subject, exam_name, exam_date,
      duration, instructions, style, layout, sections
    } = config

    const paperInfo = db
      .prepare(
        `INSERT INTO papers
          (title, session, class_name, section, subject, exam_name, exam_date,
           total_marks, duration, instructions, style, layout)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        title || 'Auto Paper',
        session || '',
        class_name || '',
        section || '',
        subject || '',
        exam_name || '',
        exam_date || '',
        0,
        duration || '',
        instructions || '',
        style || 'normal',
        layout || 'portrait'
      )
    const paperId = Number(paperInfo.lastInsertRowid)

    let seq = 0
    for (const sect of sections) {
      const sInfo = db
        .prepare('INSERT INTO paper_sections (paper_id, title, instructions, order_index) VALUES (?, ?, ?, ?)')
        .run(paperId, sect.title || 'Section', sect.instructions || '', seq++)
      const sectionId = Number(sInfo.lastInsertRowid)

      let sql = 'SELECT * FROM questions WHERE class_name=? AND subject=? AND type=?'
      const params = [class_name, subject, sect.type]
      if (sect.difficulty) { sql += ' AND difficulty=?'; params.push(sect.difficulty) }
      sql += ' ORDER BY RANDOM() LIMIT ?'
      params.push(Number(sect.count) || 1)

      const picked = db.prepare(sql).all(...params)
      if (picked.length < sect.count) {
        db.prepare('UPDATE paper_sections SET instructions=? WHERE id=?').run(
          (sect.instructions ? sect.instructions + '  ' : '') +
            `[NEEDS ${sect.count} ${sect.type} QUESTIONS — only ${picked.length} found in bank]`,
          sectionId
        )
      }

      let qSeq = 0
      for (const q of picked) {
        db.prepare(
          `INSERT INTO paper_questions
            (paper_id, section_id, question_id, text, image, type, options, matching, answer, marks, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          paperId, sectionId, q.id, q.text, q.image, q.type,
          q.options, q.matching, q.answer, Number(q.marks) || 1, qSeq++
        )
      }
    }

    refreshPaperStats(paperId)
    return paperId
  })
}