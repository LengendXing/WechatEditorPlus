import { useMemo } from "react";

export function usePlatform() {
  return useMemo(() => {
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      || navigator.userAgent.includes("Mac");
    return {
      isMac,
      mod: isMac ? "\u2318" : "Ctrl+",
      modKey: isMac ? "metaKey" : "ctrlKey",
    };
  }, []);
}
