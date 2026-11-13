import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import initSqlJs from 'sql.js'

let SQL = null

// Must be called (and awaited) once before the first database is opened
export async function initSqlite() {
  if (!SQL) {
    const wasmPath = path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
    SQL = await initSqlJs({ wasmBinary: new Uint8Array(fs.readFileSync(wasmPath)) })
  }
}

const clean = (v) =>
  v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : typeof v === 'bigint' ? Number(v) : v

class Statement {
  constructor(owner, sql) {
    this.owner = owner
    this.sql = sql
  }
  _open(params) {
    const stmt = this.owner.db.prepare(this.sql)
    if (params.length) stmt.bind(params.map(clean))
    return stmt
  }
  run(...params) {
    const stmt = this._open(params)
    try {
      stmt.step()
    } finally {
      stmt.free()
    }
    const r = this.owner.db.exec('SELECT last_insert_rowid()')
    const lastInsertRowid = r[0] ? r[0].values[0][0] : 0
    const changes = this.owner.db.getRowsModified()
    this.owner._wrote()
    return { lastInsertRowid, changes }
  }
  get(...params) {
    const stmt = this._open(params)
    try {
      return stmt.step() ? stmt.getAsObject() : undefined
    } finally {
      stmt.free()
    }
  }
  all(...params) {
    const stmt = this._open(params)
    try {
      const rows = []
      while (stmt.step()) rows.push(stmt.getAsObject())
      return rows
    } finally {
      stmt.free()
    }
  }
}

export class DatabaseSync {
  constructor(path) {
    if (!SQL) throw new Error('initSqlite() must be awaited before opening the database')
    this.path = path
    this.inTx = false
    this.dirty = false
    this.timer = null
    const data = path && fs.existsSync(path) ? fs.readFileSync(path) : null
    this.db = data && data.length ? new SQL.Database(new Uint8Array(data)) : new SQL.Database()
    this.db.run('PRAGMA foreign_keys = ON;')
    this._onExit = () => this.flush()
    process.on('exit', this._onExit)
  }

  _wrote() {
    this.dirty = true
    if (!this.inTx && !this.timer) {
      this.timer = setTimeout(() => {
        this.timer = null
        this.flush()
      }, 300)
    }
  }

  // write the database to disk
  flush() {
    if (!this.path || !this.dirty || this.inTx) return
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    const data = this.db.export() // export() resets pragmas
    this.db.run('PRAGMA foreign_keys = ON;')
    const tmp = this.path + '.tmp'
    fs.writeFileSync(tmp, Buffer.from(data))
    fs.renameSync(tmp, this.path)
    this.dirty = false
  }

  exec(sql) {
    const s = sql.trim()
    if (/^PRAGMA\s+journal_mode/i.test(s)) return // WAL not needed in sql.js
    const vac = /^VACUUM\s+INTO\s+'(.*)'/is.exec(s)
    if (vac) {
      const data = this.db.export()
      this.db.run('PRAGMA foreign_keys = ON;')
      fs.writeFileSync(vac[1].replace(/''/g, "'"), Buffer.from(data))
      return
    }
    const u = s.replace(/;$/, '').toUpperCase()
    this.db.exec(sql)
    if (u === 'BEGIN') {
      this.inTx = true
      return
    }
    if (u === 'COMMIT' || u === 'ROLLBACK') {
      this.inTx = false
    }
    if (u !== 'ROLLBACK') this._wrote()
  }

  prepare(sql) {
    return new Statement(this, sql)
  }

  close() {
    this.inTx = false
    this.flush()
    process.removeListener('exit', this._onExit)
    this.db.close()
  }
}