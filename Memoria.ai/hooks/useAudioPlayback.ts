// TODO: Temporary expo-av fallback due to expo-audio SDK 54 bug
// expo-audio 1.0.13 cannot play file:// URIs on iOS (duration: NaN, playing: false)
// Switch back to expo-audio when bug is fixed
// See: AUDIO_PLAYBACK_ISSUE.md for details

import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { audioStorageService } from '@/services/audioStorageService';

export interface AudioPlaybackState {
  playingSound: Audio.Sound | null;
  playingId: string | null;
  playbackPosition: number;
  playbackDuration: number;
  isPlaying: boolean;
}

export interface AudioPlaybackControls {
  togglePlayPause: (id: string, audioPath: string, localAudioPath?: string) => Promise<void>;
  stopPlayback: () => Promise<void>;
  skipBackward: () => Promise<void>;
  skipForward: () => Promise<void>;
  seekToPosition: (position: number) => Promise<void>;
}

export function useAudioPlayback() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [playbackDuration, setPlaybackDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(error => {
          console.error('[Playback] Error unloading sound:', error);
        });
      }
    };
  }, []);

  const stopPlayback = async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.stopAsync();
          await soundRef.current.setPositionAsync(0);
        }
      }
      setPlayingId(null);
      setIsPlaying(false);
      setPlaybackPosition(0);
      setPlaybackDuration(0);
    } catch (error) {
      console.error('[Playback] Error stopping playback:', error);
    }
  };

  const togglePlayPause = async (id: string, audioPath: string, localAudioPath?: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // If same audio is playing, toggle pause/play
      if (playingId === id && soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            console.log('[Playback] Pausing audio');
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            console.log('[Playback] Resuming audio');
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
        }
        return;
      }

      // Load and play new audio
      let uriToPlay = localAudioPath || audioPath;
      if (uriToPlay) {
        // For Supabase Storage URLs, generate a fresh signed URL for secure access
        if (!localAudioPath && audioStorageService.isSupabaseUrl(uriToPlay)) {
          const signedUrl = await audioStorageService.getSignedPlaybackUrl(uriToPlay);
          if (signedUrl) {
            uriToPlay = signedUrl;
          } else {
            console.warn('[Playback] Could not generate signed URL, falling back to stored URL');
          }
        }

        console.log('[Playback] Loading audio:', {
          uri: uriToPlay.substring(0, 60) + '...',
          type: localAudioPath ? 'LOCAL' : 'REMOTE (signed)'
        });

        // Configure audio mode for playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        // Stop and unload old sound if exists
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
          } catch (error) {
            console.error('[Playback] Error unloading old sound:', error);
          }
          soundRef.current = null;
        }

        // Create and load new sound
        console.log('[Playback] Creating new sound with URI:', uriToPlay);
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: uriToPlay },
          { shouldPlay: true },
          (status) => {
            // Update playback position and duration via status updates
            if (status.isLoaded) {
              setPlaybackPosition(status.positionMillis);
              setPlaybackDuration(status.durationMillis || 0);
              setIsPlaying(status.isPlaying);

              // Handle playback completion
              if (status.didJustFinish && !status.isLooping) {
                console.log('[Playback] Playback finished');
                setIsPlaying(false);
                setPlaybackPosition(0);
              }
            }
          }
        );

        soundRef.current = sound;
        setPlayingId(id);
        setIsPlaying(true);

        if (status.isLoaded) {
          console.log('[Playback] Sound loaded successfully:', {
            duration: status.durationMillis,
            isPlaying: status.isPlaying,
          });
        }
      }
    } catch (error) {
      console.error('[Playback] Failed to play audio:', error);
      Alert.alert('Playback Error', 'Failed to load audio file. Please try again.');
    }
  };

  const skipBackward = async () => {
    if (!playingId || !soundRef.current) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.max(0, status.positionMillis - 5000); // 5 seconds
        await soundRef.current.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('Failed to skip backward:', error);
    }
  };

  const skipForward = async () => {
    if (!playingId || !soundRef.current) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.min(
          status.durationMillis || 0,
          status.positionMillis + 5000 // 5 seconds
        );
        await soundRef.current.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('Failed to skip forward:', error);
    }
  };

  const seekToPosition = async (position: number) => {
    if (!playingId || !soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(position);
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  };

  return {
    // State
    playingSound: soundRef.current,
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
