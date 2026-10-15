import { StyleSheet } from 'react-native'
import { fontWeight, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    root: { gap: display.spacing / 3 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: display.spacing },
    label: { flex: 1 },
    value: { fontWeight: fontWeight.bold, color: display.colors.azul },
    track: {
      height: Math.round(display.spacing * 0.75),
      borderRadius: radius.pill,
      backgroundColor: display.colors.azulClaro,
      overflow: 'hidden',
    },
    fill: { height: '100%', backgroundColor: display.colors.azul, borderRadius: radius.pill },
  })
