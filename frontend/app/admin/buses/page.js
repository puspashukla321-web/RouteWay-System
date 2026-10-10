'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';

export default function AdminBusManagementPage() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showAddBusForm, setShowAddBusForm] = useState(false);
  const [formData, setFormData] = useState({
    route_id: '',
    bus_id: '',
    start_latitude: '',
    start_longitude: '',
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  // Fetch routes and buses
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('Not authenticated. Please login first.');
        setLoading(false);
        return;
      }

      try {
        // Fetch routes
        const routesRes = await fetch(`${API_BASE_URL}/admin/routes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (routesRes.ok) {
          const routesData = await routesRes.json();
          setRoutes(routesData.routes || []);
        }

        // Fetch buses
        const busesRes = await fetch(`${API_BASE_URL}/admin/tracking/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (busesRes.ok) {
          const busesData = await busesRes.json();
          setBuses(busesData.buses || []);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load buses and routes');
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
      const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleAddBus = async (e) => {
    e.preventDefault();

    if (!formData.route_id || !formData.bus_id) {
      alert('Route and Bus ID are required');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/buses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('Bus registered successfully');
        setFormData({ route_id: '', bus_id: '', start_latitude: '', start_longitude: '' });
        setShowAddBusForm(false);
        // Refresh buses list
        const busesRes = await fetch(`${API_BASE_URL}/admin/tracking/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const busesData = await busesRes.json();
        setBuses(busesData.buses || []);
      } else {
        alert('Failed to register bus');
      }
    } catch (err) {
      console.error('Error registering bus:', err);
      alert('Error registering bus');
    }
  };

  const handleRemoveBus = async (busId, routeId) => {
    if (!confirm(`Remove bus ${busId}?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/buses/${busId}?route_id=${routeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('Bus removed successfully');
        setBuses(buses.filter(b => b.bus_id !== busId));
      } else {
        alert('Failed to remove bus');
      }
    } catch (err) {
      console.error('Error removing bus:', err);
      alert('Error removing bus');
    }
  };

  if (!token) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">Please login as admin first</div>
        <a href="/admin/login" className="text-blue-500 underline">
          Go to Admin Login
        </a>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const filteredBuses = selectedRoute
    ? buses.filter(b => b.route_id === parseInt(selectedRoute))
    : buses;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          🚌 Bus Management Dashboard
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Add Bus Form */}
        {showAddBusForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold mb-4">Register New Bus</h2>
            <form onSubmit={handleAddBus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route
                </label>
                <select
                  value={formData.route_id}
                  onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select a route</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>
                      {route.name} - {route.vehicle_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bus ID
                </label>
                <input
                  type="text"
                  value={formData.bus_id}
                  onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                  placeholder="e.g., BUS-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starting Latitude (optional)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.start_latitude}
                    onChange={(e) => setFormData({ ...formData, start_latitude: e.target.value })}
                    placeholder="e.g., 27.7172"
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starting Longitude (optional)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.start_longitude}
                    onChange={(e) => setFormData({ ...formData, start_longitude: e.target.value })}
                    placeholder="e.g., 85.3240"
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Register Bus
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBusForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!showAddBusForm && (
          <button
            onClick={() => setShowAddBusForm(true)}
            className="mb-8 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Register New Bus
          </button>
        )}

        {/* Filter by Route */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Route
          </label>
          <select
            value={selectedRoute || ''}
            onChange={(e) => setSelectedRoute(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded"
          >
            <option value="">All Routes</option>
            {routes.map(route => (
              <option key={route.id} value={route.id}>
                {route.name} - {route.vehicle_name}
              </option>
            ))}
          </select>
        </div>

        {/* Buses List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-xl font-bold">
              Active Buses ({filteredBuses.length})
            </h2>
          </div>

          {filteredBuses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bus ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Route</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Speed</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Last Updated</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuses.map((bus) => (
                    <tr key={bus.bus_id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{bus.bus_id}</td>
                      <td className="px-6 py-4 text-gray-600">{bus.route_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {bus.speed_kmh || '-'} km/h
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(bus.updated_at).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRemoveBus(bus.bus_id, bus.route_id)}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No buses registered yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
