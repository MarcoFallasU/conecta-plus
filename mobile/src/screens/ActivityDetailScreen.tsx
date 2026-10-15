import { useEffect, useState } from 'react'
import { Image, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppText } from '../components/AppText'
import { Badge } from '../components/Badge'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { MetaRow } from '../components/MetaRow'
import { PersonRow } from '../components/PersonRow'
import { Screen } from '../components/Screen'
import { Section } from '../components/Section'
import { StarRating } from '../components/StarRating'
import { useAppData, useMyProfile } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { attendanceKey, type Account } from '../data/types'
import { getZone } from '../data/zones'
import type { RootStackParamList } from '../navigation/types'
import { useCan } from '../permissions/permissions'
import { useRoleStyles } from '../theme/useRoleStyles'
import { addDays, dayDiff, endsAt, formatLongDate, formatTime, friendlyDate, isPast } from '../utils/dates'
import { distanceKm, formatDistance } from '../utils/geo'
import { directionsUrl, googleCalendarUrl, openExternal, telUrl } from '../utils/links'
import { speak, stopSpeaking } from '../utils/speech'
import { attendeesLabel } from '../utils/text'
import { createStyles } from './ActivityDetailScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityDetail'>

interface Feedback {
  ok: boolean
  message: string
}

