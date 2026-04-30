const router = require("express").Router();
const db = require("../db");
const { authenticate, requireProjectRole } = require("../middleware/auth");

router.use(authenticate);

// GET /api/projects — list projects user belongs to
router.get("/", (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, u.name as owner_name,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') as done_count,
      (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.owner_id
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json({ projects });
});

// POST /api/projects — create project (any authenticated user)
router.post("/", (req, res) => {
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ error: "Project name is required" });

  const result = db
    .prepare("INSERT INTO projects (name, description, color, owner_id) VALUES (?, ?, ?, ?)")
    .run(name, description || null, color || "#f59e0b", req.user.id);

  // Auto-add owner as admin member
  db.prepare("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'admin')")
    .run(result.lastInsertRowid, req.user.id);

  const project = db
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json({ project });
});

// GET /api/projects/:projectId
router.get("/:projectId", requireProjectRole("member"), (req, res) => {
  const project = db.prepare(`
    SELECT p.*, u.name as owner_name
    FROM projects p JOIN users u ON u.id = p.owner_id
    WHERE p.id = ?
  `).get(req.params.projectId);

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.role as global_role, pm.role as project_role, pm.joined_at
    FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
    ORDER BY pm.role DESC, u.name ASC
  `).all(req.params.projectId);

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status='todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN status='overdue' OR (due_date < date('now') AND status != 'done') THEN 1 ELSE 0 END) as overdue
    FROM tasks WHERE project_id = ?
  `).get(req.params.projectId);

  res.json({ project, members, stats });
});

// PUT /api/projects/:projectId
router.put("/:projectId", requireProjectRole("admin"), (req, res) => {
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ error: "Project name is required" });

  db.prepare("UPDATE projects SET name=?, description=?, color=? WHERE id=?")
    .run(name, description || null, color || "#f59e0b", req.params.projectId);

  const project = db.prepare("SELECT * FROM projects WHERE id=?").get(req.params.projectId);
  res.json({ project });
});

// DELETE /api/projects/:projectId
router.delete("/:projectId", requireProjectRole("admin"), (req, res) => {
  db.prepare("DELETE FROM projects WHERE id=?").run(req.params.projectId);
  res.json({ message: "Project deleted" });
});

// POST /api/projects/:projectId/members
router.post("/:projectId/members", requireProjectRole("admin"), (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (!user) return res.status(404).json({ error: "User not found" });

  const existing = db
    .prepare("SELECT 1 FROM project_members WHERE project_id=? AND user_id=?")
    .get(req.params.projectId, user.id);
  if (existing) return res.status(409).json({ error: "User already a member" });

  db.prepare("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)")
    .run(req.params.projectId, user.id, role || "member");

  const member = db.prepare(`
    SELECT u.id, u.name, u.email, u.role as global_role, pm.role as project_role
    FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ? AND pm.user_id = ?
  `).get(req.params.projectId, user.id);

  res.status(201).json({ member });
});

// DELETE /api/projects/:projectId/members/:userId
router.delete("/:projectId/members/:userId", requireProjectRole("admin"), (req, res) => {
  const project = db.prepare("SELECT owner_id FROM projects WHERE id=?").get(req.params.projectId);
  if (project.owner_id === Number(req.params.userId)) {
    return res.status(400).json({ error: "Cannot remove project owner" });
  }

  db.prepare("DELETE FROM project_members WHERE project_id=? AND user_id=?")
    .run(req.params.projectId, req.params.userId);
  res.json({ message: "Member removed" });
});

module.exports = router;
