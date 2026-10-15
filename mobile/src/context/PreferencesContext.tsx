import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Preferencias de accesibilidad del dispositivo (no de la cuenta): el tamaño de letra y
// el contraste son decisiones de quien usa el teléfono, así que se guardan localmente.
export type TextSize = 'normal' | 'grande' | 'muy_grande'

export interface Preferences {
  textSize: TextSize
  highContrast: boolean
}

interface PreferencesContextValue extends Preferences {
  setTextSize: (size: TextSize) => void
  setHighContrast: (enabled: boolean) => void
}

const STORAGE_KEY = 'conecta:preferences'
const DEFAULTS: Preferences = { textSize: 'normal', highContrast: false }
const TEXT_SIZES: TextSize[] = ['normal', 'grande', 'muy_grande']

export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  normal: 'Normal',
  grande: 'Grande',
  muy_grande: 'Muy grande',
}

// Multiplicador sobre el tamaño base del rol (ver theme/roleDisplay.ts).
export const TEXT_SIZE_SCALE: Record<TextSize, number> = { normal: 1, grande: 1.15, muy_grande: 1.3 }

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS)

  // El almacenamiento puede no estar disponible (modo privado, web sin permisos):
  // la app funciona igual con los valores por defecto.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return
        const saved = JSON.parse(raw) as Partial<Preferences>
        setPreferences({
          textSize: TEXT_SIZES.includes(saved.textSize as TextSize) ? (saved.textSize as TextSize) : DEFAULTS.textSize,
          highContrast: saved.highContrast === true,
        })
      })
      .catch(() => undefined)
  }, [])

  const update = useCallback((patch: Partial<Preferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch }
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined)
      return next
    })
  }, [])

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...preferences,
      setTextSize: (textSize) => update({ textSize }),
      setHighContrast: (highContrast) => update({ highContrast }),
    }),
    [preferences, update],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences debe usarse dentro de un PreferencesProvider')
  return context
}
