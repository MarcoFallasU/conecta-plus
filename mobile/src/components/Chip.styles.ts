import { StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { borderWidth, fontWeight, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    chip: {
      minHeight: display.touchTargetSize,
      paddingHorizontal: display.spacing * 1.25,
      borderRadius: radius.pill,
      borderWidth: borderWidth.strong,
      borderColor: colors.azul,
      backgroundColor: colors.blanco,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: { backgroundColor: colors.azul },
    pressed: { opacity: 0.85 },
    label: { fontWeight: fontWeight.medium, color: colors.azul },
    labelSelected: { color: colors.blanco },
  })
