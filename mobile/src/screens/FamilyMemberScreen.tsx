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
import { isOpen } from '../utils/capacity'
import { formatActivityDate, isPast } from '../utils/dates'
import { openExternal, telUrl } from '../utils/links'
import { greetingName } from '../utils/people'
import { createStyles } from './FamilyMemberScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyMember'>

export function FamilyMemberScreen({ navigation, route }: Props) {
  const { user } = useSessionUser()
  const { accounts, activities, enrollments, attendeesCount, links, linksLoading, recommendations, recommend, usesApi } =
    useAppData()
  const canRecommend = useCan('recommend_activity')
  const canViewSummary = useCan('view_family_summary')
  const styles = useRoleStyles(createStyles)

  // El vínculo activo trae el nombre del adulto mayor (del servidor o de la demostración).
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
  // El teléfono es un dato del perfil local: con cuentas reales todavía no se comparte entre personas.
  const elderPhone = accounts.find((a) => a.id === elderId)?.profile.phone

  // Con la API, `enrollments` solo trae las inscripciones del propio usuario y de sus familiares vinculados.
  const upcoming = activities.filter((a) => !isPast(a.startsAt) && isOpen(a))
  const elderActivities = upcoming.filter((a) => enrollments[a.id]?.includes(elderId)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const suggestions = upcoming.filter((a) => !enrollments[a.id]?.includes(elderId)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const alreadyRecommended = (activityId: string) =>
    recommendations.some((r) => r.activityId === activityId && r.fromUserId === user.id && r.toUserId === elderId)

  return (
    <Screen>
      <PersonRow name={elderName} subtitle={ROLE_INFO.adulto_mayor.label} badge={{ label: 'Vinculado', tone: 'success' }}>
        {/* El resumen se arma con la asistencia confirmada, que todavía no se guarda en el servidor. */}
        {canViewSummary && !usesApi && (
          <Button
            variant="secondary"
            icon="stats-chart-outline"
            label="Ver su resumen del mes"
            onPress={() => navigation.navigate('Progress', { userId: elderId })}
          />
        )}
        {elderPhone ? (
          <Button variant="outline" icon="call-outline" label={`Llamar a ${greetingName(elderName)}`} onPress={() => openExternal(telUrl(elderPhone))} />
        ) : null}
      </PersonRow>

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
