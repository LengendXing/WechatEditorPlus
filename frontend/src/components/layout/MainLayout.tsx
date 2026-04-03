import { Outlet, Link, useNavigate } from "react-router-dom";
import { Settings, FileText } from "lucide-react";

export default function MainLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen">
      <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-surface-secondary shrink-0">
        <Link to="/" className="flex items-center gap-2 text-fg-primary font-semibold">
          <FileText size={18} />
          <span>WeChat Editor</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/settings")}
            className="p-2 rounded-lg hover:bg-surface-tertiary text-fg-secondary hover:text-fg-primary transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
