import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const colorScheme = useColorScheme();
  const { user, userProfile, updateProfile, updateEmail, updatePassword, signOut } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);

  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const borderColor = Colors[colorScheme ?? 'light'].tabIconDefault;
  const tintColor = Colors[colorScheme ?? 'light'].elderlyTabActive;
  const errorColor = Colors[colorScheme ?? 'light'].elderlyError;

  // Initialize form with current user data
  useEffect(() => {
    if (visible && user) {
      setDisplayName(userProfile?.display_name || '');
      setEmail(user.email || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setEmailChanged(false);
    }
  }, [visible, user, userProfile]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Validation
    if (newPassword && newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (email !== user?.email && !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    console.log('EditProfileModal: Starting save...');
    setLoading(true);

    // Set a timeout to prevent infinite loading
    const saveTimeout = setTimeout(() => {
      console.warn('EditProfileModal: Save timeout reached');
      setLoading(false);
      Alert.alert('Error', 'Request timed out. Please check your connection and try again.');
    }, 10000);

    try {
      // Update display name if changed
      if (displayName !== userProfile?.display_name) {
        console.log('EditProfileModal: Updating display name to:', displayName);
        const { error } = await updateProfile({ display_name: displayName });
        if (error) {
          console.error('EditProfileModal: Display name update error:', error);
          clearTimeout(saveTimeout);
          Alert.alert('Error', 'Failed to update display name');
          setLoading(false);
          return;
        }
        console.log('EditProfileModal: Display name updated successfully');
      }

      // Update email if changed
      if (email !== user?.email) {
        console.log('EditProfileModal: Updating email');
        const { error } = await updateEmail(email);
        if (error) {
          console.error('EditProfileModal: Email update error:', error);
          clearTimeout(saveTimeout);
          Alert.alert('Error', error.message || 'Failed to update email');
          setLoading(false);
          return;
        }
        setEmailChanged(true);
        console.log('EditProfileModal: Email updated successfully');
      }

      // Update password if provided
      if (newPassword) {
        console.log('EditProfileModal: Updating password');
        const { error } = await updatePassword(newPassword);
        if (error) {
          console.error('EditProfileModal: Password update error:', error);
          clearTimeout(saveTimeout);
          Alert.alert('Error', error.message || 'Failed to update password');
          setLoading(false);
          return;
        }
        console.log('EditProfileModal: Password updated successfully');
      }

      clearTimeout(saveTimeout);
      setLoading(false);
      console.log('EditProfileModal: Save complete!');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (emailChanged) {
        Alert.alert(
          'Email Updated',
          'Please check your new email address for a confirmation link.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: onClose },
        ]);
      }
    } catch (error) {
      clearTimeout(saveTimeout);
      setLoading(false);
      console.error('EditProfileModal: Profile update error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleSignOut = async () => {
    console.log('EditProfileModal: Sign out button pressed');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            console.log('EditProfileModal: User confirmed sign out');
            onClose(); // Close modal first

            // Navigate immediately without waiting for Supabase
            console.log('EditProfileModal: Navigating to welcome');
            router.replace('/welcome');

            // Sign out in background (don't wait for it)
            signOut().catch(err => {
              console.error('EditProfileModal: Sign out error:', err);
            });
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor + '40' }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close"
          >
            <IconSymbol name="xmark" size={24} color={tintColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture Placeholder */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarCircle, { backgroundColor: tintColor + '20' }]}>
              <IconSymbol name="person.fill" size={48} color={tintColor} />
            </View>
            <Text style={[styles.avatarNote, { color: borderColor }]}>
              Profile picture upload coming soon
            </Text>
          </View>

          {/* Display Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Display Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: borderColor + '10', borderColor: borderColor + '40' }]}>
              <IconSymbol name="person.fill" size={20} color={borderColor} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={borderColor}
                editable={!loading}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Email</Text>
            <View style={[styles.inputContainer, { backgroundColor: borderColor + '10', borderColor: borderColor + '40' }]}>
              <IconSymbol name="envelope.fill" size={20} color={borderColor} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor={borderColor}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
            <Text style={[styles.helper, { color: borderColor }]}>
              Changing your email will require verification
            </Text>
          </View>

          {/* Change Password Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Change Password</Text>
            <Text style={[styles.helper, { color: borderColor }]}>
              Leave blank to keep current password
            </Text>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>New Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: borderColor + '10', borderColor: borderColor + '40' }]}>
              <IconSymbol name="lock.fill" size={20} color={borderColor} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={borderColor}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <IconSymbol
                  name={showNewPassword ? 'eye.slash' : 'eye'}
                  size={20}
                  color={borderColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          {newPassword.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Confirm New Password</Text>
              <View style={[styles.inputContainer, { backgroundColor: borderColor + '10', borderColor: borderColor + '40' }]}>
                <IconSymbol name="lock.fill" size={20} color={borderColor} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor={borderColor}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <IconSymbol
                    name={showConfirmPassword ? 'eye.slash' : 'eye'}
                    size={20}
                    color={borderColor}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: tintColor }, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
            accessibilityLabel="Save changes"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: errorColor + '20', borderColor: errorColor }]}
            onPress={handleSignOut}
            disabled={loading}
            accessibilityLabel="Sign out"
            accessibilityRole="button"
          >
            <IconSymbol name="arrow.right.square" size={24} color={errorColor} />
            <Text style={[styles.signOutButtonText, { color: errorColor }]}>Sign Out</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarNote: {
    fontSize: 14,
    fontStyle: 'italic',
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
  eyeButton: {
    padding: 4,
  },
  helper: {
    fontSize: 14,
    marginTop: 8,
  },
  section: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 24,
    gap: 12,
  },
  signOutButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});
