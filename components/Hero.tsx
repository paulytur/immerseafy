import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

export default function Hero() {
  return (
    <section className="hero-gradient relative overflow-hidden">
      <div className="page-container py-16 md:py-24 lg:py-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Logo className="h-16 w-auto md:h-24 lg:h-28" width={480} priority />

          <p className="eyebrow mt-8">Freediving community &amp; training</p>

          <p className="mt-6 text-lg leading-relaxed text-sand-muted md:text-xl">
            Go deeper with confidence. We teach breath control, safety, and
            technique so you can explore the underwater world with calm and
            clarity.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/services" className="btn-primary">
              Explore courses
              <ArrowRight size={18} />
            </Link>
            <Link href="/contact" className="btn-secondary">
              Get in touch
            </Link>
          </div>
        </div>
      </div>

      <div className="wave-divider" />
    </section>
  );
}
