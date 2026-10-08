import { StyleSheet } from 'react-native'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    header: { gap: display.spacing / 2 },
    form: { gap: display.spacing },
    actionRow: { flexDirection: 'row', gap: display.spacing / 2 },
    actionCell: { flex: 1 },
  })
