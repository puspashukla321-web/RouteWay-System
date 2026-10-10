'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TrackingMap from '@/components/TrackingMap';
import { API_BASE_URL } from '@/lib/api';

export default function RouteTrackingPage({ params }) {
  const router = useRouter();
  const routeId = params.id;
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/search`);
        const data = await res.json();
        
        // Find the route (would need proper endpoint)
        setRoute({
          id: routeId,
          name: 'Route Details',
          vehicle_name: 'Bus',
          operator: 'Operator',
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch route:', err);
        setError('Could not load route details');
        setLoading(false);
      }
    };

    if (routeId) {
      fetchRoute();
    }
  }, [routeId]);

  if (loading) {
    return <div className="p-8 text-center">Loading route details...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          ← Back
        </button>

        {route && (
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h1 className="text-3xl font-bold text-gray-800">{route.name}</h1>
            <div className="mt-2 text-gray-600">
              <p><strong>Vehicle:</strong> {route.vehicle_name}</p>
              <p><strong>Operator:</strong> {route.operator}</p>
            </div>
          </div>
        )}

        <TrackingMap routeId={routeId} />
      </div>
    </div>
  );
}
