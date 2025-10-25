import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Haptics from 'expo-haptics';

interface FamilySharingModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FamilySharingModal({ visible, onClose }: FamilySharingModalProps) {
  const colorScheme = useColorScheme();

  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const borderColor = Colors[colorScheme ?? 'light'].tabIconDefault;
  const tintColor = Colors[colorScheme ?? 'light'].elderlyTabActive;

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor + '20' }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            accessibilityLabel="Close family sharing"
            accessibilityRole="button"
          >
            <IconSymbol name="xmark" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Family Sharing</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Coming Soon Section */}
          <View style={styles.comingSoonContainer}>
            <View style={[styles.iconCircle, { backgroundColor: tintColor + '20' }]}>
              <IconSymbol name="person.2.fill" size={48} color={tintColor} />
            </View>

            <Text style={[styles.comingSoonTitle, { color: textColor }]}>
              Family Sharing
            </Text>
            <Text style={[styles.comingSoonSubtitle, { color: borderColor }]}>
              Coming Soon
            </Text>

            <Text style={[styles.description, { color: textColor }]}>
              Family Sharing will enable meaningful connections across generations through guided memory recording.
            </Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresSection}>
            <Text style={[styles.featuresTitle, { color: textColor }]}>
              Planned Features
            </Text>

            {[
              {
                icon: 'bubble.left.and.bubble.right.fill',
                title: 'Guided Recording Prompts',
                description: 'Children and grandchildren can create thoughtful prompts to help elderly family members share specific memories',
              },
              {
                icon: 'link',
                title: 'Family Memory Connections',
                description: 'Link memories between family members to build a rich, interconnected family history',
              },
              {
                icon: 'square.and.arrow.up',
                title: 'Selective Sharing',
                description: 'Choose which memories to share with specific family members, maintaining privacy and control',
              },
              {
                icon: 'book.closed.fill',
                title: 'Family Story Collections',
                description: 'Collaborate on family story collections and create mini-bibliographies for special occasions',
              },
            ].map((feature, index) => (
              <View
                key={index}
                style={[styles.featureCard, { backgroundColor: borderColor + '10' }]}
              >
                <View style={[styles.featureIcon, { backgroundColor: tintColor + '20' }]}>
                  <IconSymbol name={feature.icon} size={24} color={tintColor} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: textColor }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.featureDescription, { color: borderColor }]}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: tintColor + '10' }]}>
            <IconSymbol name="info.circle.fill" size={20} color={tintColor} />
            <Text style={[styles.infoText, { color: textColor }]}>
              We're designing Family Sharing with care to ensure it fosters genuine connection while respecting privacy and autonomy. Stay tuned for updates!
            </Text>
          </View>
        </ScrollView>
      </View>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  content: {
    flex: 1,
    padding: 20,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  comingSoonSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
