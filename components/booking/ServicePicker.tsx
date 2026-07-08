"use client";

import AdminSelect from "@/components/admin/AdminSelect";
import { getServiceBySlug, BOOKING_SERVICES } from "@/lib/services-catalog";

type ServicePickerProps = {
  value: string;
  onChange: (slug: string) => void;
  excludedSlugs: string[];
};

export default function ServicePicker({
  value,
  onChange,
  excludedSlugs,
}: ServicePickerProps) {
  const available = BOOKING_SERVICES.filter(
    (service) =>
      service.slug === value || !excludedSlugs.includes(service.slug)
  );

  const options = available.map((service) => ({
    value: service.slug,
    label: service.title,
  }));

  const selected = getServiceBySlug(value);

  return (
    <div className="service-picker-compact">
      <AdminSelect
        value={value}
        onChange={onChange}
        options={options}
        searchable={options.length > 5}
        searchPlaceholder="Search activities…"
        placeholder="Choose activity…"
        className="booking-control"
      />
      {selected && (
        <p className="service-picker-compact-hint">{selected.shortDescription}</p>
      )}
    </div>
  );
}
