import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function HomePage() {
  const [uploadType, setUploadType] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiryMinutes, setExpiryMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("type", uploadType);
      formData.append("expiryMinutes", expiryMinutes);

      if (uploadType === "text") {
        if (!textContent.trim()) {
          setError("Please enter some text");
          setLoading(false);
          return;
        }
        formData.append("content", textContent);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'DM Sans', sans-serif;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
        }

        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.37),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 20px 60px 0 rgba(99, 102, 241, 0.3),
            0 8px 32px 0 rgba(31, 38, 135, 0.37),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
          transform: translateY(-8px);
        }

        .glass-input {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          transition: all 0.3s ease;
        }

        .glass-input:hover {
          background: rgba(0, 0, 0, 0.4);
          border: 1.5px solid rgba(255, 255, 255, 0.25);
        }

        .glass-input:focus {
          background: rgba(0, 0, 0, 0.5);
          border: 1.5px solid rgba(139, 92, 246, 0.6);
          box-shadow: 
            0 0 0 3px rgba(139, 92, 246, 0.1),
            0 10px 40px rgba(139, 92, 246, 0.2);
        }

        .neon-button {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          box-shadow: 
            0 4px 15px 0 rgba(102, 126, 234, 0.4),
            inset 0 -2px 10px rgba(0, 0, 0, 0.2),
            inset 0 2px 10px rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .neon-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transition: left 0.5s;
        }

        .neon-button:hover::before {
          left: 100%;
        }

        .neon-button:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 
            0 10px 40px 0 rgba(102, 126, 234, 0.6),
            0 0 80px rgba(102, 126, 234, 0.3),
            inset 0 -2px 10px rgba(0, 0, 0, 0.2),
            inset 0 2px 10px rgba(255, 255, 255, 0.3);
        }

        .neon-button:active {
          transform: translateY(-1px) scale(0.98);
        }

        .toggle-button {
          position: relative;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .toggle-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          opacity: 0;
          transition: opacity 0.4s;
        }

        .toggle-button.active::before {
          opacity: 1;
        }

        .toggle-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .toggle-button.active {
          border: 1px solid rgba(139, 92, 246, 0.5);
          box-shadow: 
            0 0 30px rgba(102, 126, 234, 0.4),
            inset 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .file-upload-zone {
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border: 2px dashed rgba(255, 255, 255, 0.2);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .file-upload-zone:hover {
          background: rgba(139, 92, 246, 0.1);
          border: 2px dashed rgba(139, 92, 246, 0.5);
          box-shadow: 
            0 10px 40px rgba(139, 92, 246, 0.2),
            inset 0 0 60px rgba(139, 92, 246, 0.05);
          transform: scale(1.01);
        }

        .success-card {
          background: rgba(16, 185, 129, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(16, 185, 129, 0.3);
          box-shadow: 
            0 8px 32px rgba(16, 185, 129, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .error-card {
          background: rgba(239, 68, 68, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(239, 68, 68, 0.3);
          box-shadow: 
            0 8px 32px rgba(239, 68, 68, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .copy-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          transition: all 0.3s ease;
        }

        .copy-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 4s ease-in-out infinite;
        }

        .animate-slideUp {
          animation: slideUp 0.6s ease-out forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
      `}</style>

      <div className="min-h-screen relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
      }}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-20 -left-20 w-96 h-96 rounded-full animate-float animate-glow"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
              filter: 'blur(60px)'
            }}
          ></div>
          <div 
            className="absolute bottom-20 -right-20 w-[500px] h-[500px] rounded-full animate-float animate-glow"
            style={{
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
              filter: 'blur(80px)',
              animationDelay: '2s'
            }}
          ></div>
          <div 
            className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full animate-float animate-glow"
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
              filter: 'blur(70px)',
              animationDelay: '4s',
              transform: 'translate(-50%, -50%)'
            }}
          ></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-5xl">

            {/* Header */}
            <div className="text-center mb-16 animate-fadeIn">
              <h1 
                className="text-7xl md:text-8xl font-black tracking-tight mb-6"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                <span className="inline-block text-6xl mr-3 animate-float" style={{ animationDelay: '1s' }}>🔒</span>
                <span style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.5))'
                }}>
                  LinkVault
                </span>
              </h1>
              <p className="text-xl text-gray-300 font-medium tracking-wide" style={{
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
              }}>
                Share text or files instantly with expiring links
              </p>
            </div>

            {/* Main Glass Card */}
            <div className="glass-card rounded-3xl p-10 md:p-12 space-y-8">

              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-4">
                {["text", "file"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setUploadType(type)}
                    className={`toggle-button ${uploadType === type ? 'active' : ''} py-5 rounded-2xl font-bold text-lg relative z-0`}
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <span className="text-3xl">{type === "text" ? "📝" : "📁"}</span>
                      <span className="capitalize">{type}</span>
                    </span>
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-7">

                {/* Text Input */}
                {uploadType === "text" && (
                  <div>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      rows={12}
                      placeholder="Paste your secret text here..."
                      className="glass-input w-full rounded-2xl p-6 text-gray-100 text-lg placeholder-gray-400 focus:outline-none resize-none"
                      style={{
                        fontFamily: "'DM Sans', sans-serif"
                      }}
                    />
                  </div>
                )}

                {/* File Upload */}
                {uploadType === "file" && (
                  <label className="file-upload-zone cursor-pointer block rounded-2xl p-16">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div className="text-7xl animate-float" style={{ animationDelay: '0.5s' }}>
                        📤
                      </div>
                      <div>
                        <p className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                          {selectedFile ? selectedFile.name : "Drop your file here"}
                        </p>
                        {!selectedFile && (
                          <p className="text-gray-400 text-sm">
                            or click to browse • Any file type
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                )}

                {/* Expiry Input */}
                <div 
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <label className="block text-base font-bold text-gray-300 mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                    ⏱️ Link Expiry Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expiryMinutes}
                    onChange={(e) => setExpiryMinutes(e.target.value)}
                    className="glass-input w-full rounded-xl px-5 py-4 text-white text-lg font-semibold focus:outline-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="neon-button w-full py-5 rounded-2xl font-black text-xl text-white relative disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <span className="text-3xl">{loading ? "⏳" : "🚀"}</span>
                    {loading ? "Creating Vault..." : "Generate Secure Link"}
                  </span>
                </button>
              </form>

              {/* Error Message */}
              {error && (
                <div className="error-card rounded-2xl p-6 animate-slideUp">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">⚠️</span>
                    <p className="text-red-300 font-semibold text-lg">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Result */}
              {result && (
                <div className="success-card rounded-2xl p-7 space-y-5 animate-slideUp">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">✅</span>
                    <h3 className="font-black text-emerald-300 text-2xl" style={{ fontFamily: "'Syne', sans-serif" }}>
                      Vault Created!
                    </h3>
                  </div>

                  <div className="flex gap-4">
                    <input
                      type="text"
                      readOnly
                      value={result.shareUrl}
                      className="flex-1 rounded-xl px-5 py-4 text-gray-200 text-base font-mono"
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                    <button
                      onClick={copyToClipboard}
                      className="copy-button px-8 py-4 rounded-xl text-white font-bold text-base"
                    >
                      {copied ? "✓ Copied!" : "Copy Link"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <p className="mt-10 text-center text-sm font-medium" style={{
              color: 'rgba(255, 255, 255, 0.5)',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
            }}>
              🔐 End-to-end encrypted • Auto-deletes after expiry • Zero knowledge storage
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;