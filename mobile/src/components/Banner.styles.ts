import { StyleSheet } from 'react-native'
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
    info: { backgroundColor: display.colors.azulClaro },
    success: { backgroundColor: display.colors.verdeSuave },
    error: { backgroundColor: display.colors.errorClaro },
    text: { flex: 1 },
    textInfo: { color: display.colors.azulOscuro },
    textSuccess: { color: display.colors.azulOscuro },
    textError: { color: display.colors.errorOscuro },
  })
