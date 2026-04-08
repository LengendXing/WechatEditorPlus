import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  width?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showClose?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  width = 480,
  children,
  footer,
  showClose = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

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
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay animate-[fade-in_150ms_ease-out]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="bg-surface-secondary rounded-[16px] border border-border-primary shadow-[0_8px_40px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh] animate-[scale-in_200ms_ease-out]"
        style={{ width }}
      >
        {/* Header */}
        {(title || showClose) && (
          <>
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div>
                {title && (
                  <h2 className="text-[16px] font-semibold text-fg-primary">{title}</h2>
                )}
                {subtitle && (
                  <p className="text-[12px] text-fg-muted mt-1">{subtitle}</p>
                )}
              </div>
              {showClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-md text-fg-muted hover:text-fg-primary hover:bg-surface-tertiary transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="h-px bg-border-primary" />
          </>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <>
            <div className="h-px bg-border-primary" />
            <div className="px-6 py-4">
              {footer}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
