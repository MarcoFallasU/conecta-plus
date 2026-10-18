import type { Ionicons } from '@expo/vector-icons'

export type IconName = keyof typeof Ionicons.glyphMap

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const

export const borderWidth = { hairline: 1, strong: 2 } as const

export const fontWeight = { regular: '400', medium: '600', bold: '800' } as const

// Los tamaños de texto son múltiplos de `baseFontSize` del rol (ver roleDisplay.ts).
export const typeScale = { display: 1.8, title: 1.4, subtitle: 1.15, body: 1, caption: 0.8 } as const
export type TextVariant = keyof typeof typeScale
export const lineHeightRatio = 1.35

export const shadow = {
  card: {
    shadowColor: '#2F5E5F',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const
