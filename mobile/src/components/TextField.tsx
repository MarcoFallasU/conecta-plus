import { TextInput, View, type TextInputProps } from 'react-native'
import { colors } from '../theme/colors'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './TextField.styles'

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string
  error?: string
}

export function TextField({ label, error, multiline, ...rest }: TextFieldProps) {
  const styles = useRoleStyles(createStyles)

  return (
    <View style={styles.wrapper}>
      <AppText style={styles.label}>{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.grisMedio}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline, !!error && styles.inputError]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  )
}
