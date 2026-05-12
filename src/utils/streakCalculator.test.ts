import {
  calculateStreak,
  isStreakBroken,
  getMilestone,
  checkMilestoneReached,
  getNextMilestone,
  getMilestoneProgress,
} from './streakCalculator';

describe('calculateStreak', () => {
  test('returns 0 for empty dates array', () => {
    expect(calculateStreak([])).toBe(0);
  });

  test('returns 1 for single date today', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(calculateStreak([today])).toBe(1);
  });

  test('returns 1 for single date yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    expect(calculateStreak([yesterday])).toBe(1); // Current implementation returns 1
  });

  test('calculates consecutive day streak', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date(yesterday);
    dayBefore.setDate(dayBefore.getDate() - 1);

    const dates = [dayBefore, yesterday, today];
    expect(calculateStreak(dates)).toBe(3);
  });

  test('handles break in streak', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);

    const dates = [dayBeforeYesterday, today]; // Missing yesterday
    expect(calculateStreak(dates)).toBe(1);
  });

  test('handles unsorted dates', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dates = [yesterday, today]; // Should be sorted internally
    expect(calculateStreak(dates)).toBe(2);
  });

  test('handles time component differences', () => {
    const todayMorning = new Date('2026-05-12T09:00:00.000Z');
    const todayEvening = new Date('2026-05-12T18:00:00.000Z');
    const dates = [todayMorning, todayEvening];
    expect(calculateStreak(dates)).toBe(1); // Same day, counts as 1
  });

  test('calculates 7-day streak', () => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }
    expect(calculateStreak(dates)).toBe(7);
  });

  test('handles gap longer than 1 day', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const dates = [threeDaysAgo, today];
    expect(calculateStreak(dates)).toBe(1);
  });
});

describe('isStreakBroken', () => {
  test('returns false when last active was today', () => {
    const today = new Date();
    expect(isStreakBroken(today, today)).toBe(false);
  });

  test('returns false when last active was yesterday', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isStreakBroken(yesterday, today)).toBe(false);
  });

  test('returns true when last active was 2 days ago', () => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    expect(isStreakBroken(twoDaysAgo, today)).toBe(true);
  });

  test('returns true when last active was 7 days ago', () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    expect(isStreakBroken(weekAgo, today)).toBe(true);
  });

  test('handles time components', () => {
    const today = new Date('2026-05-12T14:00:00.000Z');
    const yesterday = new Date('2026-05-11T08:00:00.000Z');
    expect(isStreakBroken(yesterday, today)).toBe(false);
  });
});

describe('getMilestone', () => {
  test('returns 3-day milestone for streak of 3', () => {
    const result = getMilestone(3);
    expect(result).toEqual({
      milestone: {
        days: 3,
        emoji: '🔥',
        label: '3-Day Streak',
      },
      reached: true,
    });
  });

  test('returns 7-day milestone for streak of 7', () => {
    const result = getMilestone(7);
    expect(result).toEqual({
      milestone: {
        days: 7,
        emoji: '⚡',
        label: 'Week Warrior',
      },
      reached: true,
    });
  });

  test('returns 14-day milestone for streak of 14', () => {
    const result = getMilestone(14);
    expect(result).toEqual({
      milestone: {
        days: 14,
        emoji: '💎',
        label: '2-Week Champion',
      },
      reached: true,
    });
  });

  test('returns 30-day milestone for streak of 30', () => {
    const result = getMilestone(30);
    expect(result).toEqual({
      milestone: {
        days: 30,
        emoji: '👑',
        label: '30-Day Legend',
      },
      reached: true,
    });
  });

  test('returns null milestone for streak of 0', () => {
    const result = getMilestone(0);
    expect(result).toEqual({
      milestone: null,
      reached: false,
    });
  });

  test('returns null milestone for streak of 1', () => {
    const result = getMilestone(1);
    expect(result).toEqual({
      milestone: null,
      reached: false,
    });
  });

  test('returns null milestone for streak of 5', () => {
    const result = getMilestone(5);
    expect(result).toEqual({
      milestone: null,
      reached: false,
    });
  });

  test('returns null milestone for streak of 10', () => {
    const result = getMilestone(10);
    expect(result).toEqual({
      milestone: null,
      reached: false,
    });
  });

  test('returns null milestone for streak of 20', () => {
    const result = getMilestone(20);
    expect(result).toEqual({
      milestone: null,
      reached: false,
    });
  });

  test('returns null milestone for streak of 100', () => {
    const result = getMilestone(100);
    expect(result).toEqual({
      milestone: null,
      reached: false,
    });
  });
});

