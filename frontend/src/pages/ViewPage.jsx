import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0f14] via-[#12121a] to-black text-gray-300">
        <div className="animate-pulse text-sm tracking-wide">
          Unlocking vault…
        </div>
      </div>
    );
  }

  /* ---------------- Error / Expired ---------------- */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0f0f14] via-[#12121a] to-black text-gray-100">
        <div className="max-w-xl w-full bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-8 text-center shadow-xl animate-fadeIn">
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            ⚠️ {error}
          </h2>
          <p className="text-gray-400 mb-6">
            This vault may have expired or was never created.
          </p>
          <button
            onClick={() => navigate("/")}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-semibold hover:scale-105 transition"
          >
            Create New Vault
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- Main View ---------------- */
  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-[#0f0f14] via-[#12121a] to-black text-gray-100">
      <div className="max-w-4xl mx-auto animate-slideUp">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">
            🔐 Vault Content
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            Access granted via secure link
          </p>
        </div>

        {/* Vault Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl shadow-xl p-6 md:p-8 space-y-6">

          {/* TEXT CONTENT */}
          {content.type === "text" && (
            <>
              <pre className="bg-black/50 rounded-xl p-4 text-sm text-gray-200 overflow-x-auto border border-white/10 max-h-[70vh]">
                {content.content}
              </pre>

              <button
                onClick={copyToClipboard}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 font-semibold hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all"
              >
                {copied ? "Copied!" : "📋 Copy Text"}
              </button>
            </>
          )}

          {/* FILE CONTENT */}
          {content.type === "file" && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-black/40 rounded-xl p-4 border border-white/10">
              <div>
                <p className="text-sm text-gray-400">File</p>
                <p className="font-medium break-all">
                  {content.fileName}
                </p>
              </div>

              <a
                href={`${API_URL}/download/${uniqueId}`}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-semibold hover:scale-105 transition"
              >
                ⬇️ Download
              </a>
            </div>
          )}

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          This content will be permanently deleted after expiry
        </p>
      </div>
    </div>
  );
}

export default ViewPage;
