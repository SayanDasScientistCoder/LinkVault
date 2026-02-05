import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="lv-shell flex min-h-[60vh] items-center justify-center">
      <div className="lv-card rounded-3xl p-10 text-center space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Error 404
        </p>
        <h1 className="text-4xl font-semibold">Page not found</h1>
        <p className="text-sm text-slate-400">
          That vault does not exist or the link has expired.
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
