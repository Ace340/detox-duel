# Supabase Setup Guide for Detox Duel

## ✅ Setup Complete - Next Steps

You've successfully configured Supabase! Here's what's been done and what you need to do next.

---

## 📋 What's Been Done

1. ✅ `.env` file created with your Supabase credentials
2. ✅ Database tables created (users, focus_sessions)
3. ✅ Row Level Security (RLS) enabled
4. ✅ Code updated to work with Supabase UUIDs
5. ✅ TypeScript errors fixed
6. ✅ App ready to run!

---

## 🚀 Final Steps Before Running

### Step 1: Get Your Test User UUID

After running the SQL queries in Step 3 of the setup, you should have received a UUID result. It looks like this:

```
id                  | username
--------------------|----------
550e8400-e29b-41... | TestUser
```

**Copy the UUID from the `id` column.**

### Step 2: Update MOCK_USER_ID in HomeScreen

Open `src/screens/HomeScreen.tsx` and replace the placeholder with your actual UUID:

```typescript
// Before:
const MOCK_USER_ID = 'YOUR_UUID_HERE';

// After (replace with your actual UUID):
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
```

### Step 3: Restart the Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

---

## 🧪 Testing the App

### Test 1: Start a Focus Session
1. Open the app
2. Select a duration (15, 30, 60, or 120 minutes)
3. Click "Start Focusing"
4. You should see the Focus Session screen with a countdown timer

### Test 2: Complete a Session
1. Let the timer run or click "Complete Session"
2. The session should be saved to:
   - AsyncStorage (local)
   - Supabase (cloud)

### Test 3: Check Your Data in Supabase
1. Go to your Supabase dashboard
2. Click **Table Editor** in the left sidebar
3. Click on **focus_sessions**
4. You should see your completed session!

### Test 4: Check Weekly Totals
1. The Home screen should show your today's progress
2. The Weekly Rank should update based on your sessions

---

## 🔍 Troubleshooting

### Error: "invalid supabaseurl: must be a valid HTTP or HTTPS URL"
**Cause**: `.env` file not created or incorrect format
**Fix**: Ensure `.env` file exists in `detox-duel` folder with correct format

### Error: "JWT expired" or "Invalid JWT"
**Cause**: Using wrong key (secret key instead of anon key)
**Fix**: Ensure you're using the **anon public** key, not the secret key

### Sessions not saving to Supabase
**Cause**: UUID mismatch or database permissions
**Fix**:
1. Check that MOCK_USER_ID matches a real UUID in your users table
2. Run this query to verify: `SELECT * FROM users;`

### Weekly totals not showing
**Cause**: No sessions in database or query issues
**Fix**:
1. Complete at least one session
2. Check Supabase Table Editor → focus_sessions
3. Ensure status is 'completed'

---

## 📊 Database Schema Reference

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| username | TEXT | Unique username |
| email | TEXT | Unique email |
| avatar_url | TEXT | Optional profile picture |
| created_at | TIMESTAMP | Account creation date |

### Focus Sessions Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| user_id | UUID | Foreign key to users.id |
| start_time | TIMESTAMP | When session started |
| end_time | TIMESTAMP | When session ended (nullable) |
| duration_minutes | INTEGER | Session duration in minutes |
| blocked_apps | TEXT[] | List of blocked apps (for future use) |
| status | TEXT | 'active', 'completed', or 'cancelled' |
| created_at | TIMESTAMP | Record creation date |

---

## 🎯 Next Features to Add

When you're ready to expand beyond the mock version:

1. **Authentication**
   - Implement Supabase Auth (email/password, OAuth)
   - Replace MOCK_USER_ID with actual user session

2. **Real App Blocking**
   - Use React Native's Accessibility Services
   - Block distracting apps during focus sessions

3. **Real-time Leaderboard**
   - Use Supabase Realtime subscriptions
   - Live updates when friends complete sessions

4. **Push Notifications**
   - Remind users to start sessions
   - Celebrate streaks and achievements

5. **Statistics & Analytics**
   - Daily, weekly, monthly focus trends
   - Most productive times of day
   - Session completion rates

---

## 🔐 Security Notes

### For Development
- ✅ Using anon public key (safe for client apps)
- ✅ RLS policies allow friends search and user profiles
- ✅ Users can only insert/update their own data
- ✅ No sensitive data in code

### For Production
- ⚠️ Implement proper authentication
- ⚠️ Consider tightening RLS policies (e.g., limit public user visibility)
- ⚠️ Use environment-specific configs
- ⚠️ Never commit `.env` to git

---

## 📞 Need Help?

If you encounter issues:

1. Check the Supabase logs: **Dashboard → Logs**
2. Check the browser console for errors
3. Verify the `.env` file format
4. Ensure all SQL queries ran successfully

---

**Setup Status**: ✅ Ready to Run!

**Last Updated**: 2026-05-07
**Version**: 1.1.0 (Friends Search Fix)
