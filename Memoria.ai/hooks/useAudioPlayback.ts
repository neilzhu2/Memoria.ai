import { useState, useEffect, useRef } from 'react';
import { useAudioPlayer, AudioModule } from 'expo-audio';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface AudioPlaybackState {
  playingSound: ReturnType<typeof useAudioPlayer> | null;
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
  const audioPlayer = useAudioPlayer();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [playbackDuration, setPlaybackDuration] = useState<number>(0);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track playback position
  useEffect(() => {
    if (audioPlayer.playing) {
      positionIntervalRef.current = setInterval(() => {
        setPlaybackPosition(audioPlayer.currentTime * 1000); // Convert to ms
        if (audioPlayer.duration) {
          setPlaybackDuration(audioPlayer.duration * 1000); // Convert to ms
        }
      }, 100);
    } else {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
        positionIntervalRef.current = null;
      }
    }

    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [audioPlayer.playing, audioPlayer.currentTime, audioPlayer.duration]);

  const stopPlayback = async () => {
    audioPlayer.pause();
    audioPlayer.seekTo(0);
    setPlayingId(null);
    setPlaybackPosition(0);
    setPlaybackDuration(0);
  };

  const togglePlayPause = async (id: string, audioPath: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // If same audio is playing, toggle pause/play
      if (playingId === id) {
        if (audioPlayer.playing) {
          audioPlayer.pause();
        } else {
          audioPlayer.play();
        }
        return;
      }

      // Play new sound
      if (audioPath) {
        audioPlayer.replace({ uri: audioPath });
        audioPlayer.play();
        setPlayingId(id);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      Alert.alert('Error', 'Failed to play audio.');
    }
  };

  const skipBackward = async () => {
    if (!playingId) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newPosition = Math.max(0, audioPlayer.currentTime - 15); // 15 seconds
      audioPlayer.seekTo(newPosition);
    } catch (error) {
      console.error('Failed to skip backward:', error);
    }
  };

  const skipForward = async () => {
    if (!playingId) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newPosition = Math.min(
        audioPlayer.duration || 0,
        audioPlayer.currentTime + 15 // 15 seconds
      );
      audioPlayer.seekTo(newPosition);
    } catch (error) {
      console.error('Failed to skip forward:', error);
    }
  };

  const seekToPosition = async (position: number) => {
    if (!playingId) return;
    try {
      audioPlayer.seekTo(position / 1000); // Convert ms to seconds
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  };

  return {
    // State
    playingSound: audioPlayer,
    playingId,
    playbackPosition,
    playbackDuration,
    isPlaying: audioPlayer.playing,

    // Controls
    togglePlayPause,
    stopPlayback,
    skipBackward,
    skipForward,
    seekToPosition,
  };
}
