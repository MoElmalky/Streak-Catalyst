-- ==============================================================================
-- Cosmic Energy & Streak Restoration Migration
-- 1. Adds cosmic_energy to profiles
-- 2. Adds broken_streak & broken_at tracking to streaks
-- 3. Function: process_end_of_day_catalyst (calculates tier energy & updates highest streak)
-- 4. Function: restore_task_streak (restores broken streak with 1-day grace window)
-- ==============================================================================

-- 1. Profiles: Add cosmic_energy balance
ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS cosmic_energy BIGINT NOT NULL DEFAULT 0;

-- 2. Streaks: Add broken_streak and broken_at timestamp for 1-day restore window
ALTER TABLE IF EXISTS streaks
ADD COLUMN IF NOT EXISTS broken_streak INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS broken_at TIMESTAMPTZ DEFAULT NULL;

-- 3. End-of-Day Database Function
-- Can be called via pg_cron at midnight, or invoked on demand per user
CREATE OR REPLACE FUNCTION process_end_of_day_catalyst(target_user_id UUID DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_user_tz TEXT;
  v_today_date DATE;
  v_yesterday_date DATE;
  v_total_energy_earned INT := 0;
  v_task_reward INT := 0;
  v_streak RECORD;
  v_reset_count INT := 0;
  v_completed_count INT := 0;
BEGIN
  -- Iterate through target user or all users
  FOR v_user IN
    SELECT id, COALESCE(timezone, 'UTC') as timezone, cosmic_energy
    FROM profiles
    WHERE (target_user_id IS NULL OR id = target_user_id)
  LOOP
    v_user_tz := v_user.timezone;
    v_today_date := (NOW() AT TIME ZONE v_user_tz)::DATE;
    v_yesterday_date := v_today_date - INTERVAL '1 day';
    v_total_energy_earned := 0;

    -- Process tasks completed today: Award Tier Energy & Update Highest Streak
    FOR v_streak IN
      SELECT s.id, s.current_streak, s.max_streak, s.last_completed_at
      FROM streaks s
      WHERE s.user_id = v_user.id
        AND s.last_completed_at IS NOT NULL
        AND (s.last_completed_at AT TIME ZONE v_user_tz)::DATE = v_today_date
    LOOP
      -- Calculate Cosmic Energy based on tier achieved:
      -- Tier 1 (1-4): 1
      -- Tier 2 (5-14): 3
      -- Tier 3 (15-29): 8
      -- Tier 4 (30-99): 20
      -- Tier 5 (100+): 50
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
      v_completed_count := v_completed_count + 1;

      -- Update highest streak record (max_streak) in the same function
      UPDATE streaks
      SET max_streak = GREATEST(max_streak, current_streak),
          updated_at = NOW()
      WHERE id = v_streak.id;
    END LOOP;

    -- Credit accumulated Cosmic Energy to the user profile
    IF v_total_energy_earned > 0 THEN
      UPDATE profiles
      SET cosmic_energy = cosmic_energy + v_total_energy_earned
      WHERE id = v_user.id;
    END IF;

    -- Process tasks NOT completed today or yesterday: Break streak with 1-day grace window
    FOR v_streak IN
      SELECT s.id, s.current_streak, s.last_completed_at
      FROM streaks s
      WHERE s.user_id = v_user.id
        AND s.current_streak > 0
        AND (
          s.last_completed_at IS NULL
          OR (s.last_completed_at AT TIME ZONE v_user_tz)::DATE < v_yesterday_date
        )
    LOOP
      -- Preserve previous streak count and timestamp for 1-day restoration
      UPDATE streaks
      SET broken_streak = current_streak,
          broken_at = NOW(),
          current_streak = 0,
          updated_at = NOW()
      WHERE id = v_streak.id;

      v_reset_count := v_reset_count + 1;
    END LOOP;

    -- Clear expired broken streaks older than 1 day (24 hours)
    UPDATE streaks
    SET broken_streak = NULL,
        broken_at = NULL
    WHERE user_id = v_user.id
      AND broken_at IS NOT NULL
      AND broken_at < (NOW() - INTERVAL '1 day');

  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'tasks_completed', v_completed_count,
    'energy_awarded', v_total_energy_earned,
    'streaks_broken', v_reset_count
  );
END;
$$;

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
