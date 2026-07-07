const express = require("express");
const pool = require("../config/db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(requireAdmin); // everything below requires a valid admin token

/* ---------------- Stops ---------------- */

router.get("/stops", async (_req, res) => {
  const [stops] = await pool.query("SELECT * FROM stops ORDER BY name ASC");
  res.json({ stops });
});

router.post("/stops", async (req, res) => {
  const { name, latitude, longitude } = req.body;
  if (!name) return res.status(400).json({ error: "Stop name is required." });
  try {
    const [result] = await pool.query(
      "INSERT INTO stops (name, latitude, longitude) VALUES (?, ?, ?)",
      [name.trim(), latitude ?? null, longitude ?? null],
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res
      .status(400)
      .json({ error: "Could not create stop (it may already exist)." });
  }
});

router.delete("/stops/:id", async (req, res) => {
  await pool.query("DELETE FROM stops WHERE id = ?", [req.params.id]);
  res.json({ message: "Stop deleted." });
});

/* ---------------- Routes ---------------- */

router.get("/routes", async (_req, res) => {
  const [routes] = await pool.query(
    `SELECT r.*, f.fare_amount, f.currency
     FROM routes r
     LEFT JOIN fares f ON f.route_id = r.id
     ORDER BY r.created_at DESC`,
  );
  res.json({ routes });
});

router.get("/routes/:id", async (req, res) => {
  const [[route]] = await pool.query("SELECT * FROM routes WHERE id = ?", [
    req.params.id,
  ]);
  if (!route) return res.status(404).json({ error: "Route not found." });

  const [stops] = await pool.query(
    `SELECT rs.id AS route_stop_id, s.id AS stop_id, s.name, rs.stop_order, rs.eta_minutes_from_start
     FROM route_stops rs JOIN stops s ON s.id = rs.stop_id
     WHERE rs.route_id = ? ORDER BY rs.stop_order ASC`,
    [req.params.id],
  );
  const [[fare]] = await pool.query("SELECT * FROM fares WHERE route_id = ?", [
    req.params.id,
  ]);

  res.json({ ...route, stops, fare: fare || null });
});

router.post("/routes", async (req, res) => {
  const {
    name,
    vehicleName,
    operator,
    distanceKm,
    durationMinutes,
    fareAmount,
    stopIds,
  } = req.body;
  if (
    !name ||
    !vehicleName ||
    distanceKm == null ||
    durationMinutes == null ||
    !Array.isArray(stopIds) ||
    stopIds.length < 2
  ) {
    return res.status(400).json({
      error:
        "name, vehicleName, distanceKm, durationMinutes, and at least two stopIds (in travel order) are required.",
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [routeResult] = await conn.query(
      "INSERT INTO routes (name, vehicle_name, operator, distance_km, duration_minutes) VALUES (?, ?, ?, ?, ?)",
      [
        name.trim(),
        vehicleName.trim(),
        operator || null,
        distanceKm,
        durationMinutes,
      ],
    );
    const routeId = routeResult.insertId;

    for (let i = 0; i < stopIds.length; i++) {
      await conn.query(
        "INSERT INTO route_stops (route_id, stop_id, stop_order) VALUES (?, ?, ?)",
        [routeId, stopIds[i], i + 1],
      );
    }

    if (fareAmount != null) {
      await conn.query(
        "INSERT INTO fares (route_id, fare_amount) VALUES (?, ?)",
        [routeId, fareAmount],
      );
    }

    await conn.commit();
    res
      .status(201)
      .json({
        id: routeId,
        message: "Route created and immediately searchable.",
      });
  } catch (err) {
    await conn.rollback();
    console.error("Create route error:", err);
    res.status(500).json({ error: "Could not create route." });
  } finally {
    conn.release();
  }
});

router.put("/routes/:id", async (req, res) => {
  const {
    name,
    vehicleName,
    operator,
    distanceKm,
    durationMinutes,
    isActive,
    fareAmount,
    stopIds,
  } = req.body;
  const routeId = req.params.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE routes SET
         name = COALESCE(?, name),
         vehicle_name = COALESCE(?, vehicle_name),
         operator = COALESCE(?, operator),
         distance_km = COALESCE(?, distance_km),
         duration_minutes = COALESCE(?, duration_minutes),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        name,
        vehicleName,
        operator,
        distanceKm,
        durationMinutes,
        isActive,
        routeId,
      ],
    );

    if (Array.isArray(stopIds) && stopIds.length >= 2) {
      await conn.query("DELETE FROM route_stops WHERE route_id = ?", [routeId]);
      for (let i = 0; i < stopIds.length; i++) {
        await conn.query(
          "INSERT INTO route_stops (route_id, stop_id, stop_order) VALUES (?, ?, ?)",
          [routeId, stopIds[i], i + 1],
        );
      }
    }

    if (fareAmount != null) {
      await conn.query(
        `INSERT INTO fares (route_id, fare_amount) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE fare_amount = VALUES(fare_amount)`,
        [routeId, fareAmount],
      );
    }

    await conn.commit();
    res.json({ message: "Route updated." });
  } catch (err) {
    await conn.rollback();
    console.error("Update route error:", err);
    res.status(500).json({ error: "Could not update route." });
  } finally {
    conn.release();
  }
});

router.delete("/routes/:id", async (req, res) => {
  await pool.query("DELETE FROM routes WHERE id = ?", [req.params.id]);
  res.json({ message: "Route deleted." });
});

/* ---------------- Feedback review ---------------- */

router.get("/feedback", async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT f.*, r.name AS route_name FROM feedback f
     LEFT JOIN routes r ON r.id = f.route_id
     ORDER BY f.created_at DESC`,
  );
  res.json({ feedback: rows });
});

router.patch("/feedback/:id", async (req, res) => {
  const { status } = req.body;
  if (!["new", "reviewed", "resolved"].includes(status)) {
    return res
      .status(400)
      .json({ error: "status must be new, reviewed, or resolved." });
  }
  await pool.query("UPDATE feedback SET status = ? WHERE id = ?", [
    status,
    req.params.id,
  ]);
  res.json({ message: "Feedback updated." });
});

module.exports = router;
