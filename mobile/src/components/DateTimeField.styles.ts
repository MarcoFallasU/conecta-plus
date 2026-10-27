import { StyleSheet } from 'react-native'
import { borderWidth, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    field: { gap: display.spacing / 2 },
  })

// El selector de fecha/hora de la web es un <input> del navegador: lleva estilos CSS, no de React Native.
export function createWebInputStyle(display: RoleDisplayTokens) {
  return {
    fontSize: display.baseFontSize,
    padding: Math.round(display.baseFontSize * 0.7),
    minHeight: display.touchTargetSize,
    borderRadius: radius.md,
    border: `${borderWidth.strong}px solid ${display.colors.azul}`,
    backgroundColor: display.colors.blanco,
    color: display.colors.grisTexto,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    width: '100%',
  }
}
