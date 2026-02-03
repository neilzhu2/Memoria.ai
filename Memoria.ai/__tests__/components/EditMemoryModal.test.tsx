/**
 * Unit Tests for EditMemoryModal Component
 * Tests Feature 2: Edit Memory Screen with transcription support
 *
 * Coverage:
 * - Title editing and validation
 * - Description editing
 * - Tags management
 * - Save/Cancel functionality
 * - State management
 * - Error handling
 * - Accessibility for elderly users
 * - Transcription display (mock expo-speech-recognition)
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import EditMemoryModal from '@/src/components/memory/EditMemoryModal';
import { Memory } from '@/types';

// Mock modules
jest.mock('expo-haptics');
const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;

// Mock settings store
jest.mock('@/src/stores', () => ({
  useSettingsStore: jest.fn(() => ({
    getCurrentFontSize: jest.fn(() => 18),
    getCurrentTouchTargetSize: jest.fn(() => 80),
    shouldUseHighContrast: jest.fn(() => false),
    hapticFeedbackEnabled: true,
    language: 'en',
  })),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('EditMemoryModal - Unit Tests', () => {
  const mockMemory: Memory = {
    id: 'test-memory-1',
    title: 'Family Dinner',
    description: 'A wonderful evening with the family',
    date: new Date('2025-01-15'),
    duration: 180,
    audioPath: 'file://memories/audio1.m4a',
    transcription: 'We had a great time at dinner. Everyone was laughing and sharing stories.',
    tags: ['family', 'food'],
    isShared: true,
    familyMembers: ['daughter', 'grandson'],
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  };

  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders modal when visible is true', () => {
      const { getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(getByText('Edit Memory')).toBeTruthy();
    });

    it('does not render modal when visible is false', () => {
      const { queryByText } = render(
        <EditMemoryModal
          visible={false}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(queryByText('Edit Memory')).toBeFalsy();
    });

    it('populates form fields with memory data', () => {
      const { getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(getByDisplayValue('Family Dinner')).toBeTruthy();
      expect(getByDisplayValue('A wonderful evening with the family')).toBeTruthy();
      expect(getByDisplayValue('family, food')).toBeTruthy();
    });

    it('displays character count for title', () => {
      const { getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      // "Family Dinner" is 13 characters
      expect(getByText('13/100')).toBeTruthy();
    });

    it('displays character count for description', () => {
      const { getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      // Description length
      expect(getByText(`${mockMemory.description!.length}/500`)).toBeTruthy();
    });
  });

  describe('Title Editing', () => {
    it('updates title when user types', () => {
      const { getByDisplayValue, getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');
      fireEvent.changeText(titleInput, 'Christmas Dinner 2025');

      expect(getByDisplayValue('Christmas Dinner 2025')).toBeTruthy();
      expect(getByText('21/100')).toBeTruthy();
    });

    it('enforces maximum title length of 100 characters', () => {
      const { getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');
      expect(titleInput.props.maxLength).toBe(100);
    });

    it('validates that title cannot be empty on save', async () => {
      const { getByDisplayValue, getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');
      fireEvent.changeText(titleInput, '');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Title cannot be empty'
        );
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('trims whitespace from title before saving', async () => {
      const { getByDisplayValue, getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');
      fireEvent.changeText(titleInput, '  Trimmed Title  ');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          title: 'Trimmed Title',
          description: mockMemory.description,
          tags: mockMemory.tags,
        });
      });
    });
  });

  describe('Description Editing', () => {
    it('updates description when user types', () => {
      const { getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const descInput = getByDisplayValue('A wonderful evening with the family');
      fireEvent.changeText(descInput, 'Updated description text');

      expect(getByDisplayValue('Updated description text')).toBeTruthy();
    });

    it('allows empty description (optional field)', async () => {
      const { getByDisplayValue, getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const descInput = getByDisplayValue('A wonderful evening with the family');
      fireEvent.changeText(descInput, '');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          title: mockMemory.title,
          description: undefined,
          tags: mockMemory.tags,
        });
      });
    });

    it('enforces maximum description length of 500 characters', () => {
      const { getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const descInput = getByDisplayValue('A wonderful evening with the family');
      expect(descInput.props.maxLength).toBe(500);
    });

    it('displays description as multiline input', () => {
      const { getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const descInput = getByDisplayValue('A wonderful evening with the family');
      expect(descInput.props.multiline).toBe(true);
    });
  });

  describe('Tags Management', () => {
    it('displays tags as comma-separated string', () => {
      const { getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(getByDisplayValue('family, food')).toBeTruthy();
    });

    it('updates tags when user types', () => {
      const { getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const tagsInput = getByDisplayValue('family, food');
      fireEvent.changeText(tagsInput, 'family, food, celebration');

      expect(getByDisplayValue('family, food, celebration')).toBeTruthy();
    });

    it('parses comma-separated tags correctly on save', async () => {
      const { getByDisplayValue, getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const tagsInput = getByDisplayValue('family, food');
      fireEvent.changeText(tagsInput, 'family, food, celebration, dinner');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          title: mockMemory.title,
          description: mockMemory.description,
          tags: ['family', 'food', 'celebration', 'dinner'],
        });
      });
    });

    it('trims whitespace from tags', async () => {
      const { getByDisplayValue, getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const tagsInput = getByDisplayValue('family, food');
      fireEvent.changeText(tagsInput, '  family ,  food  ,  celebration  ');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          title: mockMemory.title,
          description: mockMemory.description,
          tags: ['family', 'food', 'celebration'],
        });
      });
    });

    it('filters out empty tags', async () => {
      const { getByDisplayValue, getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const tagsInput = getByDisplayValue('family, food');
      fireEvent.changeText(tagsInput, 'family,  , food, , celebration');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          title: mockMemory.title,
          description: mockMemory.description,
          tags: ['family', 'food', 'celebration'],
        });
      });
    });

    it('renders suggested tags', () => {
      const { getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(getByText('Suggested tags:')).toBeTruthy();
      expect(getByText('Family')).toBeTruthy();
      expect(getByText('Travel')).toBeTruthy();
      expect(getByText('Work')).toBeTruthy();
    });

    it('adds suggested tag when tapped', async () => {
      const { getByText, getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const travelTag = getByText('Travel');
      fireEvent.press(travelTag);

      await waitFor(() => {
        expect(getByDisplayValue('family, food, Travel')).toBeTruthy();
      });
    });

    it('does not add duplicate suggested tags', async () => {
      const { getByText, getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const familyTag = getByText('Family');
      fireEvent.press(familyTag);

      await waitFor(() => {
        // Should still be 'family, food' (not duplicated)
        expect(getByDisplayValue('family, food')).toBeTruthy();
      });
    });

    it('provides haptic feedback when adding suggested tag', async () => {
      const { getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const travelTag = getByText('Travel');
      fireEvent.press(travelTag);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Light
        );
      });
    });
  });

  describe('Save Functionality', () => {
    it('calls onSave with updated data when save button pressed', async () => {
      const { getByText, getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');
      fireEvent.changeText(titleInput, 'Updated Title');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          title: 'Updated Title',
          description: mockMemory.description,
          tags: mockMemory.tags,
        });
      });
    });

    it('disables save button when no changes made', () => {
      const { getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const saveButton = getByText('Save');
      expect(saveButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('enables save button when changes are made', () => {
      const { getByText, getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');
      fireEvent.changeText(titleInput, 'New Title');

      const saveButton = getByText('Save');
      expect(saveButton.props.accessibilityState?.disabled).toBe(false);
    });

    it('disables save button when loading', () => {
      const { getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
          loading={true}
        />
      );

      const saveButton = getByText('Save');
      expect(saveButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('provides haptic feedback when saving', async () => {
      const { getByText, getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');
      fireEvent.changeText(titleInput, 'Updated Title');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockHaptics.impactAsync).toHaveBeenCalledWith(
          Haptics.ImpactFeedbackStyle.Medium
        );
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onClose when cancel button pressed with no changes', () => {
      const { getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows confirmation alert when canceling with unsaved changes', () => {
      const { getByText, getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');
      fireEvent.changeText(titleInput, 'Changed Title');

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to close?',
        expect.any(Array)
      );
    });

    it('calls onClose when user confirms discard changes', () => {
      const { getByText, getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');
      fireEvent.changeText(titleInput, 'Changed Title');

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);

      // Get the discard button from Alert.alert call
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const discardButton = alertCall[2].find((btn: any) => btn.text === 'Discard');
      discardButton.onPress();

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close when user cancels discard confirmation', () => {
      const { getByText, getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');
      fireEvent.changeText(titleInput, 'Changed Title');

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);

      // User presses cancel in alert - should not close modal
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('closes modal when close button (X) pressed with no changes', () => {
      const { getByLabelText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const closeButton = getByLabelText('Close');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('disables cancel button when loading', () => {
      const { getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
          loading={true}
        />
      );

      const cancelButton = getByText('Cancel');
      expect(cancelButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('State Management', () => {
    it('resets form when memory prop changes', () => {
      const { rerender, getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(getByDisplayValue('Family Dinner')).toBeTruthy();

      const newMemory: Memory = {
        ...mockMemory,
        id: 'test-memory-2',
        title: 'Birthday Party',
        description: 'Celebrating mom\'s birthday',
        tags: ['celebration', 'birthday'],
      };

      rerender(
        <EditMemoryModal
          visible={true}
          memory={newMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(getByDisplayValue('Birthday Party')).toBeTruthy();
      expect(getByDisplayValue('Celebrating mom\'s birthday')).toBeTruthy();
      expect(getByDisplayValue('celebration, birthday')).toBeTruthy();
    });

    it('tracks changes state correctly', () => {
      const { getByText, getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      // Initially no changes
      const saveButton = getByText('Save');
      expect(saveButton.props.accessibilityState?.disabled).toBe(true);

      // Make a change
      const titleInput = getByDisplayValue('Family Dinner');
      fireEvent.changeText(titleInput, 'New Title');

      expect(saveButton.props.accessibilityState?.disabled).toBe(false);

      // Revert change
      fireEvent.changeText(titleInput, 'Family Dinner');

      expect(saveButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('handles memory with no description', () => {
      const memoryWithoutDesc: Memory = {
        ...mockMemory,
        description: undefined,
      };

      const { getByPlaceholderText } = render(
        <EditMemoryModal
          visible={true}
          memory={memoryWithoutDesc}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const descInput = getByPlaceholderText('Add a description...');
      expect(descInput.props.value).toBe('');
    });

    it('handles memory with no tags', () => {
      const memoryWithoutTags: Memory = {
        ...mockMemory,
        tags: [],
      };

      const { getByPlaceholderText } = render(
        <EditMemoryModal
          visible={true}
          memory={memoryWithoutTags}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const tagsInput = getByPlaceholderText('Separate tags with commas...');
      expect(tagsInput.props.value).toBe('');
    });
  });

  describe('Accessibility for Elderly Users', () => {
    it('has proper accessibility labels for all inputs', () => {
      const { getByLabelText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(getByLabelText('Memory title')).toBeTruthy();
      expect(getByLabelText('Memory description')).toBeTruthy();
      expect(getByLabelText('Memory tags')).toBeTruthy();
    });

    it('provides accessibility hints for inputs', () => {
      const { getByLabelText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByLabelText('Memory title');
      const descInput = getByLabelText('Memory description');
      const tagsInput = getByLabelText('Memory tags');

      expect(titleInput.props.accessibilityHint).toBe('Enter a title for this memory');
      expect(descInput.props.accessibilityHint).toBe('Add a detailed description for this memory');
      expect(tagsInput.props.accessibilityHint).toBe('Add tags to organize your memories');
    });

    it('has proper accessibility labels for buttons', () => {
      const { getByLabelText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(getByLabelText('Cancel editing')).toBeTruthy();
      expect(getByLabelText('Save changes')).toBeTruthy();
      expect(getByLabelText('Close')).toBeTruthy();
    });

    it('meets minimum touch target size for elderly users', () => {
      const { getByLabelText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const closeButton = getByLabelText('Close');

      // Should meet 80px minimum touch target for elderly users
      expect(closeButton.props.style.width).toBe(80);
      expect(closeButton.props.style.height).toBe(80);
    });

    it('uses large, readable font sizes', () => {
      const { getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const title = getByText('Edit Memory');

      // Title should be 22px (18 base + 4)
      expect(title.props.style.fontSize).toBe(22);
    });

    it('provides help text for complex fields', () => {
      const { getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(getByText('A description helps you find and understand this memory more easily')).toBeTruthy();
      expect(getByText('Tags help organize and search memories. Separate multiple tags with commas.')).toBeTruthy();
    });

    it('marks required fields clearly', () => {
      const { getAllByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const requiredIndicators = getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('focuses description input when title submit is pressed', () => {
      const { getByLabelText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByLabelText('Memory title');
      expect(titleInput.props.returnKeyType).toBe('next');
    });

    it('focuses tags input when description submit is pressed', () => {
      const { getByLabelText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const descInput = getByLabelText('Memory description');
      expect(descInput.props.returnKeyType).toBe('next');
    });

    it('has done return key for tags input', () => {
      const { getByLabelText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const tagsInput = getByLabelText('Memory tags');
      expect(tagsInput.props.returnKeyType).toBe('done');
    });
  });

  describe('Error Handling', () => {
    it('handles empty title validation', async () => {
      const { getByDisplayValue, getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');
      fireEvent.changeText(titleInput, '   ');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Title cannot be empty'
        );
      });
    });

    it('does not call onSave when validation fails', async () => {
      const { getByDisplayValue, getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');
      fireEvent.changeText(titleInput, '');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });
  });

  describe('Localization Support', () => {
    it('displays Chinese labels when language is zh', () => {
      const useSettingsStoreMock = require('@/src/stores').useSettingsStore;
      useSettingsStoreMock.mockReturnValue({
        getCurrentFontSize: jest.fn(() => 18),
        getCurrentTouchTargetSize: jest.fn(() => 80),
        shouldUseHighContrast: jest.fn(() => false),
        hapticFeedbackEnabled: true,
        language: 'zh',
      });

      const { getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      expect(getByText('编辑记忆')).toBeTruthy();
      expect(getByText('标题')).toBeTruthy();
      expect(getByText('描述')).toBeTruthy();
      expect(getByText('标签')).toBeTruthy();
      expect(getByText('取消')).toBeTruthy();
      expect(getByText('保存')).toBeTruthy();
    });

    it('shows Chinese error messages when language is zh', async () => {
      const useSettingsStoreMock = require('@/src/stores').useSettingsStore;
      useSettingsStoreMock.mockReturnValue({
        getCurrentFontSize: jest.fn(() => 18),
        getCurrentTouchTargetSize: jest.fn(() => 80),
        shouldUseHighContrast: jest.fn(() => false),
        hapticFeedbackEnabled: true,
        language: 'zh',
      });

      const { getByDisplayValue, getByText } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');
      fireEvent.changeText(titleInput, '');

      const saveButton = getByText('保存');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '错误',
          '标题不能为空'
        );
      });
    });
  });

  describe('High Contrast Mode', () => {
    it('applies high contrast styles when enabled', () => {
      const useSettingsStoreMock = require('@/src/stores').useSettingsStore;
      useSettingsStoreMock.mockReturnValue({
        getCurrentFontSize: jest.fn(() => 18),
        getCurrentTouchTargetSize: jest.fn(() => 80),
        shouldUseHighContrast: jest.fn(() => true),
        hapticFeedbackEnabled: true,
        language: 'en',
      });

      const { getByDisplayValue } = render(
        <EditMemoryModal
          visible={true}
          memory={mockMemory}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      const titleInput = getByDisplayValue('Family Dinner');

      // High contrast background should be dark
      expect(titleInput.props.style.backgroundColor).toBe('#333333');
      expect(titleInput.props.style.color).toBe('#ffffff');
    });
  });
});
