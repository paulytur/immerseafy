import Image from "next/image";

type TeamCardProps = {
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
};

export default function TeamCard({ name, role, bio, imageSrc }: TeamCardProps) {
  return (
    <article className="card-surface overflow-hidden rounded-xl">
      <div className="relative aspect-[4/5] bg-ocean-mid/50">
        <Image
          src={imageSrc}
          alt={name}
          fill
          className={
            imageSrc.endsWith(".png")
              ? "object-contain object-bottom p-2"
              : "object-cover"
          }
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      </div>
      <div className="p-6">
        <h3 className="font-display text-xl font-semibold text-sand">{name}</h3>
        <p className="mt-1 text-sm font-medium text-teal">{role}</p>
        <p className="mt-3 text-sm leading-relaxed text-sand-muted">{bio}</p>
      </div>
    </article>
  );
}
