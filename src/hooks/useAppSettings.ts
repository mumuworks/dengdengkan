import { useEffect, useState } from 'react'
import { settingsRepository } from '../app/container'
import type { AppSettings } from '../domain/settings'

/** Reads the single AppSettings record (Developer Handoff §4.5). */
export function useAppSettings(): AppSettings | null {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    let cancelled = false
    settingsRepository.get().then((value) => {
      if (!cancelled) setSettings(value)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return settings
}
