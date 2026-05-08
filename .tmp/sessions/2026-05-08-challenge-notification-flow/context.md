# Task Context: Challenge Notification and Response Flow

Session ID: 2026-05-08-challenge-notification-flow
Created: 2026-05-08T14:47:00Z
Status: in_progress

## Current Request

Build the challenge notification and response flow:

1. `DuelChallengeScreen` — shows incoming challenge details (opponent, duel type, banned apps, duration) with Accept/Decline buttons.
2. On accept: update duel status to 'active', set started_at = now(), insert both participants into duel_participants.
3. On decline: update duel status to 'cancelled'.
4. Add a notification listener using Supabase realtime or push notifications to alert users of new challenges.
5. Show pending challenges in a badge/list on the home screen.

## Context Files (Standards to Follow)

**Code Quality Standards:**
- `.opencode/context/core/standards/code-quality.md` - Modular design, functional approach, pure functions, immutability, composition patterns, naming conventions, error handling

**External Documentation:**
- `.tmp/external-context/supabase/realtime-subscriptions.md` - Realtime subscription patterns for listening to table changes
- `.tmp/external-context/supabase/database-operations.md` - Insert and update operations with error handling

## Reference Files (Source Material)

**Database Schema:**
- `detox-duel/create-duels-schema.sql` - Complete schema for duels, duel_participants tables with enums, RLS policies, triggers

**Type Definitions:**
- `detox-duel/src/types/duel.ts` - TypeScript interfaces for Duel, DuelParticipant, DuelStatus, utility functions

**Existing Hooks:**
- `detox-duel/src/hooks/useDuel.ts` - Example hook pattern with createDuel function, validation, error handling
- `detox-duel/src/hooks/useNotifications.ts` - Notification system with loadNotifications, markAsRead, createNotification
- `detox-duel/src/hooks/useAuth.ts` - Authentication hook with session management

**Existing Screens:**
- `detox-duel/src/screens/HomeScreen.tsx` - Target screen for adding pending challenges badge/list
- `detox-duel/src/screens/ReviewDuelScreen.tsx` - Reference for screen layout, card usage, button patterns

**Navigation:**
- `detox-duel/src/navigation/AppNavigator.tsx` - Add DuelChallengeScreen to stack navigation

**UI Components:**
- `detox-duel/src/components/ui.tsx` - Card and Button components to reuse
- `detox-duel/src/constants/theme.ts` - COLORS, SPACING constants

**Services:**
- `detox-duel/src/services/supabase.ts` - Supabase client instance

**Other:**
- `detox-duel/src/constants/mockApps.ts` - Mock app data for banned apps display
- `detox-duel/package.json` - Dependencies: @supabase/supabase-js@^2.105.3, expo-notifications@^55.0.22

## Technical Requirements

### Database Schema (from create-duels-schema.sql)
- **duels table**: id, creator_id, opponent_id, duel_type, status ('pending', 'active', 'completed', 'cancelled', 'expired'), banned_apps (JSONB), duration_hours, started_at, ended_at, winner_id, created_at, updated_at
- **duel_participants table**: duel_id, user_id, screen_time_seconds, streak_days, is_loser, joined_at, updated_at
- **RLS Policies**: Users can view/update duels they're part of, users can insert themselves as participants

### Key Logic
1. **Accept Challenge**:
   - Update duels table: status = 'active', started_at = NOW()
   - Insert into duel_participants for both creator_id and opponent_id (if not already there)
   - Mark notification as read

2. **Decline Challenge**:
   - Update duels table: status = 'cancelled', ended_at = NOW()
   - Mark notification as read

3. **Pending Challenges Query**:
   - SELECT * FROM duels WHERE opponent_id = current_user_id AND status = 'pending'

4. **Realtime Subscription**:
   - Subscribe to INSERT events on duels table
   - Filter: opponent_id = current_user_id AND status = 'pending'

### Code Patterns to Follow

**From useDuel.ts:**
- useCallback for functions
- Explicit error handling with try/catch
- Validation before database operations
- setLoading and setError state management
- Return Promise with success/failure

**From useNotifications.ts:**
- State management for data, loading, unreadCount
- loadNotifications fetches data and enriches with user info
- markAsRead updates both database and local state

**From ReviewDuelScreen.tsx:**
- Card + Button components from ui.tsx
- formatDuelType utility for display
- Loading states with ActivityIndicator
- Alert.alert for user feedback
- navigation.reset to return to home after success

**Code Quality Standards:**
- Pure functions where possible
- Immutability (create new data, don't modify)
- Small, focused functions (< 50 lines)
- Explicit dependencies (supabase, userId)
- Validate at boundaries
- Self-documenting code

## Components to Create

### 1. `useDuelChallenge.ts` (new hook)
- Accept challenge: update duel status to 'active', set started_at, insert participants
- Decline challenge: update duel status to 'cancelled', set ended_at
- Load challenge details by duel ID with opponent username
- Error handling and loading states

### 2. `DuelChallengeScreen.tsx` (new screen)
- Display challenge details: opponent name, duel type, banned apps, duration
- Accept/Decline buttons with loading states
- Follow ReviewDuelScreen layout pattern
- Navigation: go back to home after action

### 3. `usePendingChallenges.ts` (new hook)
- Load pending challenges for current user
- Return count and list of challenges
- Auto-refresh on mount

### 4. `useRealtimeChallenges.ts` (new hook)
- Subscribe to Supabase realtime for new pending duels
- Listen to INSERT events on duels table
- Trigger callback when new challenge arrives
- Clean up subscription on unmount

### 5. Update `HomeScreen.tsx`
- Add pending challenges badge (if count > 0)
- Show list of pending challenges (if any)
- Navigate to DuelChallengeScreen when tapping
- Integrate usePendingChallenges and useRealtimeChallenges

### 6. Update `AppNavigator.tsx`
- Add DuelChallengeScreen to stack navigation
- Define route parameter: { duelId: string }

## Constraints

- **TypeScript**: Full type safety using existing duel types
- **Supabase**: Use existing supabase client from services/supabase.ts
- **React Navigation v7**: Match existing stack navigation pattern
- **React Native**: Follow existing screen patterns (ScrollView, View, Text, StyleSheet)
- **Theme**: Use COLORS and SPACING from constants/theme.ts
- **No external libraries**: Use only already-installed packages

## Exit Criteria

- [ ] useDuelChallenge hook created with accept/decline functions
- [ ] usePendingChallenges hook created to load pending duels
- [ ] useRealtimeChallenges hook created with realtime subscription
- [ ] DuelChallengeScreen created displaying challenge details
- [ ] HomeScreen updated with pending challenges badge and list
- [ ] AppNavigator updated with DuelChallengeScreen route
- [ ] All code follows code-quality.md standards
- [ ] All functions have proper TypeScript types
- [ ] Error handling implemented throughout
- [ ] Loading states for all async operations

## Progress

- [x] Session initialized
- [x] Context documented
- [ ] Tasks created (delegating to TaskManager)
- [ ] Implementation complete
