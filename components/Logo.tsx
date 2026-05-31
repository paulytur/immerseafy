import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  className?: string;
  width?: number;
  priority?: boolean;
  onLinkClick?: () => void;
};

export default function Logo({
  className = "h-10 w-auto",
  width = 220,
  priority = false,
  onLinkClick,
}: LogoProps) {
  return (
    <Link
      href="/"
      className={`inline-block shrink-0 ${className}`}
      onClick={onLinkClick}
    >
      <Image
        src="/images/logo.png"
        alt="Immerseafy Freediving"
        width={width}
        height={Math.round(width * 0.35)}
        className="h-full w-auto object-contain object-left"
        priority={priority}
      />
    </Link>
  );
}
