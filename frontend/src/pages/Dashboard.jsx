import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const statusLabel = { todo: "To Do", in_progress: "In Progress", done: "Done", overdue: "Overdue" };
const statusClass = { todo: "badge-todo", in_progress: "badge-progress", done: "badge-done", overdue: "badge-overdue" };
const priorityClass = { low: "badge-low", medium: "badge-medium", high: "badge-high", critical: "badge-critical" };

function StatCard({ label, value, color, icon }) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: `${color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color, fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontFamily: "var(--font-head)", fontWeight: 800, lineHeight: 1 }}>{value ?? "—"}</div>
        <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3, textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  const s = data?.summary;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 28, letterSpacing: "-.02em" }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
          <span style={{ color: "var(--accent)" }}>{user?.name?.split(" ")[0]}</span> 👋
        </h1>
        <p style={{ color: "var(--text2)", marginTop: 4, fontSize: 15 }}>Here's what's happening in your workspace.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Tasks" value={s?.total} color="var(--accent)" icon="📋" />
        <StatCard label="In Progress" value={s?.in_progress} color="var(--blue)" icon="⚡" />
        <StatCard label="Completed" value={s?.done} color="var(--green)" icon="✅" />
        <StatCard label="Overdue" value={s?.overdue} color="var(--red)" icon="🔥" />
        <StatCard label="Assigned to Me" value={s?.assigned_to_me} color="var(--purple)" icon="🎯" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        {/* Recent Tasks */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18 }}>Recent Activity</h2>
            <Link to="/tasks" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data?.recentTasks?.length === 0 && (
              <div className="empty-state">
                <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                <p>No tasks yet. <Link to="/projects" style={{ color: "var(--accent)" }}>Create a project</Link></p>
              </div>
            )}
            {data?.recentTasks?.map(task => (
              <div key={task.id} className="card" style={{
                padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: task.project_color || "var(--border2)",
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{task.project_name}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <span className={`badge ${statusClass[task.status]}`}>{statusLabel[task.status]}</span>
                  <span className={`badge ${priorityClass[task.priority]}`}>{task.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Progress */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18 }}>Projects</h2>
            <Link to="/projects" className="btn btn-ghost btn-sm">All →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data?.projectStats?.length === 0 && (
              <div className="empty-state" style={{ padding: 30 }}>
                <p>No projects yet</p>
              </div>
            )}
            {data?.projectStats?.map(p => {
              const pct = p.total_tasks > 0 ? Math.round((p.done_tasks / p.total_tasks) * 100) : 0;
              return (
                <Link key={p.id} to={`/projects/${p.id}`} className="card" style={{
                  padding: "12px 14px", display: "block",
                  borderLeft: `3px solid ${p.color}`,
                  transition: "all .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateX(2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = ""}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text2)", fontFamily: "var(--font-mono)" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 99,
                      width: `${pct}%`,
                      background: pct === 100 ? "var(--green)" : p.color,
                      transition: "width .4s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>
                    {p.done_tasks}/{p.total_tasks} tasks done
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
