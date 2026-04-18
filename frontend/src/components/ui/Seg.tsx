import type { ReactNode } from "react";

interface SegOption {
  value: string;
  label: ReactNode;
}

interface SegProps {
  options: SegOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function Seg({ options, value, onChange }: SegProps) {
  return (
    <div className="seg">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={value === opt.value ? "active" : ""}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
