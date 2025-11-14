/**
 * Real-time Transcription View for Memoria.ai
 * Displays live transcription with elderly-friendly design and bilingual support
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  Vibration,
  Pressable,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import {
  RealtimeTranscriptionState,
  TranscriptionDisplayOptions,
  ElderlyTranscriptionSettings,
  ChineseLanguageSupport
} from '../../types';

interface RealtimeTranscriptionViewProps {
  transcriptionState: RealtimeTranscriptionState;
  displayOptions: TranscriptionDisplayOptions;
  elderlySettings: ElderlyTranscriptionSettings;
  chineseSupport: ChineseLanguageSupport;
  onTextPress?: (text: string) => void;
  onLanguageDetected?: (language: 'en' | 'zh') => void;
  onConfidenceWarning?: (confidence: number) => void;
  isRecording: boolean;
  showControls?: boolean;
}

const RealtimeTranscriptionView: React.FC<RealtimeTranscriptionViewProps> = ({
  transcriptionState,
  displayOptions,
  elderlySettings,
  chineseSupport,
  onTextPress,
  onLanguageDetected,
  onConfidenceWarning,
  isRecording,
  showControls = false,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'zh' | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [wordHighlights, setWordHighlights] = useState<{[key: number]: boolean}>({});

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lastAnnouncementRef = useRef('');
  const textUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Format text for elderly users with proper line breaks and spacing
  const formatTextForElderly = useCallback((text: string): string => {
    if (!text) return '';

    let formatted = text;

    // Add proper spacing for readability
    if (elderlySettings.largeTextMode) {
      // Add extra spacing between sentences
      formatted = formatted.replace(/([.!?。！？])\s*/g, '$1\n\n');
      // Add spacing around commas for Chinese text
      if (currentLanguage === 'zh') {
        formatted = formatted.replace(/([，、])/g, '$1 ');
      }
    }

    // Handle Chinese character display
    if (currentLanguage === 'zh' && chineseSupport.characterSet !== 'both') {
      // In a real implementation, you would convert between simplified/traditional
      // This is a placeholder for character set conversion
      formatted = formatted; // Character conversion would happen here
    }

    return formatted.trim();
  }, [elderlySettings.largeTextMode, currentLanguage, chineseSupport.characterSet]);

  // Update display text when transcription state changes
  useEffect(() => {
    if (!transcriptionState.isActive) {
      setDisplayText('');
      return;
    }

    const newText = transcriptionState.currentText || transcriptionState.pendingText;
    if (newText && newText !== displayText) {
      const formattedText = formatTextForElderly(newText);
      setDisplayText(formattedText);

      // Update confidence and language
      setConfidenceLevel(transcriptionState.confidence);

      if (transcriptionState.detectedLanguage && transcriptionState.detectedLanguage !== currentLanguage) {
        setCurrentLanguage(transcriptionState.detectedLanguage);
        onLanguageDetected?.(transcriptionState.detectedLanguage);
      }

      // Scroll to bottom if user hasn't manually scrolled
      if (isScrolledToBottom && displayOptions.scrollToLatest) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }

      // Accessibility announcement for new text (throttled)
      if (elderlySettings.enableVoiceGuidance && newText.length > lastAnnouncementRef.current.length + 10) {
        const newWords = newText.slice(lastAnnouncementRef.current.length).trim();
        if (newWords) {
          AccessibilityInfo.announceForAccessibility(newWords);
          lastAnnouncementRef.current = newText;
        }
      }

      // Haptic feedback for new text
      if (elderlySettings.enableHapticFeedback && newText.length > displayText.length + 5) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Warning for low confidence
      if (transcriptionState.confidence < 0.6) {
        onConfidenceWarning?.(transcriptionState.confidence);
      }
    }
  }, [
    transcriptionState,
    displayText,
    formatTextForElderly,
    elderlySettings,
    isScrolledToBottom,
    displayOptions.scrollToLatest,
    currentLanguage,
    onLanguageDetected,
    onConfidenceWarning
  ]);

  // Pulse animation for active transcription
  useEffect(() => {
    if (transcriptionState.isActive && isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [transcriptionState.isActive, isRecording]);

  // Fade effect for confidence levels
  useEffect(() => {
    const opacity = confidenceLevel < 0.6 ? 0.7 : 1.0;
    Animated.timing(fadeAnim, {
      toValue: opacity,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [confidenceLevel]);

  // Handle text press for editing
  const handleTextPress = useCallback(() => {
    if (onTextPress && displayText) {
      if (elderlySettings.enableHapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onTextPress(displayText);
    }
  }, [displayText, onTextPress, elderlySettings.enableHapticFeedback]);

  // Handle scroll events
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    setIsScrolledToBottom(isAtBottom);
  }, []);

  // Clear transcription display
  const clearDisplay = useCallback(() => {
    if (elderlySettings.simplifiedControls) {
      Alert.alert(
        'Clear Transcription',
        'Do you want to clear the current transcription display?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: () => {
              setDisplayText('');
              setWordHighlights({});
              lastAnnouncementRef.current = '';
            }
          }
        ]
      );
    } else {
      setDisplayText('');
      setWordHighlights({});
      lastAnnouncementRef.current = '';
    }
  }, [elderlySettings.simplifiedControls]);

  // Get confidence color
  const getConfidenceColor = useCallback((confidence: number): string => {
    if (confidence >= 0.8) return '#10b981'; // Green
    if (confidence >= 0.6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }, []);

  // Get language indicator
  const getLanguageIndicator = useCallback((): string => {
    if (!currentLanguage) return '';
    return currentLanguage === 'zh' ? '中' : 'EN';
  }, [currentLanguage]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: displayOptions.backgroundColor,
      borderRadius: 12,
      padding: 16,
      minHeight: 120,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: transcriptionState.isActive ? '#10b981' : '#6b7280',
      marginRight: 8,
    },
    statusText: {
      fontSize: displayOptions.fontSize - 2,
      color: displayOptions.textColor,
      fontWeight: '500',
    },
    languageIndicator: {
      backgroundColor: displayOptions.highlightColor,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 32,
      alignItems: 'center',
    },
    languageText: {
      fontSize: displayOptions.fontSize - 4,
      fontWeight: '600',
      color: '#ffffff',
    },
    confidenceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
    },
    confidenceBar: {
      width: 40,
      height: 4,
      backgroundColor: '#e5e7eb',
      borderRadius: 2,
      marginRight: 4,
    },
    confidenceFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: getConfidenceColor(confidenceLevel),
      width: `${Math.max(0, Math.min(100, confidenceLevel * 100))}%`,
    },
    confidenceText: {
      fontSize: displayOptions.fontSize - 6,
      color: displayOptions.textColor,
      fontWeight: '500',
    },
    transcriptionContainer: {
      flex: 1,
      minHeight: 80,
    },
    scrollContainer: {
      flexGrow: 1,
    },
    transcriptionText: {
      fontSize: displayOptions.fontSize,
      lineHeight: displayOptions.lineHeight,
      color: displayOptions.textColor,
      fontFamily: currentLanguage === 'zh' ? 'PingFang SC' : 'System',
      textAlign: currentLanguage === 'zh' ? 'left' : 'left',
      includeFontPadding: false,
      textAlignVertical: 'top',
    },
    placeholderText: {
      fontSize: displayOptions.fontSize,
      color: displayOptions.textColor + '80', // 50% opacity
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 20,
    },
    wordHighlight: {
      backgroundColor: displayOptions.highlightColor + '40', // 25% opacity
      borderRadius: 4,
      paddingHorizontal: 2,
    },
    lowConfidenceText: {
      textDecorationLine: 'underline',
      textDecorationColor: '#ef4444',
      textDecorationStyle: 'dashed',
    },
    footer: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: displayOptions.textColor + '20',
    },
    wordCount: {
      fontSize: displayOptions.fontSize - 4,
      color: displayOptions.textColor + '80',
      textAlign: 'center',
    },
    clearButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: displayOptions.highlightColor + '20',
      borderRadius: 16,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearButtonText: {
      fontSize: 16,
      color: displayOptions.textColor,
      fontWeight: '600',
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }]
        }
      ]}
    >
      {/* Header with status and language indicator */}
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View style={styles.statusIndicator} />
          <Text style={styles.statusText}>
            {transcriptionState.isActive ? 'Transcribing...' : 'Ready'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Language indicator */}
          {displayOptions.showLanguageIndicator && currentLanguage && (
            <View style={styles.languageIndicator}>
              <Text style={styles.languageText}>
                {getLanguageIndicator()}
              </Text>
            </View>
          )}

          {/* Confidence indicator */}
          {displayOptions.showConfidence && transcriptionState.isActive && (
            <View style={styles.confidenceContainer}>
              <View style={styles.confidenceBar}>
                <View style={styles.confidenceFill} />
              </View>
              <Text style={styles.confidenceText}>
                {Math.round(confidenceLevel * 100)}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Clear button for elderly users */}
      {showControls && displayText && (
        <Pressable
          style={styles.clearButton}
          onPress={clearDisplay}
          accessibilityLabel="Clear transcription"
          accessibilityRole="button"
        >
          <Text style={styles.clearButtonText}>×</Text>
        </Pressable>
      )}

      {/* Transcription display */}
      <View style={styles.transcriptionContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContainer}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
          indicatorStyle={elderlySettings.highContrastMode ? 'white' : 'default'}
        >
          {displayText ? (
            <Pressable
              onPress={handleTextPress}
              accessibilityLabel={`Transcription: ${displayText}`}
              accessibilityRole="text"
              accessibilityHint="Tap to edit transcription"
            >
              <Text
                style={[
                  styles.transcriptionText,
                  displayOptions.highlightLowConfidence && confidenceLevel < 0.6 && styles.lowConfidenceText
                ]}
                selectable={true}
              >
                {displayText}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.placeholderText}>
              {transcriptionState.isActive
                ? (currentLanguage === 'zh' ? '请开始说话...' : 'Start speaking...')
                : (currentLanguage === 'zh' ? '准备转录' : 'Ready to transcribe')
              }
            </Text>
          )}
        </ScrollView>
      </View>

      {/* Footer with word count */}
      {displayText && (
        <View style={styles.footer}>
          <Text style={styles.wordCount}>
            {transcriptionState.wordCount} words
            {transcriptionState.sessionDuration > 0 &&
              ` • ${Math.round(transcriptionState.sessionDuration / 1000)}s`
            }
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

export default RealtimeTranscriptionView;