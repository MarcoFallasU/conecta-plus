import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { Avatar } from './Avatar'
import { Badge, type BadgeTone } from './Badge'
import { createStyles } from './PersonRow.styles'

interface PersonRowProps {
  name: string
  subtitle?: string
  badge?: { label: string; tone?: BadgeTone }
  children?: ReactNode
}

export function PersonRow({ name, subtitle, badge, children }: PersonRowProps) {
  const styles = useRoleStyles(createStyles)

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Avatar name={name} />
        <View style={styles.texts}>
          <AppText variant="subtitle">{name}</AppText>
          {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
          {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
        </View>
      </View>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  )
}
