# Detox Duel PRD

## Problem Statement

Users struggle with excessive screen time and social media addiction, leading to decreased productivity, reduced focus, and negative impacts on mental health and relationships. Traditional solutions like digital wellbeing apps fail to provide sustainable motivation or social accountability, making it difficult for users to maintain long-term behavior change.

## Solution

Detox Duel is a social focus app that gamifies screen time reduction through competition with friends. Users can participate in focus sessions, engage in duels with various challenge types, earn points and badges, build streaks, and compete on leaderboards. The app combines personal accountability with social motivation to create sustainable healthy digital habits.

## User Stories

### Authentication & Onboarding
1. As a new user, I want to create an account with email, password, and username, so that I can start using the app
2. As a new user, I want to complete an onboarding flow that explains the app's value proposition, so that I understand how to use the app effectively
3. As a new user, I want to set my daily screen time goal during onboarding, so that I have a personalized target to work toward
4. As a returning user, I want to log in with my credentials, so that I can access my account and continue my progress
5. As a user, I want to stay logged in between sessions, so that I don't have to repeatedly enter my credentials
6. As a user, I want to log out of my account, so that I can maintain privacy when sharing my device

### Focus Sessions
7. As a user, I want to start a focus session with preset durations (15, 30, 60, 120 minutes), so that I can choose a focus period that fits my schedule
8. As a user, I want to see a countdown timer during my focus session, so that I can track my progress and know when the session ends
9. As a user, I want to complete my focus session early, so that I can end the session if I finish my work early
10. As a user, I want to cancel my focus session, so that I can stop focusing if unexpected interruptions occur
11. As a user, I want to receive haptic feedback when my session completes, so that I can be notified without looking at my phone
12. As a user, I want to see a celebration screen when I complete a session, so that I feel rewarded for my focus
13. As a user, I want to categorize my focus sessions (study, work, exercise, reading, etc.), so that I can track focus time by activity type
14. As a user, I want to view my session history, so that I can see my past focus sessions and track my progress over time
15. As a user, I want to see today's total focus time, so that I can monitor my daily progress toward my goal

### Friends System
16. As a user, I want to search for friends by username, so that I can find and connect with people I know
17. As a user, I want to send friend requests to other users, so that I can build my social network on the app
18. As a user, I want to view pending friend requests, so that I can accept or decline invitations
19. As a user, I want to accept friend requests, so that I can connect with friends who want to compete
20. As a user, I want to reject friend requests, so that I can maintain control over my connections
21. As a user, I want to view my friends list, so that I can see who I'm connected with
22. As a user, I want to remove friends from my list, so that I can manage my connections
23. As a user, I want to see friends' profiles, so that I can learn about their focus habits and achievements

### Duel System
24. As a user, I want to create a duel with a friend, so that we can compete against each other
25. As a user, I want to choose from different duel types (Focus Sprint, Weekly War, Streak Battle, Quick Duel), so that I can participate in various competition formats
26. As a user, I want to select banned apps for a duel, so that we can mutually agree which apps are off-limits during the competition
27. As a user, I want to set the duration for a duel, so that we can control how long the competition lasts
28. As a user, I want to review the duel details before starting, so that I can confirm I understand the rules and stakes
29. As a user, I want to accept a duel challenge from a friend, so that I can participate in competitions they initiate
30. As a user, I want to decline a duel challenge, so that I can choose when to compete
31. As a user, I want to see my active duels, so that I can monitor ongoing competitions
32. As a user, I want to view duel results, so that I can see who won and how we performed
33. As a user, I want to see my duel history, so that I can review past competitions and track my win/loss record
34. As a user (Android only), I want the app to block banned apps during a duel with an overlay screen, so that I am prevented from opening those apps and receive an instant loss if I try to cheat
35. As a user (Android only), I want guidance on enabling the Accessibility Service required for app blocking, so that I can set up this feature properly

