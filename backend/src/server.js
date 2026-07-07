const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");

const { bootstrapDatabase } = require("./config/bootstrapDb");
const searchRoutes = require("./routes/search");
const feedbackRoutes = require("./routes/feedback");
const adminAuthRoutes = require("./routes/adminAuth");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Commuter-facing
app.use("/api/search", searchRoutes);
app.use("/api/feedback", feedbackRoutes);

// Admin-facing
app.use("/api/admin", adminAuthRoutes); // /api/admin/login (public)
app.use("/api/admin", adminRoutes); // everything else (protected)

app.use((req, res) => res.status(404).json({ error: "Not found." }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

async function start() {
  await bootstrapDatabase();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`RouteWay backend listening on http://localhost:${PORT}`),
  );
}

start().catch((err) => {
  console.error("Failed to start backend:", err);
  process.exit(1);
});
