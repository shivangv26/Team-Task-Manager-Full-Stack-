const router = require("express").Router();
const db = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");

router.use(authenticate);

// GET /api/users — admin: list all; member: list for autocomplete
router.get("/", (req, res) => {
  const { q } = req.query;
  if (req.user.role === "admin") {
    const users = db.prepare(`
      SELECT id, name, email, role, created_at FROM users
      ${q ? "WHERE name LIKE ? OR email LIKE ?" : ""}
      ORDER BY created_at DESC
    `).all(...(q ? [`%${q}%`, `%${q}%`] : []));
    return res.json({ users });
  }
  // Members can search by email to add to projects
  if (!q) return res.json({ users: [] });
  const users = db.prepare(
    "SELECT id, name, email FROM users WHERE email LIKE ? OR name LIKE ? LIMIT 10"
  ).all(`%${q}%`, `%${q}%`);
  res.json({ users });
});

// PUT /api/users/:id/role — admin only
router.put("/:id/role", requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!["admin", "member"].includes(role))
    return res.status(400).json({ error: "Invalid role" });

  db.prepare("UPDATE users SET role=? WHERE id=?").run(role, req.params.id);
  const user = db
    .prepare("SELECT id, name, email, role, created_at FROM users WHERE id=?")
    .get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

// DELETE /api/users/:id — admin only
router.delete("/:id", requireAdmin, (req, res) => {
  if (Number(req.params.id) === req.user.id)
    return res.status(400).json({ error: "Cannot delete yourself" });

  const user = db.prepare("SELECT id FROM users WHERE id=?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  db.prepare("DELETE FROM users WHERE id=?").run(req.params.id);
  res.json({ message: "User deleted" });
});

module.exports = router;
