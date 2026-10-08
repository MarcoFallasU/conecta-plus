import { View } from 'react-native'
import { AppText } from '../components/AppText'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Screen, TAB_EDGES } from '../components/Screen'
import { Section } from '../components/Section'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { ROLE_INFO } from '../data/roles'
import { useCan } from '../permissions/permissions'
import { CREATE_EVENT_REPUTATION_THRESHOLD, REVIEW_POINTS } from '../permissions/reputation'
import { useRoleStyles } from '../theme/useRoleStyles'
import { isPast } from '../utils/dates'
import { createStyles } from './ProfileScreen.styles'

export function ProfileScreen() {
  const { user } = useSessionUser()
  const { activities, enrollments, reviews, logout } = useAppData()
  const canRegister = useCan('register_self')
  const canReview = useCan('leave_review')
  const canCreate = useCan('create_event')
  const styles = useRoleStyles(createStyles)

  if (!user) return null

  const mine = activities.filter((a) => enrollments[a.id]?.includes(user.id))
  const published = activities.filter((a) => a.createdBy === user.id)
  const stats = canRegister
    ? [
        { value: mine.filter((a) => !isPast(a.startsAt)).length, label: 'Próximas' },
        { value: mine.filter((a) => isPast(a.startsAt)).length, label: 'Asistidas' },
        { value: reviews.filter((r) => r.userId === user.id).length, label: 'Reseñas' },
      ]
    : [
        { value: published.length, label: 'Eventos publicados' },
        { value: published.reduce((total, a) => total + (enrollments[a.id]?.length ?? 0), 0), label: 'Inscritos en total' },
      ]
  const progress = Math.min(100, Math.round((user.reputationScore / CREATE_EVENT_REPUTATION_THRESHOLD) * 100))

  return (
    <Screen edges={TAB_EDGES}>
      <View style={styles.header}>
        <Avatar name={user.name} size="lg" />
        <AppText variant="title" style={styles.centered}>
          {user.name}
        </AppText>
        <AppText style={styles.centered}>{user.email}</AppText>
        <Badge label={ROLE_INFO[user.role].label} />
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <AppText variant="title">{stat.value}</AppText>
            <AppText variant="caption" style={styles.centered}>
              {stat.label}
            </AppText>
          </View>
        ))}
      </View>

      {canReview && (
        <Section title="Mi reputación">
          <View style={styles.card}>
            <AppText variant="subtitle">{user.reputationScore} puntos</AppText>
            <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: progress }}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <AppText>
              {canCreate
                ? '¡Ya puedes publicar eventos para que otras personas se inscriban!'
                : `Te faltan ${CREATE_EVENT_REPUTATION_THRESHOLD - user.reputationScore} puntos para publicar eventos. Cada reseña en una actividad a la que asististe suma ${REVIEW_POINTS} puntos.`}
            </AppText>
          </View>
        </Section>
      )}

      <Button variant="outline" icon="log-out-outline" label="Cerrar sesión" onPress={logout} />
    </Screen>
  )
}
