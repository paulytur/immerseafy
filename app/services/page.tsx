import type { Metadata } from "next";
import ServiceCard from "@/components/ServiceCard";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Discover Freediving, practice dives, fundives, line training, and Wave 1 & Wave 2 certification courses with pricing.",
};

// Update prices below (PHP ₱). Use "Contact for pricing" until rates are final.
const services = [
  {
    title: "Discover Freediving",
    duration: "2 days",
    level: "Beginner",
    price: "₱3,000",
    priceNote: "per person · Gears · Raw Photos & Videos",
    features: [
      "Introduction to breath-hold and relaxation",
      "Safety briefing and buddy basics",
      "Confined water session",
      "Perfect first step into freediving",
    ],
  },
  {
    title: "Practice Dive",
    duration: "2 Days",
    level: "All levels",
    price: "₱3,000",
    priceNote: "per person",
    features: [
      "Structured pool or confined water session",
      "Static and dynamic practice",
      "Technique drills with coach feedback",
      "Build consistency between courses",
    ],
  },
  {
    title: "Fundive",
    duration: "Session-based",
    level: "Certified divers",
    price: "₱750",
    priceNote: "per session",
    features: [
      "Relaxed open water freediving",
      "Explore sites with safety support",
      "Buddy team and surface cover",
      "Enjoy the underwater world",
    ],
  },
  {
    title: "Line Training",
    duration: "Session-based",
    level: "Intermediate+",
    price: "₱1,500",
    priceNote: "per session",
    features: [
      "Depth line sessions with safety divers",
      "Progressive depth blocks",
      "Equalisation and technique focus",
      "Preparation for certification or PBs",
    ],
  },
  {
    title: "Wave 1 Certification Course",
    duration: "3 days",
    level: "Beginner",
    price: "₱14,500",
    priceNote: "per person",
    features: [
      "Molchanovs Wave 1 curriculum",
      "Theory, pool, and open water modules",
      "Foundation breath-hold and safety skills",
      "Internationally recognised certification",
    ],
  },
  {
    title: "Wave 2 Certification Course",
    duration: "4-day",
    level: "Intermediate",
    price: "₱19,000",
    priceNote: "per person",
    features: [
      "Molchanovs Wave 2 curriculum",
      "Advanced technique and depth progression",
      "Pool and open water assessments",
      "Internationally recognised certification",
    ],
  },
];

export default function ServicesPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="page-container">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="section-heading">Services</h1>
          <p className="mt-4 text-sand-muted">
            From your first discover session to Wave certification and line
            training — find the session that fits where you are today.
          </p>
          <p className="mt-3 text-sm text-sand-muted">
            Prices shown in Philippine pesos (₱). Group rates and packages
            available —{" "}
            <a href="/contact" className="text-teal hover:underline">
              contact us
            </a>{" "}
            for details.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </div>
    </div>
  );
}
