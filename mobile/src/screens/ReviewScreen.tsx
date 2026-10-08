import { useState } from 'react'
import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Screen } from '../components/Screen'
import { StarRating } from '../components/StarRating'
import { TextField } from '../components/TextField'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import type { RootStackParamList } from '../navigation/types'
import { useCan } from '../permissions/permissions'
import { REVIEW_POINTS } from '../permissions/reputation'
import { useRoleStyles } from '../theme/useRoleStyles'
import { isPast } from '../utils/dates'
import { createStyles } from './ReviewScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>

export function ReviewScreen({ navigation, route }: Props) {
  const { user } = useSessionUser()
  const { activities, enrollments, reviews, addReview } = useAppData()
  const canReview = useCan('leave_review')
  const styles = useRoleStyles(createStyles)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const activity = activities.find((a) => a.id === route.params.activityId)
  const allowed =
    !!user &&
    !!activity &&
    canReview &&
    isPast(activity.startsAt) &&
    (enrollments[activity.id] ?? []).includes(user.id) &&
    !reviews.some((r) => r.activityId === activity.id && r.userId === user.id)

  if (!user || !activity || !allowed) {
    return (
      <Screen>
        <EmptyState
          icon="lock-closed-outline"
          title="No puedes reseñar esta actividad"
          message="Solo puedes dejar una reseña en actividades finalizadas a las que asististe."
        />
      </Screen>
    )
  }

  function handleSubmit() {
    addReview({ activityId: activity!.id, userId: user!.id, rating, comment: comment.trim() })
    navigation.goBack()
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">{activity.title}</AppText>
        <AppText>Cuéntanos cómo te fue. Tu reseña ayuda a otras personas a elegir.</AppText>
      </View>

      <View style={styles.form}>
        <AppText variant="subtitle">Tu calificación</AppText>
        <StarRating value={rating} onChange={setRating} />
        <TextField
          label="Comentario (opcional)"
          value={comment}
          onChangeText={setComment}
          placeholder="¿Qué fue lo que más te gustó?"
          multiline
        />
        <Banner tone="info">{`Al publicar tu reseña ganarás ${REVIEW_POINTS} puntos de reputación.`}</Banner>
        <Button label="Publicar reseña" icon="send-outline" disabled={rating === 0} onPress={handleSubmit} />
      </View>
    </Screen>
  )
}
