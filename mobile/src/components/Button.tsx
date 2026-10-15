import { Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { IconName } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './Button.styles'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  icon?: IconName
  disabled?: boolean
}

const LABEL_STYLE = { primary: 'labelPrimary', secondary: 'labelSecondary', outline: 'labelOutline', danger: 'labelPrimary' } as const

export function Button({ label, onPress, variant = 'primary', icon, disabled }: ButtonProps) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)
  const iconColor = { primary: display.colors.blanco, secondary: display.colors.azulOscuro, outline: display.colors.azul, danger: display.colors.blanco }[variant]

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, disabled && styles.disabled]}
    >
      {icon && <Ionicons name={icon} size={Math.round(display.baseFontSize * 1.2)} color={iconColor} />}
      <AppText style={[styles.label, styles[LABEL_STYLE[variant]]]}>{label}</AppText>
    </Pressable>
  )
}
