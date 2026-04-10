/**
 * 字数统计工具。
 * 统计规则：中文字符数 + 英文单词数，不含 HTML 标签。
 */

export const WORD_COUNT_TOOLTIP = "中文字符 + 英文单词，不含 HTML 标签";

function extractPlainText(html: string): string {
  if (typeof DOMParser === "undefined") {
    return html.replace(/<[^>]*>/g, " ");
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body?.textContent || "";
}

export function getWordCount(text: string, mode: "html" | "markdown"): number {
  if (!text) return 0;

  const plain = mode === "html" ? extractPlainText(text) : text;

  const chineseMatches = plain.match(/[\u4e00-\u9fff]/g);
  const chineseCount = chineseMatches ? chineseMatches.length : 0;

  const withoutChinese = plain.replace(/[\u4e00-\u9fff]/g, " ");
  const englishMatches = withoutChinese.match(/[a-zA-Z]+/g);
  const englishCount = englishMatches ? englishMatches.length : 0;

  return chineseCount + englishCount;
}
