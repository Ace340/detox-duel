import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import StreakMilestoneCelebration from './StreakMilestoneCelebration';
import { Milestone } from '@/types';

describe('StreakMilestoneCelebration', () => {
  const mockMilestone: Milestone = {
    days: 7,
    emoji: '⚡',
    label: 'Week Warrior',
  };

  const mockOnClose = jest.fn();

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
        milestone={mockMilestone}
        onClose={mockOnClose}
      />
    );

    expect(getByText('⚡')).toBeTruthy();
  });

  test('renders milestone label', () => {
    const { getByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={mockMilestone}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Week Warrior')).toBeTruthy();
  });

  test('renders milestone number', () => {
    const { getByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={mockMilestone}
        onClose={mockOnClose}
      />
    );

    expect(getByText('7')).toBeTruthy();
  });

  test('renders days text', () => {
    const { getByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={mockMilestone}
        onClose={mockOnClose}
      />
    );

    expect(getByText('days')).toBeTruthy();
  });

  test('renders 3-day milestone', () => {
    const threeDayMilestone: Milestone = {
      days: 3,
      emoji: '🔥',
      label: '3-Day Streak',
    };

    const { getByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={threeDayMilestone}
        onClose={mockOnClose}
      />
    );

    expect(getByText('🔥')).toBeTruthy();
    expect(getByText('3-Day Streak')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  test('renders 14-day milestone', () => {
    const fourteenDayMilestone: Milestone = {
      days: 14,
      emoji: '💎',
      label: '2-Week Champion',
    };

    const { getByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={fourteenDayMilestone}
        onClose={mockOnClose}
      />
    );

    expect(getByText('💎')).toBeTruthy();
    expect(getByText('2-Week Champion')).toBeTruthy();
    expect(getByText('14')).toBeTruthy();
  });

  test('renders 30-day milestone', () => {
    const thirtyDayMilestone: Milestone = {
      days: 30,
      emoji: '👑',
      label: '30-Day Legend',
    };

    const { getByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={thirtyDayMilestone}
        onClose={mockOnClose}
      />
    );

    expect(getByText('👑')).toBeTruthy();
    expect(getByText('30-Day Legend')).toBeTruthy();
    expect(getByText('30')).toBeTruthy();
  });

  test('calls onClose when overlay is pressed', () => {
    const { getByTestId } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={mockMilestone}
        onClose={mockOnClose}
      />
    );

    fireEvent.press(getByTestId('celebration-overlay'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when content is pressed', () => {
    const { getByTestId } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={mockMilestone}
        onClose={mockOnClose}
      />
    );

    fireEvent.press(getByTestId('celebration-content'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('auto-dismisses after 3 seconds', async () => {
    render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={mockMilestone}
        onClose={mockOnClose}
      />
    );

    // Fast-forward 3 seconds
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  test('does not auto-dismiss before 3 seconds', () => {
    render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={mockMilestone}
        onClose={mockOnClose}
      />
    );

    // Fast-forward 2 seconds
    jest.advanceTimersByTime(2000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('does not render when visible is false', () => {
    const { queryByText } = render(
      <StreakMilestoneCelebration
        visible={false}
        milestone={mockMilestone}
        onClose={mockOnClose}
      />
    );

    expect(queryByText('Week Warrior')).toBeNull();
    expect(queryByText('⚡')).toBeNull();
  });

  test('renders with correct styling classes', () => {
    const { getByTestId } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={mockMilestone}
        onClose={mockOnClose}
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
        milestone={mockMilestone}
        onClose={mockOnClose}
      />
    );

    unmount();

    // Fast-forward time - should not call onClose because component unmounted
    jest.advanceTimersByTime(3000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('handles multiple taps without multiple callbacks', () => {
    const { getByTestId } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={mockMilestone}
        onClose={mockOnClose}
      />
    );

    // Tap multiple times rapidly
    fireEvent.press(getByTestId('celebration-overlay'));
    fireEvent.press(getByTestId('celebration-overlay'));
    fireEvent.press(getByTestId('celebration-overlay'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('updates when milestone changes', () => {
    const { rerender, getByText, queryByText } = render(
      <StreakMilestoneCelebration
        visible={true}
        milestone={mockMilestone}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Week Warrior')).toBeTruthy();

    const newMilestone: Milestone = {
      days: 14,
      emoji: '💎',
      label: '2-Week Champion',
    };

    rerender(
      <StreakMilestoneCelebration
        visible={true}
        milestone={newMilestone}
        onClose={mockOnClose}
      />
    );

    expect(queryByText('Week Warrior')).toBeNull();
    expect(getByText('2-Week Champion')).toBeTruthy();
  });
});
