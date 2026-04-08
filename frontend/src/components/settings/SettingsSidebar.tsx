import { Key, Palette, SlidersHorizontal, Keyboard, Info } from "lucide-react";

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: "wechat", icon: Key, label: "微信公众号" },
  { id: "appearance", icon: Palette, label: "外观主题" },
  { id: "editor", icon: SlidersHorizontal, label: "编辑器偏好" },
  { id: "shortcuts", icon: Keyboard, label: "快捷键" },
  { id: "about", icon: Info, label: "关于" },
] as const;

export default function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <div className="w-[240px] h-full bg-surface-secondary border-r border-border-primary pt-6 flex-shrink-0">
      <nav className="flex flex-col gap-[2px]">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={`w-full flex items-center gap-2.5 py-2.5 px-5 text-[13px] transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#E8553A1A] text-accent font-medium"
                  : "text-fg-secondary hover:bg-surface-tertiary"
              }`}
            >
              <Icon
                size={16}
                className={isActive ? "text-accent" : "text-fg-muted"}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
