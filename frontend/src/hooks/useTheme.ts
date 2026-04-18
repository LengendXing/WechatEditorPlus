import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";

export function useTheme() {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const html = document.documentElement;
    // Remove all theme attrs, then set current
    html.removeAttribute("data-theme");
    if (theme === "paper") {
      html.setAttribute("data-theme", "paper");
    } else if (theme === "swiss") {
      html.setAttribute("data-theme", "swiss");
    }
    // walnut is the default (no attribute needed, uses :root)
  }, [theme]);
}
