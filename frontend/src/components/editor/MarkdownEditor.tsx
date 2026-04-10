import { forwardRef } from "react";
import MonacoEditor, { type MonacoEditorHandle } from "./MonacoEditor";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onPasteImage?: (file: File) => Promise<void> | void;
}

const MarkdownEditor = forwardRef<MonacoEditorHandle, MarkdownEditorProps>(
  function MarkdownEditor({ value, onChange, onPasteImage }, ref) {
    return <MonacoEditor ref={ref} value={value} onChange={onChange} onPasteImage={onPasteImage} language="markdown" />;
  },
);

export default MarkdownEditor;
