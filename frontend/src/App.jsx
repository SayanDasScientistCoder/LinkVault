import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ViewPage from './pages/ViewPage';
import NotFound from './pages/NotFound';

function App() {
  return (
     <div className="min-h-screen bg-background text-gray-100 px-4">
      <div className="max-w-4xl mx-auto py-12">
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/view/:uniqueId" element={<ViewPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
    </div>
    </div>
  );
}

export default App;