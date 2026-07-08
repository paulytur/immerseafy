import type { LucideIcon } from "lucide-react";
import {
  Award,
  Compass,
  Home,
  Target,
  Waves,
  Wind,
} from "lucide-react";
import { ACCOMPANYING_GUEST_SLUG } from "@/lib/services-catalog";

const SERVICE_ICONS: Record<string, LucideIcon> = {
  "discover-freediving": Compass,
  "practice-dive": Wind,
  fundive: Waves,
  "line-training": Target,
  "wave-1": Award,
  "wave-2": Award,
  [ACCOMPANYING_GUEST_SLUG]: Home,
};

export function getServiceIcon(slug: string): LucideIcon {
  return SERVICE_ICONS[slug] ?? Waves;
}
