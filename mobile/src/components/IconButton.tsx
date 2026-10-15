import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { IconName } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './IconButton.styles'

interface IconButtonProps {
  icon: IconName
  // Texto que lee el lector de pantalla; sin texto visible, es obligatorio.
  label: string
  onPress: () => void
  // Contador sobre el ícono (ej. avisos pendientes). 0 no muestra nada.
  badge?: number
  disabled?: boolean
}

export function IconButton({ icon, label, onPress, badge = 0, disabled }: IconButtonProps) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)
  const a11yLabel = badge > 0 ? `${label}, ${badge} sin leer` : label

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={Math.round(display.baseFontSize * 1.4)} color={display.colors.azul} />
      {badge > 0 && (
        <View style={styles.badge}>
          <AppText variant="caption" style={styles.badgeText}>
            {badge > 9 ? '9+' : String(badge)}
          </AppText>
        </View>
      )}
    </Pressable>
  )
}
