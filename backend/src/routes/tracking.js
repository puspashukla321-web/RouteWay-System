const express = require("express");
const pool = require("../config/db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

/* ============ PUBLIC: Get live bus locations for a route ============ */

// GET /api/tracking/:routeId
// Returns current location of all buses on a specific route
router.get("/:routeId", async (req, res) => {
  try {
    const { routeId } = req.params;

    const [buses] = await pool.query(
      `SELECT 
        bl.id,
        bl.bus_id,
        bl.latitude,
        bl.longitude,
        bl.speed_kmh,
        bl.heading,
        bl.updated_at,
        r.name AS route_name,
        r.vehicle_name
       FROM bus_locations bl
       JOIN routes r ON r.id = bl.route_id
       WHERE bl.route_id = ?
       AND bl.updated_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`,
      [routeId],
    );

    res.json({ 
      route_id: routeId,
      buses: buses.map(bus => ({
        ...bus,
        updated_at: new Date(bus.updated_at).toISOString()
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bus locations" });
  }
});

// GET /api/tracking/route/:routeId/stops
// Get all stops for a route with their GPS coordinates
router.get("/route/:routeId/stops", async (req, res) => {
  try {
    const { routeId } = req.params;

    const [stops] = await pool.query(
      `SELECT 
        s.id,
        s.name,
        s.latitude,
        s.longitude,
        rs.stop_order,
        rs.eta_minutes_from_start
       FROM route_stops rs
       JOIN stops s ON s.id = rs.stop_id
       WHERE rs.route_id = ?
       ORDER BY rs.stop_order ASC`,
      [routeId],
    );

    res.json({ stops });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stops" });
  }
});

/* ============ ADMIN: Update bus location (real-time tracking) ============ */

// POST /api/admin/tracking/update
// Admin/GPS device sends updated bus location
router.post("/update", requireAdmin, async (req, res) => {
  try {
    const { route_id, bus_id, latitude, longitude, speed_kmh, heading } = req.body;

    if (!route_id || !bus_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        error: "Missing required fields: route_id, bus_id, latitude, longitude" 
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: "Invalid GPS coordinates" });
    }

    // Check if route exists
    const [[routeExists]] = await pool.query(
      "SELECT id FROM routes WHERE id = ?",
      [route_id]
    );

    if (!routeExists) {
      return res.status(404).json({ error: "Route not found" });
    }

    // Insert or update bus location
    const [result] = await pool.query(
      `INSERT INTO bus_locations (route_id, bus_id, latitude, longitude, speed_kmh, heading)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         latitude = VALUES(latitude),
         longitude = VALUES(longitude),
         speed_kmh = VALUES(speed_kmh),
         heading = VALUES(heading),
         updated_at = CURRENT_TIMESTAMP`,
      [route_id, bus_id, latitude, longitude, speed_kmh || null, heading || null]
    );

    res.json({ 
      message: "Bus location updated",
      bus_id,
      route_id,
      location: { latitude, longitude, speed_kmh, heading }
    });
  } catch (err) {
    console.error("Error updating bus location:", err);
    res.status(500).json({ error: "Failed to update bus location" });
  }
});

// Add unique constraint for bus_id per route
router.post("/update", async (req, res) => {
  // This route handler is for adding the constraint during setup
  // Can be called once to ensure database integrity
  try {
    await pool.query(`
      ALTER TABLE bus_locations 
      ADD UNIQUE KEY unique_route_bus (route_id, bus_id)
    `).catch(() => {}); // Ignore if already exists
    
    res.json({ message: "Constraint added" });
  } catch (err) {
    res.json({ message: "Constraint already exists or skipped" });
  }
});

/* ============ ADMIN: Get all bus locations ============ */

// GET /api/admin/tracking/all
// Admin dashboard: see all buses across all routes
router.get("/admin/all", requireAdmin, async (req, res) => {
  try {
    const [buses] = await pool.query(
      `SELECT 
        bl.id,
        bl.bus_id,
        bl.latitude,
        bl.longitude,
        bl.speed_kmh,
        bl.heading,
        bl.updated_at,
        r.id AS route_id,
        r.name AS route_name,
        r.vehicle_name
       FROM bus_locations bl
       JOIN routes r ON r.id = bl.route_id
       WHERE bl.updated_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
       ORDER BY r.id, bl.updated_at DESC`,
    );

    res.json({ buses: buses.map(bus => ({
      ...bus,
      updated_at: new Date(bus.updated_at).toISOString()
    })) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bus locations" });
  }
});

/* ============ ADMIN: Delete old bus locations ============ */

// DELETE /api/admin/tracking/cleanup
// Remove bus locations older than 24 hours
router.delete("/cleanup", requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM bus_locations 
       WHERE updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    res.json({ 
      message: "Old bus locations cleaned up",
      deleted_count: result.affectedRows
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to cleanup old locations" });
  }
});

module.exports = router;
