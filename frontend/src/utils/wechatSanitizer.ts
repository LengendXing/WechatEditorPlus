/**
 * 微信粘贴清洗模拟器
 *
 * 目的：在 HTML 送入预览 iframe 之前，模拟微信公众号编辑器
 * 对粘贴内容的清洗行为，让预览接近真实粘贴后的效果。
 *
 * 规则基于业界观察的保守集合（宁可多删）：
 * - 删除 <script> / <style> / <link> / <meta> 元素
 * - 删除 class、id 属性（微信只支持 inline style）
 * - 删除会被吞掉或替换的 CSS 属性：
 *     position: fixed|absolute|sticky
 *     display: flex|grid|inline-flex|inline-grid
 *     transform / z-index / filter / animation
 * - 外层根 <section> 的 background / background-image 被吞（保留 background-color）
 *
 * 该函数为纯函数，仅用于"显示方向"（html → iframe），不应回写 Monaco 源。
 */

/** 会被强制删除的 CSS 属性名（无视值） */
export const REMOVED_CSS_PROPERTIES: string[] = [
  "transform",
  "z-index",
  "filter",
  "animation",
  "-webkit-transform",
  "-webkit-filter",
  "-webkit-animation",
];

/** 会被有条件删除的 CSS 属性（取决于 value） */
const CONDITIONAL_REMOVED: Record<string, (value: string) => boolean> = {
  position: (v) => /^(fixed|absolute|sticky)$/i.test(v.trim()),
  display: (v) => /^(flex|grid|inline-flex|inline-grid)$/i.test(v.trim()),
};

/** 外层 section 背景相关属性（除 background-color 外均删） */
const OUTER_BACKGROUND_PROPS = [
  "background",
  "background-image",
  "background-repeat",
  "background-position",
  "background-size",
  "background-attachment",
  "background-origin",
  "background-clip",
];

/** 要整个移除的元素标签 */
const REMOVED_TAGS = new Set(["SCRIPT", "STYLE", "LINK", "META"]);

/** 清洗单个 style 字符串 */
function sanitizeStyle(style: string, isOuterSection: boolean): string {
  const kept: string[] = [];
  const parts = style.split(";");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;

    const prop = trimmed.slice(0, colon).trim().toLowerCase();
    const value = trimmed.slice(colon + 1).trim();
    if (!prop || !value) continue;

    // 硬删
    if (REMOVED_CSS_PROPERTIES.includes(prop)) continue;

    // 条件删
    const cond = CONDITIONAL_REMOVED[prop];
    if (cond && cond(value)) continue;

    // 外层 section 的 background（除 background-color 外）
    if (isOuterSection && OUTER_BACKGROUND_PROPS.includes(prop)) continue;

    kept.push(`${prop}:${value}`);
  }

  return kept.join(";");
}

/**
 * 判断元素是否为"外层包装容器"。
 * 真正被微信吞掉 background 的不一定是 body 的直接子 section ——
 * 135/秀米这类模板常见双层包装：body > div > section > content
 * 规则：从 body 往下，只要当前元素是 section/div 且其祖先链上只包含
 * section/div（不含有真正的文字内容节点），就视为"外层包装"。
 */
function isOuterWrapper(el: Element, body: HTMLElement): boolean {
  if (el.tagName !== "SECTION" && el.tagName !== "DIV") return false;
  // 向上遍历，确认所有祖先（到 body）都是 div/section
  let cur: Element | null = el.parentElement;
  while (cur && cur !== body) {
    if (cur.tagName !== "DIV" && cur.tagName !== "SECTION") return false;
    cur = cur.parentElement;
  }
  if (cur !== body) return false;
  // 检查当前元素是否为"纯容器"（直接子节点里没有非空文本）
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 3 /* TEXT_NODE */) {
      const txt = (node.textContent || "").trim();
      if (txt.length > 0) return false;
    }
  }
  return true;
}

function walk(el: Element, body: HTMLElement, toRemove: Element[]): void {
  if (REMOVED_TAGS.has(el.tagName)) {
    toRemove.push(el);
    return;
  }

  // 删除 class / id
  if (el.hasAttribute("class")) el.removeAttribute("class");
  if (el.hasAttribute("id")) el.removeAttribute("id");

  // 清洗 style
  const styleAttr = el.getAttribute("style");
  if (styleAttr !== null) {
    const outer = isOuterWrapper(el, body);
    const cleaned = sanitizeStyle(styleAttr, outer);
    if (cleaned.length === 0) {
      el.removeAttribute("style");
    } else {
      el.setAttribute("style", cleaned);
    }
  }

  // 递归
  const children = Array.from(el.children);
  for (const child of children) {
    walk(child, body, toRemove);
  }
}

/**
 * 对 HTML 做微信粘贴清洗模拟。
 * 纯函数，返回清洗后的新字符串；输入无效或 DOMParser 不可用时原样返回。
 */
export function sanitizeForWechatPreview(html: string): string {
  if (!html) return "";
  if (typeof DOMParser === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;
  if (!body) return html;

  const toRemove: Element[] = [];
  const topLevel = Array.from(body.children);
  for (const el of topLevel) {
    walk(el, body, toRemove);
  }

  for (const el of toRemove) {
    el.parentNode?.removeChild(el);
  }

  return body.innerHTML;
}
