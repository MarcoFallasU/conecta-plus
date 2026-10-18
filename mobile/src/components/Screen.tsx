import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'
import { useRoleStyles } from '../theme/useRoleStyles'
import { createStyles } from './Screen.styles'

interface ScreenProps {
  children: ReactNode
  edges?: Edge[]
}

// Pantallas con header nativo: el área superior ya está resuelta.
const DEFAULT_EDGES: Edge[] = ['left', 'right', 'bottom']
// Pantallas dentro de las pestañas: sin header, la barra inferior cubre el borde de abajo.
export const TAB_EDGES: Edge[] = ['top', 'left', 'right']
// Pantallas sin header ni barra inferior (bienvenida).
export const FULL_EDGES: Edge[] = ['top', 'left', 'right', 'bottom']

export function Screen({ children, edges = DEFAULT_EDGES }: ScreenProps) {
  const styles = useRoleStyles(createStyles)

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}
