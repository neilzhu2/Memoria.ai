import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MemoryItem } from '@/types/memory';

interface MemoryPreviewModalProps {
  visible: boolean;
  memory: MemoryItem | null;
  onViewDetails: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function MemoryPreviewModal({
  visible,
  memory,
  onViewDetails,
  onDelete,
  onClose,
}: MemoryPreviewModalProps) {
  const colorScheme = useColorScheme();

  // Use a slightly different background for the modal to make it stand out
  const modalBackground = colorScheme === 'dark' ? '#2A2A2A' : '#F5F5F5';
  const textColor = Colors[colorScheme ?? 'light'].text;
  const secondaryColor = Colors[colorScheme ?? 'light'].tabIconDefault;
  const tintColor = Colors[colorScheme ?? 'light'].elderlyTabActive;
  const errorColor = Colors[colorScheme ?? 'light'].elderlyError;

  if (!memory) return null;

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.modalContainer, { backgroundColor: modalBackground }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <IconSymbol name="book.fill" size={24} color={tintColor} />
                <Text style={[styles.headerTitle, { color: textColor }]}>
                  {memory.title}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                accessibilityLabel="Close preview"
                accessibilityRole="button"
              >
                <IconSymbol name="xmark.circle.fill" size={28} color={secondaryColor} />
              </TouchableOpacity>
            </View>

            {/* Date */}
            <Text style={[styles.dateText, { color: secondaryColor }]}>
              {formatDate(memory.date)}
            </Text>

            {/* Transcription/Description */}
            <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={true}>
              <Text style={[styles.transcriptionText, { color: textColor }]}>
                {memory.transcription || memory.description || 'No transcription available'}
              </Text>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.viewButton, { backgroundColor: tintColor }]}
                onPress={onViewDetails}
                accessibilityLabel="View memory details"
                accessibilityRole="button"
              >
                <IconSymbol name="eye.fill" size={20} color="white" />
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: errorColor + '30', borderColor: errorColor }]}
                onPress={onDelete}
                accessibilityLabel="Delete memory"
                accessibilityRole="button"
              >
                <IconSymbol name="trash" size={20} color={errorColor} />
                <Text style={[styles.deleteButtonText, { color: errorColor }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  safeArea: {
    width: '100%',
    maxWidth: 500,
  },
  modalContainer: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
    lineHeight: 30,
  },
  closeButton: {
    padding: 4,
  },
  dateText: {
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.8,
  },
  contentScroll: {
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: 24,
  },
  transcriptionText: {
    fontSize: 18,
    lineHeight: 28,
  },
  buttonContainer: {
    gap: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 10,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    gap: 10,
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