export function ActivityDetailScreen({ navigation, route }: Props) {
  const { user } = useSessionUser()
  const {
    accounts,
    activities,
    enrollments,
    attendance,
    links,
    reviews,
    enroll,
    unenroll,
    confirmAttendance,
    cancelActivity,
    toggleFeatured,
  } = useAppData()
  const profile = useMyProfile()
  const styles = useRoleStyles(createStyles)
  const [showFamily, setShowFamily] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [confirm, setConfirm] = useState<'unenroll' | 'cancel' | null>(null)

  const canRegisterSelf = useCan('register_self')
  const canRegisterOthers = useCan('register_others')
  const canManageAttendees = useCan('manage_attendees')
  const canCancelEvent = useCan('cancel_event')
  const canFeature = useCan('feature_event')
  const canReview = useCan('leave_review')
  const canConfirmAttendance = useCan('confirm_attendance')

  // Si se sale de la pantalla mientras lee, se detiene la voz.
  useEffect(() => () => stopSpeaking(), [])

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
  const cancelled = activity.status === 'cancelada'
  const enrolled = attendees.includes(user.id)
  const isOwner = activity.createdBy === user.id
  const organizer = accounts.find((a) => a.id === activity.createdBy)
  const activityReviews = reviews.filter((r) => r.activityId === activity.id)
  const hasReviewed = activityReviews.some((r) => r.userId === user.id)
  const average = activityReviews.length ? activityReviews.reduce((sum, r) => sum + r.rating, 0) / activityReviews.length : 0
  const myAttendance = attendance[attendanceKey(activity.id, user.id)]
  const spotsLeft = activity.capacity === null ? null : Math.max(0, activity.capacity - attendees.length)
  const full = spotsLeft === 0
  const origin = getZone(profile.zoneId)
  const distance = origin ? distanceKm(origin, activity) : null
  const familyMembers = links
    .filter((l) => l.caregiverId === user.id && l.status === 'active')
    .map((l) => accounts.find((a) => a.id === l.elderId))
    .filter((a): a is Account => !!a)

  const start = new Date(activity.startsAt)
  const end = endsAt(activity.startsAt, activity.durationMinutes)
  const schedule = `${friendlyDate(activity.startsAt)} a ${formatTime(end)}`
  const reminderOn = dayDiff(activity.startsAt) >= 2 ? formatLongDate(addDays(start, -1)) : null

  function handleEnroll(userId: string) {
    const result = enroll(activity!.id, userId)
    setFeedback(result.ok ? null : result)
  }

  function toggleSpeech() {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
      return
    }
    const parts = [activity!.title, `${schedule}.`, `Será en ${activity!.place}.`, activity!.description]
    if (distance !== null) parts.push(`${formatDistance(distance)} de tu zona.`)
    setSpeaking(true)
    speak(parts.join(' '), { onEnd: () => setSpeaking(false) })
  }

  return (
    <Screen>
      <Image source={{ uri: activity.imageUrl }} style={styles.image} accessibilityIgnoresInvertColors />

      <View style={styles.info}>
        <View style={styles.badges}>
          {cancelled && <Badge label="Cancelada" tone="danger" />}
          {!cancelled && activity.featured && <Badge label="Destacado" tone="accent" />}
          {!cancelled && past && <Badge label="Finalizada" />}
          {!cancelled && !past && full && <Badge label="Cupo lleno" tone="danger" />}
          {!cancelled && !past && spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 3 && (
            <Badge label={spotsLeft === 1 ? 'Queda 1 cupo' : `Quedan ${spotsLeft} cupos`} />
          )}
        </View>
        <AppText variant="title">{activity.title}</AppText>
        <MetaRow icon="pricetag-outline" text={activity.category} />
        <MetaRow icon="calendar-outline" text={schedule} />
        <MetaRow icon="location-outline" text={activity.place} />
        {distance !== null && <MetaRow icon="navigate-outline" text={`${formatDistance(distance)} de tu zona`} />}
        <MetaRow icon="people-outline" text={attendeesLabel(attendees.length)} />
        {activity.capacity !== null && <MetaRow icon="ticket-outline" text={`Cupo: ${activity.capacity} personas`} />}
        {organizer && <MetaRow icon="business-outline" text={`Organiza: ${organizer.name}`} />}
      </View>

      <AppText>{activity.description}</AppText>

      <View style={styles.helpers}>
        <Button
          variant="outline"
          icon={speaking ? 'stop-circle-outline' : 'volume-high-outline'}
          label={speaking ? 'Detener lectura' : 'Escuchar esta actividad'}
          onPress={toggleSpeech}
        />
        <Button variant="outline" icon="navigate-outline" label="Cómo llegar" onPress={() => openExternal(directionsUrl(activity))} />
        {!past && !cancelled && (
          <Button variant="outline" icon="calendar-outline" label="Agregar a Google Calendar" onPress={() => openExternal(googleCalendarUrl(activity))} />
        )}
        {!isOwner && organizer?.profile.phone ? (
          <Button variant="outline" icon="call-outline" label="Llamar al organizador" onPress={() => openExternal(telUrl(organizer.profile.phone))} />
        ) : null}
      </View>

      <View style={styles.actions}>
        {cancelled && <Banner tone="error">Esta actividad fue cancelada por la organización.</Banner>}

        {feedback && !feedback.ok && <Banner tone="error">{feedback.message}</Banner>}

        {!past && !cancelled && canRegisterSelf && (
          <>
            {enrolled && (
              <Banner tone="success">
                {reminderOn
                  ? `¡Inscripción confirmada! Te avisaremos el ${reminderOn}.`
                  : `¡Inscripción confirmada! Te esperamos en ${activity.place}.`}
              </Banner>
            )}
            {enrolled ? (
              <Button variant="outline" icon="close-circle-outline" label="Cancelar inscripción" onPress={() => setConfirm('unenroll')} />
            ) : full ? (
              <Banner tone="info">El cupo está lleno. Prueba con otra actividad parecida.</Banner>
            ) : (
              <Button icon="add-circle-outline" label="Inscribirme" onPress={() => handleEnroll(user.id)} />
            )}
          </>
        )}

        {!past && !cancelled && canRegisterOthers && (
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
                        onPress={() => (done ? unenroll(activity.id, member.id) : handleEnroll(member.id))}
                      />
                    </PersonRow>
                  )
                })
              ))}
          </>
        )}

        {past && !cancelled && enrolled && canConfirmAttendance && myAttendance === undefined && (
          <>
            <Banner tone="info">¿Pudiste asistir a esta actividad? Cuéntanos para guardar tu historial.</Banner>
            <Button icon="checkmark-circle-outline" label="Sí, asistí" onPress={() => confirmAttendance(activity.id, user.id, true)} />
            <Button variant="outline" label="No pude ir" onPress={() => confirmAttendance(activity.id, user.id, false)} />
          </>
        )}

        {past && enrolled && myAttendance === 'asistio' && <Banner tone="success">Confirmaste que asististe a esta actividad.</Banner>}
        {past && enrolled && myAttendance === 'no_asistio' && <Banner tone="info">Indicaste que no pudiste asistir.</Banner>}

        {isOwner && canManageAttendees && (
          <Button
            icon="list-outline"
            label={`Ver inscritos (${attendees.length})`}
            onPress={() => navigation.navigate('Attendees', { activityId: activity.id })}
          />
        )}

        {isOwner && canFeature && !past && !cancelled && (
          <Button
            variant="secondary"
            icon="star-outline"
            label={activity.featured ? 'Quitar destacado' : 'Destacar publicación'}
            onPress={() => toggleFeatured(activity.id)}
          />
        )}

        {isOwner && canCancelEvent && !past && !cancelled && (
          <Button variant="outline" icon="ban-outline" label="Cancelar este evento" onPress={() => setConfirm('cancel')} />
        )}

        {past &&
          canReview &&
          enrolled &&
          myAttendance === 'asistio' &&
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

      <ConfirmDialog
        visible={confirm === 'unenroll'}
        title="¿Cancelar tu inscripción?"
        message={`Dejarás de estar inscrito en ${activity.title}. Podrás volver a inscribirte si hay cupo.`}
        confirmLabel="Sí, cancelar inscripción"
        cancelLabel="No, mantenerla"
        destructive
        onConfirm={() => {
          unenroll(activity.id, user.id)
          setConfirm(null)
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        visible={confirm === 'cancel'}
        title="¿Cancelar el evento?"
        message={`Se avisará a las ${attendees.length} personas inscritas en ${activity.title}. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, cancelar evento"
        cancelLabel="No, volver"
        destructive
        onConfirm={() => {
          cancelActivity(activity.id)
          setConfirm(null)
        }}
        onCancel={() => setConfirm(null)}
      />
    </Screen>
  )
}
