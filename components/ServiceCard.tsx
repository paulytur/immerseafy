import Link from "next/link";
import { Fragment } from "react";
import { ArrowRight, Clock, Gauge } from "lucide-react";
import { getServiceIcon } from "@/components/booking/service-icon";
import type { ServiceDefinition } from "@/lib/services-catalog";
import { getServicePriceLines } from "@/lib/services-catalog";

type ServiceCardProps = {
  service: ServiceDefinition;
};

export default function ServiceCard({ service }: ServiceCardProps) {
  const Icon = getServiceIcon(service.slug);
  const priceLines = getServicePriceLines(service);

  return (
    <article className="service-card">
      <div className="service-card-header">
        <div className="service-card-icon">
          <Icon size={18} />
        </div>
        <div className="service-card-copy">
          <h3 className="font-display text-lg font-semibold text-sand">
            {service.title}
          </h3>
          <p className="text-sm text-sand-muted">
            {service.shortDescription}
          </p>
        </div>
      </div>

      <div className="service-card-pricing">
        {priceLines.map((line) => (
          <Fragment key={line.label}>
            <span className="service-card-price-label">{line.label}</span>
            <span className="service-card-price-amount">{line.amount}</span>
          </Fragment>
        ))}
      </div>

      <div className="service-card-meta">
        <span className="service-card-badge">
          <Clock size={12} />
          {service.duration}
        </span>
        <span className="service-card-badge">
          <Gauge size={12} />
          {service.level}
        </span>
      </div>

      {service.included.length > 0 && (
        <div className="service-card-included">
          {service.included.map((item) => (
            <span key={item} className="service-card-chip">
              {item}
            </span>
          ))}
        </div>
      )}

      <ul className="service-card-features">
        {service.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <div className="service-card-actions">
        <Link href={`/book?service=${service.slug}`} className="btn-secondary w-full text-sm">
          Book this
          <ArrowRight size={16} />
        </Link>
        <Link
          href="/contact"
          className="text-center text-xs text-sand-muted transition-colors hover:text-teal"
        >
          Questions? Contact us
        </Link>
      </div>
    </article>
  );
}
