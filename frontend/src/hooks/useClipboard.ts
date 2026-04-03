import { processForWechat } from "@/utils/inliner";

export function useClipboard() {
  const copyRichText = async (html: string, css: string): Promise<boolean> => {
    const processed = processForWechat(html, css);

    try {
      const blob = new Blob([processed], { type: "text/html" });
      const plainBlob = new Blob([processed], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
          "text/plain": plainBlob,
        }),
      ]);
      return true;
    } catch {
      const container = document.createElement("div");
      container.innerHTML = processed;
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
  };

  return { copyRichText };
}
