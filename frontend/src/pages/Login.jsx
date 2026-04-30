import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: 20,
    }}>
      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, opacity: .04,
        backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      <div className="card fade-in" style={{ width: "100%", maxWidth: 400, padding: 36, position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, background: "var(--accent)", borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 11l3 3L22 4" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 26, letterSpacing: "-.02em" }}>
            TaskForge
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>Sign in to your workspace</p>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)",
            borderRadius: "var(--radius)", padding: "10px 14px", marginBottom: 18,
            fontSize: 14, color: "var(--red)",
          }}>{error}</div>
        )}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="you@company.com" required />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password}
              onChange={e => set("password", e.target.value)}
              placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: 4, fontSize: 15 }}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 22, fontSize: 14, color: "var(--text2)" }}>
          No account?{" "}
          <Link to="/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>Create one</Link>
        </p>

        {/* Demo hint */}
        <div style={{
          marginTop: 20, padding: "10px 14px",
          background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.15)",
          borderRadius: "var(--radius)", fontSize: 12, color: "var(--text2)",
        }}>
          <strong style={{ color: "var(--accent)" }}>Demo:</strong> Sign up with role <code style={{ fontFamily: "var(--font-mono)" }}>admin</code> to unlock full access.
        </div>
      </div>
    </div>
  );
}
