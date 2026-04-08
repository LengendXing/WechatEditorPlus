interface SectionLabelProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function SectionLabel({ children, actions }: SectionLabelProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] font-semibold tracking-[1.5px] uppercase text-fg-muted">
        {children}
      </span>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );
}
