import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface AudioPlaybackState {
  playingSound: Audio.Sound | null;
  playingId: string | null;
  playbackPosition: number;
  playbackDuration: number;
  isPlaying: boolean;
}

export interface AudioPlaybackControls {
  togglePlayPause: (id: string, audioPath: string) => Promise<void>;
  stopPlayback: () => Promise<void>;
  skipBackward: () => Promise<void>;
  skipForward: () => Promise<void>;
  seekToPosition: (position: number) => Promise<void>;
}

export function useAudioPlayback() {
  const [playingSound, setPlayingSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [playbackDuration, setPlaybackDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      if (playingSound) {
        playingSound.unloadAsync();
      }
    };
  }, []);

  const stopPlayback = async () => {
    if (playingSound) {
      await playingSound.unloadAsync();
      setPlayingSound(null);
      setPlayingId(null);
      setIsPlaying(false);
      setPlaybackPosition(0);
      setPlaybackDuration(0);
    }
  };

  const togglePlayPause = async (id: string, audioPath: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // If same audio is playing, toggle pause/play
      if (playingId === id && playingSound) {
        if (isPlaying) {
          await playingSound.pauseAsync();
          setIsPlaying(false);
        } else {
          await playingSound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      // Stop current sound if playing different audio
      if (playingSound) {
        await playingSound.unloadAsync();
        setPlayingSound(null);
        setPlayingId(null);
        setIsPlaying(false);
        setPlaybackPosition(0);
        setPlaybackDuration(0);
      }

      // Play new sound
      if (audioPath) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioPath },
          { shouldPlay: true }
        );

        setPlayingSound(sound);
        setPlayingId(id);
        setIsPlaying(true);

        // Set up playback status listener
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis);
            setPlaybackDuration(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);

            if (status.didJustFinish) {
              setPlayingSound(null);
              setPlayingId(null);
              setIsPlaying(false);
              setPlaybackPosition(0);
              sound.unloadAsync();
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      Alert.alert('Error', 'Failed to play audio.');
    }
  };

  const skipBackward = async () => {
    if (!playingSound) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const status = await playingSound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.max(0, status.positionMillis - 15000); // 15 seconds
        await playingSound.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('Failed to skip backward:', error);
    }
  };

  const skipForward = async () => {
    if (!playingSound) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const status = await playingSound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.min(
          status.durationMillis || 0,
          status.positionMillis + 15000 // 15 seconds
        );
        await playingSound.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('Failed to skip forward:', error);
    }
  };

  const seekToPosition = async (position: number) => {
    if (!playingSound) return;
    try {
      await playingSound.setPositionAsync(position);
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  };

  return {
    // State
    playingSound,
    playingId,
    playbackPosition,
    playbackDuration,
    isPlaying,

    // Controls
    togglePlayPause,
    stopPlayback,
    skipBackward,
    skipForward,
    seekToPosition,
  };
}
