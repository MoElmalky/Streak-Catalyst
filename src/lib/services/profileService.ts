import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";

const GUEST_PROFILE_KEY = "catalyst_guest_profile_v1";

const DEFAULT_GUEST_PROFILE: Profile = {
  id: "guest-user",
  email: "guest@catalyst.local",
  timezone: "UTC",
  cosmic_energy: 120, // Initial balance so guest user can restore streaks right away
  created_at: new Date().toISOString(),
};

function getLocalProfile(): Profile {
  if (typeof window === "undefined") return DEFAULT_GUEST_PROFILE;
  const saved = localStorage.getItem(GUEST_PROFILE_KEY);
  if (!saved) {
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(DEFAULT_GUEST_PROFILE));
    return DEFAULT_GUEST_PROFILE;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return DEFAULT_GUEST_PROFILE;
  }
}

function saveLocalProfile(profile: Profile) {
  if (typeof window !== "undefined") {
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  }
}

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

      // Check if profile exists first to preserve cosmic_energy
      const { data: existing } = await supabase
        .from("profiles")
        .select("id, cosmic_energy")
        .eq("id", user.id)
        .maybeSingle();

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email || "",
            timezone,
            cosmic_energy: existing?.cosmic_energy ?? 0,
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

  // Get current user profile (Supabase or Guest)
  async getProfile(): Promise<Profile> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (!error && data) {
            return {
              id: data.id,
              email: data.email || user.email || "",
              timezone: data.timezone || this.getLocalTimezone(),
              cosmic_energy: Number(data.cosmic_energy || 0),
              created_at: data.created_at || new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.warn("Error fetching Supabase profile, falling back to local:", err);
      }
    }

    return getLocalProfile();
  },

  // Add Cosmic Energy to profile
  async addCosmicEnergy(amount: number): Promise<number> {
    if (amount <= 0) return 0;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: current } = await supabase
            .from("profiles")
            .select("cosmic_energy")
            .eq("id", user.id)
            .maybeSingle();

          const currentEnergy = Number(current?.cosmic_energy || 0);
          const nextEnergy = currentEnergy + amount;

          await supabase
            .from("profiles")
            .update({ cosmic_energy: nextEnergy })
            .eq("id", user.id);

          return nextEnergy;
        }
      } catch (err) {
        console.error("Failed to add cosmic energy in Supabase:", err);
      }
    }

    const local = getLocalProfile();
    local.cosmic_energy = (local.cosmic_energy || 0) + amount;
    saveLocalProfile(local);
    return local.cosmic_energy;
  },

  // Spend Cosmic Energy from profile (returns new balance, throws if insufficient)
  async spendCosmicEnergy(amount: number): Promise<number> {
    if (amount <= 0) return 0;

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: current } = await supabase
            .from("profiles")
            .select("cosmic_energy")
            .eq("id", user.id)
            .maybeSingle();

          const currentEnergy = Number(current?.cosmic_energy || 0);
          if (currentEnergy < amount) {
            throw new Error(`Insufficient Cosmic Energy. Have ${currentEnergy}, need ${amount}`);
          }

          const nextEnergy = currentEnergy - amount;
          await supabase
            .from("profiles")
            .update({ cosmic_energy: nextEnergy })
            .eq("id", user.id);

          return nextEnergy;
        }
      } catch (err: any) {
        if (err.message?.includes("Insufficient")) throw err;
        console.error("Failed to spend cosmic energy in Supabase:", err);
      }
    }

    const local = getLocalProfile();
    const current = local.cosmic_energy || 0;
    if (current < amount) {
      throw new Error(`Insufficient Cosmic Energy. Have ${current}, need ${amount}`);
    }
    local.cosmic_energy = current - amount;
    saveLocalProfile(local);
    return local.cosmic_energy;
  },
};
