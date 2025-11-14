/**
 * MemorySearch Component for Memoria.ai
 * Search interface with voice input support, optimized for elderly users
 * Features large touch targets, clear icons, and accessibility support
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  ViewStyle,
  Keyboard,
} from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore, useMemoryStore } from '../../stores';
import AccessibleTextInput from '../accessibility/AccessibleTextInput';

interface MemorySearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onClearSearch?: () => void;
  showVoiceSearch?: boolean;
  showFilters?: boolean;
  style?: ViewStyle;
}

const MemorySearch: React.FC<MemorySearchProps> = ({
  placeholder = "Search your memories...",
  onSearch,
  onClearSearch,
  showVoiceSearch = true,
  showFilters = true,
  style,
}) => {
  const {
    getCurrentFontSize,
    getCurrentTouchTargetSize,
    shouldUseHighContrast,
    hapticFeedbackEnabled,
    language
  } = useSettingsStore();

  const { searchMemories } = useMemoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchInputRef = useRef<TextInput>(null);
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  const searchSuggestions = [
    "Family stories",
    "Childhood memories",
    "Wedding day",
    "Travel adventures",
    "Holiday traditions",
    "Work experiences",
  ];

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isListening]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    Animated.timing(pulseAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.length > 0) {
      searchMemories(query);
      onSearch?.(query);
      setShowSuggestions(false);
    } else {
      handleClearSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchMemories('');
    onClearSearch?.(());
    setShowSuggestions(false);
    searchInputRef.current?.blur();
  };

  const handleVoiceSearch = async () => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      setIsListening(true);

      // Provide voice feedback
      const instructionText = language === 'zh'
        ? "请说出您想搜索的内容"
        : "Please speak your search query";

      await Speech.speak(instructionText, {
        language: language === 'zh' ? 'zh-CN' : 'en-US',
        pitch: 1.0,
        rate: 0.8,
      });

      // Note: In a real implementation, you would integrate with a speech-to-text service
      // For now, we'll simulate the voice input
      setTimeout(() => {
        setIsListening(false);
        // Simulate voice recognition result
        const voiceResult = "family memories";
        handleSearch(voiceResult);
      }, 3000);

    } catch (error) {
      console.error('Voice search error:', error);
      setIsListening(false);

      const errorText = language === 'zh'
        ? "语音搜索暂时不可用"
        : "Voice search is temporarily unavailable";

      await Speech.speak(errorText, {
        language: language === 'zh' ? 'zh-CN' : 'en-US',
      });
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    handleSearch(suggestion);
  };

  const handleInputFocus = () => {
    if (!searchQuery) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for suggestion taps
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: highContrast ? '#333333' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: highContrast ? '#555555' : '#e5e7eb',
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: highContrast ? '#555555' : '#f3f4f6',
      borderRadius: 12,
      borderWidth: 2,
      borderColor: searchQuery ? '#2563eb' : 'transparent',
      minHeight: touchTargetSize,
      paddingHorizontal: 16,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: fontSize,
      color: highContrast ? '#ffffff' : '#1f2937',
      paddingVertical: 0,
    },
    clearButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: highContrast ? '#666666' : '#d1d5db',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    voiceButton: {
      width: touchTargetSize,
      height: touchTargetSize,
      borderRadius: touchTargetSize / 2,
      backgroundColor: isListening ? '#dc2626' : '#2563eb',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    filtersButton: {
      width: touchTargetSize,
      height: touchTargetSize,
      borderRadius: 8,
      backgroundColor: highContrast ? '#555555' : '#e5e7eb',
      justifyContent: 'center',
      alignItems: 'center',
    },
    suggestionsContainer: {
      backgroundColor: highContrast ? '#444444' : '#ffffff',
      borderRadius: 8,
      marginTop: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      maxHeight: 200,
    },
    suggestionItem: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: highContrast ? '#555555' : '#f3f4f6',
      minHeight: touchTargetSize,
      justifyContent: 'center',
    },
    suggestionText: {
      fontSize: fontSize,
      color: highContrast ? '#ffffff' : '#374151',
      fontWeight: '500',
    },
    listeningText: {
      fontSize: fontSize - 1,
      color: '#dc2626',
      fontWeight: '600',
      marginTop: 8,
      textAlign: 'center',
    },
    instructionText: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      textAlign: 'center',
      marginTop: 4,
      fontStyle: 'italic',
    },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchRow}>
        {/* Search input */}
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={fontSize + 2}
            color={highContrast ? '#cccccc' : '#6b7280'}
            style={styles.searchIcon}
          />

          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={highContrast ? '#999999' : '#9ca3af'}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            accessible={true}
            accessibilityLabel="Search memories"
            accessibilityHint="Type to search through your memories or use voice search"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close"
                size={fontSize - 2}
                color={highContrast ? '#ffffff' : '#6b7280'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Voice search button */}
        {showVoiceSearch && (
          <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={handleVoiceSearch}
              disabled={isListening}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isListening ? "Listening for voice input" : "Voice search"}
              accessibilityHint="Tap to search using your voice"
            >
              <Ionicons
                name={isListening ? "stop" : "mic"}
                size={fontSize + 4}
                color="#ffffff"
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Filters button */}
        {showFilters && (
          <TouchableOpacity
            style={styles.filtersButton}
            onPress={() => {/* Handle filters */}}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Filter options"
            accessibilityHint="Tap to access filter and sort options"
          >
            <Ionicons
              name="options"
              size={fontSize + 2}
              color={highContrast ? '#ffffff' : '#374151'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Voice search feedback */}
      {isListening && (
        <View>
          <Text style={styles.listeningText}>
            {language === 'zh' ? '正在听取...' : 'Listening...'}
          </Text>
          <Text style={styles.instructionText}>
            {language === 'zh'
              ? '请清楚地说出您想搜索的内容'
              : 'Speak clearly about what you want to find'}
          </Text>
        </View>
      )}

      {/* Search suggestions */}
      {showSuggestions && !isListening && (
        <View style={styles.suggestionsContainer}>
          {searchSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionItem,
                index === searchSuggestions.length - 1 && { borderBottomWidth: 0 }
              ]}
              onPress={() => handleSuggestionPress(suggestion)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Search for ${suggestion}`}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default MemorySearch;