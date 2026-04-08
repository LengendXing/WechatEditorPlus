import { useState, useEffect } from "react";
import { X, Check, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { toast, type ToastItem } from "@/stores/toastStore";

const typeConfig: Record<
  string,
  { border: string; iconBg: string; iconColor: string; icon: React.ElementType }
> = {
  success: {
    border: "border-l-success",
    iconBg: "bg-success-bg",
    iconColor: "text-success",
    icon: Check,
  },
  error: {
    border: "border-l-error",
    iconBg: "bg-[#EF444414]",
    iconColor: "text-error",
    icon: AlertCircle,
  },
  warning: {
    border: "border-l-warning",
    iconBg: "bg-warning-bg",
    iconColor: "text-warning",
    icon: AlertTriangle,
  },
  info: {
    border: "border-l-info",
    iconBg: "bg-info-bg",
    iconColor: "text-info",
    icon: Info,
  },
};

function ToastCard({ item }: { item: ToastItem }) {
  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <div
      className={`bg-surface-secondary rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg border border-border-primary border-l-[3px] ${config.border} animate-[slide-in-right_0.3s_ease-out]`}
      style={{ minWidth: 300, maxWidth: 420 }}
    >
      <div
        className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0`}
      >
        <Icon size={16} className={config.iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-fg-primary">
          {item.title}
        </div>
        {item.desc && (
          <div className="text-[11px] text-fg-muted mt-0.5">{item.desc}</div>
        )}
      </div>
      <button
        onClick={() => toast.dismiss(item.id)}
        className="p-1 rounded-md hover:bg-surface-tertiary text-fg-muted hover:text-fg-secondary transition-colors shrink-0 cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} />
      ))}
    </div>
  );
}
