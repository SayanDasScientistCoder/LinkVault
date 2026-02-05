import { useMemo, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const MAX_FILE_MB = 50;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

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

function HomePage() {
  const [uploadType, setUploadType] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiryMinutes, setExpiryMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (uploadType === "text") return textContent.trim().length > 0;
    return Boolean(selectedFile);
  }, [loading, uploadType, textContent, selectedFile]);

  const resetResult = () => {
    setResult(null);
    setCopied(false);
  };

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError(`File too large. Max size is ${MAX_FILE_MB} MB.`);
      setSelectedFile(null);
      return;
    }
    setError("");
    setSelectedFile(file);
    resetResult();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("type", uploadType);
      formData.append("expiryMinutes", Number(expiryMinutes));

      if (uploadType === "text") {
        if (!textContent.trim()) {
          setError("Please enter some text");
          setLoading(false);
          return;
        }
        formData.append("content", textContent.trim());
      } else {
        if (!selectedFile) {
          setError("Please select a file");
          setLoading(false);
          return;
        }
        formData.append("file", selectedFile);
      }

      const response = await axios.post(`${API_URL}/upload`, formData);
      setResult(response.data);
      setTextContent("");
      setSelectedFile(null);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(result.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      setError("Copy failed. Please copy the link manually.");
    }
  };

  return (
    <div className="lv-shell space-y-10">
      <header className="text-center lv-fade-in">
        <div className="inline-flex items-center gap-3 rounded-full px-4 py-2 lv-chip text-xs uppercase tracking-[0.2em]">
          Secure sharing • Instant access
        </div>
        <h1 className="mt-6 text-5xl md:text-7xl font-bold lv-gradient-text">
          LinkVault
        </h1>
        <p className="mt-4 text-base md:text-lg text-slate-300">
          Drop in text or files, lock them down, and share a time-limited vault
          link in seconds.
        </p>
      </header>

      <div className="lv-card rounded-[32px] p-6 md:p-10 space-y-8 lv-rise">
        <div className="grid grid-cols-2 gap-3">
          {["text", "file"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setUploadType(type);
                resetResult();
              }}
              className={`lv-toggle rounded-2xl py-5 text-lg md:text-xl ${
                uploadType === type ? "active" : ""
              }`}
            >
              <span className="capitalize font-semibold">
                {type === "text" ? "Text Vault" : "File Vault"}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {uploadType === "text" && (
            <div className="space-y-3">
              <label className="text-sm uppercase tracking-[0.2em] text-slate-300">
                Vault Text
              </label>
              <textarea
                value={textContent}
                onChange={(e) => {
                  setTextContent(e.target.value);
                  resetResult();
                }}
                rows={10}
                placeholder="Paste your secret message, keys, or notes here..."
                className="lv-input w-full rounded-2xl p-5 text-base md:text-lg placeholder:text-slate-500 resize-none"
              />
            </div>
          )}

          {uploadType === "file" && (
            <label
              className={`lv-panel block rounded-2xl p-8 md:p-10 border-2 border-dashed text-center transition ${
                dragActive ? "border-cyan-300" : "border-slate-600/60"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                handleFile(event.dataTransfer.files?.[0]);
              }}
            >
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <div className="space-y-3">
                <p className="text-lg md:text-xl font-semibold">
                  {selectedFile ? selectedFile.name : "Drop a file or browse"}
                </p>
                <p className="text-sm text-slate-400">
                  {selectedFile
                    ? `${formatBytes(selectedFile.size)} • ${selectedFile.type || "Unknown type"}`
                    : `Up to ${MAX_FILE_MB} MB`}
                </p>
              </div>
            </label>
          )}

          <div className="lv-panel rounded-2xl p-5 space-y-3">
            <label className="text-sm uppercase tracking-[0.2em] text-slate-300">
              Expiry Time (Minutes)
            </label>
            <input
              type="number"
              min="1"
              max="1440"
              value={expiryMinutes}
              onChange={(e) => {
                setExpiryMinutes(e.target.value);
                resetResult();
              }}
              className="lv-input w-full rounded-xl px-4 py-3 text-lg font-semibold"
            />
            <p className="text-xs text-slate-400">
              Links auto-delete after expiry. Max recommended: 1440 minutes.
            </p>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="lv-button lv-button-primary w-full py-4 text-lg text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sealing vault..." : "Generate Secure Link"}
          </button>
        </form>

        {error && (
          <div className="lv-panel rounded-2xl p-4 border border-red-400/40 text-red-200">
            {error}
          </div>
        )}

        {result && (
          <div className="lv-panel rounded-2xl p-6 space-y-4 border border-emerald-400/30">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-xl font-semibold text-emerald-300">
                  Vault ready to share
                </h3>
                <p className="text-xs text-slate-400">
                  Expires at {new Date(result.expiresAt).toLocaleString()}
                </p>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">
                {result.type} vault
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                readOnly
                value={result.shareUrl}
                className="lv-input flex-1 rounded-xl px-4 py-3 text-sm font-mono"
              />
              <button
                onClick={copyToClipboard}
                className="lv-button lv-button-ghost px-5 py-3 text-sm"
              >
                {copied ? "Copied" : "Copy Link"}
              </button>
              <a
                href={result.shareUrl}
                className="lv-button lv-button-primary px-5 py-3 text-sm text-slate-900 text-center"
              >
                Open Link
              </a>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-slate-400">
        Zero-knowledge storage • Auto-expiring vaults • No tracking
      </footer>
    </div>
  );
}

export default HomePage;
