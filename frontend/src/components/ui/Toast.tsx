import { useEffect, useState } from "react";
import { IconClose } from "@/components/icons";
import { useToastStore } from "@/stores/toastStore";
import type { ToastType } from "@/types";

const TONE_COLORS: Record<ToastType, string> = {
  success: "var(--forest)",
  error: "var(--accent)",
  warning: "var(--warn)",
  info: "var(--info)",
};

function ToastItem({
  id,
  type,
  message,
  onRemove,
}: {
  id: string;
  type: ToastType;
  message: string;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in on next frame
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-sm)",
        overflow: "hidden",
        minWidth: 260,
        maxWidth: 380,
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        transform: visible ? "translateX(0)" : "translateX(120%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s ease, opacity 0.3s ease",
      }}
    >
      {/* Color bar */}
      <div
        style={{
          width: 4,
          flexShrink: 0,
          background: TONE_COLORS[type],
        }}
      />

      {/* Message */}
      <div
        style={{
          flex: 1,
          padding: "10px 12px",
          fontFamily: "var(--f-mono)",
          fontSize: 12,
          color: "var(--fg)",
          lineHeight: 1.4,
        }}
      >
        {message}
      </div>

      {/* Close */}
      <button
        onClick={() => onRemove(id)}
        style={{
          all: "unset",
          display: "grid",
          placeItems: "center",
          width: 32,
          cursor: "pointer",
          color: "var(--fg-4)",
          flexShrink: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--fg-2)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--fg-4)";
        }}
      >
        <IconClose size={10} />
      </button>
    </div>
  );
}

export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <ToastItem
            id={t.id}
            type={t.type}
            message={t.message}
            onRemove={removeToast}
          />
        </div>
      ))}
    </div>
  );
}
