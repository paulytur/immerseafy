"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const services = [
  "Discover Freediving",
  "Practice Dive",
  "Fundive",
  "Line Training",
  "Wave 1 & 2 Certification Courses",
  "General enquiry",
];

function ContactFormInner() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";

  const formspreeId = process.env.NEXT_PUBLIC_FORMSPREE_ID;
  const action = formspreeId
    ? `https://formspree.io/f/${formspreeId}`
    : undefined;

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
      {!formspreeId && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Set <code className="text-teal">NEXT_PUBLIC_FORMSPREE_ID</code> in
          your <code className="text-teal">.env.local</code> file to enable form
          submissions.
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
        disabled={!formspreeId}
      >
        Send message
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
