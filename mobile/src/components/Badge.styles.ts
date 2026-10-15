import { StyleSheet } from 'react-native'
import { borderWidth, fontWeight, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: display.spacing * 0.75,
      paddingVertical: display.spacing / 4,
      borderRadius: radius.pill,
      borderWidth: borderWidth.hairline,
      borderColor: 'transparent',
    },
    accent: { backgroundColor: display.colors.amarillo },
    success: { backgroundColor: display.colors.verdeSuave, borderColor: display.colors.verde },
    neutral: { backgroundColor: display.colors.azulClaro },
    danger: { backgroundColor: display.colors.errorClaro, borderColor: display.colors.error },
    label: { fontWeight: fontWeight.bold, color: display.colors.azulOscuro },
    labelDanger: { color: display.colors.errorOscuro },
  })
