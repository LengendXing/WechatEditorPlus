import Editor, { type OnMount } from "@monaco-editor/react";
import { useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import type * as monaco from "monaco-editor";

export interface MonacoEditorHandle {
  insertAtCursor: (text: string) => void;
}

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string;
  onPasteImage?: (file: File) => Promise<void> | void;
}

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  function MonacoEditor(
    { value, onChange, language, height = "100%", onPasteImage },
    ref,
  ) {
    const { resolvedTheme } = useTheme();
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const onPasteImageRef = useRef(onPasteImage);

    useEffect(() => {
      onPasteImageRef.current = onPasteImage;
    }, [onPasteImage]);

    const handleMount: OnMount = (editor) => {
      editorRef.current = editor;
      const domNode = editor.getDomNode();
      if (!domNode) return;

      const handler = (e: ClipboardEvent) => {
        const cb = onPasteImageRef.current;
        if (!cb) return;
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              e.stopPropagation();
              cb(file);
              return;
            }
          }
        }
      };
      domNode.addEventListener("paste", handler, true);
      editor.onDidDispose(() => {
        domNode.removeEventListener("paste", handler, true);
      });
    };

    useImperativeHandle(ref, () => ({
      insertAtCursor(text: string) {
        const editor = editorRef.current;
        if (!editor) return;
        const position = editor.getPosition();
        if (!position) return;
        const range = new (window as any).monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column,
        );
        editor.executeEdits("insert", [{ range, text, forceMoveMarkers: true }]);
        editor.focus();
      },
    }));

    return (
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleMount}
        theme={resolvedTheme === "light" ? "light" : "vs-dark"}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          lineNumbers: "on",
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 12 },
        }}
      />
    );
  },
);

export default MonacoEditor;
