import 'react-native-reanimated'
import { View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Slot } from 'expo-router'
import Toast from 'react-native-toast-message'
import { toastConfig } from '../config/toastConfig'
import { AuthProvider } from '@/contexts/AuthContext'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const backgroundColor = Colors[colorScheme ?? 'light'].background

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <View style={{ flex: 1, backgroundColor }}>
          <Slot />
          <Toast config={toastConfig} />
        </View>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
