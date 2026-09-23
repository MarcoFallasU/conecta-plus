import { createContext, useContext, useState, type ReactNode } from 'react'

export type Role = 'adulto_mayor' | 'cuidador' | 'empresa'

export interface SessionUser {
  id: string
  name: string
  role: Role
  reputationScore: number
}

interface RoleContextValue {
  user: SessionUser | null
  setUser: (user: SessionUser | null) => void
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)

  return <RoleContext.Provider value={{ user, setUser }}>{children}</RoleContext.Provider>
}

export function useSessionUser() {
  const context = useContext(RoleContext)
  if (!context) throw new Error('useSessionUser debe usarse dentro de un RoleProvider')
  return context
}
