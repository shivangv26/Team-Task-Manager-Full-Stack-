import { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";

const STATUSES = [
  { val: "", label: "All" },
  { val: "todo", label: "To Do" },
  { val: "in_progress", label: "In Progress" },
  { val: "done", label: "Done" },
  { val: "overdue", label: "Overdue" },
];

const PRIORITIES = [
  { val: "", label: "All Priority" },
  { val: "critical", label: "Critical" },
  { val: "high", label: "High" },
  { val: "medium", label: "Medium" },
  { val: "low", label: "Low" },
];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedToMe, setAssignedToMe] = useState(false);

  const load = async () => {
    try {
      const params = {};
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (assignedToMe) params.assignee = user.id;
      const [taskData, projData] = await Promise.all([
        api.getTasks(params),
        api.getProjects(),
      ]);
      setTasks(taskData.tasks);
      setProjects(projData.projects);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status, priority, assignedToMe]);

  const handleSaveTask = (task) => {
    setTasks(prev => taskModal?.id ? prev.map(t => t.id === task.id ? task : t) : [task, ...prev]);
    setTaskModal(null);
  };

  const handleDeleteTask = async (task) => {
    if (!confirm("Delete this task?")) return;
    await api.deleteTask(task.id);
    setTasks(prev => prev.filter(t => t.id !== task.id));
  };

  const handleStatusChange = (updated) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  return (
    <div style={{ padding: "28px 32px" }} className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 26, letterSpacing: "-.02em" }}>Tasks</h1>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 2 }}>{tasks.length} task{tasks.length !== 1 ? "s" : ""} across all projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setTaskModal("new")}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Task
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 3 }}>
          {STATUSES.map(s => (
            <button key={s.val} onClick={() => setStatus(s.val)}
              style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 13,
                background: status === s.val ? "var(--surface2)" : "transparent",
                color: status === s.val ? "var(--text)" : "var(--text2)",
                border: "none", transition: "all .15s", fontWeight: status === s.val ? 600 : 400,
              }}>{s.label}</button>
          ))}
        </div>

        <select className="input" style={{ width: "auto", fontSize: 13 }} value={priority} onChange={e => setPriority(e.target.value)}>
          {PRIORITIES.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
        </select>

        <button onClick={() => setAssignedToMe(!assignedToMe)}
          className={`btn btn-sm ${assignedToMe ? "btn-primary" : "btn-ghost"}`}>
          🎯 Assigned to me
        </button>
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.3" viewBox="0 0 24 24">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <p>No tasks found{status || priority || assignedToMe ? " matching filters" : ""}.</p>
          {!status && !priority && !assignedToMe && (
            <button className="btn btn-primary btn-sm" onClick={() => setTaskModal("new")}>Create first task</button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task}
              onEdit={() => setTaskModal(task)}
              onDelete={() => handleDeleteTask(task)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {taskModal && (
        <TaskModal
          task={taskModal === "new" ? null : taskModal}
          projects={projects}
          onSave={handleSaveTask}
          onClose={() => setTaskModal(null)}
        />
      )}
    </div>
  );
}
