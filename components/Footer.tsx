import Link from "next/link";
import { Instagram, Facebook, Mail } from "lucide-react";
import Logo from "@/components/Logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/team", label: "Our Team" },
  { href: "/services", label: "Services" },
  { href: "/book", label: "Book" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-teal/15 bg-ocean-mid">
      <div className="page-container py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo className="h-10" width={180} />
            <p className="mt-4 max-w-sm text-sm text-sand-muted">
              Discover calm beneath the surface. Training, community, and
              breath-hold adventures for every level.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-16">
            <div>
              <p className="eyebrow mb-3">Pages</p>
              <ul className="flex flex-col gap-2">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-sand-muted transition-colors hover:text-teal"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="eyebrow mb-3">Connect</p>
              <ul className="flex gap-4">
                <li>
                  <a
                    href="https://www.instagram.com/immerseafy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sand-muted transition-colors hover:text-teal"
                    aria-label="Instagram"
                  >
                    <Instagram size={20} />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/profile.php?id=100093683319927"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sand-muted transition-colors hover:text-teal"
                    aria-label="Facebook"
                  >
                    <Facebook size={20} />
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@immerseafy.com"
                    className="text-sand-muted transition-colors hover:text-teal"
                    aria-label="Email"
                  >
                    <Mail size={20} />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="wave-divider my-8" />
        <p className="text-center text-sm text-sand-muted">
          Immerseafy Freediving is operated by Immerseafy Sports Equipment
          and Accessories
        </p>
        <p className="mt-3 text-center text-xs tracking-wide text-sand-muted uppercase">
          &copy; {year} Immerseafy Freediving. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
