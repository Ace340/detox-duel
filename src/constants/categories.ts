// =====================================================
// CATEGORY CONSTANTS AND UTILITIES
// =====================================================

/**
 * Predefined focus session categories with icons and colors
 */
export const FOCUS_CATEGORIES = [
  { id: 'Study', label: 'Study', icon: '📚', color: '#6366f1' },
  { id: 'Work', label: 'Work', icon: '💼', color: '#3b82f6' },
  { id: 'Exercise', label: 'Exercise', icon: '💪', color: '#10b981' },
  { id: 'Reading', label: 'Reading', icon: '📖', color: '#8b5cf6' },
  { id: 'Meditation', label: 'Meditation', icon: '🧘', color: '#06b6d4' },
  { id: 'Creative', label: 'Creative', icon: '🎨', color: '#f59e0b' },
  { id: 'Other', label: 'Other', icon: '📌', color: '#64748b' },
] as const;

/**
 * Category type (string literal union)
 */
export type CategoryType = typeof FOCUS_CATEGORIES[number]['id'];

/**
 * Get category data by ID
 * @param categoryId - The category ID
 * @returns Category object or undefined if not found
 */
export const getCategoryById = (categoryId: string | undefined) => {
  if (!categoryId) return undefined;
  return FOCUS_CATEGORIES.find(cat => cat.id === categoryId);
};

/**
 * Get category icon by ID
 * @param categoryId - The category ID
 * @returns Icon emoji or default question mark
 */
export const getCategoryIcon = (categoryId: string | undefined) => {
  const category = getCategoryById(categoryId);
  return category?.icon || '❓';
};

/**
 * Get category color by ID
 * @param categoryId - The category ID
 * @returns Color hex or default gray
 */
export const getCategoryColor = (categoryId: string | undefined) => {
  const category = getCategoryById(categoryId);
  return category?.color || '#64748b';
};

/**
 * Get category label by ID
 * @param categoryId - The category ID
 * @returns Label or default 'Unknown'
 */
export const getCategoryLabel = (categoryId: string | undefined) => {
  const category = getCategoryById(categoryId);
  return category?.label || 'Unknown';
};

/**
 * Calculate total focus time per category from sessions
 * @param sessions - Array of focus sessions
 * @returns Array of { category, totalMinutes, percentage }
 */
export const calculateCategoryStats = (sessions: Array<{ category?: string; duration_minutes: number }>) => {
  const stats = new Map<string, number>();

  // Sum duration by category
  sessions.forEach(session => {
    if (session.category) {
      const current = stats.get(session.category) || 0;
      stats.set(session.category, current + session.duration_minutes);
    }
  });

  // Calculate total for percentage calculation
  const totalMinutes = Array.from(stats.values()).reduce((sum, minutes) => sum + minutes, 0);

  // Convert to array with percentages
  return Array.from(stats.entries()).map(([category, totalMinutes]) => ({
    category,
    totalMinutes,
    percentage: totalMinutes > 0 ? Math.round((totalMinutes / totalMinutes) * 100) : 0,
  })).sort((a, b) => b.totalMinutes - a.totalMinutes); // Sort by highest first
};

/**
 * Get top category for today from sessions
 * @param sessions - Array of focus sessions (should be filtered by date)
 * @returns Top category object or undefined
 */
export const getTopCategory = (sessions: Array<{ category?: string; duration_minutes: number }>) => {
  const stats = calculateCategoryStats(sessions);
  if (stats.length === 0) return undefined;

  const top = stats[0];
  return {
    category: top.category,
    totalMinutes: top.totalMinutes,
    percentage: top.percentage,
    ...getCategoryById(top.category),
  };
};

/**
 * Format minutes to hours and minutes
 * @param minutes - Total minutes
 * @returns Formatted string (e.g., "2h 30m")
 */
export const formatMinutesToHours = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};