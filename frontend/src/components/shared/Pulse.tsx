interface PulseProps {
  size?: number;
  className?: string;
}

export default function Pulse({ size = 8, className = "" }: PulseProps) {
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--forest)",
        display: "inline-block",
        boxShadow: "0 0 0 0 var(--forest)",
        animation: "pulse-ring 2s infinite",
      }}
    />
  );
}
