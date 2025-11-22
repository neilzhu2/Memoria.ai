import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/hooks/useColorScheme';

interface TermsOfUseModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TermsOfUseModal({ visible, onClose }: TermsOfUseModalProps) {
  const colorScheme = useColorScheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close terms of use"
          >
            <IconSymbol name="xmark" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
            Terms of Use
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper }]}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              1. Acceptance of Terms
            </Text>
            <Text style={[styles.sectionText, { color: Colors[colorScheme ?? 'light'].text }]}>
              By accessing and using Memoria.ai ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper }]}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              2. Use License
            </Text>
            <Text style={[styles.sectionText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Permission is granted to use Memoria.ai for personal, non-commercial purposes. This license shall automatically terminate if you violate any of these restrictions and may be terminated by Memoria.ai at any time.
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper }]}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              3. Privacy and Data
            </Text>
            <Text style={[styles.sectionText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Your privacy is important to us. All voice recordings and personal memories are stored securely and are accessible only to you. We do not share, sell, or distribute your personal content to third parties.
            </Text>
            <Text style={[styles.sectionText, { color: Colors[colorScheme ?? 'light'].text }]}>
              We collect and store:
            </Text>
            <Text style={[styles.bulletText, { color: Colors[colorScheme ?? 'light'].text }]}>
              • Voice recordings you create
            </Text>
            <Text style={[styles.bulletText, { color: Colors[colorScheme ?? 'light'].text }]}>
              • Memory titles and descriptions
            </Text>
            <Text style={[styles.bulletText, { color: Colors[colorScheme ?? 'light'].text }]}>
              • Account information (email, display name)
            </Text>
            <Text style={[styles.bulletText, { color: Colors[colorScheme ?? 'light'].text }]}>
              • Usage analytics to improve the service
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper }]}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              4. User Content
            </Text>
            <Text style={[styles.sectionText, { color: Colors[colorScheme ?? 'light'].text }]}>
              You retain all rights to the content you create and upload to Memoria.ai. By using the Service, you grant us a license to store, process, and display your content solely for the purpose of providing the Service to you.
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper }]}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              5. Prohibited Uses
            </Text>
            <Text style={[styles.sectionText, { color: Colors[colorScheme ?? 'light'].text }]}>
              You may not use this Service:
            </Text>
            <Text style={[styles.bulletText, { color: Colors[colorScheme ?? 'light'].text }]}>
              • For any unlawful purpose
            </Text>
            <Text style={[styles.bulletText, { color: Colors[colorScheme ?? 'light'].text }]}>
              • To upload malicious code or harmful content
            </Text>
            <Text style={[styles.bulletText, { color: Colors[colorScheme ?? 'light'].text }]}>
              • To violate any applicable laws or regulations
            </Text>
            <Text style={[styles.bulletText, { color: Colors[colorScheme ?? 'light'].text }]}>
              • To impersonate or misrepresent your affiliation with any person or entity
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper }]}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              6. Disclaimer
            </Text>
            <Text style={[styles.sectionText, { color: Colors[colorScheme ?? 'light'].text }]}>
              The Service is provided "as is". Memoria.ai makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper }]}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              7. Limitations
            </Text>
            <Text style={[styles.sectionText, { color: Colors[colorScheme ?? 'light'].text }]}>
              In no event shall Memoria.ai or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the Service.
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper }]}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              8. Changes to Terms
            </Text>
            <Text style={[styles.sectionText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Memoria.ai reserves the right to revise these terms at any time. By using the Service, you agree to be bound by the current version of these Terms of Use.
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper }]}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              9. Contact
            </Text>
            <Text style={[styles.sectionText, { color: Colors[colorScheme ?? 'light'].text }]}>
              If you have any questions about these Terms, please contact us at neilzhu92@gmail.com
            </Text>
          </View>

          <Text style={[styles.lastUpdated, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            Last Updated: November 2025
          </Text>

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
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: DesignTokens.touchTarget.minimum,
    height: DesignTokens.touchTarget.minimum,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DesignTokens.touchTarget.minimum / 2,
  },
  title: {
    ...DesignTokens.typography.h2,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: DesignTokens.touchTarget.minimum,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignTokens.spacing.md,
  },
  section: {
    marginBottom: DesignTokens.spacing.md,
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    ...DesignTokens.elevation[1],
  },
  sectionTitle: {
    ...DesignTokens.typography.h3,
    marginBottom: DesignTokens.spacing.sm,
  },
  sectionText: {
    ...DesignTokens.typography.body,
    marginBottom: DesignTokens.spacing.sm,
    lineHeight: 24,
  },
  bulletText: {
    ...DesignTokens.typography.body,
    marginLeft: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.xs,
    lineHeight: 24,
  },
  lastUpdated: {
    ...DesignTokens.typography.bodySmall,
    textAlign: 'center',
    marginTop: DesignTokens.spacing.lg,
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: DesignTokens.spacing.xl,
  },
});
