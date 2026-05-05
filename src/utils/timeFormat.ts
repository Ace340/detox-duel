/**
 * Format seconds to MM:SS format
 * @param seconds - Total seconds to format
 * @returns Formatted time string in MM:SS format
 * @example formatSecondsToMMSS(65) -> "01:05"
 * @example formatSecondsToMMSS(3600) -> "60:00"
 */
export function formatSecondsToMMSS(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const paddedMinutes = minutes.toString().padStart(2, '0');
  const paddedSeconds = remainingSeconds.toString().padStart(2, '0');

  return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * Format minutes to hours and minutes
 * @param minutes - Total minutes to format
 * @returns Formatted time string (e.g., "2h 30m" or "45m")
 * @example formatMinutesToHours(150) -> "2h 30m"
 * @example formatMinutesToHours(45) -> "45m"
 */
export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${remainingMinutes}m`;
  }
}
