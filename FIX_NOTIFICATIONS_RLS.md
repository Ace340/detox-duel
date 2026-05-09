# Fix Notifications RLS - Application Guide

## Problem
When creating duel challenges, the app was failing with:
```
ERROR Failed to create notification for primary opponent: {"code": "42501", "message": "new row violates row-level security policy for table \"notifications\""}
```

## Root Cause
The `notifications` table had RLS policies that were too restrictive, preventing users from inserting notifications for other users. This broke:
- Duel challenges (creator → opponent)
- Friend requests (sender → recipient)
- Friend acceptances (accepter → sender)

## Fixed Issue
Initial version had UUID comparison errors. Updated to use direct UUID comparison:
- ✅ `auth.uid() = user_id` (both UUIDs, direct comparison)

## Solution
Created migration: `supabase/migrations/20250509_fix_notifications_rls.sql`

The new RLS policies:
- **SELECT**: Users can only read their own notifications
- **INSERT**: Authenticated users can insert notifications for any user (needed for social features)
- **UPDATE**: Users can only update their own notifications (mark as read)
- **DELETE**: Users can only delete their own notifications

## How to Apply This Fix

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (in left sidebar)
4. Click **New Query**
5. Copy the contents of `supabase/migrations/20250509_fix_notifications_rls.sql`
6. Paste into the SQL Editor
7. Click **Run** (▶️)
8. Verify success in the output

### Option 2: Via Supabase CLI

If you have the Supabase CLI installed:

```bash
# From the project root (detox-duel directory)
supabase db push
```

### Option 3: Via psql command line

```bash
# Connect to your database
psql -h YOUR_DB_HOST -U postgres -d YOUR_DB_NAME

# Then paste and run the SQL from the migration file
```

## Verify the Fix

After applying the migration, test by:

1. Open the app
2. Navigate to create a duel challenge
3. Challenge another user
4. Verify no error in console
5. Check that opponent receives the notification

## Expected Behavior After Fix

✅ Duel challenges are created successfully
✅ Notifications are delivered to opponents
✅ Friend requests work correctly
✅ Users can mark notifications as read
✅ Users can only see their own notifications

## Troubleshooting

### Error: "relation 'notifications' does not exist"

If the notifications table doesn't exist, you need to create it first:

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'weekly_summary', 'challenge_invite')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

Then run the migration file again.

### Still getting RLS errors after migration?

1. Check that policies are applied:
```sql
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

2. Verify you're logged in:
```sql
SELECT auth.uid();
```

3. Check if RLS is enabled:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'notifications';
```

## Related Files

- `src/hooks/useDuel.ts` - Duel creation with notification logic
- `src/hooks/useNotifications.ts` - Notification operations
- `detox-duel/create-duels-schema.sql` - RLS policy patterns for reference
