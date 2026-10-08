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
import { colors } from '../theme/colors'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { createStyles } from './RegisterScreen.styles'

interface FormErrors {
  name?: string
  email?: string
  password?: string
}

export function RegisterScreen() {
  const { register } = useAppData()
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)
  const [role, setRole] = useState<Role>('adulto_mayor')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')

  function handleSubmit() {
    const next: FormErrors = {}
    if (name.trim().length < 2) next.name = 'Escribe tu nombre.'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Escribe un correo válido.'
    if (password.length < 6) next.password = 'La contraseña debe tener al menos 6 caracteres.'
    setErrors(next)
    setServerError('')
    if (Object.keys(next).length > 0) return

    const result = register({ name, email, password, role })
    if (!result.ok) setServerError(result.message)
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
              accessibilityState={{ selected }}
              accessibilityLabel={`${info.title}. ${info.description}`}
              onPress={() => setRole(option)}
              style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.optionPressed]}
            >
              <Ionicons name={info.icon} size={Math.round(display.baseFontSize * 1.8)} color={colors.azul} />
              <View style={styles.optionText}>
                <AppText variant="subtitle">{info.title}</AppText>
                <AppText variant="caption">{info.description}</AppText>
              </View>
              {selected && <Ionicons name="checkmark-circle" size={Math.round(display.baseFontSize * 1.5)} color={colors.azul} />}
            </Pressable>
          )
        })}
      </Section>

      <View style={styles.form}>
        <TextField
          label={role === 'empresa' ? 'Nombre de la organización' : 'Nombre completo'}
          value={name}
          onChangeText={setName}
          error={errors.name}
        />
        <TextField
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          autoCapitalize="none"
        />
        {serverError ? <Banner tone="error">{serverError}</Banner> : null}
        <Button label="Crear cuenta" icon="checkmark-circle-outline" onPress={handleSubmit} />
      </View>
    </Screen>
  )
}
