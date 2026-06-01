import Link from "next/link";
import { ArrowRight, Clock, Gauge, Tag } from "lucide-react";

type ServiceCardProps = {
  title: string;
  duration: string;
  level: string;
  price: string;
  priceNote?: string;
  features: string[];
};

export default function ServiceCard({
  title,
  duration,
  level,
  price,
  priceNote,
  features,
}: ServiceCardProps) {
  return (
    <article className="card-surface flex flex-col rounded-xl p-6">
      <h3 className="font-display text-xl font-semibold text-sand">{title}</h3>

      <div className="mt-4 flex items-baseline gap-2">
        <Tag size={18} className="shrink-0 text-teal" aria-hidden />
        <div>
          <p className="font-display text-2xl font-bold tracking-tight text-teal">
            {price}
          </p>
          {priceNote && (
            <p className="mt-0.5 text-xs text-sand-muted">{priceNote}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-sand-muted">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} className="text-teal" />
          {duration}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Gauge size={14} className="text-teal" />
          {level}
        </span>
      </div>

      <ul className="mt-4 flex-1 space-y-2">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-sand-muted"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href="/contact"
        className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-teal transition-colors hover:text-teal-dim"
      >
        Enquire
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}
