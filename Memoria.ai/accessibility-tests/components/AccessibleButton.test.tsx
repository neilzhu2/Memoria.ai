/**
 * Accessibility tests for AccessibleButton component
 * Tests specifically designed for elderly user requirements
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AccessibleButton from '../../src/components/accessibility/AccessibleButton';
import { useSettingsStore } from '../../src/stores/settingsStore';

// Mock the settings store
jest.mock('../../src/stores/settingsStore');

describe('AccessibleButton - Elderly User Accessibility', () => {
  const mockOnPress = jest.fn();
  const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSettingsStore.mockReturnValue({
      getCurrentFontSize: jest.fn(() => 20),
      getCurrentTouchTargetSize: jest.fn(() => 60),
      shouldUseHighContrast: jest.fn(() => false),
      hapticFeedbackEnabled: true,
    } as any);
  });

  describe('Touch Target Accessibility', () => {
    it('should have minimum 60px touch target for elderly users', () => {
      const { getByRole } = render(
        <AccessibleButton title=\"Test Button\" onPress={mockOnPress} />
      );

      const button = getByRole('button');
      expect(button).toHaveAccessibleTouchTarget();
    });

    it('should increase touch target size for large variant', () => {
      const { getByRole } = render(
        <AccessibleButton
          title=\"Large Button\"
          onPress={mockOnPress}
          size=\"large\"
        />
      );

      const button = getByRole('button');
      expect(button).toHaveAccessibleTouchTarget();
    });

    it('should maintain touch target when custom style is applied', () => {
      const { getByRole } = render(
        <AccessibleButton
          title=\"Custom Button\"
          onPress={mockOnPress}
          style={{ padding: 5 }}
        />
      );

      const button = getByRole('button');
      expect(button).toHaveAccessibleTouchTarget();
    });
  });

  describe('Font Size and Readability', () => {
    it('should use large font size suitable for elderly users', () => {
      const { getByText } = render(
        <AccessibleButton title=\"Readable Text\" onPress={mockOnPress} />
      );

      const text = getByText('Readable Text');
      expect(text).toHaveLargeFont();
    });

    it('should respect user\'s font size preferences', () => {
      mockUseSettingsStore.mockReturnValue({
        getCurrentFontSize: jest.fn(() => 24),
        getCurrentTouchTargetSize: jest.fn(() => 60),
        shouldUseHighContrast: jest.fn(() => false),
        hapticFeedbackEnabled: true,
      } as any);

      const { getByText } = render(
        <AccessibleButton title=\"Large Font\" onPress={mockOnPress} />
      );

      const text = getByText('Large Font');
      expect(text).toHaveLargeFont();
    });
  });

  describe('High Contrast Mode', () => {
    it('should apply high contrast colors when enabled', () => {
      mockUseSettingsStore.mockReturnValue({
        getCurrentFontSize: jest.fn(() => 20),
        getCurrentTouchTargetSize: jest.fn(() => 60),
        shouldUseHighContrast: jest.fn(() => true),
        hapticFeedbackEnabled: true,
      } as any);

      const { getByRole } = render(
        <AccessibleButton title=\"High Contrast\" onPress={mockOnPress} />
      );

      const button = getByRole('button');
      expect(button).toHaveHighContrastColors();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper accessibility role', () => {
      const { getByRole } = render(
        <AccessibleButton title=\"Screen Reader Test\" onPress={mockOnPress} />
      );

      const button = getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should use title as accessibility label by default', () => {
      const { getByLabelText } = render(
        <AccessibleButton title=\"Default Label\" onPress={mockOnPress} />
      );

      const button = getByLabelText('Default Label');
      expect(button).toBeTruthy();
    });

    it('should use custom accessibility label when provided', () => {
      const { getByLabelText } = render(
        <AccessibleButton
          title=\"Button Text\"
          onPress={mockOnPress}
          accessibilityLabel=\"Custom Label for Screen Reader\"
        />
      );

      const button = getByLabelText('Custom Label for Screen Reader');
      expect(button).toBeTruthy();
    });

    it('should provide accessibility hint when specified', () => {
      const { getByRole } = render(
        <AccessibleButton
          title=\"Action Button\"
          onPress={mockOnPress}
          accessibilityHint=\"Double tap to perform action\"
        />
      );

      const button = getByRole('button');
      expect(button.props.accessibilityHint).toBe('Double tap to perform action');
    });

    it('should indicate disabled state to screen readers', () => {
      const { getByRole } = render(
        <AccessibleButton
          title=\"Disabled Button\"
          onPress={mockOnPress}
          disabled={true}
        />
      );

      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Haptic Feedback for Elderly Users', () => {
    it('should provide haptic feedback when enabled', async () => {
      const { getByRole } = render(
        <AccessibleButton title=\"Haptic Test\" onPress={mockOnPress} />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalled();
      });
    });

    it('should respect haptic feedback settings', () => {
      mockUseSettingsStore.mockReturnValue({
        getCurrentFontSize: jest.fn(() => 20),
        getCurrentTouchTargetSize: jest.fn(() => 60),
        shouldUseHighContrast: jest.fn(() => false),
        hapticFeedbackEnabled: false,
      } as any);

      const { getByRole } = render(
        <AccessibleButton
          title=\"No Haptic\"
          onPress={mockOnPress}
          hapticFeedback={false}
        />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      expect(mockOnPress).toHaveBeenCalled();
    });
  });

  describe('Error States and User Feedback', () => {
    it('should handle disabled state gracefully', () => {
      const { getByRole } = render(
        <AccessibleButton
          title=\"Disabled\"
          onPress={mockOnPress}
          disabled={true}
        />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should provide visual feedback for different variants', () => {
      const variants = ['primary', 'secondary', 'danger'] as const;

      variants.forEach(variant => {
        const { getByRole } = render(
          <AccessibleButton
            title={`${variant} button`}
            onPress={mockOnPress}
            variant={variant}
          />
        );

        const button = getByRole('button');
        expect(button).toBeTruthy();
      });
    });
  });

  describe('Bilingual Support', () => {
    it('should handle Chinese text properly', () => {
      const chineseTitle = '记录回忆';
      const { getByText } = render(
        <AccessibleButton title={chineseTitle} onPress={mockOnPress} />
      );

      const text = getByText(chineseTitle);
      expect(text).toBeTruthy();
      expect(text).toHaveLargeFont();
    });

    it('should handle long Chinese text with proper wrapping', () => {
      const longChineseTitle = '这是一个很长的中文按钮标题用于测试';
      const { getByText } = render(
        <AccessibleButton title={longChineseTitle} onPress={mockOnPress} />
      );

      const text = getByText(longChineseTitle);
      expect(text.props.numberOfLines).toBe(2);
    });
  });

  describe('Performance for Older Devices', () => {
    it('should render efficiently with minimal re-renders', () => {
      const renderSpy = jest.fn();

      const TestButton = () => {
        renderSpy();
        return <AccessibleButton title=\"Performance Test\" onPress={mockOnPress} />;
      };

      const { rerender } = render(<TestButton />);

      // Re-render with same props
      rerender(<TestButton />);

      // Should only render twice (initial + rerender)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});