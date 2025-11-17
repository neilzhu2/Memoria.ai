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
      {/* Test Connection - Top Right Corner */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={handleTestConnection}
        accessibilityLabel="Test Supabase connection"
        accessibilityRole="button"
      >
        <IconSymbol name="wrench.fill" size={20} color={subtextColor} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
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
  testButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    zIndex: 10,
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
  logo: {
    width: 140,
    height: 140,
    marginBottom: 24,
    borderRadius: 28,
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
    gap: 12,
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
});
