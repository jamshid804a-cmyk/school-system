import { useState, useEffect } from 'react'

export default function License({ onActivated }) {
  const [machineId, setMachineId] = useState('')
  const [key, setKey] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Get the unique machine ID from Electron
    window.api.getMachineId().then((id) => setMachineId(id))
  }, [])

  const activate = async () => {
    const success = await window.api.activateLicense({ machineId, key })
    if (success) {
      onActivated()
    } else {
      setError('Invalid license key for this computer.')
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <div className="w-[450px] rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-slate-800">License Activation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Send the Machine ID below to the developer to get your license key.
        </p>

        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase">Your Machine ID</div>
          <div className="font-mono text-xl font-bold text-teal-700 mt-1 select-all">
            {machineId || 'Loading...'}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1">License Key</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="Paste your key here"
          />
        </div>

        {error && <div className="mt-2 text-sm font-semibold text-rose-600">{error}</div>}

        <button
          onClick={activate}
          disabled={!machineId || !key}
          className="mt-5 w-full rounded-xl bg-teal-700 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          Activate Software
        </button>
      </div>
    </div>
  )
}