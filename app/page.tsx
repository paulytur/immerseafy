import Link from "next/link";
import Hero from "@/components/Hero";
import { Shield, Wind, Users, ArrowRight } from "lucide-react";

const highlights = [
  {
    icon: Shield,
    title: "Safety-first training",
    description:
      "Every session follows established protocols with buddy systems, clear signals, and progressive depth limits.",
  },
  {
    icon: Wind,
    title: "Breath & technique",
    description:
      "Learn relaxation, equalisation, and efficient movement so you can hold longer and dive with less effort.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Train alongside passionate divers who share knowledge, encouragement, and unforgettable underwater moments.",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      <section className="py-16 md:py-24">
        <div className="page-container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-heading">Why dive with us</h2>
            <p className="mt-4 text-sand-muted">
              Whether you&apos;re curious about your first breath-hold or
              preparing for deeper lines, we meet you where you are.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {highlights.map(({ icon: Icon, title, description }) => (
              <article key={title} className="card-surface rounded-xl p-6">
                <div className="mb-4 inline-flex rounded-lg bg-teal/10 p-3 text-teal">
                  <Icon size={24} />
                </div>
                <h3 className="font-display text-lg font-semibold text-sand">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-sand-muted">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-teal/15 bg-ocean-mid py-16 md:py-20">
        <div className="page-container flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="section-heading">Meet the team</h2>
            <p className="mt-3 max-w-md text-sand-muted">
              Certified instructors with years of experience in pool and open
              water freediving.
            </p>
          </div>
          <Link href="/team" className="btn-secondary shrink-0">
            View team
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="page-container flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="section-heading">Ready to start?</h2>
            <p className="mt-3 max-w-md text-sand-muted">
              Browse our courses from intro sessions to advanced depth training,
              or get in touch with any questions.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link href="/services" className="btn-primary">
              View services
            </Link>
            <Link href="/contact" className="btn-secondary">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
