import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type RootStackParamList = {
  Welcome: undefined
  Login: undefined
  Register: undefined
  Tabs: undefined
  ActivityDetail: { activityId: string }
  CreateEvent: undefined
  Attendees: { activityId: string }
  FamilyMember: { elderId: string }
  Review: { activityId: string }
}

export type TabParamList = {
  Home: undefined
  Agenda: undefined
  Family: undefined
  Profile: undefined
}

export type AppNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>
