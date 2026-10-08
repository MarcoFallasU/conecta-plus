import { Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import type { IconName } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './Button.styles'

type ButtonVariant = 'primary' | 'secondary' | 'outline'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  icon?: IconName
  disabled?: boolean
}

const LABEL_STYLE = { primary: 'labelPrimary', secondary: 'labelSecondary', outline: 'labelOutline' } as const
const ICON_COLOR = { primary: colors.blanco, secondary: colors.azulOscuro, outline: colors.azul } as const

export function Button({ label, onPress, variant = 'primary', icon, disabled }: ButtonProps) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, disabled && styles.disabled]}
    >
      {icon && <Ionicons name={icon} size={Math.round(display.baseFontSize * 1.2)} color={ICON_COLOR[variant]} />}
      <AppText style={[styles.label, styles[LABEL_STYLE[variant]]]}>{label}</AppText>
    </Pressable>
  )
}
