"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import ThemeToggle from "../../../components/ThemeToggle";

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState("");
  const [tab, setTab] = useState("routes");

  useEffect(() => {
    const t = localStorage.getItem("routeway_admin_token");
    if (!t) {
      router.push("/admin");
      return;
    }
    setToken(t);
    setUsername(localStorage.getItem("routeway_admin_username") || "");
  }, [router]);

  function logout() {
    localStorage.removeItem("routeway_admin_token");
    localStorage.removeItem("routeway_admin_username");
    router.push("/admin");
  }

  if (!token) return null;

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">R</span>
          RouteWay Admin
        </div>
        <div className="topbar-actions">
          <ThemeToggle />
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            {username}
          </span>
          <button className="nav-link" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <div className="admin-shell">
        <div className="admin-tabs">
          {["routes", "stops", "feedback"].map((t) => (
            <button
              key={t}
              className={`admin-tab ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "routes" && <RoutesPanel token={token} />}
        {tab === "stops" && <StopsPanel token={token} />}
        {tab === "feedback" && <FeedbackPanel token={token} />}
      </div>
    </div>
  );
}

/* ---------------- Routes panel ---------------- */

function RoutesPanel({ token }) {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [form, setForm] = useState({
    name: "",
    vehicleName: "",
    operator: "",
    distanceKm: "",
    durationMinutes: "",
    fareAmount: "",
    stopIds: [],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [r, s] = await Promise.all([
      api.getAdminRoutes(token),
      api.getAdminStops(token),
    ]);
    setRoutes(r.routes);
    setStops(s.stops);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleStop(id) {
    setForm((f) => {
      const exists = f.stopIds.includes(id);
      return {
        ...f,
        stopIds: exists
          ? f.stopIds.filter((x) => x !== id)
          : [...f.stopIds, id],
      };
    });
  }

  async function createRoute(e) {
    e.preventDefault();
    setError("");
    if (
      !form.name ||
      !form.vehicleName ||
      form.distanceKm === "" ||
      form.durationMinutes === "" ||
      form.stopIds.length < 2
    ) {
      setError(
        "Name, vehicle name, distance, duration, and at least two stops (in travel order) are required.",
      );
      return;
    }
    setSaving(true);
    try {
      await api.createRoute(token, {
        name: form.name,
        vehicleName: form.vehicleName,
        operator: form.operator || null,
        distanceKm: Number(form.distanceKm),
        durationMinutes: Number(form.durationMinutes),
        fareAmount: form.fareAmount ? Number(form.fareAmount) : null,
        stopIds: form.stopIds,
      });
      setForm({
        name: "",
        vehicleName: "",
        operator: "",
        distanceKm: "",
        durationMinutes: "",
        fareAmount: "",
        stopIds: [],
      });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeRoute(id) {
    if (!confirm("Delete this route? This cannot be undone.")) return;
    await api.deleteRoute(token, id);
    load();
  }

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
        Add a route
      </h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: -8 }}>
        Click stops below in the order the vehicle actually travels them — order
        determines direction.
      </p>

      <form onSubmit={createRoute}>
        <div className="form-grid">
          <div className="field">
            <label>Route name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Route 5"
            />
          </div>
          <div className="field">
            <label>Vehicle / operator name</label>
            <input
              value={form.vehicleName}
              onChange={(e) =>
                setForm({ ...form, vehicleName: e.target.value })
              }
              placeholder="Sajha Yatayat"
            />
          </div>
          <div className="field">
            <label>Operator (optional)</label>
            <input
              value={form.operator}
              onChange={(e) => setForm({ ...form, operator: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Distance (km)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.distanceKm}
              onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
              placeholder="8.3"
            />
          </div>
          <div className="field">
            <label>Duration (minutes)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({ ...form, durationMinutes: e.target.value })
              }
              placeholder="25"
            />
          </div>
          <div className="field">
            <label>Fare (NPR)</label>
            <input
              type="number"
              step="0.01"
              value={form.fareAmount}
              onChange={(e) => setForm({ ...form, fareAmount: e.target.value })}
            />
          </div>
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Stops in order ({form.stopIds.length} selected)</label>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}
          >
            {stops.map((s) => {
              const idx = form.stopIds.indexOf(s.id);
              return (
                <button
                  type="button"
                  key={s.id}
                  className="btn"
                  style={
                    idx >= 0
                      ? { borderColor: "var(--amber)", color: "var(--amber)" }
                      : {}
                  }
                  onClick={() => toggleStop(s.id)}
                >
                  {idx >= 0 ? `${idx + 1}. ` : ""}
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}
        <button className="btn primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Create route"}
        </button>
      </form>

      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          marginTop: 32,
        }}
      >
        Existing routes
      </h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Vehicle</th>
            <th>Distance</th>
            <th>Duration</th>
            <th>Fare</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {routes.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.vehicle_name}</td>
              <td>
                {r.distance_km != null
                  ? `${Number(r.distance_km).toFixed(1)} km`
                  : "—"}
              </td>
              <td>
                {r.duration_minutes != null ? `${r.duration_minutes} min` : "—"}
              </td>
              <td>
                {r.fare_amount != null
                  ? `${r.currency || "NPR"} ${Number(r.fare_amount).toFixed(2)}`
                  : "—"}
              </td>
              <td>{r.is_active ? "Active" : "Inactive"}</td>
              <td>
                <button
                  className="btn danger"
                  onClick={() => removeRoute(r.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {routes.length === 0 && (
            <tr>
              <td colSpan={7} style={{ color: "var(--muted)" }}>
                No routes yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Stops panel ---------------- */

function StopsPanel({ token }) {
  const [stops, setStops] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const d = await api.getAdminStops(token);
    setStops(d.stops);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function addStop(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return;
    try {
      await api.createStop(token, { name });
      setName("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeStop(id) {
    if (!confirm("Delete this stop? Any routes using it will lose that stop."))
      return;
    await api.deleteStop(token, id);
    load();
  }

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
        Add a stop
      </h2>
      <form
        onSubmit={addStop}
        className="feedback-form"
        style={{ maxWidth: 420 }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chabahil"
        />
        <button className="btn primary" type="submit">
          Add
        </button>
      </form>
      {error && (
        <div className="error-banner" style={{ marginTop: 12, maxWidth: 420 }}>
          {error}
        </div>
      )}

      <table className="table" style={{ marginTop: 24 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {stops.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>
                <button className="btn danger" onClick={() => removeStop(s.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Feedback panel ---------------- */

function FeedbackPanel({ token }) {
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    const d = await api.getAdminFeedback(token);
    setItems(d.feedback);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id, status) {
    await api.updateFeedbackStatus(token, id, status);
    load();
  }

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
        Commuter feedback
      </h2>
      <table className="table">
        <thead>
          <tr>
            <th>Route</th>
            <th>From → To</th>
            <th>Message</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((f) => (
            <tr key={f.id}>
              <td>{f.route_name || "—"}</td>
              <td>
                {f.from_stop || "?"} → {f.to_stop || "?"}
              </td>
              <td>{f.message}</td>
              <td>
                <span className={`pill ${f.status}`}>{f.status}</span>
              </td>
              <td>
                {f.status !== "resolved" && (
                  <button
                    className="btn"
                    onClick={() => setStatus(f.id, "resolved")}
                  >
                    Mark resolved
                  </button>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} style={{ color: "var(--muted)" }}>
                No feedback yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
