-- ==============================================================================
-- Cosmic Energy & Streak Restoration Migration (Hourly Midnight Processing)
-- 1. Profiles: Add cosmic_energy balance & last_eod_date for idempotency
-- 2. Streaks: Add broken_streak & broken_at timestamp for 1-day restore window
-- 3. Function: process_end_of_day_catalyst (runs hourly, processes users whose local day just ended)
-- 4. Function: restore_task_streak (restores broken streak with 1-day grace window)
-- 5. Cron: Schedules process_end_of_day_catalyst to run every hour at minute 0
-- ==============================================================================

-- 1. Profiles: Add cosmic_energy balance and last_eod_date
ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS cosmic_energy BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_eod_date DATE DEFAULT NULL;

-- 2. Streaks: Add broken_streak and broken_at timestamp for 1-day restore window
ALTER TABLE IF EXISTS streaks
ADD COLUMN IF NOT EXISTS broken_streak INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS broken_at TIMESTAMPTZ DEFAULT NULL;

-- 3. End-of-Day Database Function
-- Runs exclusively on the database via hourly cron.
-- Automatically filters users whose local time is currently in the midnight hour (00:00 - 00:59).
DROP FUNCTION IF EXISTS process_end_of_day_catalyst(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS process_end_of_day_catalyst(UUID);

CREATE OR REPLACE FUNCTION process_end_of_day_catalyst()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_user_tz TEXT;
  v_local_now TIMESTAMP;
  v_ended_date DATE;
  v_total_energy_earned INT := 0;
  v_task_reward INT := 0;
  v_streak RECORD;
  v_users_processed INT := 0;
  v_total_tasks_completed INT := 0;
  v_total_energy_distributed INT := 0;
  v_total_streaks_reset INT := 0;
BEGIN
  -- Only process users whose local time is currently in the midnight hour (00:00 - 00:59)
  FOR v_user IN
    SELECT
      id,
      COALESCE(timezone, 'UTC') as timezone,
      COALESCE(cosmic_energy, 0) as cosmic_energy,
      last_eod_date
    FROM profiles
    WHERE EXTRACT(HOUR FROM (NOW() AT TIME ZONE COALESCE(timezone, 'UTC'))) = 0
  LOOP
    -- Safely resolve user's local time with fallback to UTC
    v_user_tz := v_user.timezone;
    BEGIN
      v_local_now := (NOW() AT TIME ZONE v_user_tz);
    EXCEPTION WHEN OTHERS THEN
      v_user_tz := 'UTC';
      v_local_now := (NOW() AT TIME ZONE 'UTC');
    END;

    -- In the midnight hour (00:00 - 00:59), the concluded day is yesterday in local time
    v_ended_date := (v_local_now::DATE - INTERVAL '1 day')::DATE;

    -- Idempotency check: Skip if user was already processed for this concluded date
    IF v_user.last_eod_date IS NOT NULL AND v_user.last_eod_date >= v_ended_date THEN
      CONTINUE;
    END IF;

    v_total_energy_earned := 0;

    -- 1. Tasks completed on the concluded day: Award Tier Energy & Update Highest Streak
    FOR v_streak IN
      SELECT s.id, s.current_streak, s.max_streak, s.last_completed_at
      FROM streaks s
      WHERE s.user_id = v_user.id
        AND s.last_completed_at IS NOT NULL
        AND (s.last_completed_at AT TIME ZONE v_user_tz)::DATE = v_ended_date
    LOOP
      -- Calculate Cosmic Energy based on tier achieved:
      -- Tier 1 (1-4): +1 Energy
      -- Tier 2 (5-14): +3 Energy
      -- Tier 3 (15-29): +8 Energy
      -- Tier 4 (30-99): +20 Energy
      -- Tier 5 (100+): +50 Energy
      IF v_streak.current_streak >= 100 THEN
        v_task_reward := 50;
      ELSIF v_streak.current_streak >= 30 THEN
        v_task_reward := 20;
      ELSIF v_streak.current_streak >= 15 THEN
        v_task_reward := 8;
      ELSIF v_streak.current_streak >= 5 THEN
        v_task_reward := 3;
      ELSIF v_streak.current_streak >= 1 THEN
        v_task_reward := 1;
      ELSE
        v_task_reward := 0;
      END IF;

      v_total_energy_earned := v_total_energy_earned + v_task_reward;
      v_total_tasks_completed := v_total_tasks_completed + 1;

      -- Update highest streak record (max_streak) in the same function
      UPDATE streaks
      SET max_streak = GREATEST(max_streak, current_streak),
          updated_at = NOW()
      WHERE id = v_streak.id;
    END LOOP;

    -- 2. Tasks NOT completed on the concluded day: Break streak and record broken_at timestamp (1-day grace window)
    FOR v_streak IN
      SELECT s.id, s.current_streak, s.last_completed_at
      FROM streaks s
      WHERE s.user_id = v_user.id
        AND s.current_streak > 0
        AND (
          s.last_completed_at IS NULL
          OR (s.last_completed_at AT TIME ZONE v_user_tz)::DATE < v_ended_date
        )
    LOOP
      -- Preserve previous streak count and timestamp for 1-day restoration
      UPDATE streaks
      SET broken_streak = current_streak,
          broken_at = NOW(),
          current_streak = 0,
          updated_at = NOW()
      WHERE id = v_streak.id;

      v_total_streaks_reset := v_total_streaks_reset + 1;
    END LOOP;

    -- 3. Clear expired broken streaks older than 1 day (24 hours)
    UPDATE streaks
    SET broken_streak = NULL,
        broken_at = NULL
    WHERE user_id = v_user.id
      AND broken_at IS NOT NULL
      AND broken_at < (NOW() - INTERVAL '1 day');

    -- 4. Credit accumulated Cosmic Energy to profile and record last_eod_date
    UPDATE profiles
    SET cosmic_energy = cosmic_energy + v_total_energy_earned,
        last_eod_date = v_ended_date
    WHERE id = v_user.id;

    v_total_energy_distributed := v_total_energy_distributed + v_total_energy_earned;
    v_users_processed := v_users_processed + 1;

  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'users_processed', v_users_processed,
    'tasks_rewarded', v_total_tasks_completed,
    'energy_awarded', v_total_energy_distributed,
    'streaks_broken', v_total_streaks_reset
  );
