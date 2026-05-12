import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useStreaks } from './useStreaks';
import { supabase } from '@/services/supabase';

// Mock Supabase client
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('useStreaks', () => {
  const mockUserId = 'user-123';
  const mockFromDate = new Date('2026-04-12');
  const mockToDate = new Date('2026-05-12');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with zero streak', async () => {
    // Mock Supabase to return no streaks record
    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    }));
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useStreaks(mockUserId));

    await waitFor(() => {
      expect(result.current.currentStreak).toBe(0);
      expect(result.current.longestStreak).toBe(0);
    });
  });

  test('fetches existing streak from database', async () => {
    const mockStreak = {
      current_streak: 5,
      longest_streak: 7,
      last_active_date: '2026-05-12',
    };

    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: mockStreak, error: null })),
      })),
    }));
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useStreaks(mockUserId));

    await waitFor(() => {
      expect(result.current.currentStreak).toBe(5);
      expect(result.current.longestStreak).toBe(7);
    });
  });

  test('fetches streaks on mount', async () => {
    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: { current_streak: 0, longest_streak: 0, last_active_date: null }, error: null })),
      })),
    }));
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    renderHook(() => useStreaks(mockUserId));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('user_streaks');
    });
  });

  test('updates streak after activity', async () => {
    // Mock streak fetch
    const mockFetchSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: { current_streak: 0, longest_streak: 0, last_active_date: null }, error: null })),
      })),
    }));

    // Mock activity dates fetch
    const mockActivitySelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          gt: jest.fn(() => ({
            lt: jest.fn(() => ({
              gte: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
        })),
      })),
    }));

    // Mock streak update
    const mockUpsert = jest.fn(() => Promise.resolve({ error: null }));

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: mockFetchSelect })
      .mockReturnValueOnce({ select: mockActivitySelect })
      .mockReturnValueOnce({ upsert: mockUpsert });

    const { result } = renderHook(() => useStreaks(mockUserId));

    await act(async () => {
      await result.current.updateStreaks(new Date('2026-05-12'));
    });

    expect(mockUpsert).toHaveBeenCalled();
  });

  test('updates longest streak when current streak exceeds it', async () => {
    const mockStreak = {
      current_streak: 3,
      longest_streak: 5,
      last_active_date: '2026-05-11',
    };

    const mockFetchSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: mockStreak, error: null })),
      })),
    }));

    const mockActivitySelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          gt: jest.fn(() => ({
            lt: jest.fn(() => ({
              gte: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ data: [new Date('2026-05-12')], error: null })),
              })),
            })),
          })),
        })),
      })),
    }));

    const mockUpsert = jest.fn(() => Promise.resolve({ error: null }));

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: mockFetchSelect })
      .mockReturnValueOnce({ select: mockActivitySelect })
      .mockReturnValueOnce({ upsert: mockUpsert });

    const { result } = renderHook(() => useStreaks(mockUserId));

    await waitFor(() => {
      expect(result.current.currentStreak).toBe(3);
    });

    await act(async () => {
      await result.current.updateStreaks(new Date('2026-05-12'));
    });

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        current_streak: 4,
        longest_streak: 5, // Should remain 5, not update to 4
        last_active_date: expect.any(String),
      });
    });
  });

  test('detects broken streak', async () => {
    const mockStreak = {
      current_streak: 5,
      longest_streak: 7,
      last_active_date: '2026-05-10',
    };

    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: mockStreak, error: null })),
      })),
    }));
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useStreaks(mockUserId));

    await waitFor(() => {
      expect(result.current.currentStreak).toBe(5);
    });

    const isBroken = await act(async () => {
      return await result.current.checkStreakBroken();
    });

    await waitFor(() => {
      expect(isBroken).toBe(true);
    });
  });

  test('does not detect broken streak for recent activity', async () => {
    const mockStreak = {
      current_streak: 5,
      longest_streak: 7,
      last_active_date: '2026-05-12',
    };

    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: mockStreak, error: null })),
      })),
    }));
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useStreaks(mockUserId));

    await waitFor(() => {
      expect(result.current.currentStreak).toBe(5);
    });

    const isBroken = await act(async () => {
      return await result.current.checkStreakBroken();
    });

    await waitFor(() => {
      expect(isBroken).toBe(false);
    });
  });

  test('handles Supabase fetch error gracefully', async () => {
    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: new Error('Database error') })),
      })),
    }));
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useStreaks(mockUserId));

    // Should not throw error, just log it
    await waitFor(() => {
      expect(result.current.currentStreak).toBe(0);
      expect(result.current.longestStreak).toBe(0);
    });
  });

  test('handles Supabase update error gracefully', async () => {
    const mockFetchSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: { current_streak: 0, longest_streak: 0, last_active_date: null }, error: null })),
      })),
    }));

    const mockActivitySelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          gt: jest.fn(() => ({
            lt: jest.fn(() => ({
              gte: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
        })),
      })),
    }));

    const mockUpsert = jest.fn(() => Promise.resolve({ error: new Error('Update failed') }));

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: mockFetchSelect })
      .mockReturnValueOnce({ select: mockActivitySelect })
      .mockReturnValueOnce({ upsert: mockUpsert });

    const { result } = renderHook(() => useStreaks(mockUserId));

    // Should not throw error, just log it
    await act(async () => {
      await result.current.updateStreaks(new Date('2026-05-12'));
    });

    expect(mockUpsert).toHaveBeenCalled();
  });

  test('gets active dates for month', async () => {
    const mockDates = [
      new Date('2026-05-12'),
      new Date('2026-05-11'),
      new Date('2026-05-10'),
    ];

    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          gt: jest.fn(() => ({
            lt: jest.fn(() => ({
              gte: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ data: mockDates, error: null })),
              })),
            })),
          })),
        })),
      })),
    }));
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useStreaks(mockUserId));

    const activeDates = await act(async () => {
      return await result.current.getActiveDatesForMonth(30);
    });

    await waitFor(() => {
      expect(activeDates).toHaveLength(3);
    });
  });

  test('handles empty active dates', async () => {
    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          gt: jest.fn(() => ({
            lt: jest.fn(() => ({
              gte: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
        })),
      })),
    }));
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useStreaks(mockUserId));

    const activeDates = await act(async () => {
      return await result.current.getActiveDatesForMonth(30);
    });

    await waitFor(() => {
      expect(activeDates).toHaveLength(0);
    });
  });

  test('fetchStreaks updates state', async () => {
    const mockStreak = {
      current_streak: 10,
      longest_streak: 15,
      last_active_date: '2026-05-12',
    };

    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: mockStreak, error: null })),
      })),
    }));
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useStreaks(mockUserId));

    await waitFor(() => {
      expect(result.current.currentStreak).toBe(0);
    });

    await act(async () => {
      await result.current.fetchStreaks();
    });

    await waitFor(() => {
      expect(result.current.currentStreak).toBe(10);
      expect(result.current.longestStreak).toBe(15);
    });
  });
});
