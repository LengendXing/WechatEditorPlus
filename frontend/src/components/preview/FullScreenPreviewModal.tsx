import { useEffect } from "react";
import { X } from "lucide-react";
import WechatPreview from "./WechatPreview";

interface FullScreenPreviewModalProps {
  open: boolean;
  onClose: () => void;
  html: string;
  css: string;
  js?: string;
}

export default function FullScreenPreviewModal({
  open,
  onClose,
  html,
  css,
  js,
}: FullScreenPreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-bg-primary flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="全屏预览"
    >
      <div className="h-12 border-b border-border-primary flex items-center justify-between px-4 shrink-0">
        <span className="text-sm text-fg-secondary font-medium">预览</span>
        <button
          onClick={onClose}
          aria-label="关闭预览"
          title="关闭预览 (Esc)"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-fg-muted hover:text-fg-primary hover:bg-surface-hover transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto flex justify-center p-8">
        <WechatPreview html={html} css={css} js={js} mode="wechat" />
      </div>
    </div>
  );
}
