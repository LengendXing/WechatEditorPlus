import { useEffect, useRef } from "react";
import { Copy, Scissors, Clipboard, ArrowRight, Trash2 } from "lucide-react";
import { usePlatform } from "@/hooks/usePlatform";

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
}

function MenuItem({
  icon: Icon,
  label,
  shortcut,
  onClick,
  destructive,
}: {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-2.5 py-1.5 rounded flex items-center justify-between hover:bg-surface-tertiary transition-colors ${
        destructive ? "text-accent" : "text-fg-primary"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon size={13} />
        <span className="text-xs">{label}</span>
      </div>
      {shortcut && (
        <span className="text-[10px] text-fg-muted font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {shortcut}
        </span>
      )}
    </button>
  );
}

function MenuSeparator() {
  return <hr className="border-border-primary mx-2.5 my-1" />;
}

export default function ContextMenu({
  position,
  onClose,
  onCopy,
  onCut,
  onPaste,
  onDelete,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { mod } = usePlatform();

  useEffect(() => {
    if (!position) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [position, onClose]);

  if (!position) return null;

  const handle = (fn?: () => void) => () => {
    fn?.();
    onClose();
  };

  return (
    <div
      ref={ref}
      className="bg-surface-tertiary rounded-xl p-1.5 w-[220px] border border-border-primary shadow-lg z-50"
      style={{ position: "fixed", left: position.x, top: position.y }}
    >
      <MenuItem icon={Copy} label="复制" shortcut={`${mod}C`} onClick={handle(onCopy)} />
      <MenuItem icon={Scissors} label="剪切" shortcut={`${mod}X`} onClick={handle(onCut)} />
      <MenuItem icon={Clipboard} label="粘贴" shortcut={`${mod}V`} onClick={handle(onPaste)} />

      <MenuSeparator />

      <button
        type="button"
        className="w-full px-2.5 py-1.5 rounded flex items-center justify-between hover:bg-surface-tertiary transition-colors text-fg-primary"
      >
        <div className="flex items-center gap-2">
          <ArrowRight size={13} />
          <span className="text-xs">转换为</span>
        </div>
        <ArrowRight size={12} className="text-fg-muted" />
      </button>

      <MenuSeparator />

      <MenuItem icon={Trash2} label="删除" shortcut="Del" onClick={handle(onDelete)} destructive />
    </div>
  );
}
