import { useEffect, useState } from 'react'

export function useSchoolBrand() {
  const [brand, setBrand] = useState({
    name: '',
    address: '',
    logo: '',
    phone: '',
    email: '',
    principal: ''
  })

  useEffect(() => {
    ;(async () => {
      try {
        const s = await window.api.getSettings()
        setBrand({
          name: s.schoolName || 'School System',
          address: s.schoolAddress || '',
          logo: s.logo || '',
          phone: s.schoolPhone || '',
          email: s.schoolEmail || '',
          principal: s.principalName || ''
        })
      } catch {}
    })()
  }, [])

  return brand
}