import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

function DeletePage() {
  const { uniqueId, deleteToken } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState("");
  const [vault, setVault] = useState(null);

  const loadPreview = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${API_URL}/delete-preview/${encodeURIComponent(uniqueId)}/${encodeURIComponent(deleteToken)}`
      );
      setVault(response.data);
    } catch (err) {
      const status = err.response?.status;
      if (err.response?.data?.authRequired) {
        navigate(`/auth?next=${encodeURIComponent(`/delete/${uniqueId}/${deleteToken}`)}`, { replace: true });
      } else if (status === 410) {
        setError("This vault has already expired.");
      } else if (status === 403) {
        setError("Invalid delete link.");
      } else if (status === 404) {
        setError("Vault not found or already deleted.");
      } else {
        setError(err.response?.data?.error || "Failed to load vault preview.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [uniqueId, deleteToken]);

  const handleDeleteNow = async () => {
    setDeleting(true);
    setError("");
    try {
      await axios.delete(`${API_URL}/content/${encodeURIComponent(uniqueId)}`, {
        headers: { "x-delete-token": deleteToken },
      });
      setDeleted(true);
    } catch (err) {
      if (err.response?.data?.authRequired) {
        navigate(`/auth?next=${encodeURIComponent(`/delete/${uniqueId}/${deleteToken}`)}`, { replace: true });
      } else {
        setError(err.response?.data?.error || "Delete failed.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError("");
    try {
      const response = await axios.get(
        `${API_URL}/delete-download/${encodeURIComponent(uniqueId)}/${encodeURIComponent(deleteToken)}`,
        { responseType: "blob" }
      );
      const blobUrl = window.URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = vault?.fileName || "download";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      if (err.response?.data?.authRequired) {
        navigate(`/auth?next=${encodeURIComponent(`/delete/${uniqueId}/${deleteToken}`)}`, { replace: true });
      } else {
        setError(err.response?.data?.error || "Download failed.");
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="lv-shell flex min-h-[60vh] items-center justify-center text-sm text-slate-300">
        Loading vault preview...
      </div>
    );
  }

  if (error) {
    return (
      <div className="lv-shell space-y-8">
        <header className="text-center lv-fade-in">
          <div className="inline-flex items-center gap-3 rounded-full px-4 py-2 lv-chip text-xs uppercase tracking-[0.2em]">
            Owner delete access
          </div>
          <h1 className="mt-6 text-3xl md:text-4xl font-bold lv-gradient-text">
            {error}
          </h1>
        </header>
        <div className="lv-card rounded-3xl p-8 text-center space-y-4 lv-rise">
          <button
            onClick={() => navigate("/")}
            className="lv-button lv-button-primary px-5 py-3 text-sm text-slate-900"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (deleted) {
    return (
      <div className="lv-shell space-y-8">
        <header className="text-center lv-fade-in">
          <div className="inline-flex items-center gap-3 rounded-full px-4 py-2 lv-chip text-xs uppercase tracking-[0.2em]">
            Owner delete access
          </div>
          <h1 className="mt-6 text-3xl md:text-4xl font-bold lv-gradient-text">
            Vault deleted successfully
          </h1>
        </header>
        <div className="lv-card rounded-3xl p-8 text-center space-y-4 lv-rise">
          <button
            onClick={() => navigate("/")}
            className="lv-button lv-button-primary px-5 py-3 text-sm text-slate-900"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lv-shell space-y-10">
      <header className="text-center lv-fade-in">
        <div className="inline-flex items-center gap-3 rounded-full px-4 py-2 lv-chip text-xs uppercase tracking-[0.2em]">
          Owner delete access
        </div>
        <h1 className="mt-6 text-3xl md:text-5xl font-bold lv-gradient-text">
          Review vault before deletion
        </h1>
        {vault?.expiresAt && (
          <p className="mt-2 text-sm text-slate-400">
            Expires at {new Date(vault.expiresAt).toLocaleString()}
          </p>
        )}
      </header>

      <div className="lv-card rounded-3xl p-6 md:p-8 space-y-6 lv-rise">
        {vault?.type === "text" && (
          <pre className="lv-panel rounded-2xl p-4 text-sm text-slate-200 overflow-x-auto max-h-[65vh]">
            {vault.content}
          </pre>
        )}

        {vault?.type === "file" && (
          <div className="lv-panel rounded-2xl p-5 space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              File vault
            </p>
            <p className="text-base font-semibold break-all">{vault.fileName}</p>
            <p className="text-xs text-slate-400">
              {formatBytes(vault.fileSize)} • {vault.mimeType || "Unknown type"}
            </p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="lv-button lv-button-ghost px-5 py-2 text-sm"
            >
              {downloading ? "Preparing..." : "Download File"}
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={handleDeleteNow}
            disabled={deleting}
            className="lv-button lv-button-primary px-6 py-3 text-sm text-slate-900"
          >
            {deleting ? "Deleting..." : "Delete Now"}
          </button>
          <button
            onClick={() => navigate("/")}
            className="lv-button lv-button-ghost px-6 py-3 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeletePage;
