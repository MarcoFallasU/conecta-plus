import { StyleSheet } from 'react-native'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: display.spacing },
    headerTexts: { flex: 1, gap: display.spacing / 4 },
    block: { gap: display.spacing },
    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: display.spacing },
    statsRow: { flexDirection: 'row', gap: display.spacing },
  })
