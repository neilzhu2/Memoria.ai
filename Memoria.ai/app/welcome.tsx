import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Haptics from 'expo-haptics';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const tintColor = Colors[colorScheme ?? 'light'].elderlyTabActive;
  const subtextColor = Colors[colorScheme ?? 'light'].tabIconDefault;

  const handleGetStarted = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/signup');
  };

  const handleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/login');
  };

  const handleTestConnection = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/test-supabase');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={[styles.logoCircle, { backgroundColor: tintColor + '20' }]}>
            <IconSymbol name="brain.head.profile" size={80} color={tintColor} />
          </View>
          <Text style={[styles.appName, { color: textColor }]}>Memoria</Text>
          <Text style={[styles.tagline, { color: subtextColor }]}>
            Your Life, Your Stories
          </Text>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <Text style={[styles.description, { color: textColor }]}>
            Capture and cherish your precious memories with voice recordings
          </Text>
          <View style={styles.featuresList}>
            <FeatureItem
              icon="mic.fill"
              text="Record your memories"
              textColor={textColor}
              iconColor={tintColor}
            />
            <FeatureItem
              icon="waveform"
              text="Organize by themes"
              textColor={textColor}
              iconColor={tintColor}
            />
            <FeatureItem
              icon="clock.fill"
              text="Revisit anytime"
              textColor={textColor}
              iconColor={tintColor}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: tintColor }]}
            onPress={handleGetStarted}
            accessibilityLabel="Get started with Memoria"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSignIn}
            accessibilityLabel="Sign in to existing account"
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryButtonText, { color: tintColor }]}>
              Already have an account? <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { borderColor: subtextColor }]}
            onPress={handleTestConnection}
            accessibilityLabel="Test Supabase connection"
            accessibilityRole="button"
          >
            <Text style={[styles.testButtonText, { color: subtextColor }]}>
              Test Connection
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface FeatureItemProps {
  icon: string;
  text: string;
  textColor: string;
  iconColor: string;
}

function FeatureItem({ icon, text, textColor, iconColor }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <IconSymbol name={icon} size={24} color={iconColor} />
      <Text style={[styles.featureText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 42,
    fontWeight: '700',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500',
  },
  descriptionSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
    fontWeight: '500',
  },
  featuresList: {
    gap: 16,
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 18,
    fontWeight: '500',
  },
  actionsSection: {
    gap: 16,
  },
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signInLink: {
    fontWeight: '700',
  },
  testButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
