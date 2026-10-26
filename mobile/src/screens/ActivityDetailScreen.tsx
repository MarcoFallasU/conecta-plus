import { useState } from 'react'
import { Image, Linking, View } from 'react-native'
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
import type { RootStackParamList } from '../navigation/types'
import { useCan } from '../permissions/permissions'
import { useRoleStyles } from '../theme/useRoleStyles'
import { formatActivityDate, isPast } from '../utils/dates'
import { attendeesLabel } from '../utils/text'
import { createStyles } from './ActivityDetailScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityDetail'>

interface ActionResult {
  ok: boolean
  message: string
}

export function ActivityDetailScreen({ navigation, route }: Props) {
  const { user } = useSessionUser()
  const { accounts, activities, enrollments, links, reviews, attendeesCount, enroll, unenroll, toggleFeatured } =
    useAppData()
  const styles = useRoleStyles(createStyles)
  const [showFamily, setShowFamily] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

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

  // Ejecuta una acción de inscripción o destacado y muestra el error del servidor si falla.
  async function run(action: () => Promise<ActionResult>) {
    if (busy) return
    setBusy(true)
    setActionError('')
    const result = await action()
    setBusy(false)
    if (!result.ok) setActionError(result.message)
  }

  const attendees = enrollments[activity.id] ?? []
  const count = attendeesCount(activity.id)
  const full = activity.status === 'llena'
  const past = isPast(activity.startsAt)
  const enrolled = attendees.includes(user.id)
  const isOwner = activity.createdBy === user.id
  const organizerName = activity.createdByName ?? accounts.find((a) => a.id === activity.createdBy)?.name
  const activityReviews = reviews.filter((r) => r.activityId === activity.id)
  const hasReviewed = activityReviews.some((r) => r.userId === user.id)
  const average = activityReviews.length ? activityReviews.reduce((sum, r) => sum + r.rating, 0) / activityReviews.length : 0
  const familyMembers = links
    .filter((l) => l.caregiverId === user.id && l.status === 'active')
    .map((l) => ({ id: l.elderId, name: l.elderName }))
  const hasCoordinates = activity.lat !== undefined && activity.lng !== undefined
  const capacityText = activity.capacity ? ` · cupo de ${activity.capacity}` : ''

  function openMap() {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${activity!.lat},${activity!.lng}`)
  }

  return (
    <Screen>
      <Image source={{ uri: activity.imageUrl }} style={styles.image} accessibilityIgnoresInvertColors />

      <View style={styles.info}>
        <View style={styles.badges}>
          {activity.featured && <Badge label="Destacado" tone="accent" />}
          {full && !past && <Badge label="Cupo lleno" />}
          {past && <Badge label="Finalizada" />}
        </View>
        <AppText variant="title">{activity.title}</AppText>
        <MetaRow icon="pricetag-outline" text={activity.category} />
        <MetaRow icon="calendar-outline" text={formatActivityDate(activity.startsAt)} />
        <MetaRow icon="location-outline" text={activity.place} />
        {activity.placeAddress && activity.placeAddress !== activity.place ? (
          <AppText variant="caption">{activity.placeAddress}</AppText>
        ) : null}
        <MetaRow icon="people-outline" text={`${attendeesLabel(count)}${capacityText}`} />
        {organizerName ? <MetaRow icon="business-outline" text={`Organiza: ${organizerName}`} /> : null}
      </View>

      {hasCoordinates && <Button variant="outline" icon="location-outline" label="Abrir en el mapa" onPress={openMap} />}

      <AppText>{activity.description}</AppText>

      <View style={styles.actions}>
        {actionError ? <Banner tone="error">{actionError}</Banner> : null}

        {!past && canRegisterSelf && (
          <>
            {enrolled && <Banner tone="success">{`¡Inscripción confirmada! Te esperamos en ${activity.title}.`}</Banner>}
            {!enrolled && full && <Banner tone="info">Esta actividad ya no tiene cupos disponibles.</Banner>}
            <Button
              variant={enrolled ? 'outline' : 'primary'}
              icon={enrolled ? 'close-circle-outline' : 'add-circle-outline'}
              label={enrolled ? 'Cancelar inscripción' : full ? 'Cupo lleno' : 'Inscribirme'}
              disabled={busy || (!enrolled && full)}
              onPress={() => run(() => (enrolled ? unenroll(activity.id, user.id) : enroll(activity.id, user.id)))}
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
                        label={done ? 'Quitar inscripción' : full ? 'Cupo lleno' : 'Inscribir'}
                        disabled={busy || (!done && full)}
                        onPress={() => run(() => (done ? unenroll(activity.id, member.id) : enroll(activity.id, member.id)))}
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
            label={`Ver inscritos (${count})`}
            onPress={() => navigation.navigate('Attendees', { activityId: activity.id })}
          />
        )}

        {isOwner && canFeature && !past && (
          <Button
            variant="secondary"
            icon="star-outline"
            label={activity.featured ? 'Quitar destacado' : 'Destacar publicación'}
            disabled={busy}
            onPress={() => run(() => toggleFeatured(activity.id))}
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