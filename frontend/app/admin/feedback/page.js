'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
};

const STATUS_LABELS = {
  new: '🆕 New',
  reviewed: '👀 Reviewed',
  resolved: '✅ Resolved',
};

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  useEffect(() => {
    if (!token) {
      setError('Not authenticated. Please login first.');
      setLoading(false);
      return;
    }

    fetchFeedback();
    const interval = setInterval(fetchFeedback, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [token]);

  const fetchFeedback = async () => {
    if (!token) return;
    try {
      const data = await api.getAdminFeedback(token);
      setFeedback(data.feedback || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (feedbackId, newStatus) => {
    if (!token) return;

    try {
      await api.updateFeedbackStatus(token, feedbackId, newStatus);

      // Update local state
      setFeedback(
        feedback.map((item) =>
          item.id === feedbackId ? { ...item, status: newStatus } : item
        )
      );

      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update feedback status:', err);
      alert('Failed to update feedback status');
    }
  };

  // Filter and sort feedback
  const filteredFeedback = feedback
    .filter((item) => (filterStatus === 'all' ? true : item.status === filterStatus))
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

  if (!token) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Please login as admin first</p>
        <a href="/admin/login" className="text-blue-500 underline">
          Go to Admin Login
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p>Loading feedback...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: feedback.length,
    new: feedback.filter((f) => f.status === 'new').length,
    reviewed: feedback.filter((f) => f.status === 'reviewed').length,
    resolved: feedback.filter((f) => f.status === 'resolved').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 User Feedback Management</h1>
          <p className="text-gray-600">
            Review and manage feedback from RouteWay users
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Feedback</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600">{stats.new}</div>
            <div className="text-sm text-blue-700">🆕 New</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-yellow-600">{stats.reviewed}</div>
            <div className="text-sm text-yellow-700">👀 Reviewed</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-green-700">✅ Resolved</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Feedback</option>
                <option value="new">New Only</option>
                <option value="reviewed">Reviewed Only</option>
                <option value="resolved">Resolved Only</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="status">By Status</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchFeedback}
                className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredFeedback.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredFeedback.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* User Information */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-sm font-semibold text-blue-600">
                          👤 {item.user_name}
                        </div>
                        <span className="text-xs text-gray-500">•</span>
                        <a href={`mailto:${item.user_email}`} className="text-xs text-blue-500 hover:underline truncate">
                          {item.user_email}
                        </a>
                        {item.user_contact && (
                          <>
                            <span className="text-xs text-gray-500">•</span>
                            <a href={`tel:${item.user_contact}`} className="text-xs text-blue-500 hover:underline">
                              {item.user_contact}
                            </a>
                          </>
                        )}
                      </div>

                      {/* Route Info */}
                      <div className="flex items-center gap-2 mb-2">
                        {item.route_name && (
                          <span className="text-sm font-semibold text-orange-600">
                            Route: {item.route_name}
                          </span>
                        )}
                        {item.from_stop && item.to_stop && (
                          <span className="text-sm text-gray-600">
                            {item.from_stop} → {item.to_stop}
                          </span>
                        )}
                      </div>

                      {/* Message Preview */}
                      <p className="text-gray-800 mb-2 line-clamp-2">{item.message}</p>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>📅 {new Date(item.created_at).toLocaleDateString()}</span>
                        <span>⏰ {new Date(item.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          STATUS_COLORS[item.status]
                        }`}
                      >
                        {STATUS_LABELS[item.status]}
                      </span>

                      {/* View Details Button */}
                      <button
                        onClick={() => {
                          setSelectedFeedback(item);
                          setShowDetails(true);
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {filterStatus === 'all'
                ? 'No feedback yet'
                : `No ${filterStatus} feedback`}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Feedback Details</h2>
                <p className="text-blue-100 text-sm mt-1">
                  {new Date(selectedFeedback.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedFeedback(null);
                }}
                className="text-2xl hover:text-blue-200"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* User Contact Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">👤 User Information</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <div>
                    <strong>Name:</strong> {selectedFeedback.user_name}
                  </div>
                  <div>
                    <strong>Email:</strong> 
                    <a href={`mailto:${selectedFeedback.user_email}`} className="text-blue-600 hover:underline ml-1">
                      {selectedFeedback.user_email}
                    </a>
                  </div>
                  {selectedFeedback.user_contact && (
                    <div>
                      <strong>Phone:</strong> 
                      <a href={`tel:${selectedFeedback.user_contact}`} className="text-blue-600 hover:underline ml-1">
                        {selectedFeedback.user_contact}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Route Context */}
              {(selectedFeedback.route_name ||
                selectedFeedback.from_stop ||
                selectedFeedback.to_stop) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">📍 Route Information</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    {selectedFeedback.route_name && (
                      <div>
                        <strong>Route:</strong> {selectedFeedback.route_name}
                      </div>
                    )}
                    {selectedFeedback.from_stop && (
                      <div>
                        <strong>From:</strong> {selectedFeedback.from_stop}
                      </div>
                    )}
                    {selectedFeedback.to_stop && (
                      <div>
                        <strong>To:</strong> {selectedFeedback.to_stop}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Feedback Message */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">💬 Feedback Message</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 whitespace-pre-wrap">
                  {selectedFeedback.message}
                </div>
              </div>

              {/* Current Status */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📊 Current Status</h3>
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                    STATUS_COLORS[selectedFeedback.status]
                  }`}
                >
                  {STATUS_LABELS[selectedFeedback.status]}
                </span>
              </div>

              {/* Status Update Actions */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">🔄 Update Status</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleStatusChange(selectedFeedback.id, 'new')}
                    disabled={selectedFeedback.status === 'new'}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    🆕 Mark as New
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedFeedback.id, 'reviewed')}
                    disabled={selectedFeedback.status === 'reviewed'}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    👀 Mark Reviewed
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedFeedback.id, 'resolved')}
                    disabled={selectedFeedback.status === 'resolved'}
                    className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    ✅ Mark Resolved
                  </button>
                </div>
              </div>

              {/* Meta Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
                <div>Feedback ID: #{selectedFeedback.id}</div>
                <div>Submitted: {new Date(selectedFeedback.created_at).toLocaleString()}</div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end">
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedFeedback(null);
                }}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium"
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
