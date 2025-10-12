import { View, Text } from 'react-native';

// Hidden tab - this should not be accessible
export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Hidden Screen</Text>
    </View>
  );
}