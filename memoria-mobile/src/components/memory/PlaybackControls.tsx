/**
 * PlaybackControls Component for Memoria.ai
 * Large, accessible audio playback controls optimized for elderly users
 * Features large touch targets, clear visual feedback, and haptic feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Memory } from '../../types';
import { useSettingsStore, useAudioStore } from '../../stores';

interface PlaybackControlsProps {
  memory: Memory;
  showTitle?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onError?: (error: string) => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  memory,
  showTitle = true,
  compact = false,
  style,
  onPlaybackStart,
  onPlaybackEnd,
  onError,
}) => {
  const {
    getCurrentFontSize,
    getCurrentTouchTargetSize,
    shouldUseHighContrast,
    hapticFeedbackEnabled
  } = useSettingsStore();

  const { playbackSpeed, setPlaybackSpeed } = useAudioStore();

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(memory.duration * 1000); // Convert to milliseconds
  const [isSliding, setIsSliding] = useState(false);

  const animatedScale = useRef(new Animated.Value(1)).current;
  const positionUpdateRef = useRef<NodeJS.Timeout | null>(null);

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (positionUpdateRef.current) {
        clearInterval(positionUpdateRef.current);
      }
    };
  }, [sound]);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(animatedScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startPositionUpdate = () => {
    positionUpdateRef.current = setInterval(async () => {
      if (sound && !isSliding) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            setPosition(status.positionMillis || 0);
          }
        } catch (error) {
          console.warn('Error updating position:', error);
        }
      }
    }, 500);
  };

  const stopPositionUpdate = () => {
    if (positionUpdateRef.current) {
      clearInterval(positionUpdateRef.current);
      positionUpdateRef.current = null;
    }
  };

  const loadAudio = async () => {
    try {
      setIsLoading(true);

      // Unload existing sound
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // Load new sound
      const { sound: newSound } = await Audio.createAsync(
        { uri: memory.audioFilePath },
        {
          shouldPlay: false,
          rate: playbackSpeed,
          volume: 1.0,
        }
      );

      setSound(newSound);

      // Get actual duration
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis || memory.duration * 1000);
      }

      setIsLoading(false);
      return newSound;
    } catch (error) {
      setIsLoading(false);
      const errorMessage = `Failed to load audio: ${error}`;
      console.error(errorMessage);
      onError?.(errorMessage);
      return null;
    }
  };

  const handlePlayPause = async () => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    animateButton();

    try {
      let currentSound = sound;

      if (!currentSound) {
        currentSound = await loadAudio();
        if (!currentSound) return;
      }

      const status = await currentSound.getStatusAsync();

      if (status.isLoaded) {
        if (status.isPlaying) {
          await currentSound.pauseAsync();
          setIsPlaying(false);
          stopPositionUpdate();
        } else {
          await currentSound.playAsync();
          setIsPlaying(true);
          startPositionUpdate();
          onPlaybackStart?.();

          // Set up completion handler
          currentSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
              stopPositionUpdate();
              onPlaybackEnd?.();
            }
          });
        }
      }
    } catch (error) {
      const errorMessage = `Playback error: ${error}`;
      console.error(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleSeek = async (value: number) => {
    if (!sound) return;

    try {
      await sound.setPositionAsync(value);
      setPosition(value);
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  const handleSpeedChange = async () => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];

    setPlaybackSpeed(nextSpeed);

    if (sound) {
      try {
        await sound.setRateAsync(nextSpeed, true);
      } catch (error) {
        console.error('Speed change error:', error);
      }
    }
  };

  const formatTime = (timeMs: number): string => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPlayButtonSize = () => compact ? touchTargetSize : touchTargetSize + 20;
  const getControlButtonSize = () => compact ? touchTargetSize - 10 : touchTargetSize;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: highContrast ? '#444444' : '#f8fafc',
      borderRadius: 16,
      padding: compact ? 16 : 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: fontSize + 2,
      fontWeight: 'bold',
      color: highContrast ? '#ffffff' : '#1f2937',
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: (fontSize + 2) * 1.3,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: compact ? 12 : 16,
      gap: compact ? 16 : 24,
    },
    playButton: {
      width: getPlayButtonSize(),
      height: getPlayButtonSize(),
      borderRadius: getPlayButtonSize() / 2,
      backgroundColor: '#2563eb',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 6,
    },
    speedButton: {
      width: getControlButtonSize(),
      height: getControlButtonSize(),
      borderRadius: getControlButtonSize() / 2,
      backgroundColor: highContrast ? '#666666' : '#e5e7eb',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    speedText: {
      fontSize: fontSize - 2,
      fontWeight: 'bold',
      color: highContrast ? '#ffffff' : '#374151',
    },
    progressContainer: {
      marginBottom: compact ? 8 : 12,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    timeText: {
      fontSize: fontSize - 1,
      color: highContrast ? '#cccccc' : '#6b7280',
      fontWeight: '600',
      minWidth: 45,
      textAlign: 'center',
    },
    slider: {
      flex: 1,
      height: touchTargetSize,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
    },
    loadingText: {
      fontSize: fontSize,
      color: highContrast ? '#cccccc' : '#6b7280',
      marginTop: 8,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        {showTitle && <Text style={styles.title}>{memory.title}</Text>}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading audio...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {showTitle && <Text style={styles.title}>{memory.title}</Text>}

      {/* Main controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.speedButton}
          onPress={handleSpeedChange}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Playback speed ${playbackSpeed}x`}
          accessibilityHint="Tap to change playback speed"
        >
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Pause" : "Play"}
            accessibilityHint={isPlaying ? "Pause audio playback" : "Start audio playback"}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={fontSize + 8}
              color="#ffffff"
            />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.speedButton}>
          <Ionicons
            name="musical-notes"
            size={fontSize + 2}
            color={highContrast ? '#cccccc' : '#6b7280'}
          />
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.timeText}>
            {formatTime(position)}
          </Text>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onValueChange={(value) => {
              setPosition(value);
              setIsSliding(true);
            }}
            onSlidingComplete={(value) => {
              setIsSliding(false);
              handleSeek(value);
            }}
            minimumTrackTintColor="#2563eb"
            maximumTrackTintColor={highContrast ? '#666666' : '#d1d5db'}
            thumbStyle={{
              width: touchTargetSize / 2,
              height: touchTargetSize / 2,
              backgroundColor: '#2563eb',
            }}
            trackStyle={{
              height: 4,
              borderRadius: 2,
            }}
            accessible={true}
            accessibilityRole="adjustable"
            accessibilityLabel="Audio progress"
            accessibilityHint="Slide to seek to different position in audio"
          />

          <Text style={styles.timeText}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PlaybackControls;