### Points & Rewards System
36. As a user, I want to earn points for completing focus sessions, so that my efforts are rewarded and gamified
37. As a user, I want to earn points for winning duels, so that competition victories have tangible rewards
38. As a user, I want to earn points for achieving milestones, so that consistent progress is recognized
39. As a user, I want to see my total points, so that I can track my overall progress
40. As a user, I want to see my current rank tier (Bronze, Silver, Gold, Platinum, Diamond), so that I understand my status relative to other users
41. As a user, I want to see my progress toward the next rank tier, so that I have a clear goal to work toward
42. As a user, I want to view my points history, so that I can see how I earned points over time
43. As a user, I want to compete on a points-based leaderboard, so that I can see how my points compare to friends and global users

### Badges & Achievements
44. As a user, I want to earn badges for achieving specific milestones (first session, 10 sessions, streaks, etc.), so that I have visual symbols of my accomplishments
45. As a user, I want to view my earned badges, so that I can showcase my achievements
46. As a user, I want to see badge descriptions and requirements, so that I understand how to earn each badge
47. As a user, I want to receive notifications when I earn a new badge, so that I am immediately aware of my achievements
48. As a user, I want to see badges on my profile, so that other users can see my accomplishments

### Streaks Tracking
49. As a user, I want my consecutive days of focus sessions to be tracked, so that I can build a streak habit
50. As a user, I want to see my current streak count, so that I know how many consecutive days I've focused
51. As a user, I want to see my longest streak, so that I know my personal best
52. As a user, I want to earn streak milestone badges (3-day, 7-day, 14-day, 30-day), so that maintaining streaks is rewarded
53. As a user, I want to view a streak calendar, so that I can see my focus history and identify patterns
54. As a user, I want to receive notifications when I reach streak milestones, so that I am motivated to continue
55. As a user, I want to receive warnings when my streak is at risk, so that I can take action to maintain it

### Leaderboards
56. As a user, I want to view a weekly leaderboard ranked by focus time, so that I can see how I compare to friends and other users
57. As a user, I want to toggle between friends-only and global leaderboards, so that I can compete at different scales
58. As a user, I want to see medal rankings (🥇🥈🥉) for top performers, so that top achievers are highlighted
59. As a user, I want to see my rank highlighted on the leaderboard, so that I can quickly find my position
60. As a user, I want to toggle between focus time and points ranking modes, so that I can compete based on different metrics

### Notifications
61. As a user, I want to receive notifications for friend requests, so that I can respond promptly
62. As a user, I want to receive notifications when friends accept my requests, so that I know when new connections are made
63. As a user, I want to receive notifications for duel challenges, so that I don't miss competitions
64. As a user, I want to receive notifications for duel results, so that I know the outcome of competitions
65. As a user, I want to receive notifications when I earn badges, so that I'm immediately aware of achievements
66. As a user, I want to receive notifications for streak milestones, so that I'm motivated to continue streaks
67. As a user, I want to receive weekly summary notifications, so that I can review my progress
68. As a user, I want to see an unread notification count on the home screen, so that I know when I have new notifications
69. As a user, I want to manage my notification preferences by type, so that I can control which notifications I receive
70. As a user, I want to tap notifications to navigate to relevant screens, so that I can take action on the notification

### Group Challenges
71. As a user, I want to create group challenges (e.g., "Lowest screen time this week"), so that I can compete with multiple friends simultaneously
72. As a user, I want to invite friends to group challenges, so that we can participate together
73. As a user, I want to choose challenge types (lowest screen time, most focus sessions, longest streak), so that we can compete in different ways
74. As a user, I want to set challenge parameters (duration, participants, target metrics), so that I can customize the competition
75. As a user, I want to view active challenges, so that I can see ongoing group competitions
76. As a user, I want to view challenge leaderboards, so that I can see standings among participants
77. As a user, I want to view challenge results, so that I can see who won each group challenge

