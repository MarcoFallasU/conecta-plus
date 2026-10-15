import { useState } from 'react'
import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { PersonRow } from '../components/PersonRow'
import { Screen } from '../components/Screen'
import { Section } from '../components/Section'
import { TextField } from '../components/TextField'
import { useAppData, useMyProfile } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { ACTIVITY_CATEGORIES } from '../data/categories'
import type { EmergencyContact } from '../data/types'
import { ZONES } from '../data/zones'
import type { RootStackParamList } from '../navigation/types'
import { useCan } from '../permissions/permissions'
import { useRoleStyles } from '../theme/useRoleStyles'
import { createStyles } from './EditProfileScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>

const RELATIONS = ['Hijo/a', 'Pareja', 'Hermano/a', 'Vecino/a', 'Amigo/a', 'Otro']
const MIN_BIRTH_YEAR = 1900

interface FormErrors {
  name?: string
  birthYear?: string
  contact?: string
}

export function EditProfileScreen({ navigation }: Props) {
  const { user } = useSessionUser()
  const { updateProfile } = useAppData()
  const profile = useMyProfile()
  const canEditInterests = useCan('edit_interests')
  const canEditContacts = useCan('manage_emergency_contacts')
  const styles = useRoleStyles(createStyles)

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(profile.phone)
  const [birthYear, setBirthYear] = useState(profile.birthYear ? String(profile.birthYear) : '')
  const [zoneId, setZoneId] = useState<string | null>(profile.zoneId)
  const [interests, setInterests] = useState<string[]>(profile.interests)
  const [contacts, setContacts] = useState<EmergencyContact[]>(profile.emergencyContacts)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactRelation, setContactRelation] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  if (!user) return null

  const toggleInterest = (category: string) =>
    setInterests((prev) => (prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]))

  function handleAddContact() {
    const digits = contactPhone.replace(/\D/g, '')
    if (contactName.trim().length < 2 || digits.length < 7 || !contactRelation) {
      setErrors((prev) => ({ ...prev, contact: 'Escribe el nombre, un teléfono válido y elige quién es.' }))
      return
    }
    setContacts((prev) => [
      ...prev,
      { id: `ec-${Date.now()}`, name: contactName.trim(), phone: contactPhone.trim(), relation: contactRelation },
    ])
    setContactName('')
    setContactPhone('')
    setContactRelation(null)
    setErrors((prev) => ({ ...prev, contact: undefined }))
  }

  function handleSave() {
    const next: FormErrors = {}
    if (name.trim().length < 2) next.name = 'Escribe tu nombre.'
    const year = Number(birthYear)
    const latestYear = new Date().getFullYear() - 18
    if (canEditInterests && birthYear.trim() !== '' && (!Number.isInteger(year) || year < MIN_BIRTH_YEAR || year > latestYear)) {
      next.birthYear = `Escribe un año entre ${MIN_BIRTH_YEAR} y ${latestYear}.`
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    updateProfile(user!.id, {
      name,
      phone: phone.trim(),
      zoneId,
      ...(canEditInterests ? { interests, birthYear: birthYear.trim() === '' ? null : year } : {}),
      ...(canEditContacts ? { emergencyContacts: contacts } : {}),
    })
    navigation.goBack()
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Mis datos</AppText>
        <AppText>Con esta información te mostramos actividades cerca de ti y que te interesan.</AppText>
      </View>

      <View style={styles.form}>
        <TextField label="Nombre" value={name} onChangeText={setName} error={errors.name} />
        <TextField label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="8888-0000" />
        {canEditInterests && (
          <TextField
            label="Año en que naciste"
            value={birthYear}
            onChangeText={setBirthYear}
            keyboardType="number-pad"
            placeholder="1955"
            maxLength={4}
            error={errors.birthYear}
          />
        )}
      </View>

      <Section title="¿Dónde vives?">
        <View style={styles.chips}>
          {ZONES.map((zone) => (
            <Chip key={zone.id} label={zone.name} selected={zoneId === zone.id} onPress={() => setZoneId(zone.id)} />
          ))}
        </View>
      </Section>

      {canEditInterests && (
        <Section title="¿Qué te gusta hacer?">
          <AppText>Elige todo lo que quieras. Te recomendaremos actividades parecidas.</AppText>
          <View style={styles.chips}>
            {ACTIVITY_CATEGORIES.map((category) => (
              <Chip key={category} label={category} selected={interests.includes(category)} onPress={() => toggleInterest(category)} />
            ))}
          </View>
        </Section>
      )}

      {canEditContacts && (
        <Section title="Contactos de emergencia">
          <AppText>Las personas a las que podrías necesitar llamar rápido desde la app.</AppText>
          {contacts.length === 0 ? (
            <Banner tone="info">Aún no tienes contactos. Agrega al menos uno.</Banner>
          ) : (
            contacts.map((contact) => (
              <PersonRow key={contact.id} name={contact.name} subtitle={`${contact.relation} · ${contact.phone}`}>
                <Button
                  variant="outline"
                  icon="trash-outline"
                  label="Quitar contacto"
                  onPress={() => setContacts((prev) => prev.filter((item) => item.id !== contact.id))}
                />
              </PersonRow>
            ))
          )}

          <View style={styles.contactForm}>
            <AppText variant="subtitle">Agregar contacto</AppText>
            <TextField label="Nombre" value={contactName} onChangeText={setContactName} />
            <TextField label="Teléfono" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
            <AppText>¿Quién es?</AppText>
            <View style={styles.chips}>
              {RELATIONS.map((relation) => (
                <Chip key={relation} label={relation} selected={contactRelation === relation} onPress={() => setContactRelation(relation)} />
              ))}
            </View>
            {errors.contact ? <Banner tone="error">{errors.contact}</Banner> : null}
            <Button variant="secondary" icon="add-circle-outline" label="Agregar a mi lista" onPress={handleAddContact} />
          </View>
        </Section>
      )}

      {Object.values(errors).some(Boolean) && <Banner tone="error">Revisa los campos marcados antes de guardar.</Banner>}
      <Button label="Guardar cambios" icon="save-outline" onPress={handleSave} />
    </Screen>
  )
}
