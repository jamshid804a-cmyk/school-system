import { app, ipcMain, dialog, BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'
import { DatabaseSync } from './sqlite-compat'
import path from 'path'
import fs from 'fs'
import { getDb, closeDatabase, initDatabase } from './database'

const dbFile = () => path.join(app.getPath('userData'), 'school.db')
const autoDir = () => path.join(app.getPath('userData'), 'auto-backups')

const stamp = () =>
  new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')

// Make a full, consistent copy of the live database (includes WAL data)
function copyDatabaseTo(target) {
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.rmSync(target, { force: true }) // VACUUM INTO fails if the file exists
  const safe = target.replace(/'/g, "''")
  getDb().exec(`VACUUM INTO '${safe}'`)
}

// Check that a file is a real SQLite database of this app
function validateBackup(file) {
  // 1. SQLite header
  const fd = fs.openSync(file, 'r')
  const buf = Buffer.alloc(15)
  fs.readSync(fd, buf, 0, 15, 0)
  fs.closeSync(fd)
  if (buf.toString('utf8') !== 'SQLite format 3') {
    throw new Error('This is not a valid backup file.')
  }

  // 2. Open a temporary copy (so nothing is created next to the user's file)
  const tmp = path.join(app.getPath('temp'), `restore-check-${Date.now()}.db`)
  fs.copyFileSync(file, tmp)
  let check
  try {
    check = new DatabaseSync(tmp)
    const hasStudents = check
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='students'")
      .get()
    if (!hasStudents) throw new Error('This file is not a backup of this school app.')
    const integrity = check.prepare('PRAGMA integrity_check').get()
    if (Object.values(integrity)[0] !== 'ok') throw new Error('The backup file is damaged.')
  } finally {
    try { check?.close() } catch { /* ignore */ }
    fs.rmSync(tmp, { force: true })
    fs.rmSync(tmp + '-wal', { force: true })
    fs.rmSync(tmp + '-shm', { force: true })
  }
}

export function registerBackupHandlers() {
  /* ---------- Manual backup ---------- */
  ipcMain.handle('backup:create', async (event) => {
    const parent = BrowserWindow.fromWebContents(event.sender)
    const { canceled, filePath } = await dialog.showSaveDialog(parent, {
      title: 'Save Backup',
      defaultPath: `school-backup-${stamp()}.db`,
      filters: [{ name: 'School Backup', extensions: ['db'] }]
    })
    if (canceled || !filePath) return { ok: false, reason: 'Cancelled' }

    try {
      copyDatabaseTo(filePath)
      return { ok: true, filePath }
    } catch (e) {
      return { ok: false, reason: e.message }
    }
  })

  /* ---------- Restore ---------- */
  ipcMain.handle('backup:restore', async (event) => {
    const parent = BrowserWindow.fromWebContents(event.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(parent, {
      title: 'Select Backup File',
      properties: ['openFile'],
      filters: [{ name: 'School Backup', extensions: ['db'] }]
    })
    if (canceled || !filePaths.length) return { ok: false, reason: 'Cancelled' }
    const file = filePaths[0]

    try {
      validateBackup(file)
    } catch (e) {
      return { ok: false, reason: e.message }
    }

    try {
      // Keep this computer's license (a backup from another PC must not lock the app)
      let licenseKey = null
      try {
        licenseKey =
          getDb().prepare('SELECT value FROM settings WHERE key = ?').get('license_key')?.value ||
          null
      } catch { /* settings table may not exist yet */ }

      // Safety copy of the current data
      copyDatabaseTo(path.join(autoDir(), `before-restore-${stamp()}.db`))

      // Replace the database
      closeDatabase()
      const target = dbFile()
      fs.rmSync(target + '-wal', { force: true })
      fs.rmSync(target + '-shm', { force: true })
      fs.copyFileSync(file, target)

      // Put this computer's license back into the restored database
      if (licenseKey) {
        const d = new DatabaseSync(target)
        try {
          d.exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)')
          d.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(
            'license_key',
            licenseKey
          )
        } finally {
          d.close()
        }
      }

      // Restart so every module loads the restored data
      if (is.dev) {
        // In development the dev server stops with the app, so a relaunch gives a white screen
        await dialog.showMessageBox(parent, {
          type: 'info',
          message: 'Restore complete',
          detail: 'Please start the app again (npm run dev).'
        })
        app.exit(0)
      } else {
        app.relaunch()
        app.exit(0)
      }
      return { ok: true }
    } catch (e) {
      try { initDatabase() } catch { /* reopen the old database */ }
      return { ok: false, reason: e.message }
    }
  })
}

/* ---------- Automatic daily backup (keeps the last 7) ---------- */
export function autoBackup() {
  try {
    const dir = autoDir()
    fs.mkdirSync(dir, { recursive: true })
    const today = new Date().toISOString().slice(0, 10)
    const target = path.join(dir, `auto-${today}.db`)
    if (!fs.existsSync(target)) copyDatabaseTo(target)

    const old = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith('auto-'))
      .sort()
      .slice(0, -7)
    old.forEach((f) => fs.rmSync(path.join(dir, f), { force: true }))
  } catch (e) {
    console.error('Auto backup failed:', e)
  }
}