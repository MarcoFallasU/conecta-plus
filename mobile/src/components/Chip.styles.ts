import { StyleSheet } from 'react-native'
import { borderWidth, fontWeight, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    chip: {
      minHeight: display.touchTargetSize,
      paddingHorizontal: display.spacing * 1.25,
      borderRadius: radius.pill,
      borderWidth: borderWidth.strong,
      borderColor: display.colors.azul,
      backgroundColor: display.colors.blanco,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: { backgroundColor: display.colors.azul },
    pressed: { opacity: 0.85 },
    label: { fontWeight: fontWeight.medium, color: display.colors.azul },
    labelSelected: { color: display.colors.blanco },
  })
