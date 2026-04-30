import { useState, useEffect } from "react";
import { api } from "../api";

export default function TaskModal({ task, projectId, projects, onSave, onClose }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    project_id: task?.project_id || projectId || "",
    assignee_id: task?.assignee_id || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    due_date: task?.due_date || "",
  });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (form.project_id) {
      api.getProject(form.project_id)
        .then((d) => setMembers(d.members))
        .catch(() => {});
    }
  }, [form.project_id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const body = { ...form, assignee_id: form.assignee_id || null };
      const d = isEdit ? await api.updateTask(task.id, body) : await api.createTask(body);
      onSave(d.task);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card fade-in" style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 20 }}>
            {isEdit ? "Edit Task" : "New Task"}
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {error && <div style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)", borderRadius: "var(--radius)", padding: "10px 14px", marginBottom: 16, fontSize: 14, color: "var(--red)" }}>{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Task title..." required />
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Add details..." rows={3} style={{ resize: "vertical" }} />
          </div>

          {!projectId && (
            <div className="form-group">
              <label className="label">Project *</label>
              <select className="input" value={form.project_id} onChange={e => set("project_id", e.target.value)} required>
                <option value="">Select project...</option>
                {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => set("priority", e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group">
              <label className="label">Assignee</label>
              <select className="input" value={form.assignee_id} onChange={e => set("assignee_id", e.target.value)}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
              {isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
