/**
 * HTML 语义归一化工具。
 * 用于比较两段 HTML 在语义上是否等价（忽略样式声明顺序、多余空白、
 * preview 注入的 contenteditable 属性与 resize 脚本等差异）。
 */

export interface NormalizedHtml {
  serialized: string;
  semanticKey: string;
}

function normalizeStyle(style: string): string {
  const declarations = style
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => decl.length > 0)
    .map((decl) => {
      const colonIdx = decl.indexOf(":");
      if (colonIdx === -1) return [decl.trim(), ""] as [string, string];
      const prop = decl.slice(0, colonIdx).trim();
      const value = decl.slice(colonIdx + 1).trim();
      return [prop, value] as [string, string];
    })
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

  return declarations.map(([prop, value]) => `${prop}:${value}`).join(";");
}

function walkAndNormalize(root: Element): void {
  const toRemove: Element[] = [];
  const walker = (el: Element) => {
    if (el.tagName === "SCRIPT") {
      toRemove.push(el);
      return;
    }
    if (el.hasAttribute("contenteditable")) {
      el.removeAttribute("contenteditable");
    }
    const styleAttr = el.getAttribute("style");
    if (styleAttr !== null) {
      const normalized = normalizeStyle(styleAttr);
      if (normalized.length === 0) {
        el.removeAttribute("style");
      } else {
        el.setAttribute("style", normalized);
      }
    }
    for (let i = 0; i < el.children.length; i++) {
      walker(el.children[i]);
    }
  };

  for (let i = 0; i < root.children.length; i++) {
    walker(root.children[i]);
  }

  for (const el of toRemove) {
    el.parentNode?.removeChild(el);
  }
}

export function normalizeEditableHtml(html: string): NormalizedHtml {
  if (!html) {
    return { serialized: "", semanticKey: "" };
  }

  if (typeof DOMParser === "undefined") {
    return { serialized: html, semanticKey: html.replace(/\s+/g, "") };
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  if (!body) {
    return { serialized: html, semanticKey: html.replace(/\s+/g, "") };
  }

  walkAndNormalize(body);

  const serialized = body.innerHTML;
  const semanticKey = serialized.replace(/\s+/g, "");
  return { serialized, semanticKey };
}

export function isSemanticallyEqual(a: string, b: string): boolean {
  return normalizeEditableHtml(a).semanticKey === normalizeEditableHtml(b).semanticKey;
}
