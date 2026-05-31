import type { Metadata } from "next";
import ServiceCard from "@/components/ServiceCard";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Discover Freediving, practice dives, fundives, line training, and Wave 1 & 2 certification courses.",
};

const services = [
  {
    title: "Discover Freediving",
    duration: "2 days",
    level: "Beginner",
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
    features: [
      "Structured pool or confined water session",
      "Static and dynamic practice",
      "Technique drills with coach feedback",
      "Build consistency between courses",
    ],
  },
  {
    title: "Fundive",
    duration: "1 - 2 day/s",
    level: "Certified divers",
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
    features: [
      "Depth line sessions with safety divers",
      "Progressive depth blocks",
      "Equalisation and technique focus",
      "Preparation for certification or PBs",
    ],
  },
  {
    title: "Wave 1 & 2 Certification Courses",
    duration: "Multi-day",
    level: "Beginner – intermediate",
    features: [
      "Molchanovs Wave 1 and Wave 2 pathways",
      "Theory, pool, and open water modules",
      "Internationally recognised certification",
      "Complete foundation to advanced freediver",
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
