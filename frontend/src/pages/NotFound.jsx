import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-6xl mb-4">404</h1>
        <p className="text-xl mb-6">Page Not Found</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

export default NotFound;