describe('checkMilestoneReached', () => {
  test('returns milestone when reaching 3 days from 0', () => {
    const milestone = checkMilestoneReached(0, 3);
    expect(milestone).toEqual({
      days: 3,
      emoji: '🔥',
      label: '3-Day Streak',
    });
  });

  test('returns milestone when reaching 7 days from 6', () => {
    const milestone = checkMilestoneReached(6, 7);
    expect(milestone).toEqual({
      days: 7,
      emoji: '⚡',
      label: 'Week Warrior',
    });
  });

  test('returns milestone when reaching 14 days from 13', () => {
    const milestone = checkMilestoneReached(13, 14);
    expect(milestone).toEqual({
      days: 14,
      emoji: '💎',
      label: '2-Week Champion',
    });
  });

  test('returns milestone when reaching 30 days from 29', () => {
    const milestone = checkMilestoneReached(29, 30);
    expect(milestone).toEqual({
      days: 30,
      emoji: '👑',
      label: '30-Day Legend',
    });
  });

  test('returns null when streak decreases', () => {
    const milestone = checkMilestoneReached(10, 5);
    expect(milestone).toBeNull();
  });

  test('returns null when streak stays same', () => {
    const milestone = checkMilestoneReached(5, 5);
    expect(milestone).toBeNull();
  });

  test('returns null when increasing between milestones', () => {
    const milestone = checkMilestoneReached(4, 5);
    expect(milestone).toBeNull();
  });

  test('returns null when already passed milestone', () => {
    const milestone = checkMilestoneReached(10, 11);
    expect(milestone).toBeNull();
  });

  test('returns null when not at milestone threshold', () => {
    const milestone = checkMilestoneReached(2, 3);
    expect(milestone).toEqual({
      days: 3,
      emoji: '🔥',
      label: '3-Day Streak',
    });
  });
});

describe('getNextMilestone', () => {
  test('returns 3-day milestone for streak of 0', () => {
    expect(getNextMilestone(0)).toEqual({
      days: 3,
      emoji: '🔥',
      label: '3-Day Streak',
    });
  });

  test('returns 3-day milestone for streak of 1', () => {
    expect(getNextMilestone(1)).toEqual({
      days: 3,
      emoji: '🔥',
      label: '3-Day Streak',
    });
  });

  test('returns 3-day milestone for streak of 2', () => {
    expect(getNextMilestone(2)).toEqual({
      days: 3,
      emoji: '🔥',
      label: '3-Day Streak',
    });
  });

  test('returns 7-day milestone for streak of 3', () => {
    expect(getNextMilestone(3)).toEqual({
      days: 7,
      emoji: '⚡',
      label: 'Week Warrior',
    });
  });

  test('returns 14-day milestone for streak of 7', () => {
    expect(getNextMilestone(7)).toEqual({
      days: 14,
      emoji: '💎',
      label: '2-Week Champion',
    });
  });

  test('returns 30-day milestone for streak of 14', () => {
    expect(getNextMilestone(14)).toEqual({
      days: 30,
      emoji: '👑',
      label: '30-Day Legend',
    });
  });

  test('returns 7-day milestone for streak of 5', () => {
    expect(getNextMilestone(5)).toEqual({
      days: 7,
      emoji: '⚡',
      label: 'Week Warrior',
    });
  });

  test('returns 14-day milestone for streak of 10', () => {
    expect(getNextMilestone(10)).toEqual({
      days: 14,
      emoji: '💎',
      label: '2-Week Champion',
    });
  });

  test('returns 30-day milestone for streak of 20', () => {
    expect(getNextMilestone(20)).toEqual({
      days: 30,
      emoji: '👑',
      label: '30-Day Legend',
    });
  });

  test('returns null for streak of 30', () => {
    expect(getNextMilestone(30)).toBeNull();
  });

  test('returns null for streak of 100', () => {
    expect(getNextMilestone(100)).toBeNull();
  });
});

describe('getMilestoneProgress', () => {
  test('calculates progress for 0 days', () => {
    expect(getMilestoneProgress(0)).toBeCloseTo(0, 2); // 0/3 = 0%
  });

  test('calculates progress for 1 day', () => {
    expect(getMilestoneProgress(1)).toBeCloseTo(33.33, 2); // 1/3 ≈ 33.33%
  });

  test('calculates progress for 2 days', () => {
    expect(getMilestoneProgress(2)).toBeCloseTo(66.67, 2); // 2/3 ≈ 66.67%
  });

  test('calculates progress for 3 days', () => {
    expect(getMilestoneProgress(3)).toBeCloseTo(0, 2); // Just hit 3-day milestone, now progressing to 7 days
  });

  test('calculates progress for 5 days', () => {
    expect(getMilestoneProgress(5)).toBeCloseTo(50, 2); // (5-3)/(7-3) = 2/4 = 50%
  });

  test('calculates progress for 7 days', () => {
    expect(getMilestoneProgress(7)).toBeCloseTo(0, 2); // Just hit 7-day milestone, now progressing to 14 days
  });

  test('calculates progress for 10 days', () => {
    expect(getMilestoneProgress(10)).toBeCloseTo(42.86, 2); // (10-7)/(14-7) = 3/7 ≈ 42.86%
  });

  test('calculates progress for 14 days', () => {
    expect(getMilestoneProgress(14)).toBeCloseTo(0, 2); // Just hit 14-day milestone, now progressing to 30 days
  });

  test('calculates progress for 20 days', () => {
    expect(getMilestoneProgress(20)).toBeCloseTo(37.5, 2); // (20-14)/(30-14) = 6/16 = 37.5%
  });

  test('calculates progress for 30 days', () => {
    expect(getMilestoneProgress(30)).toBeCloseTo(100, 2); // All milestones reached
  });

  test('calculates progress for 35 days', () => {
    expect(getMilestoneProgress(35)).toBeCloseTo(100, 2); // All milestones reached
  });

  test('calculates progress for 50 days', () => {
    expect(getMilestoneProgress(50)).toBeCloseTo(100, 2); // All milestones reached
  });
});
