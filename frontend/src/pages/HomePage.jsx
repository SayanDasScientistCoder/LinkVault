import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function HomePage() {
  const [uploadType, setUploadType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiryMinutes, setExpiryMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('type', uploadType);
      formData.append('expiryMinutes', expiryMinutes);

      if (uploadType === 'text') {
        if (!textContent.trim()) {
          setError('Please enter some text');
          setLoading(false);
          return;
        }
        formData.append('content', textContent);
      } else {
        if (!selectedFile) {
          setError('Please select a file');
          setLoading(false);
          return;
        }
        formData.append('file', selectedFile);
      }

      const response = await axios.post(`${API_URL}/upload`, formData);
      setResult(response.data);
      setTextContent('');
      setSelectedFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.shareUrl);
    alert('Link copied!');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-4xl font-bold text-center mb-2 text-indigo-600">
          🔒 LinkVault
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Share text or files securely with time-limited links
        </p>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setUploadType('text')}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              uploadType === 'text'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            📝 Text
          </button>
          <button
            onClick={() => setUploadType('file')}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              uploadType === 'file'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            📁 File
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {uploadType === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your text
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                rows="8"
                placeholder="Paste your text here..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose a file
              </label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expires in (minutes)
            </label>
            <input
              type="number"
              value={expiryMinutes}
              onChange={(e) => setExpiryMinutes(e.target.value)}
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
          >
            {loading ? 'Uploading...' : '🚀 Generate Link'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              ✅ Upload Successful!
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={result.shareUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white border rounded"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;