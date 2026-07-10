"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeToggleProps = {
  variant?: "icon" | "admin";
};

export default function ThemeToggle({ variant = "icon" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    if (variant === "admin") {
      return (
        <span
          className="admin-nav-link w-full opacity-60"
          aria-hidden
        >
          <Moon size={16} />
          Theme
        </span>
      );
    }

    return (
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-teal/15"
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  if (variant === "admin") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="admin-nav-link w-full text-left"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
        {isDark ? "Light mode" : "Dark mode"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-teal/20 text-teal transition-colors hover:border-teal/50 hover:bg-teal/10"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
