import { Image, Pressable, View } from 'react-native'
import type { Activity } from '../data/types'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { isFull, spotsLeft as spotsLeftOf } from '../utils/capacity'
import { friendlyDate } from '../utils/dates'
import { formatDistance } from '../utils/geo'
import { attendeesLabel } from '../utils/text'
import { AppText } from './AppText'
import { Badge } from './Badge'
import { MetaRow } from './MetaRow'
import { createStyles } from './ActivityCard.styles'

interface ActivityCardProps {
  activity: Activity
  attendeesCount: number
  // Etiqueta destacada en verde (ej. "Asististe", "Porque te gusta el baile").
  badge?: string
  // Distancia desde la zona de quien mira; solo se muestra si se conoce.
  distanceKm?: number | null
  onPress: () => void
}

const FEW_SPOTS = 3

export function ActivityCard({ activity, attendeesCount, badge, distanceKm, onPress }: ActivityCardProps) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)
  const isVertical = display.cardLayout === 'vertical'
  const when = friendlyDate(activity.startsAt)
  const cancelled = activity.status === 'cancelada'
  const spotsLeft = spotsLeftOf(activity, attendeesCount)
  const full = isFull(activity, attendeesCount)
  const fewSpots = !full && spotsLeft !== null && spotsLeft <= FEW_SPOTS

  const a11yParts = [activity.title, when, activity.place]
  if (cancelled) a11yParts.push('cancelada')
  else if (full) a11yParts.push('cupo lleno')

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yParts.join(', ')}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.inner, !isVertical && styles.innerHorizontal, cancelled && styles.innerCancelled]}>
        <Image
          source={{ uri: activity.imageUrl }}
          style={[styles.image, isVertical ? styles.imageVertical : styles.imageHorizontal]}
          accessibilityIgnoresInvertColors
        />
        <View style={styles.body}>
          {(activity.featured || badge || cancelled || full || fewSpots) && (
            <View style={styles.badges}>
              {cancelled && <Badge label="Cancelada" tone="danger" />}
              {!cancelled && activity.featured && <Badge label="Destacado" tone="accent" />}
              {!cancelled && full && <Badge label="Cupo lleno" tone="danger" />}
              {!cancelled && fewSpots && <Badge label={spotsLeft === 1 ? 'Queda 1 cupo' : `Quedan ${spotsLeft} cupos`} />}
              {badge && <Badge label={badge} tone="success" />}
            </View>
          )}
          <AppText variant="subtitle" numberOfLines={display.cardMaxTextLines}>
            {activity.title}
          </AppText>
          {display.showCardDetails && <AppText numberOfLines={display.cardMaxTextLines}>{activity.description}</AppText>}
          <MetaRow icon="calendar-outline" text={when} />
          <MetaRow icon="location-outline" text={activity.place} />
          {distanceKm !== null && distanceKm !== undefined && <MetaRow icon="navigate-outline" text={formatDistance(distanceKm)} />}
          {display.showCardDetails && <MetaRow icon="people-outline" text={attendeesLabel(attendeesCount)} />}
        </View>
      </View>
    </Pressable>
  )
}
