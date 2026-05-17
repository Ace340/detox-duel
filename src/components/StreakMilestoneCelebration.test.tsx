import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StreakMilestoneCelebration } from './StreakMilestoneCelebration';

describe('StreakMilestoneCelebration', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders milestone emoji', () => {
    const { getByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={7}
        emoji="⚡"
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('⚡')).toBeTruthy();
  });

  test('renders milestone label', () => {
    const { getByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={7}
        emoji="⚡"
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Week Warrior!')).toBeTruthy();
  });

  test('renders milestone number', () => {
    const { getByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={7}
        emoji="⚡"
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('7')).toBeTruthy();
  });

  test('renders days text', () => {
    const { getByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={7}
        emoji="⚡"
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('days')).toBeTruthy();
  });

  test('renders 3-day milestone', () => {
    const { getByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={3}
        emoji="🔥"
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('🔥')).toBeTruthy();
    expect(getByText('3-Day Streak!')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  test('renders 14-day milestone', () => {
    const { getByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={14}
        emoji="💎"
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('💎')).toBeTruthy();
    expect(getByText('2-Week Champion!')).toBeTruthy();
    expect(getByText('14')).toBeTruthy();
  });

  test('renders 30-day milestone', () => {
    const { getByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={30}
        emoji="👑"
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('👑')).toBeTruthy();
    expect(getByText('30-Day Legend!')).toBeTruthy();
    expect(getByText('30')).toBeTruthy();
  });

  test('calls onClose when overlay is pressed', () => {
    const { getByTestId } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={7}
        emoji="⚡"
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.press(getByTestId('celebration-overlay'));

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when content is pressed', () => {
    const { getByTestId } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={7}
        emoji="⚡"
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.press(getByTestId('celebration-content'));

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  test('auto-dismisses after 3 seconds', async () => {
    render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={7}
        emoji="⚡"
        onDismiss={mockOnDismiss}
      />
    );

    // Fast-forward 3 seconds
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  test('does not auto-dismiss before 3 seconds', () => {
    render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={7}
        emoji="⚡"
        onDismiss={mockOnDismiss}
      />
    );

    // Fast-forward 2 seconds
    jest.advanceTimersByTime(2000);

    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  test('does not render when visible is false', () => {
    const { queryByText } = render(
      <StreakMilestoneCelebration
        visible={false}
        milestone={7}
        emoji="⚡"
        onDismiss={mockOnDismiss}
      />
    );

    expect(queryByText('Week Warrior!')).toBeNull();
    expect(queryByText('⚡')).toBeNull();
  });

  test('renders with correct styling classes', () => {
    const { getByTestId } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={7}
        emoji="⚡"
        onDismiss={mockOnDismiss}
      />
    );

    const overlay = getByTestId('celebration-overlay');
    expect(overlay).toBeTruthy();

    const content = getByTestId('celebration-content');
    expect(content).toBeTruthy();
  });

  test('clears timeout on unmount', () => {
    const { unmount } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={7}
        emoji="⚡"
        onDismiss={mockOnDismiss}
      />
    );

    unmount();

    // Fast-forward time - should not call onDismiss because component unmounted
    jest.advanceTimersByTime(3000);

    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  test('handles multiple taps without multiple callbacks', () => {
    const { getByTestId } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={7}
        emoji="⚡"
        onDismiss={mockOnDismiss}
      />
    );

    // Tap multiple times rapidly
    fireEvent.press(getByTestId('celebration-overlay'));
    fireEvent.press(getByTestId('celebration-overlay'));
    fireEvent.press(getByTestId('celebration-overlay'));

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  test('updates when milestone changes', () => {
    const { rerender, getByText, queryByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={7}
        emoji="⚡"
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Week Warrior!')).toBeTruthy();

    rerender(
      <StreakMilestoneCelebration
        visible={true}
        milestone={14}
        emoji="💎"
        onDismiss={mockOnDismiss}
      />
    );

    expect(queryByText('Week Warrior!')).toBeNull();
    expect(getByText('2-Week Champion!')).toBeTruthy();
  });
});
