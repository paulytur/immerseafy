"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { userMustResetPassword } from "@/lib/staff-users";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    window.location.href = userMustResetPassword(user?.user_metadata)
      ? "/admin/update-password"
      : next;
  }

  return (
    <div className="hero-gradient relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4 md:top-6 md:right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-12 w-auto" width={200} />
          <p className="eyebrow mt-6">Staff portal</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-sand">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-sand-muted">
            Manage bookings, schedule, and payments
          </p>
        </div>

        <form onSubmit={handleSubmit} className="admin-panel space-y-5">
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@immerseafy.com"
              className="form-input"
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-sand-muted">
          <Link href="/" className="text-teal hover:underline">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ocean-deep">
          <Loader2 className="animate-spin text-teal" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
