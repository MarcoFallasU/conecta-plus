import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { IconName } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './ActionTile.styles'

interface ActionTileProps {
  icon: IconName
  label: string
  hint?: string
  tone?: 'default' | 'alert'
  onPress: () => void
}

// Acceso grande a una sección o acción frecuente (Inicio). Un toque, un ícono, una
// palabra: la idea es que el adulto mayor no tenga que buscar en menús.
export function ActionTile({ icon, label, hint, tone = 'default', onPress }: ActionTileProps) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)
  const alert = tone === 'alert'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, alert && styles.tileAlert, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, alert && styles.iconWrapAlert]}>
        <Ionicons
          name={icon}
          size={Math.round(display.baseFontSize * 1.6)}
          color={alert ? display.colors.errorOscuro : display.colors.azul}
        />
      </View>
      <AppText variant="subtitle" style={[styles.label, alert && styles.labelAlert]}>
        {label}
      </AppText>
      {hint ? (
        <AppText variant="caption" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </Pressable>
  )
}
