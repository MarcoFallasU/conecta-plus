import { Text, type TextProps } from 'react-native'
import type { TextVariant } from '../theme/designSystem'
import { useRoleStyles } from '../theme/useRoleStyles'
import { createStyles } from './AppText.styles'

interface AppTextProps extends TextProps {
  variant?: TextVariant
}

export function AppText({ variant = 'body', style, ...rest }: AppTextProps) {
  const styles = useRoleStyles(createStyles)
  return <Text style={[styles[variant], style]} {...rest} />
}
