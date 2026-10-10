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

  function goHome() {
    router.push("/");
  }

  if (!token) return null;

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand" onClick={goHome} style={{ cursor: "pointer" }}>
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
  const [editingId, setEditingId] = useState(null);
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

  async function editRoute(route) {
    // Load full route details including stops
    const fullRoute = await api.getAdminRoute(token, route.id);
    setForm({
      name: fullRoute.name || "",
      vehicleName: fullRoute.vehicle_name || "",
      operator: fullRoute.operator || "",
      distanceKm: fullRoute.distance_km || "",
      durationMinutes: fullRoute.duration_minutes || "",
      fareAmount: fullRoute.fare?.fare_amount || "",
      stopIds: fullRoute.stops.map((s) => s.stop_id),
    });
    setEditingId(route.id);
    setError("");
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      name: "",
      vehicleName: "",
      operator: "",
      distanceKm: "",
      durationMinutes: "",
      fareAmount: "",
      stopIds: [],
    });
    setError("");
  }

  async function submitRoute(e) {
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
      if (editingId) {
        // Update existing route
        await api.updateRoute(token, editingId, {
          name: form.name,
          vehicleName: form.vehicleName,
          operator: form.operator || null,
          distanceKm: Number(form.distanceKm),
          durationMinutes: Number(form.durationMinutes),
          fareAmount: form.fareAmount ? Number(form.fareAmount) : null,
          stopIds: form.stopIds,
        });
      } else {
        // Create new route
        await api.createRoute(token, {
          name: form.name,
          vehicleName: form.vehicleName,
          operator: form.operator || null,
          distanceKm: Number(form.distanceKm),
          durationMinutes: Number(form.durationMinutes),
          fareAmount: form.fareAmount ? Number(form.fareAmount) : null,
          stopIds: form.stopIds,
        });
      }
      cancelEdit();
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
        {editingId ? "Edit route" : "Add a route"}
      </h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: -8 }}>
        Click stops below in the order the vehicle actually travels them — order
        determines direction.
      </p>

      <form onSubmit={submitRoute}>
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
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : editingId ? "Update route" : "Create route"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
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
                  className="btn"
                  onClick={() => editRoute(r)}
                  style={{ marginRight: 8, borderColor: "#22c55e", color: "#22c55e" }}
                >
                  Edit
                </button>
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const load = useCallback(async () => {
    const d = await api.getAdminFeedback(token);
    setItems(d.feedback);
  }, [token]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [load]);

  async function setStatus(id, status) {
    await api.updateFeedbackStatus(token, id, status);
    load();
  }

  const filteredItems = filterStatus === 'all' 
    ? items 
    : items.filter(f => f.status === filterStatus);

  const stats = {
    total: items.length,
    new: items.filter(f => f.status === 'new').length,
    reviewed: items.filter(f => f.status === 'reviewed').length,
    resolved: items.filter(f => f.status === 'resolved').length,
  };

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
        Commuter feedback
      </h2>

      {/* Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
        gap: 12, 
        marginBottom: 16 
      }}>
        <div style={{ 
          padding: 12, 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: 6, 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Total</div>
        </div>
        <div style={{ 
          padding: 12, 
          backgroundColor: '#e3f2fd', 
          borderRadius: 6, 
          textAlign: 'center',
          color: '#1976d2'
        }}>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.new}</div>
          <div style={{ fontSize: 12 }}>New</div>
        </div>
        <div style={{ 
          padding: 12, 
          backgroundColor: '#fff3e0', 
          borderRadius: 6, 
          textAlign: 'center',
          color: '#f57c00'
        }}>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.reviewed}</div>
          <div style={{ fontSize: 12 }}>Reviewed</div>
        </div>
        <div style={{ 
          padding: 12, 
          backgroundColor: '#e8f5e9', 
          borderRadius: 6, 
          textAlign: 'center',
          color: '#388e3c'
        }}>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.resolved}</div>
          <div style={{ fontSize: 12 }}>Resolved</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 16 }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            fontFamily: 'inherit',
            fontSize: 14
          }}
        >
          <option value="all">All Feedback ({stats.total})</option>
          <option value="new">New Only ({stats.new})</option>
          <option value="reviewed">Reviewed Only ({stats.reviewed})</option>
          <option value="resolved">Resolved Only ({stats.resolved})</option>
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Route</th>
            <th>From → To</th>
            <th>Message</th>
            <th>Date</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((f) => (
            <tr key={f.id}>
              <td style={{ fontWeight: 600, color: '#1976d2' }}>
                <div>{f.user_name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 'normal' }}>
                  {f.user_email}
                </div>
                {f.user_contact && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 'normal' }}>
                    {f.user_contact}
                  </div>
                )}
              </td>
              <td>{f.route_name || "—"}</td>
              <td style={{ fontSize: 12 }}>
                {f.from_stop || "?"} → {f.to_stop || "?"}
              </td>
              <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.message}
              </td>
              <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                {new Date(f.created_at).toLocaleDateString()}
              </td>
              <td>
                <select
                  value={f.status}
                  onChange={(e) => setStatus(f.id, e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border-color)',
                    fontSize: 12,
                    fontFamily: 'inherit',
                    backgroundColor: f.status === 'new' ? '#e3f2fd' : 
                                    f.status === 'reviewed' ? '#fff3e0' : '#e8f5e9',
                    color: f.status === 'new' ? '#1976d2' : 
                           f.status === 'reviewed' ? '#f57c00' : '#388e3c'
                  }}
                >
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </td>
              <td>
                <button
                  className="btn"
                  style={{ fontSize: 12, padding: '4px 8px' }}
                  onClick={() => {
                    setSelectedFeedback(f);
                    setShowDetails(true);
                  }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
          {filteredItems.length === 0 && (
            <tr>
              <td colSpan={7} style={{ color: "var(--muted)", textAlign: 'center', padding: '20px' }}>
                {filterStatus === 'all' ? 'No feedback yet.' : `No ${filterStatus} feedback.`}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Details Modal */}
      {showDetails && selectedFeedback && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 8,
            maxWidth: 600,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: 20,
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Feedback Details</h3>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedFeedback(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: 'var(--muted)'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 20, space: '16px' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {new Date(selectedFeedback.created_at).toLocaleString()}
                </div>
              </div>

              {/* User Information */}
              <div style={{
                padding: 12,
                backgroundColor: '#e3f2fd',
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 13
              }}>
                <strong style={{ color: '#1976d2' }}>👤 User Information:</strong><br/>
                <strong>Name:</strong> {selectedFeedback.user_name}<br/>
                <strong>Email:</strong> <a href={`mailto:${selectedFeedback.user_email}`} style={{ color: '#1976d2', textDecoration: 'underline' }}>{selectedFeedback.user_email}</a><br/>
                {selectedFeedback.user_contact && (
                  <>
                    <strong>Phone:</strong> <a href={`tel:${selectedFeedback.user_contact}`} style={{ color: '#1976d2', textDecoration: 'underline' }}>{selectedFeedback.user_contact}</a>
                  </>
                )}
              </div>

              {(selectedFeedback.route_name || selectedFeedback.from_stop || selectedFeedback.to_stop) && (
                <div style={{
                  padding: 12,
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 13
                }}>
                  <strong>Route:</strong> {selectedFeedback.route_name || 'N/A'}<br/>
                  <strong>From:</strong> {selectedFeedback.from_stop || 'N/A'}<br/>
                  <strong>To:</strong> {selectedFeedback.to_stop || 'N/A'}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <strong style={{ display: 'block', marginBottom: 8 }}>Message:</strong>
                <div style={{
                  padding: 12,
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 6,
                  fontSize: 13,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {selectedFeedback.message}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <strong style={{ display: 'block', marginBottom: 8 }}>Status:</strong>
                <select
                  value={selectedFeedback.status}
                  onChange={(e) => {
                    setStatus(selectedFeedback.id, e.target.value);
                    setSelectedFeedback({ ...selectedFeedback, status: e.target.value });
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    backgroundColor: selectedFeedback.status === 'new' ? '#e3f2fd' : 
                                    selectedFeedback.status === 'reviewed' ? '#fff3e0' : '#e8f5e9',
                    color: selectedFeedback.status === 'new' ? '#1976d2' : 
                           selectedFeedback.status === 'reviewed' ? '#f57c00' : '#388e3c'
                  }}
                >
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: 16,
              borderTop: '1px solid var(--border-color)',
              textAlign: 'right'
            }}>
              <button
                className="btn"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedFeedback(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
