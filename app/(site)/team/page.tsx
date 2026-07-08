import type { Metadata } from "next";
import TeamCard from "@/components/TeamCard";

export const metadata: Metadata = {
  title: "My Team",
  description:
    "Meet the founders and safety team behind Immerseafy Freediving — instruction, safety, and community on every dive.",
};

const founders = [
  {
    name: "Paul Yturzaita",
    role: "Founder · Instructor",
    bio: "Paul co-founded Immerseafy and leads training as Head Instructor with Molchanovs Wave 2 certification. He guides discover sessions, practice dives, fundives, line training, and Wave 1 & 2 courses with a focus on safety, calm technique, and helping divers progress at their own pace.",
    imageSrc: "/images/paul-yturzaita.png",
  },
  {
    name: "Dominic Rivera",
    role: "Founder · Lead Safety Diver",
    bio: "Dominic co-founded Immerseafy and serves as Lead Safety Diver, overseeing buddy protocols, surface cover, and rescue readiness on pool and open water sessions so every diver can train with confidence.",
    imageSrc: "/images/dominic-rivera.png",
  },
  {
    name: "J-lyn Guevarra",
    role: "Founder · Lead Safety Diver",
    bio: "J-lyn co-founded Immerseafy and works alongside the team as Lead Safety Diver, ensuring clear communication, proper safety procedures, and a supportive environment from line training to fundives.",
    imageSrc: "/images/j-lyn-guevarra.png",
  },
];

const safetyDivers = [
  {
    name: "Zed Tanjista",
    role: "Safety Diver",
    bio: "Zed supports sessions as Safety Diver, providing surface cover and buddy oversight so divers can focus on technique and depth with a reliable safety team in place.",
    imageSrc: "/images/team-4.svg",
  },
  {
    name: "Lance Dusaban",
    role: "Safety Diver",
    bio: "Lance joins pool and open water sessions as Safety Diver, helping maintain protocols and a calm, well-organised environment for every training block.",
    imageSrc: "/images/team-5.svg",
  },
];

export default function TeamPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="page-container">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="section-heading">My Team</h1>
          <p className="mt-4 text-sand-muted">
            Immerseafy was built by founders who combine certified instruction
            with dedicated safety leadership on every session.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {founders.map((member) => (
            <TeamCard key={member.name} {...member} />
          ))}
        </div>

        <div className="mt-16 md:mt-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="eyebrow">Safety team</h2>
            <p className="mt-3 text-sand-muted">
              Our safety divers support every session with surface cover and
              buddy oversight.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-8 sm:grid-cols-2">
            {safetyDivers.map((member) => (
              <TeamCard key={member.name} {...member} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
