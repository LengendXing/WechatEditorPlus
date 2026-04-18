import type { ReactNode, HTMLAttributes } from "react";

type ChipTone = "" | "gold" | "accent" | "forest" | "info" | "warn";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: ChipTone;
}

export default function Chip({ children, tone = "", className = "", ...props }: ChipProps) {
  const toneClass = tone ? `chip-${tone}` : "";
  return (
    <span className={`chip ${toneClass} ${className}`} {...props}>
      {children}
    </span>
  );
}