END;
$$;

-- Restrict execution permissions: only postgres and service_role (your cron job) can invoke this function
REVOKE EXECUTE ON FUNCTION process_end_of_day_catalyst() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION process_end_of_day_catalyst() TO postgres, service_role;

-- 4. Database Function: Restore Task Streak Using Cosmic Energy
CREATE OR REPLACE FUNCTION restore_task_streak(p_task_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_streak RECORD;
  v_profile RECORD;
  v_cost INT := 0;
  v_broken_streak INT;
BEGIN
  -- Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Fetch streak record
  SELECT * INTO v_streak
  FROM streaks
  WHERE task_id = p_task_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Streak not found';
  END IF;

  IF v_streak.broken_streak IS NULL OR v_streak.broken_streak <= 0 THEN
    RAISE EXCEPTION 'No broken streak to restore';
  END IF;

  -- 1-Day Strict Window Verification
  IF v_streak.broken_at IS NULL OR v_streak.broken_at < (NOW() - INTERVAL '1 day') THEN
    -- Clear expired state
    UPDATE streaks SET broken_streak = NULL, broken_at = NULL WHERE id = v_streak.id;
    RAISE EXCEPTION 'Restoration window has expired. Streaks can only be restored within 1 day.';
  END IF;

  v_broken_streak := v_streak.broken_streak;

  -- Determine restoration cost based on tier:
  -- Tier 1 (1-4): 10 Energy
  -- Tier 2 (5-14): 40 Energy
  -- Tier 3 (15-29): 150 Energy
  -- Tier 4 (30-99): 400 Energy
  -- Tier 5 (100+): 1500 Energy
  IF v_broken_streak >= 100 THEN
    v_cost := 1500;
  ELSIF v_broken_streak >= 30 THEN
    v_cost := 400;
  ELSIF v_broken_streak >= 15 THEN
    v_cost := 150;
  ELSIF v_broken_streak >= 5 THEN
    v_cost := 40;
  ELSE
    v_cost := 10;
  END IF;

  -- Fetch user profile and check energy balance
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_profile.cosmic_energy < v_cost THEN
    RAISE EXCEPTION 'Insufficient Cosmic Energy. Required: %, Available: %', v_cost, v_profile.cosmic_energy;
  END IF;

  -- Deduct Cosmic Energy from user profile
  UPDATE profiles
  SET cosmic_energy = cosmic_energy - v_cost
  WHERE id = v_user_id;

  -- Restore streak
  UPDATE streaks
  SET current_streak = v_broken_streak,
      broken_streak = NULL,
      broken_at = NULL,
      last_completed_at = NOW(),
      updated_at = NOW()
  WHERE id = v_streak.id;

  RETURN jsonb_build_object(
    'success', true,
    'restored_streak', v_broken_streak,
    'cost_deducted', v_cost,
    'remaining_energy', (v_profile.cosmic_energy - v_cost)
  );
END;
$$;

-- Permissions: authenticated users can restore their own streaks (SECURITY DEFINER uses auth.uid() internally)
REVOKE EXECUTE ON FUNCTION restore_task_streak(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION restore_task_streak(UUID) TO authenticated;

-- 5. Cron Job: Run process_end_of_day_catalyst every hour at minute 0
-- Requires pg_cron extension (enabled by default in Supabase)
-- If pg_cron is not available, this will fail silently - you can schedule via Supabase Dashboard instead.
DO $$
BEGIN
  -- Remove existing schedule if any
  PERFORM cron.unschedule('catalyst_end_of_day_hourly');
EXCEPTION WHEN OTHERS THEN
  -- Ignore if job doesn't exist
  NULL;
END;
$$;

SELECT cron.schedule(
  'catalyst_end_of_day_hourly',
  '0 * * * *',  -- Every hour at minute 0
  'SELECT process_end_of_day_catalyst();'
);
