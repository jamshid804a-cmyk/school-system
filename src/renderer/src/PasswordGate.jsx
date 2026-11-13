import { useEffect, useState } from 'react'

async function sha256(text) {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/* ---------- Password input with eye toggle ---------- */
function PasswordInput({
  value,
  onChange,
  placeholder,
  className = '',
  autoComplete = 'current-password',
  autoFocus = false
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={className}
        style={{ paddingRight: '2.75rem' }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white"
      >
        {visible ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.477 10.489a3.5 3.5 0 004.984 4.984M9.878 5.099A10.94 10.94 0 0112 5c5 0 9 4.5 10 7-.5 1.4-1.86 3.52-4.02 5.16M6.02 6.02C3.86 7.66 2.5 9.78 2 11.16c1 2.5 5 7 10 7 1.18 0 2.28-.24 3.27-.66" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default function PasswordGate({ children }) {
  const [ready, setReady] = useState(false)
  const [needsUnlock, setNeedsUnlock] = useState(false)
  const [mode, setMode] = useState('unlock') // 'unlock' | 'recovery' | 'setNew'
  const [password, setPassword] = useState('')
  const [recoveryInput, setRecoveryInput] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNew, setConfirmNew] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [storedHash, setStoredHash] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const hash = await window.api.getAppPasswordHash()
        if (hash) {
          setStoredHash(hash)
          setNeedsUnlock(true)
        }
      } catch {
        /* ignore */
      }
      setReady(true)
    })()
  }, [])

  const unlock = async (e) => {
    e.preventDefault()
    const h = await sha256(password)
    if (h === storedHash) setNeedsUnlock(false)
    else {
      setError('Wrong password')
      setPassword('')
    }
  }

  const verifyRecovery = async (e) => {
    e.preventDefault()
    try {
      const storedRecovery = await window.api.getRecoveryHash()
      if (!storedRecovery) {
        setError('No recovery code was set for this app.')
        return
      }
      const h = await sha256(recoveryInput.trim().toUpperCase())
      if (h === storedRecovery) {
        setMode('setNew')
        setError('')
      } else {
        setError('Wrong recovery code')
      }
    } catch (err) {
      setError('Recovery failed: ' + err.message)
    }
  }

  const saveNewPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 4) return setError('Password must be at least 4 characters')
    if (newPassword !== confirmNew) return setError('Passwords do not match')
    try {
      const hash = await sha256(newPassword)
      await window.api.setAppPassword({ hash })
      await window.api.clearRecoveryHash()
      setInfo('Password reset. Please set a new recovery code in Settings → Security.')
      setTimeout(() => setNeedsUnlock(false), 1200)
    } catch (err) {
      setError('Save failed: ' + err.message)
    }
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400">
        Loading…
      </div>
    )
  }

  if (!needsUnlock) return children

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white/10 p-8 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold">
            {mode === 'unlock' && 'Locked'}
            {mode === 'recovery' && 'Recovery code'}
            {mode === 'setNew' && 'New password'}
          </h1>
          <p className="mt-1 text-sm text-white/70">
            {mode === 'unlock' && 'Enter your password to unlock'}
            {mode === 'recovery' && 'Enter the code you saved when setting the password'}
            {mode === 'setNew' && 'Choose a new password'}
          </p>
        </div>

        {mode === 'unlock' && (
          <form onSubmit={unlock}>
            <PasswordInput
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="Password"
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
            {error && <div className="mt-2 text-xs text-rose-300">{error}</div>}
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 py-3 text-sm font-bold shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"
            >
              Unlock
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('recovery')
                setError('')
              }}
              className="mt-3 w-full text-center text-xs text-white/60 underline hover:text-white/90"
            >
              Forgot password?
            </button>
          </form>
        )}

        {mode === 'recovery' && (
          <form onSubmit={verifyRecovery}>
            <input
              type="text"
              autoFocus
              value={recoveryInput}
              onChange={(e) => {
                setRecoveryInput(e.target.value)
                setError('')
              }}
              placeholder="XXXX-XXXX-XXXX"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center font-mono text-sm tracking-widest text-white outline-none placeholder:text-white/30 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
            {error && <div className="mt-2 text-xs text-rose-300">{error}</div>}
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 py-3 text-sm font-bold shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5"
            >
              Verify code
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('unlock')
                setError('')
              }}
              className="mt-3 w-full text-center text-xs text-white/60 underline hover:text-white/90"
            >
              Back
            </button>
          </form>
        )}

        {mode === 'setNew' && (
          <form onSubmit={saveNewPassword}>
            <PasswordInput
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                setError('')
              }}
              placeholder="New password (min 4)"
              autoFocus
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
            <div className="mt-2">
              <PasswordInput
                value={confirmNew}
                onChange={(e) => {
                  setConfirmNew(e.target.value)
                  setError('')
                }}
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
            {error && <div className="mt-2 text-xs text-rose-300">{error}</div>}
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-sm font-bold shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5"
            >
              Save new password
            </button>
          </form>
        )}

        {info && (
          <div className="mt-3 rounded-lg bg-emerald-500/20 px-3 py-2 text-center text-xs text-emerald-100">
            {info}
          </div>
        )}
      </div>
    </div>
  )
}