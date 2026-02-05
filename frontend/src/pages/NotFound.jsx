import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="lv-shell space-y-8">
      <header className="text-center lv-fade-in">
        <div className="inline-flex items-center gap-3 rounded-full px-4 py-2 lv-chip text-xs uppercase tracking-[0.2em]">
          Error 404
        </div>
        <h1 className="mt-6 text-4xl md:text-5xl font-bold lv-gradient-text">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          That vault does not exist or the link has expired.
        </p>
      </header>

      <div className="lv-card rounded-3xl p-10 text-center space-y-4 lv-rise">
        <p className="text-sm text-slate-300">
          Return home to generate a new secure link.
        </p>
        <button
          onClick={() => navigate("/")}
          className="lv-button lv-button-primary px-6 py-3 text-sm text-slate-900"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}

export default NotFound;