### Profile & Settings
78. As a user, I want to view my profile with stats (total focus time, points, streaks, badges), so that I can see my overall progress
79. As a user, I want to customize my profile with an avatar, so that I can personalize my presence in the app
80. As a user, I want to update my username, so that I can change how I'm identified
81. As a user, I want to update my email, so that I can change my contact information
82. As a user, I want to see my notification settings, so that I can manage my preferences
83. As a user, I want to see my daily screen time goal, so that I can review my target
84. As a user, I want to update my daily screen time goal, so that I can adjust my target as needed
85. As a user, I want to view app settings and preferences, so that I can configure the app to my liking

### Navigation & UI
86. As a user, I want a tab-based navigation (Home, Leaderboard, Friends, Profile), so that I can easily access core screens
87. As a user, I want a dark theme throughout the app, so that it's visually consistent and comfortable to use
88. As a user, I want consistent spacing and typography across screens, so that the app feels polished and professional
89. As a user, I want loading indicators when data is being fetched, so that I know the app is working
90. As a user, I want empty states with helpful messages, so that I understand what to do when there's no data
91. As a user, I want pull-to-refresh on list screens, so that I can easily update data

## Implementation Decisions

### Technology Stack
- **Frontend**: React Native + Expo SDK 0.81.5 for cross-platform mobile development
- **Language**: TypeScript for type safety and better developer experience
- **Backend**: Supabase 2.105.3 for authentication, database, and real-time features
- **Navigation**: React Navigation for tab and stack navigation
- **State Management**: React Hooks with custom hooks for data fetching and state

### Database Schema Architecture
The database uses Supabase PostgreSQL with the following core tables:

**Core Tables:**
- `users` - User profiles with authentication metadata, daily goals, avatars
- `focus_sessions` - Focus session records with start/end times, duration, blocked apps, categories
- `friendships` - Friend relationships with status tracking (pending, accepted)
- `user_streaks` - Streak tracking with current streak, longest streak, last active date
- `badges` - Badge definitions with emoji, description, category, and conditions
- `user_badges` - User-badge relationships tracking when badges were earned
- `notifications` - Notification records with type, title, body, read status
- `notification_preferences` - User notification preferences by type
- `user_points` - User point totals for leaderboard queries
- `point_transactions` - Immutable transaction log for point awards

**Duel Tables:**
- `duels` - Duel records with creator, opponent, type, status, banned apps, duration
- `duel_participants` - Participant tracking with screen time, streak days, loss status
- `duel_rewards` - Reward records for completed duels

**Group Challenge Tables:**
- `group_challenges` - Challenge definitions with type, metrics, duration, status
- `group_challenge_participants` - Participant tracking with scores

### Module Architecture

**Native Modules:**
- `expo-screen-time` - Android screen time tracking via UsageStatsManager (iOS not supported)
- `expo-app-blocker` - Android app blocking overlay system using AccessibilityService (iOS not supported)

**Service Layer:**
- `src/services/supabase.ts` - Supabase client initialization and configuration
- `src/services/screenTimeTracker.ts` - Screen time tracking with lazy loading and graceful degradation
- `src/services/appBlocker.ts` - App blocking service wrapper (planned)

**Custom Hooks:**
- `useAuth.ts` - Authentication state management with signup, login, logout
- `useFocusSession.ts` - Focus session lifecycle, local storage, Supabase sync
- `useFocusTimer.ts` - Timer countdown logic
- `useFriends.ts` - Friend search, requests, acceptance, removal
- `useDuel.ts` - Duel creation, acceptance, completion, win/loss tracking
- `useDuelHistory.ts` - Historical duel data retrieval and formatting
- `useBadges.ts` - Badge checking and awarding logic
- `useStreaks.ts` - Streak calculation and milestone detection
- `usePoints.ts` - Points fetching, calculation, rank tier determination
- `useNotifications.ts` - Notification fetching, creation, mark-as-read, preference management
- `useGroupChallenges.ts` - Group challenge creation, joining, participation
- `useOnboardingStorage.ts` - Onboarding state persistence in AsyncStorage

