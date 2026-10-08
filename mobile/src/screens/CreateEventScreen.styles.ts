import { StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    form: { gap: display.spacing },
    group: { gap: display.spacing / 2 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: display.spacing / 2 },
    error: { color: colors.error },
  })
