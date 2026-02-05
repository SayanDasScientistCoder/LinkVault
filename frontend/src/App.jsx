import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ViewPage from "./pages/ViewPage";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <div className="lv-app">
        <div className="lv-bg" aria-hidden="true">
          <span className="lv-orb lv-orb-1" />
          <span className="lv-orb lv-orb-2" />
          <span className="lv-orb lv-orb-3" />
          <span className="lv-grid" />
        </div>
        <div className="lv-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/view/:uniqueId" element={<ViewPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
