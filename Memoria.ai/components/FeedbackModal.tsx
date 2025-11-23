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
  Linking,
  Alert,
} from 'react-native';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/hooks/useColorScheme';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const colorScheme = useColorScheme();
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert('Missing Information', 'Please enter your feedback before sending.');
      return;
    }

    const subject = 'Memoria.ai Feedback';
    const body = `${feedback}${email ? `\n\nReply to: ${email}` : ''}`;
    const mailtoUrl = `mailto:neilzhu92@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        // Clear form and close modal
        setFeedback('');
        setEmail('');
        onClose();
      } else {
        Alert.alert(
          'Email Not Available',
          'Please send your feedback directly to neilzhu92@gmail.com'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Could not open email client. Please email us at neilzhu92@gmail.com'
      );
    }
  };

  const handleClose = () => {
    setFeedback('');
    setEmail('');
    onClose();
  };

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
            accessibilityLabel="Close feedback form"
          >
            <IconSymbol name="xmark" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Send Feedback
            </Text>
          </View>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSubmit}
            accessibilityLabel="Send feedback"
          >
            <Text style={[styles.sendButtonText, { color: Colors[colorScheme ?? 'light'].highlight }]}>
              Send
            </Text>
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
              accessibilityLabel="Email address"
            />
          </View>

          {/* Info Section */}
          <View style={[styles.infoSection, { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper }]}>
            <View style={styles.infoRow}>
              <IconSymbol name="info.circle" size={20} color={Colors[colorScheme ?? 'light'].accent} />
              <Text style={[styles.infoText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Feedback will be sent to: neilzhu92@gmail.com
              </Text>
            </View>
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
  infoSection: {
    marginBottom: DesignTokens.spacing.md,
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    ...DesignTokens.elevation[1],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  infoText: {
    ...DesignTokens.typography.body,
    flex: 1,
  },
  bottomSpacing: {
    height: DesignTokens.spacing.xl,
  },
});
