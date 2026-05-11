import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFocusTimerReturn {
  remainingSeconds: number;
  isRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

/**
 * Timestamp-based countdown timer that resists drift and handles
 * app backgrounding correctly.  Remaining time is always computed
 * from the wall-clock difference to an end-time, so the displayed
 * value stays accurate even if the JS thread is blocked or the
 * app is sent to the background.
 */
export function useFocusTimer(initialSeconds: number): UseFocusTimerReturn {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  // Ref that holds the absolute timestamp when the timer should reach zero.
  const endTimeRef = useRef<number | null>(null);
  // The current animation-frame id so we can cancel it on cleanup.
  const rafRef = useRef<number | null>(null);
  // Keep a mutable reference to the latest initialSeconds so resetTimer
  // always uses the most-recently provided value (not the mount-time value).
  const initialSecondsRef = useRef(initialSeconds);
  initialSecondsRef.current = initialSeconds;

  const startTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setRemainingSeconds(initialSecondsRef.current);
    setIsRunning(false);
    endTimeRef.current = null;
  }, []);

  useEffect(() => {
    if (!isRunning) {
      // When pausing, compute the remaining seconds from the end-time
      // so the displayed value stays consistent on the next start.
      if (endTimeRef.current !== null) {
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setRemainingSeconds(remaining);
      }
      return;
    }

    // Guard: don't start a timer that has already expired.
    if (remainingSeconds <= 0) {
      setIsRunning(false);
      return;
    }

    // Set the absolute end-time from the current remaining value.
    endTimeRef.current = Date.now() + remainingSeconds * 1000;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((endTimeRef.current! - now) / 1000));
      setRemainingSeconds(remaining);

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIsRunning(false);
        endTimeRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  return { remainingSeconds, isRunning, startTimer, stopTimer, resetTimer };
}
