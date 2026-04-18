import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "walnut" | "paper" | "swiss";
export type Accent = "default" | "mono";
export type Density = "compact" | "comfy" | "spacious";
export type Layout = "focus" | "split" | "triptych";
export type AgentPosition = "right" | "bottom";

interface UIState {
  theme: Theme;
  accent: Accent;
  density: Density;
  layout: Layout;
  agentPosition: AgentPosition;
  tweaksOpen: boolean;
  setTheme: (t: Theme) => void;
  setAccent: (a: Accent) => void;
  setDensity: (d: Density) => void;
  setLayout: (l: Layout) => void;
  setAgentPosition: (p: AgentPosition) => void;
  setTweaksOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "walnut",
      accent: "default",
      density: "comfy",
      layout: "triptych",
      agentPosition: "right",
      tweaksOpen: false,
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setDensity: (density) => set({ density }),
      setLayout: (layout) => set({ layout }),
      setAgentPosition: (agentPosition) => set({ agentPosition }),
      setTweaksOpen: (tweaksOpen) => set({ tweaksOpen }),
    }),
    {
      name: "mbeditor.ui",
      partialize: (state) => ({
        theme: state.theme,
        accent: state.accent,
        density: state.density,
        layout: state.layout,
        agentPosition: state.agentPosition,
      }),
    }
  )
);
