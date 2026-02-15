import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

function ViewPage() {
  const { uniqueId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState("");
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [remainingViews, setRemainingViews] = useState(null);
  const [viewLimitLabel, setViewLimitLabel] = useState("");

  const fetchContent = async (overridePassword = "") => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_URL}/content/${uniqueId}`, {
        headers: overridePassword
          ? { "x-vault-password": overridePassword }
          : password
          ? { "x-vault-password": password }
          : undefined,
      });
      setContent(response.data);
      setRequiresPassword(Boolean(response.data.requiresPassword));
      if (response.data.oneTimeView) {
        setRemainingViews(1);
        setViewLimitLabel("One-time view");
      } else if (response.data.maxViews) {
        const remaining = Math.max(
          0,
          response.data.maxViews - (response.data.viewCount || 0)
        );
        setRemainingViews(remaining);
        setViewLimitLabel(`Max ${response.data.maxViews} views`);
      } else {
        setRemainingViews(null);
        setViewLimitLabel("");
      }
    } catch (err) {
      const status = err.response?.status;
      if (err.response?.data?.authRequired) {
        navigate(`/auth?next=${encodeURIComponent(location.pathname)}`, { replace: true });
      } else if (status === 410) {
        setError("This vault has expired");
      } else if (status === 403) {
        setError("This link is invalid or no longer accessible");
      } else if (status === 401) {
        setRequiresPassword(true);
        setError(err.response?.data?.error || "Password required");
      } else {
        setError(err.response?.data?.error || "Failed to load content");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [uniqueId]);

  const copyToClipboard = async () => {
    if (!content?.content) return;
    try {
      await navigator.clipboard.writeText(content.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      setError("Copy failed. Please select and copy manually.");
    }
  };

  const handleDownload = async () => {
    if (!content) return;
    setDownloadLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${API_URL}/download/${uniqueId}`,
        {
          headers: password ? { "x-vault-password": password } : undefined,
          responseType: "blob",
        }
      );
      const blobUrl = window.URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = content.fileName || "download";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const status = err.response?.status;
      if (err.response?.data?.authRequired) {
        navigate(`/auth?next=${encodeURIComponent(location.pathname)}`, { replace: true });
      } else if (status === 401) {
        setRequiresPassword(true);
        setError("Password required to download");
      } else {
        setError(err.response?.data?.error || "Download failed");
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="lv-shell flex min-h-[60vh] items-center justify-center text-sm text-slate-300">
        Unlocking vault...
      </div>
    );
  }

  if (error && !requiresPassword) {
    return (
      <div className="lv-shell space-y-8">
        <header className="text-center lv-fade-in">
          <div className="inline-flex items-center gap-3 rounded-full px-4 py-2 lv-chip text-xs uppercase tracking-[0.2em]">
            Vault access
          </div>
          <h1 className="mt-6 text-3xl md:text-4xl font-bold lv-gradient-text">
            {error}
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            This vault may have expired or the link was mistyped.
          </p>
        </header>

        <div className="lv-card rounded-3xl p-8 text-center space-y-4 lv-rise">
          <p className="text-sm text-slate-300">
            Head back to create a fresh, secure share.
          </p>
          <button
            onClick={() => navigate("/")}
            className="lv-button lv-button-primary px-5 py-3 text-sm text-slate-900"
          >
            Create a new vault
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lv-shell space-y-10">
      <header className="text-center lv-fade-in">
        <div className="inline-flex items-center gap-3 rounded-full px-4 py-2 lv-chip text-xs uppercase tracking-[0.2em]">
          Secure access granted
        </div>
        <h1 className="mt-6 text-3xl md:text-5xl font-bold lv-gradient-text">
          Vault Content
        </h1>
        {content?.expiresAt && (
          <p className="mt-2 text-sm text-slate-400">
            Expires at {new Date(content.expiresAt).toLocaleString()}
          </p>
        )}
        {remainingViews !== null && (
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            <span className="lv-chip rounded-full px-3 py-1">
              Remaining views: {remainingViews}
            </span>
            {viewLimitLabel && (
              <span className="lv-chip rounded-full px-3 py-1">
                {viewLimitLabel}
              </span>
            )}
          </div>
        )}
      </header>

      <div className="lv-card rounded-3xl p-6 md:p-8 space-y-6 lv-rise">
        {requiresPassword && (
          <div className="lv-panel rounded-2xl p-5 space-y-3">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Password Required
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter vault password"
                className="lv-input flex-1 rounded-xl px-4 py-3 text-base"
              />
              <button
                onClick={() => fetchContent(password)}
                className="lv-button lv-button-primary px-5 py-3 text-sm text-slate-900"
              >
                Unlock
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-300">{error}</p>
            )}
          </div>
        )}

        {content?.type === "text" && (
          <>
            <pre className="lv-panel rounded-2xl p-4 text-sm text-slate-200 overflow-x-auto max-h-[65vh]">
              {content.content}
            </pre>
            <button
              onClick={copyToClipboard}
              className="lv-button lv-button-primary w-full py-3 text-sm text-slate-900"
            >
              {copied ? "Copied" : "Copy Text"}
            </button>
          </>
        )}

        {content?.type === "file" && (
          <div className="lv-panel rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                File Ready
              </p>
              <p className="mt-2 text-base font-semibold break-all">
                {content.fileName}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {formatBytes(content.fileSize)} • {content.mimeType || "Unknown type"}
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="lv-button lv-button-primary px-5 py-3 text-sm text-slate-900"
              disabled={downloadLoading}
            >
              {downloadLoading ? "Preparing..." : "Download"}
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-500">
        This vault will be permanently deleted after expiry.
      </p>
    </div>
  );
}

export default ViewPage;
