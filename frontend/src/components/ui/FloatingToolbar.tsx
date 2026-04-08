import { Bold, Italic, Underline, Strikethrough, Link, Code, Palette, ChevronDown } from "lucide-react";

interface FloatingToolbarProps {
  position: { x: number; y: number } | null;
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onStrikethrough?: () => void;
  onLink?: () => void;
  onCode?: () => void;
  activeFormats?: string[];
}

function Separator() {
  return <div className="w-px h-4 bg-border-primary shrink-0" />;
}

function ToolButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-7 h-[26px] rounded flex items-center justify-center transition-colors ${
        active
          ? "bg-accent-soft text-accent"
          : "text-fg-secondary hover:bg-surface-tertiary"
      }`}
    >
      {children}
    </button>
  );
}

export default function FloatingToolbar({
  position,
  onBold,
  onItalic,
  onUnderline,
  onStrikethrough,
  onLink,
  onCode,
  activeFormats = [],
}: FloatingToolbarProps) {
  if (!position) return null;

  const isActive = (fmt: string) => activeFormats.includes(fmt);

  return (
    <div
      className="bg-surface-tertiary rounded-xl px-2 py-1.5 flex items-center gap-0.5 border border-border-primary shadow-lg z-50"
      style={{ position: "fixed", left: position.x, top: position.y }}
    >
      {/* Text formatting */}
      <ToolButton active={isActive("bold")} onClick={onBold} title="加粗">
        <Bold size={14} strokeWidth={2.5} />
      </ToolButton>
      <ToolButton active={isActive("italic")} onClick={onItalic} title="斜体">
        <Italic size={14} />
      </ToolButton>
      <ToolButton active={isActive("underline")} onClick={onUnderline} title="下划线">
        <Underline size={14} />
      </ToolButton>
      <ToolButton active={isActive("strikethrough")} onClick={onStrikethrough} title="删除线">
        <Strikethrough size={14} />
      </ToolButton>

      <Separator />

      {/* Link & Code */}
      <ToolButton active={isActive("link")} onClick={onLink} title="链接">
        <Link size={14} />
      </ToolButton>
      <ToolButton active={isActive("code")} onClick={onCode} title="代码">
        <Code size={14} />
      </ToolButton>

      <Separator />

      {/* Color */}
      <ToolButton title="颜色">
        <Palette size={14} />
      </ToolButton>

      <Separator />

      {/* Paragraph type dropdown */}
      <button
        type="button"
        className="h-[26px] rounded flex items-center gap-1 px-2 text-xs text-fg-secondary hover:bg-surface-tertiary transition-colors"
      >
        <span>段落</span>
        <ChevronDown size={12} />
      </button>
    </div>
  );
}