**Component Architecture:**
- Functional components with TypeScript interfaces for props
- StyleSheet.create at bottom of files for styling
- Centralized theme constants (COLORS, SPACING) in `src/constants/`
- Reusable components: Card, Button, LoadingSpinner, EmptyState, NotificationItem, etc.

### Android App Blocking Overlay System

**Expo Native Module Structure:**
```
modules/expo-app-blocker/
├── android/
│   ├── src/main/java/com/expo/modules/appblocker/
│   │   ├── AppBlockerModule.kt          # Main module with startBlocking, stopBlocking, isBlockingActive
│   │   ├── AppBlockerAccessibilityService.kt  # Detects banned app launches
│   │   └── BlockOverlayActivity.kt       # Full-screen blocking overlay
│   └── src/main/AndroidManifest.xml      # AccessibilityService, permissions, activity registration
├── src/
│   └── AppBlocker.ts                     # TypeScript API surface
├── package.json                          # Module metadata
├── expo-module.config.json               # Expo module configuration
└── app.plugin.js                         # Config plugin for manifest modifications
```

**Technical Decisions:**
- **AccessibilityService Pattern**: Uses TYPE_WINDOW_STATE_CHANGED events to detect when banned apps are opened
- **Blocking Overlay**: Full-screen BlockOverlayActivity that cannot be dismissed (no back button)
- **Supabase Integration**: Service sends updates when banned apps are opened for Quick Duel instant loss
- **Permission Handling**: Users must manually enable SYSTEM_ALERT_WINDOW and Accessibility Service in settings
- **Platform Detection**: TypeScript wrapper only exposes functionality on Android platform

**Integration Points:**
- AccessibilityGuideScreen guides users through enabling required permissions
- ActiveChallengesScreen calls startBlocking when duels become active, stopBlocking when they end
- Lazy loading pattern prevents crashes in Expo Go (requires development build)

### Security & Data Integrity
- **Row Level Security (RLS)**: Enabled on all Supabase tables with appropriate policies
- **Point System**: Uses SECURITY DEFINER database function for safe point awarding, immutable transaction log
- **Type Safety**: Strict TypeScript with proper interfaces, no inline types
- **Input Validation**: Database constraints, TypeScript validation, error handling throughout

### Performance Optimizations
- **Denormalized Data**: users.total_points for fast leaderboard queries, synced via trigger
- **Indexed Columns**: Strategic indexes on user_id, created_at, status columns for query performance
- **Lazy Loading**: Dynamic imports for native modules to prevent crashes
- **Fire-and-Forget Pattern**: Asynchronous operations that don't block user flows
- **Efficient Queries**: Limit result sets (e.g., 20 most recent notifications)

## Testing Decisions

### Testing Strategy

**What Makes a Good Test:**
- Tests external behavior, not implementation details
- Tests user-facing functionality and interactions
- Tests edge cases and error conditions
- Tests database operations and RLS policies
- Tests async operations and state management

### Modules to Test

**Core Functionality (High Priority):**
- Focus session lifecycle (start, complete, cancel)
- Authentication flow (signup, login, logout)
- Friend system (search, request, accept, remove)
- Duel creation, acceptance, and completion
- Points calculation and rank tier logic
- Streak calculation and milestone detection
- Badge awarding logic
- Notification creation and management

**UI Components (Medium Priority):**
- HomeScreen focus session controls
- LeaderboardScreen ranking display and toggles
- FriendsScreen friend list and interactions
- ProfileScreen stats and settings
- NotificationScreen list and navigation

**Integration Testing (High Priority):**
- Supabase database operations with RLS policies
- Native module integration (screen time tracking, app blocking)
- Navigation flow between screens
- Permission handling flows

