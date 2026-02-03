import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Haptics from 'expo-haptics';

export default function ResetPasswordScreen() {
  const colorScheme = useColorScheme();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const borderColor = Colors[colorScheme ?? 'light'].tabIconDefault;
  const tintColor = Colors[colorScheme ?? 'light'].elderlyTabActive;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    const { error } = await resetPassword(email);

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Check Your Email',
        'We have sent you a password reset link. Please check your email and follow the instructions.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  const handleBackToLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToLogin}
          disabled={loading}
          accessibilityLabel="Go back"
        >
          <IconSymbol name="chevron.left" size={24} color={tintColor} />
          <Text style={[styles.backText, { color: tintColor }]}>Back to Login</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: tintColor + '20' }]}>
            <IconSymbol name="lock.rotation" size={48} color={tintColor} />
          </View>
          <Text style={[styles.title, { color: textColor }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: borderColor }]}>
            Enter your email address and we'll send you a link to reset your password
          </Text>
        </View>

        {/* Reset Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Email</Text>
            <View style={[styles.inputContainer, { backgroundColor: borderColor + '10', borderColor: borderColor + '40' }]}>
              <IconSymbol name="envelope.fill" size={20} color={borderColor} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="your.email@example.com"
                placeholderTextColor={borderColor}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={[
              styles.resetButton,
              { backgroundColor: tintColor },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleResetPassword}
            disabled={loading}
            accessibilityLabel="Send reset link"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.resetButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  resetButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
