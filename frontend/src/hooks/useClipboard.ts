import { processForWechat } from "@/utils/inliner";

/** Write a rich-text HTML blob to the clipboard, with execCommand fallback. */
export async function writeHtmlToClipboard(html: string): Promise<boolean> {
  try {
    const blob = new Blob([html], { type: "text/html" });
    const plainBlob = new Blob([html], { type: "text/plain" });
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": blob,
        "text/plain": plainBlob,
      }),
    ]);
    return true;
  } catch {
    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.setAttribute("contenteditable", "true");
    document.body.appendChild(container);

    const range = document.createRange();
    range.selectNodeContents(container);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const ok = document.execCommand("copy");
    document.body.removeChild(container);
    return ok;
  }
}

export function useClipboard() {
  const copyRichText = async (html: string, css: string): Promise<boolean> => {
    const processed = processForWechat(html, css);
    return writeHtmlToClipboard(processed);
  };

  return { copyRichText };
}
