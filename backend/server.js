const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));
app.use(express.json());

// API routes
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/tasks",    require("./routes/tasks"));
app.use("/api/users",    require("./routes/users"));

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Serve React frontend in production
// Serve React frontend in production
const DIST = path.join(__dirname, "dist");
app.use(express.static(DIST));
app.get("*", (_, res) => {
  const index = path.join(DIST, "index.html");
  if (require("fs").existsSync(index)) {
    res.sendFile(index);
  } else {
    res.status(404).json({ error: "Frontend not built" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
