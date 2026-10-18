import { Image, Pressable, View } from 'react-native'
import type { Activity } from '../data/types'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { formatActivityDate } from '../utils/dates'
import { attendeesLabel } from '../utils/text'
import { AppText } from './AppText'
import { Badge } from './Badge'
import { MetaRow } from './MetaRow'
import { createStyles } from './ActivityCard.styles'

interface ActivityCardProps {
  activity: Activity
  attendeesCount: number
  badge?: string
  onPress: () => void
}

export function ActivityCard({ activity, attendeesCount, badge, onPress }: ActivityCardProps) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)
  const isVertical = display.cardLayout === 'vertical'
  const when = formatActivityDate(activity.startsAt)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${activity.title}, ${when}, ${activity.place}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.inner, !isVertical && styles.innerHorizontal]}>
        <Image
          source={{ uri: activity.imageUrl }}
          style={[styles.image, isVertical ? styles.imageVertical : styles.imageHorizontal]}
          accessibilityIgnoresInvertColors
        />
        <View style={styles.body}>
          {(activity.featured || badge) && (
            <View style={styles.badges}>
              {activity.featured && <Badge label="Destacado" tone="accent" />}
              {badge && <Badge label={badge} tone="success" />}
            </View>
          )}
          <AppText variant="subtitle" numberOfLines={display.cardMaxTextLines}>
            {activity.title}
          </AppText>
          {display.showCardDetails && <AppText numberOfLines={display.cardMaxTextLines}>{activity.description}</AppText>}
          <MetaRow icon="calendar-outline" text={when} />
          <MetaRow icon="location-outline" text={activity.place} />
          {display.showCardDetails && <MetaRow icon="people-outline" text={attendeesLabel(attendeesCount)} />}
        </View>
      </View>
    </Pressable>
  )
}
