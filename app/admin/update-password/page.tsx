"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MUST_RESET_PASSWORD_KEY } from "@/lib/staff-users";
import Logo from "@/components/Logo";

export default function AdminUpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [mustReset, setMustReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      setMustReset(user.user_metadata?.[MUST_RESET_PASSWORD_KEY] === true);
      setCheckingSession(false);
    }

    checkSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { [MUST_RESET_PASSWORD_KEY]: false },
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ocean-deep">
        <Loader2 className="animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="hero-gradient flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-12 w-auto" width={200} />
          <p className="eyebrow mt-6">Staff portal</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-sand">
            Set your password
          </h1>
          <p className="mt-2 text-sm text-sand-muted">
            {mustReset
              ? "You must set a new password before using the dashboard."
              : "Choose a new password for your Immerseafy account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="admin-panel space-y-5">
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="password" className="form-label">
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pr-11"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-muted transition-colors hover:text-teal"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="form-label">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input pr-11"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-muted transition-colors hover:text-teal"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save password"
            )}
          </button>
        </form>

        {!mustReset && (
          <p className="mt-6 text-center text-sm text-sand-muted">
            <Link href="/admin/login" className="text-teal hover:underline">
              ← Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
