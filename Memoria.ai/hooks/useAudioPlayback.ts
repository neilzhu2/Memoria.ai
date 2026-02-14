// Audio playback hook using expo-audio (same native module as useAudioRecorder)
// Previously used expo-av, which caused "audio session not activated" conflicts on iOS
// See RECORDING_FEATURE_FINDINGS.md Round 9 for details
//
// Uses createAudioPlayer (imperative) instead of useAudioPlayer (hook) because
// we need dynamic source switching and manual lifecycle control

import { useState, useEffect, useRef, useCallback } from 'react';
import { createAudioPlayer, AudioModule, AudioPlayer } from 'expo-audio';
import type { AudioSource } from 'expo-audio';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { audioStorageService } from '@/services/audioStorageService';

export interface AudioPlaybackState {
  playingSound: null; // kept for API compat, always null now
  playingId: string | null;
  playbackPosition: number;  // milliseconds (for consumer compat)
  playbackDuration: number;  // milliseconds (for consumer compat)
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
  const playerRef = useRef<AudioPlayer | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [playbackDuration, setPlaybackDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Status polling interval ref
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start polling player status
  const startStatusPolling = useCallback(() => {
    // Clear any existing interval
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
    }

    statusIntervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      try {
        setPlaybackPosition(Math.round(player.currentTime * 1000));
        setPlaybackDuration(Math.round(player.duration * 1000));
        setIsPlaying(player.playing);

        // Handle playback completion
        if (player.currentTime >= player.duration && player.duration > 0 && !player.playing) {
          console.log('[Playback] Playback finished');
          setIsPlaying(false);
          setPlaybackPosition(0);
          player.seekTo(0);
          stopStatusPolling();
        }
      } catch (e) {
        // Player might have been released
      }
    }, 250);
  }, []);

  const stopStatusPolling = useCallback(() => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStatusPolling();
      if (playerRef.current) {
        try {
          playerRef.current.remove();
        } catch (e) {
          console.warn('[Playback] Error releasing player:', e);
        }
        playerRef.current = null;
      }
    };
  }, []);

  const stopPlayback = useCallback(async () => {
    try {
      const player = playerRef.current;
      if (player) {
        player.pause();
        await player.seekTo(0);
      }
      stopStatusPolling();
      setPlayingId(null);
      setIsPlaying(false);
      setPlaybackPosition(0);
      setPlaybackDuration(0);
    } catch (error) {
      console.error('[Playback] Error stopping playback:', error);
    }
  }, [stopStatusPolling]);

  const togglePlayPause = useCallback(async (id: string, audioPath: string, localAudioPath?: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // If same audio is loaded, toggle pause/play
      if (playingId === id && playerRef.current) {
        if (playerRef.current.playing) {
          console.log('[Playback] Pausing audio');
          playerRef.current.pause();
          setIsPlaying(false);
        } else {
          console.log('[Playback] Resuming audio');
          // Ensure audio mode is set for playback (not recording)
          try {
            await AudioModule.setAudioModeAsync({
              allowsRecording: false,
              playsInSilentMode: true,
            });
          } catch (e) {
            console.warn('[Playback] Failed to set audio mode:', e);
          }
          playerRef.current.play();
          setIsPlaying(true);
          startStatusPolling();
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

        // Ensure audio mode is set for playback (not recording)
        try {
          await AudioModule.setAudioModeAsync({
            allowsRecording: false,
            playsInSilentMode: true,
          });
        } catch (e) {
          console.warn('[Playback] Failed to set audio mode:', e);
        }

        // Release old player if exists
        if (playerRef.current) {
          try {
            playerRef.current.pause();
            playerRef.current.remove();
          } catch (e) {
            console.warn('[Playback] Error releasing old player:', e);
          }
          playerRef.current = null;
        }
        stopStatusPolling();

        // Create a new player with the audio source
        console.log('[Playback] Creating new player with URI:', uriToPlay.substring(0, 60) + '...');
        const player = createAudioPlayer({ uri: uriToPlay });
        player.volume = 1.0; // Ensure max volume
        playerRef.current = player;
        setPlayingId(id);

        // Wait for the player to load, then play
        // Use a small delay to let the native player initialize
        setTimeout(() => {
          try {
            if (playerRef.current === player) {
              console.log('[Playback] Starting playback, duration:', player.duration, 'isLoaded:', player.isLoaded);
              player.play();
              setIsPlaying(true);
              setPlaybackDuration(Math.round(player.duration * 1000));
              startStatusPolling();
            }
          } catch (playErr) {
            console.warn('[Playback] Failed to start playback:', playErr);
          }
        }, 300);
      }
    } catch (error) {
      console.error('[Playback] Failed to play audio:', error);
      Alert.alert('Playback Error', 'Failed to load audio file. Please try again.');
    }
  }, [playingId, startStatusPolling, stopStatusPolling]);

  const skipBackward = useCallback(async () => {
    if (!playingId || !playerRef.current) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newPosition = Math.max(0, playerRef.current.currentTime - 5); // 5 seconds
      await playerRef.current.seekTo(newPosition);
    } catch (error) {
      console.error('Failed to skip backward:', error);
    }
  }, [playingId]);

  const skipForward = useCallback(async () => {
    if (!playingId || !playerRef.current) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const duration = playerRef.current.duration || 0;
      const newPosition = Math.min(duration, playerRef.current.currentTime + 5); // 5 seconds
      await playerRef.current.seekTo(newPosition);
    } catch (error) {
      console.error('Failed to skip forward:', error);
    }
  }, [playingId]);

  const seekToPosition = useCallback(async (position: number) => {
    if (!playingId || !playerRef.current) return;
    try {
      // Consumer passes milliseconds, expo-audio uses seconds
      await playerRef.current.seekTo(position / 1000);
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  }, [playingId]);

  return {
    // State
    playingSound: null, // deprecated, kept for API compat
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
