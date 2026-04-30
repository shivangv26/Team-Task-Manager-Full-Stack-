const router = require("express").Router();
const db = require("../db");
const { authenticate, requireProjectRole } = require("../middleware/auth");

router.use(authenticate);

// Auto-mark overdue tasks helper
function markOverdueTasks(projectId) {
  db.prepare(`
    UPDATE tasks SET status='overdue', updated_at=datetime('now')
    WHERE project_id = ? AND status != 'done'
      AND due_date IS NOT NULL AND due_date < date('now')
  `).run(projectId);
}

// GET /api/tasks?projectId=&status=&assignee=&priority=
router.get("/", (req, res) => {
  const { projectId, status, assignee, priority } = req.query;

  // Verify user has access to the project
  if (projectId) {
    const member = db
      .prepare("SELECT 1 FROM project_members WHERE project_id=? AND user_id=?")
      .get(projectId, req.user.id);
    const project = db.prepare("SELECT owner_id FROM projects WHERE id=?").get(projectId);

    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!member && project.owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    markOverdueTasks(projectId);
  }

  let query = `
    SELECT t.*,
      u1.name as assignee_name, u1.email as assignee_email,
      u2.name as creator_name,
      p.name as project_name, p.color as project_color
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    LEFT JOIN users u1 ON u1.id = t.assignee_id
    LEFT JOIN users u2 ON u2.id = t.creator_id
    WHERE 1=1
  `;
  const params = [req.user.id];

  if (projectId) { query += " AND t.project_id = ?"; params.push(projectId); }
  if (status)    { query += " AND t.status = ?";     params.push(status); }
  if (assignee)  { query += " AND t.assignee_id = ?"; params.push(assignee); }
  if (priority)  { query += " AND t.priority = ?";   params.push(priority); }

  query += " ORDER BY CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, t.due_date ASC NULLS LAST, t.created_at DESC";

  const tasks = db.prepare(query).all(...params);
  res.json({ tasks });
});

// POST /api/tasks
router.post("/", (req, res) => {
  const { title, description, project_id, assignee_id, status, priority, due_date } = req.body;

  if (!title) return res.status(400).json({ error: "Title is required" });
  if (!project_id) return res.status(400).json({ error: "Project ID is required" });

  // Check user is a project member
  const member = db
    .prepare("SELECT 1 FROM project_members WHERE project_id=? AND user_id=?")
    .get(project_id, req.user.id);
  const project = db.prepare("SELECT owner_id FROM projects WHERE id=?").get(project_id);

  if (!project) return res.status(404).json({ error: "Project not found" });
  if (!member && project.owner_id !== req.user.id) {
    return res.status(403).json({ error: "Not a project member" });
  }

  // Validate assignee is project member
  if (assignee_id) {
    const assigneeMember = db
      .prepare("SELECT 1 FROM project_members WHERE project_id=? AND user_id=?")
      .get(project_id, assignee_id);
    if (!assigneeMember && project.owner_id !== Number(assignee_id)) {
      return res.status(400).json({ error: "Assignee must be a project member" });
    }
  }

  const result = db.prepare(`
    INSERT INTO tasks (title, description, project_id, assignee_id, creator_id, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description || null,
    project_id,
    assignee_id || null,
    req.user.id,
    status || "todo",
    priority || "medium",
    due_date || null
  );

  const task = db.prepare(`
    SELECT t.*, u1.name as assignee_name, u2.name as creator_name,
      p.name as project_name, p.color as project_color
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN users u1 ON u1.id = t.assignee_id
    LEFT JOIN users u2 ON u2.id = t.creator_id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ task });
});

// GET /api/tasks/:id
router.get("/:id", (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u1.name as assignee_name, u1.email as assignee_email,
      u2.name as creator_name, p.name as project_name, p.color as project_color
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN users u1 ON u1.id = t.assignee_id
    LEFT JOIN users u2 ON u2.id = t.creator_id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!task) return res.status(404).json({ error: "Task not found" });

  // Check access
  const member = db
    .prepare("SELECT 1 FROM project_members WHERE project_id=? AND user_id=?")
    .get(task.project_id, req.user.id);
  const project = db.prepare("SELECT owner_id FROM projects WHERE id=?").get(task.project_id);

  if (!member && project.owner_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  res.json({ task });
});

