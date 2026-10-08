import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import type { IconName } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './Banner.styles'

type BannerTone = 'info' | 'success' | 'error'

interface BannerProps {
  tone?: BannerTone
  children: ReactNode
}

const ICONS: Record<BannerTone, IconName> = {
  info: 'information-circle',
  success: 'checkmark-circle',
  error: 'alert-circle',
}
const ICON_COLORS: Record<BannerTone, string> = {
  info: colors.azul,
  success: colors.azul,
  error: colors.error,
}
const TEXT_STYLES = { info: 'textInfo', success: 'textSuccess', error: 'textError' } as const

export function Banner({ tone = 'info', children }: BannerProps) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)

  return (
    <View style={[styles.banner, styles[tone]]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name={ICONS[tone]} size={Math.round(display.baseFontSize * 1.4)} color={ICON_COLORS[tone]} />
      <AppText style={[styles.text, styles[TEXT_STYLES[tone]]]}>{children}</AppText>
    </View>
  )
}
