import { StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
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
    accent: { backgroundColor: colors.amarillo },
    success: { backgroundColor: colors.verdeSuave, borderColor: colors.verde },
    neutral: { backgroundColor: colors.azulClaro },
    label: { fontWeight: fontWeight.bold, color: colors.azulOscuro },
  })
