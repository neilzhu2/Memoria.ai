import React, { useState, useEffect } from 'react';
import { SimpleRecordingScreen } from './SimpleRecordingScreen';

interface MemoryTheme {
  id: string;
  title: string;
}

interface RecordingFlowContainerProps {
  visible: boolean;
  onClose: () => void;
  skipThemeSelection?: boolean;
  initialTheme?: MemoryTheme;
}

export function RecordingFlowContainer({
  visible,
  onClose,
  skipThemeSelection = true, // Default to true - skip theme selection
  initialTheme
}: RecordingFlowContainerProps) {
  // Always skip theme selection - simplified flow
  const [showRecordingScreen, setShowRecordingScreen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<MemoryTheme | undefined>();

  // Reset state when visible changes
  useEffect(() => {
    console.log('RecordingFlowContainer useEffect:', {
      visible,
      initialTheme: initialTheme?.title
    });

    if (visible) {
      // Go directly to recording screen
      console.log('Opening - Going directly to recording screen');
      setShowRecordingScreen(true);
      setSelectedTheme(initialTheme);
    } else {
      // Clean up when closing
      console.log('Closing - Resetting state to false');
      setShowRecordingScreen(false);
      setSelectedTheme(undefined);
    }
  }, [visible, initialTheme]);

  const handleCloseRecording = () => {
    setShowRecordingScreen(false);
    setSelectedTheme(undefined);
    onClose();
  };

  return (
    <SimpleRecordingScreen
      visible={visible && showRecordingScreen}
      onClose={handleCloseRecording}
      selectedTheme={selectedTheme}
    />
  );
}