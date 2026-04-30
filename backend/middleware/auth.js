const jwt = require("jsonwebtoken");
const db = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_dev_key_change_in_prod";

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(payload.id);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function requireProjectRole(minRole = "member") {
  return (req, res, next) => {
    const projectId = req.params.projectId || req.body.project_id;
    const member = db
      .prepare("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?")
      .get(projectId, req.user.id);

    const project = db.prepare("SELECT owner_id FROM projects WHERE id = ?").get(projectId);

    if (!project) return res.status(404).json({ error: "Project not found" });

    // Owner always has full access
    if (project.owner_id === req.user.id || req.user.role === "admin") {
      req.projectRole = "admin";
      return next();
    }

    if (!member) return res.status(403).json({ error: "Not a project member" });

    if (minRole === "admin" && member.role !== "admin") {
      return res.status(403).json({ error: "Project admin access required" });
    }

    req.projectRole = member.role;
    next();
  };
}

module.exports = { authenticate, requireAdmin, requireProjectRole, JWT_SECRET };
