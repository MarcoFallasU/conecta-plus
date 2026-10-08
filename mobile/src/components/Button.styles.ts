import { StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { borderWidth, fontWeight, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    base: {
      minHeight: display.touchTargetSize,
      paddingHorizontal: display.spacing * 1.5,
      borderRadius: radius.md,
      borderWidth: borderWidth.strong,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: display.spacing / 2,
    },
    primary: { backgroundColor: colors.azul, borderColor: colors.azul },
    secondary: { backgroundColor: colors.amarillo, borderColor: colors.amarillo },
    outline: { backgroundColor: 'transparent', borderColor: colors.azul },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.6 },
    label: { fontWeight: fontWeight.bold },
    labelPrimary: { color: colors.blanco },
    labelSecondary: { color: colors.azulOscuro },
    labelOutline: { color: colors.azul },
  })
