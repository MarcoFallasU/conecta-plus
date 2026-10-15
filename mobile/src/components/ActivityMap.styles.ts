import { StyleSheet } from 'react-native'
import { borderWidth, fontWeight, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    wrapper: { gap: display.spacing / 2 },
    map: {
      height: display.touchTargetSize * 6.5,
      borderRadius: radius.lg,
      borderWidth: borderWidth.strong,
      borderColor: display.colors.azul,
      backgroundColor: display.colors.mapa,
      overflow: 'hidden',
    },
    river: {
      position: 'absolute',
      left: '-20%',
      top: '58%',
      width: '140%',
      height: display.touchTargetSize * 0.7,
      backgroundColor: display.colors.mapaAgua,
      transform: [{ rotate: '-12deg' }],
      pointerEvents: 'none',
    },
    gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: display.colors.mapaLinea, pointerEvents: 'none' },
    gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: display.colors.mapaLinea, pointerEvents: 'none' },
    origin: { position: 'absolute', alignItems: 'center' },
    originDot: {
      borderRadius: radius.pill,
      backgroundColor: display.colors.terracota,
      borderWidth: borderWidth.strong,
      borderColor: display.colors.blanco,
      alignItems: 'center',
      justifyContent: 'center',
    },
    originLabel: { fontWeight: fontWeight.bold, color: display.colors.azulOscuro },
    pin: {
      position: 'absolute',
      borderRadius: radius.pill,
      borderWidth: borderWidth.strong,
      borderColor: display.colors.azul,
      backgroundColor: display.colors.blanco,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pinFeatured: { backgroundColor: display.colors.amarillo },
    pinSelected: { backgroundColor: display.colors.azul, borderColor: display.colors.azulOscuro, transform: [{ scale: 1.2 }] },
    legend: { textAlign: 'center', color: display.colors.grisMedio },
  })
