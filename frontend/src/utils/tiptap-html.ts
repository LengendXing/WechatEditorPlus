import type { Editor } from '@tiptap/react'

/**
 * Get clean article HTML from the TipTap editor.
 * Replaces <div data-type="raw-html-block" data-raw-content="..."> wrappers
 * with their actual HTML content so the output is ready for WeChat publishing.
 */
export function getArticleHTML(editor: Editor): string {
  const html = editor.getHTML()
  const doc = new DOMParser().parseFromString(html, 'text/html')

  doc.querySelectorAll('[data-type="raw-html-block"]').forEach((el) => {
    const rawContent = el.getAttribute('data-raw-content')
    if (rawContent) {
      const wrapper = document.createElement('div')
      wrapper.innerHTML = rawContent
      el.replaceWith(...Array.from(wrapper.childNodes))
    }
  })

  return doc.body.innerHTML
}

/**
 * Check if an element is "complex" — has inline style + nested block children,
 * or contains interactive elements (SVG templates).
 */
function isComplexBlock(el: Element): boolean {
  const isInteractive =
    el.querySelector('style') ||
    el.querySelector('input[type="checkbox"]') ||
    el.querySelector('input[type="radio"]')
  if (isInteractive) return true

  const hasInlineStyle = el.hasAttribute('style')
  const hasNestedBlocks = el.querySelector(
    'section, div, h1, h2, h3, h4, h5, h6, blockquote, table, pre, ul, ol'
  )
  return !!(hasInlineStyle && hasNestedBlocks)
}

/**
 * Prepare HTML for loading into TipTap editor.
 *
 * Strategy: wrap the entire HTML as a single RawHtmlBlock so it renders
 * as one seamless article. The block is always contentEditable so users
 * can click anywhere to edit text without visual deformation.
 *
 * Only SVG interactive blocks (with <style>/<input>) are wrapped separately
 * so they are protected as atomic nodes.
 */
export function prepareHTMLForEditor(html: string): string {
  if (!html.trim()) return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const bodyHtml = doc.body.innerHTML.trim()
  if (!bodyHtml) return html

  // Check if there are interactive SVG blocks mixed with regular content
  const topElements = Array.from(doc.body.children)
  const hasInteractive = topElements.some((el) =>
    el.querySelector('style') ||
    el.querySelector('input[type="checkbox"]') ||
    el.querySelector('input[type="radio"]')
  )

  if (hasInteractive) {
    // Split: interactive blocks become separate atoms, rest stays as one block
    const result: string[] = []
    let normalBuffer: string[] = []

    const flushNormal = () => {
      if (normalBuffer.length > 0) {
        const combined = normalBuffer.join('')
        const wrapper = doc.createElement('div')
        wrapper.setAttribute('data-type', 'raw-html-block')
        wrapper.setAttribute('data-raw-content', combined)
        result.push(wrapper.outerHTML)
        normalBuffer = []
      }
    }

    for (const el of topElements) {
      const isInteractive = el.querySelector('style') ||
        el.querySelector('input[type="checkbox"]') ||
        el.querySelector('input[type="radio"]')
      if (isInteractive) {
        flushNormal()
        const wrapper = doc.createElement('div')
        wrapper.setAttribute('data-type', 'raw-html-block')
        wrapper.setAttribute('data-raw-content', el.outerHTML)
        result.push(wrapper.outerHTML)
      } else {
        normalBuffer.push(el.outerHTML)
      }
    }
    flushNormal()
    return result.join('\n')
  }

  // No interactive blocks — wrap everything as one seamless block
  const wrapper = doc.createElement('div')
  wrapper.setAttribute('data-type', 'raw-html-block')
  wrapper.setAttribute('data-raw-content', bodyHtml)
  return wrapper.outerHTML
}
