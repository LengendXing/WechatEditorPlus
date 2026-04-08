type BadgeVariant = "accent" | "success" | "info" | "warning" | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  accent: "bg-accent-bg text-accent",
  success: "bg-success-bg text-success",
  info: "bg-info-bg text-info",
  warning: "bg-warning-bg text-warning",
  muted: "bg-surface-tertiary text-fg-muted",
};

export default function Badge({ variant = "muted", icon, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${variantClasses[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
