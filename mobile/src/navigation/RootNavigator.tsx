import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { LoadingState } from '../components/LoadingState'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { ActivityDetailScreen } from '../screens/ActivityDetailScreen'
import { AttendeesScreen } from '../screens/AttendeesScreen'
import { CreateEventScreen } from '../screens/CreateEventScreen'
import { EditProfileScreen } from '../screens/EditProfileScreen'
import { FamilyMemberScreen } from '../screens/FamilyMemberScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { NoticesScreen } from '../screens/NoticesScreen'
import { ProgressScreen } from '../screens/ProgressScreen'
import { RegisterScreen } from '../screens/RegisterScreen'
import { ReviewScreen } from '../screens/ReviewScreen'
import { WelcomeScreen } from '../screens/WelcomeScreen'
import { fontWeight, typeScale } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import { TabsNavigator } from './TabsNavigator'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  const { user } = useSessionUser()
  const { restoring } = useAppData()
  const display = useRoleDisplay()

  const screenOptions: NativeStackNavigationOptions = {
    headerStyle: { backgroundColor: display.colors.crema },
    headerTintColor: display.colors.azul,
    headerShadowVisible: false,
    headerTitleStyle: {
      fontSize: Math.round(display.baseFontSize * typeScale.subtitle),
      fontWeight: fontWeight.bold,
    },
    contentStyle: { backgroundColor: display.colors.crema },
  }

  // Mientras se revisa si hay una sesión guardada no se muestra la bienvenida (evita el parpadeo).
  if (restoring) return <LoadingState message="Abriendo Conecta+…" />

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
            <Stack.Screen name="Notices" component={NoticesScreen} options={{ title: 'Mis avisos' }} />
            <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: 'Mi resumen' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Mis datos' }} />
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
