import { useNavigation } from '@react-navigation/native'
import type { AppNavigation } from './types'

export function useAppNavigation() {
  return useNavigation<AppNavigation>()
}
