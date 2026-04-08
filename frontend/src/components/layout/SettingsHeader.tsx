import { Link } from "react-router-dom";

export default function SettingsHeader() {
  return (
    <header className="h-14 bg-surface-secondary border-b border-border-primary px-6 flex items-center justify-between shrink-0">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-5">
        <Link
          to="/"
          className="text-fg-primary font-bold text-[18px] tracking-tight"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          MBEditor
        </Link>

        <nav className="flex items-center gap-5">
          <Link
            to="/"
            className="text-sm text-fg-muted hover:text-fg-secondary transition-colors"
          >
            全部文章
          </Link>
          <span className="text-sm text-fg-primary font-medium">设置</span>
        </nav>
      </div>

      {/* Right: Reserved for future actions */}
      <div className="flex items-center gap-2.5" />
    </header>
  );
}
