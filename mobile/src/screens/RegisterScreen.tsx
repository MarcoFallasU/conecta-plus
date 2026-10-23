import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { Screen } from '../components/Screen'
import { Section } from '../components/Section'
import { TextField } from '../components/TextField'
import type { Role } from '../context/RoleContext'
import { useAppData } from '../context/AppDataContext'
import { ROLES, ROLE_INFO } from '../data/roles'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { createStyles } from './RegisterScreen.styles'

interface Notice {
  tone: 'info' | 'error'
  message: string
}

export function RegisterScreen() {
  const { signInWithGoogle } = useAppData()
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)
  const [role, setRole] = useState<Role>('adulto_mayor')
  const [organization, setOrganization] = useState('')
  const [organizationError, setOrganizationError] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(false)

  const isOrganization = role === 'empresa'

  async function handleGoogle() {
    if (loading) return
    if (isOrganization && organization.trim().length < 2) {
      setOrganizationError('Escribe el nombre de la organización.')
      return
    }
    setOrganizationError('')
    setNotice(null)
    setLoading(true)
    // Con el rol elegido se crea la cuenta; si ese correo de Google ya tenía cuenta, entra a ella.
    const result = await signInWithGoogle({ role, name: isOrganization ? organization : undefined })
    setLoading(false)
    if (!result.ok) setNotice({ tone: result.error === 'cancelled' ? 'info' : 'error', message: result.message })
  }

  return (
    <Screen>
      <Section title="¿Cómo vas a usar la app?">
        {ROLES.map((option) => {
          const info = ROLE_INFO[option]
          const selected = role === option

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              aria-selected={selected}
              accessibilityLabel={`${info.title}. ${info.description}`}
              onPress={() => setRole(option)}
              style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.optionPressed]}
            >
              <Ionicons name={info.icon} size={Math.round(display.baseFontSize * 1.8)} color={display.colors.azul} />
              <View style={styles.optionText}>
                <AppText variant="subtitle">{info.title}</AppText>
                <AppText variant="caption">{info.description}</AppText>
              </View>
              {selected && <Ionicons name="checkmark-circle" size={Math.round(display.baseFontSize * 1.5)} color={display.colors.azul} />}
            </Pressable>
          )
        })}
      </Section>

      <View style={styles.form}>
        {isOrganization && (
          <TextField
            label="Nombre de la organización"
            value={organization}
            onChangeText={setOrganization}
            error={organizationError}
          />
        )}
        <AppText>Usaremos tu cuenta de Google para crear tu perfil. No guardamos ninguna contraseña.</AppText>
        {notice ? <Banner tone={notice.tone}>{notice.message}</Banner> : null}
        <Button
          label={loading ? 'Abriendo Google…' : 'Registrarme con Google'}
          icon="logo-google"
          disabled={loading}
          onPress={handleGoogle}
        />
      </View>
    </Screen>
  )
}
