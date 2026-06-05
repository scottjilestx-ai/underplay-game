"use client";

import Image from "next/image";
import {
  FEATURED_LOGO_VARIANTS,
  LOGO_SRC,
  LOGO_VARIANT_LABELS,
  type LogoVariant,
} from "@/lib/themes";

export type { LogoVariant };

export function logoVariantLabel(v: LogoVariant): string {
  return LOGO_VARIANT_LABELS[v];
}

export const LOGO_VARIANTS: LogoVariant[] = FEATURED_LOGO_VARIANTS;

interface Props {
  variant: LogoVariant;
  size?: "hero" | "card" | "header";
  className?: string;
  priority?: boolean;
}

const SIZE_CLASS: Record<NonNullable<Props["size"]>, string> = {
  hero: "max-w-2xl aspect-[2.4/1]",
  card: "aspect-[2.2/1]",
  header: "w-[7.5rem] h-8 aspect-auto",
};

export function UnderPlayLogo({
  variant,
  size = "hero",
  className = "",
  priority = false,
}: Props) {
  const hero = size === "hero";
  const header = size === "header";

  return (
    <div
      className={`relative ${header ? SIZE_CLASS.header : `w-full ${SIZE_CLASS[size]}`} ${className}`}
    >
      <Image
        src={LOGO_SRC[variant]}
        alt={`UnderPlay logo, ${LOGO_VARIANT_LABELS[variant]} style`}
        fill
        priority={priority}
        sizes={
          header
            ? "120px"
            : hero
              ? "(max-width: 768px) 100vw, 672px"
              : "(max-width: 640px) 50vw, 320px"
        }
        className="object-contain object-left drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]"
      />
    </div>
  );
}