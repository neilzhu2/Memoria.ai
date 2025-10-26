import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function Index() {
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const tintColor = Colors[colorScheme ?? 'light'].elderlyTabActive;

  useEffect(() => {
    if (loading) return;

    // Navigate based on auth state
    if (user) {
      // User is authenticated, go to main app
      router.replace('/(tabs)');
    } else {
      // User is not authenticated, show welcome screen
      router.replace('/welcome');
    }
  }, [user, loading]);

  // Show loading spinner while checking auth state
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ActivityIndicator size="large" color={tintColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
