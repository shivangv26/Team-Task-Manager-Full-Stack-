import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null);
  const [tab, setTab] = useState("tasks");
  const [filterStatus, setFilterStatus] = useState("");
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addMemberRole, setAddMemberRole] = useState("member");
  const [memberError, setMemberError] = useState("");

  const load = async () => {
    try {
      const [projData, taskData] = await Promise.all([
        api.getProject(id),
        api.getTasks({ projectId: id }),
      ]);
      setProject(projData.project);
      setMembers(projData.members);
      setStats(projData.stats);
      setTasks(taskData.tasks);
    } catch {
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const isAdmin = project?.owner_id === user?.id || user?.role === "admin" ||
    members.find(m => m.id === user?.id)?.project_role === "admin";

  const handleSaveTask = (task) => {
    setTasks(prev => taskModal?.id ? prev.map(t => t.id === task.id ? task : t) : [task, ...prev]);
    setTaskModal(null);
    load(); // refresh stats
  };

  const handleDeleteTask = async (task) => {
    if (!confirm("Delete this task?")) return;
    await api.deleteTask(task.id);
    setTasks(prev => prev.filter(t => t.id !== task.id));
    load();
  };

  const handleStatusChange = (updated) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    load();
  };

  const handleAddMember = async () => {
    setMemberError("");
    try {
      const d = await api.addMember(id, { email: addMemberEmail, role: addMemberRole });
      setMembers(prev => [...prev, d.member]);
      setAddMemberEmail("");
    } catch (err) {
      setMemberError(err.message);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Remove this member?")) return;
    await api.removeMember(id, userId);
    setMembers(prev => prev.filter(m => m.id !== userId));
  };

  const filteredTasks = filterStatus ? tasks.filter(t => t.status === filterStatus) : tasks;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div style={{ padding: "28px 32px" }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <button onClick={() => navigate("/projects")} style={{
            background: "none", border: "none", color: "var(--text2)", fontSize: 13,
            display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
          }}>
            ← Projects
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: project?.color }} />
            <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 24, letterSpacing: "-.02em" }}>
              {project?.name}
            </h1>
          </div>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setTaskModal("new")}>
              + New Task
            </button>
          )}
        </div>
        {project?.description && (
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 6, maxWidth: 600 }}>{project.description}</p>
        )}
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Total", val: stats.total, cls: "" },
            { label: "To Do", val: stats.todo, cls: "badge-todo" },
            { label: "In Progress", val: stats.in_progress, cls: "badge-progress" },
            { label: "Done", val: stats.done, cls: "badge-done" },
            { label: "Overdue", val: stats.overdue, cls: "badge-overdue" },
          ].map(item => (
            <button key={item.label}
              onClick={() => setFilterStatus(filterStatus === item.label.toLowerCase().replace(" ", "_") ? "" : item.label.toLowerCase().replace(" ", "_"))}
              className={`badge ${item.cls}`}
              style={{
                fontSize: 12, padding: "6px 12px", cursor: "pointer",
                background: item.cls ? undefined : "var(--surface2)",
                color: item.cls ? undefined : "var(--text2)",
              }}>
              {item.label}: <strong style={{ marginLeft: 4 }}>{item.val}</strong>
            </button>
          ))}
          {filterStatus && (
            <button className="badge" onClick={() => setFilterStatus("")}
              style={{ cursor: "pointer", background: "transparent", border: "1px solid var(--border2)", color: "var(--text2)" }}>
              ✕ Clear filter
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {["tasks", "members"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: "8px 16px", background: "none",
              borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              color: tab === t ? "var(--accent)" : "var(--text2)",
              fontSize: 14, fontWeight: 600, textTransform: "capitalize",
              marginBottom: -1, transition: "all .15s",
            }}>
            {t} {t === "tasks" ? `(${filteredTasks.length})` : `(${members.length})`}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {tab === "tasks" && (
        <div>
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <p>No tasks {filterStatus ? "matching this filter" : "yet"}.</p>
              {isAdmin && !filterStatus && (
                <button className="btn btn-primary btn-sm" onClick={() => setTaskModal("new")}>Create first task</button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task}
                  onEdit={() => setTaskModal(task)}
                  onDelete={() => handleDeleteTask(task)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {tab === "members" && (
        <div style={{ maxWidth: 600 }}>
          {isAdmin && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Add Member</h3>
              {memberError && (
                <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 10, padding: "8px 12px", background: "rgba(239,68,68,.08)", borderRadius: "var(--radius)" }}>{memberError}</div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <input className="input" style={{ flex: 1 }} value={addMemberEmail}
                  onChange={e => setAddMemberEmail(e.target.value)}
                  placeholder="member@email.com" />
                <select className="input" style={{ width: 120 }} value={addMemberRole}
                  onChange={e => setAddMemberRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button className="btn btn-primary" onClick={handleAddMember}>Add</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map(m => (
              <div key={m.id} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "var(--accent)", color: "#000",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 15, fontFamily: "var(--font-head)", flexShrink: 0,
                }}>{m.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{m.email}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className={`badge ${m.project_role === "admin" ? "badge-progress" : "badge-todo"}`}>
                    {m.project_role}
                  </span>
                  {isAdmin && m.id !== user?.id && project?.owner_id !== m.id && (
                    <button className="btn-icon" style={{ width: 28, height: 28, color: "var(--red)", borderColor: "rgba(239,68,68,.2)" }}
                      onClick={() => handleRemoveMember(m.id)}>
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {taskModal && (
        <TaskModal
          task={taskModal === "new" ? null : taskModal}
          projectId={id}
          onSave={handleSaveTask}
          onClose={() => setTaskModal(null)}
        />
      )}
    </div>
  );
}
