import { useState } from 'react'
import { Image, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppText } from '../components/AppText'
import { Badge } from '../components/Badge'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { MetaRow } from '../components/MetaRow'
import { PersonRow } from '../components/PersonRow'
import { Screen } from '../components/Screen'
import { Section } from '../components/Section'
import { StarRating } from '../components/StarRating'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import type { Account } from '../data/types'
import type { RootStackParamList } from '../navigation/types'
import { useCan } from '../permissions/permissions'
import { useRoleStyles } from '../theme/useRoleStyles'
import { formatActivityDate, isPast } from '../utils/dates'
import { attendeesLabel } from '../utils/text'
import { createStyles } from './ActivityDetailScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityDetail'>

export function ActivityDetailScreen({ navigation, route }: Props) {
  const { user } = useSessionUser()
  const { accounts, activities, enrollments, links, reviews, enroll, unenroll, toggleFeatured } = useAppData()
  const styles = useRoleStyles(createStyles)
  const [showFamily, setShowFamily] = useState(false)

  const canRegisterSelf = useCan('register_self')
  const canRegisterOthers = useCan('register_others')
  const canManageAttendees = useCan('manage_attendees')
  const canFeature = useCan('feature_event')
  const canReview = useCan('leave_review')

  const activity = activities.find((a) => a.id === route.params.activityId)
  if (!user || !activity) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title="Actividad no encontrada" message="Puede que ya no esté disponible." />
      </Screen>
    )
  }

  const attendees = enrollments[activity.id] ?? []
  const past = isPast(activity.startsAt)
  const enrolled = attendees.includes(user.id)
  const isOwner = activity.createdBy === user.id
  const organizer = accounts.find((a) => a.id === activity.createdBy)
  const activityReviews = reviews.filter((r) => r.activityId === activity.id)
  const hasReviewed = activityReviews.some((r) => r.userId === user.id)
  const average = activityReviews.length ? activityReviews.reduce((sum, r) => sum + r.rating, 0) / activityReviews.length : 0
  const familyMembers = links
    .filter((l) => l.caregiverId === user.id && l.status === 'active')
    .map((l) => accounts.find((a) => a.id === l.elderId))
    .filter((a): a is Account => !!a)

  return (
    <Screen>
      <Image source={{ uri: activity.imageUrl }} style={styles.image} accessibilityIgnoresInvertColors />

      <View style={styles.info}>
        <View style={styles.badges}>
          {activity.featured && <Badge label="Destacado" tone="accent" />}
          {past && <Badge label="Finalizada" />}
        </View>
        <AppText variant="title">{activity.title}</AppText>
        <MetaRow icon="pricetag-outline" text={activity.category} />
        <MetaRow icon="calendar-outline" text={formatActivityDate(activity.startsAt)} />
        <MetaRow icon="location-outline" text={activity.place} />
        <MetaRow icon="people-outline" text={attendeesLabel(attendees.length)} />
        {organizer && <MetaRow icon="business-outline" text={`Organiza: ${organizer.name}`} />}
      </View>

      <AppText>{activity.description}</AppText>

      <View style={styles.actions}>
        {!past && canRegisterSelf && (
          <>
            {enrolled && <Banner tone="success">{`¡Inscripción confirmada! Te esperamos en ${activity.title}.`}</Banner>}
            <Button
              variant={enrolled ? 'outline' : 'primary'}
              icon={enrolled ? 'close-circle-outline' : 'add-circle-outline'}
              label={enrolled ? 'Cancelar inscripción' : 'Inscribirme'}
              onPress={() => (enrolled ? unenroll(activity.id, user.id) : enroll(activity.id, user.id))}
            />
          </>
        )}

        {!past && canRegisterOthers && (
          <>
            <Button
              variant="secondary"
              icon="person-add-outline"
              label={showFamily ? 'Ocultar familiares' : 'Inscribir a un familiar'}
              onPress={() => setShowFamily((value) => !value)}
            />
            {showFamily &&
              (familyMembers.length === 0 ? (
                <Banner tone="info">Aún no tienes familiares vinculados. Vincula uno desde la pestaña Familia.</Banner>
              ) : (
                familyMembers.map((member) => {
                  const done = attendees.includes(member.id)

                  return (
                    <PersonRow key={member.id} name={member.name} badge={done ? { label: 'Inscrito', tone: 'success' } : undefined}>
                      <Button
                        variant={done ? 'outline' : 'primary'}
                        label={done ? 'Quitar inscripción' : 'Inscribir'}
                        onPress={() => (done ? unenroll(activity.id, member.id) : enroll(activity.id, member.id))}
                      />
                    </PersonRow>
                  )
                })
              ))}
          </>
        )}

        {isOwner && canManageAttendees && (
          <Button
            icon="list-outline"
            label={`Ver inscritos (${attendees.length})`}
            onPress={() => navigation.navigate('Attendees', { activityId: activity.id })}
          />
        )}

        {isOwner && canFeature && !past && (
          <Button
            variant="secondary"
            icon="star-outline"
            label={activity.featured ? 'Quitar destacado' : 'Destacar publicación'}
            onPress={() => toggleFeatured(activity.id)}
          />
        )}

        {past &&
          canReview &&
          enrolled &&
          (hasReviewed ? (
            <Banner tone="success">Ya dejaste tu reseña. ¡Gracias por compartir tu experiencia!</Banner>
          ) : (
            <Button
              icon="chatbubble-ellipses-outline"
              label="Dejar reseña"
              onPress={() => navigation.navigate('Review', { activityId: activity.id })}
            />
          ))}
      </View>

      <Section title={activityReviews.length ? `Reseñas (${average.toFixed(1)} de 5)` : 'Reseñas'}>
        {activityReviews.length === 0 ? (
          <AppText>Aún no hay reseñas para esta actividad.</AppText>
        ) : (
          activityReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <AppText variant="subtitle" style={styles.reviewName}>
                  {accounts.find((a) => a.id === review.userId)?.name ?? 'Usuario'}
                </AppText>
                <StarRating value={review.rating} />
              </View>
              {review.comment ? <AppText>{review.comment}</AppText> : null}
            </View>
          ))
        )}
      </Section>
    </Screen>
  )
}
