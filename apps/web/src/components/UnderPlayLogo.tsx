"use client";

import Image from "next/image";

export type LogoVariant = "acdc" | "kiss" | "metallica" | "queen" | "stones";

const VARIANT_LABELS: Record<LogoVariant, string> = {
  acdc: "High voltage (AC/DC)",
  kiss: "Arena chrome (KISS)",
  metallica: "Thrash metal (Metallica)",
  queen: "Arena royalty (Queen)",
  stones: "Classic rock (Rolling Stones)",
};

const LOGO_SRC: Record<LogoVariant, string> = {
  acdc: "/logos/acdc.jpg",
  kiss: "/logos/kiss.jpg",
  metallica: "/logos/metallica.jpg",
  queen: "/logos/queen.jpg",
  stones: "/logos/stones.jpg",
};

export function logoVariantLabel(v: LogoVariant): string {
  return VARIANT_LABELS[v];
}

export const LOGO_VARIANTS: LogoVariant[] = [
  "acdc",
  "kiss",
  "metallica",
  "queen",
  "stones",
];

interface Props {
  variant: LogoVariant;
  size?: "hero" | "card";
  className?: string;
  priority?: boolean;
}

export function UnderPlayLogo({
  variant,
  size = "hero",
  className = "",
  priority = false,
}: Props) {
  const hero = size === "hero";
  return (
    <div
      className={`relative w-full ${hero ? "max-w-2xl aspect-[2.4/1]" : "aspect-[2.2/1]"} ${className}`}
    >
      <Image
        src={LOGO_SRC[variant]}
        alt={`UnderPlay logo, ${VARIANT_LABELS[variant]} style`}
        fill
        priority={priority}
        sizes={hero ? "(max-width: 768px) 100vw, 672px" : "(max-width: 640px) 50vw, 320px"}
        className="object-contain object-center drop-shadow-[0_8px_32px_rgba(0,0,0,0.55)]"
      />
    </div>
  );
}