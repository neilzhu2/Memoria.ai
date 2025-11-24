import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert('Missing Information', 'Please enter your feedback before sending.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('feedback').insert({
        feedback_text: feedback.trim(),
        user_email: email.trim() || null,
        user_id: user?.id || null,
      });

      if (error) {
        console.error('Feedback submission error:', error);
        Alert.alert('Error', 'Could not send feedback. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Show success state
      setIsSubmitting(false);
      setSubmitSuccess(true);

      // Auto-close after 2.5 seconds
      setTimeout(() => {
        setFeedback('');
        setEmail('');
        setSubmitSuccess(false);
        onClose();
      }, 2500);
    } catch (error) {
      console.error('Feedback submission error:', error);
      Alert.alert('Error', 'Could not send feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Don't allow close while submitting
    setFeedback('');
    setEmail('');
    setSubmitSuccess(false);
    onClose();
  };

  // Success state UI
  if (submitSuccess) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: Colors[colorScheme ?? 'light'].success + '20' }]}>
              <IconSymbol name="checkmark.circle.fill" size={64} color={Colors[colorScheme ?? 'light'].success} />
            </View>
            <Text style={[styles.successTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Thank You!
            </Text>
            <Text style={[styles.successMessage, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              Your feedback has been sent successfully.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={isSubmitting}
            accessibilityLabel="Close feedback form"
          >
            <IconSymbol
              name="xmark"
              size={24}
              color={isSubmitting ? Colors[colorScheme ?? 'light'].tabIconDefault : Colors[colorScheme ?? 'light'].text}
            />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Send Feedback
            </Text>
          </View>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
            accessibilityLabel="Send feedback"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].highlight} />
            ) : (
              <Text style={[styles.sendButtonText, { color: Colors[colorScheme ?? 'light'].highlight }]}>
                Send
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.formSection, { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper }]}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Your Feedback *
            </Text>
            <Text style={[styles.helperText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              Share your ideas, suggestions, or report issues
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                },
              ]}
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Tell us what you think..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              editable={!isSubmitting}
              accessibilityLabel="Feedback text"
            />
          </View>

          <View style={[styles.formSection, { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper }]}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Your Email (Optional)
            </Text>
            <Text style={[styles.helperText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              If you'd like us to follow up with you
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
              accessibilityLabel="Email address"
            />
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sendButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignTokens.spacing.md,
  },
  formSection: {
    marginBottom: DesignTokens.spacing.md,
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    ...DesignTokens.elevation[1],
  },
  label: {
    ...DesignTokens.typography.h3,
    marginBottom: DesignTokens.spacing.xs,
  },
  helperText: {
    ...DesignTokens.typography.bodySmall,
    marginBottom: DesignTokens.spacing.sm,
  },
  input: {
    ...DesignTokens.typography.body,
    borderWidth: 1,
    borderRadius: DesignTokens.radius.md,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    minHeight: DesignTokens.touchTarget.minimum,
  },
  textArea: {
    ...DesignTokens.typography.body,
    borderWidth: 1,
    borderRadius: DesignTokens.radius.md,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    minHeight: 160,
  },
  bottomSpacing: {
    height: DesignTokens.spacing.xl,
  },
  // Success state styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignTokens.spacing.xl,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  successTitle: {
    ...DesignTokens.typography.h1,
    marginBottom: DesignTokens.spacing.sm,
  },
  successMessage: {
    ...DesignTokens.typography.body,
    textAlign: 'center',
  },
});
