import { StyleSheet } from 'react-native'
import { borderWidth, fontWeight, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    root: {
      gap: display.spacing / 2,
      padding: display.spacing,
      backgroundColor: display.colors.blanco,
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: display.colors.line,
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: display.spacing / 2 },
    title: { flex: 1, textAlign: 'center', textTransform: 'capitalize' },
    weekRow: { flexDirection: 'row' },
    weekday: { width: `${100 / 7}%`, textAlign: 'center', fontWeight: fontWeight.bold, color: display.colors.grisMedio },
    cell: { width: `${100 / 7}%`, padding: 2 },
    day: {
      minHeight: Math.round(display.touchTargetSize * 1.05),
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      borderRadius: radius.md,
      borderWidth: borderWidth.strong,
      borderColor: 'transparent',
    },
    dayToday: { borderColor: display.colors.azul },
    daySelected: { backgroundColor: display.colors.azul, borderColor: display.colors.azul },
    dayPressed: { opacity: 0.8 },
    dayNumber: { textAlign: 'center' },
    dayNumberMarked: { fontWeight: fontWeight.bold, color: display.colors.azul },
    dayNumberSelected: { color: display.colors.blanco },
    dots: { flexDirection: 'row', gap: 3, height: 8 },
    dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: display.colors.terracota },
    dotSelected: { backgroundColor: display.colors.amarillo },
  })
