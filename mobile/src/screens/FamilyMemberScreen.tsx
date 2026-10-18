import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ActivityCard } from '../components/ActivityCard'
import { AppText } from '../components/AppText'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { PersonRow } from '../components/PersonRow'
import { Screen } from '../components/Screen'
import { Section } from '../components/Section'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { ROLE_INFO } from '../data/roles'
import type { RootStackParamList } from '../navigation/types'
import { useCan } from '../permissions/permissions'
import { useRoleStyles } from '../theme/useRoleStyles'
import { formatActivityDate, isPast } from '../utils/dates'
import { createStyles } from './FamilyMemberScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyMember'>

export function FamilyMemberScreen({ navigation, route }: Props) {
  const { user } = useSessionUser()
  const { accounts, activities, enrollments, links, recommendations, recommend } = useAppData()
  const canRecommend = useCan('recommend_activity')
  const styles = useRoleStyles(createStyles)

  const elder = accounts.find((a) => a.id === route.params.elderId)
  const linked =
    !!user && links.some((l) => l.caregiverId === user.id && l.elderId === route.params.elderId && l.status === 'active')

  if (!user || !elder || !linked || !canRecommend) {
    return (
      <Screen>
        <EmptyState icon="lock-closed-outline" title="Sin acceso" message="Necesitas un vínculo activo con esta persona." />
      </Screen>
    )
  }

  const upcoming = activities.filter((a) => !isPast(a.startsAt))
  const elderActivities = upcoming.filter((a) => enrollments[a.id]?.includes(elder.id)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const suggestions = upcoming.filter((a) => !enrollments[a.id]?.includes(elder.id)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const alreadyRecommended = (activityId: string) =>
    recommendations.some((r) => r.activityId === activityId && r.fromUserId === user.id && r.toUserId === elder.id)

  return (
    <Screen>
      <PersonRow name={elder.name} subtitle={ROLE_INFO[elder.role].label} badge={{ label: 'Vinculado', tone: 'success' }} />

      <Section title={`Actividades de ${elder.name}`}>
        {elderActivities.length === 0 ? (
          <EmptyState icon="calendar-outline" title="Sin actividades próximas" message="Recomiéndale una actividad aquí abajo." />
        ) : (
          elderActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              attendeesCount={enrollments[activity.id]?.length ?? 0}
              onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
            />
          ))
        )}
      </Section>

      <Section title="Recomendar actividad">
        {suggestions.length === 0 ? (
          <AppText>No hay más actividades para recomendar por ahora.</AppText>
        ) : (
          suggestions.map((activity) => {
            const done = alreadyRecommended(activity.id)

            return (
              <View key={activity.id} style={styles.suggestion}>
                <AppText variant="subtitle">{activity.title}</AppText>
                <AppText variant="caption">{formatActivityDate(activity.startsAt)}</AppText>
                <Button
                  variant={done ? 'outline' : 'secondary'}
                  icon={done ? 'checkmark-circle-outline' : 'heart-outline'}
                  label={done ? 'Recomendada' : 'Recomendar'}
                  disabled={done}
                  onPress={() => recommend(activity.id, user.id, elder.id)}
                />
              </View>
            )
          })
        )}
      </Section>
    </Screen>
  )
}
