import type { ReactNode } from "react";

interface MonoLabelProps {
  prefix: string;
  children?: ReactNode;
  tone?: "gold" | "accent" | "";
}

export default function MonoLabel({ prefix, children, tone = "" }: MonoLabelProps) {
  const toneClass = tone === "gold" ? "caps-gold" : tone === "accent" ? "caps-accent" : "";
  return (
    <div className="flex items-baseline gap-2.5">
      <span className={`caps ${toneClass}`}>{prefix}</span>
      {children && <span style={{ color: "var(--fg-3)", fontSize: 12 }}>{children}</span>}
    </div>
  );
}
