# Quick Start Guide

## 🚀 You're Almost Ready!

### ✅ What's Complete
- Supabase configured with your credentials
- Database tables created (users, focus_sessions)
- Code updated to work with Supabase UUIDs
- All TypeScript errors fixed
- Focus session system fully implemented

---

## ⚡ 3 Steps to Run the App

### Step 1: Create the `.env` File
Create a file named `.env` in the `detox-duel` folder with this content:

```env
EXPO_PUBLIC_SUPABASE_URL=https://chwvaekvcomgxipstmbx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNod3ZhZWt2Y29tZ3hpcHN0bWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzgxODgsImV4cCI6MjA5MzUxNDE4OH0.uOK4I38Ixs_bMVV_8XmVZ9M5Xlp4yIzIIvPcLRa3BzM
```

### Step 2: Set Up Database
Go to your Supabase dashboard → **SQL Editor** → **New Query** and run:

```sql
-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER NOT NULL,
  blocked_apps TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_start_time ON focus_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_status ON focus_sessions(status);

-- Enable RLS (allow public access for demo)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view users" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can view focus sessions" ON focus_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert focus sessions" ON focus_sessions FOR INSERT WITH CHECK (true);

-- Create test user
INSERT INTO users (username, email, created_at)
VALUES ('TestUser', 'test@example.com', NOW())
ON CONFLICT (email) DO NOTHING;

-- Get the user ID (copy this!)
SELECT id, username FROM users WHERE username = 'TestUser';
```

### Step 3: Update the App Code
1. Copy the UUID from the SELECT query result (Step 2)
2. Open `src/screens/HomeScreen.tsx`
3. Replace `YOUR_UUID_HERE` with your actual UUID:
```typescript
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000'; // Your UUID here
```

### Step 4: Run the App!
```bash
cd detox-duel
npm start
```

---

## 🎯 What You Can Do

✅ Start a focus session (15, 30, 60, or 120 minutes)
✅ Watch the countdown timer
✅ Complete or cancel sessions
✅ See today's progress
✅ View weekly rankings
✅ Data saved to both local storage and Supabase

---

## 📱 Testing Checklist

- [ ] Select a duration and click "Start Focusing"
- [ ] See the countdown timer running
- [ ] Click "Complete Session"
- [ ] Check Supabase dashboard → Table Editor → focus_sessions
- [ ] See your session in the database!
- [ ] Check Home screen for updated progress

---

## 🐛 Troubleshooting

**Error: "invalid supabaseurl"**
→ Make sure `.env` file exists in `detox-duel` folder

**Sessions not saving to Supabase**
→ Check that MOCK_USER_ID matches a real UUID in your users table

**Weekly totals not showing**
→ Complete at least one session first

---

## 📚 Full Documentation

See `SUPABASE_SETUP.md` for detailed setup and troubleshooting.

---

**Good luck! 🚀**