// PUT /api/tasks/:id
router.put("/:id", (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id=?").get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const project = db.prepare("SELECT owner_id FROM projects WHERE id=?").get(task.project_id);
  const member = db
    .prepare("SELECT role FROM project_members WHERE project_id=? AND user_id=?")
    .get(task.project_id, req.user.id);

  // Members can update status/assignee on their own tasks; admins can update all fields
  const isProjectAdmin = project.owner_id === req.user.id ||
    (member && member.role === "admin") ||
    req.user.role === "admin";

  const { title, description, assignee_id, status, priority, due_date } = req.body;

  const updated = db.prepare(`
    UPDATE tasks SET
      title = ?,
      description = ?,
      assignee_id = ?,
      status = ?,
      priority = ?,
      due_date = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    isProjectAdmin ? (title || task.title) : task.title,
    isProjectAdmin ? (description !== undefined ? description : task.description) : task.description,
    isProjectAdmin ? (assignee_id !== undefined ? (assignee_id || null) : task.assignee_id) : task.assignee_id,
    status || task.status,
    isProjectAdmin ? (priority || task.priority) : task.priority,
    isProjectAdmin ? (due_date !== undefined ? due_date : task.due_date) : task.due_date,
    req.params.id
  );

  const updatedTask = db.prepare(`
    SELECT t.*, u1.name as assignee_name, u2.name as creator_name,
      p.name as project_name, p.color as project_color
    FROM tasks t JOIN projects p ON p.id=t.project_id
    LEFT JOIN users u1 ON u1.id=t.assignee_id
    LEFT JOIN users u2 ON u2.id=t.creator_id
    WHERE t.id=?
  `).get(req.params.id);

  res.json({ task: updatedTask });
});

// DELETE /api/tasks/:id
router.delete("/:id", (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id=?").get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const project = db.prepare("SELECT owner_id FROM projects WHERE id=?").get(task.project_id);
  const member = db
    .prepare("SELECT role FROM project_members WHERE project_id=? AND user_id=?")
    .get(task.project_id, req.user.id);

  const canDelete = project.owner_id === req.user.id ||
    (member && member.role === "admin") ||
    task.creator_id === req.user.id ||
    req.user.role === "admin";

  if (!canDelete) return res.status(403).json({ error: "Cannot delete this task" });

  db.prepare("DELETE FROM tasks WHERE id=?").run(req.params.id);
  res.json({ message: "Task deleted" });
});

// GET /api/tasks/dashboard/summary
router.get("/dashboard/summary", (req, res) => {
  // Auto-mark overdue for all user projects
  const userProjects = db.prepare(`
    SELECT project_id FROM project_members WHERE user_id=?
  `).all(req.user.id);

  userProjects.forEach(p => markOverdueTasks(p.project_id));

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN t.status='todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN t.status='in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN t.status='done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN t.status='overdue' THEN 1 ELSE 0 END) as overdue,
      SUM(CASE WHEN t.assignee_id = ? THEN 1 ELSE 0 END) as assigned_to_me
    FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
  `).get(req.user.id, req.user.id);

  const recentTasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, p.name as project_name, p.color as project_color
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    LEFT JOIN users u ON u.id = t.assignee_id
    ORDER BY t.updated_at DESC
    LIMIT 8
  `).all(req.user.id);

  const projectStats = db.prepare(`
    SELECT p.id, p.name, p.color,
      COUNT(t.id) as total_tasks,
      SUM(CASE WHEN t.status='done' THEN 1 ELSE 0 END) as done_tasks
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    LEFT JOIN tasks t ON t.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 5
  `).all(req.user.id);

  res.json({ summary, recentTasks, projectStats });
});

module.exports = router;
