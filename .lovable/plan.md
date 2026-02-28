

## Analysis

Two issues found:

1. **Issues have no `department_id`**: The `submit-issue` edge function never assigns a `department_id` when creating issues. The authority dashboard filters by `department_id`, so issues with `null` department never appear.

2. **No real-time updates**: The authority dashboard only fetches on mount and when filters change. New issues from citizens don't appear until manual refresh.

## Fix

### 1. `supabase/functions/submit-issue/index.ts` - Auto-assign department based on category

After creating the issue, look up the matching department and assign it:
- Map categories to department names: `roads` → "Roads & Infrastructure", `water`/`sanitation` → "Water & Sanitation", `electricity` → "Electricity & Power"
- Query the `departments` table for the matching department
- Set `department_id` on the new issue insert

### 2. Fix existing issues with null `department_id`

Run a migration to update existing issues that have `department_id = null` to map them to the correct department based on their category.

### 3. `src/pages/authority/AuthorityDashboard.tsx` - Add realtime subscription

Add a Supabase realtime subscription on the `issues` table filtered by `department_id`. On any INSERT/UPDATE/DELETE event, increment `refreshKey` to trigger a re-fetch of both issues and stats.

### 4. `src/pages/authority/AuthorityQueue.tsx` - Add realtime subscription

Same realtime subscription pattern as the dashboard.

