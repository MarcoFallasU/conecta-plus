import { StyleSheet } from 'react-native'
import { borderWidth, fontWeight, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      borderRadius: radius.md,
      borderWidth: borderWidth.strong,
      borderColor: display.colors.azul,
      backgroundColor: display.colors.blanco,
      overflow: 'hidden',
    },
    option: {
      flex: 1,
      minHeight: display.touchTargetSize,
      paddingHorizontal: display.spacing / 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: display.spacing / 3,
    },
    optionDivider: { borderLeftWidth: borderWidth.strong, borderLeftColor: display.colors.azul },
    optionSelected: { backgroundColor: display.colors.azul },
    pressed: { opacity: 0.85 },
    label: { fontWeight: fontWeight.medium, color: display.colors.azul },
    labelSelected: { color: display.colors.blanco },
  })
