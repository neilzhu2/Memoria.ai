import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import EditMemoryScreen from './EditMemoryScreen';
import { EditMemoryHeader } from './recording/EditMemoryHeader';
import { RecordingTimer } from './recording/RecordingTimer';
import { WaveformDisplay } from './recording/WaveformDisplay';
import { 
  PauseButton, 
  PausedControlsContainer, 
  ReplayControlsContainer 
} from './recording/RecordingControls';

interface RecordingScreenProps {
  isVisible: boolean;
  prompt: string;
  onClose: () => void;
  onStop: (transcript?: string) => void;
  recordingDuration: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onDeleteMemory: () => void;
}

function EditMemoryContainer({ 
  prompt, 
  onCloseClick, 
  onStop, 
  onPause,
  onResume,
  duration, 
  isPaused,
  showReplay,
  isPlaying,
  onPlayPause,
  playbackPosition,
  onReRecord
}: { 
  prompt: string; 
  onCloseClick: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  duration: number;
  isPaused: boolean;
  showReplay?: boolean;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  playbackPosition?: number;
  onReRecord?: () => void;
}) {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col gap-[65px] items-center justify-start pb-22 pt-2 px-0 rounded-tl-[24px] rounded-tr-[24px] w-full"
      data-name="Edit Memory Container"
    >
      <EditMemoryHeader prompt={prompt} onCloseClick={onCloseClick} />
      
      {/* Waveform area with timer overlay */}
      <div className="relative w-full flex-1 min-h-[200px]">
        <WaveformDisplay 
          isPaused={isPaused}
          showReplay={showReplay}
          playbackPosition={playbackPosition}
          duration={duration}
        />
        
        {/* Functional timer positioned at bottom center */}
        <RecordingTimer 
          duration={duration} 
          showReplay={showReplay}
          playbackPosition={playbackPosition}
        />
      </div>
      
      {/* Controls - show different controls based on state */}
      {showReplay ? (
        <ReplayControlsContainer 
          onSaveMemory={onStop}
          onReRecord={onReRecord || (() => {})}
          onCloseClick={onCloseClick}
          isPlaying={isPlaying || false}
          onPlayPause={onPlayPause || (() => {})}
          playbackPosition={playbackPosition || 0}
          totalDuration={duration}
        />
      ) : isPaused ? (
        <PausedControlsContainer 
          onResume={onResume}
          onStop={onStop}
          onCloseClick={onCloseClick}
        />
      ) : (
        <PauseButton onPause={onPause} />
      )}
    </div>
  );
}

export default function RecordingScreen({ 
  isVisible, 
  prompt, 
  onClose, 
  onStop,
  onPause,
  onResume,
  recordingDuration,
  isPaused,
  onDeleteMemory
}: RecordingScreenProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [wasRecordingWhenClosing, setWasRecordingWhenClosing] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackInterval, setPlaybackInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Reset all states when opening
      setShowReplay(false);
      setShowEditScreen(false);
      setIsPlaying(false);
      setPlaybackPosition(0);
    }
  }, [isVisible]);

  // Clean up playback interval on unmount
  useEffect(() => {
    return () => {
      if (playbackInterval) {
        clearInterval(playbackInterval);
      }
    };
  }, [playbackInterval]);

  const handleCloseClick = () => {
    // Remember if we were recording when close was clicked
    setWasRecordingWhenClosing(!isPaused);
    
    // If recording is active, pause it immediately
    if (!isPaused) {
      onPause();
    }
    
    setShowConfirmation(true);
  };

  const handleConfirmationCancel = () => {
    setShowConfirmation(false);
    // If we were recording when close was clicked, pause the recording
    if (wasRecordingWhenClosing) {
      onPause();
    }
  };

  const handleConfirmationConfirm = () => {
    setShowConfirmation(false);
    setIsAnimating(false);
    
    // Clean up playback interval if running
    if (playbackInterval) {
      clearInterval(playbackInterval);
      setPlaybackInterval(null);
    }
    
    setTimeout(() => {
      onDeleteMemory();
    }, 300);
  };

  const handleStop = () => {
    // Skip replay mode entirely and go directly to edit screen
    setShowEditScreen(true);
    setShowReplay(false);
    setPlaybackPosition(0);
  };

  const handleSaveMemory = (transcript: string) => {
    // Save the memory with the transcript
    setIsAnimating(false);
    setTimeout(() => {
      onStop(transcript); // Pass the transcript to the parent
    }, 300);
  };

  const handleEditScreenClose = () => {
    // Go back to paused recording state
    setShowEditScreen(false);
    setShowReplay(false);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause playback
      if (playbackInterval) {
        clearInterval(playbackInterval);
        setPlaybackInterval(null);
      }
      setIsPlaying(false);
    } else {
      // Start playback
      setIsPlaying(true);
      const interval = setInterval(() => {
        setPlaybackPosition(prev => {
          const newPosition = prev + 0.1;
          if (newPosition >= recordingDuration) {
            // Playback complete
            setIsPlaying(false);
            setPlaybackInterval(null);
            return recordingDuration;
          }
          return newPosition;
        });
      }, 100);
      setPlaybackInterval(interval);
    }
  };

  const handleReRecord = () => {
    // Reset to recording state
    setShowReplay(false);
    setIsPlaying(false);
    setPlaybackPosition(0);
    if (playbackInterval) {
      clearInterval(playbackInterval);
      setPlaybackInterval(null);
    }
    // Resume recording
    onResume();
  };

  const handlePause = () => {
    onPause();
  };

  const handleResume = () => {
    onResume();
  };

  if (!isVisible && !isAnimating) {
    return null;
  }

  // If we're showing the edit screen, render that instead
  if (showEditScreen) {
    return (
      <EditMemoryScreen
        isVisible={showEditScreen}
        prompt={prompt}
        duration={recordingDuration}
        onSave={handleSaveMemory}
        onClose={handleEditScreenClose}
        onDeleteMemory={onDeleteMemory}
      />
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        data-name="Recording Bottom Sheet Overlay"
      >
        {/* Fixed black background overlay */}
        <div
          className={`
            absolute inset-0 bg-[rgba(0,0,0,0.5)] transition-opacity duration-300 ease-out
            ${isAnimating && isVisible 
              ? 'opacity-100' 
              : 'opacity-0'
            }
          `}
        />
        
        {/* Sliding bottom sheet */}
        <div className="relative w-full h-full">
          <div
            className={`
              absolute bottom-0 w-full transition-transform duration-300 ease-out
              ${isAnimating && isVisible 
                ? 'translate-y-0' 
                : 'translate-y-full'
              }
            `}
          >
            <EditMemoryContainer 
              prompt={prompt}
              onCloseClick={handleCloseClick}
              onStop={handleStop}
              onPause={handlePause}
              onResume={handleResume}
              duration={recordingDuration}
              isPaused={isPaused}
              showReplay={showReplay}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              playbackPosition={playbackPosition}
              onReRecord={handleReRecord}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isVisible={showConfirmation}
        onCancel={handleConfirmationCancel}
        onConfirm={handleConfirmationConfirm}
      />
    </>
  );
}