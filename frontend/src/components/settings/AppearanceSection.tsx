import { useState } from "react";

interface AppearanceSectionProps {
  theme: "dark" | "light" | "system";
  onThemeChange: (theme: "dark" | "light" | "system") => void;
}

const themeOptions: { value: "light" | "dark" | "system"; label: string }[] = [
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
  { value: "system", label: "跟随系统" },
];

const accentColors = [
  "#E8553A",
  "#6B7FBF",
  "#3A9E7E",
  "#C9923E",
  "#8B5CF6",
  "#EC4899",
];

export default function AppearanceSection({ theme, onThemeChange }: AppearanceSectionProps) {
  const [selectedColor, setSelectedColor] = useState("#E8553A");

  return (
    <div className="flex flex-col gap-6">
      {/* Title block */}
      <div className="flex flex-col gap-1">
        <h2 className="text-[18px] font-bold text-fg-primary">外观与主题</h2>
        <p className="text-[13px] text-fg-muted">自定义编辑器的外观风格</p>
      </div>

      {/* Card */}
      <div className="bg-surface-secondary rounded-xl border border-border-primary p-6 flex flex-col gap-5">
        {/* Theme mode row */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-fg-secondary">主题模式</span>
          <div className="flex bg-surface-tertiary border border-border-secondary rounded-lg p-[3px]">
            {themeOptions.map(({ value, label }) => {
              const isActive = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => onThemeChange(value)}
                  className={`px-3 py-1 text-[12px] transition-colors cursor-pointer ${
                    isActive
                      ? "bg-accent text-white rounded-md font-medium"
                      : "text-fg-muted hover:text-fg-secondary"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border-primary" />

        {/* Accent color row */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-fg-secondary">强调色</span>
          <div className="flex items-center gap-2.5">
            {accentColors.map((color) => {
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-shadow ${
                    isSelected
                      ? "ring-2 ring-offset-2 ring-offset-surface-secondary"
                      : "hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: color,
                    ...(isSelected ? { boxShadow: `0 0 0 2px var(--color-surface-secondary), 0 0 0 4px ${color}` } : {}),
                  }}
                  title={color}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
