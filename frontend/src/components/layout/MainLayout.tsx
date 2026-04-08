import { Outlet } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import Toast from "@/components/ui/Toast";

export default function MainLayout() {
  useTheme();

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-fg-primary">
      <Outlet />
      <Toast />
    </div>
  );
}
