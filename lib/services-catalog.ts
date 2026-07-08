export type ServiceDefinition = {
  slug: string;
  title: string;
  /** Plain-language one-liner for cards and booking */
  shortDescription: string;
  duration: string;
  level: string;
  priceCents: number;
  /** Override price when booking length differs (e.g. 1-day vs 2-day) */
  priceByDuration?: Partial<Record<1 | 2, number>>;
  priceNote: string;
  /** Whether price is per person or per coached session */
  pricingUnit: "person" | "session";
  /** Max sessions per booking (session-priced courses only) */
  maxSessions?: number;
  /** Scannable inclusion chips for marketing cards */
  included: string[];
  features: string[];
  /** Which booking lengths customers can choose (days) */
  allowedDurations: (1 | 2)[];
  /** session = coach day/weekend (scheduled together); certification = Wave courses */
  scheduleType: "session" | "certification";
  /** Hidden from /services; available in booking flow only */
  bookingOnly?: boolean;
};

export const ACCOMPANYING_GUEST_SLUG = "accompanying-guest";

export function isStayOnlyService(service: ServiceDefinition | undefined): boolean {
  return service?.slug === ACCOMPANYING_GUEST_SLUG;
}

export function isStayOnlySlug(slug: string): boolean {
  return slug === ACCOMPANYING_GUEST_SLUG;
}

export const SERVICES: ServiceDefinition[] = [
  {
    slug: "discover-freediving",
    title: "Discover Freediving",
    shortDescription:
      "Your first breath-hold experience — no certification required.",
    duration: "1 or 2 days",
    level: "Beginner",
    priceCents: 215_000,
    priceByDuration: { 1: 215_000, 2: 300_000 },
    priceNote: "per person · 1 day incl. gears · 2 days incl. gears, photos & videos",
    pricingUnit: "person",
    included: ["Gear rental", "Safety briefing", "Photos & videos (2-day)"],
    allowedDurations: [1, 2],
    scheduleType: "session",
    features: [
      "Introduction to breath-hold and relaxation",
      "Safety briefing and buddy basics",
      "Confined water session",
      "Perfect first step into freediving",
    ],
  },
  {
    slug: "practice-dive",
    title: "Practice Dive",
    shortDescription:
      "Coach-led sessions to build skills and consistency between courses.",
    duration: "1 or 2 days",
    level: "All levels",
    priceCents: 215_000,
    priceByDuration: { 1: 215_000, 2: 300_000 },
    priceNote: "per person · 1 day incl. gears · 2 days incl. gears",
    pricingUnit: "person",
    included: ["Gear rental", "Coach feedback", "Pool or confined water"],
    allowedDurations: [1, 2],
    scheduleType: "session",
    features: [
      "Structured pool or confined water session",
      "Static and dynamic practice",
      "Technique drills with coach feedback",
      "Build consistency between courses",
    ],
  },
  {
    slug: "fundive",
    title: "Fundive",
    shortDescription:
      "Relaxed guided dives in open water — for certified freedivers only.",
    duration: "1–3 sessions",
    level: "Certified divers",
    priceCents: 75_000,
    priceNote: "per person per session",
    pricingUnit: "session",
    maxSessions: 3,
    included: ["Safety cover", "Buddy team", "Site exploration"],
    allowedDurations: [1, 2],
    scheduleType: "session",
    features: [
      "Relaxed open water freediving",
      "Explore sites with safety support",
      "Buddy team and surface cover",
      "Enjoy the underwater world",
    ],
  },
  {
    slug: "line-training",
    title: "Line Training",
    shortDescription:
      "Depth line coaching for technique, equalisation, and personal bests.",
    duration: "1–2 sessions",
    level: "Intermediate+",
    priceCents: 150_000,
    priceNote: "per person per session",
    pricingUnit: "session",
    maxSessions: 2,
    included: ["Safety divers", "Depth line setup", "Technique coaching"],
    allowedDurations: [1, 2],
    scheduleType: "session",
    features: [
      "Depth line sessions with safety divers",
      "Progressive depth blocks",
      "Equalisation and technique focus",
      "Preparation for certification or PBs",
    ],
  },
  {
    slug: "wave-1",
    title: "Wave 1 Certification Course",
    shortDescription:
      "3-day beginner course — earn an internationally recognised Molchanovs Wave 1 cert.",
    duration: "3 days",
    level: "Beginner",
    priceCents: 1_450_000,
    priceNote: "per person · full course",
    pricingUnit: "person",
    included: ["Theory & pool", "Open water modules", "Certification"],
    allowedDurations: [1, 2],
    scheduleType: "certification",
    features: [
      "Molchanovs Wave 1 curriculum",
      "Theory, pool, and open water modules",
      "Foundation breath-hold and safety skills",
      "Internationally recognised certification",
    ],
  },
  {
    slug: "wave-2",
    title: "Wave 2 Certification Course",
    shortDescription:
      "4-day intermediate course for divers ready to progress depth and technique.",
    duration: "4 days",
    level: "Intermediate",
    priceCents: 1_900_000,
    priceNote: "per person · full course",
    pricingUnit: "person",
    included: ["Advanced curriculum", "Pool assessments", "Certification"],
    allowedDurations: [1, 2],
    scheduleType: "certification",
    features: [
      "Molchanovs Wave 2 curriculum",
      "Advanced technique and depth progression",
      "Pool and open water assessments",
      "Internationally recognised certification",
    ],
  },
  {
    slug: ACCOMPANYING_GUEST_SLUG,
    title: "Accompanying guest",
    shortDescription:
      "Staying with the group — room and meals only, no diving or course activity.",
    duration: "1 or 2 days",
    level: "Non-participant",
    priceCents: 0,
    priceNote: "no activity fee · add-ons priced separately",
    pricingUnit: "person",
    included: ["Room & meals via add-ons"],
    allowedDurations: [1, 2],
    scheduleType: "session",
    bookingOnly: true,
    features: [
      "For friends or family not joining in-water sessions",
      "Count toward room and meal add-ons",
      "No coach or gear allocation required",
    ],
  },
];

