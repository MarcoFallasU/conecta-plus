import { StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { fontWeight, lineHeightRatio, typeScale, type TextVariant } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

function size(display: RoleDisplayTokens, variant: TextVariant) {
  const fontSize = Math.round(display.baseFontSize * typeScale[variant])
  return { fontSize, lineHeight: Math.round(fontSize * lineHeightRatio) }
}

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    display: { ...size(display, 'display'), fontWeight: fontWeight.bold, color: colors.azul },
    title: { ...size(display, 'title'), fontWeight: fontWeight.bold, color: colors.azul },
    subtitle: { ...size(display, 'subtitle'), fontWeight: fontWeight.medium, color: colors.azul },
    body: { ...size(display, 'body'), fontWeight: fontWeight.regular, color: colors.grisTexto },
    caption: { ...size(display, 'caption'), fontWeight: fontWeight.regular, color: colors.grisTexto },
  })
