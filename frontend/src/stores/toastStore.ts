type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  desc?: string;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l([...toasts]));

function addToast(type: ToastType, title: string, desc?: string) {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, type, title, desc }];
  notify();
  setTimeout(() => toast.dismiss(id), 4000);
}

export const toast = {
  success: (title: string, desc?: string) => addToast("success", title, desc),
  error: (title: string, desc?: string) => addToast("error", title, desc),
  warning: (title: string, desc?: string) => addToast("warning", title, desc),
  info: (title: string, desc?: string) => addToast("info", title, desc),
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
};

export type { ToastItem, ToastType };
