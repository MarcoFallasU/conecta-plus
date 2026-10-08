import { StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: display.spacing * 0.75,
      padding: display.spacing,
      borderRadius: radius.md,
    },
    info: { backgroundColor: colors.azulClaro },
    success: { backgroundColor: colors.verdeSuave },
    error: { backgroundColor: colors.errorClaro },
    text: { flex: 1 },
    textInfo: { color: colors.azulOscuro },
    textSuccess: { color: colors.azulOscuro },
    textError: { color: colors.errorOscuro },
  })
