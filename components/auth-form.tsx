"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { ClientApiError, fetchJson } from "@/lib/client-api";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRegister = mode === "register";

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        ...(isRegister
          ? { displayName: String(formData.get("displayName") ?? "") }
          : {}),
      };
      const response = await fetchJson<{ user: { onboardingComplete: boolean } }>(
        isRegister ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      router.push(response.user.onboardingComplete ? "/dashboard" : "/onboarding");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "Unable to complete the request.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function enterDemo() {
    const data = new FormData();
    data.set("email", "demo@levelup.local");
    data.set("password", "LevelUpDemo!");
    await submit(data);
  }

  return (
    <div className="card rpg-auth-card w-full max-w-md p-6 sm:p-8">
      <p className="eyebrow">{isRegister ? "Create your character" : "Continue your campaign"}</p>
      <h1 className="rpg-title mt-3 text-3xl">
        {isRegister ? "Start the architect path" : "Welcome back, architect"}
      </h1>
      <p className="muted mt-3 text-sm leading-6">
        {isRegister
          ? "Choose your focus areas after account creation. Progress stays in your local SQLite database."
          : "Sign in to resume your adaptive quests, practice exams, and certification roadmap."}
      </p>

      <form action={submit} className="mt-6 space-y-4">
        {isRegister ? (
          <label className="block text-sm font-semibold">
            Display name
            <input
              className="input mt-1.5"
              name="displayName"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />
          </label>
        ) : null}
        <label className="block text-sm font-semibold">
          Email
          <input
            className="input mt-1.5"
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input
            className="input mt-1.5"
            type="password"
            name="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={8}
            maxLength={128}
            required
          />
        </label>
        {error ? (
          <p
            className="rounded-control border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--cp-danger)",
              color: "var(--cp-danger)",
              background: "var(--cp-surface-soft)",
            }}
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <button className="button-primary w-full" type="submit" disabled={busy}>
          {busy ? (
            <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
          ) : (
            <ArrowRight size={18} aria-hidden="true" />
          )}
          {isRegister ? "Create account" : "Sign in"}
        </button>
      </form>

      {!isRegister ? (
        <>
          <div className="rpg-divider my-5">
            <span className="text-xs font-black uppercase tracking-widest">or</span>
          </div>
          <button
            className="button-secondary w-full"
            type="button"
            onClick={enterDemo}
            disabled={busy}
          >
            Explore with demo data
          </button>
        </>
      ) : null}

      <p className="muted mt-6 text-center text-sm">
        {isRegister ? "Already have an account?" : "New to the guild?"}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-semibold"
          style={{ color: "var(--cp-link)" }}
        >
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