**Android App Blocking (High Priority):**
- AccessibilityService detection of banned apps
- BlockOverlayActivity display and user flow
- Supabase updates on banned app violations
- Permission request and enablement flow

### Prior Art for Tests

**Existing Test Structure:**
- `StreakCalendarScreen.test.tsx` - Example component test
- `StreakLostNotification.test.tsx` - Example component test
- `StreakMilestoneCelebration.test.tsx` - Example component test
- `useStreaks.test.tsx` - Example hook test

**Testing Patterns to Follow:**
- Arrange-Act-Assert pattern for unit tests
- Jest + React Native Testing Library for components
- Mock Supabase client for database tests
- Test happy paths and error paths
- Test async operations with proper await/async patterns

### Test Coverage Goals

**Unit Tests:**
- Custom hooks: 80%+ coverage
- Utility functions: 90%+ coverage
- Services: 70%+ coverage

**Integration Tests:**
- Database operations: 80%+ coverage
- Native module bridges: 70%+ coverage

**E2E Tests:**
- Critical user flows: Focus session, Duel creation, Authentication
- Edge cases: Permission denials, network failures, database errors

## Out of Scope

**Phase 3 Features (Future Planning):**
- Native iOS app blocking (requires Apple Developer account and Screen Time API)
- Premium tier ($4.99/mo or $39.99/yr) with unlimited friends, advanced analytics, custom themes
- Sponsored challenges with brand partnerships and prize pools
- Reward marketplace for redeeming points
- Ad integration (non-intrusive banner ads, rewarded ads)

**Advanced Features:**
- Custom penalties for duel losers (ugly avatar, funny nickname, dare generator)
- Export data functionality (CSV/PDF)
- App Store and Google Play listing optimization
- Privacy policy and terms of service documents
- App icon design and splash screen animation
- CI/CD pipeline with GitHub Actions

**Enhanced Notifications:**
- Push notification integration with expo-notifications
- Notification actions (accept friend, view duel, etc.)
- Notification history/archiving

**Advanced Duels:**
- Multi-player duels (more than 2 participants)
- Tournament brackets
- Duel templates and presets

## Further Notes

### Development Build Requirement
Native modules (expo-screen-time, expo-app-blocker) require an Expo development build. They do not work in Expo Go. Users must run `npx expo run:android` or build with EAS for full functionality.

### Android-Only Features
Screen time tracking and app blocking overlay are Android-only due to platform API limitations. iOS does not provide equivalent APIs for app detection and blocking via AccessibilityService.

### Database Migration Process
All schema changes are managed through Supabase migrations in `supabase/migrations/`. Migrations should be applied via `npx supabase db push` or manually through Supabase Dashboard SQL Editor.

### Code Quality Standards
- PascalCase for file names and components
- camelCase for functions and variables
- snake_case for database columns
- Functional components only (no class components)
- Separate styles into StyleSheet.create at bottom of files
- Centralized theme constants (COLORS, SPACING)

### Error Handling Philosophy
- Graceful degradation: Features should fail gracefully if dependencies unavailable
- Explicit error handling with typed exceptions
- User-friendly error messages where appropriate
- Logging for debugging without exposing sensitive data

### Performance Considerations
- Use AsyncStorage for local data persistence (focus sessions, onboarding state)
- Lazy loading for native modules to prevent crashes
- Efficient queries with proper indexing
- Limit result sets to prevent memory issues

### Future Monetization Strategy
The app is designed with monetization hooks already in place (points system, premium features ready for tier implementation). The freemium model balances accessibility with revenue potential.

### Community and Social Aspects
The app is fundamentally social, with all features designed to leverage social accountability. Friends, duels, leaderboards, and group challenges all create a competitive environment that motivates continued engagement.

---

**PRD Version**: 1.0
**Created**: May 21, 2026
**Status**: Draft for review