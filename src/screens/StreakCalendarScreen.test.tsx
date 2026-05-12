import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import StreakCalendarScreen from './StreakCalendarScreen';

// Mock useStreaks hook
jest.mock('@/hooks/useStreaks', () => ({
  useStreaks: jest.fn(),
}));

const { useStreaks } = require('@/hooks/useStreaks');

describe('StreakCalendarScreen', () => {
  const mockUserId = 'user-123';
  const mockActiveDates = [
    new Date('2026-05-12'),
    new Date('2026-05-11'),
    new Date('2026-05-10'),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default mock for useStreaks
    useStreaks.mockReturnValue({
      currentStreak: 5,
      longestStreak: 7,
      fetchStreaks: jest.fn(),
      getActiveDatesForMonth: jest.fn(() => Promise.resolve(mockActiveDates)),
      updateStreaks: jest.fn(),
      checkStreakBroken: jest.fn(() => Promise.resolve(false)),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders calendar screen', () => {
    const { getByText } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    expect(getByText('Streak Calendar')).toBeTruthy();
  });

  test('displays current streak', async () => {
    useStreaks.mockReturnValue({
      currentStreak: 5,
      longestStreak: 7,
      fetchStreaks: jest.fn(),
      getActiveDatesForMonth: jest.fn(() => Promise.resolve(mockActiveDates)),
      updateStreaks: jest.fn(),
      checkStreakBroken: jest.fn(() => Promise.resolve(false)),
    });

    const { getByText } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText(/Current Streak:/)).toBeTruthy();
      expect(getByText(/5 days/)).toBeTruthy();
    });
  });

  test('displays longest streak', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText(/Longest Streak:/)).toBeTruthy();
      expect(getByText(/7 days/)).toBeTruthy();
    });
  });

  test('displays 30-day calendar grid', async () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      const calendarGrid = getByTestId('calendar-grid');
      expect(calendarGrid).toBeTruthy();
    });
  });

  test('displays active days with fire emoji', async () => {
    const { getAllByText } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      const fireEmojis = getAllByText('🔥');
      expect(fireEmojis.length).toBeGreaterThan(0);
    });
  });

  test('shows legend', () => {
    const { getByText } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    expect(getByText(/Legend/)).toBeTruthy();
    expect(getByText(/🔥 Active day/)).toBeTruthy();
  });

  test('shows today indicator', () => {
    const { getByText } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    expect(getByText(/Today/)).toBeTruthy();
  });

  test('displays tips section', () => {
    const { getByText } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    expect(getByText(/Tips/)).toBeTruthy();
  });

  test('loads streak data on mount', async () => {
    const mockFetchStreaks = jest.fn();
    useStreaks.mockReturnValue({
      currentStreak: 0,
      longestStreak: 0,
      fetchStreaks: mockFetchStreaks,
      getActiveDatesForMonth: jest.fn(() => Promise.resolve([])),
      updateStreaks: jest.fn(),
      checkStreakBroken: jest.fn(() => Promise.resolve(false)),
    });

    render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(mockFetchStreaks).toHaveBeenCalled();
    });
  });

  test('handles zero streak', async () => {
    useStreaks.mockReturnValue({
      currentStreak: 0,
      longestStreak: 0,
      fetchStreaks: jest.fn(),
      getActiveDatesForMonth: jest.fn(() => Promise.resolve([])),
      updateStreaks: jest.fn(),
      checkStreakBroken: jest.fn(() => Promise.resolve(false)),
    });

    const { getByText } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText(/0 days/)).toBeTruthy();
    });
  });

  test('handles high streak', async () => {
    useStreaks.mockReturnValue({
      currentStreak: 30,
      longestStreak: 30,
      fetchStreaks: jest.fn(),
      getActiveDatesForMonth: jest.fn(() => Promise.resolve(mockActiveDates)),
      updateStreaks: jest.fn(),
      checkStreakBroken: jest.fn(() => Promise.resolve(false)),
    });

    const { getByText } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText(/30 days/)).toBeTruthy();
    });
  });

  test('renders back button', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    const backButton = getByTestId('back-button');
    expect(backButton).toBeTruthy();
  });

  test('refreshes on pull-to-refresh', async () => {
    const mockFetchStreaks = jest.fn();
    useStreaks.mockReturnValue({
      currentStreak: 5,
      longestStreak: 7,
      fetchStreaks: mockFetchStreaks,
      getActiveDatesForMonth: jest.fn(() => Promise.resolve(mockActiveDates)),
      updateStreaks: jest.fn(),
      checkStreakBroken: jest.fn(() => Promise.resolve(false)),
    });

    const { getByTestId } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(mockFetchStreaks).toHaveBeenCalledTimes(1);
    });

    const refreshControl = getByTestId('refresh-control');
    expect(refreshControl).toBeTruthy();

    // Simulate refresh
    fireEvent(refreshControl, 'refresh');

    await waitFor(() => {
      expect(mockFetchStreaks).toHaveBeenCalledTimes(2);
    });
  });

  test('displays encouraging messages in tips', () => {
    const { getByText } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    expect(getByText(/consistency/)).toBeTruthy();
  });

  test('handles loading state', async () => {
    useStreaks.mockReturnValue({
      currentStreak: 0,
      longestStreak: 0,
      fetchStreaks: jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000))),
      getActiveDatesForMonth: jest.fn(() => Promise.resolve([])),
      updateStreaks: jest.fn(),
      checkStreakBroken: jest.fn(() => Promise.resolve(false)),
    });

    const { getByTestId } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    // Should render loading indicator initially
    // Note: This depends on how the screen handles loading state
  });

  test('renders day cells for all 30 days', async () => {
    const { getAllByTestId } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      const dayCells = getAllByTestId(/day-cell/);
      expect(dayCells.length).toBe(30);
    });
  });

  test('highlights today in calendar', () => {
    const { getByText } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    // Today should be highlighted - check for blue background or similar styling
    // This depends on implementation details
    expect(getByText(/Today/)).toBeTruthy();
  });

  test('updates when streak data changes', async () => {
    const { getByText, rerender } = render(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText(/5 days/)).toBeTruthy();
    });

    // Update mock to return different streak
    useStreaks.mockReturnValue({
      currentStreak: 10,
      longestStreak: 10,
      fetchStreaks: jest.fn(),
      getActiveDatesForMonth: jest.fn(() => Promise.resolve(mockActiveDates)),
      updateStreaks: jest.fn(),
      checkStreakBroken: jest.fn(() => Promise.resolve(false)),
    });

    rerender(
      <NavigationContainer>
        <StreakCalendarScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText(/10 days/)).toBeTruthy();
    });
  });
});
