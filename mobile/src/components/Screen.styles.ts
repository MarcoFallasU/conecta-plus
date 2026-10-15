import { StyleSheet } from 'react-native'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: display.colors.crema },
    content: { flexGrow: 1, padding: display.spacing * 1.25, gap: display.spacing * 1.25 },
  })
