import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import ServiceCard from "@/components/ServiceCard";
import { getServiceBySlug, SERVICE_GROUPS } from "@/lib/services-catalog";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Discover Freediving, practice dives, fundives, line training, and Wave 1 & Wave 2 certification courses with pricing.",
};

export default function ServicesPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="page-container">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="section-heading">Services</h1>
          <p className="mt-4 text-sand-muted">
            From your first discover session to Wave certification and line
            training — find what fits where you are today.
          </p>
          <p className="mt-3 text-sm text-sand-muted">
            Prices in Philippine pesos (₱). Group rates available —{" "}
            <Link href="/contact" className="text-teal hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>

        <div className="services-starter-callout">
          <div className="services-starter-icon">
            <Compass size={18} />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-sand">
              New to freediving?
            </p>
            <p className="mt-1 text-sm text-sand-muted">
              Start with{" "}
              <Link
                href="/book?service=discover-freediving"
                className="font-medium text-teal hover:underline"
              >
                Discover Freediving
              </Link>
              . Already certified? Try a{" "}
              <Link href="/book?service=fundive" className="font-medium text-teal hover:underline">
                Fundive
              </Link>{" "}
              or{" "}
              <Link
                href="/book?service=line-training"
                className="font-medium text-teal hover:underline"
              >
                Line Training
              </Link>{" "}
              session.
            </p>
          </div>
        </div>

        <div className="mt-14 space-y-14">
          {SERVICE_GROUPS.map((group) => (
            <section key={group.id} aria-labelledby={`services-${group.id}`}>
              <div className="mb-6 max-w-2xl">
                <p className="eyebrow">{group.title}</p>
                <p id={`services-${group.id}`} className="mt-2 text-sm text-sand-muted">
                  {group.description}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {group.slugs.map((slug) => {
                  const service = getServiceBySlug(slug);
                  if (!service) return null;
                  return <ServiceCard key={slug} service={service} />;
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
