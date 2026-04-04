import { NodeViewWrapper } from '@tiptap/react'
import { useState, useRef, useCallback, useEffect } from 'react'

export default function RawHtmlBlockView({ node, updateAttributes, deleteNode, selected }: any) {
  const html = node.attrs.content || ''
  const [editing, setEditing] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Always keep DOM content in sync with node attribute (only when not editing)
  useEffect(() => {
    if (contentRef.current && !editing) {
      contentRef.current.innerHTML = html
    }
  }, [html, editing])

  const enterEditMode = useCallback(() => {
    // Content is already in DOM via the useEffect above, just flip the flag
    setEditing(true)
    // Focus the editable area after React re-render
    setTimeout(() => contentRef.current?.focus(), 0)
  }, [])

  const exitEditMode = useCallback(() => {
    if (contentRef.current) {
      updateAttributes({ content: contentRef.current.innerHTML })
    }
    setEditing(false)
  }, [updateAttributes])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    enterEditMode()
  }, [enterEditMode])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (editing) {
      e.stopPropagation()
      if (e.key === 'Escape') {
        exitEditMode()
      }
    }
  }, [editing, exitEditMode])

  // Prevent blur from firing when clicking toolbar buttons
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Check if focus moved to a child element (toolbar button etc)
    const related = e.relatedTarget as Node | null
    if (related && contentRef.current?.parentElement?.contains(related)) {
      return
    }
    if (editing) {
      exitEditMode()
    }
  }, [editing, exitEditMode])

  return (
    <NodeViewWrapper
      className={`raw-html-block ${selected ? 'selected' : ''} ${editing ? 'editing' : ''}`}
      data-type="raw-html-block"
    >
      <div
        ref={contentRef}
        contentEditable={editing}
        suppressContentEditableWarning
        onDoubleClick={handleDoubleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          position: 'relative',
          cursor: editing ? 'text' : 'pointer',
          outline: editing ? '2px solid #A855F7' : 'none',
          outlineOffset: editing ? '2px' : '0',
          borderRadius: '4px',
          minHeight: '20px',
        }}
      />
      {selected && !editing && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            display: 'flex',
            gap: '4px',
            zIndex: 10,
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); enterEditMode() }}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              background: '#A855F7', color: '#fff', border: 'none',
              borderRadius: '4px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer',
            }}
          >
            编辑
          </button>
          <button
            onClick={deleteNode}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              background: '#ef4444', color: '#fff', border: 'none',
              borderRadius: '4px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer',
            }}
          >
            删除
          </button>
        </div>
      )}
      {editing && (
        <div
          style={{
            position: 'absolute', top: -28, right: 0,
            fontSize: '11px', color: '#A855F7',
            background: 'rgba(168,85,247,0.1)',
            padding: '2px 8px', borderRadius: '4px',
          }}
        >
          编辑中 · Esc 退出
        </div>
      )}
    </NodeViewWrapper>
  )
}
