import { StyleSheet } from 'react-native'
import { fontWeight, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    root: { flexDirection: 'row', alignItems: 'flex-end', gap: display.spacing / 2 },
    column: { flex: 1, alignItems: 'center', gap: display.spacing / 4 },
    value: { fontWeight: fontWeight.bold, color: display.colors.azul },
    barArea: { width: '100%', height: display.touchTargetSize * 2, justifyContent: 'flex-end' },
    bar: {
      width: '100%',
      backgroundColor: display.colors.verde,
      borderTopLeftRadius: radius.sm,
      borderTopRightRadius: radius.sm,
    },
    barCurrent: { backgroundColor: display.colors.azul },
    barEmpty: { backgroundColor: display.colors.azulClaro },
    label: { textAlign: 'center' },
  })
