"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (session) {
          router.replace("/menu");
        }
      });
  }, [router]);

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    setResetMessage("");
    if (!resetEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setResetLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/login`,
      });
      if (resetError) throw resetError;
      setResetMessage("If an account exists for that email, you will receive a password reset link.");
      setResetEmail("");
    } catch (err) {
      setError(err.message ?? "Failed to send reset link");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      router.push("/menu");
      router.refresh();
    } catch (err) {
      setError(err.message ?? "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-sm px-6">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sign in
        </h1>
        <div className="mt-8 flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {error && (
            <p
              className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
              role="alert"
            >
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                placeholder="you@example.com"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded bg-zinc-800 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setShowReset(!showReset);
              setError("");
              setResetMessage("");
            }}
            className="mt-2 text-sm text-zinc-600 hover:text-zinc-900 underline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Forgot password?
          </button>
          {showReset && (
            <form
              onSubmit={handleResetPassword}
              className="mt-4 flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700"
            >
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email
                </span>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </label>
              <button
                type="submit"
                disabled={resetLoading}
                className="rounded border border-zinc-300 bg-white py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {resetLoading ? "Sending…" : "Send reset link"}
              </button>
              {resetMessage && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
                  {resetMessage}
                </p>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
