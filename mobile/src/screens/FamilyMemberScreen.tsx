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
  const { activities, enrollments, attendeesCount, links, linksLoading, recommendations, recommend } = useAppData()
  const canRecommend = useCan('recommend_activity')
  const styles = useRoleStyles(createStyles)

  // El vínculo activo trae el nombre del adulto mayor (del servidor o de la demo).
  const link = user
    ? links.find((l) => l.caregiverId === user.id && l.elderId === route.params.elderId && l.status === 'active')
    : undefined

  if (!link && linksLoading) {
    return (
      <Screen>
        <EmptyState icon="time-outline" title="Cargando" message="Estamos buscando el vínculo." />
      </Screen>
    )
  }

  if (!user || !link || !canRecommend) {
    return (
      <Screen>
        <EmptyState icon="lock-closed-outline" title="Sin acceso" message="Necesitas un vínculo activo con esta persona." />
      </Screen>
    )
  }

  const elderId = link.elderId
  const elderName = link.elderName

  // Con la API, `enrollments` solo trae las inscripciones del propio usuario y de sus familiares vinculados.
  const upcoming = activities.filter((a) => !isPast(a.startsAt))
  const elderActivities = upcoming.filter((a) => enrollments[a.id]?.includes(elderId)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const suggestions = upcoming.filter((a) => !enrollments[a.id]?.includes(elderId)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const alreadyRecommended = (activityId: string) =>
    recommendations.some((r) => r.activityId === activityId && r.fromUserId === user.id && r.toUserId === elderId)

  return (
    <Screen>
      <PersonRow name={elderName} subtitle={ROLE_INFO.adulto_mayor.label} badge={{ label: 'Vinculado', tone: 'success' }} />

      <Section title={`Actividades de ${elderName}`}>
        {elderActivities.length === 0 ? (
          <EmptyState icon="calendar-outline" title="Sin actividades próximas" message="Recomiéndale una actividad aquí abajo." />
        ) : (
          elderActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              attendeesCount={attendeesCount(activity.id)}
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
                  onPress={() => recommend(activity.id, user.id, elderId)}
                />
              </View>
            )
          })
        )}
      </Section>
    </Screen>
  )
}