import { useState } from 'react'
import { Image, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { DateTimeField } from '../components/DateTimeField'
import { EmptyState } from '../components/EmptyState'
import { PersonRow } from '../components/PersonRow'
import { Screen } from '../components/Screen'
import { TextField } from '../components/TextField'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { ACTIVITY_CATEGORIES } from '../data/categories'
import type { PlaceResult } from '../data/types'
import type { RootStackParamList } from '../navigation/types'
import { useCan } from '../permissions/permissions'
import { CREATE_EVENT_REPUTATION_THRESHOLD } from '../permissions/reputation'
import { useRoleStyles } from '../theme/useRoleStyles'
import { createStyles } from './CreateEventScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'CreateEvent'>

const MAX_CAPACITY = 10000
// El servidor acepta hasta ~5 MB; se avisa antes de enviar una imagen que no pasaría.
const MAX_IMAGE_BASE64 = 7_000_000

interface FormErrors {
  title?: string
  place?: string
  category?: string
  when?: string
  capacity?: string
}

interface PickedImage {
  uri: string
  base64: string
}

export function CreateEventScreen({ navigation }: Props) {
  const { user } = useSessionUser()
  const { createActivity, searchPlaces, usesApi } = useAppData()
  const canCreate = useCan('create_event')
  const styles = useRoleStyles(createStyles)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // Con sesión real, este texto es la búsqueda del lugar; con cuentas demo, el lugar mismo.
  const [placeText, setPlaceText] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  const [capacityText, setCapacityText] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [date, setDate] = useState<Date | null>(null)
  const [time, setTime] = useState<Date | null>(null)
  const [image, setImage] = useState<PickedImage | null>(null)
  const [imageError, setImageError] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!user || !canCreate) {
    return (
      <Screen>
        <EmptyState
          icon="lock-closed-outline"
          title="Aún no puedes crear eventos"
          message={`Necesitas ${CREATE_EVENT_REPUTATION_THRESHOLD} puntos de reputación. Deja reseñas en actividades a las que asististe.`}
        />
      </Screen>
    )
  }

  async function handleSearch() {
    if (searching) return
    const query = placeText.trim()
    if (query.length < 3) {
      setSearchMessage('Escribe al menos 3 letras para buscar.')
      return
    }
    setSearching(true)
    setSearchMessage('')
    setResults([])
    try {
      const found = await searchPlaces(query)
      setResults(found)
      if (found.length === 0) setSearchMessage('No encontramos ese lugar. Prueba con otro nombre o con el distrito.')
    } catch (e) {
      setSearchMessage(e instanceof Error ? e.message : 'No se pudo buscar el lugar.')
    } finally {
      setSearching(false)
    }
  }

  function choosePlace(place: PlaceResult) {
    setSelectedPlace(place)
    setResults([])
    setSearchMessage('')
  }

  async function pickImage() {
    setImageError('')
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.7,
        base64: true,
      })
      if (result.canceled) return
      const asset = result.assets[0]
      if (!asset?.base64) {
        setImageError('No se pudo leer la imagen. Prueba con otra.')
        return
      }
      if (asset.base64.length > MAX_IMAGE_BASE64) {
        setImageError('La imagen es muy pesada. Elige una de menos de 5 MB.')
        return
      }
      setImage({ uri: asset.uri, base64: asset.base64 })
    } catch {
      setImageError('No se pudo abrir tu galería.')
    }
  }

  async function handleSubmit() {
    if (submitting) return
    const next: FormErrors = {}
    if (title.trim().length < 3) next.title = 'Escribe un título de al menos 3 letras.'
    if (usesApi) {
      if (!selectedPlace) next.place = 'Busca y elige un lugar de la lista.'
    } else if (placeText.trim().length < 3) {
      next.place = 'Indica dónde será el evento.'
    }
    if (!category) next.category = 'Elige una categoría.'

    let startsAt: Date | null = null
    if (!date || !time) {
      next.when = 'Elige el día y la hora.'
    } else {
      startsAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), 0, 0)
      if (startsAt.getTime() <= Date.now()) next.when = 'La fecha y la hora deben ser futuras.'
    }

    if (capacityText) {
      const capacity = Number(capacityText)
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > MAX_CAPACITY) {
        next.capacity = `Escribe un número entre 1 y ${MAX_CAPACITY}.`
      }
    }
    setErrors(next)
    setServerError('')
    if (Object.keys(next).length > 0 || !startsAt) return

    setSubmitting(true)
    const result = await createActivity({
      title: title.trim(),
      description: description.trim() || 'Sin descripción.',
      category: category!,
      startsAt: startsAt.toISOString(),
      place:
        usesApi && selectedPlace
          ? { name: selectedPlace.name, address: selectedPlace.address, lat: selectedPlace.lat, lng: selectedPlace.lng }
          : { name: placeText.trim() },
      capacity: capacityText ? Number(capacityText) : undefined,
      image: image?.base64,
      imageUri: image?.uri,
      createdBy: user!.id,
    })
    setSubmitting(false)

    if (!result.ok || !result.activity) {
      setServerError(result.message || 'No se pudo publicar el evento.')
      return
    }
    navigation.replace('ActivityDetail', { activityId: result.activity.id })
  }

  return (
    <Screen>
      <View style={styles.form}>
        <TextField label="Título del evento" value={title} onChangeText={setTitle} error={errors.title} />
        <TextField label="Descripción (opcional)" value={description} onChangeText={setDescription} multiline />

        <View style={styles.group}>
          <AppText variant="subtitle">Imagen de la actividad (opcional)</AppText>
          {image ? (
            <>
              <Image
                source={{ uri: image.uri }}
                style={{ width: '100%', aspectRatio: 1.6, borderRadius: 12 }}
                accessibilityIgnoresInvertColors
              />
              <Button variant="secondary" icon="add-circle-outline" label="Cambiar imagen" onPress={pickImage} />
              <Button variant="outline" icon="close-circle-outline" label="Quitar imagen" onPress={() => setImage(null)} />
            </>
          ) : (
            <Button variant="secondary" icon="add-circle-outline" label="Elegir imagen" onPress={pickImage} />
          )}
          <AppText variant="caption">Si no eliges una, se usará una imagen de ejemplo.</AppText>
          {imageError ? <AppText variant="caption" style={styles.error}>{imageError}</AppText> : null}
        </View>

        {usesApi ? (
          <View style={styles.group}>
            <AppText variant="subtitle">Lugar</AppText>
            {selectedPlace ? (
              <PersonRow
                name={selectedPlace.name}
                subtitle={selectedPlace.address}
                badge={{ label: 'Lugar elegido', tone: 'success' }}
              >
                <Button variant="outline" label="Cambiar lugar" onPress={() => setSelectedPlace(null)} />
              </PersonRow>
            ) : (
              <>
                <TextField
                  label="Buscar lugar"
                  value={placeText}
                  onChangeText={setPlaceText}
                  placeholder="Ej.: Parque Central de San Isidro"
                  error={errors.place}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                <Button
                  variant="secondary"
                  icon="search-outline"
                  label={searching ? 'Buscando…' : 'Buscar lugar'}
                  onPress={handleSearch}
                />
                {searchMessage ? <AppText variant="caption">{searchMessage}</AppText> : null}
                {results.map((result) => (
                  <PersonRow key={`${result.lat},${result.lng},${result.name}`} name={result.name} subtitle={result.address}>
                    <Button label="Elegir este lugar" onPress={() => choosePlace(result)} />
                  </PersonRow>
                ))}
              </>
            )}
          </View>
        ) : (
          <TextField label="Lugar" value={placeText} onChangeText={setPlaceText} error={errors.place} />
        )}

        <TextField
          label="Cupo máximo (opcional)"
          value={capacityText}
          onChangeText={(text) => setCapacityText(text.replace(/\D/g, ''))}
          placeholder="Déjalo vacío si no hay límite"
          keyboardType="number-pad"
          error={errors.capacity}
        />

        <View style={styles.group}>
          <AppText variant="subtitle">Categoría</AppText>
          <View style={styles.chips}>
            {ACTIVITY_CATEGORIES.map((item) => (
              <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />
            ))}
          </View>
          {errors.category ? <AppText variant="caption" style={styles.error}>{errors.category}</AppText> : null}
        </View>

        <View style={styles.group}>
          <DateTimeField label="Día" mode="date" value={date} onChange={setDate} minimumDate={new Date()} />
          <DateTimeField label="Hora" mode="time" value={time} onChange={setTime} />
          {errors.when ? <AppText variant="caption" style={styles.error}>{errors.when}</AppText> : null}
        </View>

        {Object.keys(errors).length > 0 && <Banner tone="error">Revisa los campos marcados antes de publicar.</Banner>}
        {serverError ? <Banner tone="error">{serverError}</Banner> : null}
        <Button
          label={submitting ? 'Publicando…' : 'Publicar evento'}
          icon="megaphone-outline"
          onPress={handleSubmit}
        />
      </View>
    </Screen>
  )
}