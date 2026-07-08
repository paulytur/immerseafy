"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { CATALOG_SERVICES } from "@/lib/services-catalog";

const services = [
  ...CATALOG_SERVICES.map((service) => service.title),
  "General enquiry",
];

function normalizeFormspreeId(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.match(/formspree\.io\/f\/([^/?]+)/)?.[1] ?? trimmed;
}

function formspreeIdFromEnv(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_FORMSPREE_ID?.trim();
  return raw ? normalizeFormspreeId(raw) : undefined;
}

function ContactFormInner() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";

  const [formspreeId, setFormspreeId] = useState<string | undefined>(() =>
    formspreeIdFromEnv()
  );
  const [configLoaded, setConfigLoaded] = useState(
    () => !!formspreeIdFromEnv()
  );

  useEffect(() => {
    if (formspreeId) return;

    fetch("/site-config.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { formspreeId?: string } | null) => {
        if (data?.formspreeId) {
          setFormspreeId(normalizeFormspreeId(data.formspreeId));
        }
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
  }, [formspreeId]);

  const action = formspreeId
    ? `https://formspree.io/f/${formspreeId}`
    : undefined;

  const showDevWarning =
    process.env.NODE_ENV === "development" && configLoaded && !formspreeId;

  if (success) {
    return (
      <div className="card-surface rounded-xl p-8 text-center">
        <p className="font-display text-xl font-semibold text-teal">
          Message sent
        </p>
        <p className="mt-3 text-sm text-sand-muted">
          Thank you for reaching out. We&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      method="POST"
      className="card-surface space-y-5 rounded-xl p-6 md:p-8"
    >
      {showDevWarning && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Set <code className="text-teal">NEXT_PUBLIC_FORMSPREE_ID</code> in{" "}
          <code className="text-teal">.env.local</code> or add{" "}
          <code className="text-teal">formspreeId</code> to{" "}
          <code className="text-teal">public/site-config.json</code>.
        </p>
      )}

      <input type="hidden" name="_next" value="/contact?success=true" />

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-sand">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-lg border border-teal/25 bg-input px-4 py-2.5 text-sand placeholder:text-sand-muted/50 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-sand">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-teal/25 bg-input px-4 py-2.5 text-sand placeholder:text-sand-muted/50 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="service" className="mb-1.5 block text-sm font-medium text-sand">
          Service interest
        </label>
        <select
          id="service"
          name="service"
          className="w-full rounded-lg border border-teal/25 bg-input px-4 py-2.5 text-sand focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
          defaultValue=""
        >
          <option value="" disabled>
            Select a service
          </option>
          {services.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-sand">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full resize-y rounded-lg border border-teal/25 bg-input px-4 py-2.5 text-sand placeholder:text-sand-muted/50 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
          placeholder="Tell us about your experience and goals..."
        />
      </div>

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={!configLoaded || !formspreeId}
      >
        {!configLoaded ? "Loading…" : "Send message"}
      </button>
    </form>
  );
}

export default function ContactForm() {
  return (
    <Suspense
      fallback={
        <div className="card-surface h-96 animate-pulse rounded-xl" />
      }
    >
      <ContactFormInner />
    </Suspense>
  );
}
