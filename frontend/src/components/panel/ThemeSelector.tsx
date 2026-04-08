import { getThemeNames } from "@/utils/markdown";

interface ThemeSelectorProps {
  value: string;
  onChange: (theme: string) => void;
}

export default function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const themes = getThemeNames();

  return (
    <div>
      <div className="space-y-1">
        {themes.map((t) => (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
              value === t ? "bg-accent text-white" : "text-fg-secondary hover:bg-surface-tertiary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
