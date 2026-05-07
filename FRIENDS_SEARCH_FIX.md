# Friends Search Fix - RLS Policies

## Problem

The friends search in the app doesn't return other users. This is caused by:

1. **Missing INSERT policy** on the users table - New users can't create their profile during signup
2. **Missing UPDATE policy** on the users table - Users can't update their profile
3. Users table RLS policies were incomplete

## Root Cause

When a new user signs up via `AuthScreen.tsx`, the `useAuth.ts` signup function tries to insert into the users table:

```typescript
const { error: profileError } = await supabase.from('users').insert([{
  id: data.user.id,
  username,
  email,
}]);
```

Without an INSERT policy, this fails silently or returns an error. If users aren't being created, there's no one to search for!

## Solution

Run the SQL script `fix-friends-search-rls.sql` in your Supabase dashboard's SQL Editor. This will:

1. **Add SELECT policy** - Allow authenticated users to read all users (for friends search)
2. **Add INSERT policy** - Allow users to insert their own profile during signup
3. **Add UPDATE policy** - Allow users to update their own profile
4. **Fix focus sessions policies** - Ensure users can manage their own focus sessions

## How to Apply

### Option 1: Run the SQL Script (Recommended)

1. Open your Supabase dashboard
2. Go to **SQL Editor** → **New Query**
3. Copy the contents of `fix-friends-search-rls.sql`
4. Paste and run the query
5. Verify the policies are created by checking the output

### Option 2: Manual SQL Commands

Run these commands in the Supabase SQL Editor:

```sql
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Anyone can view focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Anyone can insert focus sessions" ON focus_sessions;

-- USERS TABLE RLS POLICIES
CREATE POLICY "Users can read all users" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- FOCUS SESSIONS TABLE RLS POLICIES
CREATE POLICY "Users can read all focus sessions" ON focus_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own focus sessions" ON focus_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus sessions" ON focus_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus sessions" ON focus_sessions
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Verification

### 1. Check Policies are Created

Run this query to verify all policies are in place:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('users', 'focus_sessions')
ORDER BY tablename, policyname;
```

**Expected output**: You should see 7 policies (3 for users, 4 for focus_sessions).

### 2. Test User Signup

1. Open the app
2. Go to the Sign Up screen
3. Enter a new email, password, and username
4. Submit the form
5. Check Supabase Dashboard → **Table Editor** → **users**
6. You should see the new user with their username

### 3. Test Friends Search

1. Create at least 2 user accounts
2. Log in as one user
3. Go to the Friends screen
4. Search for the other user's username
5. The user should appear in the search results

## RLS Policy Details

### Users Table Policies

| Policy Name | Operation | Condition | Purpose |
|-------------|-----------|-----------|---------|
| Users can read all users | SELECT | (true) | Allow friends search |
| Users can insert their own profile | INSERT | auth.uid() = id | Allow signup |
| Users can update their own profile | UPDATE | auth.uid() = id | Allow profile updates |

### Focus Sessions Table Policies

| Policy Name | Operation | Condition | Purpose |
|-------------|-----------|-----------|---------|
| Users can read all focus sessions | SELECT | (true) | Allow leaderboard |
| Users can insert their own focus sessions | INSERT | auth.uid() = user_id | Create sessions |
| Users can update their own focus sessions | UPDATE | auth.uid() = user_id | Update sessions |
| Users can delete their own focus sessions | DELETE | auth.uid() = user_id | Delete sessions |

## Security Considerations

### Development
- ✅ Using anon public key (safe for client apps)
- ✅ RLS policies enable friends search
- ✅ Users can only insert/update their own data
- ✅ No sensitive data in code

### Production
- ⚠️ Consider limiting public user visibility (e.g., only show username/id)
- ⚠️ Add rate limiting to search queries
- ⚠️ Implement proper email verification
- ⚠️ Use environment-specific configs

## Troubleshooting

### "New row violates row-level security policy"
**Cause**: Missing INSERT policy on users table
**Fix**: Run the SQL script to add the missing policies

### "Friends search returns no results"
**Cause**: Missing or incorrect SELECT policy, or no users in database
**Fix**:
1. Run the SQL script to add SELECT policy
2. Verify users exist in the users table
3. Check that usernames are saved correctly

### "Cannot update profile"
**Cause**: Missing UPDATE policy
**Fix**: Run the SQL script to add the UPDATE policy

## Related Files

- `src/hooks/useAuth.ts` - Handles user signup and profile creation
- `src/hooks/useFriends.ts` - Handles friends search
- `src/screens/AuthScreen.tsx` - Signup/login UI
- `fix-friends-search-rls.sql` - SQL script to apply the fix
- `QUICKSTART.md` - Updated with correct RLS policies
- `SUPABASE_SETUP.md` - Updated documentation

## Summary

The fix adds proper RLS policies to:
1. ✅ Allow users to create profiles during signup
2. ✅ Enable friends search functionality
3. ✅ Allow users to update their own profiles
4. ✅ Secure focus sessions management

After applying this fix, users can:
- Sign up and create their profile
- Search for other users by username
- Update their own profile information
- Create and manage focus sessions

**Status**: ✅ Ready to apply
**Last Updated**: 2026-05-07
**Version**: 1.0.0
