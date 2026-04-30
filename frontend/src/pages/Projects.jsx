import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

const COLORS = ["#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444","#ec4899","#14b8a6","#f97316"];

function ProjectModal({ project, onSave, onClose }) {
  const isEdit = !!project;
  const [form, setForm] = useState({
    name: project?.name || "",
    description: project?.description || "",
    color: project?.color || COLORS[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const d = isEdit ? await api.updateProject(project.id, form) : await api.createProject(form);
      onSave(d.project);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card fade-in" style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 20 }}>
            {isEdit ? "Edit Project" : "New Project"}
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {error && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", borderRadius: "var(--radius)", padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "var(--red)" }}>{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="label">Project Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="My Project" required />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
              placeholder="What's this project about?" rows={2} style={{ resize: "vertical" }} />
          </div>
          <div className="form-group">
            <label className="label">Color</label>
            <div style={{ display: "flex", gap: 8 }}>
              {COLORS.map(c => (
                <button key={c} type="button"
                  style={{
                    width: 28, height: 28, borderRadius: "50%", background: c,
                    border: form.color === c ? `3px solid white` : "3px solid transparent",
                    outline: form.color === c ? `2px solid ${c}` : "none",
                    transition: "all .15s",
                  }}
                  onClick={() => setForm(f => ({...f, color: c}))} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
              {isEdit ? "Save" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | project object
  const navigate = useNavigate();

  const load = () => api.getProjects().then(d => setProjects(d.projects)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSave = (p) => {
    setProjects(prev => modal?.id ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]);
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    await api.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div style={{ padding: "28px 32px" }} className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 26, letterSpacing: "-.02em" }}>Projects</h1>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 2 }}>{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal("create")}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Project
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 24 24">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <p>No projects yet. Create your first one!</p>
          <button className="btn btn-primary btn-sm" onClick={() => setModal("create")}>Create Project</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {projects.map(p => {
            const pct = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
            return (
              <div key={p.id} className="card" style={{
                borderTop: `3px solid ${p.color}`,
                transition: "all .2s",
                cursor: "pointer",
              }}
              onClick={() => navigate(`/projects/${p.id}`)}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 17 }}>{p.name}</h3>
                    <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>by {p.owner_name}</p>
                  </div>
                  <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => setModal(p)}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button className="btn-icon" style={{ width: 28, height: 28, color: "var(--red)", borderColor: "rgba(239,68,68,.2)" }}
                      onClick={() => handleDelete(p.id)}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {p.description && (
                  <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14, overflow: "hidden",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {p.description}
                  </p>
                )}

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 5 }}>
                    <span>Progress</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 99,
                      width: `${pct}%`, background: pct === 100 ? "var(--green)" : p.color,
                      transition: "width .5s ease",
                    }} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text2)" }}>
                  <span>📋 {p.task_count} tasks</span>
                  <span>👥 {p.member_count} members</span>
                  <span>✅ {p.done_count} done</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <ProjectModal
          project={modal === "create" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
