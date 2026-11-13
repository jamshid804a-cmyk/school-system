import { ipcMain } from 'electron'
import { getDb } from './database'

export function registerSettingsHandlers() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)

  // Return ALL settings as a simple { key: value } object
  ipcMain.handle('settings:getAll', () => {
    const rows = db.prepare('SELECT key, value FROM settings').all()
    const obj = {}
    rows.forEach((r) => {
      obj[r.key] = r.value
    })
    return obj
  })

  // Set one or many
  ipcMain.handle('settings:set', (_, patch) => {
    const stmt = db.prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`
    )
    db.exec('BEGIN')
    try {
      Object.entries(patch).forEach(([k, v]) => stmt.run(k, v == null ? '' : String(v)))
      db.exec('COMMIT')
    } catch (e) {
      db.exec('ROLLBACK')
      throw e
    }
    return true
  })

  // Password
  ipcMain.handle('settings:setPassword', (_, { hash }) => {
    db.prepare(
      `INSERT INTO settings (key, value) VALUES ('passwordHash', ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`
    ).run(hash || '')
    db.prepare(
      `INSERT INTO settings (key, value) VALUES ('passwordEnabled', '1')
       ON CONFLICT(key) DO UPDATE SET value='1'`
    ).run()
    return true
  })

  ipcMain.handle('settings:removePassword', () => {
    db.prepare(`DELETE FROM settings WHERE key IN ('passwordHash', 'passwordEnabled')`).run()
    return true
  })

  ipcMain.handle('settings:getPasswordHash', () => {
    const row = db.prepare(`SELECT value FROM settings WHERE key='passwordHash'`).get()
    return row?.value || ''
  })

  // Recovery code
  ipcMain.handle('settings:setRecovery', (_, { hash }) => {
    db.prepare(
      `INSERT INTO settings (key, value) VALUES ('recoveryHash', ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`
    ).run(hash || '')
    return true
  })

  ipcMain.handle('settings:getRecoveryHash', () => {
    const row = db.prepare(`SELECT value FROM settings WHERE key='recoveryHash'`).get()
    return row?.value || ''
  })

  ipcMain.handle('settings:clearRecovery', () => {
    db.prepare(`DELETE FROM settings WHERE key='recoveryHash'`).run()
    return true
  })
}