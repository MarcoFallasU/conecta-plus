import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './Section.styles'

interface SectionProps {
  title: string
  children: ReactNode
}

export function Section({ title, children }: SectionProps) {
  const styles = useRoleStyles(createStyles)

  return (
    <View style={styles.root}>
      <AppText variant="subtitle" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  )
}
