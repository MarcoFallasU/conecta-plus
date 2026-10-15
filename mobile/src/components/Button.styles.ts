import { StyleSheet } from 'react-native'
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
    primary: { backgroundColor: display.colors.azul, borderColor: display.colors.azul },
    secondary: { backgroundColor: display.colors.amarillo, borderColor: display.colors.amarillo },
    outline: { backgroundColor: 'transparent', borderColor: display.colors.azul },
    danger: { backgroundColor: display.colors.error, borderColor: display.colors.error },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.6 },
    label: { fontWeight: fontWeight.bold },
    labelPrimary: { color: display.colors.blanco },
    labelSecondary: { color: display.colors.azulOscuro },
    labelOutline: { color: display.colors.azul },
  })
