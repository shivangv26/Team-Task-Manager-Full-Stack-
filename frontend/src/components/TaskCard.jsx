import { api } from "../api";

const statusLabel = { todo: "To Do", in_progress: "In Progress", done: "Done", overdue: "Overdue" };
const statusClass = { todo: "badge-todo", in_progress: "badge-progress", done: "badge-done", overdue: "badge-overdue" };
const priorityClass = { low: "badge-low", medium: "badge-medium", high: "badge-high", critical: "badge-critical" };

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const handleStatus = async (status) => {
    try {
      const d = await api.updateTask(task.id, { status });
      onStatusChange?.(d.task);
    } catch {}
  };

  const formatDate = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOverdue = task.due_date && task.status !== "done" &&
    new Date(task.due_date) < new Date();

  return (
    <div className="card fade-in" style={{
      padding: "14px 16px",
      borderLeft: `3px solid ${
        task.status === "done" ? "var(--green)" :
        task.status === "overdue" || isOverdue ? "var(--red)" :
        task.status === "in_progress" ? "var(--blue)" : "var(--border2)"
      }`,
      transition: "all .18s",
      cursor: "pointer",
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
    onMouseLeave={e => e.currentTarget.style.borderColor = task.status === "done" ? "var(--green)" : task.status === "overdue" || isOverdue ? "var(--red)" : task.status === "in_progress" ? "var(--blue)" : "var(--border2)"}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Checkbox */}
        <button style={{
          width: 18, height: 18, flexShrink: 0, marginTop: 2,
          borderRadius: 4, border: task.status === "done" ? "none" : "2px solid var(--border2)",
          background: task.status === "done" ? "var(--green)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .15s", cursor: "pointer",
        }}
        onClick={(e) => { e.stopPropagation(); handleStatus(task.status === "done" ? "todo" : "done"); }}>
          {task.status === "done" && (
            <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontWeight: 600, fontSize: 14,
              textDecoration: task.status === "done" ? "line-through" : "none",
              color: task.status === "done" ? "var(--text3)" : "var(--text)",
            }}>{task.title}</span>
            <span className={`badge ${priorityClass[task.priority]}`}>{task.priority}</span>
          </div>

          {task.description && (
            <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 4, overflow: "hidden",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {task.description}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <span className={`badge ${statusClass[task.status]}`}>{statusLabel[task.status]}</span>

            {task.project_name && (
              <span style={{
                display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text2)",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: task.project_color, display: "inline-block" }}/>
                {task.project_name}
              </span>
            )}

            {task.assignee_name && (
              <span style={{ fontSize: 12, color: "var(--text2)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "var(--accent)", color: "#000",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700,
                }}>{task.assignee_name[0]}</span>
                {task.assignee_name}
              </span>
            )}

            {task.due_date && (
              <span style={{ fontSize: 12, color: isOverdue ? "var(--red)" : "var(--text2)", fontFamily: "var(--font-mono)" }}>
                {isOverdue ? "⚠ " : "📅 "}{formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button className="btn-icon" style={{ width: 28, height: 28 }}
            onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button className="btn-icon" style={{ width: 28, height: 28, color: "var(--red)", borderColor: "rgba(239,68,68,.2)" }}
            onClick={(e) => { e.stopPropagation(); onDelete?.(task); }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
