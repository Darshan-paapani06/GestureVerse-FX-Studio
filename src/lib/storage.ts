import { DEFAULT_SETTINGS } from '../data/effects'
import type { StudioSettings } from '../types/studio'

const SETTINGS_KEY = 'gestureverse.settings.v1'

export function loadSettings(): StudioSettings {
  try {
    const value = localStorage.getItem(SETTINGS_KEY)
    if (!value) return DEFAULT_SETTINGS
    const parsed = JSON.parse(value) as Partial<StudioSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      effectColorOverrides: { ...DEFAULT_SETTINGS.effectColorOverrides, ...parsed.effectColorOverrides },
      gestureMappings: { ...DEFAULT_SETTINGS.gestureMappings, ...parsed.gestureMappings }
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: StudioSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
