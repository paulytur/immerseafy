"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type BookingReferenceCardProps = {
  reference: string;
};

export default function BookingReferenceCard({
  reference,
}: BookingReferenceCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="booking-reference-card">
      <p className="booking-reference-label">Your booking reference</p>
      <div className="booking-reference-row">
        <code className="booking-reference-code">{reference}</code>
        <button
          type="button"
          onClick={copyReference}
          className="booking-reference-copy"
          aria-label="Copy booking reference"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="booking-reference-reminder">
        Save this reference somewhere safe. You&apos;ll need it if you contact us
        about your booking.
      </p>
    </div>
  );
}
