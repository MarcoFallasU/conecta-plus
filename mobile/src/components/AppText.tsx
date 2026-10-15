import { Text, type TextProps } from 'react-native'
import type { TextVariant } from '../theme/designSystem'
import { useRoleStyles } from '../theme/useRoleStyles'
import { createStyles } from './AppText.styles'

interface AppTextProps extends TextProps {
  variant?: TextVariant
}

export function AppText({ variant = 'body', style, ...rest }: AppTextProps) {
  const styles = useRoleStyles(createStyles)
  // El tamaño ya lo controla la preferencia de la app; se limita el de sistema para no desbordar.
  return <Text style={[styles[variant], style]} maxFontSizeMultiplier={1.3} {...rest} />
}
