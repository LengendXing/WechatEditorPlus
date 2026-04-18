import { useState } from "react";
import type { Route } from "@/types";
import StructurePanel from "./StructurePanel";
import CenterStage from "./CenterStage";

interface EditorSurfaceProps {
  articleId?: string;
  go: (route: Route, params?: Record<string, string>) => void;
}

export default function EditorSurface({ articleId, go }: EditorSurfaceProps) {
  const [selected, setSelected] = useState("b1");
  const [mode, setMode] = useState("html");
  const [view, setView] = useState("split");
  const [tab, setTab] = useState("html");
  const [saved, setSaved] = useState(true);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        height: "100%",
        minHeight: 0,
      }}
    >
      <StructurePanel
        selected={selected}
        setSelected={setSelected}
        mode={mode}
        setMode={setMode}
      />

      <CenterStage
        view={view}
        setView={setView}
        tab={tab}
        setTab={setTab}
        mode={mode}
        saved={saved}
        setSaved={setSaved}
        selected={selected}
      />
    </div>
  );
}
