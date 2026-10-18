import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { useSessionUser } from '../context/RoleContext'
import { ActivityDetailScreen } from '../screens/ActivityDetailScreen'
import { AttendeesScreen } from '../screens/AttendeesScreen'
import { CreateEventScreen } from '../screens/CreateEventScreen'
import { FamilyMemberScreen } from '../screens/FamilyMemberScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { RegisterScreen } from '../screens/RegisterScreen'
import { ReviewScreen } from '../screens/ReviewScreen'
import { WelcomeScreen } from '../screens/WelcomeScreen'
import { colors } from '../theme/colors'
import { fontWeight, typeScale } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import { TabsNavigator } from './TabsNavigator'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  const { user } = useSessionUser()
  const display = useRoleDisplay()

  const screenOptions: NativeStackNavigationOptions = {
    headerStyle: { backgroundColor: colors.crema },
    headerTintColor: colors.azul,
    headerShadowVisible: false,
    headerTitleStyle: {
      fontSize: Math.round(display.baseFontSize * typeScale.subtitle),
      fontWeight: fontWeight.bold,
    },
    contentStyle: { backgroundColor: colors.crema },
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {user ? (
          <>
            <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} options={{ title: 'Actividad' }} />
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Crear evento' }} />
            <Stack.Screen name="Attendees" component={AttendeesScreen} options={{ title: 'Inscritos' }} />
            <Stack.Screen name="FamilyMember" component={FamilyMemberScreen} options={{ title: 'Familiar' }} />
            <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Dejar reseña' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar sesión' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
