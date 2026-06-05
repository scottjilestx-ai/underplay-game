"use client";

import type { Card } from "@underplay/engine";
import { ThemedCardBack } from "./ThemedCardBack";
import { samplePreviewCard, ThemedCardFace } from "./ThemedCardFace";
import type { GameThemeId } from "@/lib/themes";

const SAMPLE_CLEAR: Card = { id: "preview-clear", kind: "clear" };
const SAMPLE_SKIP: Card = { id: "preview-skip", kind: "skip" };

interface Props {
  themeId: GameThemeId;
  className?: string;
}

/** Mini card for selectors and theme browser. */
export function ThemeCardMini({ themeId, className = "" }: Props) {
  return (
    <div
      className={`relative w-11 h-[3.9rem] rounded-[0.3rem] overflow-hidden shadow-md ${className}`}
    >
      <ThemedCardBack themeId={themeId} className="h-full w-full" />
    </div>
  );
}

export function ThemeCardStrip({ themeId, className = "" }: Props) {
  const face = samplePreviewCard(themeId);
  const cardClass = "h-full w-full";

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="relative w-[3.25rem] h-[4.75rem] rounded-[0.3rem] overflow-hidden shadow-lg shrink-0">
        <ThemedCardBack themeId={themeId} className={cardClass} />
      </div>
      <div className="relative w-[3.25rem] h-[4.75rem] rounded-[0.3rem] overflow-hidden shadow-lg shrink-0 bg-white">
        <ThemedCardFace card={face} themeId={themeId} className={cardClass} />
      </div>
      <div className="relative w-[3.25rem] h-[4.75rem] rounded-[0.3rem] overflow-hidden shadow-lg shrink-0 bg-white">
        <ThemedCardFace card={SAMPLE_CLEAR} themeId={themeId} className={cardClass} />
      </div>
      <div className="relative w-[3.25rem] h-[4.75rem] rounded-[0.3rem] overflow-hidden shadow-lg shrink-0 bg-white">
        <ThemedCardFace card={SAMPLE_SKIP} themeId={themeId} className={cardClass} />
      </div>
    </div>
  );
}