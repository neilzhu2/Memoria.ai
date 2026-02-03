import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RecordingFlowContainer } from '@/components/RecordingFlowContainer';

// Mock the dependencies
jest.mock('@/components/ThemeSelectionModal', () => ({
  ThemeSelectionModal: ({ visible, onThemeSelect, onClose }: any) => {
    if (!visible) return null;
    return (
      <MockComponent testID="theme-modal">
        <MockButton
          testID="theme-option-1"
          onPress={() => onThemeSelect({ id: 'test-1', title: 'Test Theme 1' })}
        />
        <MockButton testID="close-theme" onPress={onClose} />
      </MockComponent>
    );
  }
}));

jest.mock('@/components/SimpleRecordingScreen', () => ({
  SimpleRecordingScreen: ({ visible, selectedTheme }: any) => {
    if (!visible) return null;
    return (
      <MockComponent testID="recording-screen">
        <MockText testID="selected-theme">{selectedTheme?.title || 'No theme'}</MockText>
      </MockComponent>
    );
  }
}));

describe('RecordingFlowContainer - Theme Selection Bug', () => {
  it('should show recording screen on second theme selection', async () => {
    const onClose = jest.fn();
    const { getByTestId, rerender, queryByTestId } = render(
      <RecordingFlowContainer
        visible={true}
        onClose={onClose}
        skipThemeSelection={false}
      />
    );

    // First selection
    console.log('=== First Theme Selection ===');
    expect(getByTestId('theme-modal')).toBeTruthy();

    const themeOption = getByTestId('theme-option-1');
    fireEvent.press(themeOption);

    await waitFor(() => {
      const recordingScreen = queryByTestId('recording-screen');
      console.log('First recording screen visible:', !!recordingScreen);
      expect(recordingScreen).toBeTruthy();
    });

    // Close the recording flow
    console.log('=== Closing Recording Flow ===');
    rerender(
      <RecordingFlowContainer
        visible={false}
        onClose={onClose}
        skipThemeSelection={false}
      />
    );

    await waitFor(() => {
      expect(queryByTestId('recording-screen')).toBeNull();
    });

    // Open again and select second time
    console.log('=== Second Theme Selection ===');
    rerender(
      <RecordingFlowContainer
        visible={true}
        onClose={onClose}
        skipThemeSelection={false}
      />
    );

    await waitFor(() => {
      const themeModal = queryByTestId('theme-modal');
      console.log('Second theme modal visible:', !!themeModal);
      expect(themeModal).toBeTruthy();
    });

    const themeOption2 = getByTestId('theme-option-1');
    fireEvent.press(themeOption2);

    await waitFor(() => {
      const recordingScreen = queryByTestId('recording-screen');
      console.log('Second recording screen visible:', !!recordingScreen);
      expect(recordingScreen).toBeTruthy(); // This is where it fails
    }, { timeout: 3000 });
  });
});

// Simple mock components
const MockComponent = ({ children, testID }: any) => (
  <div data-testid={testID}>{children}</div>
);

const MockButton = ({ children, testID, onPress }: any) => (
  <button data-testid={testID} onClick={onPress}>{children}</button>
);

const MockText = ({ children, testID }: any) => (
  <span data-testid={testID}>{children}</span>
);
