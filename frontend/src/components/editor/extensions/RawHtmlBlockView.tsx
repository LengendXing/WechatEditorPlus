import { NodeViewWrapper } from '@tiptap/react'
import { useRef, useCallback, useEffect } from 'react'

export default function RawHtmlBlockView({ node, updateAttributes, deleteNode, selected }: any) {
  const html = node.attrs.content || ''
  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Set DOM content on mount and when external html changes
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== html) {
      contentRef.current.innerHTML = html
    }
  }, [html])

  // Debounced save: sync edits back to node attribute
  const handleInput = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (contentRef.current) {
        updateAttributes({ content: contentRef.current.innerHTML })
      }
    }, 1000)
  }, [updateAttributes])

  // Prevent TipTap from intercepting keyboard events inside the block
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation()
  }, [])

  // Prevent TipTap from handling paste — let browser handle it natively
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.stopPropagation()
  }, [])

  return (
    <NodeViewWrapper
      className="raw-html-block"
      data-type="raw-html-block"
    >
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        style={{ outline: 'none', minHeight: '20px' }}
      />
      {/* Floating delete button — only when the TipTap node itself is selected */}
      {selected && (
        <button
          onClick={deleteNode}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            zIndex: 10,
            opacity: 0.8,
          }}
        >
          删除块
        </button>
      )}
    </NodeViewWrapper>
  )
}
