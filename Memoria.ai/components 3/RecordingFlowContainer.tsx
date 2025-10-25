import React, { useState, useEffect } from 'react';
import { ThemeSelectionModal } from './ThemeSelectionModal';
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
  skipThemeSelection = false,
  initialTheme
}: RecordingFlowContainerProps) {
  const [showThemeSelection, setShowThemeSelection] = useState(!skipThemeSelection);
  const [showRecordingScreen, setShowRecordingScreen] = useState(skipThemeSelection);
  const [selectedTheme, setSelectedTheme] = useState<MemoryTheme | undefined>();

  // Reset state when visible changes
  useEffect(() => {
    console.log('RecordingFlowContainer useEffect:', {
      visible,
      skipThemeSelection,
      initialTheme: initialTheme?.title
    });

    if (visible) {
      // Always reset to initial state when opening
      const newShowTheme = !skipThemeSelection;
      const newShowRecording = skipThemeSelection;

      console.log('Opening - Setting state:', {
        showThemeSelection: newShowTheme,
        showRecordingScreen: newShowRecording
      });

      setShowThemeSelection(newShowTheme);
      setShowRecordingScreen(newShowRecording);
      setSelectedTheme(initialTheme);
    } else {
      // Clean up when closing
      console.log('Closing - Resetting state to false');
      setShowThemeSelection(false);
      setShowRecordingScreen(false);
      setSelectedTheme(undefined);
    }
  }, [visible, skipThemeSelection, initialTheme]);

  const handleThemeSelect = (theme: MemoryTheme) => {
    console.log('Theme selected:', theme.title);
    setSelectedTheme(theme);
    setShowThemeSelection(false);
    setShowRecordingScreen(true);
    console.log('After theme select - showThemeSelection: false, showRecordingScreen: true');
  };

  const handleCloseThemeSelection = () => {
    setShowThemeSelection(false);
    onClose();
  };

  const handleCloseRecording = () => {
    setShowRecordingScreen(false);
    setSelectedTheme(undefined);
    setShowThemeSelection(false); // Don't reset to true here, let useEffect handle it

    onClose();
  };

  return (
    <>
      {/* Theme Selection Modal */}
      <ThemeSelectionModal
        visible={visible && showThemeSelection}
        onClose={handleCloseThemeSelection}
        onThemeSelect={handleThemeSelect}
      />

      {/* Recording Screen */}
      <SimpleRecordingScreen
        visible={visible && showRecordingScreen}
        onClose={handleCloseRecording}
        selectedTheme={selectedTheme}
      />
    </>
  );
}