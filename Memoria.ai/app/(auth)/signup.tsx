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

export default function SignUpScreen() {
  const colorScheme = useColorScheme();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const borderColor = Colors[colorScheme ?? 'light'].tabIconDefault;
  const tintColor = Colors[colorScheme ?? 'light'].elderlyTabActive;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSignUp = async () => {
    // Validation
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    const { error } = await signUp(email, password, displayName);

    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      Alert.alert(
        'Success',
        'Account created successfully! Please check your email to verify your account.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
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
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: tintColor + '20' }]}>
            <IconSymbol name="person.crop.circle.badge.plus" size={48} color={tintColor} />
          </View>
          <Text style={[styles.title, { color: textColor }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: borderColor }]}>
            Start preserving your precious memories
          </Text>
        </View>

        {/* Sign Up Form */}
        <View style={styles.form}>
          {/* Display Name Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Display Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: borderColor + '10', borderColor: borderColor + '40' }]}>
              <IconSymbol name="person.fill" size={20} color={borderColor} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Your name"
                placeholderTextColor={borderColor}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          </View>

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

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: borderColor + '10', borderColor: borderColor + '40' }]}>
              <IconSymbol name="lock.fill" size={20} color={borderColor} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="At least 8 characters"
                placeholderTextColor={borderColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <IconSymbol
                  name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                  size={20}
                  color={borderColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Confirm Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: borderColor + '10', borderColor: borderColor + '40' }]}>
              <IconSymbol name="lock.fill" size={20} color={borderColor} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Re-enter password"
                placeholderTextColor={borderColor}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <IconSymbol
                  name={showConfirmPassword ? 'eye.slash.fill' : 'eye.fill'}
                  size={20}
                  color={borderColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.signupButton,
              { backgroundColor: tintColor },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={loading}
            accessibilityLabel="Create account"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: borderColor }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleBackToLogin} disabled={loading}>
              <Text style={[styles.loginLink, { color: tintColor }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
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
  signupButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});
