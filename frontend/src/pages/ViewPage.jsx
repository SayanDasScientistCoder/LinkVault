import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get(`${API_URL}/content/${uniqueId}`);
        setContent(response.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load content");
      } finally {
        setLoading(false);
      }
    };
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

  if (loading) {
    return (
      <div className="lv-shell flex min-h-[60vh] items-center justify-center text-sm text-slate-300">
        Unlocking vault...
      </div>
    );
  }

  if (error) {
    return (
      <div className="lv-shell flex min-h-[60vh] items-center justify-center px-4">
        <div className="lv-card rounded-3xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-semibold text-red-300">
            {error}
          </h2>
          <p className="text-sm text-slate-400">
            This vault may have expired or the link was mistyped.
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
    <div className="lv-shell space-y-8">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Secure access granted
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl font-semibold">
          Vault Content
        </h1>
        {content?.expiresAt && (
          <p className="mt-2 text-sm text-slate-400">
            Expires at {new Date(content.expiresAt).toLocaleString()}
          </p>
        )}
      </header>

      <div className="lv-card rounded-3xl p-6 md:p-8 space-y-6">
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
            <a
              href={`${API_URL}/download/${uniqueId}`}
              className="lv-button lv-button-primary px-5 py-3 text-sm text-slate-900"
            >
              Download
            </a>
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
