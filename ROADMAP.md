# Detox Duel — Development Roadmap

> Last updated: May 5, 2026

---

## 🎯 App Concept

A focus app that blocks social media, tracks your focus time, and lets you compete with friends on weekly leaderboards. Less screen time, more wins.

---

## ✅ Completed

### Project Setup
- [x] Expo + TypeScript scaffold
- [x] React Navigation (tabs + stack)
- [x] GitHub repo: https://github.com/Ace340/detox-duel
- [x] Supabase project created
- [x] Database tables: `users`, `focus_sessions`, `friendships`
- [x] RLS policies enabled
- [x] OpenCode configured for local development
- [x] Dark theme constants (COLORS, SPACING)

### Screens (UI)
- [x] HomeScreen — focus session start, today's progress, weekly rank
- [x] FocusSessionScreen — countdown timer, complete/cancel
- [x] LeaderboardScreen — weekly rankings (mock data)
- [x] FriendsScreen — add friends UI (placeholder)
- [x] ProfileScreen — stats and settings (placeholder)

### Features
- [x] Focus timer with presets (15, 30, 60, 120 min)
- [x] Timer completion detection
- [x] Vibration on session complete
- [x] Completion screen ("🎉 Session Complete!")
- [x] Session storage via AsyncStorage (local)
- [x] Today's total tracking (local)
- [x] Supabase client configured
- [x] Graceful fallback when auth not set up

### Components
- [x] Card component (reusable)
- [x] Button component (primary, secondary, outline variants)
- [x] Type definitions (User, FocusSession, Friendship, WeeklyScore, AppInfo)

---

## 🔜 In Progress

### Auth Flow
- [ ] Sign up screen (email + password)
- [ ] Log in screen
- [ ] Supabase Auth integration
- [ ] Auto-create user profile in `users` table on signup
- [ ] Auth state persistence (stay logged in)
- [ ] Log out

---

## 📋 Phase 1: MVP Core

### Session History
- [ ] Show completed sessions list on home/profile
- [ ] Session details (date, duration, status)
- [ ] Delete session option

### Friends System
- [ ] Search users by username
- [ ] Send friend request
- [ ] Accept/reject friend request
- [ ] Remove friend
- [ ] Friends list screen

### Weekly Leaderboard (Real Data)
- [ ] Pull real focus totals from Supabase
- [ ] Rank friends by weekly focus time
- [ ] Show current week's dates
- [ ] Reset leaderboard each Monday

### Notifications
- [ ] Push notification permission
- [ ] Session reminder notifications
- [ ] Weekly results notification
- [ ] Friend request notifications

---

## 📋 Phase 2: Engagement

### Streaks
- [ ] Track consecutive days with focus sessions
- [ ] Streak counter on home screen
- [ ] Streak badge/badge system

### Badges & Achievements
- [ ] First session completed
- [ ] 10 sessions completed
- [ ] 7-day streak
- [ ] 30-day streak
- [ ] #1 on weekly leaderboard
- [ ] Total focus milestones (10h, 50h, 100h)

### Group Challenges
- [ ] Create group challenge (e.g., "No Instagram for 24h")
- [ ] Invite friends to challenge
- [ ] Track challenge progress
- [ ] Challenge results

### Focus Categories
- [ ] Tag sessions (study, work, exercise, reading, etc.)
- [ ] Stats per category
- [ ] Category icons

### Custom Penalties
- [ ] Loser of the week gets a fun consequence
- [ ] Ugly avatar for a day
- [ ] Funny nickname
- [ ] Dare generator

---

## 📋 Phase 3: Rewards & Monetization

### Reward System
- [ ] Points earned per focus minute
- [ ] Bonus points for streaks and leaderboard wins
- [ ] Points leaderboard

### Premium Tier ($4.99/mo or $39.99/yr)
- [ ] Unlimited friends & groups (free: 5 friends)
- [ ] Advanced analytics (weekly/monthly reports)
- [ ] Custom themes & avatars
- [ ] Export data (CSV/PDF)
- [ ] Priority challenges
- [ ] Remove ads

### Sponsored Challenges
- [ ] Brands sponsor focus challenges
- [ ] Prize pools for winners
- [ ] Brand-themed badges

### Partner Rewards
- [ ] Discount codes from partner brands
- [ ] Redeem focus points for rewards
- [ ] Rewards marketplace

### Ads (Free Tier)
- [ ] Non-intrusive banner ads
- [ ] Only shown outside focus sessions
- [ ] Rewarded ads for bonus features

---

## 📋 Phase 4: Native Blocking (Post-MVP)

### Android
- [ ] UsageStatsManager permission flow
- [ ] List installed apps
- [ ] AccessibilityService for monitoring foreground app
- [ ] Blocking overlay (SYSTEM_ALERT_WINDOW)
- [ ] Native module bridge to React Native

### iOS
- [ ] Apple Developer account ($99/yr)
- [ ] EAS Build setup for iOS
- [ ] Screen Time API / Family Controls entitlement
- [ ] App blocking via Managed Settings
- [ ] Test on physical device

---

## 🏗️ Technical Debt & Improvements

- [ ] Error boundary component
- [ ] Loading states on all screens
- [ ] Pull to refresh on lists
- [ ] Offline mode improvements
- [ ] Unit tests (Jest)
- [ ] E2E tests (Detox)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] App Store screenshots & listing
- [ ] Google Play screenshots & listing
- [ ] Privacy policy & terms of service
- [ ] App icon design
- [ ] Splash screen animation

---

## 📊 Progress Tracker

| Phase | Status | % Complete |
|-------|--------|------------|
| Setup | ✅ Done | 100% |
| Auth Flow | 🔜 Next | 0% |
| Session History | 📋 Planned | 0% |
| Friends System | 📋 Planned | 0% |
| Real Leaderboard | 📋 Planned | 0% |
| Notifications | 📋 Planned | 0% |
| Phase 2 Features | 📋 Planned | 0% |
| Monetization | 📋 Planned | 0% |
| Native Blocking | 📋 Planned | 0% |

---

## 📝 Changelog

### May 5, 2026
- Project scaffolded with Expo + TypeScript
- Supabase project created, tables + RLS set up
- 4 screens built (Home, Leaderboard, Friends, Profile)
- Focus timer with completion, vibration, local storage
- OpenCode configured for local dev
- Multiple bug fixes (UUID error, nav params, SafeAreaView)

---

*This document is updated as development progresses.*
