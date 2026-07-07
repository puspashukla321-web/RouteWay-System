"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import ThemeToggle from "../components/ThemeToggle";
import RouteScene from "../components/RouteScene";

export default function HomePage() {
  const [stops, setStops] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getStops()
      .then((d) => setStops(d.stops))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setResultsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    if (!from || !to) {
      setError('Pick both a "From" and a "To" stop.');
      return;
    }
    if (from === to) {
      setError('"From" and "To" must be different stops.');
      return;
    }
    setLoading(true);
    setResults(null);
    setResultsOpen(false);
    try {
      const data = await api.searchRoutes(from, to);
      setResults(data.results);
      setResultsOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function closeResults() {
    setResultsOpen(false);
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">R</span>
          RouteWay
        </div>
        <div className="topbar-actions">
          <ThemeToggle />
          <a className="nav-link" href="/admin">
            Admin
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              Kathmandu Valley · Public Transport
            </div>
            <h1>Find the right route, at a glance.</h1>
            <p>
              RouteWay presents transport search in a clean, public-sector
              style: route, fare, distance, duration, and the full stop sequence
              in one view.
            </p>

            <div className="hero-highlights" aria-label="Key platform benefits">
              <span className="hero-chip">Fare-aware search</span>
              <span className="hero-chip">Distance + duration</span>
              <span className="hero-chip">Admin-managed data</span>
            </div>

            <div className="hero-metrics">
              <div className="stat-card">
                <span className="stat-label">Search mode</span>
                <span className="stat-value">Route-to-route</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Presentation style</span>
                <span className="stat-value">Clean and formal</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Theme support</span>
                <span className="stat-value">Light and dark</span>
              </div>
            </div>

            <form className="search-card" onSubmit={handleSearch}>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="from">From</label>
                  <input
                    id="from"
                    list="stop-options"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder="e.g. Ratnapark"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="button"
                  className="swap-btn"
                  onClick={swap}
                  aria-label="Swap stops"
                  title="Swap"
                >
                  ⇅
                </button>
                <div className="field">
                  <label htmlFor="to">To</label>
                  <input
                    id="to"
                    list="stop-options"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="e.g. Koteshwor"
                    autoComplete="off"
                  />
                </div>
              </div>

              <datalist id="stop-options">
                {stops.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>

              {error && <div className="error-banner">{error}</div>}

              <button className="search-btn" type="submit" disabled={loading}>
                {loading ? "Searching…" : "Search routes"}
              </button>
            </form>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <RouteScene />
            <div className="hero-visual-caption">
              <span className="hero-visual-kicker">Featured corridor</span>
              <strong>Route 5 · Ratnapark → Koteshwor</strong>
              <span>Animated route concept for the public landing page</span>
            </div>
          </div>
        </div>

        <div
          className="overview-strip"
          aria-label="RouteWay overview highlights"
        >
          <div className="overview-card">
            <span className="overview-label">Live route intelligence</span>
            <strong>Stops, fare, distance, and duration in one view</strong>
            <p>
              Designed for quick public use and clean government-style
              presentation.
            </p>
          </div>
          <div className="overview-card">
            <span className="overview-label">Admin control</span>
            <strong>Officials can update routes without changing the UI</strong>
            <p>
              All public content is powered by the backend database and admin
              panel.
            </p>
          </div>
          <div className="overview-card">
            <span className="overview-label">Accessible design</span>
            <strong>High contrast, responsive, and theme-aware</strong>
            <p>
              Built to look polished on desktop presentation screens and mobile
              devices.
            </p>
          </div>
        </div>
      </section>

      {resultsOpen && results && (
        <div className="results-modal-backdrop" onClick={closeResults} role="presentation">
          <div
            className="results-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Search results"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="results-modal-header">
              <div>
                <span className="results-modal-kicker">Search results</span>
                <h2>
                  {from} to {to}
                </h2>
                <p>
                  {results.length > 0
                    ? `${results.length} route${results.length > 1 ? "s" : ""} found.`
                    : "No direct route found. Try different stops or check back later."}
                </p>
              </div>
              <button className="results-modal-close" type="button" onClick={closeResults} aria-label="Close results modal">
                ×
              </button>
            </div>

            <div className="results-modal-body">
              {results.length === 0 ? (
                <div className="results-empty results-empty-modal">
                  No direct route found from {from} to {to} yet. Try different stops, or check back
                  once an admin adds it.
                </div>
              ) : (
                results.map((r) => <RouteCard key={r.routeId} route={r} from={from} to={to} />)
              )}
            </div>
          </div>
        </div>
      )}

      <section className="showcase-band">
        <div className="showcase-header">
          <span className="hero-eyebrow">System snapshot</span>
          <h2>Built to feel credible in a national presentation.</h2>
          <p>
            The landing page keeps the route search as the core task, while the
            supporting layout gives the project enough visual weight and
            structure for formal demonstration.
          </p>
        </div>

        <div className="showcase-grid">
          <div className="showcase-panel">
            <span className="showcase-kicker">Design language</span>
            <strong>Editorial, transport-themed, and restrained</strong>
            <p>
              Dark road scene, formal typography, and clear data cards create a
              serious tone.
            </p>
          </div>
          <div className="showcase-panel">
            <span className="showcase-kicker">User flow</span>
            <strong>Search first, details second, feedback last</strong>
            <p>
              Users get answers immediately without being overwhelmed by
              secondary actions.
            </p>
          </div>
          <div className="showcase-panel">
            <span className="showcase-kicker">Motion</span>
            <strong>Subtle vehicle animation without visual noise</strong>
            <p>
              The road scene adds life while keeping the interface professional
              and legible.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function RouteCard({ route, from, to }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function submitFeedback(e) {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      await api.sendFeedback({
        routeId: route.routeId,
        fromStop: from,
        toStop: to,
        message,
      });
      setSent(true);
      setMessage("");
    } catch {
      // fail quietly in the card, feedback isn't critical path
    }
  }

  return (
    <div className="route-card">
      <div className="route-card-top">
        <div>
          <h3 className="route-name">
            {route.routeName} — {route.vehicleName}
          </h3>
          {route.operator && (
            <div className="route-operator">{route.operator}</div>
          )}
        </div>
        <div className="fare-badge">
          <span className="label">Fare</span>
          <span className="amount">
            {route.fare != null
              ? `${route.currency} ${route.fare.toFixed(2)}`
              : "N/A"}
          </span>
        </div>
      </div>

      <div className="route-metrics">
        <div className="metric-pill">
          <span className="metric-label">Distance</span>
          <span className="metric-value">
            {route.distanceKm != null
              ? `${route.distanceKm.toFixed(1)} km`
              : "N/A"}
          </span>
        </div>
        <div className="metric-pill">
          <span className="metric-label">Duration</span>
          <span className="metric-value">
            {route.durationMinutes != null
              ? `${route.durationMinutes} min`
              : "N/A"}
          </span>
        </div>
      </div>

      {route.estimatedMinutes != null && (
        <div className="eta">
          ~{route.estimatedMinutes} min from {from} to {to}
        </div>
      )}

      <div className="stop-line">
        {route.stops.map((stop) => (
          <div
            key={stop}
            className={`stop-node ${stop === from || stop === to ? "active" : ""}`}
          >
            <span className="stop-dot" />
            <span className="stop-label">{stop}</span>
          </div>
        ))}
      </div>

      {!sent ? (
        <>
          <button
            className="feedback-toggle"
            onClick={() => setShowFeedback((s) => !s)}
          >
            {showFeedback ? "Cancel" : "Something wrong with this info?"}
          </button>
          {showFeedback && (
            <form className="feedback-form" onSubmit={submitFeedback}>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. this fare is outdated"
              />
              <button type="submit">Send</button>
            </form>
          )}
        </>
      ) : (
        <div className="feedback-toggle" style={{ textDecoration: "none" }}>
          Thanks — we'll take a look.
        </div>
      )}
    </div>
  );
}
