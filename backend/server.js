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
const DIST = path.join(__dirname, "../frontend/dist");
app.use(express.static(DIST));
app.get("*", (_, res) => res.sendFile(path.join(DIST, "index.html")));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