export const SESSION_SERVICES = SERVICES.filter(
  (s) => s.scheduleType === "session" && !s.bookingOnly
);

export const BOOKING_SERVICES = SERVICES;

export const CATALOG_SERVICES = SERVICES.filter((s) => !s.bookingOnly);

export const CERTIFICATION_SERVICES = SERVICES.filter(
  (s) => s.scheduleType === "certification"
);

export const SESSION_SERVICE_SLUGS = SESSION_SERVICES.map((s) => s.slug);

export const CERTIFICATION_SERVICE_SLUGS = CERTIFICATION_SERVICES.map(
  (s) => s.slug
);

export const SERVICE_GROUPS = [
  {
    id: "intro",
    title: "First time & practice",
    description: "New to freediving or building skills between courses.",
    slugs: ["discover-freediving", "practice-dive"],
  },
  {
    id: "open-water",
    title: "Open water sessions",
    description: "For certified divers — book coached sessions, not full courses.",
    slugs: ["fundive", "line-training"],
  },
  {
    id: "certification",
    title: "Certification courses",
    description: "Multi-day Molchanovs Wave programmes with international certification.",
    slugs: ["wave-1", "wave-2"],
  },
] as const;

export function getServicesByGroup(groupId: (typeof SERVICE_GROUPS)[number]["id"]) {
  const group = SERVICE_GROUPS.find((entry) => entry.id === groupId);
  if (!group) return [];
  return group.slugs
    .map((slug) => getServiceBySlug(slug))
    .filter((service): service is ServiceDefinition => service != null);
}

export type ServicePriceLine = {
  label: string;
  amount: string;
};

export function getServicePriceLines(service: ServiceDefinition): ServicePriceLine[] {
  const oneDay = getServicePriceCents(service, 1);
  const twoDay = getServicePriceCents(service, 2);

  if (servicePricingUnit(service) === "session") {
    return [{ label: "Per person / session", amount: formatPrice(oneDay) }];
  }

  if (service.scheduleType === "certification") {
    return [{ label: "Full course", amount: formatPrice(oneDay) }];
  }

  if (service.allowedDurations.includes(2) && oneDay !== twoDay) {
    return [
      { label: "1 day", amount: formatPrice(oneDay) },
      { label: "2 days", amount: formatPrice(twoDay) },
    ];
  }

  return [{ label: "Per person", amount: formatPrice(oneDay) }];
}

