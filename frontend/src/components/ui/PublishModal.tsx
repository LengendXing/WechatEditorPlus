import { useState, useEffect } from "react";
import { Eye, EyeOff, ExternalLink } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import api from "@/lib/api";
import { toast } from "@/stores/toastStore";
import type { Article } from "@/types";

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  article: Article;
}

type ConnectionStatus = "disconnected" | "connected" | "failed";

export default function PublishModal({
  open,
  onClose,
  article,
}: PublishModalProps) {
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [configured, setConfigured] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [testing, setTesting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Article form fields (State B)
  const [title, setTitle] = useState("");
  const [digest, setDigest] = useState("");
  const [author, setAuthor] = useState("");

  // Load config on open
  useEffect(() => {
    if (!open) return;
    setTitle(article.title || "");
    setDigest(article.digest || "");
    setAuthor(article.author || "");

    api
      .get("/config")
      .then((res) => {
        if (res.data.code === 0) {
          const cfg = res.data.data;
          if (cfg.appid) {
            setAppId(cfg.appid);
            setAppSecret(cfg.appsecret || "");
            setConfigured(true);
            setConnectionStatus("connected");
            setAccountName(cfg.account_name || "已配置公众号");
          } else {
            setConfigured(false);
            setConnectionStatus("disconnected");
          }
        }
      })
      .catch(() => {
        setConfigured(false);
        setConnectionStatus("disconnected");
      });
  }, [open, article]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      await api.put("/config", { appid: appId, appsecret: appSecret });
      const res = await api.get("/config");
      if (res.data.code === 0 && res.data.data.appid) {
        setConnectionStatus("connected");
        setAccountName(res.data.data.account_name || "已配置公众号");
        toast.success("连接成功", "微信公众号配置有效");
      } else {
        setConnectionStatus("failed");
        toast.error("连接失败", "请检查 AppID 和 AppSecret");
      }
    } catch {
      setConnectionStatus("failed");
      toast.error("连接失败", "无法连接到微信服务器");
    }
    setTesting(false);
  };

  const handleSaveAndPublish = async () => {
    setPublishing(true);
    try {
      // Save config first if not configured yet
      if (!configured) {
        await api.put("/config", { appid: appId, appsecret: appSecret });
      }
      // Save article metadata
      await api.put(`/articles/${article.id}`, {
        html: article.html,
        css: article.css,
        js: article.js || "",
        markdown: article.markdown,
        title,
        digest,
        author,
        mode: article.mode,
      });
      // Publish to draft
      const res = await api.post("/publish/draft", {
        article_id: article.id,
      });
      if (res.data.code === 0) {
        toast.success("发布成功", "文章已推送到微信草稿箱");
        onClose();
      } else {
        toast.error("发布失败", res.data.message);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error("发布失败", err.response?.data?.message || "推送失败");
    }
    setPublishing(false);
  };

  const handleSaveDraft = async () => {
    try {
      await api.put(`/articles/${article.id}`, {
        html: article.html,
        css: article.css,
        js: article.js || "",
        markdown: article.markdown,
        title,
        digest,
        author,
        mode: article.mode,
      });
      toast.success("已保存", "文章已保存为草稿");
      onClose();
    } catch {
      toast.error("保存失败", "无法保存文章");
    }
  };

  const statusDot =
    connectionStatus === "connected"
      ? "bg-success"
      : connectionStatus === "failed"
        ? "bg-error"
        : "bg-fg-muted";
  const statusText =
    connectionStatus === "connected"
      ? "已连接"
      : connectionStatus === "failed"
        ? "连接失败"
        : "未连接";
  const statusColor =
    connectionStatus === "connected"
      ? "text-success"
      : connectionStatus === "failed"
        ? "text-error"
        : "text-fg-muted";

  const footer = (
    <div className="flex items-center justify-between">
      <div>
        {!configured && (
          <a
            href="https://mp.weixin.qq.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-fg-muted hover:text-accent transition-colors flex items-center gap-1"
          >
            如何获取 AppID？
            <ExternalLink size={11} />
          </a>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          取消
        </Button>
        {!configured ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestConnection}
              disabled={!appId || !appSecret || testing}
              loading={testing}
            >
              {testing ? "测试中..." : "测试连接"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAndPublish}
              disabled={
                !appId ||
                !appSecret ||
                connectionStatus !== "connected" ||
                publishing
              }
              loading={publishing}
            >
              {publishing ? "发布中..." : "保存并发布"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={handleSaveDraft}>
              存为草稿
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAndPublish}
              disabled={publishing}
              loading={publishing}
            >
              {publishing ? "发布中..." : "发布到草稿箱"}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="发布到微信公众号"
      subtitle={configured ? "确认文章信息后发布到草稿箱" : "请先配置公众号凭证"}
      width={480}
      footer={footer}
    >
      <div className="px-6 py-5 space-y-4">
        {!configured ? (
          <>
            {/* State A: Not configured */}
            {/* Warning banner */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-warning-bg rounded-[10px] border border-warning-border">
              <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
              <span className="text-[13px] text-warning">尚未配置公众号</span>
            </div>

            {/* AppID */}
            <Input
              label="AppID *"
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="wx1234567890abcdef"
              className="font-mono"
            />

            {/* AppSecret */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-fg-secondary">
                AppSecret *
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="输入 AppSecret"
                  className="w-full bg-surface-tertiary border border-border-secondary rounded-[8px] px-3.5 py-2.5 pr-9 text-[13px] font-mono text-fg-primary placeholder:text-fg-muted outline-none transition-colors duration-150 focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-fg-muted hover:text-fg-secondary transition-colors cursor-pointer"
                >
                  {showSecret ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusDot}`} />
              <span className={`text-[12px] ${statusColor}`}>
                {statusText}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* State B: Configured */}
            {/* Connected banner */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-success-bg rounded-[10px] border border-success-border">
              <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
              <span className="text-[13px] text-success">
                已连接：{accountName}
              </span>
            </div>

            {/* Article preview card */}
            <div className="flex items-start gap-3 p-3 bg-surface-tertiary rounded-[10px] border border-border-secondary">
              {article.cover ? (
                <img
                  src={article.cover}
                  alt="cover"
                  className="w-16 h-16 rounded-[8px] object-cover shrink-0 bg-surface-tertiary"
                />
              ) : (
                <div className="w-16 h-16 rounded-[8px] bg-bg-primary shrink-0 flex items-center justify-center">
                  <span className="text-[12px] text-fg-muted">封面</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-fg-primary truncate">
                  {article.title || "无标题"}
                </div>
                <div className="text-[12px] text-fg-muted mt-1">
                  {article.mode === "markdown" ? "Markdown" : "HTML"} /{" "}
                  {new Date(article.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <Input
                label="文章标题"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-fg-secondary">
                  摘要
                </label>
                <textarea
                  value={digest}
                  onChange={(e) => setDigest(e.target.value)}
                  rows={2}
                  className="w-full bg-surface-tertiary border border-border-secondary rounded-[8px] px-3.5 py-2.5 text-[13px] text-fg-primary placeholder:text-fg-muted outline-none transition-colors duration-150 focus:border-accent resize-none"
                />
              </div>
              <Input
                label="作者"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
