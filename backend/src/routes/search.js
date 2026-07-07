const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET /api/search?from=Ratnapark&to=Koteshwor
router.get("/", async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res
      .status(400)
      .json({ error: 'Both "from" and "to" query params are required.' });
  }
  if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
    return res
      .status(400)
      .json({ error: '"from" and "to" must be different stops.' });
  }

  try {
    // Find every active route where `from` appears earlier (lower stop_order)
    // than `to`, i.e. the direction actually matches what the user asked for.
    const [matches] = await pool.query(
      `SELECT
         r.id AS route_id,
         r.name AS route_name,
         r.vehicle_name,
         r.operator,
        r.distance_km,
        r.duration_minutes,
         f.fare_amount,
         f.currency,
         rs_from.stop_order AS from_order,
         rs_to.stop_order AS to_order
       FROM routes r
       JOIN route_stops rs_from ON rs_from.route_id = r.id
       JOIN stops s_from ON s_from.id = rs_from.stop_id
       JOIN route_stops rs_to ON rs_to.route_id = r.id
       JOIN stops s_to ON s_to.id = rs_to.stop_id
       LEFT JOIN fares f ON f.route_id = r.id
       WHERE r.is_active = TRUE
         AND s_from.name = ?
         AND s_to.name = ?
         AND rs_from.stop_order < rs_to.stop_order`,
      [from.trim(), to.trim()],
    );

    if (matches.length === 0) {
      return res.json({ from, to, results: [] });
    }

    // For each matching route, pull the full ordered stop sequence so the
    // frontend can render the whole path, not just the two endpoints.
    const results = await Promise.all(
      matches.map(async (m) => {
        const [stops] = await pool.query(
          `SELECT s.name, rs.stop_order, rs.eta_minutes_from_start
           FROM route_stops rs
           JOIN stops s ON s.id = rs.stop_id
           WHERE rs.route_id = ?
           ORDER BY rs.stop_order ASC`,
          [m.route_id],
        );

        const fromEta =
          stops.find((s) => s.stop_order === m.from_order)
            ?.eta_minutes_from_start ?? null;
        const toEta =
          stops.find((s) => s.stop_order === m.to_order)
            ?.eta_minutes_from_start ?? null;
        const estimatedMinutes =
          fromEta != null && toEta != null ? toEta - fromEta : null;

        return {
          routeId: m.route_id,
          routeName: m.route_name,
          vehicleName: m.vehicle_name,
          operator: m.operator,
          distanceKm: m.distance_km != null ? Number(m.distance_km) : null,
          durationMinutes:
            m.duration_minutes != null ? Number(m.duration_minutes) : null,
          fare: m.fare_amount != null ? Number(m.fare_amount) : null,
          currency: m.currency || "NPR",
          estimatedMinutes,
          stops: stops.map((s) => s.name),
        };
      }),
    );

    res.json({ from, to, results });
  } catch (err) {
    console.error("Search error:", err);
    res
      .status(500)
      .json({ error: "Something went wrong while searching for routes." });
  }
});

// GET /api/search/stops - used to populate From/To autocomplete
router.get("/stops", async (_req, res) => {
  try {
    const [stops] = await pool.query(
      "SELECT id, name FROM stops ORDER BY name ASC",
    );
    res.json({ stops });
  } catch (err) {
    console.error("Stops fetch error:", err);
    res.status(500).json({ error: "Could not load stops." });
  }
});

module.exports = router;
