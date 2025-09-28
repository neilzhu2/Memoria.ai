import 'react-native-reanimated'
import { TamaguiProvider, Theme, YStack } from 'tamagui'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import config from '../tamagui.config'
import { Slot } from 'expo-router'
import { useSettings } from '../stores/useSettings'

export default function RootLayout() {
  const theme = useSettings((s) => s.theme)
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={config}>
        <Theme name={theme}>
          <YStack flex={1} backgroundColor="$background">
            <Slot />
          </YStack>
        </Theme>
      </TamaguiProvider>
    </GestureHandlerRootView>
  )
}
