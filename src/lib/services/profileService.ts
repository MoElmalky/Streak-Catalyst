import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

export const profileService = {
  // Automatically detects user's local IANA timezone (e.g. 'Europe/Istanbul', 'America/New_York')
  getLocalTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  },

  // Returns formatted local timezone with GMT offset (e.g. "Europe/Istanbul (GMT+3)")
  getTimezoneLabel(): string {
    const tz = this.getLocalTimezone();
    try {
      const now = new Date();
      const offsetMinutes = -now.getTimezoneOffset();
      const sign = offsetMinutes >= 0 ? "+" : "-";
      const hours = Math.floor(Math.abs(offsetMinutes) / 60);
      return `${tz} (GMT${sign}${hours})`;
    } catch {
      return tz;
    }
  },

  // Syncs and upserts the detected timezone into the user's profile in Supabase
  async syncUserTimezone(): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const timezone = this.getLocalTimezone();

      // Upsert to ensure profile row always exists with user's accurate timezone
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email || "",
            timezone,
          },
          { onConflict: "id" }
        );

      if (error) {
        console.warn("Could not upsert profile timezone:", error.message);
      }
    } catch (err) {
      console.warn("Could not sync profile timezone:", err);
    }
  },
};
