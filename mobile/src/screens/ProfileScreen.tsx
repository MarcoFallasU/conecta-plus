import { useState } from 'react'
import { View } from 'react-native'
import { AppText } from '../components/AppText'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { MetaRow } from '../components/MetaRow'
import { PersonRow } from '../components/PersonRow'
import { ProgressBar } from '../components/ProgressBar'
import { Screen, TAB_EDGES } from '../components/Screen'
import { SegmentedControl } from '../components/SegmentedControl'
import { Section } from '../components/Section'
import { StatCard } from '../components/StatCard'
import { useAppData, useMyProfile } from '../context/AppDataContext'
import { TEXT_SIZE_LABELS, usePreferences, type TextSize } from '../context/PreferencesContext'
import { useSessionUser } from '../context/RoleContext'
import { ROLE_INFO } from '../data/roles'
import { attendanceKey, type EmergencyContact } from '../data/types'
import { getZone } from '../data/zones'
import { useAppNavigation } from '../navigation/useAppNavigation'
import { useCan } from '../permissions/permissions'
import { CREATE_EVENT_REPUTATION_THRESHOLD, REVIEW_POINTS } from '../permissions/reputation'
import { useRoleStyles } from '../theme/useRoleStyles'
import { isPast } from '../utils/dates'
import { openExternal, telUrl } from '../utils/links'
import { ageFromBirthYear } from '../utils/people'
import { createStyles } from './ProfileScreen.styles'

const TEXT_SIZE_OPTIONS = (Object.keys(TEXT_SIZE_LABELS) as TextSize[]).map((value) => ({ value, label: TEXT_SIZE_LABELS[value] }))

export function ProfileScreen() {
  const navigation = useAppNavigation()
  const { user } = useSessionUser()
  const { activities, enrollments, attendance, reviews, logout } = useAppData()
  const profile = useMyProfile()
  const { textSize, highContrast, setTextSize, setHighContrast } = usePreferences()
  const canRegister = useCan('register_self')
  const canReview = useCan('leave_review')
  const canCreate = useCan('create_event')
  const canViewProgress = useCan('view_progress')
  const canEmergency = useCan('manage_emergency_contacts')
  const styles = useRoleStyles(createStyles)
  const [callTarget, setCallTarget] = useState<EmergencyContact | null>(null)

  if (!user) return null

  const mine = activities.filter((a) => enrollments[a.id]?.includes(user.id))
  const published = activities.filter((a) => a.createdBy === user.id)
  const stats = canRegister
    ? [
        { value: mine.filter((a) => !isPast(a.startsAt) && a.status === 'disponible').length, label: 'Próximas' },
        { value: mine.filter((a) => attendance[attendanceKey(a.id, user.id)] === 'asistio').length, label: 'Asistidas' },
        { value: reviews.filter((r) => r.userId === user.id).length, label: 'Reseñas' },
      ]
    : [
        { value: published.length, label: 'Eventos publicados' },
        { value: published.reduce((total, a) => total + (enrollments[a.id]?.length ?? 0), 0), label: 'Inscritos en total' },
      ]
  const progress = Math.min(1, user.reputationScore / CREATE_EVENT_REPUTATION_THRESHOLD)
  const zone = getZone(profile.zoneId)
  const age = ageFromBirthYear(profile.birthYear)

  return (
    <Screen edges={TAB_EDGES}>
      <View style={styles.header}>
        <Avatar name={user.name} size="lg" />
        <AppText variant="title" style={styles.centered}>
          {user.name}
        </AppText>
        <AppText style={styles.centered}>{user.email}</AppText>
        <View style={styles.badgeWrap}>
          <Badge label={ROLE_INFO[user.role].label} />
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <StatCard key={stat.label} value={stat.value} label={stat.label} />
        ))}
      </View>

      <Section title="Mis datos">
        <View style={styles.card}>
          <MetaRow icon="location-outline" text={zone ? zone.name : 'Aún no has elegido tu zona'} />
          {age !== null && <MetaRow icon="gift-outline" text={`${age} años`} />}
          {profile.phone ? <MetaRow icon="call-outline" text={profile.phone} /> : null}
          {profile.interests.length > 0 && <MetaRow icon="heart-outline" text={`Te gusta: ${profile.interests.join(', ').toLowerCase()}`} />}
          <Button variant="outline" icon="create-outline" label="Editar mis datos" onPress={() => navigation.navigate('EditProfile')} />
        </View>
      </Section>

      {canEmergency && (
        <Section title="Contactos de emergencia">
          {profile.emergencyContacts.length === 0 ? (
            <Banner tone="info">Agrega a una persona de confianza para poder llamarla rápido desde Inicio.</Banner>
          ) : (
            profile.emergencyContacts.map((contact) => (
              <PersonRow key={contact.id} name={contact.name} subtitle={`${contact.relation} · ${contact.phone}`}>
                <Button icon="call-outline" label="Llamar" onPress={() => setCallTarget(contact)} />
              </PersonRow>
            ))
          )}
        </Section>
      )}

      {canReview && (
        <Section title="Mi reputación">
          <View style={styles.card}>
            <ProgressBar value={progress} label={`${user.reputationScore} puntos`} valueLabel={`Meta: ${CREATE_EVENT_REPUTATION_THRESHOLD}`} />
            <AppText>
              {canCreate
                ? '¡Ya puedes publicar eventos para que otras personas se inscriban!'
                : `Te faltan ${CREATE_EVENT_REPUTATION_THRESHOLD - user.reputationScore} puntos para publicar eventos. Cada reseña en una actividad a la que asististe suma ${REVIEW_POINTS} puntos.`}
            </AppText>
          </View>
        </Section>
      )}

      <Section title="Cómo ver la app">
        <View style={styles.card}>
          <AppText variant="subtitle">Tamaño de letra</AppText>
          <SegmentedControl options={TEXT_SIZE_OPTIONS} value={textSize} onChange={setTextSize} />
          <AppText variant="subtitle">Colores</AppText>
          <SegmentedControl
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'alto', label: 'Alto contraste' },
            ]}
            value={highContrast ? 'alto' : 'normal'}
            onChange={(value) => setHighContrast(value === 'alto')}
          />
        </View>
      </Section>

      <View style={styles.links}>
        {canViewProgress && <Button variant="secondary" icon="stats-chart-outline" label="Mi resumen" onPress={() => navigation.navigate('Progress')} />}
        <Button variant="secondary" icon="notifications-outline" label="Mis avisos" onPress={() => navigation.navigate('Notices')} />
        <Button variant="outline" icon="log-out-outline" label="Cerrar sesión" onPress={logout} />
      </View>

      <ConfirmDialog
        visible={callTarget !== null}
        title="¿Llamar ahora?"
        message={callTarget ? `Vamos a llamar a ${callTarget.name} (${callTarget.relation}).` : ''}
        confirmLabel="Sí, llamar"
        cancelLabel="No, volver"
        onConfirm={() => {
          if (callTarget) openExternal(telUrl(callTarget.phone))
          setCallTarget(null)
        }}
        onCancel={() => setCallTarget(null)}
      />
    </Screen>
  )
}
