import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ViewPage() {
  const { uniqueId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get(`${API_URL}/content/${uniqueId}`);
        setContent(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [uniqueId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content.content);
    alert('Copied!');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">⚠️ {error}</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">
          {content.type === 'text' ? '📝 Shared Text' : '📁 Shared File'}
        </h1>

        {content.type === 'text' ? (
          <div>
            <textarea
              value={content.content}
              readOnly
              className="w-full px-4 py-3 border rounded-lg mb-4"
              rows="15"
            />
            <button
              onClick={copyToClipboard}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg"
            >
              📋 Copy to Clipboard
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl mb-4">{content.fileName}</p>
            
            <a  href={`http://localhost:5000/api/download/${uniqueId}`}
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg"
            >
              ⬇️ Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewPage;