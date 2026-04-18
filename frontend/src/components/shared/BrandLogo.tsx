interface BrandLogoProps {
  size?: number;
  showTag?: boolean;
}

export default function BrandLogo({ size = 18, showTag = true }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-2.5" style={{ fontFamily: "var(--f-display)", fontSize: 20, letterSpacing: "-0.01em", color: "var(--fg)" }}>
      <div className="grid place-items-center" style={{ width: size + 4, height: size + 4, color: "var(--accent)" }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M3 20V5l6 8 3-5 3 5 6-8v15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="3" cy="20" r="1.2" fill="currentColor"/>
          <circle cx="21" cy="20" r="1.2" fill="currentColor"/>
        </svg>
      </div>
      <span>MBEditor</span>
      {showTag && (
        <span
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 9,
            letterSpacing: "0.25em",
            color: "var(--fg-4)",
            border: "1px solid var(--border-2)",
            padding: "2px 6px",
            borderRadius: 3,
            textTransform: "uppercase",
          }}
        >
          v3 &middot; AGENT
        </span>
      )}
    </div>
  );
}
