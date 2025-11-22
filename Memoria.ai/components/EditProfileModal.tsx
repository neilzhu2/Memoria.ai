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
  Image,
  ActionSheetIOS,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const colorScheme = useColorScheme();
  const { user, userProfile, updateProfile, updateEmail, updatePassword, signOut } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);

  // Temporary avatar state - holds new image until Save is clicked
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);
  const [pendingAvatarRemoved, setPendingAvatarRemoved] = useState(false);

  // Original values for change detection
  const [originalDisplayName, setOriginalDisplayName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [originalDateOfBirth, setOriginalDateOfBirth] = useState('');
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);

  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const borderColor = Colors[colorScheme ?? 'light'].tabIconDefault;
  const tintColor = Colors[colorScheme ?? 'light'].elderlyTabActive;
  const errorColor = Colors[colorScheme ?? 'light'].elderlyError;

  // Initialize form with current user data
  useEffect(() => {
    if (visible && user) {
      const name = userProfile?.display_name || '';
      const userEmail = user.email || '';
      const avatar = userProfile?.avatar_url || null;
      const dob = userProfile?.date_of_birth || '';

      setDisplayName(name);
      setEmail(userEmail);
      setAvatarUrl(avatar);
      setDateOfBirth(dob);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setEmailChanged(false);

      // Store original values for change detection
      setOriginalDisplayName(name);
      setOriginalEmail(userEmail);
      setOriginalAvatarUrl(avatar);
      setOriginalDateOfBirth(dob);

      // Reset pending states
      setPendingAvatarUri(null);
      setPendingAvatarRemoved(false);
    }
  }, [visible, user, userProfile]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    return (
      displayName !== originalDisplayName ||
      email !== originalEmail ||
      dateOfBirth !== originalDateOfBirth ||
      pendingAvatarUri !== null ||
      pendingAvatarRemoved ||
      newPassword.length > 0
    );
  };

  // Handle close with unsaved changes check
  const handleClose = async () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        'Discard Changes?',
        "You haven't saved your profile changes yet.",
        [
          {
            text: 'Keep Editing',
            style: 'cancel',
          },
          {
            text: 'Discard Changes',
            style: 'destructive',
            onPress: () => {
              // Reset all pending states
              setPendingAvatarUri(null);
              setPendingAvatarRemoved(false);
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAvatarPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Determine if there's a current avatar (either original or pending)
    const hasAvatar = (avatarUrl && !pendingAvatarRemoved) || pendingAvatarUri;

    if (Platform.OS === 'ios') {
      const options = hasAvatar
        ? ['Choose from Library', 'Remove Current Photo', 'Cancel']
        : ['Choose from Library', 'Cancel'];
      const cancelButtonIndex = hasAvatar ? 2 : 1;
      const destructiveButtonIndex = hasAvatar ? 1 : undefined;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
          title: 'Change Profile Photo',
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            await pickImage();
          } else if (hasAvatar && buttonIndex === 1) {
            handleRemoveImage();
          }
        }
      );
    } else {
      // Android fallback using Alert
      const buttons: any[] = [
        {
          text: 'Choose from Library',
          onPress: pickImage,
        },
      ];

      if (hasAvatar) {
        buttons.push({
          text: 'Remove Current Photo',
          style: 'destructive',
          onPress: handleRemoveImage,
        });
      }

      buttons.push({
        text: 'Cancel',
        style: 'cancel',
      });

      Alert.alert('Change Profile Photo', '', buttons);
    }
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to select a photo.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const imageUri = result.assets[0].uri;
    // Store temporarily - don't persist until Save is clicked
    setPendingAvatarUri(imageUri);
    setPendingAvatarRemoved(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Profile Photo?',
      'This will remove your profile photo.',
      [
        {
          text: 'Keep Photo',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPendingAvatarUri(null);
            setPendingAvatarRemoved(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  // Upload avatar and return the public URL (doesn't persist to profile)
  const uploadAvatarToStorage = async (uri: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Resize and compress image
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 400 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // For React Native, we need to create a File-like object from the URI
      const response = await fetch(manipResult.uri);
      const arrayBuffer = await response.arrayBuffer();

      // Convert to Uint8Array for upload
      const fileData = new Uint8Array(arrayBuffer);

      // Generate unique filename with user folder structure
      const fileExt = 'jpg';
      const fileName = `${user.id}/${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      console.log('Uploading avatar:', {
        fileName,
        filePath,
        size: fileData.length,
        userId: user.id,
        bucket: 'Avatars'
      });

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Avatars')
        .upload(filePath, fileData, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload image');
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('Avatars')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
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
    }, 15000); // Increased timeout for avatar upload

    try {
      // Update profile fields if changed
      const profileUpdates: any = {};
      let hasProfileUpdates = false;

      if (displayName !== userProfile?.display_name) {
        profileUpdates.display_name = displayName;
        hasProfileUpdates = true;
      }

      if (dateOfBirth !== userProfile?.date_of_birth) {
        profileUpdates.date_of_birth = dateOfBirth || null;
        hasProfileUpdates = true;
      }

      // Handle avatar changes
      if (pendingAvatarUri) {
        // Upload new avatar
        console.log('EditProfileModal: Uploading new avatar...');
        try {
          const newAvatarUrl = await uploadAvatarToStorage(pendingAvatarUri);
          if (newAvatarUrl) {
            profileUpdates.avatar_url = newAvatarUrl;
            hasProfileUpdates = true;
            console.log('EditProfileModal: Avatar uploaded successfully');
          }
        } catch (uploadError) {
          clearTimeout(saveTimeout);
          setLoading(false);
          Alert.alert('Upload Failed', 'Failed to upload profile picture. Please try again.');
          return;
        }
      } else if (pendingAvatarRemoved) {
        // Remove avatar
        profileUpdates.avatar_url = null;
        hasProfileUpdates = true;
        console.log('EditProfileModal: Removing avatar');
      }

      if (hasProfileUpdates) {
        console.log('EditProfileModal: Updating profile with:', profileUpdates);
        const { error } = await updateProfile(profileUpdates);
        if (error) {
          console.error('EditProfileModal: Profile update error:', error);
          clearTimeout(saveTimeout);
          Alert.alert('Error', 'Failed to update profile');
          setLoading(false);
          return;
        }
        console.log('EditProfileModal: Profile updated successfully');
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
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor + '40' }]}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            accessibilityLabel="Close"
          >
            <IconSymbol name="xmark" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Edit Profile</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={!hasUnsavedChanges() || loading}
            accessibilityLabel="Save changes"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color={tintColor} size="small" />
            ) : (
              <Text
                style={[
                  styles.saveButtonText,
                  {
                    color: hasUnsavedChanges() ? tintColor : borderColor,
                    opacity: hasUnsavedChanges() ? 1 : 0.5,
                  },
                ]}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              disabled={loading}
              style={[styles.avatarCircle, { backgroundColor: tintColor + '20' }]}
              accessibilityLabel="Change profile picture"
            >
              {/* Show pending avatar, current avatar, or placeholder */}
              {pendingAvatarUri ? (
                <Image
                  source={{ uri: pendingAvatarUri }}
                  style={styles.avatarImage}
                />
              ) : pendingAvatarRemoved ? (
                <IconSymbol name="person.fill" size={48} color={tintColor} />
              ) : avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <IconSymbol name="person.fill" size={48} color={tintColor} />
              )}
              {loading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="white" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={[styles.avatarNote, { color: borderColor }]}>
              Tap to change profile picture
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

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Date of Birth</Text>
            <View style={[styles.inputContainer, { backgroundColor: borderColor + '10', borderColor: borderColor + '40' }]}>
              <IconSymbol name="calendar" size={20} color={borderColor} />
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={borderColor}
                editable={!loading}
              />
            </View>
            <Text style={[styles.helper, { color: borderColor }]}>
              Format: YYYY-MM-DD (e.g., 1950-01-15)
            </Text>
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
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: DesignTokens.touchTarget.minimum,
    height: DesignTokens.touchTarget.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...DesignTokens.typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    minWidth: DesignTokens.touchTarget.minimum,
    height: DesignTokens.touchTarget.minimum,
    paddingHorizontal: DesignTokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignTokens.spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xl,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: DesignTokens.radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.sm,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: DesignTokens.colors.highlight.main, // Honey gold - warm and welcoming
    ...DesignTokens.elevation[2],
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: DesignTokens.radius.round,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DesignTokens.radius.round,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: DesignTokens.radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarNote: {
    ...DesignTokens.typography.bodySmall,
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: DesignTokens.spacing.lg,
  },
  label: {
    ...DesignTokens.typography.body,
    fontWeight: '600',
    marginBottom: DesignTokens.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    borderWidth: 2,
    gap: DesignTokens.spacing.sm,
    minHeight: DesignTokens.touchTarget.minimum,
    ...DesignTokens.elevation[1],
  },
  input: {
    flex: 1,
    ...DesignTokens.typography.body,
  },
  eyeButton: {
    padding: DesignTokens.spacing.xs,
    minWidth: DesignTokens.touchTarget.minimum,
    minHeight: DesignTokens.touchTarget.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helper: {
    ...DesignTokens.typography.bodySmall,
    marginTop: DesignTokens.spacing.sm,
  },
  section: {
    marginTop: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.md,
  },
  sectionTitle: {
    ...DesignTokens.typography.button,
    marginBottom: DesignTokens.spacing.xs,
  },
  saveButton: {
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DesignTokens.spacing.sm,
    minHeight: DesignTokens.touchTarget.comfortable,
    ...DesignTokens.elevation[2],
  },
  saveButtonText: {
    color: 'white',
    ...DesignTokens.typography.button,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius.md,
    borderWidth: 2,
    marginTop: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.sm,
    minHeight: DesignTokens.touchTarget.comfortable,
    ...DesignTokens.elevation[1],
  },
  signOutButtonText: {
    ...DesignTokens.typography.button,
  },
  bottomSpacing: {
    height: DesignTokens.spacing.xxl,
  },
});
