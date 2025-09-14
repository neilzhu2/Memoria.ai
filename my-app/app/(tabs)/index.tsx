import { Button, Paragraph, YStack, H2 } from 'tamagui'
import { useSettings } from '../../stores/useSettings'

export default function Home() {
  const theme = useSettings((s) => s.theme)
  const setTheme = useSettings((s) => s.setTheme)
  const next = theme === 'modern' ? 'classic' : 'modern'

  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="$4"
      gap="$4"
      backgroundColor="$background"
    >
      <H2 color="$color">Welcome 👋</H2>
      <Paragraph color="$color">Theme: {theme}</Paragraph>
      <Button backgroundColor="$primary" color="$background" onPress={() => setTheme(next)}>
        Switch to {next}
      </Button>
    </YStack>
  )
}
