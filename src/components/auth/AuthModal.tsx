"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Check,
  Github,
  AlertCircle,
  LogOut,
  UserCheck,
} from "lucide-react";
import { useCatalystStore } from "@/store/useCatalystStore";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { profileService } from "@/lib/services/profileService";
import { useQueryClient } from "@tanstack/react-query";
import { TASKS_QUERY_KEY } from "@/hooks/useTasks";

type AuthMode = "password-signin" | "password-signup" | "magic-link";

export const AuthModal: React.FC = () => {
  const isAuthModalOpen = useCatalystStore((s) => s.isAuthModalOpen);
  const setAuthModalOpen = useCatalystStore((s) => s.setAuthModalOpen);
  const queryClient = useQueryClient();

  const [authMode, setAuthMode] = useState<AuthMode>("password-signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  // Check current session on open
  useEffect(() => {
    if (!isConfigured || !isAuthModalOpen) return;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) {
          setCurrentUserEmail(data.user.email);
        } else {
          setCurrentUserEmail(null);
        }
      });
    } catch {
      setCurrentUserEmail(null);
    }
  }, [isAuthModalOpen, isConfigured]);

  const handleOAuth = async (provider: "google" | "github") => {
    if (!isConfigured) {
      setErrorMessage("Supabase credentials not configured yet. Operating in local Guest Mode.");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const supabase = createClient();
      const redirectUrl =
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("not enabled") || error.message.toLowerCase().includes("unsupported")) {
          throw new Error(
            `${provider.toUpperCase()} is not yet enabled in your Supabase project. In your Supabase Dashboard, go to Authentication -> Providers to enable ${provider}, or use Email & Password below!`
          );
        }
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to initiate ${provider} sign-in`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (!isConfigured) {
      setErrorMessage("Supabase credentials not configured in .env. Operating in local Guest Mode.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const supabase = createClient();

      if (authMode === "password-signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        setCurrentUserEmail(data.user?.email || email);
        setSuccessMessage("Signed in successfully!");
        await profileService.syncUserTimezone();
        queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
        setTimeout(() => setAuthModalOpen(false), 1200);
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              timezone: profileService.getLocalTimezone(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          setCurrentUserEmail(data.user?.email || email);
          setSuccessMessage("Account created & signed in!");
          await profileService.syncUserTimezone();
          queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
          setTimeout(() => setAuthModalOpen(false), 1200);
        } else {
          setSuccessMessage("Account created! Check your email to confirm your account (or disable email confirmation in Supabase Auth settings for instant login).");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!isConfigured) {
      setErrorMessage("Supabase credentials not configured in .env. Operating in local Guest Mode.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const supabase = createClient();
      const redirectUrl =
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;
      setMagicSent(true);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          "Failed to send magic link. Note: Supabase free tier rate-limits emails. Use Email + Password below for instant login!"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setCurrentUserEmail(null);
      setSuccessMessage("Signed out successfully");
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      setTimeout(() => {
        setSuccessMessage("");
        setAuthModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign out");
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setAuthModalOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-catalyst-surface p-6 shadow-2xl backdrop-blur-2xl"
        >
          {/* Top Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30">
                <ShieldCheck className="h-4 w-4 text-sky-400" />
              </div>
              <h3 className="text-base font-bold text-white">Catalyst Account & Cloud Sync</h3>
            </div>
            <button
              onClick={() => setAuthModalOpen(false)}
              className="rounded-xl p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Active User Status Banner */}
          {currentUserEmail ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-emerald-300">Signed In As</div>
                  <div className="text-sm font-bold text-white truncate">{currentUserEmail}</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/30 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-900/40"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
                <button
                  onClick={() => setAuthModalOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl bg-white py-2 text-xs font-bold text-black hover:bg-slate-200 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* OAuth Providers (Google & GitHub) */}
              <div className="mt-5 space-y-2.5">
                <button
                  disabled={isLoading}
                  onClick={() => handleOAuth("google")}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <button
                  disabled={isLoading}
                  onClick={() => handleOAuth("github")}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  <Github className="h-4 w-4" />
                  Continue with GitHub
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative bg-catalyst-surface px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Or Email & Password
                </span>
              </div>

              {/* Tabs: Sign In / Sign Up / Magic Link */}
              <div className="flex rounded-xl border border-white/10 bg-black/40 p-1 mb-3">
                <button
                  type="button"
                  onClick={() => setAuthMode("password-signin")}
                  className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${
                    authMode === "password-signin"
                      ? "bg-white/15 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("password-signup")}
                  className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${
                    authMode === "password-signup"
                      ? "bg-white/15 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("magic-link")}
                  className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${
                    authMode === "magic-link"
                      ? "bg-white/15 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Magic Link
                </button>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-2.5 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Success Message Alert */}
              {successMessage && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-2.5 text-xs text-emerald-300">
                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span className="leading-relaxed">{successMessage}</span>
                </div>
              )}

              {/* Forms */}
              {authMode === "magic-link" ? (
                magicSent ? (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check className="h-5 w-5" />
                    </div>
                    <h4 className="mt-2 text-sm font-bold text-white">Magic Link Dispatched</h4>
                    <p className="mt-1 text-xs text-slate-300">
                      Check your email at <strong>{email}</strong> and click the link to sign in.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-3">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !email}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-500 py-2.5 text-xs font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
                    >
                      <span>{isLoading ? "Sending Magic Link..." : "Send Magic Link"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </form>
                )
              ) : (
                <form onSubmit={handlePasswordAuth} className="space-y-3">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Password (min 6 characters)"
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !email || password.length < 6}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2 text-xs font-bold text-black transition hover:bg-slate-200 disabled:opacity-50 shadow-glow-sm"
                  >
                    <span>
                      {isLoading
                        ? "Processing..."
                        : authMode === "password-signin"
                        ? "Sign In"
                        : "Create Account"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}

              {/* Guest mode footer */}
              <div className="mt-4 border-t border-white/10 pt-3 text-center">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Continue without account (Guest Mode)
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
