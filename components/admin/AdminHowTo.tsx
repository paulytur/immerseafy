"use client";

import { useState } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";

export type HowToStep = {
  title: string;
  detail?: string;
};

type AdminHowToProps = {
  title?: string;
  steps: HowToStep[];
  defaultOpen?: boolean;
};

export default function AdminHowTo({
  title = "How to",
  steps,
  defaultOpen = false,
}: AdminHowToProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="admin-panel overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-teal/5"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/15 text-teal">
            <CircleHelp size={18} />
          </div>
          <div>
            <p className="font-semibold text-sand">{title}</p>
            <p className="text-xs text-sand-muted">
              {open ? "Hide guide" : "Show step-by-step guide"}
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-teal transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ol className="space-y-3 border-t border-teal/10 px-5 py-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/15 text-xs font-bold text-teal">
                {index + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-medium text-sand">{step.title}</p>
                {step.detail && (
                  <p className="mt-0.5 text-sm leading-relaxed text-sand-muted">
                    {step.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
