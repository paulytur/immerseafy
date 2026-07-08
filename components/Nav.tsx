"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/team", label: "Our Team" },
  { href: "/services", label: "Services" },
  { href: "/book", label: "Book" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-teal/15 bg-ocean-deep/95 backdrop-blur-md">
      <nav className="page-container flex h-[4.5rem] items-center justify-between gap-4 md:h-20">
        <Logo
          className="h-9 md:h-11"
          width={200}
          priority
          onLinkClick={() => setOpen(false)}
        />

        <div className="hidden items-center gap-6 md:flex">
          <ul className="flex items-center gap-8">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`text-sm font-semibold tracking-wide uppercase transition-colors ${
                    pathname === href
                      ? "text-teal"
                      : "text-sand-muted hover:text-teal"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="text-teal"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-teal/15 bg-ocean-mid md:hidden">
          <ul className="page-container flex flex-col gap-1 py-4">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-semibold tracking-wide uppercase ${
                    pathname === href
                      ? "bg-teal/10 text-teal"
                      : "text-sand-muted hover:bg-ocean-light/20 hover:text-teal"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
