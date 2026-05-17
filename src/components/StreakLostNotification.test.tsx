import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StreakLostNotification } from './StreakLostNotification';

describe('StreakLostNotification', () => {
  const mockOnStartNewStreak = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders encouraging message with correct streak number', () => {
    const { getByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={7}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText(/Your 7-day streak was lost/)).toBeTruthy();
  });

  test('renders for 3-day streak', () => {
    const { getByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={3}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText(/Your 3-day streak was lost/)).toBeTruthy();
  });

  test('renders for 14-day streak', () => {
    const { getByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={14}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText(/Your 14-day streak was lost/)).toBeTruthy();
  });

  test('renders for 30-day streak', () => {
    const { getByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={30}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText(/Your 30-day streak was lost/)).toBeTruthy();
  });

  test('renders sad emoji', () => {
    const { getByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={5}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Oh no! 😢')).toBeTruthy();
  });

  test('calls onStartNewStreak when Start New Streak button is pressed', () => {
    const { getByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={7}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.press(getByText('Start New Streak'));

    expect(mockOnStartNewStreak).toHaveBeenCalledTimes(1);
  });

  test('calls onDismiss when Maybe Later button is pressed', () => {
    const { getByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={7}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.press(getByText('Maybe Later'));

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  test('renders Tip section', () => {
    const { getByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={5}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText(/Tip:/)).toBeTruthy();
  });

  test('renders encouraging tip content', () => {
    const { getByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={5}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    // Should contain encouraging advice
    expect(getByText(/Every day is a new opportunity/)).toBeTruthy();
  });

  test('does not render when visible is false', () => {
    const { queryByText } = render(
      <StreakLostNotification
        visible={false}
        previousStreak={7}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    expect(queryByText(/Your 7-day streak was lost/)).toBeNull();
    expect(queryByText('Start New Streak')).toBeNull();
    expect(queryByText('Maybe Later')).toBeNull();
  });

  test('renders both action buttons', () => {
    const { getByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={10}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Start New Streak')).toBeTruthy();
    expect(getByText('Maybe Later')).toBeTruthy();
  });

  test('handles button presses correctly', () => {
    const { getByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={5}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    // Press Start New Streak
    fireEvent.press(getByText('Start New Streak'));
    expect(mockOnStartNewStreak).toHaveBeenCalledTimes(1);
    expect(mockOnDismiss).not.toHaveBeenCalled();

    // Press Maybe Later
    fireEvent.press(getByText('Maybe Later'));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  test('renders card container with proper styling', () => {
    const { getByTestId } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={7}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    const container = getByTestId('streak-lost-card');
    expect(container).toBeTruthy();
  });

  test('displays streak number prominently', () => {
    const { getByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={21}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('21')).toBeTruthy();
  });

  test('maintains encouraging tone throughout', () => {
    const { getByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={3}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    // Check for encouraging words
    expect(getByText(/start/)).toBeTruthy();
    expect(getByText(/opportunity/)).toBeTruthy();
  });

  test('updates when previousStreak changes', () => {
    const { rerender, getByText, queryByText } = render(
      <StreakLostNotification
        visible={true}
        previousStreak={5}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText(/Your 5-day streak was lost/)).toBeTruthy();

    rerender(
      <StreakLostNotification
        visible={true}
        previousStreak={10}
        onStartNewStreak={mockOnStartNewStreak}
        onDismiss={mockOnDismiss}
      />
    );

    expect(queryByText(/Your 5-day streak was lost/)).toBeNull();
    expect(getByText(/Your 10-day streak was lost/)).toBeTruthy();
  });
});