export function formatServiceUnitPrice(
  service: ServiceDefinition,
  durationDays: 1 | 2 = 1
): string {
  if (isStayOnlyService(service)) {
    return "No activity fee";
  }

  const amount = formatPrice(getServicePriceCents(service, durationDays));
  if (servicePricingUnit(service) === "session") {
    return `${amount} / person / session`;
  }
  if (service.scheduleType === "certification") {
    return `${amount} / person (full course)`;
  }
  return `${amount} / person`;
}

export function allowedDurations(service: ServiceDefinition): (1 | 2)[] {
  return service.allowedDurations;
}

export function serviceSupportsTwoDays(service: ServiceDefinition): boolean {
  return service.allowedDurations.includes(2);
}

export function getServiceBySlug(slug: string): ServiceDefinition | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function getServicePriceCents(
  service: ServiceDefinition,
  durationDays: 1 | 2 = 1
): number {
  return service.priceByDuration?.[durationDays] ?? service.priceCents;
}

export function servicePricingUnit(service: ServiceDefinition): "person" | "session" {
  return service.pricingUnit;
}

export function maxSessionsForService(service: ServiceDefinition): number | null {
  return service.maxSessions ?? null;
}

export function clampSessionCount(service: ServiceDefinition, sessions: number): number {
  const max = maxSessionsForService(service);
  const count = Math.max(1, Math.floor(sessions));
  if (max == null) return count;
  return Math.min(max, count);
}

export function validateSessionCount(
  service: ServiceDefinition,
  sessions: number
): string | null {
  const max = maxSessionsForService(service);
  if (max != null && sessions > max) {
    return `${service.title} allows up to ${max} sessions per booking.`;
  }
  return null;
}

export function quantityFieldLabel(unit: "person" | "session"): string {
  return unit === "session" ? "How many sessions?" : "How many people?";
}

export function formatQuantityLabel(
  unit: "person" | "session",
  count: number
): string {
  if (unit === "session") {
    return count === 1 ? "1 session" : `${count} sessions`;
  }
  return count === 1 ? "1 person" : `${count} people`;
}

export function formatCourseLineSummary(
  service: ServiceDefinition,
  sessions: number,
  participants: number,
  durationDays?: 1 | 2
): string {
  const durationLabel =
    durationDays != null
      ? ` · ${durationDays === 2 ? "2 days" : "1 day"}`
      : "";

  if (isStayOnlyService(service)) {
    return `${formatQuantityLabel("person", participants)}${durationLabel} · stay only`;
  }

  if (servicePricingUnit(service) === "session") {
    return `${formatQuantityLabel("session", sessions)} · ${formatQuantityLabel("person", participants)}${durationLabel}`;
  }

  return `${formatQuantityLabel("person", participants)}${durationLabel}`;
}

export function summarizeBookingUnits(
  items: { serviceSlug: string; sessions: number; participants: number }[]
): string {
  let people = 0;
  let sessions = 0;

  for (const item of items) {
    const service = getServiceBySlug(item.serviceSlug);
    if (!service) continue;

    people += Math.max(0, item.participants);

    if (servicePricingUnit(service) === "session") {
      sessions += Math.max(0, item.sessions);
    }
  }

  const parts: string[] = [];
  if (people > 0) parts.push(formatQuantityLabel("person", people));
  if (sessions > 0) parts.push(formatQuantityLabel("session", sessions));

  return parts.join(" · ");
}

export function lineItemEstimatedTotal(
  service: ServiceDefinition,
  sessions: number,
  participants: number,
  durationDays: 1 | 2
): number {
  if (isStayOnlyService(service)) return 0;

  const unitPrice = getServicePriceCents(service, durationDays);
  return servicePricingUnit(service) === "session"
    ? unitPrice * sessions * participants
    : unitPrice * participants;
}

export function formatServicePrice(service: ServiceDefinition): string {
  const oneDay = getServicePriceCents(service, 1);
  const twoDay = getServicePriceCents(service, 2);

  if (
    service.allowedDurations.includes(2) &&
    oneDay !== twoDay
  ) {
    return `${formatPrice(oneDay)} (1 day) · ${formatPrice(twoDay)} (2 days)`;
  }

  return formatPrice(oneDay);
}

export function formatPrice(cents: number): string {
  return `₱${(cents / 100).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

export function bookingTotalCents(priceCents: number, headcount: number): number {
  return priceCents * headcount;
}
