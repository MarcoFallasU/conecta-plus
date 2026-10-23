import { ActivityIndicator, View } from 'react-native'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './LoadingState.styles'

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Cargando…' }: LoadingStateProps) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" color={display.colors.azul} />
      <AppText variant="subtitle">{message}</AppText>
    </View>
  )
}
